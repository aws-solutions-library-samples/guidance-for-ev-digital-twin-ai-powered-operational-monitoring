#!/bin/bash

# Setup script for Tire Order Worker Lambda
# This creates the IAM role, DynamoDB table, and Lambda function

set -e

REGION="us-east-1"
ROLE_NAME="ev-digital-twin-tire-order-worker-role"
LAMBDA_NAME="ev-digital-twin-tire-order-worker"
TABLE_NAME="tire-order-jobs"

echo "🚀 Setting up Tire Order Worker infrastructure..."

# Step 1: Create DynamoDB table
echo ""
echo "📊 Creating DynamoDB table: $TABLE_NAME"
aws dynamodb create-table \
  --table-name $TABLE_NAME \
  --attribute-definitions AttributeName=job_id,AttributeType=S \
  --key-schema AttributeName=job_id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --tags Key=Project,Value=EV-Digital-Twin Key=Component,Value=TireOrderWorker \
  2>/dev/null || echo "⚠️  Table already exists, skipping..."

# Enable TTL on the table
echo "⏰ Enabling TTL on $TABLE_NAME..."
aws dynamodb update-time-to-live \
  --table-name $TABLE_NAME \
  --time-to-live-specification "Enabled=true, AttributeName=ttl" \
  --region $REGION \
  2>/dev/null || echo "⚠️  TTL already enabled, skipping..."

# Step 2: Create IAM role
echo ""
echo "🔐 Creating IAM role: $ROLE_NAME"
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file://infrastructure/tire-order-worker-trust-policy.json \
  --description "Execution role for tire order worker Lambda" \
  2>/dev/null || echo "⚠️  Role already exists, skipping..."

# Step 3: Attach inline policy to role
echo "📋 Attaching permissions policy to role..."
aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name TireOrderWorkerPolicy \
  --policy-document file://infrastructure/tire-order-worker-role-policy.json

echo ""
echo "⏳ Waiting 10 seconds for IAM role to propagate..."
sleep 10

# Get the role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
echo "✅ Role ARN: $ROLE_ARN"

echo ""
echo "✅ Infrastructure setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Package your Lambda code:"
echo "   cd /path/to/your/code"
echo "   zip -r tire-order-worker.zip tire_order_worker.py agentcore_maintenance_agent.py agentcore_runtime_app.py knowledge-base/knowledge_base_tools.py"
echo ""
echo "2. Create the Lambda function:"
echo "   aws lambda create-function \\"
echo "     --function-name $LAMBDA_NAME \\"
echo "     --runtime python3.11 \\"
echo "     --role $ROLE_ARN \\"
echo "     --handler tire_order_worker.lambda_handler \\"
echo "     --zip-file fileb://tire-order-worker.zip \\"
echo "     --timeout 900 \\"
echo "     --memory-size 2048 \\"
echo "     --region $REGION \\"
echo "     --environment Variables={NOVAACT_API_KEY_SECRET_NAME=novaact-api-key}"
echo ""
echo "3. Update your proxy Lambda to add Lambda invoke permission"
echo ""
