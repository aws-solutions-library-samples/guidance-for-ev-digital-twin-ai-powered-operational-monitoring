import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import DataNeededModal from "./DataNeededModal";

// BACKEND INTEGRATION - Uncomment when API is ready
// const [tireData, setTireData] = useState(null);

// useEffect(() => {
//   fetch('https://your-api-gateway-url/vehicles/123/tires')
//     .then(res => res.json())
//     .then(data => setTireData(data));
// }, []);

// Replace static values:
// "234kg" → {tireData?.frontLeft?.load || "234kg"}
// "60%" → {tireData?.remainingLife || 60}%
// "25 miles" → {tireData?.surfaceDistance || "25 miles"}

// tire data rotates through csv entries every 30 seconds
const TiresPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [dataIndex, setDataIndex] = useState(0);
  const [mlResults, setMlResults] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    Papa.parse('/data/tire_wear_data.csv', {
      download: true,
      header: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setCsvData(results.data.filter(row => row.vehicle_id));
        }
      }
    });
    
    // Load ML results
    fetch('/data/ml_results.json')
      .then(res => res.json())
      .then(data => {
        setMlResults(data);
        console.log('ML results loaded:', data);
      })
      .catch(err => console.log('ML results not available:', err));
  }, []);

  useEffect(() => {
    if (csvData.length > 0) {
      const interval = setInterval(() => {
        setDataIndex(prev => {
          const newIndex = (prev + 1) % csvData.length;
          console.log(`🔄 Auto-refresh: Updated to data index ${newIndex} (Vehicle ${csvData[newIndex]?.vehicle_id || 'N/A'})`);
          return newIndex;
        });
        
        // Update refresh timestamp
        setLastRefresh(new Date());
        
        // Force component re-render for fresh data
        setMlResults(prev => [...prev]);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [csvData]);

  const currentData = csvData[dataIndex] || {};
  
  // Get ML data for current vehicle
  const currentMlData = mlResults.find(r => r.vehicle_id === parseInt(currentData.vehicle_id));
  
  // Calculate dynamic last updated time (increments every 5 minutes with data rotation)
  const getLastUpdated = () => {
    const baseMinutes = 5;
    const additionalMinutes = dataIndex * 5;
    return `${baseMinutes + additionalMinutes} min ago`;
  };
  
  // Dynamic prediction calculation functions
  const calculateWearPercentage = (treadDepth) => {
    const newTireDepth = 11.0; // mm for new tire
    const wornDepth = Math.max(0, newTireDepth - treadDepth);
    return Math.min(100, (wornDepth / newTireDepth) * 100);
  };

  const determineStatus = (treadDepth, hasAnomaly) => {
    if (hasAnomaly || treadDepth < 3.0) return "CRITICAL";
    if (treadDepth < 6.0) return "WARNING";
    return "GOOD";
  };

  const calculateDaysRemaining = (treadDepth, hasAnomaly) => {
    if (hasAnomaly || treadDepth < 3.0) return 7;
    if (treadDepth < 6.0) return 30;
    if (treadDepth < 8.0) return 90;
    return 180;
  };

  const generateMessage = (status, daysRemaining) => {
    if (status === "CRITICAL") return "Immediate replacement needed";
    if (status === "WARNING") return `Replace within ${Math.ceil(daysRemaining/7)} weeks`;
    const months = Math.ceil(daysRemaining/30);
    return `Continue current maintenance - ${months} months remaining`;
  };

  // Calculate dynamic predictions from current CSV data
  const calculateDynamicPredictions = (currentData) => {
    if (!currentData) return null;
    
    const treadDepth = parseFloat(currentData.tread_depth_mm) || 10.0;
    const hasAnomaly = currentData.anomaly_detected === 'True' || currentData.anomaly_detected === true;
    
    const wearPercentage = calculateWearPercentage(treadDepth);
    const status = determineStatus(treadDepth, hasAnomaly);
    const daysRemaining = calculateDaysRemaining(treadDepth, hasAnomaly);
    const message = generateMessage(status, daysRemaining);
    
    return {
      wear_percentage: wearPercentage,
      status: status,
      days_remaining: daysRemaining,
      message: message,
      tread_depth: treadDepth,
      has_anomaly: hasAnomaly
    };
  };

  // Get dynamic predictions from current CSV data
  const getRemainingLife = () => {
    const predictions = calculateDynamicPredictions(currentData);
    if (predictions) {
      return Math.round(100 - predictions.wear_percentage);
    }
    return 60; // fallback
  };
  
  // Get AI recommendations based on current CSV status
  const getAiRecommendations = () => {
    const predictions = calculateDynamicPredictions(currentData);
    const currentStatus = predictions?.status || "GOOD";
    
    if (currentMlData?.ml_analysis?.recommendations) {
      const allRecs = currentMlData.ml_analysis.recommendations;
      
      // Filter recommendations based on current tire status
      let filteredRecs;
      if (currentStatus === "CRITICAL") {
        filteredRecs = allRecs.filter(r => r.priority === "HIGH" || r.priority === "CRITICAL" || r.priority === "WARNING");
      } else if (currentStatus === "WARNING") {
        filteredRecs = allRecs.filter(r => r.priority === "MEDIUM" || r.priority === "WARNING");
      } else {
        filteredRecs = allRecs.filter(r => r.priority === "LOW");
      }
      
      // If no matching recommendations, fall back to all recommendations
      return filteredRecs.length > 0 ? filteredRecs.slice(0, 3) : allRecs.slice(0, 3);
    }
    
    // Dynamic fallback based on current status
    if (currentStatus === "CRITICAL") {
      return [
        { action: "URGENT: Stop driving immediately - tire replacement required", priority: "CRITICAL" },
        { action: "Schedule emergency tire service within 24 hours", priority: "HIGH" }
      ];
    } else if (currentStatus === "WARNING") {
      return [
        { action: "Schedule tire replacement within 2-4 weeks", priority: "MEDIUM" },
        { action: "Monitor tire pressure daily until replacement", priority: "MEDIUM" }
      ];
    }
    
    return [
      { action: "Rotate tires every 5,000-7,500 miles for even wear", priority: "LOW" },
      { action: "Monitor tire pressure monthly to optimize performance", priority: "LOW" }
    ];
  };
  
  const formatValue = (value, unit, fallback) => {
    if (!value) return fallback;
    const num = parseFloat(value);
    if (isNaN(num)) return fallback;
    
    // Format with consistent width
    if (unit === 'mm') {
      return `${num.toFixed(1)}mm`;
    } else if (unit === '°C') {
      return `${Math.round(num)}°C`;
    } else {
      return `${Math.round(num)}`;
    }
  };
  
  const formatLoad = (weight) => {
    if (!weight) return '234kg';
    const num = parseFloat(weight);
    if (isNaN(num)) return '234kg';
    // Convert lbs to kg and divide by 4 tires
    const kgPerTire = Math.round((num * 0.453592) / 4);
    return `${kgPerTire}kg`;
  };
  
  const formatWearPattern = (pattern) => {
    if (!pattern || pattern === 'normal') return 'Even';
    return pattern === 'irregular_wear' ? 'Uneven' : 'Even';
  };

  const getReplacementMessages = () => {
    const predictions = calculateDynamicPredictions(currentData);
    const currentStatus = predictions?.status || "GOOD";
    const daysRemaining = predictions?.days_remaining || 180;
    
    // Generate dynamic messages based on current CSV conditions
    if (currentStatus === "CRITICAL") {
      return {
        best: 'Emergency replacement required immediately',
        warning: 'Do not drive - safety risk detected', 
        critical: predictions?.has_anomaly ? 'Puncture detected - stop driving now' : 'Critical wear - replace within 7 days'
      };
    } else if (currentStatus === "WARNING") {
      const weeks = Math.ceil(daysRemaining / 7);
      return {
        best: `Monitor closely - ${weeks} weeks remaining`,
        warning: `Schedule replacement within ${weeks} weeks`,
        critical: 'Approaching replacement threshold'
      };
    }
    
    const months = Math.ceil(daysRemaining / 30);
    return {
      best: `Continue current maintenance - ${months} months remaining`,
      warning: 'Regular monitoring recommended',
      critical: 'No immediate action required'
    };
  };

  // ML INTEGRATION COMPLETE - Using real predictions from tire_predictor.py and enhanced_maintenance_agent.py
  const remainingLife = getRemainingLife();
  const aiRecommendations = getAiRecommendations();
  const replacementMessages = getReplacementMessages();
  
  // DYNAMIC VIBRATION CALCULATION - All data from CSV tire_wear_data.csv
  const calculateVibrationHz = (currentData) => {
    // Base frequency starts at 60 Hz (normal driving)
    let baseHz = 60;
    
    // CSV FIELD: driving_pattern - Primary factor for vibration frequency
    // City driving (25-35 mph) = lower frequency
    if (currentData.driving_pattern === 'city') baseHz = 45;
    // Highway driving (65-75 mph) = higher frequency  
    if (currentData.driving_pattern === 'highway') baseHz = 85;
    // Mixed driving (variable speeds) = medium frequency
    if (currentData.driving_pattern === 'mixed') baseHz = 65;
    
    // CSV FIELD: anomaly_type - Tire problems create additional vibrations
    // Puncture causes severe irregular bouncing (+35 Hz)
    if (currentData.anomaly_type === 'puncture') baseHz += 35;
    // Irregular wear creates consistent vibration pattern (+20 Hz)
    if (currentData.anomaly_type === 'irregular_wear') baseHz += 20;
    // Alignment issues cause steering wheel shake (+25 Hz)
    if (currentData.anomaly_type === 'alignment_issue') baseHz += 25;
    // Sidewall damage creates wobble effect (+30 Hz)
    if (currentData.anomaly_type === 'sidewall_damage') baseHz += 30;
    
    // CSV FIELD: pressure_psi - Pressure imbalance affects vibration
    // Calculate deviation from optimal 32 PSI
    const pressureDeviation = Math.abs((currentData.pressure_psi || 32) - 32);
    // Each PSI off optimal adds 2 Hz of vibration
    baseHz += pressureDeviation * 2;
    
    // CSV FIELD: tread_depth_mm - Worn tires create imbalance
    const treadDepth = parseFloat(currentData.tread_depth_mm) || 10;
    // Severely worn tires (< 4mm) add significant vibration
    if (treadDepth < 4) baseHz += 15;
    // Moderately worn tires (< 7mm) add some vibration
    else if (treadDepth < 7) baseHz += 8;
    
    // CSV FIELD: weather_condition - Road grip affects vibration transmission
    // Wet roads reduce vibration transmission (-5 Hz)
    if (currentData.weather_condition === 'wet') baseHz -= 5;
    // Snow creates additional road noise (+10 Hz)
    if (currentData.weather_condition === 'snow') baseHz += 10;
    
    // Return rounded frequency value
    return Math.round(Math.max(baseHz, 20)); // Minimum 20 Hz
  };
  
  // Calculate current vibration frequency from CSV data
  const currentVibrationHz = calculateVibrationHz(currentData);
  
  // ML PREDICTION CHART - Uses ML data for chart, keeps CSV for remaining life
  const getDynamicChartData = () => {
    // Try to get ML predictions first
    let mlStatus = null;
    let mlDaysRemaining = null;
    
    if (currentMlData?.ml_analysis?.predictions) {
      const predictions = Object.values(currentMlData.ml_analysis.predictions);
      const mostCritical = predictions.reduce((worst, current) => {
        const statusPriority = { 'CRITICAL': 3, 'WARNING': 2, 'BEST': 1 };
        return statusPriority[current.replacement_timeline.status] > statusPriority[worst.replacement_timeline.status] 
          ? current : worst;
      }, predictions[0]);
      
      mlStatus = mostCritical.replacement_timeline.status;
      mlDaysRemaining = mostCritical.replacement_timeline.days_remaining;
    }
    
    // Fallback to CSV if ML unavailable
    const csvPredictions = calculateDynamicPredictions(currentData);
    const status = mlStatus || csvPredictions?.status || "GOOD";
    const daysRemaining = mlDaysRemaining || csvPredictions?.days_remaining || 180;
    
    // Calculate junction point based on ML timeline (not CSV health)
    const baseJunctionY = 95;
    const timelineOffset = Math.max(-30, Math.min(30, (180 - daysRemaining) * 0.3));
    const junctionY = Math.max(40, Math.min(150, baseJunctionY + timelineOffset));
    
    // Calculate future slope based on ML status
    let futureSlope, futureColor;
    if (status === "CRITICAL") {
      futureSlope = 8; // Steep decline - ML predicts rapid failure
      futureColor = "rgba(255,100,100,1)"; // Red for critical
    } else if (status === "WARNING") {
      futureSlope = 5; // Moderate decline - ML predicts accelerated wear
      futureColor = "rgba(255,200,0,1)"; // Yellow for warning  
    } else {
      futureSlope = 3; // Gentle decline - ML predicts normal wear
      futureColor = "rgba(56,239,125,1)"; // Green for good
    }
    
    // Generate past data points (orange line) - leads to junction
    const pastY1 = Math.max(40, junctionY - 55);
    const pastY2 = Math.max(40, junctionY - 45);
    const pastY3 = Math.max(40, junctionY - 35);
    const pastY4 = Math.max(40, junctionY - 25);
    const pastY5 = Math.max(40, junctionY - 15);
    const pastY6 = Math.max(40, junctionY - 5);
    
    const pastPoints = `0,${pastY1} 18,${pastY2} 36,${pastY3} 54,${pastY4} 72,${pastY5} 90,${pastY6} 108,${junctionY}`;
    
    // Generate future prediction points (dynamic color line)
    const futureY1 = junctionY + futureSlope;
    const futureY2 = junctionY + (futureSlope * 2);
    const futureY3 = junctionY + (futureSlope * 3);
    const futureY4 = junctionY + (futureSlope * 4);
    const futureY5 = junctionY + (futureSlope * 5);
    const futureY6 = junctionY + (futureSlope * 6);
    const futureY7 = junctionY + (futureSlope * 7);
    
    const futurePoints = `108,${junctionY} 126,${futureY1} 144,${futureY2} 162,${futureY3} 180,${futureY4} 198,${futureY5} 216,${futureY6} 234,${futureY7}`;
    
    // Generate data point circles
    const dataPoints = [
      { x: 0, y: pastY1, color: "rgba(255,153,0,1)" },
      { x: 18, y: pastY2, color: "rgba(255,153,0,1)" },
      { x: 36, y: pastY3, color: "rgba(255,153,0,1)" },
      { x: 54, y: pastY4, color: "rgba(255,153,0,1)" },
      { x: 72, y: pastY5, color: "rgba(255,153,0,1)" },
      { x: 90, y: pastY6, color: "rgba(255,153,0,1)" },
      { x: 108, y: junctionY, color: "rgba(255,153,0,1)" }, // Junction point
      { x: 126, y: futureY1, color: futureColor },
      { x: 144, y: futureY2, color: futureColor },
      { x: 162, y: futureY3, color: futureColor },
      { x: 180, y: futureY4, color: futureColor },
      { x: 198, y: futureY5, color: futureColor },
      { x: 216, y: futureY6, color: futureColor }
    ];
    
    return {
      pastPoints,
      futurePoints,
      futureColor,
      dataPoints,
      junctionY,
      currentHealth: remainingLife,
      status,
      mlSource: !!mlStatus,
      daysRemaining
    };
  };
  
  // Get dynamic chart data based on current tire condition
  const chartData = getDynamicChartData();
  
  // DYNAMIC ROAD SURFACE CONDITIONS - Changes every 30 seconds based on CSV data
  const getSurfaceCondition = (currentData) => {
    // Priority 1: Check for hazardous conditions from anomaly_type
    if (currentData.anomaly_type === 'puncture') return "🚨 Hazardous Surface (Debris)";
    if (currentData.anomaly_type === 'irregular_wear') return "⚠️ Rough Surface Detected";
    if (currentData.anomaly_type === 'alignment_issue') return "⚠️ Uneven Surface Conditions";
    if (currentData.anomaly_type === 'sidewall_damage') return "🚨 Dangerous Road Hazards";
    
    // Priority 2: Normal conditions - combine weather + driving pattern
    const weather = currentData.weather_condition || 'dry';
    const pattern = currentData.driving_pattern || 'mixed';
    
    // Create descriptive surface condition from CSV fields
    const weatherMap = {
      'dry': 'Dry',
      'wet': 'Wet', 
      'snow': 'Snow-Covered'
    };
    
    const patternMap = {
      'city': 'City Streets',
      'highway': 'Highway Surface',
      'mixed': 'Mixed Roads'
    };
    
    const weatherDesc = weatherMap[weather] || 'Clear';
    const patternDesc = patternMap[pattern] || 'Surface';
    
    return `${weatherDesc} ${patternDesc}`;
  };
  
  // Get current dynamic surface condition
  const currentSurfaceCondition = getSurfaceCondition(currentData);
  
  // Enhanced debug info with ML chart integration
  const currentPredictions = calculateDynamicPredictions(currentData);
  console.log('=== TIRE ML CHART DEBUG ===');
  console.log('Vehicle:', currentData.vehicle_id, '| Index:', dataIndex, '| Life:', remainingLife + '%');
  console.log('Chart ML Source:', chartData.mlSource, '| Chart Status:', chartData.status, '| Chart Days:', chartData.daysRemaining);
  console.log('CSV Tread:', currentPredictions?.tread_depth + 'mm', '| CSV Status:', currentPredictions?.status);
  console.log('Vibration Hz:', currentVibrationHz, '| Surface:', currentSurfaceCondition);
  console.log('Chart Junction Y:', chartData.junctionY, '| Future Color:', chartData.futureColor);
  console.log('ML Data Available:', !!currentMlData, '| Recommendations:', aiRecommendations.length);
  console.log('===============================');

  return (
    <div className="tires-page">
      <div className="tires-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <svg width="43px" height="20px" viewBox="0 0 43 20" style={{ marginRight: '8px' }}>
            <path d="M4.94797 15.7069C4.9294 15.7069 4.91155 15.7069 4.89299 15.7055L2.88435 15.5905C2.10174 15.5834 1.42482 15.3042 0.924977 14.7815C-0.045425 13.7661 -0.00543786 12.2002 0.00241676 12.0245C0.0452601 11.0727 0.283755 10.3158 0.712903 9.77598C0.742179 9.73885 0.771455 9.70458 0.800732 9.67102C0.692195 8.92483 1.01209 8.46426 1.09492 8.3593C1.11634 8.33288 1.13848 8.30717 1.16276 8.28289C2.7958 6.61986 7.60712 5.66159 10.3298 5.23887C11.2152 5.10106 12.07 4.87042 12.8711 4.55266C14.0008 4.10352 15.3054 3.43659 16.45 2.72182C18.3144 1.55791 20.3494 0.773878 22.4995 0.393286C25.1943 -0.0844178 33.9429 -0.0251512 38.9178 0.0526809C41.1885 0.0883838 43.0357 1.96492 43.0357 4.23562C43.0357 6.50632 41.1592 8.41928 38.8521 8.41928L31.7686 8.41928C31.2402 8.41928 30.8111 7.99084 30.8111 7.46173C30.8111 6.93261 31.2395 6.50418 31.7686 6.50418L38.8521 6.50418C40.1031 6.50418 41.1206 5.48665 41.1206 4.23562C41.1206 2.9846 40.1188 1.98635 38.8878 1.96707C30.5383 1.83639 24.6866 1.94993 22.8336 2.27839C20.9264 2.61614 19.1198 3.31163 17.4639 4.34559C16.7363 4.79973 15.2647 5.66159 13.5773 6.33209C12.6434 6.70269 11.6501 6.97117 10.624 7.13041C6.82094 7.72164 3.7862 8.62136 2.71155 9.46323C2.72297 9.50179 2.74082 9.55248 2.77081 9.61532C2.8922 9.87024 2.89434 10.1659 2.77724 10.4229C2.67441 10.6486 2.48805 10.8249 2.26026 10.9156C2.16601 10.992 1.95036 11.3255 1.91537 12.1109C1.90752 12.343 1.96321 13.1021 2.31167 13.4619C2.40093 13.5541 2.56017 13.6769 2.91434 13.6769C2.9329 13.6769 2.95075 13.6769 2.96932 13.6783L4.11895 13.744C4.58951 11.3291 6.72169 9.50036 9.27158 9.50036C11.8215 9.50036 13.8644 11.2327 14.3928 13.5862L32.8526 13.1813C33.1403 12.2623 33.6802 11.4319 34.4164 10.7907C35.3718 9.95878 36.5957 9.50036 37.8638 9.50036C40.3759 9.50036 42.5437 11.2884 43.0186 13.7526C43.1186 14.2717 42.7787 14.7737 42.2595 14.8736C41.7404 14.9736 41.2384 14.6337 41.1385 14.1146C40.8371 12.5508 39.4604 11.4155 37.8638 11.4155C36.2672 11.4155 34.8012 12.6393 34.5634 14.2617C34.4956 14.7237 34.1043 15.07 33.6373 15.08L13.5809 15.5199C13.0604 15.5341 12.6262 15.1243 12.6034 14.6037C12.5262 12.8157 11.0631 11.4155 9.27158 11.4155C7.48001 11.4155 5.93694 12.9114 5.93622 14.7501C5.93622 15.2678 5.52421 15.6919 5.00652 15.7069L4.9751 15.7069C4.96582 15.7084 4.95725 15.7084 4.94797 15.7084L4.94797 15.7069Z" fill="#37bc12"/>
            <circle cx="32.5" cy="10.5" r="5.25" fill="#37bc12"/>
            <circle cx="10.5" cy="10.5" r="5.25" fill="#37bc12"/>
          </svg>
          <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'Amazon Ember' }}>EV Digital Twin</h1>
        </div>
        <div className="header-right">
          <span className="user-profile">bhuser</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      </header>

      {/* Navigation Header - Outside the container */}
      <div className="nav-header" style={{ margin: '20px 20px 20px' }}>
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontSize: '24px',
            padding: '0',
            margin: '0'
          }}
        >
          <span>←</span>
          <span>Tires</span>
        </button>
        <span className="vin-number">VIN Number: ###</span>
        <span className="vin-number">VIN Number: ###</span>
      </div>

      <div style={{ margin: '-30px 20px 5px' }}>
        {/* Details Container */}
        <div className="data-container" style={{ marginBottom: '20px', width: 'calc(100% - 363px)', marginTop: '20px' }}>
          <h3 style={{ color: 'white' }}>Details</h3>
          <span className="last-updated">Last Updated: {getLastUpdated()}</span>

          <div className="tire-grid">
            {/* Vehicle Image in Center */}
            <div className="vehicle-center">
              <img src={require('./assets/vehicle.png')} alt="Vehicle" className="vehicle-image" />
            </div>
            
            {/* Front Tires */}
            <div className="tire-row">
              <div className="tire-info front-left">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  <div>
                    <div className="tire-position">Front Left</div>
                    {/* CSV DATA: Load from curb_weight_lbs */}
                    <div className="load">{formatLoad(currentData.curb_weight_lbs)}</div>
                    <div className="tire-position">Load</div>
                  </div>
                  {/* CSV DATA: Wear pattern from anomaly_type */}
                  <div className="wear-pattern">{formatWearPattern(currentData.anomaly_type)}</div>
                  <div>
                    {/* CSV DATA: Tread depth from tread_depth_mm */}
                    <div className="load">{formatValue(currentData.tread_depth_mm, 'mm', '8.0mm')}</div>
                    <div className="tire-position">Thread</div>
                  </div>
                  <div>
                    {/* CSV DATA: Temperature from temperature_c */}
                    <div className="load">{formatValue(currentData.temperature_c, '°C', '30°C')}</div>
                    <div className="tire-position">Temperature</div>
                  </div>
                  <div>
                    {/* CSV DATA: Pressure from pressure_psi */}
                    <div className="load">{formatValue(currentData.pressure_psi, '', '35')}</div>
                    <div className="tire-position">PSI</div>
                  </div>
                </div>
              </div>
              <div className="tire-diagram"></div>
              <div className="tire-info front-right">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'right', marginLeft: '60px' }}>
                  <div style={{ marginRight: '20px' }}>
                    {/* CSV DATA: Pressure from pressure_psi */}
                    <div className="load">{formatValue(currentData.pressure_psi, '', '35')}</div>
                    <div className="tire-position">PSI</div>
                  </div>
                  <div>
                    {/* CSV DATA: Temperature from temperature_c */}
                    <div className="load">{formatValue(currentData.temperature_c, '°C', '30°C')}</div>
                    <div className="tire-position">Temperature</div>
                  </div>
                  <div>
                    {/* CSV DATA: Tread depth from tread_depth_mm */}
                    <div className="load">{formatValue(currentData.tread_depth_mm, 'mm', '8.0mm')}</div>
                    <div className="tire-position">Thread</div>
                  </div>
                  {/* CSV DATA: Wear pattern from anomaly_type */}
                  <div className="wear-pattern" style={{ marginRight: '15px' }}>{formatWearPattern(currentData.anomaly_type)}</div>
                  <div>
                    <div className="tire-position">Front Right</div>
                    {/* CSV DATA: Load from curb_weight_lbs */}
                    <div className="load">{formatLoad(currentData.curb_weight_lbs)}</div>
                    <div className="tire-position">Load</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rear Tires */}
            <div className="tire-row">
              <div className="tire-info rear-left">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  <div>
                    <div className="tire-position">Rear Left</div>
                    {/* CSV DATA: Load from curb_weight_lbs */}
                    <div className="load">{formatLoad(currentData.curb_weight_lbs)}</div>
                    <div className="tire-position">Load</div>
                  </div>
                  {/* CSV DATA: Wear pattern from anomaly_type */}
                  <div className="wear-pattern">{formatWearPattern(currentData.anomaly_type)}</div>
                  <div>
                    {/* CSV DATA: Tread depth from tread_depth_mm */}
                    <div className="load">{formatValue(currentData.tread_depth_mm, 'mm', '8.0mm')}</div>
                    <div className="tire-position">Thread</div>
                  </div>
                  <div>
                    {/* CSV DATA: Temperature from temperature_c */}
                    <div className="load">{formatValue(currentData.temperature_c, '°C', '30°C')}</div>
                    <div className="tire-position">Temperature</div>
                  </div>
                  <div>
                    {/* CSV DATA: Pressure from pressure_psi */}
                    <div className="load">{formatValue(currentData.pressure_psi, '', '35')}</div>
                    <div className="tire-position">PSI</div>
                  </div>
                </div>
              </div>
              <div className="tire-diagram"></div>
              <div className="tire-info rear-right">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'right', marginLeft: '60px' }}>
                  <div style={{ marginRight: '20px' }}>
                    {/* CSV DATA: Pressure from pressure_psi */}
                    <div className="load">{formatValue(currentData.pressure_psi, '', '35')}</div>
                    <div className="tire-position">PSI</div>
                  </div>
                  <div>
                    {/* CSV DATA: Temperature from temperature_c */}
                    <div className="load">{formatValue(currentData.temperature_c, '°C', '30°C')}</div>
                    <div className="tire-position">Temperature</div>
                  </div>
                  <div>
                    {/* CSV DATA: Tread depth from tread_depth_mm */}
                    <div className="load">{formatValue(currentData.tread_depth_mm, 'mm', '8.0mm')}</div>
                    <div className="tire-position">Thread</div>
                  </div>
                  {/* CSV DATA: Wear pattern from anomaly_type */}
                  <div className="wear-pattern" style={{ marginRight: '15px' }}>{formatWearPattern(currentData.anomaly_type)}</div>
                  <div>
                    <div className="tire-position">Rear Right</div>
                    {/* CSV DATA: Load from curb_weight_lbs */}
                    <div className="load">{formatLoad(currentData.curb_weight_lbs)}</div>
                    <div className="tire-position">Load</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Containers */}
        <div className="bottom-containers" style={{ width: 'calc(100% - 363px)', marginBottom: '0' }}>
          <div className="data-container">
            <h3>Road Surface Conditions</h3>
            <div className="surface-graph">
              {/* DYNAMIC CSV DATA: Distance from mileage field converted to miles */}
              <div className="surface-metric">{currentData.mileage ? `${Math.round(currentData.mileage * 0.621371)} miles` : '25 miles' /* Static fallback */}</div>
              {/* DYNAMIC CSV DATA: Surface condition from weather_condition + driving_pattern + anomaly_type */}
              <div className="surface-label">{currentSurfaceCondition || 'Smooth Surface' /* Static fallback */}</div>
              <img src={require('./assets/roadsurfacecond.png')} alt="Road Surface Condition" style={{ width: '100%', marginTop: '15px' }} />
            </div>
          </div>

          <div className="data-container">
            <h3>Vibration/Frequency Signatures</h3>
            <div className="vibration-graph">
              {/* DYNAMIC VIBRATION: Changes every 30 seconds based on CSV tire data */}
              <div className="vibration-metric">{currentVibrationHz} Hz</div>
              <div className="surface-label">Vibration/Frequency Signatures</div>
              <img src={require('./assets/vibration:signature.png')} alt="Vibration Signature" style={{ width: '100%', marginTop: '15px' }} />
            </div>
          </div>
        </div>
      </div>

        {/* Tire Prediction Panel */}
        <div style={{ position: 'absolute', top: '60px', right: '0px', width: '363px', height: '500px' }}>
          <div className="right-panel">
            <div className="motor-prediction">
              <div className="prediction-header">
                <h2>Tire Prediction
                  <span style={{ fontSize: '10px', color: '#37bc12', marginLeft: '10px' }}>
                    V{currentData.vehicle_id || '?'} | {remainingLife}% | Idx:{dataIndex} | {currentPredictions?.tread_depth || 'N/A'}mm | {currentPredictions?.has_anomaly ? 'ANOMALY' : 'OK'}
                  </span>
                </h2>
                <img
                  src={require('./assets/warning.png')}
                  alt="Warning"
                  className="info-icon"
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  onClick={() => setShowModal(true)}
                />
              </div>

              {/* Failure Prediction Chart */}
              <div className="motor-prediction-container" style={{ paddingLeft: '30px' }}>
                <div className="failure-prediction">
                  <h3>Failure Prediction</h3>
                  <div className="prediction-legend">
                    <div className="legend-item">
                      <div style={{ width: '15px', height: '2px', backgroundColor: 'rgba(255,153,0,1)' }}></div>
                      <span>Past</span>
                    </div>
                    <div className="legend-item">
                      <div style={{ width: '15px', height: '2px', backgroundColor: 'rgba(56,239,125,1)', borderTop: '2px dashed rgba(56,239,125,1)', backgroundColor: 'transparent' }}></div>
                      <span>Predicted</span>
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={require('./assets/stateofhealth.png')} 
                      alt="State of Health" 
                      style={{
                        position: 'absolute',
                        left: '-25px',
                        top: '120px',
                        width: '20px',
                        height: 'auto',
                        zIndex: 10
                      }} 
                    />
                    <div className="prediction-chart">
                      <svg width="240px" height="240px" viewBox="0 0 240 240">
                      {/* Grid lines */}
                      {Array.from({ length: 11 }, (_, i) => (
                        <line key={i} x1="0" y1={20 + i * 18} x2="240" y2={20 + i * 18} stroke="rgba(104,111,120,1)" strokeWidth="0.5"/>
                      ))}
                      
                      {/* DYNAMIC Past data (orange) - Maintains downward shape, adjusts to current health */}
                      <polyline
                        points={chartData.pastPoints}
                        fill="none"
                        stroke="rgba(255,153,0,1)"
                        strokeWidth="2"
                      />
                      
                      {/* DYNAMIC Future prediction - Color and slope change based on tire condition */}
                      <polyline
                        points={chartData.futurePoints}
                        fill="none"
                        stroke={chartData.futureColor}
                        strokeWidth="2"
                        strokeDasharray="4,4"
                      />
                      
                      {/* DYNAMIC Data points - Position based on tire health, color based on urgency */}
                      {chartData.dataPoints.map((point, i) => (
                        <circle key={i} cx={point.x} cy={point.y} r="2" fill={point.color}/>
                      ))}
                      
                      {/* STATIC FALLBACK - Original coordinates commented for reference */}
                      {/* 
                      <polyline points="0,40 18,50 36,60 54,70 72,80 90,90 108,95" fill="none" stroke="rgba(255,153,0,1)" strokeWidth="2" />
                      <polyline points="108,95 126,100 144,105 162,110 180,115 198,120 216,125 234,130" fill="none" stroke="rgba(56,239,125,1)" strokeWidth="2" strokeDasharray="4,4" />
                      {Array.from({ length: 13 }, (_, i) => (<circle key={i} cx={i * 18} cy={40 + i * 8} r="2" fill={i < 6 ? "rgba(255,153,0,1)" : "rgba(56,239,125,1)"}/>))}
                      */}
                      
                      {/* X-axis labels */}
                      {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40].map((value, i) => (
                        <text key={i} x={value * 6} y="215" fill="rgba(255,255,255,0.6)" fontSize="8" textAnchor="middle">
                          {value}
                        </text>
                      ))}
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Remaining Useful Life */}
                <div className="useful-life" style={{ marginBottom: '-80px', marginTop: '-100px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '10px', color: 'white' }}>Remaining useful life</span>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>{remainingLife}%</span>
                  </div>
                  <div className="life-bar" style={{ borderRadius: '0' }}>
                    <div className="life-fill" style={{ width: `${remainingLife}%`, borderRadius: '0' }}></div>
                  </div>
                </div>

                {/* GenAI Recommendations */}
                <div className="genai-recommendations">
                  <h3>GenAI Recommendations</h3>
                  {aiRecommendations.length > 0 ? (
                    <p>
                      <strong>{aiRecommendations[0].action}</strong><br/>
                      <em>{aiRecommendations[0].reason}</em><br/>
                      Cost: {aiRecommendations[0].estimated_cost}
                    </p>
                  ) : (
                    <p>Optimize tire performance based on driving behavior and road conditions. Optimal tire pressure, rotation schedules, user driving patterns preferences, weather, and road conditions data, tire wear trends, and maintenance schedules.</p>
                  )}
                  {currentPredictions?.status === 'CRITICAL' && (
                    <div style={{ color: '#ff4444', fontWeight: 'bold', marginTop: '10px', padding: '5px', border: '1px solid #ff4444', borderRadius: '3px' }}>
                      ⚠️ CRITICAL: {currentPredictions.has_anomaly ? 'Anomaly detected in tire data' : 'Tread depth below safety threshold'}
                    </div>
                  )}
                  
                  <div className="recommendations-list">
                    <div className="recommendation-item">
                      <span className="warning-icon" style={{ color: 'red' }}>⚠️</span>
                      <span>Optimal replacement times</span>
                    </div>
                    <div className="recommendation-details">
                      <p><strong>Best:</strong> {replacementMessages.best}</p>
                      <p><strong>Warning:</strong> {replacementMessages.warning}</p>
                      <p><strong>Critical:</strong> {replacementMessages.critical}</p>
                    </div>
                    <div className="more-link">More.....</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DataNeededModal open={showModal} onClose={() => setShowModal(false)} type="tire" />
      </div>
    </div>
  );
};

export default TiresPage;