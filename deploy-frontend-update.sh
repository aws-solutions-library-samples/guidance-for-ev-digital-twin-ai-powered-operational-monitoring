#!/bin/bash
set -e

# Deploy Frontend Update with Login Tracking
# Updates the existing frontend deployment with login tracking functionality

# Configuration
AWS_REGION="us-east-1"
PROJECT_NAME="ev-digital-twin"
FRONTEND_DIR="frontend/ev-digital-twin-tire-maintainence-system"
LOGIN_TRACKER_API="https://pi3gtei49b.execute-api.us-east-1.amazonaws.com/prod"

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

# Get stack outputs
get_stack_outputs() {
    log_info "Getting existing stack outputs..."
    
    # Get Backend ALB DNS
    ALB_DNS=$(aws cloudformation describe-stacks \
        --stack-name ${PROJECT_NAME}-backend \
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
        --output text \
        --region $AWS_REGION)
    
    # Get Frontend S3 bucket
    BUCKET_NAME=$(aws cloudformation describe-stacks \
        --stack-name ${PROJECT_NAME}-frontend \
        --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
        --output text \
        --region $AWS_REGION)
    
    # Get CloudFront distribution
    DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
        --stack-name ${PROJECT_NAME}-frontend \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
        --output text \
        --region $AWS_REGION)
    
    CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
        --stack-name ${PROJECT_NAME}-frontend \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
        --output text \
        --region $AWS_REGION)
    
    log_success "Stack outputs retrieved"
    log_info "S3 Bucket: $BUCKET_NAME"
    log_info "CloudFront Domain: $CLOUDFRONT_DOMAIN"
    log_info "Backend API: http://$ALB_DNS"
    log_info "Login Tracker API: $LOGIN_TRACKER_API"
}

# Build and deploy updated frontend
deploy_updated_frontend() {
    log_info "Building and deploying updated frontend with login tracking..."
    
    cd $FRONTEND_DIR
    
    # Create production environment file with login tracker API
    cat > .env.production << EOF
REACT_APP_API_URL=http://$ALB_DNS
REACT_APP_LOGIN_TRACKER_API=$LOGIN_TRACKER_API
EOF
    
    log_info "Created production environment with login tracker API"
    
    # Install dependencies and build
    log_info "Installing dependencies and building..."
    npm install --silent
    npm run build
    
    # Upload to S3
    log_info "Uploading to S3..."
    aws s3 sync build/ s3://$BUCKET_NAME/ --delete --region $AWS_REGION --quiet
    
    # Invalidate CloudFront cache
    log_info "Invalidating CloudFront cache..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    log_info "CloudFront invalidation created: $INVALIDATION_ID"
    
    cd - > /dev/null
    
    log_success "Frontend updated and deployed successfully"
}

# Test the deployment
test_deployment() {
    log_info "Testing deployment..."
    
    # Test if CloudFront is serving the updated content
    log_info "CloudFront URL: https://$CLOUDFRONT_DOMAIN"
    log_info "Login Tracker API: $LOGIN_TRACKER_API"
    
    # Test login tracker API
    if curl -s -f "$LOGIN_TRACKER_API/stats" > /dev/null; then
        log_success "Login tracker API is accessible"
    else
        log_warning "Login tracker API test failed - may need time to propagate"
    fi
    
    log_success "Deployment testing completed"
}

# Main function
main() {
    echo "🚀 Frontend Update Deployment - Login Tracking"
    echo "=============================================="
    
    get_stack_outputs
    deploy_updated_frontend
    test_deployment
    
    echo ""
    log_success "Frontend update deployment complete!"
    echo "🌐 Updated Frontend URL: https://$CLOUDFRONT_DOMAIN"
    echo "📊 Login Tracker API: $LOGIN_TRACKER_API"
    echo ""
    echo "📝 Changes deployed:"
    echo "- ✅ Login tracking service integrated"
    echo "- ✅ Production environment variables updated"
    echo "- ✅ CloudFront cache invalidated"
    echo ""
    echo "⏰ Note: CloudFront cache invalidation may take 5-15 minutes to fully propagate"
}

# Run main function
main "$@"