#!/bin/bash

# Deploy Tire Automation Stack
# This script deploys the complete tire automation infrastructure including:
# - DynamoDB table for job tracking
# - Worker Lambda function
# - IAM roles and permissions
#
# Usage: ./deploy-tire-automation.sh [--update-lambda-only]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="ev-digital-twin-tire-automation"
REGION="us-east-1"
PROJECT_NAME="ev-digital-twin"

echo -e "${BLUE}🚀 EV Digital Twin - Tire Automation Deployment${NC}"
echo ""

# Check if we're doing a Lambda-only update
UPDATE_LAMBDA_ONLY=false
if [[ "$1" == "--update-lambda-only" ]]; then
    UPDATE_LAMBDA_ONLY=true
    echo -e "${YELLOW}📝 Lambda-only update mode${NC}"
fi

# Step 1: Get AgentCore Runtime ARN
echo -e "${BLUE}🔍 Step 1: Detecting AgentCore Runtime...${NC}"

# Try to get runtime from CloudFormation stack output first
RUNTIME_ARN=$(aws cloudformation describe-stacks \
    --stack-name agentcore-runtime-stack \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`RuntimeArn`].OutputValue' \
    --output text 2>/dev/null || echo "")

# If not found in stack, list runtimes and let user choose
if [[ -z "$RUNTIME_ARN" || "$RUNTIME_ARN" == "None" ]]; then
    echo -e "${YELLOW}⚠️  Runtime ARN not found in CloudFormation stack${NC}"
    echo -e "${BLUE}📋 Available AgentCore Runtimes:${NC}"
    
    # List all runtimes
    aws bedrock-agentcore list-runtimes --region $REGION \
        --query 'runtimes[*].[name,runtimeId,status]' \
        --output table
    
    echo ""
    echo -e "${YELLOW}Please enter the Runtime ID (e.g., vehicle_maintenance_agent-3R5q196E7Q):${NC}"
    read -r RUNTIME_ID
    
    # Get account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    # Construct ARN
    RUNTIME_ARN="arn:aws:bedrock-agentcore:${REGION}:${ACCOUNT_ID}:runtime/${RUNTIME_ID}"
    echo -e "${GREEN}✅ Using Runtime ARN: ${RUNTIME_ARN}${NC}"
else
    echo -e "${GREEN}✅ Found Runtime ARN: ${RUNTIME_ARN}${NC}"
fi

echo ""

# Step 2: Deploy or Update Lambda
if [[ "$UPDATE_LAMBDA_ONLY" == true ]]; then
    echo -e "${BLUE}🔄 Step 2: Updating Worker Lambda only...${NC}"
    
    # Update Lambda environment variable
    aws lambda update-function-configuration \
        --function-name ${PROJECT_NAME}-tire-order-worker \
        --environment Variables={AGENT_RUNTIME_ARN=${RUNTIME_ARN}} \
        --region $REGION
    
    echo -e "${GREEN}✅ Lambda environment updated${NC}"
    echo ""
    
    # Update Lambda code
    echo -e "${BLUE}📦 Packaging Lambda code...${NC}"
    rm -rf lambda-package
    mkdir -p lambda-package
    cp infrastructure/lambda/tire_order_worker.py lambda-package/
    cd lambda-package
    zip -r ../tire-order-worker.zip . -q
    cd ..
    
    echo -e "${BLUE}☁️  Deploying Lambda code...${NC}"
    aws lambda update-function-code \
        --function-name ${PROJECT_NAME}-tire-order-worker \
        --zip-file fileb://tire-order-worker.zip \
        --region $REGION
    
    echo -e "${BLUE}⏳ Waiting for Lambda to update...${NC}"
    aws lambda wait function-updated \
        --function-name ${PROJECT_NAME}-tire-order-worker \
        --region $REGION
    
    # Cleanup
    rm -rf lambda-package tire-order-worker.zip
    
    echo -e "${GREEN}✅ Worker Lambda updated successfully!${NC}"
else
    # Full stack deployment
    echo -e "${BLUE}🏗️  Step 2: Deploying CloudFormation Stack...${NC}"
    
    # Extract Runtime ID from ARN
    RUNTIME_ID=$(echo $RUNTIME_ARN | awk -F'/' '{print $NF}')
    
    # Check if stack exists
    STACK_EXISTS=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION 2>/dev/null || echo "")
    
    if [[ -z "$STACK_EXISTS" ]]; then
        echo -e "${YELLOW}📝 Creating new stack...${NC}"
        aws cloudformation create-stack \
            --stack-name $STACK_NAME \
            --template-body file://infrastructure/tire-automation-stack.yaml \
            --parameters \
                ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME \
                ParameterKey=AgentCoreRuntimeId,ParameterValue=$RUNTIME_ID \
            --capabilities CAPABILITY_NAMED_IAM \
            --region $REGION
        
        echo -e "${BLUE}⏳ Waiting for stack creation...${NC}"
        aws cloudformation wait stack-create-complete \
            --stack-name $STACK_NAME \
            --region $REGION
    else
        echo -e "${YELLOW}🔄 Updating existing stack...${NC}"
        aws cloudformation update-stack \
            --stack-name $STACK_NAME \
            --template-body file://infrastructure/tire-automation-stack.yaml \
            --parameters \
                ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME \
                ParameterKey=AgentCoreRuntimeId,ParameterValue=$RUNTIME_ID \
            --capabilities CAPABILITY_NAMED_IAM \
            --region $REGION 2>&1 | grep -v "No updates are to be performed" || true
        
        echo -e "${BLUE}⏳ Waiting for stack update...${NC}"
        aws cloudformation wait stack-update-complete \
            --stack-name $STACK_NAME \
            --region $REGION 2>/dev/null || echo -e "${YELLOW}Stack update completed or no changes needed${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}📦 Step 3: Updating Lambda Code...${NC}"
    
    # Package and deploy Lambda code
    rm -rf lambda-package
    mkdir -p lambda-package
    cp infrastructure/lambda/tire_order_worker.py lambda-package/
    cd lambda-package
    zip -r ../tire-order-worker.zip . -q
    cd ..
    
    aws lambda update-function-code \
        --function-name ${PROJECT_NAME}-tire-order-worker \
        --zip-file fileb://tire-order-worker.zip \
        --region $REGION
    
    echo -e "${BLUE}⏳ Waiting for Lambda to update...${NC}"
    aws lambda wait function-updated \
        --function-name ${PROJECT_NAME}-tire-order-worker \
        --region $REGION
    
    # Cleanup
    rm -rf lambda-package tire-order-worker.zip
    
    echo -e "${GREEN}✅ Stack deployed successfully!${NC}"
fi

echo ""
echo -e "${BLUE}📊 Step 3: Deployment Summary${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Get stack outputs
if [[ "$UPDATE_LAMBDA_ONLY" == false ]]; then
    aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table
fi

# Show Lambda configuration
echo ""
echo -e "${BLUE}Lambda Configuration:${NC}"
aws lambda get-function-configuration \
    --function-name ${PROJECT_NAME}-tire-order-worker \
    --region $REGION \
    --query '{Name:FunctionName,Runtime:Runtime,Timeout:Timeout,Memory:MemorySize,RuntimeARN:Environment.Variables.AGENT_RUNTIME_ARN}' \
    --output table

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test the tire ordering workflow from the Fleet Portal"
echo "2. Check CloudWatch Logs: /aws/lambda/${PROJECT_NAME}-tire-order-worker"
echo "3. Monitor DynamoDB table: tire-order-jobs"
echo ""
echo -e "${BLUE}Quick Commands:${NC}"
echo "  Update Lambda only:  ./deploy-tire-automation.sh --update-lambda-only"
echo "  View logs:           aws logs tail /aws/lambda/${PROJECT_NAME}-tire-order-worker --follow"
echo "  Check DynamoDB:      aws dynamodb scan --table-name tire-order-jobs --region $REGION"
echo ""
