#!/bin/bash
set -e

echo "🔧 Multi-Agent Orchestrator Permissions Setup"
echo "================================================"
echo ""

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$ACCOUNT_ID" ]; then
    echo "❌ Could not detect AWS account ID. Check your credentials."
    exit 1
fi
echo "🔑 Account: $ACCOUNT_ID"
echo ""

# Find all AgentCore Runtime roles
echo "🔍 Finding AgentCore Runtime roles..."
ROLES=$(aws iam list-roles --query 'Roles[?contains(RoleName, `AmazonBedrockAgentCoreSDKRuntime`)].RoleName' --output text)

if [ -z "$ROLES" ]; then
    echo "❌ No AgentCore Runtime roles found. Deploy agents first."
    exit 1
fi

echo "Found roles:"
for ROLE in $ROLES; do
    echo "  - $ROLE"
done
echo ""

# 1. Add InvokeAgentRuntime permission to the ORCHESTRATOR role
echo "=== Orchestrator: InvokeAgentRuntime permission ==="
ORCHESTRATOR_ROLE_NAME="${ORCHESTRATOR_ROLE_NAME:?ORCHESTRATOR_ROLE_NAME env var must be set (e.g., AmazonBedrockAgentCoreSDKRuntime-us-east-1-XXXXXXXXXX). Find it via 'aws iam list-roles --query \"Roles[?contains(RoleName, \\\`AgentCoreSDKRuntime\\\`)].RoleName\"'}"
ORCH_ROLE=$(aws iam list-roles --query "Roles[?RoleName=='$ORCHESTRATOR_ROLE_NAME'].RoleName" --output text)
if [ -n "$ORCH_ROLE" ]; then
    echo "📝 Adding InvokeAgentRuntime policy to: $ORCH_ROLE"
    aws iam put-role-policy \
        --role-name "$ORCH_ROLE" \
        --policy-name OrchestratorInvokeSpecialists \
        --policy-document file://infrastructure/agentcore-runtime-policies/orchestrator-invoke-policy.json
    echo "✅ Orchestrator can now invoke specialist agents"
else
    echo "⚠️  Orchestrator role not found (looking for $ORCHESTRATOR_ROLE_NAME). Adding to all roles as fallback."
    for ROLE in $ROLES; do
        echo "📝 Adding InvokeAgentRuntime policy to: $ROLE"
        aws iam put-role-policy \
            --role-name "$ROLE" \
            --policy-name OrchestratorInvokeSpecialists \
            --policy-document file://infrastructure/agentcore-runtime-policies/orchestrator-invoke-policy.json
    done
    echo "✅ InvokeAgentRuntime policy added to all roles"
fi
echo ""

# 2. Add existing policies to ALL specialist roles (they need the same permissions as the monolith)
echo "=== Specialist Agents: Service permissions ==="
for ROLE in $ROLES; do
    echo ""
    echo "📝 Configuring: $ROLE"

    # DynamoDB (all specialists need this for data access)
    aws iam put-role-policy \
        --role-name "$ROLE" \
        --policy-name DynamoDBAppointmentAccess \
        --policy-document file://infrastructure/agentcore-runtime-policies/dynamodb-policy.json 2>/dev/null && echo "  ✅ DynamoDB" || echo "  ⚠️  DynamoDB (may already exist)"

    # Knowledge Base (tire, motor, inverter specialists)
    aws iam put-role-policy \
        --role-name "$ROLE" \
        --policy-name KnowledgeBaseAccessPolicy \
        --policy-document file://infrastructure/agentcore-runtime-policies/knowledge-base-policy.json 2>/dev/null && echo "  ✅ Knowledge Base" || echo "  ⚠️  Knowledge Base (may already exist)"

    # Secrets Manager (tire specialist for NovaAct)
    aws iam put-role-policy \
        --role-name "$ROLE" \
        --policy-name SecretsManagerNovaActAccess \
        --policy-document file://infrastructure/agentcore-runtime-policies/secrets-manager-policy.json 2>/dev/null && echo "  ✅ Secrets Manager" || echo "  ⚠️  Secrets Manager (may already exist)"

    # S3 (tire specialist for browser recordings)
    aws iam put-role-policy \
        --role-name "$ROLE" \
        --policy-name S3RecordingPolicy \
        --policy-document file://infrastructure/agentcore-runtime-policies/s3-recording-policy.json 2>/dev/null && echo "  ✅ S3 Recordings" || echo "  ⚠️  S3 (may already exist)"

    # Browser Tool (tire specialist)
    aws iam put-role-policy \
        --role-name "$ROLE" \
        --policy-name CustomBrowserToolPolicy \
        --policy-document file://infrastructure/agentcore-runtime-policies/browser-tool-policy.json 2>/dev/null && echo "  ✅ Browser Tool" || echo "  ⚠️  Browser Tool (may already exist)"
done

echo ""
echo "🎉 Multi-agent permissions configured!"
echo ""
echo "Summary:"
echo "  ✅ Orchestrator can invoke all specialist agent runtimes"
echo "  ✅ All specialists have DynamoDB, KB, Secrets Manager, S3, Browser Tool access"
echo ""
echo "Next step: Update Lambda proxy AGENT_RUNTIME_ARN to the orchestrator ARN"
