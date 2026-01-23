#!/bin/bash
set -e

echo "🔧 AgentCore Runtime Permissions Setup"
echo "========================================"
echo ""

# Find AgentCore Runtime role
echo "🔍 Finding AgentCore Runtime role..."
ROLES=$(aws iam list-roles --query 'Roles[?contains(RoleName, `AmazonBedrockAgentCoreSDKRuntime`)].RoleName' --output text)

# Convert to array
ROLE_ARRAY=($ROLES)

if [ ${#ROLE_ARRAY[@]} -eq 0 ]; then
  echo "❌ AgentCore Runtime role not found!"
  echo ""
  echo "Please deploy the AgentCore Runtime first:"
  echo "  1. Build Docker image: docker build -t bedrock-agentcore-vehicle_maintenance_agent ."
  echo "  2. Push to ECR"
  echo "  3. Deploy via Bedrock AgentCore console"
  echo ""
  exit 1
elif [ ${#ROLE_ARRAY[@]} -gt 1 ]; then
  echo "⚠️  Found multiple AgentCore Runtime roles:"
  for i in "${!ROLE_ARRAY[@]}"; do
    echo "  $((i+1)). ${ROLE_ARRAY[$i]}"
  done
  echo ""
  echo "Which role should be configured? (enter number or press Enter for most recent)"
  read -r choice
  
  if [ -z "$choice" ]; then
    # Use last role (most recent)
    ROLE_NAME="${ROLE_ARRAY[-1]}"
  else
    ROLE_NAME="${ROLE_ARRAY[$((choice-1))]}"
  fi
else
  ROLE_NAME="${ROLE_ARRAY[0]}"
fi

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

# Add Browser Tool policy
echo "📝 Adding Browser Tool access policy..."
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name CustomBrowserToolPolicy \
  --policy-document file://infrastructure/agentcore-runtime-policies/browser-tool-policy.json

echo "✅ Browser Tool policy added"

# Add Knowledge Base policy
echo "📝 Adding Knowledge Base access policy..."
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name KnowledgeBaseAccessPolicy \
  --policy-document file://infrastructure/agentcore-runtime-policies/knowledge-base-policy.json

echo "✅ Knowledge Base policy added"

echo ""
echo "🎉 All permissions configured successfully!"
echo ""
echo "AgentCore Runtime role '$ROLE_NAME' now has:"
echo "  ✅ DynamoDB access (tire-order-jobs, appointment-slots)"
echo "  ✅ Secrets Manager access (NovaAct API key)"
echo "  ✅ S3 access (browser session recordings)"
echo "  ✅ Browser Tool access (custom browser tool)"
echo "  ✅ Knowledge Base access (Bedrock KB)"
echo ""
