# EV Digital Twin - Knowledge Base

Amazon Bedrock Knowledge Base integration for AI-powered vehicle maintenance recommendations using official EV maintenance manuals.

---

## Overview

The Knowledge Base provides the AI agent with authoritative maintenance guidance from the **Electric Vehicle Preventive Maintenance Manual**. When analyzing vehicle issues, the agent retrieves relevant manual sections to provide accurate, manufacturer-aligned recommendations.

**Knowledge Base ID:** `HCHPVDE0PX`

**Document Storage:** S3 bucket `ev-maintenance-manual-kb-1763588908`

**Vector Store:** Amazon OpenSearch Serverless (for semantic search)

**Embedding Model:** Amazon Titan Embeddings G1 - Text (1536 dimensions)

---

## 🔧 How It Works

The agent uses **specialized system prompts** that enforce Knowledge Base usage:

```
User: "What's wrong with Vehicle 1's tires?"
    ↓
Agent (Claude Sonnet 4.5) receives SYSTEM_PROMPT_TIRE:
  "You do NOT have tire knowledge built-in. 
   MUST call get_tire_maintenance_guidance() BEFORE providing advice."
    ↓
Agent calls analyze_tire_condition(VIN) → Gets real-time data
    ↓
Agent calls get_tire_maintenance_guidance("tire pressure 28 PSI") 
    ↓
Bedrock Knowledge Base (vector search on manual)
    ↓
Returns 3 relevant passages with confidence scores
    ↓
Agent combines manual guidance + real-time data
    ↓
Response: "Manual says normal pressure is 32-35 PSI (Confidence: 0.92).
           Your tire is at 28 PSI - underinflated. Inflate immediately."
```

**Key Design:** The agent is explicitly told it has NO built-in knowledge and MUST consult the manual first. This ensures all recommendations are grounded in authoritative documentation.

---

## 📚 Knowledge Base Tools

The system includes **5 specialized tools** that query the Knowledge Base:

### Tire System Tools

**`get_tire_maintenance_guidance(question: str)`**
- Retrieves guidance from TIRE MONITORING SYSTEM section
- Covers tire failure prediction scenarios
- Returns top 3 most relevant passages

**`get_pressure_temperature_guidance(pressure_psi: float, temperature_c: float)`**
- Checks if pressure/temperature readings are normal
- Provides action recommendations

**`get_tread_depth_guidance(tread_depth_mm: float)`**
- Validates tread depth against safety thresholds
- Recommends replacement timing

### Motor System Tools

**`get_motor_maintenance_guidance(question: str)`**
- Retrieves guidance from ELECTRIC MOTOR SYSTEM MONITORING section
- Covers motor failure prediction scenarios

### Inverter System Tools

**`get_inverter_maintenance_guidance(question: str)`**
- Retrieves guidance from POWER ELECTRONICS (INVERTER) MONITORING section
- Covers inverter failure prediction scenarios

---

## 📄 Source Manual

**File:** `manuals/Electric Vehicle Preventive Maintenance Manual.pdf`

**Stored in:** S3 bucket `ev-maintenance-manual-kb-1763588908`

**Content Sections:**
- Tire Monitoring System
- Electric Motor System Monitoring
- Power Electronics (Inverter) Monitoring
- Failure Prediction Scenarios
- Maintenance Schedules

**Note:** This is a mock manual mimicking realistic manufacturer documentation for demonstration purposes. Production systems should use actual OEM manuals.

---

## 🚀 Setup

### Prerequisites

- AWS account with Bedrock access
- S3 bucket for manual storage
- OpenSearch Serverless collection

### Quick Setup

Run the automated setup script:

```bash
cd knowledge-base
chmod +x create_knowledge_base.sh
./create_knowledge_base.sh
```

This script will:
1. Create IAM role for Knowledge Base
2. Create OpenSearch Serverless collection
3. Create Bedrock Knowledge Base
4. Create S3 data source
5. Start ingestion job

**Setup time:** ~10-15 minutes

### Manual Setup

If you prefer manual setup:

1. **Create OpenSearch index:**
   ```bash
   python create_opensearch_index.py
   ```

2. **Follow AWS Console steps:**
   - Create Knowledge Base in Bedrock console
   - Configure S3 data source
   - Start ingestion job

3. **Update environment variable:**
   ```bash
   export KNOWLEDGE_BASE_ID=<your-kb-id>
   ```

---

## 🔑 Configuration

### Environment Variables

**AgentCore Runtime:**
```dockerfile
ENV KNOWLEDGE_BASE_ID=HCHPVDE0PX
```

**Lambda Functions:**
```yaml
Environment:
  Variables:
    KNOWLEDGE_BASE_ID: HCHPVDE0PX
```

### IAM Permissions

The AgentCore Runtime role needs:

```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock-agent-runtime:Retrieve",
    "bedrock-agent-runtime:RetrieveAndGenerate"
  ],
  "Resource": "arn:aws:bedrock:us-east-1:*:knowledge-base/HCHPVDE0PX"
}
```

See `kb-runtime-policy-fix.json` for complete policy.

---

## 📊 Usage Example

**Agent Query:**
```python
from knowledge_base_tools import get_tire_maintenance_guidance

guidance = get_tire_maintenance_guidance(
    "What should I do if tire pressure is 28 PSI and temperature is 85°C?"
)
```

**Response:**
```
**Passage 1** (Confidence: 0.92) [Source: Manual]:
Normal tire pressure range is 32-35 PSI. Readings below 30 PSI indicate 
underinflation requiring immediate attention. Temperature above 80°C 
suggests excessive heat buildup from underinflation or overloading.

**Passage 2** (Confidence: 0.87) [Source: Manual]:
CRITICAL ACTION: Stop vehicle immediately if tire temperature exceeds 80°C. 
Inspect for damage, check pressure, and allow cooling before continuing.

**Passage 3** (Confidence: 0.81) [Source: Manual]:
Underinflated tires (below 30 PSI) increase rolling resistance, causing 
excessive heat generation and accelerated wear. Inflate to recommended 
pressure immediately.
```

---

## 🧪 Testing

Test the Knowledge Base tools:

```bash
# Test tire guidance
python -c "from knowledge_base_tools import get_tire_maintenance_guidance; \
print(get_tire_maintenance_guidance('tire pressure 28 PSI'))"

# Test motor guidance
python -c "from knowledge_base_tools import get_motor_maintenance_guidance; \
print(get_motor_maintenance_guidance('motor temperature 105C'))"

# Test inverter guidance
python -c "from knowledge_base_tools import get_inverter_maintenance_guidance; \
print(get_inverter_maintenance_guidance('inverter thermal failure'))"
```

---

## 📁 Files in This Directory

- **`knowledge_base_tools.py`** - 5 KB tools for agent integration
- **`create_knowledge_base.sh`** - Automated setup script
- **`create_opensearch_index.py`** - OpenSearch index creation
- **`kb-permissions-policy.json`** - IAM policy for KB access
- **`kb-runtime-policy-fix.json`** - Fixed IAM policy with correct permissions

---

## 🔄 Updating the Knowledge Base

### Add New Manual Content

1. Upload PDF to S3 bucket:
   ```bash
   aws s3 cp new-manual.pdf s3://ev-maintenance-manual-kb-1763588908/manuals/
   ```

2. Start ingestion job:
   ```bash
   aws bedrock-agent start-ingestion-job \
     --knowledge-base-id HCHPVDE0PX \
     --data-source-id <data-source-id>
   ```

3. Monitor ingestion:
   ```bash
   aws bedrock-agent get-ingestion-job \
     --knowledge-base-id HCHPVDE0PX \
     --data-source-id <data-source-id> \
     --ingestion-job-id <job-id>
   ```

---

## 🎯 Integration Points

### AgentCore Runtime

The Knowledge Base tools are imported in `agentcore_maintenance_agent.py`:

```python
from knowledge_base_tools import (
    get_tire_maintenance_guidance,
    get_pressure_temperature_guidance,
    get_tread_depth_guidance,
    get_motor_maintenance_guidance,
    get_inverter_maintenance_guidance
)
```

### Dockerfile

The tools are copied into the Docker container:

```dockerfile
COPY knowledge-base/knowledge_base_tools.py .
ENV KNOWLEDGE_BASE_ID=HCHPVDE0PX
```

### Lambda Worker

The tools are packaged with the tire order worker Lambda:

```bash
cp knowledge-base/knowledge_base_tools.py lambda-package/
```

---

## 🔍 Troubleshooting

### Knowledge Base Not Found

**Error:** `Knowledge Base not configured`

**Solution:** Set the environment variable:
```bash
export KNOWLEDGE_BASE_ID=HCHPVDE0PX
```

### No Results Returned

**Error:** `No specific guidance found in manual`

**Solution:** 
- Check ingestion job completed successfully
- Verify manual content covers the query topic
- Try broader search terms

### Permission Denied

**Error:** `AccessDeniedException`

**Solution:** Add KB permissions to AgentCore Runtime role:
```bash
aws iam put-role-policy \
  --role-name AmazonBedrockAgentCoreSDKRuntime-* \
  --policy-name KnowledgeBaseAccess \
  --policy-document file://kb-runtime-policy-fix.json
```

---

## 📚 Resources

- **Main README:** `../README.md` - Complete project documentation
- **Agent README:** `../agents/README.md` - AgentCore agent documentation
- **Manual Source:** `../manuals/Electric Vehicle Preventive Maintenance Manual.pdf`

---

**Built with Amazon Bedrock Knowledge Base - Powered by OpenSearch Serverless**
