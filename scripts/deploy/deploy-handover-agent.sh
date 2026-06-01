#!/bin/bash
# Deploy AgentCore Maintenance Agent to a target account
# This script builds and deploys the agent with all required environment variables
#
# Required environment variables (set before running):
#   BROWSER_TOOL_ID            - AgentCore Browser Tool ID (e.g., vehicle_tire_order_tool-XXXX)
#   KNOWLEDGE_BASE_ID          - Bedrock Knowledge Base ID for the target account
#   GUARDRAIL_ID               - Bedrock Guardrail ID
#   GUARDRAIL_VERSION          - Bedrock Guardrail version (default: 1)
#   MEMORY_ID                  - AgentCore Memory ID (e.g., vehicle_maintenance_agent_mem-XXXX)
#   AGENT_RUNTIME_ID           - AgentCore Runtime ID for "Update Hosting" instructions
#                                (e.g., vehicle_maintenance_agent-XXXX)
#   AWS_REGION                 - AWS region (default: us-east-1)
#   EXPECTED_ACCOUNT_ID        - (Optional) Expected AWS account ID for safety check
#
# Example:
#   export BROWSER_TOOL_ID=vehicle_tire_order_tool-abc123
#   export KNOWLEDGE_BASE_ID=ABCDEF1234
#   export GUARDRAIL_ID=xyz789
#   export GUARDRAIL_VERSION=1
#   export MEMORY_ID=vehicle_maintenance_agent_mem-abc123
#   export AGENT_RUNTIME_ID=vehicle_maintenance_agent-abc123
#   ./scripts/deploy/deploy-handover-agent.sh

set -e

echo "🚀 Deploying AgentCore Maintenance Agent"
echo ""

# Validate required environment variables
BROWSER_TOOL_ID="${BROWSER_TOOL_ID:?BROWSER_TOOL_ID env var must be set}"
KNOWLEDGE_BASE_ID="${KNOWLEDGE_BASE_ID:?KNOWLEDGE_BASE_ID env var must be set}"
GUARDRAIL_ID="${GUARDRAIL_ID:?GUARDRAIL_ID env var must be set}"
GUARDRAIL_VERSION="${GUARDRAIL_VERSION:-1}"
MEMORY_ID="${MEMORY_ID:?MEMORY_ID env var must be set}"
AGENT_RUNTIME_ID="${AGENT_RUNTIME_ID:?AGENT_RUNTIME_ID env var must be set}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 Account ID: $ACCOUNT_ID"

if [ -n "${EXPECTED_ACCOUNT_ID:-}" ] && [ "$ACCOUNT_ID" != "$EXPECTED_ACCOUNT_ID" ]; then
    echo "⚠️  Warning: Expected account ($EXPECTED_ACCOUNT_ID) but got $ACCOUNT_ID"
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
echo "   KNOWLEDGE_BASE_ID: $KNOWLEDGE_BASE_ID"
echo "   GUARDRAIL_ID: $GUARDRAIL_ID"
echo "   GUARDRAIL_VERSION: $GUARDRAIL_VERSION"
echo "   MEMORY_ID: $MEMORY_ID"
echo "   AGENT_RUNTIME_ID: $AGENT_RUNTIME_ID"
echo "   AWS_REGION: $AWS_REGION"

# Login to ECR
echo ""
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Build Docker image with all build args
echo ""
echo "🏗️  Building Docker image..."
docker buildx build --platform linux/arm64 \
  --build-arg BROWSER_TOOL_ID="$BROWSER_TOOL_ID" \
  --build-arg KNOWLEDGE_BASE_ID="$KNOWLEDGE_BASE_ID" \
  --build-arg BEDROCK_GUARDRAIL_ID="$GUARDRAIL_ID" \
  --build-arg BEDROCK_GUARDRAIL_VERSION="$GUARDRAIL_VERSION" \
  --build-arg AGENTCORE_MEMORY_ID="$MEMORY_ID" \
  -t bedrock-agentcore-vehicle_maintenance_agent:latest .

# Tag for ECR
echo ""
echo "🏷️  Tagging image..."
docker tag bedrock-agentcore-vehicle_maintenance_agent:latest \
  "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest"

# Push to ECR
echo ""
echo "📤 Pushing to ECR..."
docker push "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest"

echo ""
echo "✅ Docker image deployed successfully!"
echo ""
echo "📋 Next Steps:"
echo "   1. Go to Bedrock AgentCore Console"
echo "   2. Find runtime: $AGENT_RUNTIME_ID"
echo "   3. Click 'Update Hosting' to pull the new image"
echo "   4. Wait for runtime to restart (~2-3 minutes)"
echo "   5. Test tire ordering from Fleet Portal"
echo ""
echo "🧪 To verify browser tool configuration:"
echo "   cd ../../scripts"
echo "   python check_browser_tool_config.py"
echo ""
