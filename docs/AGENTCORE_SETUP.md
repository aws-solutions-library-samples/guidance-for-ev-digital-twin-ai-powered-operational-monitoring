# AgentCore Runtime Setup Guide

This guide explains how to configure the AgentCore Runtime IAM role with the necessary permissions for tire automation and browser tools.

## Overview

When you deploy the AgentCore Runtime, AWS automatically creates an IAM role with base permissions. However, you need to add custom policies for:

- **DynamoDB Access**: Read/write tire order jobs and appointment slots
- **Secrets Manager**: Access NovaAct API key for browser automation
- **S3 Access**: Store browser session recordings

## Prerequisites

1. AgentCore Runtime deployed to your AWS account
2. AWS CLI configured with appropriate credentials
3. Permissions to modify IAM roles

## Option 1: Automated Setup (Recommended)

Run the setup script from the project root:

```bash
chmod +x infrastructure/agentcore-runtime-policies/setup-agentcore-permissions.sh
./infrastructure/agentcore-runtime-policies/setup-agentcore-permissions.sh
```

The script will:
1. Find your AgentCore Runtime role automatically
2. Add all required IAM policies
3. Verify the configuration

## Option 2: Manual Setup

### Step 1: Find Your AgentCore Runtime Role

```bash
aws iam list-roles --query 'Roles[?contains(RoleName, `AmazonBedrockAgentCoreSDKRuntime`)].RoleName' --output text
```

Example output: `AmazonBedrockAgentCoreSDKRuntime-us-east-1-abc123def456`

### Step 2: Add DynamoDB Policy

```bash
aws iam put-role-policy \
  --role-name <YOUR_ROLE_NAME> \
  --policy-name DynamoDBAppointmentAccess \
  --policy-document file://infrastructure/agentcore-runtime-policies/dynamodb-policy.json
```

### Step 3: Add Secrets Manager Policy

```bash
aws iam put-role-policy \
  --role-name <YOUR_ROLE_NAME> \
  --policy-name SecretsManagerNovaActAccess \
  --policy-document file://infrastructure/agentcore-runtime-policies/secrets-manager-policy.json
```

### Step 4: Add S3 Recording Policy

```bash
aws iam put-role-policy \
  --role-name <YOUR_ROLE_NAME> \
  --policy-name S3RecordingPolicy \
  --policy-document file://infrastructure/agentcore-runtime-policies/s3-recording-policy.json
```

## Verify Configuration

Check that all policies were added:

```bash
aws iam list-role-policies --role-name <YOUR_ROLE_NAME>
```

Expected output should include:
- `DynamoDBAppointmentAccess`
- `SecretsManagerNovaActAccess`
- `S3RecordingPolicy`

## Required AWS Resources

Before running the setup, ensure these resources exist:

### 1. DynamoDB Tables
- `tire-order-jobs` (created by tire-automation-stack.yaml)
- `vehicle-appointment-slots` (created by appointment-slots-stack.yaml)

### 2. Secrets Manager Secret
Create the NovaAct API key secret:

```bash
aws secretsmanager create-secret \
  --name /vehicle-maintenance/novaact-api-key \
  --secret-string '{"api_key":"YOUR_NOVAACT_API_KEY"}' \
  --region us-east-1
```

### 3. S3 Bucket
Create the browser recordings bucket:

```bash
aws s3 mb s3://agentcore-browser-tool-recordings --region us-east-1
```

## Troubleshooting

### Role Not Found
**Error**: `AgentCore Runtime role not found`

**Solution**: Deploy the AgentCore Runtime first:
1. Build Docker image: `docker build -t bedrock-agentcore-vehicle_maintenance_agent .`
2. Push to ECR
3. Deploy via Bedrock AgentCore console

### Permission Denied
**Error**: `User is not authorized to perform: iam:PutRolePolicy`

**Solution**: Ensure your AWS credentials have IAM permissions:
```json
{
  "Effect": "Allow",
  "Action": [
    "iam:PutRolePolicy",
    "iam:ListRoles",
    "iam:ListRolePolicies"
  ],
  "Resource": "*"
}
```

### Policy Already Exists
**Error**: `Policy already exists`

**Solution**: This is fine! The policy is already configured. You can update it:
```bash
aws iam put-role-policy --role-name <ROLE_NAME> --policy-name <POLICY_NAME> --policy-document file://<POLICY_FILE>
```

## Policy Details

### DynamoDB Policy
Grants access to:
- `tire-order-jobs` table (job tracking)
- `vehicle-appointment-slots` table (scheduling)

Actions: GetItem, PutItem, UpdateItem, Query, Scan

### Secrets Manager Policy
Grants access to:
- `/vehicle-maintenance/novaact-api-key` secret

Actions: GetSecretValue

### S3 Recording Policy
Grants access to:
- `agentcore-browser-tool-recordings` bucket

Actions: PutObject, GetObject, ListBucket, multipart upload operations

## Next Steps

After configuring permissions:

1. **Test the AgentCore Runtime**:
   ```bash
   python scripts/test_agent_local.py
   ```

2. **Deploy CloudFormation Stacks**:
   ```bash
   aws cloudformation deploy --template-file infrastructure/tire-automation-stack.yaml --stack-name ev-digital-twin-tire-automation --capabilities CAPABILITY_NAMED_IAM
   ```

3. **Test Tire Ordering**:
   - Access the frontend
   - Navigate to Fleet Portal
   - Click "Order Tires" for a vehicle
   - Verify browser automation works

## Support

For issues or questions:
- Check CloudWatch Logs: `/aws/bedrock-agentcore/runtimes/vehicle_maintenance_agent-*`
- Review IAM role policies in AWS Console
- See main README.md for deployment guide
