# EV Digital Twin - Frontend Application

React-based frontend for the EV Digital Twin predictive maintenance system with real-time vehicle monitoring, AI-powered recommendations, and browser automation.

---

## 🚀 Quick Start

**Recommended IDEs:**
- **Kiro** - AI-powered IDE with intelligent code assistance
- **VS Code** - Popular choice with React extensions

```bash
# Install dependencies
npm install

# Start development server
npm start
```

**Development server:** http://localhost:3000

**Note:** Frontend connects to deployed AWS backend (AgentCore Runtime, Lambda, DynamoDB). Backend must be deployed first.

### Local Development Setup

**Prerequisites:**
- Node.js 18+ and npm 8+
- AWS backend deployed (AgentCore Runtime, Lambda, DynamoDB)
- IDE (Kiro or VS Code recommended)

**Environment Configuration:**

The frontend is configured to connect to the deployed AWS backend. API endpoints are defined in `src/services/agentcore.js`:

```javascript
const AGENTCORE_API_ENDPOINT = "https://b4blc4xmh4.execute-api.us-east-1.amazonaws.com/chat";
```

**For local development:**
1. Ensure AWS backend is deployed and accessible
2. Run `npm install` to install all dependencies
3. Run `npm start` to start the development server
4. Frontend will connect to AWS backend automatically
5. Test features: Fleet Portal, AI analysis, tire ordering, live view

**Hot Reload:**
- Code changes automatically refresh the browser
- Component updates reflect instantly
- No need to restart the dev server

---

## 🔄 User Flow & Agentic AI Features

### Event-Driven Agentic Architecture

The frontend leverages **event-driven agentic AI** through component-specific interactions:

**1. Fleet Portal → AI Analysis**
```
User clicks "Analyze" → Frontend calls AgentCore API → Claude Sonnet 4.5 analyzes vehicle data → 
AI selects appropriate tools (analyze_tire_condition, analyze_motor_performance, etc.) → 
Structured recommendations returned → Displayed in Fleet Portal
```

**2. Tire Ordering → Browser Automation**
```
User clicks "Order Tires" → Async job created → Worker Lambda invoked → 
AgentCore Runtime executes order_tire_online tool → NovaAct browser automation → 
Live view URL generated → User watches automation in real-time → 
Tire added to Amazon cart → Result returned to frontend
```

**3. Appointment Scheduling → DynamoDB Integration**
```
User requests appointment → AI agent calls get_available_slots tool → 
DynamoDB queried for open slots → AI presents options → 
User selects slot → schedule_appointment tool books appointment → 
Confirmation displayed
```

### Component-Specific AI Interactions

**Vehicle1Tires.js (Tire Failure Scenario):**
- Detects uneven wear patterns
- AI recommends immediate tire replacement
- Triggers automated tire ordering workflow
- Displays driver actions and service requirements

**Vehicle2Motor.js (Motor Overheating Scenario):**
- Monitors engine temperature and performance
- AI predicts failure risk
- Recommends diagnostic check
- Shows maintenance timeline

**Vehicle3Inverter.js (Thermal Failure Scenario):**
- Tracks power electronics temperature
- AI detects cooling system issues
- Suggests thermal management service
- Displays critical alerts

**Generic Components (Tires.js, motor.js, Invertor.js):**
- Flexible monitoring for any vehicle
- AI adapts recommendations based on sensor data
- ML predictions for wear and failure
- Knowledge Base integration for manual guidance

---

## ✨ Features

### Fleet Management Portal
- **Fleet Overview**: Monitor all vehicles from unified dashboard
- **AI Recommendations**: Claude Sonnet 4.5 powered maintenance suggestions
- **Automated Tire Ordering**: Browser automation orders tires from Amazon
- **Live View**: Watch browser automation in real-time with DCV Web Client SDK
- **Appointment Scheduling**: Book maintenance appointments with available slot finder

### Vehicle Monitoring
- **Tire Health**: Pressure, tread depth, temperature monitoring with ML predictions
- **Motor Performance**: Engine diagnostics, failure prediction, anomaly detection
- **Inverter Health**: Power electronics monitoring and thermal management
- **Interactive Map**: Visual fleet overview with vehicle status indicators
- **Real-time Updates**: Live data polling from backend services

### AI-Powered Analysis
- **Natural Language Interface**: Chat with AI agent for vehicle analysis
- **Predictive Analytics**: 90-day maintenance forecasting
- **Anomaly Detection**: Unusual pattern identification across all systems
- **Knowledge Base Integration**: Bedrock KB with vehicle maintenance manuals
- **Memory-Powered Insights**: Recurring issue detection across fleet

---

## 🏗️ Architecture

### Component Structure

```
src/
├── components/
│   ├── fleet/
│   │   └── FleetPortal.js           # Main fleet management dashboard
│   ├── browser-live-view/
│   │   ├── BrowserLiveViewPage.js   # Live browser automation viewer
│   │   └── BrowserLiveViewModal.js  # DCV Web Client integration
│   ├── vehicle1/
│   │   └── Vehicle1Tires.js         # Vehicle 1 tire monitoring
│   ├── vehicle2/
│   │   ├── Vehicle2Motor.js         # Vehicle 2 motor monitoring
│   │   └── Vehicle2ConnVehicle.js   # Vehicle 2 overview
│   ├── vehicle3/
│   │   └── Vehicle3Inverter.js      # Vehicle 3 inverter monitoring
│   ├── vehicle4/
│   │   └── Vehicle4ConnVehicle.js   # Vehicle 4 overview
│   ├── Tires.js                     # Generic tire monitoring
│   ├── motor.js                     # Generic motor monitoring
│   ├── Invertor.js                  # Generic inverter monitoring
│   ├── EnergyManagement.js          # Energy and thermal management
│   ├── Dashboard.js                 # Main dashboard
│   ├── InteractiveMapView.js        # Fleet map visualization
│   └── DataNeededModal.js           # Data requirements modal
├── services/
│   └── agentcore.js                 # AgentCore API service
└── App.js                           # Main routing
```

### Tech Stack

- **React** 18.2.0 - UI framework
- **React Router** 6.30.1 - Client-side routing
- **Papa Parse** 5.5.3 - CSV data parsing
- **AWS Amplify** 6.15.5 - Authentication (Cognito)
- **DCV Web Client SDK** - Browser live view streaming

### Backend Integration

**API Endpoints:**
- `POST /chat` - AgentCore Runtime chat interface
- `POST /tire-order/start` - Start async tire ordering
- `GET /tire-order/status/{job_id}` - Poll tire order status
- `GET /browser-live-view/{job_id}` - Get live view URL
- `GET /genai-recs/{vin}` - Cached AI recommendations
- `GET /available-appointments` - Available appointment slots

**Services:**
- AgentCore Runtime (17 specialized tools)
- Lambda functions (proxy + worker)
- DynamoDB (appointments, jobs, recommendations)
- Bedrock Knowledge Base (vehicle manuals)

---

## 📋 Requirements

**Node.js & npm:**
- Node.js 18+ or higher
- npm 8+ or higher

**Key Dependencies:**
- `react` ^18.2.0
- `react-router-dom` ^6.30.1
- `papaparse` ^5.5.3
- `aws-amplify` ^6.15.5
- `@aws-amplify/ui-react` ^6.11.2

---

## 🔧 Available Scripts

- **`npm start`** - Start development server (http://localhost:3000)
- **`npm build`** - Create production build
- **`npm test`** - Run test suite

---

## 🎯 Key Components

### Fleet Portal (`fleet/FleetPortal.js`)
Main dashboard for fleet management with:
- Vehicle health overview (tire, motor, inverter)
- AI-powered maintenance recommendations
- Automated tire ordering with live view
- Appointment scheduling
- Real-time status updates

### Browser Live View (`browser-live-view/BrowserLiveViewPage.js`)
Real-time browser automation viewer with:
- DCV Web Client SDK integration
- WebSocket streaming
- Full-screen browser session display
- Live tire ordering visualization

### Vehicle-Specific Components
- **Vehicle1Tires.js** - Tire failure scenario (EV-1001)
- **Vehicle2Motor.js** - Motor overheating scenario (EV-1002)
- **Vehicle3Inverter.js** - Inverter thermal failure scenario (EV-1003)

### Generic Monitoring Components
- **Tires.js** - Tire health monitoring with ML predictions
- **motor.js** - Motor performance and diagnostics
- **Invertor.js** - Inverter health and power electronics

---

## 🔒 Authentication

**AWS Cognito Integration:**
- Admin-only user creation (self-registration disabled)
- JWT token validation
- Session management
- Secure API calls

**Login Flow:**
1. User enters credentials
2. Cognito validates and issues JWT
3. Frontend stores token
4. All API calls include JWT in headers

---

## 🌐 Deployment

**Production Build:**
```bash
npm run build
```

**Deploy to S3:**
```bash
aws s3 sync build/ s3://ev-digital-twin-frontend-<account-id>-us-east-1/ --delete
```

**CloudFront Invalidation:**
```bash
aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/*"
```

See main project README for complete deployment instructions.

---

## 📚 Documentation

- **Main README**: `../../README.md` - Complete project documentation
- **AgentCore Setup**: `../../docs/AGENTCORE_SETUP.md` - Backend configuration
- **IAM Policies**: `../../docs/IAM_POLICIES.md` - Security setup

---

## 🎨 UI/UX Features

- **Responsive Design**: Optimized for desktop and mobile
- **Real-time Updates**: Live data polling from backend
- **Interactive Charts**: ML predictions and historical trends
- **Status Indicators**: Color-coded health status (🟢 Good, 🟡 Attention, 🔴 Critical)
- **Modal System**: Clean data requirements and full analysis views
- **Modern Styling**: Dark theme with neon accents

---

**Built with React - Powered by Amazon Bedrock AgentCore**
