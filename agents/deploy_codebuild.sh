#!/bin/bash
# Simplified deployment script for AgentCore agents
set -e

echo "🚀 Deploying AgentCore Agents"
echo ""

# Check AWS credentials
aws sts get-caller-identity > /dev/null || {
    echo "❌ AWS credentials not configured"
    exit 1
}

# Check ECR permissions
echo "Checking IAM permissions..."
aws iam get-role-policy \
    --role-name AmazonBedrockAgentCoreSDKCodeBuild-us-east-1-cdd8445f6e \
    --policy-name ECRPushPolicy \
    --region us-east-1 > /dev/null 2>&1 || {
    echo "⚠️  ECR push permissions not found. Adding..."
    aws iam put-role-policy \
        --role-name AmazonBedrockAgentCoreSDKCodeBuild-us-east-1-cdd8445f6e \
        --policy-name ECRPushPolicy \
        --policy-document file://ecr-push-policy.json \
        --region us-east-1
    echo "✅ ECR permissions added"
}

# Deploy Appointment Scheduler
echo ""
echo "Deploying Appointment Scheduler..."
cd appointment_scheduler_agent
bedrock-agentcore launch
cd ..

# Deploy Tire Ordering
echo ""
echo "Deploying Tire Ordering..."
cd tire_ordering_agent
bedrock-agentcore launch
cd ..

echo ""
echo "✅ Deployment complete! See deployment_arns.txt for ARNs"
