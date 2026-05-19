# Knowledge Base Setup Guide

This guide explains how to set up the AWS Bedrock Knowledge Base for enhanced maintenance guidance with manual citations.

## Overview

The Knowledge Base is **optional** - the system works perfectly without it using general maintenance knowledge. Adding the Knowledge Base provides:

- Specific citations from EV Preventive Maintenance Manual
- Enhanced tire, motor, and inverter guidance
- Authoritative manufacturer recommendations

## Prerequisites

1. EV Digital Twin system deployed successfully
2. AWS CLI configured with Bedrock permissions
3. Access to upload documents to S3

## Setup Steps

### Step 1: Create S3 Bucket for Documents

```bash
# Create bucket for Knowledge Base documents
aws s3 mb s3://ev-digital-twin-knowledge-base-${AWS_ACCOUNT_ID} --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket ev-digital-twin-knowledge-base-${AWS_ACCOUNT_ID} \
  --versioning-configuration Status=Enabled
```

### Step 2: Upload Manual Documents

```bash
# Upload the EV Preventive Maintenance Manual
aws s3 cp manuals/Electric\ Vehicle\ Preventive\ Maintenance\ Manual.pdf \
  s3://ev-digital-twin-knowledge-base-${AWS_ACCOUNT_ID}/manuals/
```

### Step 3: Create Knowledge Base (AWS Console)

1. **Open Bedrock Console**: https://console.aws.amazon.com/bedrock/
2. **Navigate to Knowledge Bases** → Create Knowledge Base
3. **Configure Knowledge Base**:
   - Name: `ev-digital-twin-maintenance-kb`
   - Description: `EV maintenance manuals for tire, motor, and inverter guidance`
   - IAM Role: Create new service role

4. **Configure Data Source**:
   - Data source name: `maintenance-manuals`
   - S3 URI: `s3://ev-digital-twin-knowledge-base-${AWS_ACCOUNT_ID}/manuals/`
   - Chunking strategy: Default
   - Metadata: None required

5. **Configure Embeddings**:
   - Embeddings model: `amazon.titan-embed-text-v1`
   - Vector database: Amazon OpenSearch Serverless (default)

6. **Review and Create** → Wait for creation (5-10 minutes)

### Step 4: Get Knowledge Base ID

```bash
# List Knowledge Bases to get the ID
aws bedrock-agent list-knowledge-bases \
  --query 'knowledgeBaseSummaries[?name==`ev-digital-twin-maintenance-kb`].knowledgeBaseId' \
  --output text
```

Example output: `HCHPVDE0PX`

### Step 5: Update ECS Task Definition

```bash
# Update the backend stack with Knowledge Base ID
aws cloudformation update-stack \
  --stack-name ev-digital-twin-backend \
  --template-body file://infrastructure/backend-stack.yaml \
  --parameters \
    ParameterKey=ECRImageURI,ParameterValue=123456789012.dkr.ecr.us-east-1.amazonaws.com/ev-digital-twin:latest \
    ParameterKey=KnowledgeBaseId,ParameterValue=HCHPVDE0PX \
  --capabilities CAPABILITY_NAMED_IAM
```

### Step 6: Add Knowledge Base Permissions

Add to TaskRole in `infrastructure/backend-stack.yaml`:

```yaml
# Knowledge Base permissions
- Effect: Allow
  Action:
    - bedrock:Retrieve
    - bedrock:RetrieveAndGenerate
  Resource: !Sub "arn:aws:bedrock:${AWS::Region}:${AWS::AccountId}:knowledge-base/*"
```

### Step 7: Verify Setup

Test the Knowledge Base integration:

```bash
curl -X POST http://YOUR_ALB_URL/agentcore \
  -H "Content-Type: application/json" \
  -d '{"prompt": "get_tire_maintenance_guidance(tire pressure monitoring)", "actor_id": "test", "session_id": "test"}'
```

Expected response should include citations like:
```
Based on the EV Preventive Maintenance Manual (Confidence: 0.85) [Source: Electric Vehicle Preventive Maintenance Manual.pdf, Page 23]:
```

## Troubleshooting

### Knowledge Base Not Found
**Error**: `Knowledge Base not configured`

**Solution**: Verify environment variable is set in ECS task definition

### Permission Denied
**Error**: `User is not authorized to perform: bedrock:Retrieve`

**Solution**: Add Knowledge Base permissions to ECS TaskRole

### No Results Found
**Error**: `No specific guidance found in manual`

**Solution**: 
1. Verify documents were uploaded to S3
2. Check Knowledge Base sync status in console
3. Try broader search terms

## Cost Considerations

Knowledge Base incurs additional costs:
- **Embeddings**: ~$0.0001 per 1K tokens for indexing
- **Vector Storage**: ~$0.10 per GB per month
- **Queries**: ~$0.0001 per query

Estimated monthly cost for this setup: **$5-15/month**

## Maintenance

- **Document Updates**: Re-upload to S3 and sync Knowledge Base
- **Performance Monitoring**: Check retrieval accuracy in CloudWatch
- **Cost Optimization**: Monitor usage and adjust retention policies

## Support

For issues:
- Check CloudWatch Logs: `/aws/bedrock/knowledge-bases/`
- Verify IAM permissions in AWS Console
- Test Knowledge Base directly in Bedrock Console