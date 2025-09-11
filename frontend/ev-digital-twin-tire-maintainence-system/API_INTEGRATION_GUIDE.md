# API Integration Guide

## Mock Data to API Gateway Integration

### Service Layer Structure
```javascript
// src/services/apiService.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.gateway.url';

export const batteryService = {
  getBatteryData: async (vehicleId) => {
    if (process.env.NODE_ENV === 'development') {
      // Mock data for development
      return mockBatteryData();
    }
    
    const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/battery`);
    return response.json();
  }
};
```

### Real-Time Data Simulation
```javascript
// Mock real-time updates
const mockBatteryData = () => ({
  batteryLife: 85 + Math.random() * 10 - 5,
  drivingScore: 86 + Math.floor(Math.random() * 6) - 3,
  temperature: 72 + Math.sin(Date.now() / 60000) * 5,
  chargingCurrent: 53,
  timestamp: new Date().toISOString()
});

// Component polling pattern
useEffect(() => {
  const fetchData = async () => {
    const data = await batteryService.getBatteryData(carId);
    setBatteryData(data);
  };

  fetchData();
  const interval = setInterval(fetchData, 60000); // 1 minute
  return () => clearInterval(interval);
}, [carId]);
```

## Data Modeling Best Practices

### 1. Consistent Data Structure
```javascript
// Define clear interfaces
interface BatteryData {
  vehicleId: string;
  timestamp: string;
  batteryLife: number;        // 0-100
  batteryCapacity: number;    // 0-100
  powerCapability: number;    // 0-100
  drivingScore: number;       // 0-100
  temperature: number;        // Celsius
  chargingCurrent: number;    // Amperes
  chargingStatus: 'On' | 'Off' | 'Charging';
  range: number;              // Miles
  odometer: number;           // Kilometers
}
```

### 2. Error Handling Pattern
```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    const result = await apiService.getData();
    setData(result);
  } catch (err) {
    setError(err.message);
    // Fallback to cached/mock data
    setData(getCachedData());
  } finally {
    setLoading(false);
  }
};
```

### 3. Environment Configuration
```bash
# .env.development
REACT_APP_API_URL=http://localhost:3001
NODE_ENV=development

# .env.production
REACT_APP_API_URL=https://api.gateway.amazonaws.com/prod
NODE_ENV=production
```

## Testing Strategies

### 1. Mock Data Scenarios
```javascript
// Test different vehicle states
const testScenarios = {
  normal: { batteryLife: 85, status: 'Normal' },
  charging: { batteryLife: 45, status: 'Charging' },
  lowBattery: { batteryLife: 15, status: 'Warning' },
  critical: { batteryLife: 5, status: 'Critical' }
};

// Cycle through scenarios for testing
const [scenario, setScenario] = useState('normal');
const currentData = testScenarios[scenario];
```

### 2. API Response Validation
```javascript
const validateBatteryData = (data) => {
  const required = ['vehicleId', 'batteryLife', 'timestamp'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  if (data.batteryLife < 0 || data.batteryLife > 100) {
    throw new Error('Battery life must be between 0-100');
  }
  
  return data;
};
```

### 3. Component Testing
```javascript
// Test with different data states
const TestWrapper = ({ scenario }) => {
  const mockData = testScenarios[scenario];
  return <BatteryScreen data={mockData} />;
};

// Usage: <TestWrapper scenario="lowBattery" />
```

## Backend Integration Checklist

### API Endpoints
- `GET /vehicles/{id}/battery` - Current battery data
- `GET /vehicles/{id}/motor` - Motor performance data  
- `GET /vehicles/{id}/tires` - Tire condition data
- `POST /vehicles/{id}/controls` - Send control commands

### Data Consistency
- Use ISO 8601 timestamps
- Consistent units (Celsius, kilometers, etc.)
- Standardized status enums
- Proper HTTP status codes

### Real-Time Updates
- WebSocket connection for live data
- Polling fallback for reliability
- Offline data caching
- Connection retry logic

### Security
- API key authentication
- CORS configuration
- Rate limiting
- Input validation

## Mock API Data Examples

### Motor Performance Data
```json
{
  "vehicleId": "VIN123456789",
  "timestamp": "2024-01-15T10:30:00Z",
  "performance": {
    "rpm": 6345,
    "torqueOutput": 37,
    "rotorPosition": "XXX",
    "insulationResistance": "XXX",
    "motorTemperature": 54
  },
  "bearingHealth": {
    "radians": { "value": 85, "status": "warning" },
    "outerFactor": { "value": 92, "status": "good" },
    "lowerSpeeds": { "value": 95, "status": "good" }
  },
  "electrical": {
    "phaseCurrents": 234,
    "busVoltage": 300,
    "motorVoltage": 323,
    "powerOutput": 323
  },
  "performance": {
    "energyConsumption": "XX",
    "vibrationLevels": "05 g RMS",
    "canBusData": "RAW",
    "noiseLevels": "55 dB",
    "coolantFlowRate": "XX"
  },
  "prediction": {
    "remainingUsefulLife": 70,
    "failurePrediction": {
      "pastData": [200, 190, 180, 170, 160, 150, 145],
      "predictedData": [140, 135, 130, 125, 120, 115, 110]
    }
  }
}
```

### Tires Data
```json
{
  "vehicleId": "VIN123456789",
  "timestamp": "2024-01-15T10:30:00Z",
  "tires": {
    "frontLeft": {
      "pressure": 32,
      "treadDepth": 8.5,
      "wearPattern": "Even",
      "load": "2,200 lbs",
      "temperature": 95
    },
    "frontRight": {
      "pressure": 31,
      "treadDepth": 8.2,
      "wearPattern": "Even",
      "load": "2,150 lbs",
      "temperature": 93
    },
    "rearLeft": {
      "pressure": 33,
      "treadDepth": 7.8,
      "wearPattern": "Slight Inner",
      "load": "2,300 lbs",
      "temperature": 98
    },
    "rearRight": {
      "pressure": 32,
      "treadDepth": 7.9,
      "wearPattern": "Even",
      "load": "2,280 lbs",
      "temperature": 96
    }
  },
  "roadConditions": {
    "distance": "25 miles",
    "surfaceType": "Smooth Surface",
    "frequency": "100 Hz",
    "vibrationSignature": "Normal"
  },
  "prediction": {
    "stateOfHealth": 78,
    "remainingLife": 65,
    "replacementTimes": {
      "frontTires": "8-10 months",
      "rearTires": "6-8 months"
    }
  }
}
```

### Battery Data
```json
{
  "vehicleId": "VIN123456789",
  "timestamp": "2024-01-15T10:30:00Z",
  "batteryPack": {
    "name": "Battery Name",
    "modules": 32,
    "cellHealth": {
      "normal": 31,
      "warning": 1,
      "critical": 0
    }
  },
  "charging": {
    "status": "On",
    "current": 53,
    "voltage": 238,
    "fastChargeDuration": "00:34:34",
    "chargeTimeToTarget": "00:00:32",
    "totalChargingTime": "00:02:32",
    "percentCharged": 75
  },
  "driving": {
    "drivingScore": 86,
    "ambientTemperature": 72,
    "range": 315,
    "odometer": 50546
  },
  "health": {
    "remainingBatteryLife": 85,
    "batteryCapacity": 75,
    "powerCapability": 70,
    "stateOfHealth": {
      "pastData": [200, 195, 190, 185, 180, 175, 170],
      "predictedData": [165, 160, 155, 150, 145, 140, 135]
    }
  },
  "safety": {
    "faultDetection": "No faults detected",
    "controls": ["Cell Balancing", "Start Cooling", "Start Heating"]
  }
}
```

## Migration Path

1. **Phase 1**: Mock data with timer updates
2. **Phase 2**: Static API endpoints
3. **Phase 3**: Real-time WebSocket integration
4. **Phase 4**: Full AWS IoT integration

This structure ensures smooth transition from development to production without code changes in components.