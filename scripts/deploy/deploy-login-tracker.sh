#!/bin/bash
set -e

# Login Tracker Deployment Script
# Ensures deployment to the correct AWS account

# Target configuration
TARGET_ACCOUNT="123456789012"
AWS_REGION="us-east-1"
STACK_NAME="ev-digital-twin-login-tracker"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Verify AWS account
verify_account() {
    log_info "Verifying AWS account configuration..."
    
    CURRENT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    
    if [ "$CURRENT_ACCOUNT" != "$TARGET_ACCOUNT" ]; then
        log_error "Wrong AWS account detected!"
        log_error "Current account: $CURRENT_ACCOUNT"
        log_error "Target account:  $TARGET_ACCOUNT"
        log_error ""
        log_error "Please switch to the correct AWS profile/credentials:"
        log_error "  aws configure --profile demo-account"
        log_error "  export AWS_PROFILE=demo-account"
        log_error "Or configure credentials for account $TARGET_ACCOUNT"
        exit 1
    fi
    
    log_success "Verified deployment target: AWS Account $CURRENT_ACCOUNT"
}

# Deploy CloudFormation stack
deploy_stack() {
    log_info "Deploying login tracker infrastructure..."
    
    if [ ! -f "infrastructure/login-tracker-stack.yaml" ]; then
        log_error "CloudFormation template not found: infrastructure/login-tracker-stack.yaml"
        log_error "Please create the template first (Task 1 in implementation plan)"
        exit 1
    fi
    
    aws cloudformation deploy \
        --template-file infrastructure/login-tracker-stack.yaml \
        --stack-name $STACK_NAME \
        --capabilities CAPABILITY_NAMED_IAM \
        --region $AWS_REGION \
        --tags \
            Project=ev-digital-twin \
            Environment=demo \
            Component=login-tracker
    
    log_success "Login tracker stack deployed successfully"
}

# Get stack outputs
get_outputs() {
    log_info "Getting stack outputs..."
    
    API_ENDPOINT=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`LoginTrackerApiEndpoint`].OutputValue' \
        --output text \
        --region $AWS_REGION)
    
    log_success "API Endpoint: $API_ENDPOINT"
    log_info "Update your frontend .env file with:"
    log_info "REACT_APP_LOGIN_TRACKER_API=$API_ENDPOINT"
}

# Main function
main() {
    echo "🔐 Login Tracker Deployment"
    echo "=========================="
    
    verify_account
    deploy_stack
    get_outputs
    
    echo ""
    log_success "Deployment complete!"
    echo "Next steps:"
    echo "1. Update frontend environment variables"
    echo "2. Test login tracking functionality"
}

# Run main function
main "$@"