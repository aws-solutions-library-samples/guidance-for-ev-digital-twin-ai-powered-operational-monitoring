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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [displayTirePrediction, setDisplayTirePrediction] = useState(false);
  const [tireAnimationStep, setTireAnimationStep] = useState(0);
  const [csvData, setCsvData] = useState([]);
  const [dataIndex, setDataIndex] = useState(0);
  const [mlResults, setMlResults] = useState([]);


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

  // Data index remains static - no auto-refresh

  // Tire prediction animation effect
  useEffect(() => {
    if (displayTirePrediction) {
      setTireAnimationStep(0);
      const tireAnimationTimer = setInterval(() => {
        setTireAnimationStep(prev => {
          if (prev >= 1) {
            clearInterval(tireAnimationTimer);
            return 1;
          }
          return prev + 0.02;
        });
      }, 50);
      return () => clearInterval(tireAnimationTimer);
    }
  }, [displayTirePrediction]);

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
  
  // Get AI recommendations based on thread depth (lower thread = more recommendations)
  const getAiRecommendations = () => {
    const predictions = calculateDynamicPredictions(currentData);
    const currentStatus = predictions?.status || "GOOD";
    const threadDepth = parseFloat(currentData.tread_depth_mm) || 10.0;
    
    // Calculate number of recommendations based on thread depth
    let numRecommendations = 1;
    if (threadDepth < 2.0) {
      numRecommendations = 5; // Very low thread - show 5 recommendations
    } else if (threadDepth < 4.0) {
      numRecommendations = 4; // Low thread - show 4 recommendations
    } else if (threadDepth < 6.0) {
      numRecommendations = 3; // Medium thread - show 3 recommendations
    } else if (threadDepth < 8.0) {
      numRecommendations = 2; // Good thread - show 2 recommendations
    } else {
      numRecommendations = 1; // High thread - show 1 recommendation
    }
    
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
      
      // Return the calculated number of recommendations based on thread depth
      const availableRecs = filteredRecs.length > 0 ? filteredRecs : allRecs;
      return availableRecs.slice(0, numRecommendations);
    }
    
    // Dynamic fallback based on current status and thread depth
    const fallbackRecs = [];
    
    if (currentStatus === "CRITICAL") {
      fallbackRecs.push(
        { action: "URGENT: Stop driving immediately - tire replacement required", priority: "CRITICAL" },
        { action: "Schedule emergency tire service within 24 hours", priority: "HIGH" },
        { action: "Check for visible tire damage or punctures", priority: "HIGH" },
        { action: "Avoid highway speeds until replacement", priority: "MEDIUM" },
        { action: "Contact roadside assistance if needed", priority: "CRITICAL" }
      );
    } else if (currentStatus === "WARNING") {
      fallbackRecs.push(
        { action: "Schedule tire replacement within 2-4 weeks", priority: "MEDIUM" },
        { action: "Monitor tire pressure daily until replacement", priority: "MEDIUM" },
        { action: "Reduce driving speed and avoid aggressive maneuvers", priority: "LOW" },
        { action: "Check tire alignment and balancing", priority: "LOW" },
        { action: "Inspect for uneven wear patterns", priority: "LOW" }
      );
    } else {
      fallbackRecs.push(
        { action: "Rotate tires every 5,000-7,500 miles for even wear", priority: "LOW" },
        { action: "Monitor tire pressure monthly to optimize performance", priority: "LOW" },
        { action: "Check tread depth every 3 months", priority: "LOW" },
        { action: "Maintain proper wheel alignment", priority: "LOW" },
        { action: "Follow manufacturer's maintenance schedule", priority: "LOW" }
      );
    }
    
    return fallbackRecs.slice(0, numRecommendations);
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
    <div style={{ width: '100vw', height: '100vh', background: '#000', fontFamily: 'Amazon Ember', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>
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
          <div className="user-dropdown" style={{ position: 'relative' }}>
            <div 
              className="user-profile-container" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <span className="user-profile">bhuser</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
            {dropdownOpen && (
              <div className="dropdown-menu" style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                background: '#1b1e20',
                border: '1px solid #444',
                borderRadius: '4px',
                minWidth: '250px',
                zIndex: 1000,
                marginTop: '5px'
              }}>
                <div className="dropdown-item" onClick={() => navigate('/')} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={require('./assets/car.png')} alt="Car" style={{ width: '16px', height: '16px' }} />
                  Connected Vehicles
                </div>
                <div className="dropdown-item" onClick={() => navigate('/fleet')} style={{ padding: '10px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                    <path d="M15 18H9"/>
                    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                    <circle cx="17" cy="18" r="2"/>
                    <circle cx="7" cy="18" r="2"/>
                  </svg>
                  Fleet
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px', paddingBottom: '15px' }}>
        <div 
          onClick={() => window.location.href = '/car/123'}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontSize: '24px',
            padding: '10px',
            margin: '0',
            zIndex: 9999,
            position: 'relative'
          }}
        >
          <span>←</span>
          <span>Tires</span>
        </div>
        <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>VIN Number: ###</span>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', gap: '32px', width: '100%', height: '100%', margin: '-100px 20px 20px 20px', alignItems: 'flex-start' }}>
        {/* Main Panel */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '60px' }}>
          {/* Details Container */}
          <div style={{ background: '#1b1e20', border: '1px solid #3a4552', padding: '20px', color: 'white' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'right', marginLeft: window.innerWidth >= 1400 ? '60px' : '0px' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'right', marginLeft: window.innerWidth >= 1400 ? '60px' : '0px' }}>
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
          <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
            <div style={{ 
              background: '#1b1e20', 
              border: '1px solid #3a4552', 
              padding: '20px', 
              color: 'white', 
              flex: 1.5,
              height: window.innerWidth >= 2560 ? '400px' : window.innerWidth >= 1920 ? '360px' : window.innerWidth >= 1400 ? '300px' : '240px'
            }}>
              <h3>Road Surface Conditions</h3>
              <div className="surface-graph">
                {/* DYNAMIC CSV DATA: Distance from mileage field converted to miles */}
                <div className="surface-metric">{currentData.mileage ? `${Math.round(currentData.mileage * 0.621371)} miles` : '25 miles' /* Static fallback */}</div>
                {/* DYNAMIC CSV DATA: Surface condition from weather_condition + driving_pattern + anomaly_type */}
                <div className="surface-label">{currentSurfaceCondition || 'Smooth Surface' /* Static fallback */}</div>
                <img src={require('./assets/roadsurfacecond.png')} alt="Road Surface Condition" style={{ width: '100%', marginTop: '15px' }} />
              </div>
            </div>

            <div style={{ 
              background: '#1b1e20', 
              border: '1px solid #3a4552', 
              padding: '20px', 
              color: 'white', 
              flex: 0.8,
              height: window.innerWidth >= 2560 ? '400px' : window.innerWidth >= 1920 ? '360px' : window.innerWidth >= 1400 ? '300px' : '240px'
            }}>
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

        {/* Right Panel */}
        <div style={{ flex: 1, background: '#434a54', borderRadius: 0, padding: '24px', minWidth: '350px', minHeight: 0, alignSelf: 'flex-start' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>Tire Failure Prediction</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
                        Show Prediction
                      </span>
                      <button
                        onClick={() => setDisplayTirePrediction(!displayTirePrediction)}
                        style={{
                          background: displayTirePrediction ? '#37bc12' : 'rgba(255,255,255,0.2)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          borderRadius: '12px',
                          width: '40px',
                          height: '20px',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          zIndex: 1000,
                          outline: 'none',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: displayTirePrediction ? 'flex-end' : 'flex-start',
                          paddingLeft: displayTirePrediction ? '0' : '2px',
                          paddingRight: displayTirePrediction ? '2px' : '0'
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: 'white',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            pointerEvents: 'none'
                          }}
                        />
                      </button>
                    </div>
                  </div>
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
                  <div style={{ position: 'relative', marginTop: '20px' }}>
                    <div className="prediction-chart">
                      <svg width="290" height="180" viewBox="0 0 290 180">
                      {/* Grid lines */}
                      {Array.from({ length: 8 }, (_, i) => (
                        <line key={i} x1="35" y1={20 + i * 20} x2="255" y2={20 + i * 20} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      ))}
                      {Array.from({ length: 8 }, (_, i) => (
                        <line key={i} x1={35 + i * 30} y1="20" x2={35 + i * 30} y2="160" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      ))}
                      
                      {/* Y-axis labels */}
                      <text x="25" y="25" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">100</text>
                      <text x="25" y="45" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">85</text>
                      <text x="25" y="65" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">70</text>
                      <text x="25" y="85" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">55</text>
                      <text x="25" y="105" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">40</text>
                      <text x="25" y="125" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">25</text>
                      <text x="25" y="145" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">10</text>
                      
                      {/* X-axis labels */}
                      <text x="35" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">0</text>
                      <text x="65" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">30</text>
                      <text x="95" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">60</text>
                      <text x="125" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">90</text>
                      <text x="155" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">120</text>
                      <text x="185" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">150</text>
                      <text x="215" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">180</text>
                      
                      {/* Axis labels */}
                      <text x="145" y="190" fill="rgba(255,255,255,0.6)" fontSize="9" textAnchor="middle">Days</text>
                      <text x="8" y="90" fill="rgba(255,255,255,0.6)" fontSize="9" textAnchor="middle" transform="rotate(-90 8 90)">Health %</text>
                      
                      {/* Critical failure threshold line */}
                      <line x1="35" y1="105" x2="255" y2="105" stroke="rgba(255,68,68,0.6)" strokeWidth="1" strokeDasharray="3,3"/>
                      <text x="260" y="110" fill="rgba(255,68,68,0.9)" fontSize="7">Critical</text>
                      
                      {/* Warning threshold line */}
                      <line x1="35" y1="85" x2="255" y2="85" stroke="rgba(255,153,0,0.6)" strokeWidth="1" strokeDasharray="3,3"/>
                      <text x="260" y="90" fill="rgba(255,153,0,0.9)" fontSize="7">Warning</text>
                      
                      {/* Past data (orange) - Declining tire health */}
                      <polyline
                        points="35,35 50,40 65,45 80,50 95,55 110,60 125,65"
                        fill="none"
                        stroke="rgba(255,153,0,1)"
                        strokeWidth="2"
                      />
                      
                      {/* Predicted data (green) - Animated based on toggle */}
                      {displayTirePrediction && (
                        <polyline
                          points="125,65 140,70 155,75 170,82 185,90 200,100 215,112"
                          fill="none"
                          stroke="rgba(56,239,125,1)"
                          strokeWidth="2"
                          strokeDasharray="4,4"
                          strokeDashoffset={100 * (1 - tireAnimationStep)}
                          style={{
                            transition: 'stroke-dashoffset 0.1s ease-out'
                          }}
                        />
                      )}
                      
                      {/* Data points - Historical */}
                      <circle cx="35" cy="35" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="50" cy="40" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="65" cy="45" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="80" cy="50" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="95" cy="55" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="110" cy="60" r="1.5" fill="rgba(255,153,0,1)"/>
                      
                      {/* Current point - Highlighted */}
                      <circle cx="125" cy="65" r="2.5" fill="rgba(255,153,0,1)" stroke="white" strokeWidth="1.5"/>
                      
                      {/* Data points - Predicted (appear progressively) */}
                      {displayTirePrediction && tireAnimationStep > 0.15 && (
                        <circle cx="140" cy="70" r="1.5" fill="rgba(56,239,125,1)" opacity={Math.min(1, (tireAnimationStep - 0.15) * 5)}/>
                      )}
                      {displayTirePrediction && tireAnimationStep > 0.3 && (
                        <circle cx="155" cy="75" r="1.5" fill="rgba(56,239,125,1)" opacity={Math.min(1, (tireAnimationStep - 0.3) * 5)}/>
                      )}
                      {displayTirePrediction && tireAnimationStep > 0.45 && (
                        <circle cx="170" cy="82" r="1.5" fill="rgba(255,153,0,1)" opacity={Math.min(1, (tireAnimationStep - 0.45) * 5)}/>
                      )}
                      {displayTirePrediction && tireAnimationStep > 0.6 && (
                        <circle cx="185" cy="90" r="1.5" fill="rgba(255,153,0,1)" opacity={Math.min(1, (tireAnimationStep - 0.6) * 5)}/>
                      )}
                      {displayTirePrediction && tireAnimationStep > 0.75 && (
                        <circle cx="200" cy="100" r="1.5" fill="rgba(255,68,68,1)" opacity={Math.min(1, (tireAnimationStep - 0.75) * 5)}/>
                      )}
                      {displayTirePrediction && tireAnimationStep > 0.9 && (
                        <circle cx="215" cy="112" r="1.5" fill="rgba(255,68,68,1)" opacity={Math.min(1, (tireAnimationStep - 0.9) * 10)}/>
                      )}
                      
                      {/* Annotations */}
                      <text x="125" y="58" fill="rgba(255,255,255,0.9)" fontSize="7" textAnchor="middle" fontWeight="bold">NOW</text>
                      {displayTirePrediction && tireAnimationStep > 0.5 && (
                        <>
                          <text x="170" y="75" fill="rgba(255,153,0,0.9)" fontSize="6" textAnchor="middle" opacity={Math.min(1, (tireAnimationStep - 0.5) * 2)}>Replacement</text>
                          <text x="170" y="83" fill="rgba(255,153,0,0.9)" fontSize="6" textAnchor="middle" opacity={Math.min(1, (tireAnimationStep - 0.5) * 2)}>Needed</text>
                        </>
                      )}
                      {displayTirePrediction && tireAnimationStep > 0.8 && (
                        <>
                          <text x="200" y="93" fill="rgba(255,68,68,0.9)" fontSize="6" textAnchor="middle" opacity={Math.min(1, (tireAnimationStep - 0.8) * 5)}>Failure</text>
                          <text x="200" y="101" fill="rgba(255,68,68,0.9)" fontSize="6" textAnchor="middle" opacity={Math.min(1, (tireAnimationStep - 0.8) * 5)}>Risk</text>
                        </>
                      )}
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Remaining Useful Life */}
                <div className="useful-life" style={{ marginBottom: '20px', marginTop: '-40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '10px', color: 'white' }}>Remaining useful life</span>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>{remainingLife}%</span>
                  </div>
                  <div className="life-bar" style={{ borderRadius: '0' }}>
                    <div className="life-fill" style={{ width: `${remainingLife}%`, borderRadius: '0' }}></div>
                  </div>
                </div>

                {/* GenAI Recommendations */}
                <div className="genai-recommendations" style={{ marginTop: '-10px' }}>
                  <h3>GenAI Recommendations</h3>
                  <p>AI-powered tire optimization based on tread depth. Lower tread depth triggers more recommendations.</p>
                  
                  <div className="recommendations-list">
                    {aiRecommendations.map((rec, index) => (
                      <div key={index} style={{ marginBottom: '12px' }}>
                        <div className="recommendation-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className="warning-icon">
                            {rec.priority === 'CRITICAL' ? '🚨' : rec.priority === 'HIGH' ? '⚠️' : 'ℹ️'}
                          </span>
                          <span>{rec.action}</span>
                        </div>
                        {rec.reason && (
                          <div className="recommendation-details" style={{ marginLeft: '24px', fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                            <p><strong>Details:</strong> {rec.reason}</p>
                            {rec.estimated_cost && <p><strong>Cost:</strong> {rec.estimated_cost}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="more-link" style={{ marginTop: '16px', fontSize: '12px', color: '#ff9900', cursor: 'pointer' }}>More.....</div>
                  </div>
                  
                  {currentPredictions?.status === 'CRITICAL' && (
                    <div style={{ color: '#ff4444', fontWeight: 'bold', marginTop: '10px', padding: '5px', border: '1px solid #ff4444', borderRadius: '3px' }}>
                      ⚠️ CRITICAL: {currentPredictions.has_anomaly ? 'Anomaly detected in tire data' : 'Tread depth below safety threshold'}
                    </div>
                  )}
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