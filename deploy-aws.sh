#!/bin/bash
set -e

# EV Digital Twin - Individual Stack Deployment Script
# This script deploys each stack individually for easier debugging

# Configuration
AWS_REGION="us-east-1"
ECR_REPO="ev-digital-twin-backend"
IMAGE_TAG="latest"
PROJECT_NAME="ev-digital-twin"
ENVIRONMENT="demo"
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

# Get AWS account ID
get_account_id() {
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    log_info "Using AWS Account: $AWS_ACCOUNT_ID"
}

# Build and push Docker image with correct platform
build_and_push_image() {
    log_info "Building and pushing Docker image for linux/amd64..."
    
    # Build the image for the correct platform
    docker buildx build --platform linux/amd64 --load -t $ECR_REPO .
    
    # Tag for ECR
    docker tag $ECR_REPO:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Push to ECR
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG
    
    log_success "Docker image pushed to ECR with correct platform"
}

# Deploy Cognito stack
deploy_cognito() {
    log_info "Deploying Cognito stack..."
    
    aws cloudformation deploy \
        --template-file infrastructure/cognito-stack.yaml \
        --stack-name ${PROJECT_NAME}-cognito \
        --parameter-overrides \
            ProjectName=$PROJECT_NAME \
            Environment=$ENVIRONMENT \
        --capabilities CAPABILITY_NAMED_IAM \
        --region $AWS_REGION \
        --tags \
            Project=$PROJECT_NAME \
            Environment=$ENVIRONMENT \
            Component=cognito
    
    log_success "Cognito stack deployed"
}

# Deploy Backend stack
deploy_backend() {
    log_info "Deploying Backend stack..."
    
    ECR_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG"
    
    aws cloudformation deploy \
        --template-file infrastructure/backend-stack.yaml \
        --stack-name ${PROJECT_NAME}-backend \
        --parameter-overrides \
            ProjectName=$PROJECT_NAME \
            Environment=$ENVIRONMENT \
            ECRImageURI=$ECR_IMAGE_URI \
        --capabilities CAPABILITY_NAMED_IAM \
        --region $AWS_REGION \
        --tags \
            Project=$PROJECT_NAME \
            Environment=$ENVIRONMENT \
            Component=backend
    
    log_success "Backend stack deployed"
}

# Deploy Frontend stack
deploy_frontend_stack() {
    log_info "Deploying Frontend stack..."
    
    aws cloudformation deploy \
        --template-file infrastructure/frontend-stack.yaml \
        --stack-name ${PROJECT_NAME}-frontend \
        --parameter-overrides \
            ProjectName=$PROJECT_NAME \
            Environment=$ENVIRONMENT \
        --capabilities CAPABILITY_NAMED_IAM \
        --region $AWS_REGION \
        --tags \
            Project=$PROJECT_NAME \
            Environment=$ENVIRONMENT \
            Component=frontend
    
    log_success "Frontend stack deployed"
}

# Get stack outputs
get_stack_outputs() {
    log_info "Getting stack outputs..."
    
    # Get Cognito outputs
    USER_POOL_ID=$(aws cloudformation describe-stacks \
        --stack-name ${PROJECT_NAME}-cognito \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
        --output text \
        --region $AWS_REGION)
    
    USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
        --stack-name ${PROJECT_NAME}-cognito \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
        --output text \
        --region $AWS_REGION)
    
    # Get Backend outputs
    ALB_DNS=$(aws cloudformation describe-stacks \
        --stack-name ${PROJECT_NAME}-backend \
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
        --output text \
        --region $AWS_REGION)
    
    # Get Frontend outputs
    BUCKET_NAME=$(aws cloudformation describe-stacks \
        --stack-name ${PROJECT_NAME}-frontend \
        --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
        --output text \
        --region $AWS_REGION)
    
    CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
        --stack-name ${PROJECT_NAME}-frontend \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
        --output text \
        --region $AWS_REGION)
    
    DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
        --stack-name ${PROJECT_NAME}-frontend \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
        --output text \
        --region $AWS_REGION)
    
    log_success "Stack outputs retrieved"
}

# Create demo admin user
create_demo_user() {
    log_info "Creating demo admin user..."
    
    # Check if user already exists
    if aws cognito-idp admin-get-user --user-pool-id $USER_POOL_ID --username admin --region $AWS_REGION &> /dev/null; then
        log_warning "Demo admin user already exists"
        return
    fi
    
    # Create demo admin user
    aws cognito-idp admin-create-user \
        --user-pool-id $USER_POOL_ID \
        --username admin \
        --user-attributes Name=email,Value=admin@example.com Name=given_name,Value=Demo Name=family_name,Value=Admin Name=email_verified,Value=true \
        --temporary-password "TempPass123!" \
        --message-action SUPPRESS \
        --region $AWS_REGION
    
    log_success "Demo admin user created with temporary password: TempPass123!"
}

# Build and deploy frontend
deploy_frontend_app() {
    log_info "Building and deploying frontend application..."
    
    cd $FRONTEND_DIR
    
    # Update AWS exports with Cognito configuration
    cat > src/aws-exports.js << EOF
// AWS Cognito configuration for EV Digital Twin
const awsmobile = {
  "aws_project_region": "$AWS_REGION",
  "aws_cognito_region": "$AWS_REGION",
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
    
    log_success "Frontend application deployed"
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    # Wait for ECS service to be stable
    log_info "Waiting for ECS service to stabilize..."
    aws ecs wait services-stable --cluster ${PROJECT_NAME}-cluster --services ${PROJECT_NAME}-service --region $AWS_REGION
    
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
    
    log_success "Deployment testing completed"
}

# Main deployment function
main() {
    echo "🚀 EV Digital Twin - Individual Stack Deployment"
    echo "==============================================="
    
    get_account_id
    
    # Build and push backend image with correct platform
    build_and_push_image
    
    # Deploy stacks individually
    deploy_cognito
    deploy_backend
    deploy_frontend_stack
    
    # Get outputs and configure
    get_stack_outputs
    create_demo_user
    deploy_frontend_app
    
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
    echo ""
    echo "🔐 Authentication Details:"
    echo "========================="
    echo "👤 Demo Username: admin"
    echo "📧 Demo Email: admin@example.com"
    echo "🔑 Temporary Password: TempPass123!"
    echo ""
    echo "📊 CloudFormation Stacks:"
    echo "- ${PROJECT_NAME}-cognito (Authentication)"
    echo "- ${PROJECT_NAME}-backend (ECS + ALB)"
    echo "- ${PROJECT_NAME}-frontend (S3 + CloudFront)"
    echo ""
    echo "💡 Note: Each stack can be debugged independently"
}

# Run main function
main "$@"