#!/bin/bash

# Knowledge Base Setup Script for EV Digital Twin
# This script automates the creation of AWS Bedrock Knowledge Base

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGION="${AWS_REGION:?AWS_REGION env var must be set (e.g., us-east-1)}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="ev-digital-twin-knowledge-base-${ACCOUNT_ID}"
KB_NAME="ev-digital-twin-maintenance-kb"

echo -e "${GREEN}🚀 Setting up Knowledge Base for EV Digital Twin${NC}"
echo "Account: ${ACCOUNT_ID}"
echo "Region: ${REGION}"
echo "Bucket: ${BUCKET_NAME}"
echo ""

# Step 1: Create S3 bucket
echo -e "${YELLOW}📦 Creating S3 bucket for documents...${NC}"
if aws s3 ls "s3://${BUCKET_NAME}" 2>/dev/null; then
    echo "✅ Bucket already exists: ${BUCKET_NAME}"
else
    aws s3 mb "s3://${BUCKET_NAME}" --region ${REGION}
    aws s3api put-bucket-versioning \
        --bucket "${BUCKET_NAME}" \
        --versioning-configuration Status=Enabled
    echo "✅ Created bucket: ${BUCKET_NAME}"
fi

# Step 2: Upload manual documents
echo -e "${YELLOW}📚 Uploading manual documents...${NC}"
if [ -f "manuals/Electric Vehicle Preventive Maintenance Manual.pdf" ]; then
    aws s3 cp "manuals/Electric Vehicle Preventive Maintenance Manual.pdf" \
        "s3://${BUCKET_NAME}/manuals/"
    echo "✅ Uploaded EV Preventive Maintenance Manual"
else
    echo -e "${RED}❌ Manual not found: manuals/Electric Vehicle Preventive Maintenance Manual.pdf${NC}"
    exit 1
fi

# Step 3: Check if Knowledge Base already exists
echo -e "${YELLOW}🔍 Checking for existing Knowledge Base...${NC}"
KB_ID=$(aws bedrock-agent list-knowledge-bases \
    --query "knowledgeBaseSummaries[?name=='${KB_NAME}'].knowledgeBaseId" \
    --output text 2>/dev/null || echo "")

if [ -n "$KB_ID" ] && [ "$KB_ID" != "None" ]; then
    echo "✅ Knowledge Base already exists: ${KB_ID}"
else
    echo -e "${RED}⚠️  Knowledge Base creation requires manual setup in AWS Console${NC}"
    echo ""
    echo "Please follow these steps:"
    echo "1. Open Bedrock Console: https://console.aws.amazon.com/bedrock/"
    echo "2. Navigate to Knowledge Bases → Create Knowledge Base"
    echo "3. Use these settings:"
    echo "   - Name: ${KB_NAME}"
    echo "   - S3 URI: s3://${BUCKET_NAME}/manuals/"
    echo "   - Embeddings: amazon.titan-embed-text-v1"
    echo ""
    echo "After creation, run this script again to get the Knowledge Base ID"
    exit 0
fi

# Step 4: Update backend stack with Knowledge Base ID
echo -e "${YELLOW}🔧 Updating backend stack with Knowledge Base ID...${NC}"

# Check if backend stack exists
if aws cloudformation describe-stacks --stack-name ev-digital-twin-backend >/dev/null 2>&1; then
    echo "Knowledge Base ID: ${KB_ID}"
    echo ""
    echo "To enable Knowledge Base in your deployment:"
    echo "1. Add this environment variable to your ECS task definition:"
    echo "   KNOWLEDGE_BASE_ID=${KB_ID}"
    echo ""
    echo "2. Add Knowledge Base permissions to your ECS TaskRole:"
    echo "   - bedrock:Retrieve"
    echo "   - bedrock:RetrieveAndGenerate"
    echo ""
    echo "3. Restart your ECS service to pick up the changes"
    echo ""
    echo -e "${GREEN}✅ Knowledge Base setup complete!${NC}"
else
    echo -e "${RED}❌ Backend stack not found: ev-digital-twin-backend${NC}"
    echo "Please deploy the backend stack first"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Knowledge Base setup completed successfully!${NC}"
echo "Knowledge Base ID: ${KB_ID}"
echo ""
echo "Next steps:"
echo "1. Update your ECS task definition with KNOWLEDGE_BASE_ID=${KB_ID}"
echo "2. Add Knowledge Base permissions to TaskRole"
echo "3. Restart ECS service"
echo "4. Test with: curl -X POST YOUR_ALB_URL/agentcore -d '{\"prompt\":\"get_tire_maintenance_guidance(tire pressure)\"}'"