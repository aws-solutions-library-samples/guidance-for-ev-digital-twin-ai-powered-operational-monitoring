#!/bin/bash
# Simplified deployment script for AgentCore agents
#
# Required environment variables (set before running):
#   AWS_REGION             - AWS region for AgentCore CodeBuild (e.g., us-east-1)
#   CODEBUILD_ROLE_NAME    - IAM role name for the AgentCore CodeBuild project
#                            (e.g., AmazonBedrockAgentCoreSDKCodeBuild-us-east-1-XXXXXXXXXX)
#
# Example:
#   export AWS_REGION=us-east-1
#   export CODEBUILD_ROLE_NAME=AmazonBedrockAgentCoreSDKCodeBuild-us-east-1-abc123
#   ./deploy_codebuild.sh

set -e

echo "🚀 Deploying AgentCore Agents"
echo ""

AWS_REGION="${AWS_REGION:?AWS_REGION env var must be set (e.g., us-east-1)}"
CODEBUILD_ROLE_NAME="${CODEBUILD_ROLE_NAME:?CODEBUILD_ROLE_NAME env var must be set}"

# Check AWS credentials
aws sts get-caller-identity > /dev/null || {
    echo "❌ AWS credentials not configured"
    exit 1
}

# Check ECR permissions
echo "Checking IAM permissions..."
aws iam get-role-policy \
    --role-name "$CODEBUILD_ROLE_NAME" \
    --policy-name ECRPushPolicy \
    --region "$AWS_REGION" > /dev/null 2>&1 || {
    echo "⚠️  ECR push permissions not found. Adding..."
    aws iam put-role-policy \
        --role-name "$CODEBUILD_ROLE_NAME" \
        --policy-name ECRPushPolicy \
        --policy-document file://ecr-push-policy.json \
        --region "$AWS_REGION"
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
