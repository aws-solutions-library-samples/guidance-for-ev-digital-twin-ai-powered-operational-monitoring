#!/bin/bash
set -e

# EV Digital Twin - CloudFormation Cleanup Script
# This script safely removes all resources created by the CloudFormation stack

# Configuration
STACK_NAME="ev-digital-twin-complete"
AWS_REGION="us-east-1"

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

# Check if stack exists
check_stack_exists() {
    if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Empty S3 bucket before deletion
empty_s3_bucket() {
    log_info "Emptying S3 bucket..."
    
    BUCKET_NAME=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
        --output text \
        --region $AWS_REGION 2>/dev/null || echo "")
    
    if [ ! -z "$BUCKET_NAME" ]; then
        log_info "Emptying bucket: $BUCKET_NAME"
        aws s3 rm s3://$BUCKET_NAME --recursive --region $AWS_REGION || true
        log_success "S3 bucket emptied"
    else
        log_warning "Could not find S3 bucket name"
    fi
}

# Delete CloudFormation stack
delete_stack() {
    log_info "Deleting CloudFormation stack: $STACK_NAME"
    
    aws cloudformation delete-stack --stack-name $STACK_NAME --region $AWS_REGION
    
    log_info "Waiting for stack deletion to complete..."
    aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME --region $AWS_REGION
    
    log_success "CloudFormation stack deleted successfully"
}

# Main cleanup function
main() {
    echo "🧹 EV Digital Twin - CloudFormation Cleanup"
    echo "==========================================="
    
    # Check if stack exists
    if ! check_stack_exists; then
        log_warning "Stack $STACK_NAME does not exist or has already been deleted"
        exit 0
    fi
    
    # Confirm deletion
    echo ""
    log_warning "This will delete ALL resources created by the CloudFormation stack:"
    echo "- VPC and networking components"
    echo "- Cognito User Pool and users"
    echo "- ECS cluster and services"
    echo "- Application Load Balancer"
    echo "- S3 bucket and CloudFront distribution"
    echo "- IAM roles and policies"
    echo ""
    read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
    
    if [[ $CONFIRM != "yes" ]]; then
        log_info "Cleanup cancelled"
        exit 0
    fi
    
    # Empty S3 bucket first
    empty_s3_bucket
    
    # Delete the stack
    delete_stack
    
    echo ""
    log_success "Cleanup completed successfully!"
    echo ""
    echo "All resources have been removed:"
    echo "✅ VPC and networking"
    echo "✅ Cognito authentication"
    echo "✅ ECS cluster and services"
    echo "✅ Load balancer and target groups"
    echo "✅ S3 bucket and CloudFront"
    echo "✅ IAM roles and policies"
    echo ""
    echo "💡 Note: ECR repository is preserved and may contain Docker images"
    echo "💡 To delete ECR images: aws ecr delete-repository --repository-name ev-digital-twin-backend --force"
}

# Run main function
main "$@"