#!/bin/bash
# Deploy a specialist agent to AgentCore Runtime
# Usage: ./deploy-agent.sh <agent-directory>
# Example: ./deploy-agent.sh tire-specialist-agent
#
# Config: Create agents/.env.agent with your account-specific values:
#   KNOWLEDGE_BASE_ID=your-kb-id
#   BROWSER_TOOL_ID=your-browser-tool-id
#   AGENTCORE_MEMORY_ID=your-memory-id
#   BEDROCK_GUARDRAIL_ID=your-guardrail-id

set -e

AGENT_DIR="${1:?Usage: ./deploy-agent.sh <agent-directory>}"
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -d "$SCRIPT_DIR/$AGENT_DIR" ]; then
    echo "❌ Agent directory not found: $SCRIPT_DIR/$AGENT_DIR"
    exit 1
fi

# Auto-detect AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$ACCOUNT_ID" ]; then
    echo "❌ Could not detect AWS account ID. Check your credentials."
    exit 1
fi
echo "🔑 Using AWS account: $ACCOUNT_ID"

# Load config from .env.agent if it exists
if [ -f "$SCRIPT_DIR/.env.agent" ]; then
    echo "📋 Loading config from .env.agent"
    export $(grep -v '^#' "$SCRIPT_DIR/.env.agent" | grep -v '^$' | xargs)
fi

echo "🚀 Deploying $AGENT_DIR..."

# Copy shared module into agent directory for Docker build
echo "📦 Copying shared module..."
cp -r "$SCRIPT_DIR/shared/" "$SCRIPT_DIR/$AGENT_DIR/shared/"

# Inject env vars into Dockerfile temporarily for build
cd "$SCRIPT_DIR/$AGENT_DIR"
cp Dockerfile Dockerfile.bak

# Replace empty defaults with values from .env.agent
[ -n "$KNOWLEDGE_BASE_ID" ] && sed -i '' "s|KNOWLEDGE_BASE_ID=\${KNOWLEDGE_BASE_ID:-}|KNOWLEDGE_BASE_ID=\${KNOWLEDGE_BASE_ID:-$KNOWLEDGE_BASE_ID}|g" Dockerfile
[ -n "$BROWSER_TOOL_ID" ] && sed -i '' "s|BROWSER_TOOL_ID=\${BROWSER_TOOL_ID:-}|BROWSER_TOOL_ID=\${BROWSER_TOOL_ID:-$BROWSER_TOOL_ID}|g" Dockerfile
[ -n "$AGENTCORE_MEMORY_ID" ] && sed -i '' "s|AGENTCORE_MEMORY_ID=\${AGENTCORE_MEMORY_ID:-}|AGENTCORE_MEMORY_ID=\${AGENTCORE_MEMORY_ID:-$AGENTCORE_MEMORY_ID}|g" Dockerfile
[ -n "$BEDROCK_GUARDRAIL_ID" ] && sed -i '' "s|BEDROCK_GUARDRAIL_ID=\${BEDROCK_GUARDRAIL_ID:-}|BEDROCK_GUARDRAIL_ID=\${BEDROCK_GUARDRAIL_ID:-$BEDROCK_GUARDRAIL_ID}|g" Dockerfile
[ -n "$TIRE_AGENT_ARN" ] && sed -i '' "s|TIRE_AGENT_ARN=\${TIRE_AGENT_ARN:-}|TIRE_AGENT_ARN=\${TIRE_AGENT_ARN:-$TIRE_AGENT_ARN}|g" Dockerfile
[ -n "$MOTOR_AGENT_ARN" ] && sed -i '' "s|MOTOR_AGENT_ARN=\${MOTOR_AGENT_ARN:-}|MOTOR_AGENT_ARN=\${MOTOR_AGENT_ARN:-$MOTOR_AGENT_ARN}|g" Dockerfile
[ -n "$INVERTER_AGENT_ARN" ] && sed -i '' "s|INVERTER_AGENT_ARN=\${INVERTER_AGENT_ARN:-}|INVERTER_AGENT_ARN=\${INVERTER_AGENT_ARN:-$INVERTER_AGENT_ARN}|g" Dockerfile
[ -n "$FLEET_AGENT_ARN" ] && sed -i '' "s|FLEET_AGENT_ARN=\${FLEET_AGENT_ARN:-}|FLEET_AGENT_ARN=\${FLEET_AGENT_ARN:-$FLEET_AGENT_ARN}|g" Dockerfile

# Set account ID in yaml
sed -i '' "s/account: null/account: \"$ACCOUNT_ID\"/" .bedrock_agentcore.yaml 2>/dev/null || true

# Deploy
agentcore launch --local-build

# Restore clean Dockerfile and yaml
mv Dockerfile.bak Dockerfile
sed -i '' "s/account: \"$ACCOUNT_ID\"/account: null/" .bedrock_agentcore.yaml 2>/dev/null || true

# Cleanup shared copy
echo "🧹 Cleaning up..."
rm -rf "$SCRIPT_DIR/$AGENT_DIR/shared/"

echo "✅ $AGENT_DIR deployed!"
