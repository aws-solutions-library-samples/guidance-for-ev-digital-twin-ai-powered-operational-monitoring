#!/bin/bash
set -e

# EV Digital Twin - AWS Deployment Script
# This script deploys the complete solution to AWS following the tested deployment process

# Configuration
AWS_REGION="us-east-1"
ECR_REPO="ev-digital-twin-backend"
IMAGE_TAG="latest"
FRONTEND_DIR="frontend/ev-digital-twin-tire-maintainence-system"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check Node.js and npm
    if ! command -v npm &> /dev/null; then
        log_error "Node.js/npm is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    log_success "All prerequisites met"
}

# Get AWS account ID
get_account_id() {
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    log_info "Using AWS Account: $AWS_ACCOUNT_ID"
}

# Create ECR repository if it doesn't exist
create_ecr_repo() {
    log_info "Creating ECR repository..."
    
    if aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION &> /dev/null; then
        log_warning "ECR repository $ECR_REPO already exists"
    else
        aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION
        log_success "ECR repository created"
    fi
}

# Build and push Docker image
build_and_push_image() {
    log_info "Building and pushing Docker image..."
    
    # Build the image
    docker build -t $ECR_REPO .
    
    # Tag for ECR
    docker tag $ECR_REPO:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Push to ECR
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG
    
    log_success "Docker image pushed to ECR"
}

# Create VPC and networking
create_vpc() {
    log_info "Creating VPC and networking..."
    
    # Create VPC
    VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text --region $AWS_REGION)
    aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=ev-digital-twin-vpc --region $AWS_REGION
    
    # Enable DNS hostnames
    aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames --region $AWS_REGION
    
    # Create Internet Gateway
    IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text --region $AWS_REGION)
    aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID --region $AWS_REGION
    aws ec2 create-tags --resources $IGW_ID --tags Key=Name,Value=ev-digital-twin-igw --region $AWS_REGION
    
    # Get availability zones
    AZ1=$(aws ec2 describe-availability-zones --query 'AvailabilityZones[0].ZoneName' --output text --region $AWS_REGION)
    AZ2=$(aws ec2 describe-availability-zones --query 'AvailabilityZones[1].ZoneName' --output text --region $AWS_REGION)
    
    # Create subnets
    SUBNET1_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone $AZ1 --query 'Subnet.SubnetId' --output text --region $AWS_REGION)
    SUBNET2_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone $AZ2 --query 'Subnet.SubnetId' --output text --region $AWS_REGION)
    
    aws ec2 create-tags --resources $SUBNET1_ID --tags Key=Name,Value=ev-digital-twin-subnet-1 --region $AWS_REGION
    aws ec2 create-tags --resources $SUBNET2_ID --tags Key=Name,Value=ev-digital-twin-subnet-2 --region $AWS_REGION
    
    # Enable auto-assign public IP
    aws ec2 modify-subnet-attribute --subnet-id $SUBNET1_ID --map-public-ip-on-launch --region $AWS_REGION
    aws ec2 modify-subnet-attribute --subnet-id $SUBNET2_ID --map-public-ip-on-launch --region $AWS_REGION
    
    # Create route table
    RT_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text --region $AWS_REGION)
    aws ec2 create-tags --resources $RT_ID --tags Key=Name,Value=ev-digital-twin-rt --region $AWS_REGION
    
    # Create route to internet gateway
    aws ec2 create-route --route-table-id $RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID --region $AWS_REGION
    
    # Associate subnets with route table
    aws ec2 associate-route-table --subnet-id $SUBNET1_ID --route-table-id $RT_ID --region $AWS_REGION
    aws ec2 associate-route-table --subnet-id $SUBNET2_ID --route-table-id $RT_ID --region $AWS_REGION
    
    log_success "VPC and networking created"
}

# Create security groups
create_security_groups() {
    log_info "Creating security groups..."
    
    # ALB Security Group
    ALB_SG_ID=$(aws ec2 create-security-group --group-name ev-digital-twin-alb-sg --description "Security group for ALB" --vpc-id $VPC_ID --query 'GroupId' --output text --region $AWS_REGION)
    aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $AWS_REGION
    
    # ECS Security Group
    ECS_SG_ID=$(aws ec2 create-security-group --group-name ev-digital-twin-ecs-sg --description "Security group for ECS" --vpc-id $VPC_ID --query 'GroupId' --output text --region $AWS_REGION)
    aws ec2 authorize-security-group-ingress --group-id $ECS_SG_ID --protocol tcp --port 8000 --source-group $ALB_SG_ID --region $AWS_REGION
    
    log_success "Security groups created"
}

# Create Application Load Balancer
create_alb() {
    log_info "Creating Application Load Balancer..."
    
    # Create ALB
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name ev-digital-twin-alb \
        --subnets $SUBNET1_ID $SUBNET2_ID \
        --security-groups $ALB_SG_ID \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text \
        --region $AWS_REGION)
    
    # Create target group
    TG_ARN=$(aws elbv2 create-target-group \
        --name ev-digital-twin-tg \
        --protocol HTTP \
        --port 8000 \
        --vpc-id $VPC_ID \
        --target-type ip \
        --health-check-path /health \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text \
        --region $AWS_REGION)
    
    # Create listener
    aws elbv2 create-listener \
        --load-balancer-arn $ALB_ARN \
        --protocol HTTP \
        --port 80 \
        --default-actions Type=forward,TargetGroupArn=$TG_ARN \
        --region $AWS_REGION
    
    # Get ALB DNS name
    ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text --region $AWS_REGION)
    
    log_success "Application Load Balancer created: $ALB_DNS"
}

# Create ECS cluster and service
create_ecs() {
    log_info "Creating ECS cluster and service..."
    
    # Create ECS cluster
    aws ecs create-cluster --cluster-name ev-digital-twin-cluster --region $AWS_REGION
    
    # Create IAM roles
    create_iam_roles
    
    # Create task definition
    cat > task-definition.json << EOF
{
    "family": "ev-digital-twin-task",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "1024",
    "memory": "2048",
    "executionRoleArn": "$EXECUTION_ROLE_ARN",
    "taskRoleArn": "$TASK_ROLE_ARN",
    "containerDefinitions": [
        {
            "name": "ev-digital-twin-backend",
            "image": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG",
            "portMappings": [
                {
                    "containerPort": 8000,
                    "protocol": "tcp"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/ev-digital-twin",
                    "awslogs-region": "$AWS_REGION",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "environment": [
                {
                    "name": "PORT",
                    "value": "8000"
                }
            ],
            "healthCheck": {
                "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60
            }
        }
    ]
}
EOF
    
    # Create CloudWatch log group
    aws logs create-log-group --log-group-name /ecs/ev-digital-twin --region $AWS_REGION || true
    
    # Register task definition
    aws ecs register-task-definition --cli-input-json file://task-definition.json --region $AWS_REGION
    
    # Create ECS service
    aws ecs create-service \
        --cluster ev-digital-twin-cluster \
        --service-name ev-digital-twin-service \
        --task-definition ev-digital-twin-task \
        --desired-count 2 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1_ID,$SUBNET2_ID],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
        --load-balancers "targetGroupArn=$TG_ARN,containerName=ev-digital-twin-backend,containerPort=8000" \
        --region $AWS_REGION
    
    # Clean up
    rm task-definition.json
    
    log_success "ECS cluster and service created"
}

# Create IAM roles
create_iam_roles() {
    log_info "Creating IAM roles..."
    
    # Execution role
    cat > execution-role-trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF
    
    aws iam create-role --role-name ev-digital-twin-execution-role --assume-role-policy-document file://execution-role-trust-policy.json || true
    aws iam attach-role-policy --role-name ev-digital-twin-execution-role --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    
    EXECUTION_ROLE_ARN=$(aws iam get-role --role-name ev-digital-twin-execution-role --query 'Role.Arn' --output text)
    
    # Task role
    aws iam create-role --role-name ev-digital-twin-task-role --assume-role-policy-document file://execution-role-trust-policy.json || true
    TASK_ROLE_ARN=$(aws iam get-role --role-name ev-digital-twin-task-role --query 'Role.Arn' --output text)
    
    # Clean up
    rm execution-role-trust-policy.json
    
    log_success "IAM roles created"
}

# Create S3 bucket for frontend
create_s3_bucket() {
    log_info "Creating S3 bucket for frontend..."
    
    BUCKET_NAME="ev-digital-twin-frontend-$AWS_ACCOUNT_ID-$AWS_REGION"
    
    # Create bucket
    if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
        aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION
        log_success "S3 bucket created: $BUCKET_NAME"
    else
        log_warning "S3 bucket already exists: $BUCKET_NAME"
    fi
    
    # Block public access
    aws s3api put-public-access-block \
        --bucket $BUCKET_NAME \
        --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
        --region $AWS_REGION
}

# Create CloudFront distribution
create_cloudfront() {
    log_info "Creating CloudFront distribution..."
    
    # Create Origin Access Control
    OAC_CONFIG=$(cat << EOF
{
    "Name": "ev-digital-twin-frontend-oac",
    "Description": "OAC for EV Digital Twin Frontend S3 bucket",
    "OriginAccessControlOriginType": "s3",
    "SigningBehavior": "always",
    "SigningProtocol": "sigv4"
}
EOF
)
    
    OAC_ID=$(aws cloudfront create-origin-access-control --origin-access-control-config "$OAC_CONFIG" --query 'OriginAccessControl.Id' --output text)
    
    # Create CloudFront distribution
    DISTRIBUTION_CONFIG=$(cat << EOF
{
    "CallerReference": "ev-digital-twin-frontend-$(date +%s)",
    "Comment": "CloudFront distribution for EV Digital Twin Frontend",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "ev-digital-twin-s3-origin",
                "DomainName": "$BUCKET_NAME.s3.$AWS_REGION.amazonaws.com",
                "OriginAccessControlId": "$OAC_ID",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "ev-digital-twin-s3-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
}
EOF
)
    
    DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config "$DISTRIBUTION_CONFIG" --query 'Distribution.Id' --output text)
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)
    
    # Create bucket policy
    BUCKET_POLICY=$(cat << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::$AWS_ACCOUNT_ID:distribution/$DISTRIBUTION_ID"
                }
            }
        }
    ]
}
EOF
)
    
    aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "$BUCKET_POLICY"
    
    log_success "CloudFront distribution created: $CLOUDFRONT_DOMAIN"
}

# Build and deploy frontend
deploy_frontend() {
    log_info "Building and deploying frontend..."
    
    cd $FRONTEND_DIR
    
    # Create production environment file
    echo "REACT_APP_API_URL=http://$ALB_DNS" > .env.production
    
    # Install dependencies and build
    npm install
    npm run build
    
    # Upload to S3
    aws s3 sync build/ s3://$BUCKET_NAME/ --delete --region $AWS_REGION
    
    # Invalidate CloudFront cache
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
    
    cd - > /dev/null
    
    log_success "Frontend deployed"
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    # Wait for ECS service to be stable
    log_info "Waiting for ECS service to stabilize..."
    aws ecs wait services-stable --cluster ev-digital-twin-cluster --services ev-digital-twin-service --region $AWS_REGION
    
    # Wait for ALB to be healthy
    log_info "Waiting for load balancer targets to be healthy..."
    sleep 60  # Give some time for health checks
    
    log_success "Services are ready"
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."
    
    # Test backend health
    if curl -f "http://$ALB_DNS/health" > /dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_warning "Backend health check failed - may need more time to start"
    fi
    
    # Test API endpoint
    if curl -f "http://$ALB_DNS/api/vehicles" > /dev/null 2>&1; then
        log_success "API endpoint test passed"
    else
        log_warning "API endpoint test failed - may need more time to start"
    fi
    
    log_success "Deployment testing completed"
}

# Main deployment function
main() {
    echo "🚀 EV Digital Twin - AWS Deployment"
    echo "=================================="
    
    check_prerequisites
    get_account_id
    
    # Backend deployment
    create_ecr_repo
    build_and_push_image
    
    # Infrastructure setup
    create_vpc
    create_security_groups
    create_alb
    create_ecs
    
    # Frontend deployment
    create_s3_bucket
    create_cloudfront
    deploy_frontend
    
    # Wait and test
    wait_for_services
    test_deployment
    
    # Display results
    echo ""
    echo "🎉 Deployment Complete!"
    echo "======================"
    echo "🌐 Frontend URL: https://$CLOUDFRONT_DOMAIN"
    echo "🔗 Backend API URL: http://$ALB_DNS"
    echo "📊 Health Check: http://$ALB_DNS/health"
    echo "📋 API Endpoints: http://$ALB_DNS/api/vehicles"
    echo ""
    echo "💡 Note: CloudFront distribution may take 10-15 minutes to fully deploy"
    echo "💡 Backend services may take a few minutes to become fully healthy"
}

# Run main function
main "$@"