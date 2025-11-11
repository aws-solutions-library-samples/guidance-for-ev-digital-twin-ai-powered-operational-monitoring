# EV Digital Twin - Tire Maintenance System Deployment Summary

## 🚀 Project Overview

This is an AI-powered EV Digital Twin system for predictive tire and motor maintenance using AWS Bedrock AgentCore Runtime.

## 📋 Architecture

```
Frontend (React) → CloudFront → S3
                ↓
        API Gateway → Lambda Proxy
                ↓
        Bedrock AgentCore Runtime
                ↓
        AI Agent with 11 Tools
                ↓
        CSV Data (Tire, Motor, Manual Specs)
```

## 🔧 Key Components

### 1. **AgentCore Runtime** (`agentcore_runtime_app.py`)
- Deployed to AWS Bedrock AgentCore
- Uses Claude Sonnet 4.5 model
- Analyzes real-time vehicle data from CSV files

### 2. **Maintenance Agent** (`agentcore_maintenance_agent.py`)
- 11 specialized tools for vehicle analysis
- Quick health checks (fast responses)
- Detailed analysis (tire wear prediction, motor performance, anomaly detection)

### 3. **Frontend** (React Application)
- Fleet management portal
- Real-time AI-powered maintenance recommendations
- Incremental loading for better UX

### 4. **Infrastructure**
- CloudFormation stacks for automated deployment
- Lambda proxy for API integration
- S3 + CloudFront for frontend hosting

## 📊 Data Files

- `tire_wear_data.csv` - Historical tire condition data
- `motor_sensor_data.csv` - Motor performance metrics
- `car_manual_specs.csv` - Manufacturer specifications
- `vehicle_maintenance_data.csv` - Combined maintenance records
- `tire_models_*.pkl` - Pre-trained ML models for predictions

## 🛠️ Deployment

### Prerequisites
- AWS Account (009296485814)
- AWS CLI configured
- Node.js and npm
- Python 3.11+
- AgentCore CLI (`pip install bedrock-agentcore`)

### Quick Deploy

1. **Deploy AgentCore Runtime:**
   ```bash
   agentcore launch --agent vehicle_maintenance_agent
   ```

2. **Deploy Infrastructure:**
   ```bash
   aws cloudformation create-stack \
     --stack-name ev-digital-twin-agentcore-proxy \
     --template-body file://infrastructure/agentcore-lambda-proxy-stack.yaml \
     --capabilities CAPABILITY_NAMED_IAM
   ```

3. **Deploy Frontend:**
   ```bash
   cd frontend/ev-digital-twin-tire-maintainence-system
   npm install
   npm run build
   aws s3 sync build/ s3://ev-digital-twin-frontend-009296485814-us-east-1/
   aws cloudfront create-invalidation --distribution-id EH707ADI8ATK2 --paths "/*"
   ```

## 🌐 Live URLs

- **Frontend:** https://dvm0illvncdsh.cloudfront.net
- **API Gateway:** https://b4blc4xmh4.execute-api.us-east-1.amazonaws.com/chat
- **AgentCore ARN:** arn:aws:bedrock-agentcore:us-east-1:009296485814:runtime/vehicle_maintenance_agent-kH9hYvFcCD

## 🧪 Testing

Test the API directly:
```bash
curl -X POST https://b4blc4xmh4.execute-api.us-east-1.amazonaws.com/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Check vehicle 1 tire and motor status. Give me ONE brief sentence about the most important issue or say All systems normal. Be extremely concise.", "session_id": null}'
```

## 📈 Performance

- **API Response Time:** ~15-20 seconds per vehicle
- **Frontend Load Time:** ~45-60 seconds for 3 vehicles (incremental loading)
- **Agent Tools:** 11 specialized tools for comprehensive analysis

## 🔐 Security

- IAM roles with least privilege access
- CORS configured for CloudFront origin
- Session-based agent conversations
- No hardcoded credentials

## 📝 Key Features

✅ Real-time AI-powered maintenance recommendations  
✅ Predictive tire wear analysis (90-day forecasts)  
✅ Motor performance monitoring  
✅ Anomaly detection using ML models  
✅ Cross-system correlation analysis  
✅ Incremental UI updates for better UX  
✅ Comprehensive logging and observability  

## 🔄 CI/CD

Ready for GitLab CI/CD integration. See `.gitlab-ci.yml` for pipeline configuration.

## 📚 Documentation

- `README.md` - Project overview and setup
- `AWS_DEPLOYMENT_GUIDE.md` - Detailed AWS deployment instructions
- `AUTHENTICATION.md` - AWS authentication setup
- This file - Deployment summary

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Test locally
4. Push to GitLab
5. Create merge request

## 📞 Support

For issues or questions, contact the development team.

---

**Last Updated:** October 3, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
