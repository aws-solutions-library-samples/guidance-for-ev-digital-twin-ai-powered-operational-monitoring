# EV Digital Twin - AWS Cloud Deployment Guide

## 🏗️ Architecture Overview

This guide provides step-by-step instructions for deploying the EV Digital Twin solution to AWS, based on our tested deployment process.

```
Internet → CloudFront → S3 (Frontend) 
Internet → ALB → ECS Fargate (Backend API) → ECR (Docker Images)
```

**Components:**
- **Frontend**: React app served via CloudFront + S3 with Origin Access Control (OAC)
- **Backend**: Flask API running on ECS Fargate with Application Load Balancer
- **Storage**: Private S3 bucket with secure CloudFront access
- **Container Registry**: ECR for Docker images
- **Networking**: VPC with public subnets and security groups

## 📋 Prerequisites

1. **AWS CLI** installed and configured with appropriate permissions
2. **Docker** installed locally (for building container images)
3. **Node.js** and **npm** installed (for building React frontend)
4. **AWS Account** with the following permissions:
   - ECR: Create repositories, push/pull images
   - ECS: Create clusters, services, task definitions
   - EC2: Create VPC, subnets, security groups, load balancers
   - S3: Create buckets, upload objects
   - CloudFront: Create distributions, origin access controls
   - IAM: Create roles and policies
   - CloudWatch: Create log groups

## 🚀 Quick Deployment

### Automated Deployment with Nested Stacks (Recommended)

Use our tested deployment script that deploys three separate CloudFormation stacks for easier debugging:

```bash
# Make the script executable
chmod +x deploy-aws.sh

# Run the deployment
./deploy-aws.sh
```

This script will:
1. ✅ Create ECR repository and push Docker image (with correct platform)
2. ✅ Deploy Cognito stack (Authentication)
3. ✅ Deploy Backend stack (ECS + ALB + VPC)
4. ✅ Deploy Frontend stack (S3 + CloudFront with OAC)
5. ✅ Create demo admin user
6. ✅ Build and deploy React frontend with authentication
7. ✅ Test the complete system

**Deployment time:** ~15-20 minutes

**Benefits of Nested Stack Approach:**
- ✅ **Easier Debugging** - Each component can be debugged separately
- ✅ **Faster Updates** - Update only the stack that changed
- ✅ **Better Error Isolation** - Failures don't affect other components
- ✅ **Modular Architecture** - Clean separation of concerns

### Option 2: Manual Step-by-Step Deployment

If you prefer to understand each step or customize the deployment:

## 🔧 Manual Deployment Steps

### Phase 1: Backend Containerization

The backend is already containerized with the included `Dockerfile`:

```dockerfile
# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for models
RUN mkdir -p models

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "app.py"]
```

#### Test locally:
```bash
docker build -t ev-digital-twin-backend .
docker run -p 8000:8000 ev-digital-twin-backend
curl http://localhost:8000/health
```

### Phase 2: AWS Infrastructure Setup

#### Step 2.1: Create ECR Repository
```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create ECR repository
aws ecr create-repository --repository-name ev-digital-twin-backend --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

#### Step 2.2: Build and Push Docker Image
```bash
# Build for production (multi-platform for compatibility)
docker buildx build --platform linux/amd64 -t ev-digital-twin-backend .

# Tag for ECR
docker tag ev-digital-twin-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ev-digital-twin-backend:latest

# Push to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ev-digital-twin-backend:latest
```

#### Step 2.3: Create VPC and Networking
```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text)
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=ev-digital-twin-vpc

# Enable DNS hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

# Create subnets in different AZs
SUBNET1_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --query 'Subnet.SubnetId' --output text)
SUBNET2_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone us-east-1b --query 'Subnet.SubnetId' --output text)

# Enable auto-assign public IP
aws ec2 modify-subnet-attribute --subnet-id $SUBNET1_ID --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id $SUBNET2_ID --map-public-ip-on-launch

# Create and configure route table
RT_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --subnet-id $SUBNET1_ID --route-table-id $RT_ID
aws ec2 associate-route-table --subnet-id $SUBNET2_ID --route-table-id $RT_ID
```

#### Step 2.4: Create Security Groups
```bash
# ALB Security Group
ALB_SG_ID=$(aws ec2 create-security-group --group-name ev-digital-twin-alb-sg --description "Security group for ALB" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0

# ECS Security Group
ECS_SG_ID=$(aws ec2 create-security-group --group-name ev-digital-twin-ecs-sg --description "Security group for ECS" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $ECS_SG_ID --protocol tcp --port 8000 --source-group $ALB_SG_ID
```

#### Step 2.5: Create Application Load Balancer
```bash
# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name ev-digital-twin-alb \
    --subnets $SUBNET1_ID $SUBNET2_ID \
    --security-groups $ALB_SG_ID \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

# Create target group
TG_ARN=$(aws elbv2 create-target-group \
    --name ev-digital-twin-tg \
    --protocol HTTP \
    --port 8000 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path /health \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

# Create listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text)
echo "ALB DNS: $ALB_DNS"
```

#### Step 2.6: Create ECS Cluster and Service
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name ev-digital-twin-cluster

# Create IAM execution role
aws iam create-role --role-name ev-digital-twin-execution-role --assume-role-policy-document '{
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
}'

aws iam attach-role-policy --role-name ev-digital-twin-execution-role --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create task role
aws iam create-role --role-name ev-digital-twin-task-role --assume-role-policy-document '{
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
}'

# Create CloudWatch log group
aws logs create-log-group --log-group-name /ecs/ev-digital-twin

# Register task definition
aws ecs register-task-definition --cli-input-json '{
    "family": "ev-digital-twin-task",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "1024",
    "memory": "2048",
    "executionRoleArn": "arn:aws:iam::'$AWS_ACCOUNT_ID':role/ev-digital-twin-execution-role",
    "taskRoleArn": "arn:aws:iam::'$AWS_ACCOUNT_ID':role/ev-digital-twin-task-role",
    "containerDefinitions": [
        {
            "name": "ev-digital-twin-backend",
            "image": "'$AWS_ACCOUNT_ID'.dkr.ecr.us-east-1.amazonaws.com/ev-digital-twin-backend:latest",
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
                    "awslogs-region": "us-east-1",
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
}'

# Create ECS service
aws ecs create-service \
    --cluster ev-digital-twin-cluster \
    --service-name ev-digital-twin-service \
    --task-definition ev-digital-twin-task \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1_ID,$SUBNET2_ID],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$TG_ARN,containerName=ev-digital-twin-backend,containerPort=8000"
```

### Phase 3: Authentication Setup

#### Step 3.1: Create Cognito User Pool
```bash
# Deploy Cognito infrastructure
aws cloudformation deploy \
    --template-file infrastructure/cognito-infrastructure.yaml \
    --stack-name ev-digital-twin-cognito \
    --parameter-overrides ProjectName=ev-digital-twin \
    --capabilities CAPABILITY_NAMED_IAM \
    --region us-east-1

# Get Cognito details
USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name ev-digital-twin-cognito \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)

USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name ev-digital-twin-cognito \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
    --output text)

echo "User Pool ID: $USER_POOL_ID"
echo "Client ID: $USER_POOL_CLIENT_ID"
```

### Phase 4: Frontend Deployment

#### Step 4.1: Create S3 Bucket
```bash
# Create S3 bucket for frontend
BUCKET_NAME="ev-digital-twin-frontend-$AWS_ACCOUNT_ID-us-east-1"
aws s3 mb s3://$BUCKET_NAME --region us-east-1

# Block public access (security best practice)
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

#### Step 4.2: Create CloudFront Distribution with Origin Access Control
```bash
# Create Origin Access Control
OAC_ID=$(aws cloudfront create-origin-access-control --origin-access-control-config '{
    "Name": "ev-digital-twin-frontend-oac",
    "Description": "OAC for EV Digital Twin Frontend S3 bucket",
    "OriginAccessControlOriginType": "s3",
    "SigningBehavior": "always",
    "SigningProtocol": "sigv4"
}' --query 'OriginAccessControl.Id' --output text)

# Create CloudFront distribution
DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config '{
    "CallerReference": "ev-digital-twin-frontend-'$(date +%s)'",
    "Comment": "CloudFront distribution for EV Digital Twin Frontend",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "ev-digital-twin-s3-origin",
                "DomainName": "'$BUCKET_NAME'.s3.us-east-1.amazonaws.com",
                "OriginAccessControlId": "'$OAC_ID'",
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
}' --query 'Distribution.Id' --output text)

# Get CloudFront domain name
CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)

# Create bucket policy to allow CloudFront access
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::'$AWS_ACCOUNT_ID':distribution/'$DISTRIBUTION_ID'"
                }
            }
        }
    ]
}'
```

#### Step 4.3: Build and Deploy Frontend with Authentication
```bash
cd frontend/ev-digital-twin-tire-maintainence-system

# Update AWS exports with Cognito configuration
cat > src/aws-exports.js << EOF
const awsmobile = {
  "aws_project_region": "us-east-1",
  "aws_cognito_region": "us-east-1",
  "aws_user_pools_id": "$USER_POOL_ID",
  "aws_user_pools_web_client_id": "$USER_POOL_CLIENT_ID",
  "oauth": {},
  "aws_cognito_username_attributes": ["EMAIL"],
  "aws_cognito_social_providers": [],
  "aws_cognito_signup_attributes": ["EMAIL"],
  "aws_cognito_mfa_configuration": "OFF",
  "aws_cognito_mfa_types": ["SMS"],
  "aws_cognito_password_protection_settings": {
    "passwordPolicyMinLength": 8,
    "passwordPolicyCharacters": [
      "REQUIRES_LOWERCASE",
      "REQUIRES_UPPERCASE", 
      "REQUIRES_NUMBERS",
      "REQUIRES_SYMBOLS"
    ]
  },
  "aws_cognito_verification_mechanisms": ["EMAIL"],
  "aws_cognito_signup_disabled": true
};
export default awsmobile;
EOF

# Create production environment file with backend API URL
echo "REACT_APP_API_URL=http://$ALB_DNS" > .env.production

# Install dependencies and build
npm install
npm run build

# Upload to S3
aws s3 sync build/ s3://$BUCKET_NAME/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

cd ../..
```

### Phase 5: Testing and Verification

#### Step 5.1: Test Backend
```bash
# Test health endpoint
curl http://$ALB_DNS/health

# Test API endpoints
curl http://$ALB_DNS/api/vehicles
```

#### Step 5.2: Test Frontend and Authentication
```bash
# Test CloudFront distribution
curl -I https://$CLOUDFRONT_DOMAIN/

# Test static assets
curl -I https://$CLOUDFRONT_DOMAIN/static/css/main.*.css

# Test authentication - visit the frontend URL
echo "Visit https://$CLOUDFRONT_DOMAIN to test login"
echo "Demo Credentials:"
echo "Username: admin"
echo "Email: admin@example.com" 
echo "Temporary Password: TempPass123!"
```

## 📊 Deployment Results

After successful deployment, you'll have:

- **Frontend URL**: `https://$CLOUDFRONT_DOMAIN`
- **Backend API URL**: `http://$ALB_DNS`
- **Health Check**: `http://$ALB_DNS/health`
- **API Endpoints**: `http://$ALB_DNS/api/vehicles`

## 🔐 Authentication & User Management

### Demo Credentials
- **Username**: `admin`
- **Email**: `admin@example.com`
- **Temporary Password**: `TempPass123!`

### Security Architecture
- ✅ **Admin-Only User Creation** - Self-registration is disabled
- ✅ **Strong Password Policy** - 8+ chars with uppercase, lowercase, numbers, symbols
- ✅ **Email Verification** - Required for account recovery
- ✅ **Secure Authentication** - AWS Cognito with SRP protocol

### Creating Additional Users

#### Via AWS Console:
1. Go to AWS Console > Cognito > User Pools
2. Select `ev-digital-twin-user-pool`
3. Click "Create user"
4. Enter username and email
5. Set temporary password or let AWS generate one
6. User will receive email with login instructions

#### Via AWS CLI:
```bash
# Create a new user
aws cognito-idp admin-create-user \
    --user-pool-id $USER_POOL_ID \
    --username "newuser" \
    --user-attributes Name=email,Value=user@company.com Name=given_name,Value=John Name=family_name,Value=Doe \
    --temporary-password "TempPass456!" \
    --message-action SUPPRESS

# Set permanent password (optional)
aws cognito-idp admin-set-user-password \
    --user-pool-id $USER_POOL_ID \
    --username "newuser" \
    --password "PermanentPass123!" \
    --permanent
```

### Password Management
- **First Login**: Users must change temporary password
- **Password Reset**: Users can reset via "Forgot Password" link
- **Admin Reset**: Admins can reset passwords via AWS Console/CLI

## 🔄 Updating the Deployment

### Update Backend
```bash
# Rebuild and push new image
docker buildx build --platform linux/amd64 --push -t $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ev-digital-twin-backend:latest .

# Force new deployment
aws ecs update-service --cluster ev-digital-twin-cluster --service ev-digital-twin-service --force-new-deployment
```

### Update Frontend
```bash
cd frontend/ev-digital-twin-tire-maintainence-system
npm run build
aws s3 sync build/ s3://$BUCKET_NAME/ --delete
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
cd ../..
```

## 🧹 Cleanup

To remove all resources:
```bash
# Delete CloudFront distribution (disable first, then delete)
aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config '{"Enabled":false,...}'
# Wait for deployment, then delete

# Delete S3 bucket
aws s3 rm s3://$BUCKET_NAME --recursive
aws s3 rb s3://$BUCKET_NAME

# Delete ECS service and cluster
aws ecs update-service --cluster ev-digital-twin-cluster --service ev-digital-twin-service --desired-count 0
aws ecs delete-service --cluster ev-digital-twin-cluster --service ev-digital-twin-service
aws ecs delete-cluster --cluster ev-digital-twin-cluster

# Delete ALB and target group
aws elbv2 delete-listener --listener-arn $LISTENER_ARN
aws elbv2 delete-target-group --target-group-arn $TG_ARN
aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN

# Delete VPC and associated resources
# (Security groups, subnets, route tables, internet gateway, VPC)
```

## Alternative: CloudFormation Templates

For infrastructure as code, you can also use the CloudFormation templates provided in the `infrastructure/` directory:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'EV Digital Twin ECS Infrastructure'

Parameters:
  ImageURI:
    Type: String
    Description: ECR Image URI
  
Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: ev-digital-twin-vpc

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: ev-digital-twin-public-subnet-1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: ev-digital-twin-public-subnet-2

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: ev-digital-twin-igw

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: ev-digital-twin-public-rt

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: ev-digital-twin-alb-sg

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ECS tasks
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8000
          ToPort: 8000
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: ev-digital-twin-ecs-sg

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: ev-digital-twin-alb
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: ev-digital-twin-alb

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: ev-digital-twin-tg
      Port: 8000
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: ip
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3

  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: ev-digital-twin-cluster
      CapacityProviders:
        - FARGATE
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1

  # ECS Task Definition
  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: ev-digital-twin-task
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: 512
      Memory: 1024
      ExecutionRoleArn: !Ref ExecutionRole
      TaskRoleArn: !Ref TaskRole
      ContainerDefinitions:
        - Name: ev-digital-twin-backend
          Image: !Ref ImageURI
          PortMappings:
            - ContainerPort: 8000
              Protocol: tcp
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref LogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs
          Environment:
            - Name: PORT
              Value: "8000"
          HealthCheck:
            Command:
              - CMD-SHELL
              - "curl -f http://localhost:8000/health || exit 1"
            Interval: 30
            Timeout: 5
            Retries: 3
            StartPeriod: 60

  # ECS Service
  ECSService:
    Type: AWS::ECS::Service
    DependsOn: Listener
    Properties:
      ServiceName: ev-digital-twin-service
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref TaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          SecurityGroups:
            - !Ref ECSSecurityGroup
          Subnets:
            - !Ref PublicSubnet1
            - !Ref PublicSubnet2
          AssignPublicIp: ENABLED
      LoadBalancers:
        - ContainerName: ev-digital-twin-backend
          ContainerPort: 8000
          TargetGroupArn: !Ref TargetGroup

  # IAM Roles
  ExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: ev-digital-twin-execution-role
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

  TaskRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: ev-digital-twin-task-role
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: BedrockAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - bedrock:InvokeModel
                  - bedrock:InvokeModelWithResponseStream
                Resource: "*"

  # CloudWatch Log Group
  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /ecs/ev-digital-twin
      RetentionInDays: 7

Outputs:
  LoadBalancerDNS:
    Description: DNS name of the load balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: ev-digital-twin-alb-dns
  
  ClusterName:
    Description: Name of the ECS cluster
    Value: !Ref ECSCluster
    Export:
      Name: ev-digital-twin-cluster-name
```

#### Step 2.4: Deploy ECS Infrastructure
```bash
# Deploy the CloudFormation stack
aws cloudformation create-stack \
  --stack-name ev-digital-twin-ecs \
  --template-body file://infrastructure/ecs-infrastructure.yaml \
  --parameters ParameterKey=ImageURI,ParameterValue=<account-id>.dkr.ecr.us-east-1.amazonaws.com/ev-digital-twin-backend:latest \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for stack creation to complete
aws cloudformation wait stack-create-complete --stack-name ev-digital-twin-ecs --region us-east-1
```

### Phase 3: Frontend Deployment with S3 and CloudFront

#### Step 3.1: Build Frontend for Production
```bash
cd frontend/ev-digital-twin-tire-maintainence-system

# Update API endpoint in frontend
# Create .env.production file
echo "REACT_APP_API_URL=http://<ALB-DNS-NAME>" > .env.production

# Build for production
npm run build
```

#### Step 3.2: Create S3 Bucket and CloudFront Distribution

Create `infrastructure/frontend-infrastructure.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'EV Digital Twin Frontend Infrastructure'

Parameters:
  DomainName:
    Type: String
    Description: Domain name for the application (optional)
    Default: ""

Conditions:
  HasDomainName: !Not [!Equals [!Ref DomainName, ""]]

Resources:
  # S3 Bucket for Frontend
  FrontendBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "ev-digital-twin-frontend-${AWS::AccountId}-${AWS::Region}"
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled

  # CloudFront Origin Access Control
  OriginAccessControl:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub "${AWS::StackName}-OAC"
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt FrontendBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: ""
            OriginAccessControlId: !Ref OriginAccessControl
        Enabled: true
        DefaultRootObject: index.html
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # Managed-CachingOptimized
          OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf  # Managed-CORS-S3Origin
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html
          - ErrorCode: 403
            ResponseCode: 200
            ResponsePagePath: /index.html
        PriceClass: PriceClass_100
        ViewerCertificate:
          CloudFrontDefaultCertificate: true

  # Bucket Policy
  BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref FrontendBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontServicePrincipal
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: s3:GetObject
            Resource: !Sub "${FrontendBucket}/*"
            Condition:
              StringEquals:
                "AWS:SourceArn": !Sub "arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}"

Outputs:
  BucketName:
    Description: Name of the S3 bucket
    Value: !Ref FrontendBucket
    Export:
      Name: ev-digital-twin-frontend-bucket

  CloudFrontDomainName:
    Description: Domain name of the CloudFront distribution
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: ev-digital-twin-cloudfront-domain

  CloudFrontDistributionId:
    Description: ID of the CloudFront distribution
    Value: !Ref CloudFrontDistribution
    Export:
      Name: ev-digital-twin-cloudfront-id
```

#### Step 3.3: Deploy Frontend Infrastructure
```bash
# Deploy frontend infrastructure
aws cloudformation create-stack \
  --stack-name ev-digital-twin-frontend \
  --template-body file://infrastructure/frontend-infrastructure.yaml \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete --stack-name ev-digital-twin-frontend --region us-east-1
```

#### Step 3.4: Upload Frontend to S3
```bash
# Get bucket name from CloudFormation output
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
  --output text)

# Upload build files to S3
aws s3 sync frontend/ev-digital-twin-tire-maintainence-system/build/ s3://$BUCKET_NAME/ --delete

# Invalidate CloudFront cache
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### Phase 4: Configure API Integration

#### Step 4.1: Update Frontend API Configuration
```bash
# Get ALB DNS name
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-ecs \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text)

# Update frontend environment
cd frontend/ev-digital-twin-tire-maintainence-system
echo "REACT_APP_API_URL=http://$ALB_DNS" > .env.production

# Rebuild and redeploy
npm run build
aws s3 sync build/ s3://$BUCKET_NAME/ --delete
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

### Phase 5: Testing and Monitoring

#### Step 5.1: Test the Deployment
```bash
# Get CloudFront domain
CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
  --output text)

echo "Frontend URL: https://$CLOUDFRONT_DOMAIN"
echo "Backend API URL: http://$ALB_DNS"

# Test backend health
curl http://$ALB_DNS/health

# Test API endpoints
curl http://$ALB_DNS/api/vehicles
```

#### Step 5.2: Set Up Monitoring (Optional)
```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name "EV-Digital-Twin" \
  --dashboard-body file://monitoring/dashboard.json
```

## 🔧 Deployment Scripts

Create `deploy.sh` for automated deployment:

```bash
#!/bin/bash
set -e

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="ev-digital-twin-backend"
IMAGE_TAG="latest"

echo "🚀 Starting EV Digital Twin deployment..."

# Step 1: Build and push backend
echo "📦 Building and pushing backend image..."
docker build -t $ECR_REPO .
docker tag $ECR_REPO:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG

# Step 2: Deploy ECS infrastructure
echo "🏗️ Deploying ECS infrastructure..."
aws cloudformation deploy \
  --template-file infrastructure/ecs-infrastructure.yaml \
  --stack-name ev-digital-twin-ecs \
  --parameter-overrides ImageURI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $AWS_REGION

# Step 3: Deploy frontend infrastructure
echo "🌐 Deploying frontend infrastructure..."
aws cloudformation deploy \
  --template-file infrastructure/frontend-infrastructure.yaml \
  --stack-name ev-digital-twin-frontend \
  --region $AWS_REGION

# Step 4: Build and deploy frontend
echo "⚛️ Building and deploying frontend..."
cd frontend/ev-digital-twin-tire-maintainence-system

ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-ecs \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --region $AWS_REGION)

echo "REACT_APP_API_URL=http://$ALB_DNS" > .env.production
npm run build

BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
  --output text \
  --region $AWS_REGION)

aws s3 sync build/ s3://$BUCKET_NAME/ --delete --region $AWS_REGION

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text \
  --region $AWS_REGION)

aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

# Step 5: Display URLs
CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
  --output text \
  --region $AWS_REGION)

echo "✅ Deployment complete!"
echo "🌐 Frontend URL: https://$CLOUDFRONT_DOMAIN"
echo "🔗 Backend API URL: http://$ALB_DNS"
echo "📊 Health Check: http://$ALB_DNS/health"

cd ../..
```

## 💰 Cost Estimation

**Monthly AWS Costs (approximate):**
- ECS Fargate (2 tasks): ~$30-50
- Application Load Balancer: ~$20
- CloudFront: ~$1-10 (depending on traffic)
- S3 Storage: ~$1-5
- ECR: ~$1
- **Total: ~$53-86/month**

## 🔒 Security Best Practices

1. **Enable HTTPS**: Add SSL certificate to ALB
2. **API Authentication**: Implement API keys or JWT tokens
3. **VPC Security**: Use private subnets for ECS tasks
4. **IAM Roles**: Follow least privilege principle
5. **Secrets Management**: Use AWS Secrets Manager for sensitive data

## 💰 Cost Estimation

**Monthly AWS Costs (US East 1, approximate):**
- **ECS Fargate** (2 tasks, 1 vCPU, 2GB RAM): ~$35-45
- **Application Load Balancer**: ~$20
- **CloudFront**: ~$1-10 (depending on traffic)
- **S3 Storage**: ~$1-5 (depending on data size)
- **ECR Storage**: ~$1
- **Data Transfer**: ~$5-15 (depending on usage)
- **CloudWatch Logs**: ~$1-5

**Total Estimated Cost: ~$64-101/month**

*Note: Costs may vary based on actual usage, region, and AWS pricing changes.*

## 🔒 Security Features

✅ **Private S3 Bucket** - No public access, secured with CloudFront OAC  
✅ **HTTPS Encryption** - All frontend traffic encrypted via CloudFront  
✅ **VPC Isolation** - Backend runs in private VPC with security groups  
✅ **IAM Roles** - Least privilege access for ECS tasks  
✅ **Health Checks** - Automated health monitoring and recovery  
✅ **Container Security** - Minimal base images and security scanning  

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd ev-digital-twin-tire-maintainence-system

# Make deploy script executable
chmod +x deploy-aws.sh

# Run automated deployment
./deploy-aws.sh
```

**Deployment Time:** ~15-20 minutes

This will deploy your entire EV Digital Twin solution to AWS with production-ready, secure infrastructure!

## 📞 Support

For deployment issues:
1. Check AWS CloudWatch logs for ECS tasks
2. Verify security group rules and network connectivity
3. Ensure IAM roles have proper permissions
4. Check CloudFront distribution status
5. Validate S3 bucket policies

## 🎯 Next Steps

After deployment:
1. **Custom Domain**: Add Route 53 and SSL certificate
2. **Monitoring**: Set up CloudWatch dashboards and alarms
3. **CI/CD**: Implement automated deployment pipeline
4. **Scaling**: Configure auto-scaling for ECS service
5. **Security**: Add WAF rules and additional security measures