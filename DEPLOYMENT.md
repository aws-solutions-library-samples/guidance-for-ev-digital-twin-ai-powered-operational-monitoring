# EV Digital Twin - Deployment Guide

Complete deployment instructions for the AI-powered vehicle maintenance system.

## Prerequisites

- **AWS Account** with Bedrock access (Claude Sonnet 4.5 enabled)
- **AWS CLI** configured with credentials
- **Docker** installed and running
- **Node.js 18+** and **Python 3.11+**
- **AgentCore Starter Toolkit** (`pip install bedrock-agentcore-starter-toolkit`)
- **NovaAct API key** (optional — for browser automation)

## Architecture Overview

```
User → CloudFront (+ WAF) → S3 (React Frontend)
                                    ↓ HTTPS
                              API Gateway + Lambda Proxy
                                    ↓
                          Orchestrator Agent (keyword routing)
                                    ↓ invoke_agent_runtime
              ┌─────────────┬──────────────┬──────────────┐
              ↓              ↓              ↓              ↓
        Tire Agent     Motor Agent   Inverter Agent  Fleet Ops Agent
        (7 tools)      (4 tools)     (3 tools)       (3 tools + memory)
              ↓              ↓              ↓              ↓
        ┌─────────────────────────────────────────────────────┐
        ↓              ↓                ↓                     ↓
   ML Models    Knowledge Base     DynamoDB          AgentCore Memory
   Browser      (OpenSearch)       (Appointments)    AgentCore Gateway
```

## AgentCore Services Used

This solution combines Strands Agent orchestration with Amazon Bedrock AgentCore services:

| Component | Role |
|---|---|
| **Strands Agents** | Agent framework for reasoning, tool use, and multi-agent orchestration across 5 specialist runtimes |
| **AgentCore Runtime** | Containerized deployment of each specialist agent as a managed AWS service |
| **AgentCore Memory** | Short-term and long-term conversation storage for recurring issue detection and fleet pattern analysis |
| **AgentCore Gateway** | Exposes vehicle history and report tools as MCP endpoints for external system integration |
| **AgentCore Browser** | Automated tire ordering from supplier portals with live DCV session streaming |
| **AgentCore Observability** | Agent action traces, tool invocations, and performance monitoring via CloudWatch |
| **Amazon Nova Act** | Agentic foundation model powering visual browser automation for tire procurement |

## Quick Deployment

```bash
./scripts/deploy/deploy-aws.sh
```

**Deploys:** Infrastructure, DynamoDB, API Gateway, Frontend  
**Time:** 15-20 minutes

## What Gets Deployed

### 1. Frontend (CloudFront + S3)
- **Components:** React app with Fleet Portal, vehicle monitoring, browser live view
- **Security:** AWS WAF, Cognito authentication
- **Stack:** `infrastructure/frontend-stack.yaml`

### 2. API Gateway + Lambda Proxy
- **Purpose:** Routes frontend requests to AgentCore Runtime
- **Endpoints:** `/chat`, `/tire-order/*`, `/action-logs/*`, `/vehicle-history/*`, `/vehicle-report/*`
- **Stack:** `infrastructure/agentcore-lambda-proxy-stack.yaml`

### 3. AgentCore Runtime (Multi-Agent)
- **Architecture:** Orchestrator + 4 specialist agents on separate runtimes
- **Orchestrator:** Lightweight keyword router — no domain tools
- **Tire Specialist:** 7 tools (analysis, ML predictions, KB guidance, browser ordering)
- **Motor Specialist:** 4 tools (analysis, failure prediction, anomaly detection, KB guidance)
- **Inverter Specialist:** 3 tools (analysis, degradation prediction, KB guidance)
- **Fleet Operations:** 3 tools (vehicle checks, scheduling) + Memory hooks
- **Model:** Claude Sonnet 4.5
- **Location:** `agents/` (one directory per agent)
- **Docs:** [agents/README.md](agents/README.md)

### 4. Browser Tool
- **Purpose:** Automated tire ordering from Amazon
- **Components:** Custom browser tool, S3 recordings bucket
- **Stack:** `infrastructure/browser-tool-stack.yaml`

### 5. Tire Automation
- **Purpose:** Async tire ordering (avoids API Gateway timeouts)
- **Components:** Worker Lambda, DynamoDB jobs table
- **Stack:** `infrastructure/tire-automation-stack.yaml`
- **Docs:** [TIRE_ORDER_WORKER_SETUP.md](docs/TIRE_ORDER_WORKER_SETUP.md)

### 6. Knowledge Base
- **Vector Store:** OpenSearch Serverless
- **Content:** EV Preventive Maintenance Manual
- **Setup:** `knowledge-base/create_knowledge_base.sh`
- **Docs:** [KNOWLEDGE_BASE_SETUP.md](docs/KNOWLEDGE_BASE_SETUP.md)

### 7. DynamoDB Tables
- `vehicle-appointment-slots` - Appointment scheduling
- `tire-order-jobs` - Async job tracking (with TTL)
- `vehicle-genai-recs` - Cached AI recommendations

### 8. AgentCore Gateway
- **Purpose:** Exposes vehicle history and report tools as MCP endpoints
- **Tools:** `get_vehicle_history`, `generate_vehicle_report`
- **Components:** Vehicle History Lambda, Gateway Proxy Lambda, Cognito OAuth
- **Stack:** `infrastructure/gateway-stack.yaml`
- **Post-deploy:** Deploy Lambda code and set Cognito secret — see stack outputs for CLI commands

## Step-by-Step Deployment

### Step 1: Deploy Infrastructure

```bash
./scripts/deploy/deploy-aws.sh
```

### Step 2: Deploy AgentCore Agents

Install the AgentCore starter toolkit (if not already installed):

```bash
pip install bedrock-agentcore strands-agents bedrock-agentcore-starter-toolkit
```

Deploy all 4 specialist agents first (the orchestrator needs their ARNs):

```bash
# From the project root
./agents/scripts/deploy-agent.sh tire-specialist-agent
./agents/scripts/deploy-agent.sh motor-specialist-agent
./agents/scripts/deploy-agent.sh inverter-specialist-agent
./agents/scripts/deploy-agent.sh fleet-operations-agent
```

Note each agent's ARN from the deployment output, then deploy the orchestrator:

```bash
./agents/scripts/deploy-agent.sh orchestrator-agent
```

The deploy script handles everything: copies shared module, sets account ID, builds Docker image, pushes to ECR, creates/updates the AgentCore Runtime, and cleans up.

**Update Lambda proxy** to point at the orchestrator:

```bash
aws lambda update-function-configuration \
  --function-name ev-digital-twin-agentcore-proxy \
  --environment "Variables={AGENT_RUNTIME_ARN=<orchestrator-arn>,KNOWLEDGE_BASE_ID=<your-kb-id>,LOG_GROUP_NAME=/aws/bedrock-agentcore/runtimes/<tire-specialist-runtime-id>-DEFAULT}"
```

**Update tire order worker** to point at the tire specialist directly:

```bash
aws lambda update-function-configuration \
  --function-name ev-digital-twin-tire-order-worker \
  --environment "Variables={AGENT_RUNTIME_ARN=<tire-specialist-arn>}"
```

### Step 3: Deploy Browser Tool

```bash
aws cloudformation deploy \
  --template-file infrastructure/browser-tool-stack.yaml \
  --stack-name ev-digital-twin-browser-tool \
  --capabilities CAPABILITY_IAM
```

**Get Browser Tool ID:**
```bash
aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-browser-tool \
  --query 'Stacks[0].Outputs[?OutputKey==`BrowserToolId`].OutputValue' \
  --output text
```

The Browser Tool ID is configured as a default in the tire specialist's Dockerfile (`BROWSER_TOOL_ID` env var). Update it if deploying to a different account.

### Step 4: Configure IAM Permissions

```bash
./infrastructure/agentcore-runtime-policies/setup-multi-agent-permissions.sh
```

Adds IAM policies for all agent roles: InvokeAgentRuntime (orchestrator), DynamoDB, Secrets Manager, S3, Browser Tool, Knowledge Base, and full Bedrock access.

### Step 5: Configure Browser Automation

**Get NovaAct API Key:** [nova.amazon.com/act](https://nova.amazon.com/act)

**Store in Secrets Manager:**
```bash
aws secretsmanager create-secret \
  --name /vehicle-maintenance/novaact-api-key \
  --secret-string '{"NOVA_ACT_API_KEY":"your-key"}' \
  --region us-east-1
```

### Step 6: Seed Data

```bash
# Seed appointment slots
python scripts/seed_appointment_slots.py

# Generate ML predictions (optional)
./scripts/setup_ml_predictions.sh
```

## Testing & Verification

```bash
# Test agent
python scripts/test_agent_local.py

# Test tire ordering
python scripts/test_tire_order_local.py

# Verify browser tool
python scripts/check_browser_tool_config.py

# View memory
python scripts/view_memory.py
```

## Multi-Account Deployment

**Deploy to different AWS accounts using account-specific env files:**

### Frontend Deployment

The frontend ships with `.env.production.example` as a placeholder template.
For first-time setup, copy that file to `.env.production` and fill in your
account-specific values; `.env.production` is gitignored so real endpoints
never get committed.

```bash
cd frontend/ev-digital-twin-tire-maintainence-system

# First-time setup: create .env.production from the placeholder template
cp .env.production.example .env.production
# Edit .env.production with the values for the target account

# Deploy to Account A (e.g., demo)
cp .env.demo .env.production  # For production build
npm run build
aws s3 sync build/ s3://ev-digital-twin-frontend-<account-id>-us-east-1/ --delete

# Deploy to Account B (e.g., handover)
cp .env.handover .env.production  # For production build
npm run build
aws s3 sync build/ s3://ev-digital-twin-frontend-<account-id>-us-east-1/ --delete
```

**Important:** 
- `.env.local` is for localhost testing (`npm start`) - NOT used in builds
- `.env.production` is for production builds (`npm run build`) - baked into JavaScript
- `.env.production.example` is the checked-in placeholder; copy it before editing
- Always copy the right env file to `.env.production` before building

### Agent Deployment

**Set the browser tool ID via the `BROWSER_TOOL_ID` environment variable** for each target account. The agent code reads it from the environment (no need to edit Python sources).

**Example browser tool ID format:**
- `vehicle_tire_order_tool-XXXXXXXXXX` (replace `XXXXXXXXXX` with the suffix from your AgentCore Browser Tool deployment)

Then build with account-specific IDs:

```bash
cd agents/maintenance-agent

# Build with guardrails and KB ID
docker buildx build --platform linux/arm64 \
  --build-arg BEDROCK_GUARDRAIL_ID=<guardrail-id> \
  --build-arg BEDROCK_GUARDRAIL_VERSION=1 \
  --build-arg KNOWLEDGE_BASE_ID=<kb-id> \
  -t bedrock-agentcore-vehicle_maintenance_agent:latest .

# Push to target account ECR
docker tag bedrock-agentcore-vehicle_maintenance_agent:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest
```

## Troubleshooting

### Browser Tool 404 Error

**Problem:** `StartBrowserSession` fails with 404

**Solution:** Verify browser tool ID matches your account:
```bash
grep "custom_identifier" agents/maintenance-agent/agentcore_maintenance_agent.py
```

### Live View Not Loading

**Problem:** DCV SDK MIME type errors

**Solution:** Rebuild frontend and sync to S3:
```bash
npm run build
aws s3 sync build/ s3://YOUR-BUCKET/ --delete
aws cloudfront create-invalidation --distribution-id YOUR-DIST-ID --paths "/*"
```

### Wrong API Endpoint

**Problem:** Frontend uses wrong API after `.env` change

**Solution:** `.env.local` overrides `.env`. Update it and restart:
```bash
kill $(lsof -ti:3000)
npm start
```

## Cleanup

```bash
# Delete stacks
aws cloudformation delete-stack --stack-name ev-digital-twin-frontend
aws cloudformation delete-stack --stack-name ev-digital-twin-agentcore-proxy
aws cloudformation delete-stack --stack-name ev-digital-twin-tire-automation
aws cloudformation delete-stack --stack-name ev-digital-twin-browser-tool

# Delete AgentCore Runtime via Bedrock console
# Delete Knowledge Base via Bedrock console

# Delete ECR
aws ecr delete-repository --repository-name bedrock-agentcore-vehicle_maintenance_agent --force
```

## Support

- [AgentCore Setup](docs/AGENTCORE_SETUP.md)
- [IAM Policies](docs/IAM_POLICIES.md)
- [Tire Order Worker](docs/TIRE_ORDER_WORKER_SETUP.md)
- [Async Implementation](docs/ASYNC_TIRE_ORDER_COMPLETE.md)

---

**Deployment Complete!** Access via CloudFront URL.


## Updating Deployment

### Update AgentCore Runtime

```bash
cd agents/maintenance-agent

# Rebuild and push
docker buildx build --platform linux/arm64 -t bedrock-agentcore-vehicle_maintenance_agent:latest .
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest

# Runtime automatically pulls new image
```

### Update Frontend

```bash
cd frontend/ev-digital-twin-tire-maintainence-system

# Build with API endpoints (REQUIRED - baked into JavaScript)
REACT_APP_AGENTCORE_API=https://YOUR-API.execute-api.us-east-1.amazonaws.com/chat \
REACT_APP_TIRE_ORDER_API=https://YOUR-API.execute-api.us-east-1.amazonaws.com \
npm run build

# Deploy to S3
aws s3 sync build/ s3://ev-digital-twin-frontend-<account-id>-us-east-1/ --delete

# Invalidate CloudFront (REQUIRED for changes to appear)
aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/*"
```

### Update Lambda Functions

```bash
# Worker Lambda
./scripts/deploy/deploy-worker-lambda.sh

# Proxy Lambda
cd infrastructure/lambda
zip lambda-proxy.zip index.py
aws lambda update-function-code \
  --function-name ev-digital-twin-agentcore-proxy \
  --zip-file fileb://lambda-proxy.zip
```
