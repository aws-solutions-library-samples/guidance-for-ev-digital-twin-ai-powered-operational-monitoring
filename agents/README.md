# AgentCore Agents Deployment

Two standalone AgentCore agents for vehicle maintenance:
1. **Appointment Scheduler** - Schedules maintenance appointments
2. **Tire Ordering** - Automates tire ordering from Amazon

## Quick Start

### Prerequisites
```bash
# AWS credentials configured
aws sts get-caller-identity

# bedrock-agentcore CLI installed
pip install bedrock-agentcore-starter-toolkit --upgrade
```

### Deploy Agents

```bash
# Deploy appointment scheduler
cd agents/appointment_scheduler_agent
bedrock-agentcore launch

# Deploy tire ordering
cd ../tire_ordering_agent
bedrock-agentcore launch
```

That's it! Each deployment takes ~2-3 minutes.

## Deployed Agents

See `deployment_arns.txt` for current ARNs.

### Appointment Scheduler
- **ARN:** `arn:aws:bedrock-agentcore:us-east-1:009296485814:runtime/appointment_scheduler-QGTzKRE5QO`
- **Tools:** check_available_slots, schedule_appointment, cancel_appointment
- **Dependencies:** DynamoDB table `vehicle-appointment-slots`

### Tire Ordering
- **ARN:** `arn:aws:bedrock-agentcore:us-east-1:009296485814:runtime/tire_ordering-2ctYQTDQn9`
- **Tools:** order_tire_online (browser automation)
- **Dependencies:** Nova Act SDK, vehicle CSV data

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
If you see `ecr:InitiateLayerUpload` error:
```bash
aws iam put-role-policy \
  --role-name AmazonBedrockAgentCoreSDKCodeBuild-us-east-1-cdd8445f6e \
  --policy-name ECRPushPolicy \
  --policy-document file://ecr-push-policy.json
```

### Build Failures
Check CloudWatch logs:
```bash
aws logs tail /aws/codebuild/bedrock-agentcore-<agent-name>-builder --follow
```

### Runtime Errors
Check agent logs:
```bash
aws logs tail /aws/bedrock-agentcore/runtimes/<runtime-id>-DEFAULT \
  --log-stream-name-prefix "2025/11/18/[runtime-logs]" --follow
```

## Configuration

Both agents use:
- **Platform:** linux/arm64
- **Memory:** STM_ONLY, 30-day expiry
- **Model:** Claude Sonnet 4.5
- **Region:** us-east-1
- **Account:** 009296485814

## Cleanup

```bash
# Delete runtimes
aws bedrock-agentcore delete-runtime --runtime-id <id> --region us-east-1

# Delete ECR repositories
aws ecr delete-repository --repository-name bedrock-agentcore-<agent> --force --region us-east-1

# Delete CodeBuild projects
aws codebuild delete-project --name bedrock-agentcore-<agent>-builder --region us-east-1
```

## Architecture

```
User Request
    ↓
AgentCore Runtime (Docker/ARM64)
    ↓
Strands Agent Framework
    ↓
Tools (DynamoDB, Browser Automation)
    ↓
Response
```

## IAM Roles

- **CodeBuild Role:** `AmazonBedrockAgentCoreSDKCodeBuild-us-east-1-cdd8445f6e`
  - Permissions: S3, ECR, CodeBuild, CloudWatch Logs
- **Runtime Role:** `AmazonBedrockAgentCoreSDKRuntime-us-east-1-cdd8445f6e`
  - Permissions: Bedrock, DynamoDB, CloudWatch

## Support

- **CloudWatch Dashboard:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#gen-ai-observability/agent-core
- **Logs:** `/aws/bedrock-agentcore/runtimes/<runtime-id>-DEFAULT`
- **Deployment Logs:** See `deployment_appointment.log` and `deployment_tire.log`

---

**Status:** ✅ Both agents deployed and tested  
**Last Updated:** 2025-11-18
