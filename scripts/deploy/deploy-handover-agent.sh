#!/bin/bash
# Deploy AgentCore Maintenance Agent to Handover Account
# This script builds and deploys the agent with all required environment variables

set -e

echo "🚀 Deploying AgentCore Maintenance Agent to Handover Account"
echo ""

# Configuration for Handover Account (844874421931)
BROWSER_TOOL_ID="vehicle_tire_order_tool-x0Jx5FieZc"
KNOWLEDGE_BASE_ID="5CZPTMJB9R"  # Handover account knowledge base
GUARDRAIL_ID="ujynf1g70rnt"  # Handover guardrail ID
GUARDRAIL_VERSION="1"
MEMORY_ID="vehicle_maintenance_agent_mem-BriFmNCg0Q"

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 Account ID: $ACCOUNT_ID"

if [ "$ACCOUNT_ID" != "844874421931" ]; then
    echo "⚠️  Warning: Expected handover account (844874421931) but got $ACCOUNT_ID"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Navigate to agent directory
cd agents/maintenance-agent

echo ""
echo "🔧 Building Docker image with environment variables..."
echo "   BROWSER_TOOL_ID: $BROWSER_TOOL_ID"
echo "   GUARDRAIL_ID: $GUARDRAIL_ID"
echo "   GUARDRAIL_VERSION: $GUARDRAIL_VERSION"
echo "   MEMORY_ID: $MEMORY_ID"

# Login to ECR
echo ""
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# Build Docker image with all build args
echo ""
echo "🏗️  Building Docker image..."
docker buildx build --platform linux/arm64 \
  --build-arg BROWSER_TOOL_ID=$BROWSER_TOOL_ID \
  --build-arg KNOWLEDGE_BASE_ID=$KNOWLEDGE_BASE_ID \
  --build-arg BEDROCK_GUARDRAIL_ID=$GUARDRAIL_ID \
  --build-arg BEDROCK_GUARDRAIL_VERSION=$GUARDRAIL_VERSION \
  --build-arg AGENTCORE_MEMORY_ID=$MEMORY_ID \
  -t bedrock-agentcore-vehicle_maintenance_agent:latest .

# Tag for ECR
echo ""
echo "🏷️  Tagging image..."
docker tag bedrock-agentcore-vehicle_maintenance_agent:latest \
  ${ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest

# Push to ECR
echo ""
echo "📤 Pushing to ECR..."
docker push ${ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest

echo ""
echo "✅ Docker image deployed successfully!"
echo ""
echo "📋 Next Steps:"
echo "   1. Go to Bedrock AgentCore Console"
echo "   2. Find runtime: vehicle_maintenance_agent-3R5q196E7Q"
echo "   3. Click 'Update Hosting' to pull the new image"
echo "   4. Wait for runtime to restart (~2-3 minutes)"
echo "   5. Test tire ordering from Fleet Portal"
echo ""
echo "🧪 To verify browser tool configuration:"
echo "   cd ../../scripts"
echo "   python check_browser_tool_config.py"
echo ""
