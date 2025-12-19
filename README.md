# 🚗 Vehicle Maintenance System - Predictive Analytics & AI Agent

A comprehensive Proof of Concept for integrated vehicle maintenance management using machine learning for predictive analytics and anomaly detection across tire wear and motor performance, with an intelligent maintenance agent for scheduling and recommendations.

## 🎯 Features

### Core Capabilities
- **📊 Predictive Analytics**: ML models predict tire wear patterns and motor performance degradation
- **⚠️ Dual Anomaly Detection**: Identify unusual tire wear patterns and motor performance issues
- **🤖 Maintenance Agent**: AI-powered agent for comprehensive vehicle analysis and appointment scheduling
- **📈 Fleet Management**: Monitor entire vehicle fleet health across tire and motor systems
- **🔄 Cross-System Analysis**: Correlate tire and motor issues for comprehensive maintenance insights
- **📱 Unified CLI Interface**: Interactive terminal-based interface for complete vehicle maintenance

### Key Components
1. **Tire Management**: Predictive tire wear analysis with anomaly detection
2. **Motor Management**: Engine performance monitoring and failure prediction
3. **Data Generation**: Realistic tire wear and motor sensor simulation with anomalies
4. **Machine Learning**: Random Forest for predictions, Isolation Forest for anomaly detection
5. **Maintenance Agent**: Intelligent cross-system analysis and recommendation system
6. **Interactive CLI**: User-friendly terminal interface with unified operations

## 🚀 Quick Start

### Local Development
```bash
# Navigate to project directory
cd vehicle-maintenance-system

# Install dependencies
pip install -r requirements.txt

# Run the interactive CLI
python3 cli.py
```

### AWS Cloud Deployment
Deploy the complete solution using Infrastructure as Code with nested CloudFormation stacks.

**Architecture:**
- **Frontend**: React app with Cognito authentication hosted on S3 + CloudFront
- **Backend**: Flask API on ECS Fargate with Application Load Balancer
- **Authentication**: AWS Cognito with admin-only user creation
- **Infrastructure**: Three separate CloudFormation stacks for easier debugging

```bash
# Deploy complete infrastructure (requires AWS CLI configured)
./deploy-aws.sh
```

**🔐 Security Setup (Required for Browser Automation):**

The browser automation feature (tire ordering) requires a NovaAct API key stored in AWS Secrets Manager. See **[docs/IAM_POLICIES.md](docs/IAM_POLICIES.md)** for complete setup instructions including:
- Creating the Secrets Manager secret
- Configuring IAM permissions
- Deployment checklist

**🔐 Authentication Note**: The demo is architected with self-registration disabled. Only administrators can add users to access the web application. Create users via AWS Console after deployment.

**🏗️ Infrastructure Management:**
```bash
# Clean up all resources
./cleanup-cloudformation.sh

# Deploy individual stacks for debugging
aws cloudformation deploy --template-file infrastructure/cognito-stack.yaml --stack-name ev-digital-twin-cognito --capabilities CAPABILITY_NAMED_IAM
aws cloudformation deploy --template-file infrastructure/backend-stack.yaml --stack-name ev-digital-twin-backend --capabilities CAPABILITY_NAMED_IAM
aws cloudformation deploy --template-file infrastructure/frontend-stack.yaml --stack-name ev-digital-twin-frontend --capabilities CAPABILITY_NAMED_IAM
```

### First Run
The system will automatically:
1. Generate sample tire and motor data for 5 vehicles over 180 days (including verified Honda Civic 2020)
2. Train machine learning models for both tire and motor systems
3. Launch the interactive unified CLI (local) or web interface (AWS)

## 📋 CLI Menu Options

```
🚗 VEHICLE MAINTENANCE SYSTEM - PoC
======================================
TIRE MANAGEMENT:
1. 📊 View Vehicle Fleet
2. 🔍 Analyze Vehicle Tires
3. 📈 View Tire Predictions
4. ⚠️  Detect Tire Anomalies

MOTOR MANAGEMENT:
10. ⚙️  View Motor Health
11. 🔧 Analyze Engine Performance
12. 📈 Motor Failure Predictions
13. ⚠️  Detect Motor Anomalies

UNIFIED OPERATIONS:
20. 📅 Schedule Appointment
21. 📋 View Appointments
22. 📄 Generate Report
23. 📊 Unified Fleet Dashboard
24. 🔄 Cross-System Analysis

SYSTEM:
30. 🔧 Regenerate Data
0. 🚪 Exit
```

## 🔍 Usage Examples

### 1. Fleet Overview
View all vehicles with their current tire status:
- 🟢 Good condition
- 🟡 Attention needed (anomalies detected)
- 🔴 Maintenance required (critical wear)

### 2. Vehicle Analysis
Detailed analysis of specific vehicle including:
- Current tire condition for all 4 positions
- Wear percentage and pressure status
- 90-day predictions for maintenance needs
- Detected anomalies with severity levels
- Prioritized recommendations with cost estimates

### 3. Predictive Analytics
- Predict tire wear for next 60 days
- Identify when maintenance will be needed
- Forecast replacement requirements
- Track wear patterns across tire positions

### 4. Anomaly Detection
- Detect unusual wear patterns
- Identify potential tire damage
- Alert on pressure irregularities
- Classify anomaly severity (High/Medium)

### 5. Motor Health Monitoring
- Real-time engine performance tracking
- Oil pressure and temperature monitoring
- Vibration level analysis
- Performance score assessment (0-100%)
- Failure risk evaluation (Low/Medium/High)

### 6. Motor Failure Predictions
- Performance degradation forecasting
- Maintenance timeline predictions
- Critical attention alerts
- Engine-specific analysis (I4, V6, V8, Hybrid)

### 7. Cross-System Analysis
- Correlate tire and motor issues
- Identify vehicles with multiple system problems
- Analyze driving pattern impacts across systems
- Unified maintenance scheduling

### 8. Appointment Scheduling
- Schedule various service types:
  - Tire Replacement & Rotation
  - Motor Maintenance & Oil Changes
  - Pressure & Performance Checks
  - Alignment & Engine Diagnostics
  - General Inspection

## 📊 Sample Data Structure

### Tire Wear Data
```csv
vehicle_id,date,make,model,year,tire_size,tire_brand,position,tread_depth_mm,pressure_psi,temperature_c,mileage,driving_pattern,weather_condition,anomaly,anomaly_type,maintenance_due,replacement_recommended
1,2024-01-15,Toyota,Camry,2020,215/60R16,Michelin,front_left,8.45,31.2,15.3,2450,city,dry,False,normal,False,False
```

### Motor Sensor Data
```csv
vehicle_id,date,make,model,year,engine_type,fuel_type,engine_temp_c,oil_pressure_psi,rpm_avg,speed_kmh,vibration_level,fuel_consumption_l100km,performance_score,mileage,driving_pattern,weather_condition,motor_anomaly,anomaly_type,failure_risk,maintenance_due
1,2024-01-15,Toyota,Camry,2020,I4,gasoline,89.2,24.5,2150,45.3,1.8,7.2,94.5,2450,city,dry,False,normal,0,False
```

### Car Manual Specifications
```csv
make,model,year,tire_size,recommended_pressure_psi,min_tread_depth_mm,replacement_threshold_mm,rotation_interval_miles,expected_lifespan_miles
Toyota,Camry,2020,215/60R16,32,2.0,4.0,6000,50000
```

## 🤖 Maintenance Agent Features

### Analysis Capabilities
- **Current Condition Assessment**: Real-time tire health evaluation
- **Predictive Modeling**: Future wear pattern predictions
- **Anomaly Detection**: Unusual pattern identification
- **Priority Classification**: Urgent/High/Medium/Low priority system

### Recommendation Engine
- **Immediate Actions**: Critical safety issues
- **Scheduled Maintenance**: Planned service recommendations
- **Cost Estimation**: Service cost predictions
- **Timeline Planning**: Optimal maintenance scheduling

### Report Generation
- **Comprehensive Reports**: Detailed vehicle analysis
- **Executive Summary**: Key metrics and costs
- **JSON Export**: Machine-readable format
- **Historical Tracking**: Maintenance history

## 🔧 Technical Architecture

### Machine Learning Models

#### Tire System Models
1. **Tire Wear Prediction Model** (Random Forest)
   - Features: Vehicle specs, driving patterns, weather, pressure, temperature
   - Target: Future tread depth
   - Accuracy: ~95% R² score

2. **Tire Anomaly Detection Model** (Isolation Forest)
   - Features: Tread depth, pressure, temperature, wear rate
   - Detection: Unusual patterns and outliers
   - Contamination rate: 10%

#### Motor System Models
3. **Motor Performance Model** (Random Forest)
   - Features: Engine specs, temperature, oil pressure, RPM, vibration
   - Target: Performance score (0-100%)
   - Accuracy: ~93% R² score

4. **Motor Failure Prediction Model** (Random Forest)
   - Features: Temperature, pressure, vibration, performance metrics
   - Target: Failure risk level (0-2)
   - Accuracy: ~91% R² score

5. **Motor Anomaly Detection Model** (Isolation Forest)
   - Features: Temperature, oil pressure, RPM, vibration, efficiency
   - Detection: Overheating, pressure drops, excessive vibration
   - Contamination rate: 10%

### Data Pipeline
```
Raw Data → Feature Engineering → Model Training → Predictions → Agent Analysis → CLI Display
```

## 📈 Key Metrics Tracked

### Tire Health Indicators
- **Tread Depth**: Current depth in millimeters
- **Wear Percentage**: Percentage of tire life used
- **Pressure Status**: PSI relative to manufacturer specs
- **Temperature Effects**: Environmental impact on tire performance

### Predictive Metrics
- **Days Until Maintenance**: Predicted maintenance timeline
- **Replacement Recommendations**: Proactive replacement alerts
- **Cost Projections**: Estimated maintenance expenses
- **Risk Assessment**: Safety risk evaluation

## 🎯 Business Value

### Cost Optimization
- **Predictive Maintenance**: Reduce unexpected tire failures
- **Optimal Timing**: Schedule maintenance at ideal intervals
- **Bulk Purchasing**: Plan tire purchases in advance
- **Labor Efficiency**: Optimize service scheduling

### Safety Enhancement
- **Early Warning System**: Detect issues before failure
- **Risk Mitigation**: Prevent tire-related accidents
- **Compliance Monitoring**: Ensure legal tread depth limits
- **Weather Adaptation**: Adjust for seasonal conditions

### Operational Efficiency
- **Fleet Visibility**: Real-time fleet tire health
- **Automated Scheduling**: Streamlined appointment booking
- **Data-Driven Decisions**: Evidence-based maintenance planning
- **Resource Allocation**: Optimize service bay utilization

## ☁️ AWS Cloud Architecture

When deployed to AWS, the solution uses a modern, scalable architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │────│   S3 Bucket      │    │   ECS Fargate   │
│   (Frontend)    │    │   (React App)    │    │   (Flask API)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │                        │                       │
         └────────────────────────┼───────────────────────┘
                                  │
                            ┌──────────────┐
                            │ Application  │
                            │ Load Balancer│
                            └──────────────┘
```

**Key Components:**
- **Frontend**: React app with AWS Cognito authentication served via CloudFront + S3 with Origin Access Control
- **Backend**: Flask API on ECS Fargate with auto-scaling
- **Authentication**: AWS Cognito User Pool with admin-only user creation
- **Load Balancer**: Application Load Balancer for high availability
- **Container Registry**: ECR for Docker image storage
- **Security**: VPC, Security Groups, IAM roles with least privilege, secure login

**Benefits:**
- 🚀 **Scalable**: Auto-scaling based on demand
- 🔒 **Secure**: Private networking with HTTPS encryption
- 💰 **Cost-effective**: Pay only for what you use
- 🌍 **Global**: CloudFront edge locations worldwide
- 📊 **Monitored**: CloudWatch logging and metrics

## 🔮 Future Enhancements

### Advanced Analytics
- **Deep Learning Models**: Neural networks for complex pattern recognition
- **Real-time Monitoring**: IoT sensor integration
- **Weather Integration**: API-based weather impact analysis
- **Route Optimization**: Driving pattern analysis

### Integration Capabilities
- **ERP Systems**: Connect with existing fleet management
- **Mobile Apps**: Smartphone interface for technicians
- **IoT Sensors**: Real-time tire pressure monitoring
- **Supplier APIs**: Automated parts ordering

### AI Enhancements
- **Natural Language Interface**: Chat-based interaction
- **Computer Vision**: Tire image analysis
- **Predictive Routing**: Optimize vehicle routes for tire longevity
- **Dynamic Pricing**: Real-time service cost optimization

## 📞 Support & Documentation

### Getting Help
- Check the CLI help system (built-in guidance)
- Review sample data structure
- Examine model training logs
- Analyze prediction accuracy metrics

### Customization
- Modify `data_generator.py` for different vehicle types
- Adjust model parameters in `tire_predictor.py`
- Customize agent logic in `maintenance_agent.py`
- Enhance CLI interface in `cli_interface.py`

---

**Built for demonstration purposes - Ready for production enhancement**

This PoC demonstrates the potential of AI-driven tire maintenance management, providing a foundation for enterprise-scale implementation with real-world data integration and advanced analytics capabilities.