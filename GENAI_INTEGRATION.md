# GenAI Integration - Claude Sonnet 4.5 for Tire Analysis

## Overview

The EV Digital Twin tire component now features real-time GenAI analysis powered by **Claude Sonnet 4.5** via AWS Bedrock. This provides sophisticated, contextual tire maintenance recommendations based on actual vehicle data with enhanced reasoning capabilities.

## Features

### 🤖 **Real-Time GenAI Analysis**
- Direct integration with Claude Sonnet 4.5 via AWS Bedrock
- Advanced tire condition analysis with enhanced reasoning capabilities
- Context-aware recommendations based on vehicle specifications
- Real-time processing with 30-second intelligent caching

### 📊 **Enhanced Tire Metrics**
- **Realistic PSI Variations**: ±0.1-0.8 PSI every 3 seconds based on driving conditions
- **Temperature Adjustments**: Seasonal corrections (5-45°C realistic range)
- **Tread Depth Precision**: Rounded to realistic 0.5mm increments
- **Load Distribution**: Accurate front/rear weight distribution (56%/44%)

### 🎯 **Intelligent Recommendation System**
1. **Priority 1**: Claude Sonnet 4.5 GenAI recommendations (Enhanced reasoning)
2. **Priority 2**: ML analysis recommendations (existing system)
3. **Priority 3**: Rule-based recommendations (fallback)

### 🔧 **Production-Ready Architecture**
- Secure AWS credentials management
- Robust fallback systems
- Performance optimization with caching
- Error handling and graceful degradation

## Setup Instructions

### 1. **AWS Credentials Configuration**

For GenAI functionality, set the following environment variables:

```bash
# In .env.local or deployment environment
REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_here
REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_key_here
REACT_APP_AWS_SESSION_TOKEN=your_session_token_here
```

### 2. **AWS Bedrock Permissions**

Ensure your AWS credentials have the following permissions:
- `bedrock:InvokeModel` for Claude Sonnet 4.5
- Access to model ID: `anthropic.claude-sonnet-4-5-20250929-v1:0`
- Note: May require inference profile access for newer models

### 3. **Dependencies**

The following packages are automatically installed:
- `@aws-sdk/client-bedrock-runtime`: Direct Bedrock API access

## How It Works

### **Data Flow**
1. **Data Collection**: Real tire metrics (PSI, temperature, tread depth, vehicle info)
2. **GenAI Analysis**: Advanced prompts sent to Claude Sonnet 4.5 with enhanced reasoning
3. **Response Processing**: Structured analysis with improved recommendations
4. **UI Display**: Enhanced interface with source indicators

### **GenAI Prompt Structure**
```
VEHICLE: 2020 Honda Civic (ID: 1)
TIRE SPECIFICATIONS: Michelin 215/55R16

CURRENT TIRE METRICS:
- Pressure: 31.2 PSI
- Temperature: 28°C  
- Tread Depth: 7.5mm
- Driving Pattern: highway
- Weather Conditions: dry

ANALYSIS REQUIREMENTS:
1. Evaluate against optimal ranges
2. Consider metric interactions
3. Factor in driving conditions
4. Provide 2-4 prioritized recommendations
5. Include urgency levels and timeframes
```

### **Response Format**
```json
{
  "overall_status": "WARNING",
  "risk_level": "MEDIUM",
  "key_findings": [
    "Pressure slightly below optimal range",
    "Tread depth approaching replacement threshold"
  ],
  "recommendations": [
    {
      "action": "Inflate tire to 32-35 PSI within 24 hours",
      "priority": "HIGH",
      "reason": "Current pressure 31.2 PSI below optimal range",
      "urgency": "Within 1 day"
    }
  ],
  "next_inspection": "2 weeks"
}
```

## UI Enhancements

### **Visual Indicators**
- **🤖 Claude Sonnet 4.5**: Shows when GenAI is active
- **Loading Spinner**: "Analyzing..." during processing
- **Source Badges**: GenAI/ML/Rule tags on recommendations
- **Status Colors**: Green/Yellow/Red for condition severity

### **Key Findings Section**
Highlighted insights from Claude Sonnet 4.5 analysis:
```
🔍 Key Findings:
• Pressure deviation detected in front-right tire
• Temperature differential suggests alignment issue
• Tread wear pattern indicates rotation needed
```

### **Recommendation Details**
Enhanced recommendation display:
```
🚨 URGENT: Inflate tire to 32-35 PSI within 24 hours    [GenAI]
   Reason: Current pressure 31.2 PSI below optimal range
   Urgency: Within 1 day
```

## Performance Optimization

### **Caching Strategy**
- 30-second cache for GenAI responses
- Debounced analysis calls (2-second stabilization)
- Intelligent cache invalidation on significant data changes

### **Fallback System**
1. **GenAI Available**: Full Claude Sonnet 4.5 analysis with enhanced reasoning
2. **GenAI Unavailable**: ML-based recommendations
3. **All Systems Down**: Rule-based fallback recommendations

## Monitoring & Debugging

### **Console Logging**
```javascript
// GenAI analysis logging
console.log('Sending tire data to Claude Sonnet 4.5:', tireData);
console.log('Received GenAI analysis:', analysis);

// Realistic metrics logging
console.log('Realistic Tire Metrics - PSI: 31.2 | Temp: 28°C | Tread: 7.5mm');
```

### **Error Handling**
- Graceful degradation on Bedrock failures
- Automatic fallback to ML/rule-based systems
- User-friendly error messages
- Comprehensive logging for debugging

## Security Considerations

### **Credential Management**
- Environment variable-based configuration
- No hardcoded credentials in source code
- Secure credential rotation support
- Demo mode for development/testing

### **Data Privacy**
- Vehicle data processed securely via AWS Bedrock
- No persistent storage of sensitive information
- Compliance with AWS security standards

## Deployment

### **Production Deployment**
1. Set AWS credentials in deployment environment
2. Ensure Bedrock permissions are configured
3. Deploy with standard build process
4. Monitor GenAI functionality via console logs

### **Development Mode**
- Runs in demo mode without valid AWS credentials
- Falls back to ML/rule-based recommendations
- Full UI functionality maintained for testing

## Troubleshooting

### **Common Issues**

**GenAI not activating:**
- Check AWS credentials in environment variables
- Verify Bedrock permissions
- Check console for error messages

**Slow response times:**
- Normal for first request (cold start)
- Subsequent requests use 30-second cache
- Monitor network connectivity to AWS

**Fallback recommendations showing:**
- Expected behavior when GenAI unavailable
- Check AWS service status
- Verify credential validity

## Future Enhancements

- **Multi-vehicle analysis**: Fleet-wide GenAI insights
- **Predictive maintenance**: Advanced failure prediction
- **Cost optimization**: Maintenance cost analysis
- **Integration expansion**: Motor and battery GenAI analysis

---

**Note**: This GenAI integration represents a significant advancement in automotive digital twin technology, providing real-time, contextual insights that enhance vehicle maintenance decision-making.