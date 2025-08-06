# 🚗 Tire Maintenance PoC - Predictive Analytics & AI Agent

A comprehensive Proof of Concept for tire maintenance management using machine learning for predictive analytics and anomaly detection, with an intelligent maintenance agent for scheduling and recommendations.

## 🎯 Features

### Core Capabilities
- **📊 Predictive Analytics**: ML models predict tire wear patterns and maintenance needs
- **⚠️ Anomaly Detection**: Identify unusual tire wear patterns and potential issues
- **🤖 Maintenance Agent**: AI-powered agent for analysis and appointment scheduling
- **📈 Fleet Management**: Monitor entire vehicle fleet tire health
- **📱 CLI Interface**: Interactive terminal-based interface for easy interaction

### Key Components
1. **Data Generation**: Realistic tire wear simulation with anomalies
2. **Machine Learning**: Random Forest for wear prediction, Isolation Forest for anomaly detection
3. **Maintenance Agent**: Intelligent analysis and recommendation system
4. **Interactive CLI**: User-friendly terminal interface

## 🚀 Quick Start

### Installation
```bash
# Navigate to project directory
cd tire-maintenance-poc

# Install dependencies
pip install -r requirements.txt

# Run the CLI interface
python cli_interface.py
```

### First Run
The system will automatically:
1. Generate sample tire data for 20 vehicles over 180 days
2. Train machine learning models
3. Launch the interactive CLI

## 📋 CLI Menu Options

```
🚗 TIRE MAINTENANCE SYSTEM - PoC
====================================
1. 📊 View Vehicle Fleet
2. 🔍 Analyze Vehicle Tires
3. 📈 View Tire Predictions
4. ⚠️  Detect Anomalies
5. 📅 Schedule Appointment
6. 📋 View Appointments
7. 📄 Generate Report
8. 📊 Fleet Dashboard
9. 🔧 Regenerate Data
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

### 5. Appointment Scheduling
- Schedule various service types:
  - Tire Replacement
  - Tire Rotation
  - Pressure Check
  - Alignment Check
  - General Inspection

## 📊 Sample Data Structure

### Tire Wear Data
```csv
vehicle_id,date,make,model,year,tire_size,tire_brand,position,tread_depth_mm,pressure_psi,temperature_c,mileage,driving_pattern,weather_condition,anomaly,anomaly_type,maintenance_due,replacement_recommended
1,2024-01-15,Toyota,Camry,2020,215/60R16,Michelin,front_left,8.45,31.2,15.3,2450,city,dry,False,normal,False,False
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
1. **Wear Prediction Model** (Random Forest)
   - Features: Vehicle specs, driving patterns, weather, pressure, temperature
   - Target: Future tread depth
   - Accuracy: ~95% R² score

2. **Anomaly Detection Model** (Isolation Forest)
   - Features: Tread depth, pressure, temperature, wear rate
   - Detection: Unusual patterns and outliers
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