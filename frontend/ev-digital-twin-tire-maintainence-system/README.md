# Homemade EV Digital Twin

A comprehensive EV digital twin dashboard built from scratch with React. Features interactive vehicle mapping, detailed component monitoring, predictive analytics, and real-time diagnostics across all major EV systems.

## 📋 Requirements

**Node.js & npm:**
- Node.js 16.x or higher
- npm 8.x or higher

**Required Dependencies:**
- `react` ^18.2.0 - Core React library
- `react-dom` ^18.2.0 - React DOM rendering
- `react-router-dom` ^6.30.1 - Client-side routing
- `papaparse` ^5.5.3 - CSV parsing for tire data integration
- `@aws-amplify/ui-react` ^6.11.2 - AWS Amplify UI components
- `aws-amplify` ^6.15.5 - AWS Amplify SDK
- `react-scripts` 5.0.1 - Create React App build tools

**IDE Extensions (Recommended):**
- **ES7+ React/Redux/React-Native snippets** - React code snippets
- **Prettier** - Code formatting
- **ESLint** - JavaScript linting
- **Auto Rename Tag** - HTML/JSX tag renaming
- **Bracket Pair Colorizer** - Matching bracket colors
- **GitLens** - Git integration and history
- JavaScript enabled

## 🚀 Quick Start

**1. Download Required Software:**
- **Node.js:** [Download Node.js 16+](https://nodejs.org/en/download/) (includes npm)
- **Git:** [Download Git](https://git-scm.com/downloads) (for cloning repository)
- **Code Editor:** [VS Code](https://code.visualstudio.com/) (recommended) or your preferred IDE

**2. Install VS Code Extensions (Optional but Recommended):**
- Open VS Code → Extensions (Ctrl+Shift+X)
- Search and install:
  - "ES7+ React/Redux/React-Native snippets"
  - "Prettier - Code formatter"
  - "ESLint"
  - "Auto Rename Tag"
  - "GitLens"

**3. Verify Installation:**
```bash
node --version  # Should show v16.x.x or higher
npm --version   # Should show 8.x.x or higher
git --version   # Should show git version
```

**4. Clone & Setup Project:**
```bash
git clone <this-repo>
cd homemade-ev-digital-twin
npm install     # Install all dependencies
npm start       # Start development server
```

**5. Open in Browser:**
- Automatically opens at `http://localhost:3000`
- If not, manually navigate to the URL
- You should see the EV Digital Twin dashboard

**Troubleshooting:**
- **Port 3000 in use?** Kill process: `npx kill-port 3000`
- **Permission errors?** Try: `sudo npm install` (macOS/Linux)
- **Dependencies issues?** Delete `node_modules` and run `npm install` again

## 🔧 Local Development with Backend

**Testing with GitLab Backend:**

1. **Clone and run your GitLab backend locally:**
   ```bash
   git clone <your-gitlab-backend-repo>
   cd <backend-directory>
   # Follow backend setup instructions (likely npm install, then npm start)
   ```

2. **Update frontend API endpoints:**
   - Create `.env.local` file in frontend root:
   ```bash
   REACT_APP_API_BASE_URL=http://localhost:8000  # Your backend port
   ```

3. **Test integration:**
   ```bash
   # Terminal 1: Start backend
   cd backend && npm start
   
   # Terminal 2: Start frontend
   cd frontend && npm start
   ```

## ✨ Features

- **Interactive Map** - Click vehicle markers to view details
- **Real-time Data** - Live battery percentages and status updates
- **Component Monitoring** - Motor, Battery, Invertor, Energy Management, Charger, and Tire systems
- **Predictive Analytics** - Failure prediction charts with remaining useful life indicators
- **GenAI Recommendations** - AI-powered optimization suggestions
- **Data Requirements Modal** - Component-specific data collection requirements
- **Responsive Design** - Fixed 1400x800px layout for consistency
- **AWS Ready** - Amplify integration prepared

## 🏗️ Architecture

**Core Components:**
- `MapView.js` - Main map interface with 5 vehicle markers
- `CarDetail.js` - Vehicle overview with navigation to subsystems
- `Motor.js` - Motor performance, electrical data, and bearing health
- `BatteryScreen.js` - Battery visualization, charging, and safety controls
- `Invertor.js` - Power metrics with rainbow gauge arcs and temperature monitoring
- `EnergyManagement.js` - Thermal management and regenerative braking data
- `Charger.js` - Charging sessions, efficiency metrics, and temperature monitoring
- `Tires.js` - Tire pressure, temperature, wear patterns, and road conditions
- `DataNeededModal.js` - Dynamic modal showing required data points per component

**Tech Stack:**
- React 18.2.0 + React Router
- Pure CSS with component-specific stylesheets
- SVG-based charts and visualizations
- AWS Amplify (ready for deployment)

## 📋 Documentation

See `PROJECT_DOCUMENTATION.md` for complete technical details, architecture overview, and development notes.

## 🎯 Status

✅ **Complete EV Digital Twin Dashboard**
- Interactive map with clickable vehicle markers
- Full navigation between all component views
- 6 comprehensive monitoring screens (Motor, Battery, Invertor, Energy Management, Charger, Tires)
- Predictive analytics with failure prediction charts
- GenAI recommendations for each component
- Data requirements documentation via modal system
- Consistent UI/UX across all components
- Real-time data simulation ready for backend integration

## 🔧 Component Features

**Motor System:**
- RPM, torque, and rotor position gauges with rainbow arcs
- Electrical metrics (phase currents, bus voltage, motor voltage)
- Bearing health indicators with color-coded status bars
- Temperature monitoring with trend charts
- Failure prediction with remaining useful life (70%)

**Battery System:**
- 32-module battery pack visualization with cell-level status
- Charging controls with real-time current and duration tracking
- Safety controls with toggle switches for various protection systems
- Fault detection grid with categorized alerts
- Driving details with ambient conditions and range estimation

**Invertor System:**
- Power metrics grid with voltage/current gauges
- Temperature monitoring with thermometer icon
- Pulse modulation visualization
- Fault code display with detailed descriptions
- DC link voltage monitoring

**Energy Management:**
- Thermal values in 4x4 grid layout with current/expected indicators
- Regenerative braking data with mixed chart types
- Energy recovery and braking force visualization
- Friction braking usage with stacked horizontal charts

**Charger System:**
- Charging sessions with 2x2 metrics grid
- Temperature monitoring positioned under charger icon
- Charge efficiency chart with orange bars and axis labels
- Divider visualization and warning indicators

**Tire System:**
- Individual tire monitoring (pressure, temperature, tread depth)
- Load distribution and wear pattern analysis
- Road surface condition tracking
- Vibration/frequency signature monitoring
- Event-based data collection for road conditions

## 🚀 Available Scripts

- `npm start` - Development server (opens http://localhost:3000)
- `npm build` - Production build
- `npm test` - Test runner

## 📁 Project Structure

```
src/
├── components/
│   ├── Motor.js              # Motor performance and diagnostics
│   ├── BatteryScreen.js      # Battery monitoring and charging
│   ├── Invertor.js           # Power electronics and temperature
│   ├── EnergyManagement.js   # Thermal and regenerative systems
│   ├── Charger.js            # Charging sessions and efficiency
│   ├── Tires.js              # Tire monitoring and road conditions
│   ├── DataNeededModal.js    # Dynamic data requirements modal
│   ├── CarDetail.js          # Vehicle overview and navigation
│   └── MapView.js            # Interactive vehicle map
├── css/
│   ├── motor.css             # Motor component styling
│   ├── invertor.css          # Invertor component styling
│   ├── energymanagement.css  # Energy management styling
│   ├── charger.css           # Charger component styling
│   └── dataneededmodal.css   # Modal styling
└── App.js                    # Main routing configuration
```

## 📐 Responsive Design Reference

**Cross-Screen Consistency Solution:**

The key to achieving consistent layout across laptop and large monitor screens was replacing viewport-based sizing with fixed dimensions:

```css
/* Fixed container dimensions */
.motor-container {
  width: 1400px;  /* Fixed width instead of max-width + 100% */
  height: 800px;  /* Fixed height instead of viewport calculations */
}

/* Fixed grid layout */
.motor-layout {
  grid-template-columns: calc(100% - 343px) 343px;  /* Maintains proportions */
  height: 720px;  /* Fixed height */
}
```

**What worked:**
- Fixed container sizing (1400px × 800px) eliminates viewport-based inconsistencies
- CSS Grid with `calc(100% - 343px) 343px` maintains exact proportions
- Centered positioning ensures consistent appearance on all screen sizes
- Components maintain identical dimensions regardless of monitor size

**Key principle:** For dashboard layouts requiring pixel-perfect consistency, use fixed dimensions rather than responsive scaling.

## 📊 Data Integration Ready

**Backend Repository:**
- Backend services and APIs are maintained in a separate GitLab repository
- Frontend is ready for integration with existing backend infrastructure
- See "Local Development with Backend" section above for testing setup

**Backend Integration Points:**
- Component-specific data requirements documented in DataNeededModal
- Real-time data simulation ready for AWS Lambda + DynamoDB integration
- Predictive analytics prepared for ML model integration
- GenAI recommendations structured for AI service integration

**Data Collection Frequencies:**
- **Motor:** Phase currents, voltages (hourly), RPM/torque (10-min), temperature (5-min)
- **Battery:** Cell voltages, temperatures (5-min), charging data (real-time)
- **Tires:** Pressure/temperature (5-min), wear patterns (daily), road conditions (event-based)
- **Invertor:** Power metrics (hourly), temperature (5-min), fault codes (real-time)

## 🎨 UI/UX Features

- **Consistent Header:** EV Digital Twin branding with user profile across all screens
- **Rainbow Gauge Arcs:** Half-circle battery indicators with green gradient styling
- **Prediction Charts:** Orange (past) and green (predicted) trend lines with grid backgrounds
- **State of Health Images:** Integrated health indicators in prediction panels
- **Modal System:** Component-specific data requirements with clean, sharp styling
- **Navigation:** Seamless routing between all component screens with back button functionality