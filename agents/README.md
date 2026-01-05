# EV Digital Twin - Amazon Bedrock AgentCore Agents

AI-powered vehicle maintenance agents built with Amazon Bedrock AgentCore and Strands Agent framework for predictive analytics, browser automation, and intelligent fleet management.

---

## Overview

The EV Digital Twin system uses **three specialized AgentCore agents** for comprehensive vehicle maintenance:

### Amazon Bedrock AgentCore

Amazon Bedrock AgentCore is a modern agent runtime platform that provides enhanced performance, streaming capabilities, and sophisticated agent orchestration. The EV Digital Twin's AI maintenance system is built using the Strands agent framework, which runs on the AgentCore runtime and leverages:

- **AgentCore Runtime** - Containerized agent deployment as managed AWS service
- **AgentCore Memory** - Persistent conversation storage with user preference retrieval (STM + LTM)
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
# AWS credentials configured
aws sts get-caller-identity

# bedrock-agentcore CLI installed
pip install bedrock-agentcore-starter-toolkit --upgrade

# Docker installed (for building containers)
docker --version
```

### Deploy Maintenance Agent

```bash
# 1. Build Docker image
docker buildx build --platform linux/arm64 -t bedrock-agentcore-vehicle_maintenance_agent:latest .

# 2. Tag for ECR
docker tag bedrock-agentcore-vehicle_maintenance_agent:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest

# 3. Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# 4. Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest

# 5. Deploy via Bedrock AgentCore console or CLI
bedrock-agentcore launch
```

### Deploy Other Agents

```bash
# Deploy appointment scheduler
cd agents/appointment_scheduler_agent
bedrock-agentcore launch

# Deploy tire ordering
cd ../tire_ordering_agent
bedrock-agentcore launch
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

**Purpose:** Detect recurring vehicle issues and fleet-wide patterns

**Configuration:**
- **Mode:** STM + LTM
- **Memory ID:** vehicle_maintenance_agent_mem-Zz75E62LMt
- **Expiry:** 30 days (STM)
- **Region:** us-east-1

**Use Cases:**
- Recurring issue detection (e.g., "⚠️ RECURRING ISSUE: Vehicle 1 has 2 previous tire issues")
- Fleet pattern analysis (e.g., "⚠️ FLEET PATTERN: 3 vehicles have similar tire pressure problems")

**Implementation:**
```python
class MaintenanceMemoryHooks(HookProvider):
    def retrieve_context(self, event):
        # Check memory for recurring issues before analysis
        memories = client.retrieve_memories(memory_id, query=f"vehicle {id}")
        if len(memories) > 1:
            inject_warning("⚠️ RECURRING ISSUE detected")
    
    def save_interaction(self, event):
        # Save detected issues to memory after analysis
        if "CRITICAL" or "WARNING" in response:
            client.create_event(memory_id, messages=[(query, response)])
```

---

## 🔧 Configuration

### Maintenance Agent (`.bedrock_agentcore.yaml`)

```yaml
name: vehicle_maintenance_agent
model: anthropic.claude-sonnet-4-5-20250929-v1:0
platform: linux/arm64
memory:
  mode: STM_ONLY
  expiry_days: 30
environment:
  KNOWLEDGE_BASE_ID: HCHPVDE0PX
  AGENTCORE_MEMORY_ID: vehicle_maintenance_agent_mem-Zz75E62LMt
```

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
# 1. Make code changes in agents/maintenance-agent/
# 2. Rebuild and push Docker image
docker buildx build --platform linux/arm64 -t bedrock-agentcore-vehicle_maintenance_agent:latest .
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest

# 3. AgentCore Runtime automatically pulls new image
# 4. Test changes via frontend or API
```

### Update IAM Permissions

```bash
# Run setup script to add/update policies
./infrastructure/agentcore-runtime-policies/setup-agentcore-permissions.sh
```

---

**Built with Amazon Bedrock AgentCore - Powered by Strands Agent Framework**
