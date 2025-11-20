# AgentCore Agents Deployment Guide

> **Note:** This guide is deprecated. See [README.md](README.md) for the simplified deployment process.

## Quick Reference

Both agents are now deployed:
- **Appointment Scheduler:** `arn:aws:bedrock-agentcore:us-east-1:009296485814:runtime/appointment_scheduler-QGTzKRE5QO`
- **Tire Ordering:** `arn:aws:bedrock-agentcore:us-east-1:009296485814:runtime/tire_ordering-2ctYQTDQn9`

## Deployment (Simplified)

```bash
# Deploy appointment scheduler
cd agents/appointment_scheduler_agent
bedrock-agentcore launch

# Deploy tire ordering
cd ../tire_ordering_agent
bedrock-agentcore launch
```

## Testing

```bash
# Test appointment scheduler
cd appointment_scheduler_agent
bedrock-agentcore invoke '{"prompt": "Show me available slots for 2025-11-20"}'

# Test tire ordering
cd tire_ordering_agent
bedrock-agentcore invoke '{"prompt": "What tire size does vehicle 1 need?"}'
```

## Troubleshooting

### ECR Permission Error
```bash
aws iam put-role-policy \
  --role-name AmazonBedrockAgentCoreSDKCodeBuild-us-east-1-cdd8445f6e \
  --policy-name ECRPushPolicy \
  --policy-document file://ecr-push-policy.json
```

### Build Failures
```bash
aws logs tail /aws/codebuild/bedrock-agentcore-<agent-name>-builder --follow
```

---

For complete documentation, see [README.md](README.md)
