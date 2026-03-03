# EV Digital Twin - Amazon Bedrock AgentCore Agents

AI-powered vehicle maintenance agents built with Amazon Bedrock AgentCore and Strands Agent framework for predictive analytics, browser automation, and intelligent fleet management.

---

## Overview

The EV Digital Twin system uses **three specialized AgentCore agents** for comprehensive vehicle maintenance:

### Amazon Bedrock AgentCore

Amazon Bedrock AgentCore is a modern agent runtime platform that provides enhanced performance, streaming capabilities, and sophisticated agent orchestration. The EV Digital Twin's AI maintenance system is built using the Strands agent framework, which runs on the AgentCore runtime and leverages:

- **AgentCore Runtime** - Containerized agent deployment as managed AWS service
- **AgentCore Memory** - Persistent conversation storage with user preference retrieval (STM + LTM)
- **AgentCore Gateway** - MCP endpoint exposing vehicle history and report tools for external integrations
- **AgentCore Browser** - Web automation via headless browser with live view streaming
- **Amazon Nova Act** - Agentic foundation model for browser automation with visual reasoning
- **Bedrock Knowledge Base** - OpenSearch Serverless backend for vehicle maintenance manuals

### 1. Maintenance Agent (Primary)
**Location:** `agents/maintenance-agent/`

**Purpose:** Comprehensive vehicle health analysis with 17 specialized tools

**Tools:**
- **Analysis** (4): quick_vehicle_check, analyze_tire_condition, analyze_motor_performance, analyze_inverter_condition
- **ML Predictions** (3): predict_tire_wear, predict_motor_failure, predict_inverter_degradation
- **Anomaly Detection** (2): detect_tire_anomalies, detect_motor_anomalies
- **Integration** (2): get_available_slots, schedule_appointment
- **Browser Automation** (1): order_tire_online (with live view)
- **Knowledge Base** (5): Bedrock KB tools for tire, motor, and inverter guidance

**Features:**
- Claude Sonnet 4.5 for intelligent reasoning
- AgentCore Memory (STM + LTM) for pattern detection
- Browser automation with NovaAct SDK
- Bedrock Knowledge Base integration with OpenSearch Serverless

### 2. Appointment Scheduler Agent
**Location:** `agents/appointment_scheduler_agent/`

**Purpose:** Dedicated appointment scheduling and slot management

**Tools:** check_available_slots, schedule_appointment, cancel_appointment

### 3. Tire Ordering Agent
**Location:** `agents/tire_ordering_agent/`

**Purpose:** Standalone tire ordering with browser automation

**Tools:** order_tire_online (browser automation)

---

## 🚀 Quick Start

### Prerequisites

```bash
# AWS credentials configured with named profiles
aws sts get-caller-identity --profile demo

# Python 3.10+ and pip
python3 --version

# Docker installed (for building containers)
docker --version
```

### Starter Toolkit Setup

The AgentCore starter toolkit is a CLI for deploying Python agents to AgentCore Runtime. Install it along with the required packages:

```bash
# Create and activate a virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install required packages
pip install bedrock-agentcore strands-agents bedrock-agentcore-starter-toolkit

# Verify installation
agentcore --help
```

Key CLI commands:

| Command | Description |
|---------|-------------|
| `agentcore create` | Scaffold a new agent project (choose framework, name, options) |
| `agentcore dev` | Run agent locally on http://localhost:8080 for testing |
| `agentcore invoke --dev "prompt"` | Test your local dev server |
| `agentcore launch` | Build and deploy agent to AgentCore Runtime (uses CodeBuild) |
| `agentcore launch --local-build` | Build locally with Docker, deploy to cloud (ARM64 Macs) |
| `agentcore invoke '{"prompt": "..."}'` | Test your deployed agent |
| `agentcore destroy` | Clean up all AWS resources created by the toolkit |

For the full tutorial, see the [official AWS guide](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore-starter-toolkit-tutorial.html).

### Deploy Maintenance Agent

**Recommended: Using bedrock-agentcore CLI**

```bash
cd agents/maintenance-agent

# For ARM64 Macs - build locally (faster, avoids CodeBuild)
bedrock-agentcore launch --local-build --profile demo

# For x86 machines or CI/CD - use CodeBuild
bedrock-agentcore launch --profile demo
```

The CLI automatically:
- Builds and pushes Docker image to ECR
- Creates/updates AgentCore Runtime
- Sets up Memory (STM + LTM)
- Stores configuration in `.bedrock_agentcore.yaml`

**Manual Docker Build (if needed)**

```bash
# 1. Build Docker image with environment variables
docker buildx build --platform linux/arm64 \
  --build-arg KNOWLEDGE_BASE_ID=YOUR_KB_ID \
  --build-arg AGENTCORE_MEMORY_ID=YOUR_MEMORY_ID \
  -t bedrock-agentcore-vehicle_maintenance_agent:latest .

# 2. Login to ECR
aws ecr get-login-password --region us-east-1 --profile demo | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# 3. Tag and push to ECR
docker tag bedrock-agentcore-vehicle_maintenance_agent:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest
```

### Environment Variables

The agent requires these environment variables (configured in Dockerfile or at runtime):

| Variable | Required | Description |
|----------|----------|-------------|
| `KNOWLEDGE_BASE_ID` | Yes | Bedrock Knowledge Base ID for manual guidance |
| `AGENTCORE_MEMORY_ID` | No | Memory ID for pattern detection (auto-created during launch) |

**Get your IDs:**
```bash
# Knowledge Base ID
aws bedrock-agent list-knowledge-bases --profile demo \
  --query "knowledgeBaseSummaries[*].[knowledgeBaseId,name]" --output table

# Memory ID (from .bedrock_agentcore.yaml after first launch)
cat .bedrock_agentcore.yaml | grep memory_id
```

### Deploy Other Agents

```bash
# Deploy appointment scheduler
cd agents/appointment_scheduler_agent
bedrock-agentcore launch --local-build --profile demo

# Deploy tire ordering
cd ../tire_ordering_agent
bedrock-agentcore launch --local-build --profile demo
```

---

## 🏗️ Architecture

### Maintenance Agent Architecture

```
User Request (Frontend)
    ↓
API Gateway + Lambda Proxy
    ↓
AgentCore Runtime (Docker/ARM64)
    ↓
Strands Agent Framework
    ↓
17 Specialized Tools
    ├─ Analysis Tools → CSV Data
    ├─ ML Tools → Pre-trained Models
    ├─ KB Tools → Bedrock Knowledge Base
    ├─ Integration Tools → DynamoDB
    └─ Browser Tool → NovaAct SDK
    ↓
Response (JSON)
```

### AgentCore Memory Integration

Uses STM + LTM to detect recurring vehicle issues and fleet-wide patterns. When a user asks about a vehicle, the agent checks memory for past issues and injects context warnings. After each analysis, detected issues are saved back to memory.

**Configuration:** STM + LTM mode, 30-day STM expiry, us-east-1

**Use Cases:**
- Recurring issue detection (e.g., "⚠️ RECURRING ISSUE: Vehicle 1 has 2 previous tire issues")
- Fleet pattern analysis (e.g., "⚠️ FLEET PATTERN: 3 vehicles have similar tire pressure problems")

**Check memory:**
```bash
python scripts/view_memory.py
python scripts/check_memory.py
```

### AgentCore Gateway Integration

Exposes vehicle history and report generation as MCP tools via AgentCore Gateway. External systems (fleet software, email automation, any MCP client) can call these programmatically. The frontend also uses this path.

```
Frontend / External Systems → API Gateway → Gateway Proxy Lambda → AgentCore Gateway (MCP) → Vehicle History Lambda → AgentCore Memory
```

**MCP Tools:**
- `get_vehicle_history` — Categorized maintenance history (tire, motor, inverter, appointments)
- `generate_vehicle_report` — Structured report with prioritized recommendations

**Setup:**
```bash
# Option 1: CloudFormation
aws cloudformation deploy \
  --template-file infrastructure/gateway-stack.yaml \
  --stack-name ev-digital-twin-gateway \
  --parameter-overrides \
    AgentCoreMemoryId=YOUR_MEMORY_ID \
    GatewayUrl=YOUR_GATEWAY_URL \
    GatewayCognitoDomain=YOUR_COGNITO_DOMAIN \
    GatewayClientId=YOUR_CLIENT_ID \
    GatewayClientSecret=YOUR_SECRET \
    ExistingApiId=YOUR_API_ID \
  --capabilities CAPABILITY_NAMED_IAM

# Option 2: Quick setup script
python3 scripts/setup_gateway.py --memory-id YOUR_MEMORY_ID
```

**Test:**
```bash
# Test via API Gateway
curl https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/vehicle-history/1?category=tire

# Test via Gateway MCP directly
python3 scripts/test_gateway.py --vehicle-id 1
```

---

## 🔧 Configuration

### Maintenance Agent (`.bedrock_agentcore.yaml`)

This file is auto-generated during `bedrock-agentcore launch` and contains account-specific configuration:

```yaml
name: vehicle_maintenance_agent
model: anthropic.claude-sonnet-4-5-20250929-v1:0
platform: linux/arm64
memory:
  mode: STM_AND_LTM
  memory_id: <auto-generated>
  expiry_days: 30
aws:
  account: <your-account-id>
  region: us-east-1
```

### Environment Variables (Dockerfile)

```dockerfile
# Knowledge Base ID - enables KB tools (tire/motor/inverter guidance)
# Get from: aws bedrock-agent list-knowledge-bases
ENV KNOWLEDGE_BASE_ID=${KNOWLEDGE_BASE_ID:-}

# Memory ID - enables pattern detection (auto-created during launch)
# Get from: .bedrock_agentcore.yaml after first deployment
ENV AGENTCORE_MEMORY_ID=${AGENTCORE_MEMORY_ID:-}
```

**Note:** If `AGENTCORE_MEMORY_ID` is not set, the agent works normally but without memory features (pattern detection disabled).

### IAM Permissions

**Runtime Role:** `AmazonBedrockAgentCoreSDKRuntime-us-east-1-cdd8445f6e`

**Required Policies:**
- Bedrock model invocation (Claude Sonnet 4.5)
- AgentCore Browser (NovaAct SDK)
- AgentCore Memory (STM + LTM)
- DynamoDB access (appointments, tire-order-jobs)
- Secrets Manager (NovaAct API key)
- S3 (browser session recordings)

See `../../infrastructure/agentcore-runtime-policies/` for policy files and setup script.

---

## 🧪 Testing

### Test Maintenance Agent Locally

```bash
# Test tire analysis
python scripts/test_agent_local.py

# Test browser automation
python scripts/test_browser_session_save.py

# Test memory pattern detection
python scripts/test_memory_pattern_detection.py
```

### Test via API

```bash
# Test chat endpoint
curl -X POST https://b4blc4xmh4.execute-api.us-east-1.amazonaws.com/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Analyze tire condition for vehicle 2T1BURHE8JC987654"}'

# Test tire ordering
curl -X POST https://b4blc4xmh4.execute-api.us-east-1.amazonaws.com/tire-order/start \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id": "1"}'
```

---

## 📚 Documentation & Resources

### Amazon Bedrock AgentCore

- **Official Docs:** https://docs.aws.amazon.com/bedrock/latest/userguide/agents-agentcore.html
- **API Reference:** https://docs.aws.amazon.com/bedrock/latest/APIReference/API_Operations_Amazon_Bedrock_Agent_Core_Data_Plane.html
- **Starter Toolkit:** https://github.com/awslabs/bedrock-agentcore-starter-toolkit

### Project Documentation

- **Main README:** `../README.md` - Complete project overview
- **AgentCore Setup:** `../docs/AGENTCORE_SETUP.md` - IAM permissions guide
- **IAM Policies:** `../docs/IAM_POLICIES.md` - Security configuration
- **Frontend README:** `../frontend/ev-digital-twin-tire-maintainence-system/README.md` - UI documentation

### AWS Services

- **Amazon Bedrock:** https://aws.amazon.com/bedrock/
- **Bedrock Knowledge Base:** https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html
- **IoT FleetWise:** https://aws.amazon.com/iot-fleetwise/
- **IoT TwinMaker:** https://aws.amazon.com/iot-twinmaker/

---

## 🔍 Troubleshooting

### ECR Permission Error

If you see `ecr:InitiateLayerUpload` error:
```bash
aws iam put-role-policy \
  --role-name AmazonBedrockAgentCoreSDKCodeBuild-us-east-1-cdd8445f6e \
  --policy-name ECRPushPolicy \
  --policy-document file://ecr-push-policy.json
```

### Runtime Errors

Check AgentCore logs:
```bash
aws logs tail /aws/bedrock-agentcore/runtimes/vehicle_maintenance_agent-kH9hYvFcCD-DEFAULT --follow
```

### Browser Tool Issues

1. **NovaAct API Key:** Ensure secret exists in Secrets Manager (`/vehicle-maintenance/novaact-api-key`)
2. **Browser Session:** Check S3 bucket `agentcore-browser-tool-recordings` for recordings
3. **Live View:** Verify DCV Web Client SDK is loaded in frontend

### Memory Issues

Check memory records:
```bash
python scripts/check_memory.py
python scripts/view_memory.py
```

---

## 🎯 Agent Comparison

| Feature | Maintenance Agent | Appointment Scheduler | Tire Ordering |
|---------|-------------------|----------------------|---------------|
| **Tools** | 17 (comprehensive) | 3 (scheduling only) | 1 (browser automation) |
| **Memory** | STM + LTM | STM only | STM only |
| **Browser Automation** | ✅ Yes | ❌ No | ✅ Yes |
| **Knowledge Base** | ✅ Yes | ❌ No | ❌ No |
| **ML Predictions** | ✅ Yes | ❌ No | ❌ No |
| **Use Case** | Full fleet management | Appointment booking | Tire procurement |

**Recommendation:** Use **Maintenance Agent** for production - it includes all functionality of the other two agents plus comprehensive analysis capabilities.

---

## 📊 Monitoring

### CloudWatch Dashboards

- **AgentCore Observability:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#gen-ai-observability/agent-core
- **Lambda Metrics:** Monitor proxy and worker Lambda performance
- **API Gateway:** Track request rates and errors

### Log Groups

- **AgentCore Runtime:** `/aws/bedrock-agentcore/runtimes/vehicle_maintenance_agent-kH9hYvFcCD-DEFAULT`
- **Lambda Proxy:** `/aws/lambda/ev-digital-twin-agentcore-proxy`
- **Worker Lambda:** `/aws/lambda/ev-digital-twin-tire-order-worker`

---

## 🔄 Updates & Maintenance

### Update Maintenance Agent

```bash
cd agents/maintenance-agent

# Option 1: Redeploy with bedrock-agentcore CLI (recommended)
bedrock-agentcore launch --local-build --profile demo

# Option 2: Manual Docker build and push
docker buildx build --platform linux/arm64 \
  --build-arg KNOWLEDGE_BASE_ID=YOUR_KB_ID \
  --build-arg AGENTCORE_MEMORY_ID=YOUR_MEMORY_ID \
  -t bedrock-agentcore-vehicle_maintenance_agent:latest .

docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest

# AgentCore Runtime automatically pulls new image on next invocation
```

### Update IAM Permissions

```bash
# Run setup script to add/update policies
./infrastructure/agentcore-runtime-policies/setup-agentcore-permissions.sh
```

### Multi-Account Deployment

The infrastructure is modular and works with any AWS account. Use AWS CLI profiles:

```bash
# Deploy to demo account
bedrock-agentcore launch --local-build --profile demo

# Deploy to production account
bedrock-agentcore launch --local-build --profile prod
```

Each account will have its own:
- AgentCore Runtime ID
- Memory ID
- ECR repository
- CloudFormation stacks

---

**Built with Amazon Bedrock AgentCore - Powered by Strands Agent Framework**
