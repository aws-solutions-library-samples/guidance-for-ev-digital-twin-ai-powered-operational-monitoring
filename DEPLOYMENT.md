# EV Digital Twin - Deployment Guide

Complete deployment instructions for the AI-powered vehicle maintenance system.

---

## Prerequisites

- **AWS Account** with Bedrock access (Claude Sonnet 4.5 enabled)
- **AWS CLI** configured with credentials
- **Docker** installed and running
- **Node.js 18+** and **Python 3.11+**
- **NovaAct API key** (optional - for browser automation)

---

## Architecture Overview

```
User → CloudFront (+ WAF) → S3 / ECS Fargate (React Frontend)
                                    ↓ HTTPS
                              API Gateway + Lambda Proxy
                                    ↓
                          AgentCore Runtime (Docker/ARM64)
                          (Strands Agent with 17 tools)
                                    ↓
        ┌───────────────────────────┼───────────────────────────┐
        ↓                           ↓                           ↓
   ML Models              Bedrock Knowledge Base        DynamoDB
   (Tire/Motor/Inverter)  (OpenSearch Serverless)      (Appointments/Jobs)
        ↓                           ↓                           ↓
   CSV Sensor Data        Vehicle Maintenance Manual    AgentCore Memory
```

---

## Quick Deployment

### Deploy All Stacks

```bash
./deploy-aws.sh
```

**Deploys:**
1. Cognito (authentication)
2. DynamoDB tables (appointments, jobs, recommendations)
3. Tire automation (worker Lambda, DynamoDB)
4. API Gateway + Lambda proxy
5. Frontend (CloudFront + S3 or ECS Fargate)

**Estimated Time:** 15-20 minutes

---

## Step-by-Step Deployment

### Step 1: Deploy Infrastructure

```bash
# Deploy all CloudFormation stacks
./deploy-aws.sh

# Or deploy individually:
./deploy-aws.sh cognito
./deploy-aws.sh appointment-slots
./deploy-aws.sh tire-automation
./deploy-aws.sh agentcore-proxy
./deploy-aws.sh frontend
```

### Step 2: Deploy AgentCore Runtime

```bash
# 1. Build Docker image
docker buildx build --platform linux/arm64 -t bedrock-agentcore-vehicle_maintenance_agent:latest .

# 2. Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# 3. Tag image
docker tag bedrock-agentcore-vehicle_maintenance_agent:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest

# 4. Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest

# 5. Deploy via Bedrock console or CLI
bedrock-agentcore launch
```

### Step 3: Configure AgentCore Permissions

```bash
# Add required IAM policies to AgentCore Runtime role
cd infrastructure/agentcore-runtime-policies
chmod +x setup-agentcore-permissions.sh
./setup-agentcore-permissions.sh
```

**Grants access to:**
- DynamoDB (appointments, tire-order-jobs)
- Secrets Manager (NovaAct API key)
- S3 (browser session recordings)
- Bedrock Knowledge Base

### Step 4: Create Knowledge Base

```bash
# Automated setup
cd knowledge-base
chmod +x create_knowledge_base.sh
./create_knowledge_base.sh

# Manual setup (if preferred)
python create_opensearch_index.py
# Then create KB via AWS Console
```

**Time:** 10-15 minutes (includes ingestion)

### Step 5: Configure Browser Automation

**Required for the `order_tire_online` tool (automated tire ordering from Amazon).**

```bash
# Create NovaAct API key secret
aws secretsmanager create-secret \
  --name /vehicle-maintenance/novaact-api-key \
  --secret-string '{"NOVA_ACT_API_KEY":"your-novaact-key-here"}' \
  --region us-east-1
```

**Note:** Without this secret, the system deploys successfully and 16/17 tools work (tire analysis, motor diagnostics, appointments, etc.). Browser automation will show a clear error message if the secret is missing.

---

## What Gets Deployed

### 1. Frontend (CloudFront + S3 or ECS Fargate)
- **Service:** CloudFront CDN with S3 or ECS Fargate
- **Components:** React app with Fleet Portal, vehicle monitoring, browser live view
- **Security:** AWS WAF, Cognito authentication
- **Stack:** `infrastructure/frontend-stack.yaml`

### 2. API Gateway + Lambda Proxy
- **Service:** HTTP API Gateway + Lambda
- **Purpose:** Routes frontend requests to AgentCore Runtime
- **Endpoints:** `/chat`, `/tire-order/start`, `/tire-order/status/{job_id}`, `/action-logs/{job_id}`
- **Stack:** `infrastructure/agentcore-lambda-proxy-stack.yaml`

### 3. AgentCore Runtime
- **Container:** Docker (ARM64) with Strands Agent framework
- **Model:** Claude Sonnet 4.5
- **Tools:** 17 specialized tools (12 core + 5 Knowledge Base)
- **Features:** AgentCore Memory (STM + LTM), Browser automation with NovaAct
- **Location:** `agents/maintenance-agent/`

### 4. Tire Automation
- **Service:** Worker Lambda + DynamoDB
- **Purpose:** Async tire ordering to avoid API Gateway timeouts
- **Components:** Worker Lambda, tire-order-jobs table (with TTL)
- **Stack:** `infrastructure/tire-automation-stack.yaml`

### 5. DynamoDB Tables
- **Tables:** 
  - `vehicle-appointment-slots` - Appointment scheduling
  - `tire-order-jobs` - Async job tracking
  - `vehicle-genai-recs` - Cached AI recommendations
- **Stack:** `infrastructure/appointment-slots-stack.yaml`

### 6. Cognito Authentication
- **Service:** Cognito User Pool
- **Features:** Admin-only user creation, JWT validation
- **Stack:** `infrastructure/cognito-stack.yaml`

### 7. Bedrock Knowledge Base
- **Vector Store:** OpenSearch Serverless
- **Embedding Model:** Amazon Titan Embeddings G1 - Text (1536 dimensions)
- **Content:** Electric Vehicle Preventive Maintenance Manual (mock)
- **Setup:** `knowledge-base/create_knowledge_base.sh`

---

## Post-Deployment Configuration

### Seed Appointment Slots

```bash
python scripts/seed_appointment_slots.py
```

### Generate ML Predictions

```bash
chmod +x scripts/setup_ml_predictions.sh
./scripts/setup_ml_predictions.sh
```

### Create Admin User

```bash
# Via AWS Console:
# Cognito → User Pools → ev-digital-twin-user-pool → Users → Create user
```

---

## Local Development

### Frontend Configuration

**Configure API Endpoints:**

The frontend uses environment variables for API configuration. Create `.env.local` in the frontend directory:

```bash
cd frontend/ev-digital-twin-tire-maintainence-system
cp .env.example .env.local
```

**Edit `.env.local` with your API Gateway URLs:**

```bash
# Get your API Gateway URL from CloudFormation
aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-agentcore-proxy \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
  --output text

# Add to .env.local:
REACT_APP_AGENTCORE_API=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/chat
REACT_APP_TIRE_ORDER_API=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com
```

**Note:** `.env.local` is gitignored and safe for your credentials.

### Frontend Only

```bash
cd frontend/ev-digital-twin-tire-maintainence-system
npm install
npm start
```

**Access:** http://localhost:3000

**Note:** Frontend connects to deployed AWS backend (AgentCore Runtime, Lambda, DynamoDB).

---

## Verification

### Test AgentCore Runtime

```bash
python scripts/test_agent_local.py
```

### Test Browser Automation

```bash
python scripts/test_browser_session_save.py
```

### Test Action Logs

```bash
python scripts/test_action_logs.py
```

### Test API Endpoints

```bash
# Test chat endpoint
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Analyze tire condition for vehicle 1"}'

# Test tire ordering
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/tire-order/start \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id": "1"}'

# Test action logs
curl https://<api-id>.execute-api.us-east-1.amazonaws.com/action-logs/test-123
```

---

## Updating Deployment

### Update AgentCore Runtime

```bash
# 1. Make code changes in agents/maintenance-agent/
# 2. Rebuild and push Docker image
docker buildx build --platform linux/arm64 -t bedrock-agentcore-vehicle_maintenance_agent:latest .
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest

# 3. Update AgentCore Runtime via Bedrock console
# Runtime automatically pulls new image
```

### Update Lambda Functions

```bash
# Update proxy Lambda
cd infrastructure/lambda
zip lambda-proxy.zip index.py
aws lambda update-function-code \
  --function-name ev-digital-twin-agentcore-proxy \
  --zip-file fileb://lambda-proxy.zip

# Update worker Lambda
./deploy-worker-lambda.sh
```

### Update Frontend

**Build with API Configuration:**

```bash
cd frontend/ev-digital-twin-tire-maintainence-system

# Option 1: Build with environment variables (recommended)
REACT_APP_AGENTCORE_API=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/chat \
REACT_APP_TIRE_ORDER_API=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com \
npm run build

# Option 2: Build using .env.local (if configured)
npm run build

# Deploy to S3
aws s3 sync build/ s3://ev-digital-twin-frontend-<account-id>-us-east-1/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/*"
```

**Note:** Environment variables are baked into the JavaScript bundle at build time. The `.env.local` file is not deployed to S3.

---

## Troubleshooting

### Stack Deployment Fails

**Issue:** Backend stack fails with "ECS container can't access NovaAct API key"

**Solution:** The secret is optional. Stack should deploy successfully without it. If it fails:
1. Check that lazy loading is implemented in `agentcore_maintenance_agent.py`
2. Verify ECS TaskRole has Secrets Manager permissions in `backend-stack.yaml`

### Browser Automation Not Working

**Issue:** `order_tire_online` tool fails

**Solution:** Create the NovaAct API key secret:
```bash
aws secretsmanager create-secret \
  --name /vehicle-maintenance/novaact-api-key \
  --secret-string '{"NOVA_ACT_API_KEY":"your-key"}' \
  --region us-east-1
```

### Action Logs Not Showing

**Issue:** "View Actions" button shows "No action details available"

**Solution:**
1. Verify `/action-logs/{job_id}` route exists in API Gateway
2. Check Lambda has CloudWatch Logs permissions
3. Redeploy Lambda with latest code

### Knowledge Base Not Working

**Issue:** KB tools return "Knowledge Base not configured"

**Solution:** Set environment variable:
```bash
export KNOWLEDGE_BASE_ID=<your-kb-id>
```

---

## Cleanup

### Remove All Resources

```bash
# Delete CloudFormation stacks
aws cloudformation delete-stack --stack-name ev-digital-twin-frontend
aws cloudformation delete-stack --stack-name ev-digital-twin-agentcore-proxy
aws cloudformation delete-stack --stack-name ev-digital-twin-tire-automation
aws cloudformation delete-stack --stack-name ev-digital-twin-appointment-slots
aws cloudformation delete-stack --stack-name ev-digital-twin-cognito

# Delete AgentCore Runtime via Bedrock console

# Delete Knowledge Base via Bedrock console

# Delete ECR repository
aws ecr delete-repository \
  --repository-name bedrock-agentcore-vehicle_maintenance_agent \
  --force
```

---

## Security Best Practices

- ✅ **Rotate secrets regularly** - Update NovaAct API key quarterly
- ✅ **Enable WAF** - Already deployed with CloudFront
- ✅ **Review IAM roles** - Ensure least privilege access
- ✅ **Enable CloudWatch alarms** - Monitor Lambda errors and ECS health
- ✅ **Use Cognito MFA** - Enable for admin users

---

## Support

- **AgentCore Setup:** [docs/AGENTCORE_SETUP.md](docs/AGENTCORE_SETUP.md)
- **IAM Policies:** [docs/IAM_POLICIES.md](docs/IAM_POLICIES.md)
- **Tire Order Worker:** [docs/TIRE_ORDER_WORKER_SETUP.md](docs/TIRE_ORDER_WORKER_SETUP.md)
- **Async Implementation:** [docs/ASYNC_TIRE_ORDER_COMPLETE.md](docs/ASYNC_TIRE_ORDER_COMPLETE.md)

---

**Deployment Complete!** Access your application via the CloudFront URL.
