#!/bin/bash

# EV Digital Twin - Create Cognito User Script
# This script helps administrators create new users for the application

set -e

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

# Check if AWS CLI is configured
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
}

# Get User Pool ID
get_user_pool_id() {
    log_info "Getting Cognito User Pool ID..."
    
    USER_POOL_ID=$(aws cloudformation describe-stacks \
        --stack-name ev-digital-twin-cognito \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
        --output text 2>/dev/null)
    
    if [ -z "$USER_POOL_ID" ] || [ "$USER_POOL_ID" = "None" ]; then
        log_error "Could not find Cognito User Pool. Make sure the stack 'ev-digital-twin-cognito' exists."
        exit 1
    fi
    
    log_success "Found User Pool: $USER_POOL_ID"
}

# Prompt for user details
get_user_details() {
    echo ""
    log_info "Enter user details:"
    
    read -p "Username: " USERNAME
    if [ -z "$USERNAME" ]; then
        log_error "Username is required"
        exit 1
    fi
    
    read -p "Email: " EMAIL
    if [ -z "$EMAIL" ]; then
        log_error "Email is required"
        exit 1
    fi
    
    read -p "First Name: " FIRST_NAME
    read -p "Last Name: " LAST_NAME
    
    read -p "Temporary Password (leave empty to auto-generate): " TEMP_PASSWORD
    if [ -z "$TEMP_PASSWORD" ]; then
        TEMP_PASSWORD=$(openssl rand -base64 12 | tr -d "=+/" | cut -c1-12)
        TEMP_PASSWORD="${TEMP_PASSWORD}1!"  # Ensure it meets password policy
        log_info "Generated temporary password: $TEMP_PASSWORD"
    fi
}

# Create the user
create_user() {
    log_info "Creating user in Cognito..."
    
    # Build user attributes
    USER_ATTRIBUTES="Name=email,Value=$EMAIL"
    
    if [ ! -z "$FIRST_NAME" ]; then
        USER_ATTRIBUTES="$USER_ATTRIBUTES Name=given_name,Value=$FIRST_NAME"
    fi
    
    if [ ! -z "$LAST_NAME" ]; then
        USER_ATTRIBUTES="$USER_ATTRIBUTES Name=family_name,Value=$LAST_NAME"
    fi
    
    # Create user
    aws cognito-idp admin-create-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$USERNAME" \
        --user-attributes $USER_ATTRIBUTES \
        --temporary-password "$TEMP_PASSWORD" \
        --message-action SUPPRESS
    
    log_success "User created successfully!"
}

# Display user information
display_user_info() {
    echo ""
    echo "🎉 User Created Successfully!"
    echo "============================="
    echo "👤 Username: $USERNAME"
    echo "📧 Email: $EMAIL"
    echo "🔑 Temporary Password: $TEMP_PASSWORD"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Share the credentials with the user"
    echo "2. User must change password on first login"
    echo "3. User can access the application at the CloudFront URL"
    echo ""
    echo "💡 Note: The user will be prompted to change their password on first login"
}

# Option to create another user
ask_create_another() {
    echo ""
    read -p "Would you like to create another user? (y/n): " CREATE_ANOTHER
    if [[ $CREATE_ANOTHER =~ ^[Yy]$ ]]; then
        echo ""
        get_user_details
        create_user
        display_user_info
        ask_create_another
    fi
}

# Main function
main() {
    echo "🔐 EV Digital Twin - User Creation Tool"
    echo "======================================"
    
    check_aws_cli
    get_user_pool_id
    get_user_details
    create_user
    display_user_info
    ask_create_another
    
    log_success "User creation completed!"
}

# Run main function
main "$@"