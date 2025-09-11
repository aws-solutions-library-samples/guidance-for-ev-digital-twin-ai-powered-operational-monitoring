# Homemade EV Digital Twin - Project Documentation

## 📋 Project Overview

A minimal EV digital twin dashboard prototype built from scratch, inspired by the original ev-digital-twin but with simplified, clean code. Features real-time vehicle monitoring, interactive map interface, and detailed vehicle views.

## 🏗️ Architecture

**Tech Stack:**
- **Frontend:** React 18.2.0
- **Routing:** React Router DOM 6.8.0
- **Styling:** Pure CSS (no external UI libraries)
- **Backend Ready:** AWS Amplify integration prepared
- **Build Tool:** Create React App

**Design Principles:**
- Minimal code implementation
- Component-based architecture
- Responsive grid layouts
- Dark theme with EV-specific color scheme

## 📁 Key Files Structure

```
homemade-ev-digital-twin/
├── public/
│   └── index.html                 # Main HTML template
├── src/
│   ├── components/
│   │   ├── MapView.js            # 🔑 Main map interface with vehicle markers
│   │   ├── CarDetail.js          # 🔑 Individual vehicle detail view
│   │   ├── Dashboard.js          # Dashboard with real-time metrics
│   │   └── Sidebar.js            # Navigation sidebar (unused in final)
│   ├── App.js                    # 🔑 Main routing configuration
│   ├── App.css                   # 🔑 All styling definitions
│   ├── index.js                  # 🔑 App entry point with routing
│   └── aws-exports.js            # AWS Amplify configuration
├── package.json                  # Dependencies and scripts
├── amplify-setup.md             # AWS setup instructions
└── PROJECT_DOCUMENTATION.md     # This file
```

## 🔑 Core Components

### 1. MapView.js
**Purpose:** Main landing page with interactive vehicle map
**Key Features:**
- 5 vehicle markers with real-time battery percentages
- Color-coded status (Green=charging, Orange=low, Gray=idle)
- Click-to-navigate functionality
- Bottom legend with vehicle counts
- Header with user profile

**Data Structure:**
```javascript
vehicles = [
  { id: 1, x: 1500, y: 380, status: 'charging', battery: 85 },
  { id: 2, x: 1550, y: 500, status: 'low', battery: 15 },
  // ... 3 more vehicles
]
```

### 2. CarDetail.js
**Purpose:** Detailed vehicle information page
**Key Features:**
- Vehicle-specific data display
- Main panel with image, metrics, and status checks
- Right sidebar with powertrain, battery, and service info
- Back navigation to map
- Responsive grid layout

**Layout Structure:**
- Header (consistent across app)
- Back button with VIN display
- Main content panel (single bordered box)
- Right sidebar (multiple info panels)

### 3. App.js
**Purpose:** Main routing configuration
**Routes:**
- `/` → MapView (home page)
- `/car/:carId` → CarDetail (vehicle details)

### 4. App.css
**Purpose:** Complete styling system
**Key Sections:**
- Global styles and layout
- Header and navigation
- Map interface and markers
- Car detail layouts
- Responsive design rules

## 🎨 Design System

**Color Palette:**
- Background: `#2d343d` (dark gray)
- Panels: `#1b1e20` (darker gray)
- Borders: `#3a4552` (medium gray)
- Accent: `#00ff88` (bright green)
- Text: `#ffffff` (white)
- Status Colors:
  - Charging: `#4CAF50` (green)
  - Low Battery: `#DD9436` (orange)
  - Idle: `#474B54` (gray)

**Typography:**
- Primary: Amazon Ember
- Secondary: Roboto
- Fallback: System fonts

## 🚀 Features Implemented

### ✅ Map Interface
- Interactive SVG-based vehicle markers
- Real-time battery percentage display
- Color-coded vehicle status
- Click navigation to detail views
- Responsive legend with counts

### ✅ Vehicle Details
- Individual vehicle data pages
- Comprehensive metrics display
- Status monitoring (safety checks, faults)
- Battery health visualization
- Service history tracking

### ✅ Navigation
- React Router integration
- Seamless page transitions
- Back button functionality
- URL-based vehicle access

### ✅ Responsive Design
- Grid-based layouts
- Mobile-friendly interface
- Scalable components
- Consistent spacing

## 🔧 Development Setup

**Installation:**
```bash
cd homemade-ev-digital-twin
npm install
npm start  # Runs on http://localhost:3000
```

**Available Scripts:**
- `npm start` - Development server
- `npm build` - Production build
- `npm test` - Test runner

## 🌐 AWS Amplify Integration

**Current Status:** Prepared but not active
**Setup Required:**
1. Run `amplify init`
2. Add authentication: `amplify add auth`
3. Add API: `amplify add api`
4. Deploy: `amplify push`
5. Add hosting: `amplify add hosting`

**Files Ready:**
- `aws-exports.js` - Configuration placeholder
- `amplify-setup.md` - Detailed setup guide
- Amplify packages installed

## 📊 Data Flow

```
MapView → Click Vehicle → Navigate to /car/:id
    ↓
CarDetail → Load vehicle data → Display metrics
    ↓
Back Button → Navigate to / → Return to MapView
```

**Mock Data:**
- 5 vehicles with unique IDs, VINs, battery levels
- Simulated real-time updates (every 2 seconds)
- Status-based color coding

## 🎯 Key Achievements

1. **Minimal Codebase** - Clean, readable implementation
2. **Original Design Match** - Closely replicates ev-digital-twin layout
3. **Interactive Navigation** - Seamless map-to-detail flow
4. **Responsive Layout** - Works across screen sizes
5. **Extensible Architecture** - Easy to add new features
6. **AWS Ready** - Prepared for cloud deployment

## 🔮 Future Enhancements

**Immediate:**
- Real data integration
- More vehicle metrics
- Chart/graph components
- User authentication

**Advanced:**
- Real-time WebSocket updates
- Historical data analysis
- Predictive maintenance alerts
- Multi-user support

## 📝 Development Notes

**Design Decisions:**
- Used SVG for lightweight, scalable markers
- Single CSS file for simplicity
- Mock data for rapid prototyping
- Grid layouts for responsive design

**Performance Optimizations:**
- Minimal dependencies
- Efficient re-renders
- Optimized asset loading
- Clean component structure

---

**Total Development Time:** ~2 hours
**Lines of Code:** ~800 (excluding dependencies)
**Components:** 4 main components
**Routes:** 2 primary routes
**Status:** ✅ Fully functional prototype