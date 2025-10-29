import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataNeededModal from "./DataNeededModal";
import "../css/charger.css";

const Charger = () => {
  const navigate = useNavigate();
  const { carId } = useParams();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [predictionData, setPredictionData] = useState([]);
  const [genAiAnalysis, setGenAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chartData, setChartData] = useState({
    inputVoltage: { current: [], expected: [] },
    outputVoltage: { current: [], expected: [] },
    inputCurrent: { current: [], expected: [] },
    outputCurrent: { current: [], expected: [] }
  });
  const [gaugeAngles, setGaugeAngles] = useState({
    inputVoltage: 0,
    outputVoltage: 0,
    inputCurrent: 0,
    outputCurrent: 0
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamic chart data generation for Charger
  useEffect(() => {
    const generateChargerChartData = () => {
      // Simulate realistic charger data
      const inputVoltage = 180 + Math.sin(Date.now() * 0.0003) * 10 + Math.random() * 5;
      const outputVoltage = 180 + Math.sin(Date.now() * 0.0003) * 8 + Math.random() * 4;
      const inputCurrent = 27 + Math.sin(Date.now() * 0.0005) * 5 + Math.random() * 2;
      const outputCurrent = 27 + Math.sin(Date.now() * 0.0005) * 4 + Math.random() * 2;
      
      // Generate realistic waveform data points
      const generateWaveform = (baseValue, amplitude = 5, frequency = 1, phase = 0) => {
        const points = [];
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < 20; i++) {
          const x = (i / 19) * 90;
          const variation = Math.sin((time + phase) * frequency + (i * 0.3)) * amplitude;
          const noise = (Math.random() - 0.5) * 2;
          const y = 22 + variation + noise;
          points.push({ x, y: Math.max(8, Math.min(36, y)) });
        }
        return points;
      };
      
      const generateExpectedWaveform = (baseValue, amplitude = 3, frequency = 0.5, phase = 0) => {
        const points = [];
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < 20; i++) {
          const x = (i / 19) * 90;
          const variation = Math.sin((time + phase) * frequency + (i * 0.2)) * amplitude;
          const y = 25 + variation;
          points.push({ x, y: Math.max(8, Math.min(36, y)) });
        }
        return points;
      };
      
      // Update chart data
      const newChartData = {
        inputVoltage: {
          current: generateWaveform(inputVoltage, 4, 1.2, 0),
          expected: generateExpectedWaveform(inputVoltage, 2, 0.8, 0.5)
        },
        outputVoltage: {
          current: generateWaveform(outputVoltage, 3, 1.0, 1.0),
          expected: generateExpectedWaveform(outputVoltage, 2, 0.6, 1.2)
        },
        inputCurrent: {
          current: generateWaveform(inputCurrent, 5, 1.5, 2.0),
          expected: generateExpectedWaveform(inputCurrent, 3, 0.9, 2.5)
        },
        outputCurrent: {
          current: generateWaveform(outputCurrent, 4, 1.1, 3.0),
          expected: generateExpectedWaveform(outputCurrent, 2, 0.7, 3.5)
        }
      };
      
      setChartData(newChartData);
      
      // Calculate gauge angles
      const calculateGaugeAngle = (value, min, max) => {
        const percentage = Math.max(0, Math.min(1, (value - min) / (max - min)));
        return percentage * 180;
      };
      
      const newGaugeAngles = {
        inputVoltage: calculateGaugeAngle(inputVoltage, 100, 250),
        outputVoltage: calculateGaugeAngle(outputVoltage, 100, 250),
        inputCurrent: calculateGaugeAngle(inputCurrent, 10, 50),
        outputCurrent: calculateGaugeAngle(outputCurrent, 10, 50)
      };
      
      setGaugeAngles(newGaugeAngles);
      
      console.log('🔌 Charger Charts Updated:', {
        inputVoltage: inputVoltage.toFixed(1) + 'V',
        outputVoltage: outputVoltage.toFixed(1) + 'V',
        inputCurrent: inputCurrent.toFixed(1) + 'A',
        outputCurrent: outputCurrent.toFixed(1) + 'A'
      });
    };
    
    // Generate initial data and update every 2 seconds
    generateChargerChartData();
    const chartInterval = setInterval(generateChargerChartData, 2000);
    
    return () => clearInterval(chartInterval);
  }, []);

  // Generate dynamic prediction data for charger failure
  useEffect(() => {
    if (showPrediction) {
      const generateChargerPredictionData = () => {
        const basePoints = [
          { x: 125, y: 85, health: 55, status: 'Current' },
          { x: 140, y: 90, health: 50, status: 'Declining' },
          { x: 155, y: 95, health: 45, status: 'Declining' },
          { x: 170, y: 100, health: 40, status: 'Warning' },
          { x: 185, y: 105, health: 35, status: 'Critical' },
          { x: 200, y: 110, health: 30, status: 'Critical' },
          { x: 215, y: 115, health: 25, status: 'Failure Risk' }
        ];

        let currentIndex = 0;
        const animationInterval = setInterval(() => {
          if (currentIndex < basePoints.length) {
            setPredictionData(prev => [...prev, basePoints[currentIndex]]);
            currentIndex++;
          } else {
            clearInterval(animationInterval);
          }
        }, 300);

        return () => clearInterval(animationInterval);
      };

      const animationTimeout = setTimeout(generateChargerPredictionData, 500);
      return () => clearTimeout(animationTimeout);
    } else {
      setPredictionData([]);
    }
  }, [showPrediction]);

  // GenAI Analysis for Charger Management
  const analyzeChargerWithGenAI = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate GenAI analysis with charger-specific data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const chargerAnalysis = {
        overall_status: "WARNING",
        risk_level: "MEDIUM",
        key_findings_summary: "Charger efficiency declining due to thermal stress and component aging. Power conversion efficiency at 85% with increasing heat generation. Isolation resistance within acceptable range but trending downward.",
        recommendations: [
          {
            action: "Implement Thermal Management Optimization",
            priority: "HIGH",
            reason: "Charger temperature reaching 60°C indicates thermal stress affecting efficiency",
            urgency: "Within 2 weeks - Schedule during next maintenance window"
          },
          {
            action: "Power Conversion Efficiency Monitoring",
            priority: "MEDIUM", 
            reason: "85% efficiency is below optimal 90-95% range for onboard chargers",
            urgency: "Within 1 month - Implement continuous monitoring"
          },
          {
            action: "Isolation Resistance Testing",
            priority: "MEDIUM",
            reason: "23 MΩ resistance is adequate but requires regular monitoring",
            urgency: "Monthly testing recommended"
          },
          {
            action: "Coolant System Inspection",
            priority: "HIGH",
            reason: "Coolant temperature at 60°C suggests potential cooling system issues",
            urgency: "Within 1 week - Check coolant levels and flow rates"
          }
        ]
      };
      
      setGenAiAnalysis(chargerAnalysis);
      console.log('🤖 GenAI Charger Analysis Complete:', chargerAnalysis);
      
    } catch (error) {
      console.error('GenAI Analysis Error:', error);
      setGenAiAnalysis({
        error: true,
        message: "GenAI service temporarily unavailable. Using fallback recommendations."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Initialize GenAI analysis
  useEffect(() => {
    // Start analysis after a delay
    const analysisTimer = setTimeout(analyzeChargerWithGenAI, 3000);
    return () => clearTimeout(analysisTimer);
  }, []);

  // Calculate dynamic remaining useful life based on charger health
  const calculateChargerRemainingLife = useMemo(() => {
    const currentHealth = 55; // Based on current charger status
    const criticalThreshold = 25;
    const warningThreshold = 40;
    
    if (currentHealth <= criticalThreshold) {
      return Math.max(10, currentHealth);
    } else if (currentHealth <= warningThreshold) {
      return Math.max(25, currentHealth - 5);
    } else {
      return Math.min(85, currentHealth + 5);
    }
  }, []);

  // Responsive sizing functions
  const spacing = useMemo(() => {
    const width = windowWidth;
    
    return {
      fontSize: width < 1200 ? '12px' : width < 1400 ? '14px' : '16px',
      smallFontSize: width < 1200 ? '8px' : width < 1400 ? '9px' : '10px',
      titleFontSize: width < 1200 ? '14px' : width < 1400 ? '16px' : '18px'
    };
  }, [windowWidth]);

  // Helper function to generate SVG path from data points
  const generateSVGPath = (points) => {
    if (!points || points.length === 0) return '';
    
    let path = `M${points[0].x},${points[0].y}`;
    
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = current.x + (next.x - current.x) * 0.5;
      const controlY = current.y;
      path += ` Q${controlX},${controlY} ${next.x},${next.y}`;
    }
    
    return path;
  };

  // Helper function to create dynamic gauge arc
  const createGaugeArc = (angle, radius = 35, strokeWidth = 3) => {
    const centerX = 45;
    const centerY = 45;
    const startAngle = 0;
    const endAngle = Math.min(180, Math.max(0, angle));
    
    const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };

  return (
    <div className="charger-page" style={{ overflowY: windowWidth <= 1700 ? 'auto' : 'hidden' }}>
      <div className="charger-container" style={{ overflowY: 'hidden', height: 'auto' }}>
        {/* Header */}
        <header className="header" style={{ height: windowWidth <= 1440 ? '45px' : windowWidth <= 1700 ? '50px' : windowWidth <= 1815 ? '60px' : 'auto', padding: windowWidth <= 1440 ? '8px 15px' : windowWidth <= 1700 ? '10px 20px' : windowWidth <= 1815 ? '15px 20px' : '20px' }}>
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
        <div className="nav-header" style={{ margin: windowWidth <= 1700 ? '20px 20px 15px' : '20px 20px 20px', borderBottom: 'none' }}>
          <button className="back-button" onClick={() => navigate(-1)}>
            <span>←</span>
            <span>On Board Chargers</span>
          </button>
        </div>
        


        <div style={{ margin: '10px 20px 5px' }}>
          <div className="charger-layout">
            {/* Main Panel */}
            <div className="main-panel" style={{ marginTop: windowWidth <= 1700 ? '40px' : '50px' }}>
              {/* Top Container: Charging Sessions */}
              <div className="data-container" style={{ marginBottom: "-5px", marginTop: "0px" }}>
              <h3>Charging Sessions</h3>
              <span className="charger-status in-use">In Use</span>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '30px', height: 'calc(100% - 60px)', width: '100%' }}>
                <div className="charger-metrics-grid" style={{ flex: '0 0 380px' }}>
                <div className="charger-gauge">
                  <div className="gauge-container">
                    {/* Dynamic Semi-Circle Gauge */}
                    <svg width="90px" height="50px" viewBox="0 0 90 50" style={{ position: 'absolute', top: '0', left: '0' }}>
                      <path
                        d="M 10 45 A 35 35 0 0 1 80 45"
                        fill="none"
                        stroke="rgba(104,111,120,0.3)"
                        strokeWidth="3"
                      />
                      <path
                        d={createGaugeArc(gaugeAngles.inputVoltage)}
                        fill="none"
                        stroke="#37bc12"
                        strokeWidth="3"
                        strokeLinecap="round"
                        style={{ 
                          transition: 'all 0.5s ease-in-out',
                          filter: 'drop-shadow(0 0 3px rgba(55, 188, 18, 0.5))'
                        }}
                      />
                      <circle cx="45" cy="45" r="2" fill="#37bc12" />
                    </svg>
                    <div className="gauge-value" style={{ fontWeight: 'bold', color: '#37bc12' }}>
                      {Math.round(180 + Math.sin(Date.now() * 0.0003) * 10)} V
                    </div>
                    <div className="gauge-label">Input Voltage (AC)</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path
                      d={generateSVGPath(chartData.inputVoltage.current)}
                      fill="none"
                      stroke="#37bc12"
                      strokeWidth="1.5"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(55, 188, 18, 0.3))'
                      }}
                    />
                    <path
                      d={generateSVGPath(chartData.inputVoltage.expected)}
                      fill="none"
                      stroke="#ff9900"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(255, 153, 0, 0.3))'
                      }}
                    />
                  </svg>
                </div>
                <div className="charger-gauge">
                  <div className="gauge-container">
                    {/* Dynamic Semi-Circle Gauge */}
                    <svg width="90px" height="50px" viewBox="0 0 90 50" style={{ position: 'absolute', top: '0', left: '0' }}>
                      <path
                        d="M 10 45 A 35 35 0 0 1 80 45"
                        fill="none"
                        stroke="rgba(104,111,120,0.3)"
                        strokeWidth="3"
                      />
                      <path
                        d={createGaugeArc(gaugeAngles.outputVoltage)}
                        fill="none"
                        stroke="#0088ff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        style={{ 
                          transition: 'all 0.5s ease-in-out',
                          filter: 'drop-shadow(0 0 3px rgba(0, 136, 255, 0.5))'
                        }}
                      />
                      <circle cx="45" cy="45" r="2" fill="#0088ff" />
                    </svg>
                    <div className="gauge-value" style={{ fontWeight: 'bold', color: '#0088ff' }}>
                      {Math.round(180 + Math.sin(Date.now() * 0.0003) * 8)} V
                    </div>
                    <div className="gauge-label">Output Voltage (AC)</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path
                      d={generateSVGPath(chartData.outputVoltage.current)}
                      fill="none"
                      stroke="#0088ff"
                      strokeWidth="1.5"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(0, 136, 255, 0.3))'
                      }}
                    />
                    <path
                      d={generateSVGPath(chartData.outputVoltage.expected)}
                      fill="none"
                      stroke="#ff9900"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(255, 153, 0, 0.3))'
                      }}
                    />
                  </svg>
                </div>
                <div className="charger-gauge">
                  <div className="gauge-container">
                    {/* Dynamic Semi-Circle Gauge */}
                    <svg width="90px" height="50px" viewBox="0 0 90 50" style={{ position: 'absolute', top: '0', left: '0' }}>
                      <path
                        d="M 10 45 A 35 35 0 0 1 80 45"
                        fill="none"
                        stroke="rgba(104,111,120,0.3)"
                        strokeWidth="3"
                      />
                      <path
                        d={createGaugeArc(gaugeAngles.inputCurrent)}
                        fill="none"
                        stroke="#ff6b35"
                        strokeWidth="3"
                        strokeLinecap="round"
                        style={{ 
                          transition: 'all 0.5s ease-in-out',
                          filter: 'drop-shadow(0 0 3px rgba(255, 107, 53, 0.5))'
                        }}
                      />
                      <circle cx="45" cy="45" r="2" fill="#ff6b35" />
                    </svg>
                    <div className="gauge-value" style={{ fontWeight: 'bold', color: '#ff6b35' }}>
                      {Math.round(27 + Math.sin(Date.now() * 0.0005) * 5)} A
                    </div>
                    <div className="gauge-label">Input Current (AC)</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path
                      d={generateSVGPath(chartData.inputCurrent.current)}
                      fill="none"
                      stroke="#ff6b35"
                      strokeWidth="1.5"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(255, 107, 53, 0.3))'
                      }}
                    />
                    <path
                      d={generateSVGPath(chartData.inputCurrent.expected)}
                      fill="none"
                      stroke="#ff9900"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(255, 153, 0, 0.3))'
                      }}
                    />
                  </svg>
                </div>
                <div className="charger-gauge">
                  <div className="gauge-container">
                    {/* Dynamic Semi-Circle Gauge */}
                    <svg width="90px" height="50px" viewBox="0 0 90 50" style={{ position: 'absolute', top: '0', left: '0' }}>
                      <path
                        d="M 10 45 A 35 35 0 0 1 80 45"
                        fill="none"
                        stroke="rgba(104,111,120,0.3)"
                        strokeWidth="3"
                      />
                      <path
                        d={createGaugeArc(gaugeAngles.outputCurrent)}
                        fill="none"
                        stroke="#9b59b6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        style={{ 
                          transition: 'all 0.5s ease-in-out',
                          filter: 'drop-shadow(0 0 3px rgba(155, 89, 182, 0.5))'
                        }}
                      />
                      <circle cx="45" cy="45" r="2" fill="#9b59b6" />
                    </svg>
                    <div className="gauge-value" style={{ fontWeight: 'bold', color: '#9b59b6' }}>
                      {Math.round(27 + Math.sin(Date.now() * 0.0005) * 4)} A
                    </div>
                    <div className="gauge-label">Output Current (AC)</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path
                      d={generateSVGPath(chartData.outputCurrent.current)}
                      fill="none"
                      stroke="#9b59b6"
                      strokeWidth="1.5"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(155, 89, 182, 0.3))'
                      }}
                    />
                    <path
                      d={generateSVGPath(chartData.outputCurrent.expected)}
                      fill="none"
                      stroke="#ff9900"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(255, 153, 0, 0.3))'
                      }}
                    />
                  </svg>
                </div>
                </div>
                
                <div style={{ width: '1px', height: '300px', backgroundColor: '#3a4552', margin: '0 30px' }}></div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', marginLeft: '30px', marginTop: '10px', flex: '1' }}>
                  <div style={{ fontSize: '12px', color: 'white', marginBottom: '10px' }}>Charger Efficiency: 85%</div>
                  <img src={require('./assets/chargericon.png')} alt="Charger Icon" style={{ width: `${windowWidth >= 1920 ? '450px' : windowWidth >= 1400 ? '250px' : '220px'}`, height: 'auto', maxHeight: windowWidth >= 1920 ? '250px' : windowWidth >= 1400 ? '190px' : '170px' }} />
                  <div className="charger-metrics-row" style={{ marginTop: '20px' }}>
                    <div className="charger-metric">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span role="img" aria-label="temp">🌡️</span>
                        <div className="invertor-temp-value">60°C</div>
                      </div>
                      <div className="charger-metric-label">Charger Temperature</div>
                    </div>
                    <div className="charger-metric">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span role="img" aria-label="temp">🌡️</span>
                        <div className="invertor-temp-value">60°C</div>
                      </div>
                      <div className="charger-metric-label">Coolant Temperature</div>
                    </div>
                    <div className="charger-metric">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div className="invertor-temp-value">23 MΩ</div>
                      </div>
                      <div className="charger-metric-label">Isolation Resistance</div>
                    </div>
                  </div>
                </div>
              </div>
              

            </div>

              {/* Bottom Container: Charge Efficiency */}
              <div className="data-container" style={{ minHeight: windowWidth >= 1920 ? '250px' : windowWidth <= 1440 ? '180px' : windowWidth <= 1700 ? '200px' : 'auto' }}>
              <h3>Charge Efficiency</h3>
              <div style={{ background: 'transparent', width: '100%', height: 'calc(100% - 60px)', marginTop: '10px' }}>
                <svg width="100%" height="100%" viewBox="0 0 1000 150" preserveAspectRatio="xMidYMid meet">
                  <line x1="50" y1="30" x2="950" y2="30" stroke="rgba(104,111,120,0.3)" strokeWidth="1"/>
                  <line x1="50" y1="60" x2="950" y2="60" stroke="rgba(104,111,120,0.3)" strokeWidth="1"/>
                  <line x1="50" y1="90" x2="950" y2="90" stroke="rgba(104,111,120,0.3)" strokeWidth="1"/>
                  <line x1="50" y1="120" x2="950" y2="120" stroke="rgba(104,111,120,0.3)" strokeWidth="1"/>
                  {Array.from({ length: 50 }, (_, i) => {
                    const height = Math.random() * 70 + 20;
                    return (
                      <rect
                        key={i}
                        x={60 + i * 17}
                        y={120 - height}
                        width="8"
                        height={height}
                        fill="#ff9900"
                      />
                    );
                  })}
                  <text x="500" y="145" fill="#fff" fontSize="10" textAnchor="middle">Charging Cycle</text>
                  <text x="25" y="80" fill="#fff" fontSize="10" textAnchor="middle" transform="rotate(-90 25 80)">Charging Efficiency</text>
                  <text x="45" y="125" fill="#fff" fontSize="8" textAnchor="end">0</text>
                  <text x="45" y="95" fill="#fff" fontSize="8" textAnchor="end">25</text>
                  <text x="45" y="65" fill="#fff" fontSize="8" textAnchor="end">50</text>
                  <text x="45" y="35" fill="#fff" fontSize="8" textAnchor="end">75</text>
                  <text x="45" y="25" fill="#fff" fontSize="8" textAnchor="end">100</text>
                </svg>
              </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="right-panel">
            <div className="battery-prediction">
              <div className="prediction-header">
                <h2 style={{ fontSize: windowWidth <= 1440 ? '16px' : windowWidth <= 1700 ? '18px' : windowWidth <= 1815 ? '22px' : '24px' }}>On Board Chargers Prediction</h2>
                <img src={require('./assets/warning.png')} alt="Warning" className="info-icon" style={{ width: '20px', height: '20px', cursor: 'pointer', zIndex: 99999, position: 'relative' }} onClick={() => setShowModal(true)} />
              </div>

              {/* Charger Prediction Container */}
              <div className="motor-prediction-container" style={{ paddingLeft: windowWidth <= 1440 ? '15px' : windowWidth <= 1700 ? '20px' : windowWidth <= 1815 ? '25px' : '30px' }}>
                <div className="failure-prediction">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', marginTop: '-12px', paddingRight: '5px' }}>
                    <h3 style={{ margin: 0, fontSize: windowWidth <= 1440 ? '14px' : '16px' }}>Charger Failure Prediction</h3>
                    <div 
                      className="prediction-toggle"
                      onClick={() => {
                        setShowPrediction(!showPrediction);
                        console.log('🔌 Charger Prediction Toggle:', !showPrediction ? 'ON' : 'OFF');
                      }}
                      style={{
                        width: '32px',
                        height: '16px',
                        backgroundColor: showPrediction ? '#00ff88' : 'rgba(255,255,255,0.3)',
                        borderRadius: '8px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: showPrediction ? '1px solid #00ff88' : '1px solid rgba(255,255,255,0.3)',
                        zIndex: 10,
                        marginTop: '2px'
                      }}
                    >
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          position: 'absolute',
                          top: '1px',
                          left: showPrediction ? '18px' : '1px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }}
                      />
                    </div>
                  </div>
                  <div className="prediction-legend" style={{ fontSize: windowWidth >= 1820 ? '14px' : 'inherit' }}>
                    <div className="legend-item">
                      <div style={{ width: '15px', height: '2px', backgroundColor: 'rgba(255,153,0,1)' }}></div>
                      <span>Past</span>
                    </div>
                    <div className="legend-item">
                      <div style={{ width: '15px', height: '2px', borderTop: '2px dashed rgba(56,239,125,1)', backgroundColor: 'transparent' }}></div>
                      <span>Predicted</span>
                    </div>
                  </div>
                  <div style={{ position: 'relative', marginTop: windowWidth <= 1440 ? '10px' : windowWidth <= 1700 ? '20px' : windowWidth <= 1815 ? '60px' : '100px' }}>
                    <div className="prediction-chart" style={{ transform: windowWidth <= 1440 ? 'scale(0.9)' : windowWidth <= 1700 ? 'scale(0.95)' : windowWidth <= 1815 ? 'scale(0.98)' : 'none', transformOrigin: 'left top' }}>
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
                      
                      {/* Past data (orange) - Charger declining: 95% → 60% */}
                      <polyline
                        points="35,25 50,35 65,45 80,55 95,65 110,75 125,85"
                        fill="none"
                        stroke="rgba(255,153,0,1)"
                        strokeWidth="2"
                      />
                      
                      {/* Dynamic Predicted data (green) - Only show if toggle is on */}
                      {showPrediction && predictionData.length > 1 && (
                        <polyline
                          points={predictionData.map(point => `${point.x},${point.y}`).join(' ')}
                          fill="none"
                          stroke="rgba(56,239,125,1)"
                          strokeWidth="2"
                          strokeDasharray="4,4"
                          style={{ 
                            opacity: showPrediction ? 1 : 0,
                            transition: 'opacity 0.5s ease-in-out'
                          }}
                        />
                      )}
                      
                      {/* Data points - Historical */}
                      <circle cx="35" cy="25" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="50" cy="35" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="65" cy="45" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="80" cy="55" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="95" cy="65" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="110" cy="75" r="1.5" fill="rgba(255,153,0,1)"/>
                      
                      {/* Current point - Highlighted */}
                      <circle cx="125" cy="85" r="2.5" fill="rgba(255,153,0,1)" stroke="white" strokeWidth="1.5"/>
                      <text x="125" y="78" fill="rgba(255,255,255,0.9)" fontSize="7" textAnchor="middle" fontWeight="bold">NOW</text>
                      <text x="125" y="95" fill="rgba(255,153,0,0.9)" fontSize="6" textAnchor="middle" fontWeight="bold">55%</text>
                      
                      {/* Dynamic Data points - Predicted (only show when toggle is on) */}
                      {showPrediction && predictionData.map((point, index) => (
                        <g key={index}>
                          <circle 
                            cx={point.x} 
                            cy={point.y} 
                            r="1.5" 
                            fill={point.health <= 30 ? "rgba(255,68,68,1)" : point.health <= 40 ? "rgba(255,153,0,1)" : "rgba(56,239,125,1)"}
                            style={{ 
                              opacity: 0,
                              animation: `fadeIn 0.5s ease-in-out ${index * 0.3}s forwards`
                            }}
                          />
                          {index === predictionData.length - 1 && (
                            <text 
                              x={point.x} 
                              y={point.y - 8} 
                              fill={point.health <= 30 ? "rgba(255,68,68,0.9)" : point.health <= 40 ? "rgba(255,153,0,0.9)" : "rgba(56,239,125,0.9)"} 
                              fontSize="6" 
                              textAnchor="middle"
                              style={{ 
                                opacity: 0,
                                animation: `fadeIn 0.5s ease-in-out ${index * 0.3 + 0.5}s forwards`
                              }}
                            >
                              {point.status}
                            </text>
                          )}
                        </g>
                      ))}
                      
                      {/* CSS Animation for fade in effect */}
                      <defs>
                        <style>
                          {`
                            @keyframes fadeIn {
                              from { opacity: 0; transform: scale(0.5); }
                              to { opacity: 1; transform: scale(1); }
                            }
                          `}
                        </style>
                      </defs>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Dynamic Remaining Useful Life */}
                <div className="useful-life" style={{ marginBottom: '20px', marginTop: windowWidth <= 1440 ? '-110px' : windowWidth <= 1700 ? '-90px' : windowWidth <= 1815 ? '-40px' : windowWidth >= 2560 ? '80px' : '0px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: windowWidth >= 1820 ? '14px' : spacing.smallFontSize, color: 'white' }}>Remaining useful life</span>
                    <span style={{ 
                      fontSize: windowWidth >= 1820 ? '18px' : spacing.fontSize, 
                      color: calculateChargerRemainingLife < 30 ? '#ff4444' : calculateChargerRemainingLife < 60 ? '#ff9900' : '#37bc12', 
                      fontWeight: 'bold' 
                    }}>
                      {calculateChargerRemainingLife}%
                    </span>
                  </div>
                  <div className="life-bar" style={{ borderRadius: '0' }}>
                    <div className="life-fill" style={{ 
                      width: `${calculateChargerRemainingLife}%`, 
                      borderRadius: '0',
                      background: calculateChargerRemainingLife < 30 ? '#ff4444' : 
                                 calculateChargerRemainingLife < 60 ? '#ff9900' : 
                                 'linear-gradient(90deg, #ff9900 0%, #37bc12 100%)',
                      transition: 'all 0.5s ease-in-out'
                    }}></div>
                  </div>
                </div>

                {/* Enhanced GenAI Recommendations */}
                <div className="genai-recommendations" style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ fontSize: spacing.titleFontSize, margin: 0 }}>GenAI Recommendations</h3>
                    {isAnalyzing && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '12px', 
                          height: '12px', 
                          border: '2px solid #00ff88', 
                          borderTop: '2px solid transparent', 
                          borderRadius: '50%', 
                          animation: 'spin 1s linear infinite' 
                        }}></div>
                        <span style={{ fontSize: '10px', color: '#00ff88' }}>Analyzing...</span>
                      </div>
                    )}
                  </div>
                  
                  <p style={{ 
                    fontSize: windowWidth >= 1920 ? spacing.fontSize : spacing.smallFontSize, 
                    color: isAnalyzing ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.8)', 
                    lineHeight: '1.4',
                    marginBottom: '20px',
                    transition: 'color 0.3s ease'
                  }}>
                    {isAnalyzing 
                      ? "🤖 GenAI is analyzing charger performance data, thermal patterns, and efficiency metrics..." 
                      : genAiAnalysis?.error 
                        ? "GenAI service temporarily unavailable. Using standard charger maintenance recommendations."
                        : `Overall Status: ${genAiAnalysis?.overall_status || 'ANALYZING'} | Risk Level: ${genAiAnalysis?.risk_level || 'PENDING'}`
                    }
                  </p>
                  
                  {/* GenAI Key Findings - Natural Language Summary */}
                  {genAiAnalysis?.key_findings_summary && !genAiAnalysis.error && (
                    <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(0,255,136,0.1)', borderRadius: '4px', border: '1px solid rgba(0,255,136,0.3)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#00ff88', marginBottom: '4px' }}>🔍 Analysis Summary:</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.4' }}>
                        {genAiAnalysis.key_findings_summary}
                      </div>
                    </div>
                  )}
                  
                  <div className="recommendations-list" style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    paddingRight: '8px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#00ff88 rgba(255,255,255,0.1)'
                  }}>
                    {genAiAnalysis?.recommendations ? (
                      genAiAnalysis.recommendations.map((rec, index) => (
                        <div key={index} style={{ marginBottom: '12px' }}>
                          <div className="recommendation-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span className="warning-icon">
                              {rec.priority === 'CRITICAL' ? '🚨' : rec.priority === 'HIGH' ? '⚠️' : rec.priority === 'MEDIUM' ? '⚡' : 'ℹ️'}
                            </span>
                            <span style={{ flex: 1, fontSize: '13px' }}>{rec.action}</span>
                            <span style={{ fontSize: '10px', color: '#00ff88', backgroundColor: 'rgba(0,255,136,0.2)', padding: '2px 6px', borderRadius: '10px' }}>GenAI</span>
                          </div>
                          {(rec.reason || rec.urgency) && (
                            <div className="recommendation-details" style={{ marginLeft: '24px', fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                              {rec.reason && <p><strong>Reason:</strong> {rec.reason}</p>}
                              {rec.urgency && <p><strong>Urgency:</strong> {rec.urgency}</p>}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <>
                        <div style={{ marginBottom: '15px' }}>
                          <div className="recommendation-item" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            marginBottom: '10px',
                            fontSize: windowWidth >= 1920 ? spacing.titleFontSize : spacing.fontSize,
                            fontWeight: '600'
                          }}>
                            <span className="warning-icon" style={{ fontSize: '14px' }}>⚠️</span>
                            <span>Dynamic Power Adjustment</span>
                          </div>
                          <div className="recommendation-details" style={{ 
                            paddingLeft: '22px',
                            fontSize: windowWidth >= 1920 ? spacing.fontSize : spacing.smallFontSize,
                            color: 'rgba(255,255,255,0.7)',
                            lineHeight: '1.3'
                        }}>
                          <p style={{ margin: '5px 0' }}><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Step 1:</strong> Initial assessment and configure power ramping rates</p>
                          <p style={{ margin: '5px 0' }}><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Step 2:</strong> Configure adaptive charging rates</p>
                        </div>
                      </div>
                      <div className="more-link" style={{ 
                        fontSize: spacing.smallFontSize,
                        color: '#ff9900',
                        cursor: 'pointer',
                        textAlign: 'right',
                        marginTop: '10px'
                      }}>More.....</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
      <DataNeededModal open={showModal} onClose={() => setShowModal(false)} type="charger" />
      
      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .prediction-toggle:hover {
            transform: scale(1.08);
            box-shadow: 0 1px 6px rgba(0,255,136,0.4);
          }
          
          .recommendation-item:hover {
            background-color: rgba(255,255,255,0.05);
            border-radius: 4px;
            padding: 4px;
            margin: -4px;
            transition: all 0.2s ease;
          }
        `}
      </style>
    </div>
  );
};

export default Charger;