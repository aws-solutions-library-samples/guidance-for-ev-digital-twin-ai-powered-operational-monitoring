#!/bin/bash
set -e

echo "🔧 AgentCore Runtime Permissions Setup"
echo "========================================"
echo ""

# Find AgentCore Runtime role
echo "🔍 Finding AgentCore Runtime role..."
ROLE_NAME=$(aws iam list-roles --query 'Roles[?contains(RoleName, `AmazonBedrockAgentCoreSDKRuntime`)].RoleName' --output text | head -1)

if [ -z "$ROLE_NAME" ]; then
  echo "❌ AgentCore Runtime role not found!"
  echo ""
  echo "Please deploy the AgentCore Runtime first:"
  echo "  1. Build Docker image: docker build -t bedrock-agentcore-vehicle_maintenance_agent ."
  echo "  2. Push to ECR"
  echo "  3. Deploy via Bedrock AgentCore console"
  echo ""
  exit 1
fi

echo "✅ Found role: $ROLE_NAME"
echo ""

# Add DynamoDB policy
echo "📝 Adding DynamoDB access policy..."
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name DynamoDBAppointmentAccess \
  --policy-document file://infrastructure/agentcore-runtime-policies/dynamodb-policy.json

echo "✅ DynamoDB policy added"

# Add Secrets Manager policy
echo "📝 Adding Secrets Manager access policy..."
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name SecretsManagerNovaActAccess \
  --policy-document file://infrastructure/agentcore-runtime-policies/secrets-manager-policy.json

echo "✅ Secrets Manager policy added"

# Add S3 policy
echo "📝 Adding S3 recording access policy..."
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name S3RecordingPolicy \
  --policy-document file://infrastructure/agentcore-runtime-policies/s3-recording-policy.json

echo "✅ S3 policy added"

echo ""
echo "🎉 All permissions configured successfully!"
echo ""
echo "AgentCore Runtime role '$ROLE_NAME' now has:"
echo "  ✅ DynamoDB access (tire-order-jobs, appointment-slots)"
echo "  ✅ Secrets Manager access (NovaAct API key)"
echo "  ✅ S3 access (browser session recordings)"
echo ""
