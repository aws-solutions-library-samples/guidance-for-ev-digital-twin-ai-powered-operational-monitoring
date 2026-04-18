# EV Digital Twin - Multi-Agent Orchestrator

AI-powered vehicle maintenance agents built with Amazon Bedrock AgentCore and Strands Agent framework. The system uses a multi-agent orchestrator architecture where a lightweight orchestrator classifies user intent and routes to the appropriate specialist agent.

---

## Architecture

```
User Request (Frontend)
    ↓
API Gateway + Lambda Proxy
    ↓
Orchestrator Agent (keyword routing, no tools)
    ├─→ Tire Specialist Agent (7 tools)
    ├─→ Motor Specialist Agent (4 tools)
    ├─→ Inverter Specialist Agent (3 tools)
    └─→ Fleet Operations Agent (3 tools + memory hooks)
```

The orchestrator uses keyword matching to route queries — no LLM invocation for routing. The Lambda proxy calls a single AgentCore Runtime ARN (the orchestrator), which then calls `invoke_agent_runtime` on the appropriate specialist.

### Agents

| Agent | Directory | Tools | Description |
|-------|-----------|-------|-------------|
| Orchestrator | `orchestrator-agent/` | 0 (routing only) | Classifies intent, routes to specialists via `invoke_agent_runtime` |
| Tire Specialist | `tire-specialist-agent/` | 7 | Tire analysis, ML predictions, anomaly detection, KB guidance, browser ordering |
| Motor Specialist | `motor-specialist-agent/` | 4 | Motor analysis, failure prediction, anomaly detection, KB guidance |
| Inverter Specialist | `inverter-specialist-agent/` | 3 | Inverter analysis, degradation prediction, KB guidance |
| Fleet Operations | `fleet-operations-agent/` | 3 | Vehicle checks, appointment scheduling, memory-based pattern detection |

### Routing Rules

- `"motor"` or `"engine"` → Motor Specialist
- `"inverter"` or `"power electronics"` → Inverter Specialist
- `"appointment"`, `"schedule"`, `"slot"`, `"quick check"` → Fleet Operations
- Everything else (default) → Tire Specialist

---

## Directory Structure

```
agents/
├── shared/                          # Shared Python package (all agents import from here)
│   ├── __init__.py
│   ├── data_loader.py               # load_tire_data(), load_motor_data(), etc.
│   ├── model_config.py              # BedrockModel factory with guardrail/caching config
│   ├── system_prompts.py            # SYSTEM_PROMPT_TIRE, _MOTOR, _INVERTER
│   ├── tire_predictor.py            # TirePredictor ML class
│   ├── knowledge_base_tools.py      # 5 KB tools (tire, motor, inverter guidance)
│   ├── memory_hooks.py              # MaintenanceMemoryHooks (STM + LTM)
│   ├── data/                        # CSV data files
│   │   ├── tire_wear_data.csv
│   │   ├── motor_sensor_data.csv
│   │   ├── inverter_sensor_data.csv
│   │   └── car_manual_specs.csv
│   └── models/                      # Pre-trained ML model files (.pkl)
│
├── orchestrator-agent/              # Orchestrator — routes to specialists
│   ├── orchestrator_runtime.py
│   ├── Dockerfile
│   ├── .bedrock_agentcore.yaml
│   └── requirements.txt
│
├── tire-specialist-agent/           # Tire analysis, predictions, ordering
│   ├── tire_runtime.py
│   ├── tire_tools.py
│   ├── Dockerfile
│   ├── .bedrock_agentcore.yaml
│   └── requirements.txt
│
├── motor-specialist-agent/          # Motor analysis, failure prediction
│   ├── motor_runtime.py
│   ├── motor_tools.py
│   ├── Dockerfile
│   ├── .bedrock_agentcore.yaml
│   └── requirements.txt
│
├── inverter-specialist-agent/       # Inverter analysis, degradation prediction
│   ├── inverter_runtime.py
│   ├── inverter_tools.py
│   ├── Dockerfile
│   ├── .bedrock_agentcore.yaml
│   └── requirements.txt
│
├── fleet-operations-agent/          # Fleet checks, appointments, memory hooks
│   ├── fleet_runtime.py
│   ├── fleet_tools.py
│   ├── Dockerfile
│   ├── .bedrock_agentcore.yaml
│   └── requirements.txt
│
└── maintenance-agent/               # Original monolith (kept for rollback)
```

---

## Environment Variables

### Orchestrator Agent

| Variable | Required | Description |
|----------|----------|-------------|
| `TIRE_AGENT_ARN` | Yes | ARN of the Tire Specialist AgentCore Runtime |
| `MOTOR_AGENT_ARN` | Yes | ARN of the Motor Specialist AgentCore Runtime |
| `INVERTER_AGENT_ARN` | Yes | ARN of the Inverter Specialist AgentCore Runtime |
| `FLEET_AGENT_ARN` | Yes | ARN of the Fleet Operations AgentCore Runtime |

### Specialist Agents

| Variable | Tire | Motor | Inverter | Fleet |
|----------|------|-------|----------|-------|
| `KNOWLEDGE_BASE_ID` | Yes | Yes | Yes | — |
| `BROWSER_TOOL_ID` | Yes | — | — | — |
| `BEDROCK_GUARDRAIL_ID` | Optional | Optional | Optional | Optional |
| `AGENTCORE_MEMORY_ID` | Optional | — | — | Yes |
| `BEDROCK_MODEL_ID` | Optional | Optional | Optional | Optional |

---

## Deployment

Each agent is deployed independently to its own AgentCore Runtime.

### Prerequisites

```bash
# AWS credentials configured
aws sts get-caller-identity --profile demo

# Python 3.10+ and Docker
python3 --version
docker --version

# Install AgentCore starter toolkit
pip install bedrock-agentcore strands-agents bedrock-agentcore-starter-toolkit
```

### Deploy Specialist Agents First

Deploy all four specialist agents before the orchestrator (the orchestrator needs their ARNs).

```bash
# Deploy each specialist from its directory
cd agents/tire-specialist-agent
bedrock-agentcore launch --local-build --profile demo

cd ../motor-specialist-agent
bedrock-agentcore launch --local-build --profile demo

cd ../inverter-specialist-agent
bedrock-agentcore launch --local-build --profile demo

cd ../fleet-operations-agent
bedrock-agentcore launch --local-build --profile demo
```

After each launch, note the Runtime ARN from the output or `.bedrock_agentcore.yaml`.

### Deploy Orchestrator

Set the specialist ARNs as environment variables in the orchestrator's Dockerfile or at runtime, then deploy:

```bash
cd agents/orchestrator-agent
bedrock-agentcore launch --local-build --profile demo
```

### Update Lambda Proxy

Point the Lambda proxy's `AGENT_RUNTIME_ARN` environment variable to the orchestrator's ARN. No code changes needed — just update the env var.

### CLI Reference

| Command | Description |
|---------|-------------|
| `bedrock-agentcore launch --local-build` | Build locally with Docker, deploy to AgentCore Runtime |
| `bedrock-agentcore launch` | Build via CodeBuild, deploy to AgentCore Runtime |
| `bedrock-agentcore dev` | Run agent locally on http://localhost:8080 |
| `bedrock-agentcore invoke --dev "prompt"` | Test local dev server |
| `bedrock-agentcore invoke '{"prompt": "..."}'` | Test deployed agent |
| `bedrock-agentcore destroy` | Clean up all AWS resources |

---

## Amazon Bedrock AgentCore

The system is built on Amazon Bedrock AgentCore with the Strands Agent framework:

- **AgentCore Runtime** — Containerized agent deployment as managed AWS service
- **AgentCore Memory** — Persistent conversation storage with STM + LTM for pattern detection
- **AgentCore Gateway** — MCP endpoint exposing vehicle history and report tools
- **AgentCore Browser** — Web automation via headless browser with live view streaming
- **Amazon Nova Act** — Agentic foundation model for browser automation
- **Bedrock Knowledge Base** — OpenSearch Serverless backend for vehicle maintenance manuals

### Shared Module (`agents/shared/`)

All specialist agents import common code from the shared module:

- `data_loader.py` — Loads tire, motor, inverter, and manual CSV data as DataFrames
- `model_config.py` — Creates BedrockModel with guardrail and prompt caching config
- `system_prompts.py` — Domain-specific system prompts (tire, motor, inverter)
- `tire_predictor.py` — ML-based tire wear prediction and anomaly detection
- `knowledge_base_tools.py` — Bedrock Knowledge Base retrieval tools
- `memory_hooks.py` — MaintenanceMemoryHooks for cross-vehicle pattern detection

Each agent's Dockerfile copies `agents/shared/` into the container at build time.

---

## AgentCore Gateway Integration

Exposes vehicle history and report generation as MCP tools via AgentCore Gateway. External systems can call these programmatically.

```
Frontend / External Systems → API Gateway → Gateway Proxy Lambda → AgentCore Gateway (MCP) → Vehicle History Lambda → AgentCore Memory
```

**MCP Tools:** `get_vehicle_history`, `generate_vehicle_report`

**Setup:**
```bash
# CloudFormation
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

# Or quick setup script
python3 scripts/setup_gateway.py --memory-id YOUR_MEMORY_ID
```

---

## Troubleshooting

### Runtime Errors

```bash
aws logs tail /aws/bedrock-agentcore/runtimes/<agent-name>-<id>-DEFAULT --follow
```

### Browser Tool Issues

1. Ensure NovaAct API key exists in Secrets Manager (`/vehicle-maintenance/novaact-api-key`)
2. Check S3 bucket `agentcore-browser-tool-recordings` for recordings

### Memory Issues

```bash
python scripts/check_memory.py
python scripts/view_memory.py
```

### ECR Permission Error

```bash
aws iam put-role-policy \
  --role-name AmazonBedrockAgentCoreSDKCodeBuild-us-east-1-cdd8445f6e \
  --policy-name ECRPushPolicy \
  --policy-document file://ecr-push-policy.json
```

---

## Documentation

- **Main README:** `../README.md`
- **AgentCore Setup:** `../docs/AGENTCORE_SETUP.md`
- **IAM Policies:** `../docs/IAM_POLICIES.md`
- **Frontend:** `../frontend/ev-digital-twin-tire-maintainence-system/README.md`
- **AgentCore Docs:** https://docs.aws.amazon.com/bedrock/latest/userguide/agents-agentcore.html
- **Starter Toolkit:** https://github.com/awslabs/bedrock-agentcore-starter-toolkit

---

**Built with Amazon Bedrock AgentCore — Powered by Strands Agent Framework**
