# IAM Policies for AgentCore Runtime

This document describes the IAM policies required for the AgentCore execution role. These policies grant the containerized agent access to AWS services needed for vehicle maintenance operations.

## AgentCore Execution Role

**Role Name Pattern:** `AmazonBedrockAgentCoreSDKRuntime-us-east-1-{random-suffix}`

**Location:** The role ARN is stored in `.bedrock_agentcore.yaml` after running `bedrock-agentcore deploy`

**Find Your Role:**
```bash
cat .bedrock_agentcore.yaml | grep execution_role
```

---

## Required Inline Policies (6 Total)

### 1. BedrockAgentCoreRuntimeExecutionPolicy-vehicle_maintenance_agent
**Purpose:** Core execution permissions for AgentCore runtime container

**Managed By:** Automatically created by `bedrock-agentcore deploy`

**Permissions:** CloudWatch Logs, ECR image pull, basic runtime operations

---

### 2. CustomBrowserToolPolicy
**Purpose:** Enables browser automation for tire ordering via NovaAct

**Managed By:** Manually added

**Policy Document:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::agentcore-browser-tool-recordings/*"
    }
  ]
}
```

---

### 3. DynamoDBAppointmentAccess
**Purpose:** Access to appointment scheduling and GenAI recommendations cache

**Managed By:** Manually added

**Policy Document:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/vehicle-appointment-slots",
        "arn:aws:dynamodb:us-east-1:*:table/vehicle-genai-recs",
        "arn:aws:dynamodb:us-east-1:*:table/browser-session-tracking"
      ]
    }
  ]
}
```

---

### 4. KnowledgeBaseAccessPolicy
**Purpose:** Access to Bedrock Knowledge Base for EV maintenance manual

**Managed By:** Manually added

**Policy Document:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:Retrieve",
        "bedrock:RetrieveAndGenerate"
      ],
      "Resource": "arn:aws:bedrock:us-east-1:*:knowledge-base/*"
    }
  ]
}
```

---

### 5. S3RecordingPolicy
**Purpose:** Store browser automation session recordings

**Managed By:** Manually added

**Policy Document:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::agentcore-browser-tool-recordings",
        "arn:aws:s3:::agentcore-browser-tool-recordings/*"
      ]
    }
  ]
}
```

---

### 6. SecretsManagerNovaActAccess ⚠️ **CRITICAL FOR DEPLOYMENT**
**Purpose:** Retrieve NovaAct API key from AWS Secrets Manager

**Managed By:** Manually added (REQUIRED)

**Policy Document:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:/vehicle-maintenance/novaact-api-key-*"
    }
  ]
}
```

**Setup Instructions:**
1. Create the secret first:
   ```bash
   aws secretsmanager create-secret \
     --name /vehicle-maintenance/novaact-api-key \
     --secret-string '{"NOVA_ACT_API_KEY":"your-api-key-here"}' \
     --region us-east-1
   ```

2. Add the policy to your AgentCore execution role:
   ```bash
   aws iam put-role-policy \
     --role-name AmazonBedrockAgentCoreSDKRuntime-us-east-1-YOUR_SUFFIX \
     --policy-name SecretsManagerNovaActAccess \
     --policy-document file://docs/policies/secrets-manager-policy.json
   ```

3. Redeploy AgentCore to pick up the new permissions:
   ```bash
   bedrock-agentcore deploy
   ```

---

## Deployment Checklist

When deploying this application to a new AWS account:

- [ ] Deploy AgentCore runtime: `bedrock-agentcore deploy`
- [ ] Note the execution role ARN from `.bedrock_agentcore.yaml`
- [ ] Create NovaAct API secret in Secrets Manager
- [ ] Add all 6 inline policies to the execution role
- [ ] Verify policies are attached: `aws iam list-role-policies --role-name YOUR_ROLE_NAME`
- [ ] Redeploy AgentCore: `bedrock-agentcore deploy`
- [ ] Test locally: `python3 scripts/test_custom_browser_tool.py`
- [ ] Deploy Lambda and frontend stacks
- [ ] Test through CloudFront

---

## Security Notes

1. **Secrets Manager** - API keys are never hardcoded in source code
2. **Least Privilege** - Each policy grants only the minimum required permissions
3. **Resource Scoping** - Policies are scoped to specific resources where possible
4. **No Wildcards** - Avoid `Resource: "*"` except where AWS requires it

---

## Troubleshooting

**Error: "Could not load from Secrets Manager"**
- Verify the secret exists: `aws secretsmanager describe-secret --secret-id /vehicle-maintenance/novaact-api-key`
- Check the execution role has SecretsManagerNovaActAccess policy attached
- Verify the secret ARN matches the policy Resource pattern

**Error: "Access Denied" for DynamoDB**
- Ensure DynamoDBAppointmentAccess policy is attached
- Verify table names match exactly (case-sensitive)

**Error: "Browser tool failed"**
- Check CustomBrowserToolPolicy is attached
- Verify S3 bucket `agentcore-browser-tool-recordings` exists
- Ensure Bedrock model access is enabled in your account

---

## Additional Resources

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [Bedrock AgentCore SDK Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [IAM Policy Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
