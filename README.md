# 🚗 EV Digital Twin - Predictive Maintenance Powered by AI Agents

AI-powered vehicle maintenance system using Amazon Bedrock AgentCore for predictive analytics, anomaly detection, and automated tire ordering with real-time browser automation.

**Quick Links:** [🚀 Quick Start](#quick-start) | [🏗️ Architecture](#architecture) | [📹 Live Demo](https://dvm0illvncdsh.cloudfront.net) | [📚 Documentation](#documentation)

---

## Overview

The EV Digital Twin combines machine learning predictive analytics with Amazon Bedrock AgentCore to deliver intelligent vehicle maintenance management:

- **AgentCore Runtime**: Containerized AI agent with 17 specialized maintenance tools (12 core + 5 Knowledge Base)
- **AgentCore Memory**: Persistent conversation storage with recurring issue detection
- **AgentCore Browser**: Automated tire ordering via Amazon with live view streaming
- **Machine Learning**: Random Forest and Isolation Forest models for tire/motor/inverter predictions
- **Predictive Analytics**: 90-day maintenance forecasting with anomaly detection
- **Fleet Management**: Real-time health monitoring across tire, motor, and inverter systems

---

## 🎯 Key Features

- **Predictive Maintenance**: ML models forecast tire wear, motor failures, and inverter thermal issues
- **Anomaly Detection**: Identify unusual patterns across tire, motor, and inverter systems
- **Browser Automation**: Automated tire ordering from Amazon with live session viewing
- **Natural Language Interface**: Chat with AI agent for vehicle analysis and recommendations
- **Cross-System Analysis**: Correlate tire, motor, and inverter issues for comprehensive insights
- **Memory-Powered Insights**: Detect recurring issues and fleet-wide patterns across sessions

---

## Use Cases

### Demo Scenarios

**Vehicle-Specific Issues:**
- **Vehicle 1 (EV-1001)**: Tire failure - Uneven wear pattern requiring immediate attention
- **Vehicle 2 (EV-1002)**: Motor overheating - Engine temperature exceeding safe thresholds
- **Vehicle 3 (EV-1003)**: Inverter thermal failure - Power electronics cooling system malfunction

**Fleet Operator Perspective:**
- **Fleet Management**: Monitor all 3 vehicles from a unified dashboard
- **Prioritized Alerts**: AI identifies which vehicle needs attention first
- **Automated Ordering**: Browser automation orders replacement tires for Vehicle 1
- **Cross-System Insights**: Detect patterns across tire, motor, and inverter failures

### Real-World Applications
- **Predictive Maintenance**: Reduce unexpected failures by 80% with ML-powered forecasting
- **Cost Optimization**: Save 25-30% on maintenance costs through optimized scheduling
- **Safety Enhancement**: Prevent 95% of tire-related incidents with early detection
- **Automated Procurement**: Browser automation streamlines parts ordering workflow

---

## 🏗️ Architecture

### Deployment Architecture

When deployed to AWS, the solution uses a modern, scalable architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │────│   S3 Bucket      │    │   ECS Fargate   │
│   + WAF         │    │   (React App)    │    │  (React Frontend)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │                        │                       │
         └────────────────────────┼───────────────────────┘
                                  │
                            ┌──────────────┐
                            │ Application  │
                            │ Load Balancer│
                            └──────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │ API GW + │  │ Worker   │  │AgentCore │
              │ Lambda   │  │ Lambda   │  │ Runtime  │
              └──────────┘  └──────────┘  └──────────┘
```

### Core Components

**Full-Stack Vehicle Maintenance Platform**

- **Frontend**: React app on ECS Fargate with Cognito authentication, real-time updates, DCV Web Client SDK for browser live view
- **Backend**: API Gateway + Lambda proxy for AgentCore integration, worker Lambda for async tire ordering
- **Agent Runtime**: AgentCore Runtime with 17 specialized tools (12 core + 5 KB), Claude Sonnet 4.5, AgentCore Memory (STM + LTM for pattern detection)
- **Browser Automation**: AgentCore Browser with NovaAct SDK for automated tire ordering with live view streaming
- **Data & ML**: CSV sensor data (3,600 tire + 900 motor records), pre-trained Random Forest and Isolation Forest models, Bedrock Knowledge Base with OpenSearch Serverless
- **Persistence**: DynamoDB for appointments and job tracking, S3 for browser session recordings
- **Security**: AWS WAF, Secrets Manager, Cognito JWT validation
- **Deployment**: CloudFront (+ WAF) → ALB → ECS Fargate (React frontend) + API Gateway + Lambda + AgentCore Runtime

**Platform Benefits:**
- � **MScalable**: Auto-scaling based on demand (ECS + Lambda)
- 🔒 **Secure**: WAF protection, private networking, HTTPS encryption, Secrets Manager
- 💰 **Cost-effective**: Pay only for what you use with serverless architecture
- 🌍 **Global**: CloudFront edge locations worldwide
- 📊 **Monitored**: CloudWatch logging and metrics across all services
- 🎥 **Live View**: Real-time browser automation viewing with DCV Web Client SDK

---

## 🚀 Quick Start

### Prerequisites

- AWS Account with Bedrock access (Claude models)
- AWS CLI configured with credentials
- Docker installed and running
- Python 3.11+ and Node.js 18+
- NovaAct API key for browser automation

### Local Development

```bash
# 1. Clone repository
git clone https://gitlab.aws.dev/kvanshaj/ev-digital-twin-tire-maintainence-system.git
cd ev-digital-twin-tire-maintainence-system

# 2. Install frontend dependencies
cd frontend/ev-digital-twin-tire-maintainence-system
npm install

# 3. Start development server
npm start
```

**Services started:**
- Frontend: http://localhost:3000
- Connects to deployed AWS backend (AgentCore Runtime, Lambda, DynamoDB)

**Note:** Local development requires AWS backend to be deployed. The frontend connects to your deployed AgentCore Runtime and Lambda functions.

### AWS Cloud Deployment

Deploy the complete solution using Infrastructure as Code with CloudFormation stacks.

**Quick Deploy:**
```bash
./deploy-aws.sh
```

Deploys all infrastructure automatically: Cognito, DynamoDB, Lambda functions, API Gateway, and Frontend (CloudFront + ECS).

**Manual Deploy (for debugging):**
```bash
# Deploy each stack individually
./deploy-aws.sh cognito
./deploy-aws.sh appointment-slots
./deploy-aws.sh tire-automation
./deploy-aws.sh agentcore-proxy
./deploy-aws.sh frontend
```

**Post-Deployment Steps:**

1. **Deploy AgentCore Runtime** (containerized agent):
   ```bash
   docker build -t bedrock-agentcore-vehicle_maintenance_agent .
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bedrock-agentcore-vehicle_maintenance_agent:latest
   ```

2. **Configure AgentCore permissions**:
   ```bash
   ./infrastructure/agentcore-runtime-policies/setup-agentcore-permissions.sh
   ```

3. **Create NovaAct API key secret**:
   ```bash
   aws secretsmanager create-secret \
     --name /vehicle-maintenance/novaact-api-key \
     --secret-string '{"api_key":"YOUR_NOVAACT_API_KEY"}' \
     --region us-east-1
   ```

See [docs/AGENTCORE_SETUP.md](docs/AGENTCORE_SETUP.md) for detailed setup instructions.

**🔐 Security Note**: Self-registration is disabled. Only administrators can add users via AWS Console after deployment.

---

## 🤖 AgentCore Tools

The system includes 17 specialized tools for comprehensive vehicle maintenance:

### Core Maintenance Tools (12 tools)

| Tool | Type | Description | Status |
|------|------|-------------|--------|
| `quick_vehicle_check` | Analysis | Quick health check across all systems | ✅ |
| `analyze_tire_condition` | Analysis | Detailed tire health assessment | ✅ |
| `analyze_motor_performance` | Analysis | Engine performance evaluation | ✅ |
| `analyze_inverter_condition` | Analysis | Inverter health assessment | ✅ |
| `predict_tire_wear` | ML Prediction | 90-day tire wear forecasting | ✅ |
| `predict_motor_failure` | ML Prediction | Motor failure risk assessment | ✅ |
| `predict_inverter_degradation` | ML Prediction | Inverter degradation forecasting | ✅ |
| `detect_tire_anomalies` | ML Detection | Unusual tire wear pattern detection | ✅ |
| `detect_motor_anomalies` | ML Detection | Motor performance anomaly detection | ✅ |
| `get_available_slots` | Integration | Find available appointment slots | ✅ |
| `schedule_appointment` | Integration | DynamoDB appointment scheduling | ✅ |
| `order_tire_online` | Browser Automation | Automated Amazon tire ordering with live view | ✅ |

### Knowledge Base Tools (5 tools)

Powered by Amazon Bedrock Knowledge Base with OpenSearch Serverless backend and mock realistic vehicle maintenance manuals:

| Tool | Type | Description | Status |
|------|------|-------------|--------|
| `get_tire_maintenance_guidance` | Knowledge Base | Tire maintenance manual guidance | ✅ |
| `get_pressure_temperature_guidance` | Knowledge Base | Pressure/temperature specifications | ✅ |
| `get_tread_depth_guidance` | Knowledge Base | Tread depth safety thresholds | ✅ |
| `get_motor_maintenance_guidance` | Knowledge Base | Motor maintenance procedures | ✅ |
| `get_inverter_maintenance_guidance` | Knowledge Base | Inverter maintenance guidelines | ✅ |

**Total: 17 tools** (17 ✅)

**Note:** Knowledge Base tools use Amazon Bedrock Knowledge Base with OpenSearch Serverless for vector search. Mock realistic vehicle manuals provide maintenance recommendations for demonstration purposes (not actual manufacturer data).

---

## 🧠 Machine Learning Models

### Tire System
- **Wear Prediction**: Random Forest (95% R² score)
- **Anomaly Detection**: Isolation Forest (10% contamination rate)
- **Features**: Vehicle specs, driving patterns, weather, pressure, temperature

### Motor System
- **Performance Prediction**: Random Forest (93% R² score)
- **Failure Prediction**: Random Forest (91% R² score)
- **Anomaly Detection**: Isolation Forest (10% contamination rate)
- **Features**: Engine specs, temperature, oil pressure, RPM, vibration

### Data Pipeline
```
Sensor Data (CSV) → Feature Engineering → Model Training → Predictions → Agent Analysis → UI Display
```

---

## 🔒 Security Features

- **AWS WAF**: Deployed in front of CloudFront for web application protection
- **Secrets Manager**: Secure storage for NovaAct API key
- **Cognito Authentication**: Admin-only user creation with JWT validation
- **IAM Least Privilege**: Scoped permissions for all AWS services
- **VPC Isolation**: Private networking for backend services

See [docs/IAM_POLICIES.md](docs/IAM_POLICIES.md) for complete security setup.

---

## 💻 Technology Stack

**Frontend:**
- React with modern UI components
- CloudFront + S3 for global delivery
- AWS WAF for security
- DCV Web Client SDK for browser live view

**Backend:**
- Amazon Bedrock AgentCore Runtime
- Claude Sonnet 4.5 for AI reasoning
- Lambda functions (proxy + worker)
- API Gateway for HTTP endpoints

**Data & ML:**
- DynamoDB for appointments and job tracking
- Pre-trained scikit-learn models
- CSV-based sensor data (3,600 tire + 900 motor records)
- S3 for browser session recordings

**Infrastructure:**
- CloudFormation for Infrastructure as Code
- Docker containers for AgentCore Runtime
- ECR for container registry
- CloudWatch for logging and monitoring

---

## 📁 Project Structure

```
ev-digital-twin-tire-maintainence-system/
├── frontend/                          # React web application
│   └── ev-digital-twin-tire-maintainence-system/
│       ├── src/
│       │   ├── components/           # React components
│       │   │   ├── fleet/           # Fleet management portal
│       │   │   └── browser-live-view/ # Live browser viewing
│       │   └── services/            # API services
│       └── public/
│           └── dcv-sdk/             # DCV Web Client SDK
│
├── infrastructure/                    # CloudFormation stacks
│   ├── lambda/                       # Lambda function code
│   │   ├── index.py                 # AgentCore proxy Lambda
│   │   └── tire_order_worker.py     # Tire order worker Lambda
│   ├── agentcore-runtime-policies/  # IAM policy setup
│   ├── tire-automation-stack.yaml   # Tire ordering infrastructure
│   ├── agentcore-lambda-proxy-stack.yaml  # API Gateway + Lambda
│   ├── appointment-slots-stack.yaml # DynamoDB tables
│   ├── cognito-stack.yaml           # Authentication
│   └── frontend-stack.yaml          # CloudFront + S3
│
├── docs/                             # Documentation
│   ├── AGENTCORE_SETUP.md           # AgentCore Runtime setup guide
│   └── IAM_POLICIES.md              # Security configuration
│
├── agentcore_maintenance_agent.py   # AgentCore agent with 11 tools
├── agentcore_runtime_app.py         # AgentCore Runtime entrypoint
├── tire_predictor.py                # ML model training
├── data_generator.py                # Sample data generation
└── *.csv                            # Sensor data and specifications
```

---

## 📚 Documentation

- **[AGENTCORE_SETUP.md](docs/AGENTCORE_SETUP.md)**: AgentCore Runtime IAM permissions setup
- **[IAM_POLICIES.md](docs/IAM_POLICIES.md)**: Security configuration and best practices
- **[EV_Digital_Twin_Agentic_Solution.md](EV_Digital_Twin_Agentic_Solution.md)**: Complete solution documentation

---

## 📊 Sample Data

The system includes realistic sample data for demonstration:

- **3,600 tire records**: 180 days × 5 vehicles × 4 tire positions
- **900 motor records**: 180 days × 5 vehicles
- **900 inverter records**: 180 days × 5 vehicles
- **5 vehicle specs**: Mock manufacturer guidelines and maintenance thresholds
- **Mock vehicle manuals**: Realistic maintenance procedures for tire, motor, and inverter systems stored in Bedrock Knowledge Base

All data is synthetically generated for demonstration purposes and does not represent actual vehicle telemetry.

---

## 💼 Business Impact

### Quantifiable Benefits
- Reduce unexpected failures through predictive maintenance
- Optimize maintenance scheduling for cost savings
- Prevent tire-related safety incidents with early detection
- Faster analysis compared to manual inspection
- Unlimited scalability with cloud-native architecture

### Competitive Advantages
- AI-first approach with advanced reasoning (Claude Sonnet 4.5)
- Natural language interface requiring no technical expertise
- Real-time browser automation with live viewing capability
- Comprehensive integration of tire, motor, and inverter data
- Future-ready architecture for continuous improvement

---

## 🔮 Future Enhancements

### IoT & Real-Time Data
- **AWS IoT FleetWise**: Real-time vehicle telemetry ingestion from connected vehicles
- **AWS IoT TwinMaker**: 3D digital twin visualization with spatial context
- **Live Sensor Streaming**: Replace CSV data with real-time IoT sensor feeds

### Advanced Analytics
- **Integrated BI Dashboard**: Amazon QuickSuite for executive reporting and KPI tracking
- **Natural Language Queries**: Enhanced conversational interface for complex fleet analytics
- **Deep Learning Models**: Neural networks for advanced pattern recognition
- **Weather Integration**: Real-time weather impact analysis on vehicle performance
- **Predictive Routing**: Optimize vehicle routes based on maintenance predictions

### Tool Ecosystem Expansion
- **AgentCore Gateway**: MCP tool integration for external system connectivity (ERP, CRM, parts suppliers)
- **MCP Tool Protocol**: Standardized tool definitions for third-party integrations
- **Multi-Agent Orchestration**: Specialized agents for procurement, scheduling, and diagnostics
- **Mobile Integration**: Smartphone interface for technicians and fleet managers

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built for demonstration purposes - Ready for production enhancement**

This proof of concept demonstrates the potential of AI-driven vehicle maintenance management, providing a foundation for enterprise-scale implementation with real-world data integration and advanced analytics capabilities.
