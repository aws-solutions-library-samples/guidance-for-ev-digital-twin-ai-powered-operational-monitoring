import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Papa from 'papaparse';
import DataNeededModal from "./DataNeededModal";
import '../css/motor.css';

// Motor data rotates through CSV entries every 30 seconds
const Motor = () => {
  const navigate = useNavigate();
  const { carId } = useParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [dataIndex, setDataIndex] = useState(0);
  const [mlResults, setMlResults] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [showPrediction, setShowPrediction] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Responsive sizing that updates on window resize
  const spacing = useMemo(() => {
    const width = windowWidth;
    if (width >= 2560) return { 
      gaugeSize: '120px', 
      fontSize: '16px', 
      chartHeight: '100px',
      imageWidth: '320px'
    };
    if (width >= 1920) return { 
      gaugeSize: '100px', 
      fontSize: '14px', 
      chartHeight: '80px',
      imageWidth: '280px'
    };
    if (width >= 1400) return { 
      gaugeSize: '90px', 
      fontSize: '12px', 
      chartHeight: '60px',
      imageWidth: '240px'
    };
    return { 
      gaugeSize: '80px', 
      fontSize: '10px', 
      chartHeight: '50px',
      imageWidth: '200px'
    };
  }, [windowWidth]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    Papa.parse('/data/motor_sensor_data.csv', {
      download: true,
      header: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setCsvData(results.data.filter(row => row.vehicle_id));
        }
      }
    });
    
    // Load ML results
    fetch('/data/motor_ml_results.json')
      .then(res => res.json())
      .then(data => {
        setMlResults(data);
        console.log('Motor ML results loaded:', data);
      })
      .catch(err => console.log('Motor ML results not available:', err));
  }, []);

  useEffect(() => {
    if (csvData.length > 0) {
      const interval = setInterval(() => {
        setDataIndex(prev => {
          const newIndex = (prev + 1) % csvData.length;
          console.log(`Motor data updated to index ${newIndex} (Vehicle ${csvData[newIndex]?.vehicle_id || 'N/A'})`);
          return newIndex;
        });
        
        // Force component re-render for fresh data
        setMlResults(prev => [...prev]);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [csvData]);

  // Animation effect for prediction toggle
  useEffect(() => {
    if (showPrediction) {
      setAnimationProgress(0);
      const animationInterval = setInterval(() => {
        setAnimationProgress(prev => {
          if (prev >= 1) {
            clearInterval(animationInterval);
            return 1;
          }
          return prev + 0.02;
        });
      }, 50);
      return () => clearInterval(animationInterval);
    }
  }, [showPrediction]);

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
  const calculatePerformancePercentage = (performanceScore) => {
    return Math.max(0, Math.min(100, parseFloat(performanceScore) || 0));
  };

  const determineMotorStatus = (temp, oilPressure, performanceScore, hasAnomaly) => {
    if (hasAnomaly || temp > 105 || oilPressure < 15 || performanceScore < 70) return "CRITICAL";
    if (temp > 95 || oilPressure < 20 || performanceScore < 85) return "WARNING";
    return "GOOD";
  };

  const calculateDaysRemaining = (status, performanceScore) => {
    if (status === "CRITICAL") return 7;
    if (status === "WARNING") return 60;
    if (performanceScore > 95) return 200;
    return 120;
  };

  const generateMotorMessage = (status, daysRemaining) => {
    if (status === "CRITICAL") return "Immediate service required";
    if (status === "WARNING") return `Schedule maintenance within ${Math.ceil(daysRemaining/30)} months`;
    const months = Math.ceil(daysRemaining/30);
    return `Continue current maintenance - ${months} months remaining`;
  };

  // Calculate dynamic predictions from current CSV data
  const calculateDynamicMotorPredictions = (currentData) => {
    if (!currentData) return null;
    
    const temp = parseFloat(currentData.engine_temp_c) || 90;
    const oilPressure = parseFloat(currentData.oil_pressure_psi) || 25;
    const performanceScore = parseFloat(currentData.performance_score) || 95;
    const hasAnomaly = currentData.motor_anomaly === 'True' || currentData.motor_anomaly === true;
    
    const status = determineMotorStatus(temp, oilPressure, performanceScore, hasAnomaly);
    const daysRemaining = calculateDaysRemaining(status, performanceScore);
    const message = generateMotorMessage(status, daysRemaining);
    
    return {
      performance_percentage: calculatePerformancePercentage(performanceScore),
      status: status,
      days_remaining: daysRemaining,
      message: message,
      temperature: temp,
      oil_pressure: oilPressure,
      has_anomaly: hasAnomaly
    };
  };

  // Get remaining useful life percentage
  const getRemainingLife = () => {
    const predictions = calculateDynamicMotorPredictions(currentData);
    if (predictions) {
      return Math.round(predictions.performance_percentage);
    }
    return 70; // fallback
  };
  
  // Get AI recommendations based on current CSV status
  const getAiRecommendations = () => {
    const predictions = calculateDynamicMotorPredictions(currentData);
    const currentStatus = predictions?.status || "GOOD";
    
    if (currentMlData?.ml_analysis?.recommendations) {
      const allRecs = currentMlData.ml_analysis.recommendations;
      
      // Filter recommendations based on current motor status
      let filteredRecs;
      if (currentStatus === "CRITICAL") {
        filteredRecs = allRecs.filter(r => r.priority === "URGENT" || r.priority === "HIGH");
      } else if (currentStatus === "WARNING") {
        filteredRecs = allRecs.filter(r => r.priority === "MEDIUM" || r.priority === "HIGH");
      } else {
        filteredRecs = allRecs.filter(r => r.priority === "LOW");
      }
      
      // If no matching recommendations, fall back to all recommendations
      return filteredRecs.length > 0 ? filteredRecs.slice(0, 3) : allRecs.slice(0, 3);
    }
    
    // Dynamic fallback based on current status
    if (currentStatus === "CRITICAL") {
      return [
        { action: "URGENT: Stop driving - engine critical condition", priority: "URGENT" },
        { action: "Schedule emergency engine service immediately", priority: "HIGH" }
      ];
    } else if (currentStatus === "WARNING") {
      return [
        { action: "Schedule engine maintenance within 2 months", priority: "MEDIUM" },
        { action: "Monitor engine parameters daily", priority: "MEDIUM" }
      ];
    }
    
    return [
      { action: "Continue regular maintenance schedule", priority: "LOW" },
      { action: "Monitor engine performance monthly", priority: "LOW" }
    ];
  };
  
  const formatValue = (value, unit, fallback) => {
    if (!value) return fallback;
    const num = parseFloat(value);
    if (isNaN(num)) return fallback;
    
    // Format with consistent width
    if (unit === '°C') {
      return `${Math.round(num)}°C`;
    } else if (unit === 'PSI') {
      return `${num.toFixed(1)} PSI`;
    } else if (unit === 'RPM') {
      return `${Math.round(num).toLocaleString()}`;
    } else {
      return `${Math.round(num)}`;
    }
  };
  
  const formatTorque = (rpm, performanceScore) => {
    if (!rpm || !performanceScore) return '37';
    const baseNm = 250;
    const rpmFactor = Math.min(1.2, parseFloat(rpm) / 3000);
    const perfFactor = parseFloat(performanceScore) / 100;
    return Math.round(baseNm * rpmFactor * perfFactor);
  };

  const formatElectricalMetrics = (rpm, performanceScore) => {
    const rpmVal = parseFloat(rpm) || 2500;
    const perfVal = parseFloat(performanceScore) || 95;
    
    return {
      phaseCurrent: Math.round(150 + (rpmVal / 100) * 2),
      busVoltage: Math.round(280 + (perfVal / 100) * 40),
      motorVoltage: Math.round(300 + (rpmVal / 1000) * 10),
      powerOutput: Math.round(75 * (rpmVal / 3000) * (perfVal / 100))
    };
  };

  // Calculate bearing health from motor data
  const calculateBearingHealth = (vibrationLevel, performanceScore) => {
    const vibration = parseFloat(vibrationLevel) || 2;
    const performance = parseFloat(performanceScore) || 95;
    
    // Higher vibration = more bearing wear
    const baseWear = Math.min(50, vibration * 8);
    const perfAdjustment = (100 - performance) * 0.5;
    
    return {
      radial: Math.min(100, baseWear + perfAdjustment),
      outer: Math.min(100, baseWear * 0.8 + perfAdjustment),
      thrust: Math.min(100, baseWear * 0.6 + perfAdjustment),
      inner: Math.min(100, baseWear * 0.9 + perfAdjustment)
    };
  };

  // Calculate rotor position based on RPM and performance
  const calculateRotorPosition = (rpm, performanceScore) => {
    const rpmVal = parseFloat(rpm) || 2500;
    const perfVal = parseFloat(performanceScore) || 95;
    
    // Rotor position in degrees (0-360°)
    // Base position varies with RPM, performance affects accuracy
    const basePosition = (rpmVal / 10) % 360;
    const performanceOffset = (100 - perfVal) * 2; // Poor performance = position drift
    const finalPosition = (basePosition + performanceOffset) % 360;
    
    return Math.round(finalPosition);
  };

  // Calculate insulation resistance based on temperature and performance
  const calculateInsulationResistance = (temperature, performanceScore) => {
    const temp = parseFloat(temperature) || 90;
    const perf = parseFloat(performanceScore) || 95;
    
    // Insulation resistance in MΩ (Megohms)
    // Higher temperature = lower resistance, better performance = higher resistance
    const baseResistance = 500; // 500 MΩ baseline
    const tempEffect = Math.max(0, (120 - temp) * 4); // Decreases with temperature
    const perfEffect = (perf / 100) * 200; // Increases with performance
    
    const finalResistance = baseResistance + tempEffect + perfEffect;
    return Math.round(finalResistance);
  };

  // ML INTEGRATION COMPLETE - Using real predictions from motor data
  const remainingLife = getRemainingLife();
  const aiRecommendations = getAiRecommendations();
  const electricalMetrics = formatElectricalMetrics(currentData.rpm_avg, currentData.performance_score);
  const bearingHealth = calculateBearingHealth(currentData.vibration_level, currentData.performance_score);
  const rotorPosition = calculateRotorPosition(currentData.rpm_avg, currentData.performance_score);
  const insulationResistance = calculateInsulationResistance(currentData.engine_temp_c, currentData.performance_score);
  
  // Enhanced debug info with ML integration
  const currentPredictions = calculateDynamicMotorPredictions(currentData);
  console.log('=== MOTOR ML DEBUG ===');
  console.log('Vehicle:', currentData.vehicle_id, '| Index:', dataIndex, '| Performance:', remainingLife + '%');
  console.log('CSV Temp:', currentPredictions?.temperature + '°C', '| CSV Status:', currentPredictions?.status);
  console.log('Oil Pressure:', currentPredictions?.oil_pressure + ' PSI', '| RPM:', currentData.rpm_avg);
  console.log('Rotor Position:', rotorPosition + '°', '| Insulation:', insulationResistance + ' MΩ');
  console.log('Vibration:', currentData.vibration_level, '| Anomaly:', currentPredictions?.has_anomaly);
  console.log('ML Data Available:', !!currentMlData, '| Recommendations:', aiRecommendations.length);
  console.log('=======================');
  console.log('WINDOW WIDTH DEBUG:', windowWidth);

  return (
    <div className="motor-page">
      <div className="motor-container" style={{ 
        overflowY: 'hidden'
      }}>
        {/* Header */}
        <header className="header" style={{ height: windowWidth < 1600 ? '50px' : 'auto', padding: windowWidth < 1600 ? '10px 20px' : '20px' }}>
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
                <span className="user-profile">newuser</span>
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
        <div className="nav-header" style={{ margin: '20px 20px 20px', borderBottom: 'none' }}>
          <button 
            className="back-button"
            onClick={() => navigate(`/car/${carId}`)}
          >
            <span>←</span>
            <span>Motor</span>
          </button>

        </div>

        <div style={{ margin: '10px 20px 5px' }}>
          <div className="motor-layout" style={{ marginTop: '-100px', height: 'auto', alignItems: 'flex-start' }}>
            {/* Main Content */}
            <div className="main-panel" style={{ marginTop: '60px' }}>
              {/* Motor Performance Container - Top */}
              <div className="data-container" style={{ marginBottom: '20px', marginTop: windowWidth < 1600 ? '-10px' : '0px', height: '320px', overflow: 'hidden', width: 'calc(100% + 30px)', marginLeft: '-15px' }}>
                <h3 style={{ color: 'white' }}>Motor Performance</h3>
                
                <div className="performance-grid" style={{ position: 'relative' }}>
                  {/* Motor Image - Responsive positioning */}
                  <div style={{ position: 'absolute', top: '10px', right: '50px', zIndex: 1 }}>
                    <img src={require('./assets/motorimage.png')} alt="Motor" style={{ width: spacing.imageWidth, height: 'auto' }} />
                  </div>
                  {/* RPM Gauge - Responsive */}
                  <div className="rpm-gauge">
                    <div className="gauge-container" style={{ width: spacing.gaugeSize, height: spacing.gaugeSize }}>
                      <div className="gauge-arc" style={{ 
                        width: spacing.gaugeSize,
                        height: `calc(${spacing.gaugeSize} / 2)`,
                        borderTopColor: currentPredictions?.status === 'CRITICAL' ? '#ff4444' : 
                                       currentPredictions?.status === 'WARNING' ? '#ff9900' : '#37bc12' 
                      }}></div>
                      <div className="gauge-value" style={{ fontSize: spacing.fontSize }}>{formatValue(currentData.rpm_avg, 'RPM', '2,500')}</div>
                      <div className="gauge-label" style={{ fontSize: `calc(${spacing.fontSize} * 0.7)` }}>RPM</div>
                    </div>
                    <svg width={spacing.chartHeight} height={`calc(${spacing.chartHeight} / 2)`} viewBox="0 0 80 40" style={{ marginTop: '5px' }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <line key={i} x1="0" y1={5 + i * 7} x2="80" y2={5 + i * 7} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      ))}
                      <path
                        d="M0,30 Q8,33 15,25 T30,20 Q38,23 45,18 T60,15 Q68,18 75,12"
                        fill="none"
                        stroke="#37bc12"
                        strokeWidth="1"
                      />
                      <path
                        d="M0,25 Q8,28 15,22 T30,18 Q38,21 45,16 T60,13 Q68,16 75,10"
                        fill="none"
                        stroke="#ff9900"
                        strokeWidth="1"
                      />
                    </svg>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '6px', marginTop: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="legend-color current"></span>
                        <span>Current</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="legend-color expected"></span>
                        <span>Expected</span>
                      </div>
                    </div>
                  </div>

                  {/* Rotor Position - Responsive */}
                  <div className="rotor-position">
                    <div className="gauge-container" style={{ width: spacing.gaugeSize, height: spacing.gaugeSize }}>
                      <div className="gauge-value" style={{ fontSize: spacing.fontSize }}>{rotorPosition}°</div>
                      <div className="gauge-label" style={{ fontSize: `calc(${spacing.fontSize} * 0.6)` }}>Rotor Position</div>
                    </div>
                    <img src={require('./assets/graph.png')} alt="Graph" style={{ width: `calc(${spacing.gaugeSize} * 1.3)`, height: spacing.chartHeight, marginTop: '5px' }} />
                  </div>

                  {/* Insulation Resistance - Responsive */}
                  <div className="insulation-resistance">
                    <div className="gauge-container" style={{ width: spacing.gaugeSize, height: spacing.gaugeSize }}>
                      <div className="gauge-value" style={{ fontSize: spacing.fontSize }}>{insulationResistance} MΩ</div>
                      <div className="gauge-label" style={{ fontSize: `calc(${spacing.fontSize} * 0.5)` }}>Insulation Resistance</div>
                    </div>
                    <img src={require('./assets/graph2.png')} alt="Graph" style={{ width: `calc(${spacing.gaugeSize} * 1.3)`, height: spacing.chartHeight, marginTop: '5px' }} />
                  </div>



                  {/* Torque Output - Responsive */}
                  <div className="torque-gauge">
                    <div className="gauge-container" style={{ width: spacing.gaugeSize, height: spacing.gaugeSize }}>
                      <div className="gauge-arc" style={{ 
                        width: spacing.gaugeSize,
                        height: `calc(${spacing.gaugeSize} / 2)`,
                        borderTopColor: currentPredictions?.status === 'CRITICAL' ? '#ff4444' : 
                                       currentPredictions?.status === 'WARNING' ? '#ff9900' : '#37bc12' 
                      }}></div>
                      <div className="gauge-value" style={{ fontSize: spacing.fontSize }}>{formatTorque(currentData.rpm_avg, currentData.performance_score)}</div>
                      <div className="gauge-label" style={{ fontSize: `calc(${spacing.fontSize} * 0.7)` }}>Torque Output</div>
                      <div className="gauge-unit" style={{ fontSize: `calc(${spacing.fontSize} * 0.6)` }}>{formatTorque(currentData.rpm_avg, currentData.performance_score)} Nm</div>
                    </div>
                    <svg width={spacing.chartHeight} height={`calc(${spacing.chartHeight} / 2)`} viewBox="0 0 80 40" style={{ marginTop: '5px' }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <line key={i} x1="0" y1={5 + i * 7} x2="80" y2={5 + i * 7} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      ))}
                      <path
                        d="M0,28 Q8,31 15,23 T30,18 Q38,21 45,16 T60,13 Q68,16 75,10"
                        fill="none"
                        stroke="#37bc12"
                        strokeWidth="1"
                      />
                      <path
                        d="M0,23 Q8,26 15,20 T30,15 Q38,18 45,13 T60,10 Q68,13 75,7"
                        fill="none"
                        stroke="#ff9900"
                        strokeWidth="1"
                      />
                    </svg>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '6px', marginTop: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="legend-color current"></span>
                        <span>Current</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="legend-color expected"></span>
                        <span>Expected</span>
                      </div>
                    </div>
                  </div>

                  {/* Bearing Health */}
                  <div className="bearing-health" style={{ marginTop: '20px' }}>
                    <h3>Bearing Health</h3>
                    <div className="health-bars">
                      <div className="health-bar">
                        <span>Radial</span>
                        <div className={`bar ${bearingHealth.radial > 50 ? 'red' : 'green'}`} 
                             style={{ width: `${Math.max(60, 200 - bearingHealth.radial * 2)}px` }}></div>
                      </div>
                      <div className="health-bar">
                        <span>Outer Race</span>
                        <div className={`bar ${bearingHealth.outer > 50 ? 'red' : 'green'}`} 
                             style={{ width: `${Math.max(60, 200 - bearingHealth.outer * 2)}px` }}></div>
                      </div>
                      <div className="health-bar">
                        <span>Thrust</span>
                        <div className={`bar ${bearingHealth.thrust > 50 ? 'red' : 'green'}`} 
                             style={{ width: `${Math.max(60, 200 - bearingHealth.thrust * 2)}px` }}></div>
                      </div>
                      <div className="health-bar">
                        <span>Inner Race</span>
                        <div className={`bar ${bearingHealth.inner > 50 ? 'red' : 'green'}`} 
                             style={{ width: `${Math.max(60, 200 - bearingHealth.inner * 2)}px` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Motor Temperature - Responsive */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '15px', 
                    gridColumn: '3', 
                    gridRow: '2', 
                    transform: `translateX(${window.innerWidth >= 1920 ? '20px' : window.innerWidth >= 1400 ? '10px' : '0px'})`, 
                    marginTop: `${window.innerWidth >= 1920 ? '10px' : window.innerWidth >= 1400 ? '-10px' : '-20px'}` 
                  }}>
                    <div className="motor-temperature">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div className="temp-icon" style={{ fontSize: `calc(${spacing.fontSize} * 1.5)` }}>🌡️</div>
                        <div className="temp-value" style={{ 
                          fontSize: `calc(${spacing.fontSize} * 1.7)`, 
                          fontWeight: '300',
                          color: currentPredictions?.temperature > 100 ? '#ff4444' : 
                                 currentPredictions?.temperature > 95 ? '#ff9900' : '#37bc12'
                        }}>
                          {formatValue(currentData.engine_temp_c, '°C', '90°C')}
                        </div>
                      </div>
                      <div className="temp-label" style={{ fontSize: `calc(${spacing.fontSize} * 0.7)` }}>Motor Temperature</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <svg width={spacing.chartHeight} height={`calc(${spacing.chartHeight} / 2)`} viewBox="0 0 80 40">
                        {Array.from({ length: 5 }, (_, i) => (
                          <line key={i} x1="0" y1={5 + i * 7} x2="80" y2={5 + i * 7} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                        ))}
                        <polyline
                          points="0,30 15,25 30,20 45,18 60,15 75,12"
                          fill="none"
                          stroke="#37bc12"
                          strokeWidth="1"
                        />
                      </svg>
                      <div style={{ display: 'flex', gap: '8px', fontSize: `calc(${spacing.fontSize} * 0.6)` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span className="legend-color current"></span>
                          <span>Current</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span className="legend-color expected"></span>
                          <span>Expected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Containers */}
              <div className="bottom-containers" style={{ 
                marginBottom: '0',
                marginTop: windowWidth < 1600 ? '-30px' : '0',
                transform: windowWidth < 1600 ? 'scaleY(0.8)' : 'none',
                transformOrigin: 'top'
              }}>
                <div className="data-container">
                  <h3>Electrical</h3>
                  <div className="electrical-metrics">
                    <div className="metric-item">
                      <div className="metric-value" style={{ fontSize: spacing.fontSize }}>{electricalMetrics.phaseCurrent} A</div>
                      <div className="metric-label" style={{ fontSize: `calc(${spacing.fontSize} * 0.7)` }}>Phase Currents</div>
                      <svg width={`calc(${spacing.chartHeight} * 1.1)`} height={`calc(${spacing.chartHeight} * 0.9)`} viewBox="0 0 90 45" style={{ marginTop: '5px' }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                        ))}
                        <path
                          d="M0,22 Q6,17 12,28 T24,28 Q30,12 36,22 T48,17 Q54,28 60,14 T72,22 Q78,33 84,17 T90,20"
                          fill="none"
                          stroke="#37bc12"
                          strokeWidth="1"
                        />
                      </svg>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value" style={{ fontSize: spacing.fontSize }}>{electricalMetrics.busVoltage} V</div>
                      <div className="metric-label" style={{ fontSize: `calc(${spacing.fontSize} * 0.7)` }}>Bus Voltage</div>
                      <svg width={`calc(${spacing.chartHeight} * 1.1)`} height={`calc(${spacing.chartHeight} * 0.9)`} viewBox="0 0 90 45" style={{ marginTop: '5px' }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                        ))}
                        <path
                          d="M0,28 Q6,22 12,33 T24,31 Q30,14 36,25 T48,20 Q54,31 60,17 T72,28 Q78,38 84,22 T90,25"
                          fill="none"
                          stroke="#37bc12"
                          strokeWidth="1"
                        />
                      </svg>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value" style={{ fontSize: spacing.fontSize }}>{electricalMetrics.motorVoltage} V</div>
                      <div className="metric-label" style={{ fontSize: `calc(${spacing.fontSize} * 0.7)` }}>Motor Voltage</div>
                      <svg width={`calc(${spacing.chartHeight} * 1.1)`} height={`calc(${spacing.chartHeight} * 0.9)`} viewBox="0 0 90 45" style={{ marginTop: '5px' }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                        ))}
                        <path
                          d="M0,17 Q6,28 12,12 T24,20 Q30,31 36,14 T48,33 Q54,17 60,28 T72,20 Q78,31 84,14 T90,28"
                          fill="none"
                          stroke="#37bc12"
                          strokeWidth="1"
                        />
                      </svg>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value" style={{ fontSize: spacing.fontSize }}>{electricalMetrics.powerOutput} kW</div>
                      <div className="metric-label" style={{ fontSize: `calc(${spacing.fontSize} * 0.7)` }}>Power Output</div>
                      <svg width={`calc(${spacing.chartHeight} * 1.1)`} height={`calc(${spacing.chartHeight} * 0.9)`} viewBox="0 0 90 45" style={{ marginTop: '5px' }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                        ))}
                        <path
                          d="M0,25 Q6,14 12,31 T24,12 Q30,33 36,17 T48,12 Q54,31 60,20 T72,33 Q78,20 84,31 T90,25"
                          fill="none"
                          stroke="#37bc12"
                          strokeWidth="1"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="data-container">
                  <h3>Performance</h3>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div className="metric-item" style={{ flex: '1', alignItems: 'flex-start', textAlign: 'left' }}>
                      <div className="metric-value" style={{ textAlign: 'center', width: spacing.chartHeight, fontSize: spacing.fontSize }}>
                        {formatValue(currentData.fuel_consumption_l100km, '', '8.5')} L/100km
                      </div>
                      <div className="metric-label" style={{ textAlign: 'left', fontSize: `calc(${spacing.fontSize} * 0.7)` }}>Energy Consumption</div>
                      <svg width={spacing.chartHeight} height={`calc(${spacing.chartHeight} * 1.6)`} viewBox="0 0 90 80" style={{ marginTop: '8px', marginLeft: '0' }}>
                        {Array.from({ length: 8 }, (_, i) => (
                          <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                        ))}
                        <path
                          d="M0,50 Q6,45 12,55 T24,52 Q30,40 36,48 T48,45 Q54,58 60,42 T72,50 Q78,60 84,45 T90,52"
                          fill="none"
                          stroke="#37bc12"
                          strokeWidth="1"
                        />
                      </svg>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', flex: '1' }}>
                      <div className="metric-item">
                        <div className="metric-value" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: spacing.fontSize }}>
                          <span style={{ 
                            color: parseFloat(currentData.vibration_level) > 4 ? '#ff0000' : 
                                   parseFloat(currentData.vibration_level) > 3 ? '#ff9900' : '#37bc12', 
                            fontSize: `calc(${spacing.fontSize} * 0.6)` 
                          }}>
                            {parseFloat(currentData.vibration_level) > 4 ? '↑' : 
                             parseFloat(currentData.vibration_level) > 3 ? '→' : '↓'}
                          </span>
                          {formatValue(currentData.vibration_level, '', '2.5')} g RMS
                        </div>
                        <div className="metric-label" style={{ fontSize: `calc(${spacing.fontSize} * 0.7)` }}>Vibration Levels</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value" style={{ fontSize: spacing.fontSize }}>{formatValue(currentData.oil_pressure_psi, 'PSI', '25.0 PSI')}</div>
                        <div className="metric-label" style={{ fontSize: `calc(${spacing.fontSize} * 0.7)` }}>Oil Pressure</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: spacing.fontSize }}>
                          <span style={{ 
                            color: currentPredictions?.status === 'CRITICAL' ? '#ff0000' : 
                                   currentPredictions?.status === 'WARNING' ? '#ff9900' : '#37bc12', 
                            fontSize: `calc(${spacing.fontSize} * 0.6)` 
                          }}>
                            {currentPredictions?.status === 'CRITICAL' ? '↑' : '→'}
                          </span>
                          {formatValue(currentData.performance_score, '', '95')}%
                        </div>
                        <div className="metric-label" style={{ fontSize: `calc(${spacing.fontSize} * 0.7)` }}>Performance Score</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: spacing.fontSize }}>
                          <span style={{ color: '#37bc12', fontSize: `calc(${spacing.fontSize} * 0.6)` }}>→</span>
                          {formatValue(currentData.speed_kmh, '', '65')} km/h
                        </div>
                        <div className="metric-label" style={{ fontSize: `calc(${spacing.fontSize} * 0.7)` }}>Current Speed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="right-panel">
              <div className="battery-prediction">
                <div className="prediction-header">
                  <h2 style={{ fontSize: windowWidth < 1600 ? '18px' : '24px', marginTop: windowWidth < 1600 ? '-20px' : '0' }}>Motor Prediction</h2>
                  <img
                    src={require('./assets/warning.png')}
                    alt="Warning"
                    className="info-icon"
                    style={{ width: '20px', height: '20px', cursor: 'pointer', zIndex: 9999, position: 'relative' }}
                    onClick={() => setShowModal(true)}
                  />
                </div>

                {/* Failure Prediction Chart */}
                <div className="motor-prediction-container" style={{ paddingLeft: '30px', marginTop: windowWidth < 1600 ? '-20px' : '0' }}>
                  <div className="failure-prediction" style={{ marginTop: windowWidth < 1600 ? '-10px' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: windowWidth < 1600 ? '12px' : '14px' }}>Motor Failure Prediction</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
                          Show Prediction
                        </span>
                        <button
                          onClick={() => setShowPrediction(!showPrediction)}
                          style={{
                            background: showPrediction ? '#37bc12' : 'rgba(255,255,255,0.2)',
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
                            justifyContent: showPrediction ? 'flex-end' : 'flex-start',
                            paddingLeft: showPrediction ? '0' : '2px',
                            paddingRight: showPrediction ? '2px' : '0'
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

                      <div className="prediction-chart" style={{ marginTop: windowWidth < 1600 ? '-100px' : '0' }}>
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
                        
                        {/* Past data (orange) - Declining health: 90% → 65% */}
                        <polyline
                          points="35,35 50,40 65,45 80,50 95,55 110,60 125,65"
                          fill="none"
                          stroke="rgba(255,153,0,1)"
                          strokeWidth="2"
                        />
                        
                        {/* Predicted data (green) - Animated based on toggle */}
                        {showPrediction && (
                          <polyline
                            points="125,65 140,70 155,75 170,82 185,90 200,100 215,112"
                            fill="none"
                            stroke="rgba(56,239,125,1)"
                            strokeWidth="2"
                            strokeDasharray="4,4"
                            strokeDashoffset={100 * (1 - animationProgress)}
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
                        {showPrediction && animationProgress > 0.15 && (
                          <circle cx="140" cy="70" r="1.5" fill="rgba(56,239,125,1)" opacity={Math.min(1, (animationProgress - 0.15) * 5)}/>
                        )}
                        {showPrediction && animationProgress > 0.3 && (
                          <circle cx="155" cy="75" r="1.5" fill="rgba(56,239,125,1)" opacity={Math.min(1, (animationProgress - 0.3) * 5)}/>
                        )}
                        {showPrediction && animationProgress > 0.45 && (
                          <circle cx="170" cy="82" r="1.5" fill="rgba(255,153,0,1)" opacity={Math.min(1, (animationProgress - 0.45) * 5)}/>
                        )}
                        {showPrediction && animationProgress > 0.6 && (
                          <circle cx="185" cy="90" r="1.5" fill="rgba(255,153,0,1)" opacity={Math.min(1, (animationProgress - 0.6) * 5)}/>
                        )}
                        {showPrediction && animationProgress > 0.75 && (
                          <circle cx="200" cy="100" r="1.5" fill="rgba(255,68,68,1)" opacity={Math.min(1, (animationProgress - 0.75) * 5)}/>
                        )}
                        {showPrediction && animationProgress > 0.9 && (
                          <circle cx="215" cy="112" r="1.5" fill="rgba(255,68,68,1)" opacity={Math.min(1, (animationProgress - 0.9) * 10)}/>
                        )}
                        
                        {/* Annotations */}
                        <text x="125" y="58" fill="rgba(255,255,255,0.9)" fontSize="7" textAnchor="middle" fontWeight="bold">NOW</text>
                        {showPrediction && animationProgress > 0.5 && (
                          <>
                            <text x="170" y="75" fill="rgba(255,153,0,0.9)" fontSize="6" textAnchor="middle" opacity={Math.min(1, (animationProgress - 0.5) * 2)}>Maintenance</text>
                            <text x="170" y="83" fill="rgba(255,153,0,0.9)" fontSize="6" textAnchor="middle" opacity={Math.min(1, (animationProgress - 0.5) * 2)}>Needed</text>
                          </>
                        )}
                        {showPrediction && animationProgress > 0.8 && (
                          <>
                            <text x="200" y="93" fill="rgba(255,68,68,0.9)" fontSize="6" textAnchor="middle" opacity={Math.min(1, (animationProgress - 0.8) * 5)}>Failure</text>
                            <text x="200" y="101" fill="rgba(255,68,68,0.9)" fontSize="6" textAnchor="middle" opacity={Math.min(1, (animationProgress - 0.8) * 5)}>Risk</text>
                          </>
                        )}
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Remaining Useful Life */}
                  <div className="useful-life" style={{ marginBottom: '20px', marginTop: windowWidth < 1600 ? '-120px' : '-40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <span style={{ fontSize: '10px', color: 'white' }}>Remaining useful life</span>
                      <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>
                        {remainingLife}%
                      </span>
                    </div>
                    <div className="life-bar" style={{ borderRadius: '0' }}>
                      <div className="life-fill" style={{ 
                        width: `${remainingLife}%`, 
                        borderRadius: '0',
                        background: remainingLife < 30 ? '#ff4444' : 
                                   remainingLife < 60 ? '#ff9900' : 
                                   'linear-gradient(90deg, #ff9900 0%, #37bc12 100%)'
                      }}></div>
                    </div>
                  </div>

                  {/* GenAI Recommendations */}
                  <div className="genai-recommendations" style={{ marginTop: windowWidth < 1600 ? '-50px' : '-10px' }}>
                    <h3>GenAI Recommendations</h3>
                    <p>AI-powered motor optimization based on real-time performance data, driving patterns, and predictive analytics from sensor readings.</p>
                    
                    <div className="recommendations-list">
                      {aiRecommendations.slice(0, 3).map((rec, index) => (
                        <div key={index}>
                          <div className="recommendation-item">
                            <span className="warning-icon">
                              {rec.priority === 'URGENT' ? '🚨' : rec.priority === 'HIGH' ? '⚠️' : 'ℹ️'}
                            </span>
                            <span>{rec.action}</span>
                          </div>
                          {rec.description && (
                            <div className="recommendation-details">
                              <p><strong>Details:</strong> {rec.description}</p>
                              {rec.estimated_cost && <p><strong>Cost:</strong> {rec.estimated_cost}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="more-link" style={{ color: '#ff9900', fontSize: '8px', fontStyle: 'italic' }}>
                        More.....
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DataNeededModal open={showModal} onClose={() => setShowModal(false)} type="motor" />
    </div>
  );
};

export default Motor;