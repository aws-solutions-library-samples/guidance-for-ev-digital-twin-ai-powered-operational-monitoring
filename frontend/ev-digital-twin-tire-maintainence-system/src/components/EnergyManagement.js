import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataNeededModal from "./DataNeededModal";
import "../css/energymanagement.css";

const EnergyManagement = () => {
  const navigate = useNavigate();
  const { carId } = useParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showPrediction, setShowPrediction] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [genAiAnalysis, setGenAiAnalysis] = useState(null);
  const [genAiLoading, setGenAiLoading] = useState(false);
  const [chartData, setChartData] = useState({
    thermalEfficiency: { current: [], expected: [] },
    motorTemperature: { current: [], expected: [] },
    coolantInlet: { current: [], expected: [] },
    coolantOutlet: { current: [], expected: [] },
    coolantFlow: { current: [], expected: [] },
    heaterPower: { current: [], expected: [] },
    ambientTemp: { current: [], expected: [] },
    hvacUsage: { current: [], expected: [] },
    brakingForce: { current: [] },
    energyRecovered: { current: [] },
    frictionBraking: { current: [] },
    brakePedalPosition: { current: [] },
    regenerativeEfficiency: { current: [] }
  });
  const [gaugeAngles, setGaugeAngles] = useState({
    thermalEfficiency: 0,
    motorTemperature: 0,
    coolantInlet: 0,
    coolantOutlet: 0,
    coolantFlow: 0,
    heaterPower: 0,
    ambientTemp: 0,
    hvacUsage: 0
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamic chart data generation for Energy Management
  useEffect(() => {
    const generateEnergyChartData = () => {
      // Simulate realistic energy management data
      const thermalEfficiency = 60 + Math.sin(Date.now() * 0.0005) * 10 + Math.random() * 5;
      const motorTemp = 60 + Math.sin(Date.now() * 0.0003) * 15 + Math.random() * 3;
      const coolantInletTemp = 30 + Math.sin(Date.now() * 0.0002) * 5 + Math.random() * 2;
      const coolantOutletTemp = 35 + Math.sin(Date.now() * 0.0002) * 5 + Math.random() * 2;
      const coolantFlow = 5 + Math.sin(Date.now() * 0.0004) * 1 + Math.random() * 0.5;
      const heaterPower = 2 + Math.sin(Date.now() * 0.0006) * 0.8 + Math.random() * 0.3;
      const ambientTemp = 25 + Math.sin(Date.now() * 0.0001) * 8 + Math.random() * 2;
      const hvacUsage = 65 + Math.sin(Date.now() * 0.0007) * 15 + Math.random() * 5;
      
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
        thermalEfficiency: {
          current: generateWaveform(thermalEfficiency, 4, 1.2, 0),
          expected: generateExpectedWaveform(thermalEfficiency, 2, 0.8, 0.5)
        },
        motorTemperature: {
          current: generateWaveform(motorTemp, 5, 1.0, 1.0),
          expected: generateExpectedWaveform(motorTemp, 3, 0.6, 1.2)
        },
        coolantInlet: {
          current: generateWaveform(coolantInletTemp, 3, 1.5, 2.0),
          expected: generateExpectedWaveform(coolantInletTemp, 2, 0.9, 2.5)
        },
        coolantOutlet: {
          current: generateWaveform(coolantOutletTemp, 3, 1.1, 3.0),
          expected: generateExpectedWaveform(coolantOutletTemp, 2, 0.7, 3.5)
        },
        coolantFlow: {
          current: generateWaveform(coolantFlow, 2, 1.3, 4.0),
          expected: generateExpectedWaveform(coolantFlow, 1, 0.8, 4.5)
        },
        heaterPower: {
          current: generateWaveform(heaterPower, 3, 1.4, 5.0),
          expected: generateExpectedWaveform(heaterPower, 2, 0.9, 5.5)
        },
        ambientTemp: {
          current: generateWaveform(ambientTemp, 4, 0.8, 6.0),
          expected: generateExpectedWaveform(ambientTemp, 2, 0.5, 6.5)
        },
        hvacUsage: {
          current: generateWaveform(hvacUsage, 6, 1.6, 7.0),
          expected: generateExpectedWaveform(hvacUsage, 3, 1.0, 7.5)
        }
      };
      
      // Generate regenerative braking data
      const brakingForce = 200 + Math.sin(Date.now() * 0.0008) * 50 + Math.random() * 20;
      const energyRecovered = 0.05 + Math.sin(Date.now() * 0.0006) * 0.02 + Math.random() * 0.01;
      const frictionBraking = 20 + Math.sin(Date.now() * 0.0004) * 10 + Math.random() * 5;
      const brakePedalPosition = 40 + Math.sin(Date.now() * 0.0009) * 15 + Math.random() * 8;
      const regenerativeEfficiency = 40 + Math.sin(Date.now() * 0.0007) * 12 + Math.random() * 6;
      
      // Generate regenerative chart data (longer charts for better visualization)
      const generateRegenerativeChart = (baseValue, amplitude = 10, frequency = 1, phase = 0) => {
        const points = [];
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < 30; i++) { // More points for regenerative charts
          const x = (i / 29) * 250; // Scale to wider chart width
          const variation = Math.sin((time + phase) * frequency + (i * 0.2)) * amplitude;
          const noise = (Math.random() - 0.5) * 3;
          const y = 17 + variation + noise; // Center around y=17 for regenerative charts
          points.push({ x, y: Math.max(10, Math.min(24, y)) }); // Clamp to chart bounds
        }
        return points;
      };
      
      // Add regenerative data to chart data
      newChartData.brakingForce = {
        current: generateRegenerativeChart(brakingForce, 8, 1.1, 0)
      };
      newChartData.energyRecovered = {
        current: generateRegenerativeChart(energyRecovered * 1000, 6, 0.9, 1.5) // Scale for visibility
      };
      newChartData.frictionBraking = {
        current: generateRegenerativeChart(frictionBraking, 5, 1.3, 2.0)
      };
      newChartData.brakePedalPosition = {
        current: generateRegenerativeChart(brakePedalPosition, 7, 1.2, 3.0)
      };
      newChartData.regenerativeEfficiency = {
        current: generateRegenerativeChart(regenerativeEfficiency, 6, 1.0, 4.0)
      };
      
      setChartData(newChartData);
      
      // Calculate gauge angles
      const calculateGaugeAngle = (value, min, max) => {
        const percentage = Math.max(0, Math.min(1, (value - min) / (max - min)));
        return percentage * 180;
      };
      
      const newGaugeAngles = {
        thermalEfficiency: calculateGaugeAngle(thermalEfficiency, 0, 100),
        motorTemperature: calculateGaugeAngle(motorTemp, 20, 100),
        coolantInlet: calculateGaugeAngle(coolantInletTemp, 10, 50),
        coolantOutlet: calculateGaugeAngle(coolantOutletTemp, 15, 55),
        coolantFlow: calculateGaugeAngle(coolantFlow, 0, 10),
        heaterPower: calculateGaugeAngle(heaterPower, 0, 5),
        ambientTemp: calculateGaugeAngle(ambientTemp, 0, 50),
        hvacUsage: calculateGaugeAngle(hvacUsage, 0, 100)
      };
      
      setGaugeAngles(newGaugeAngles);
      
      console.log('🔋 Energy Management Charts Updated:', {
        thermalEfficiency: thermalEfficiency.toFixed(1) + '%',
        motorTemp: motorTemp.toFixed(1) + '°C',
        coolantFlow: coolantFlow.toFixed(1) + ' L/min',
        heaterPower: heaterPower.toFixed(1) + ' kW',
        brakingForce: brakingForce.toFixed(0) + ' Nm',
        energyRecovered: energyRecovered.toFixed(3) + ' kWh'
      });
    };
    
    // Generate initial data and update every 2 seconds
    generateEnergyChartData();
    const chartInterval = setInterval(generateEnergyChartData, 2000);
    
    return () => clearInterval(chartInterval);
  }, []);

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

  // GenAI Analysis for Energy Management
  const analyzeEnergyManagementWithGenAI = async () => {
    console.log('Starting Energy Management GenAI analysis...');
    setGenAiLoading(true);
    
    // Simulate energy management data for analysis
    const energyData = {
      thermalEfficiency: 60 + Math.sin(Date.now() * 0.0005) * 10,
      motorTemperature: 60 + Math.sin(Date.now() * 0.0003) * 15,
      coolantFlow: 5 + Math.sin(Date.now() * 0.0004) * 1,
      hvacUsage: 65 + Math.sin(Date.now() * 0.0007) * 15,
      regenerativeEfficiency: 40 + Math.sin(Date.now() * 0.0007) * 12,
      energyRecovered: 0.05 + Math.sin(Date.now() * 0.0006) * 0.02
    };
    
    try {
      // Simulate GenAI analysis with realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create realistic energy management analysis
      const analysis = {
        overall_status: energyData.thermalEfficiency > 70 ? 'GOOD' : energyData.thermalEfficiency > 50 ? 'WARNING' : 'CRITICAL',
        risk_level: energyData.motorTemperature > 80 ? 'HIGH' : energyData.motorTemperature > 65 ? 'MEDIUM' : 'LOW',
        key_findings_summary: `Energy management system analysis shows thermal efficiency at ${energyData.thermalEfficiency.toFixed(1)}% with motor temperature at ${energyData.motorTemperature.toFixed(1)}°C. HVAC usage is currently ${energyData.hvacUsage.toFixed(1)}% with regenerative braking recovering ${energyData.energyRecovered.toFixed(3)} kWh per event.`,
        recommendations: [
          {
            action: 'Optimize thermal management system for improved efficiency',
            priority: energyData.thermalEfficiency < 60 ? 'HIGH' : 'MEDIUM',
            reason: 'Current thermal efficiency could be improved through better heat management',
            urgency: energyData.thermalEfficiency < 50 ? 'Within 24 hours' : 'Within 1 week'
          },
          {
            action: 'Monitor coolant system performance and flow rates',
            priority: energyData.coolantFlow < 4 ? 'HIGH' : 'MEDIUM',
            reason: 'Coolant flow rate affects overall thermal management efficiency',
            urgency: 'Next maintenance cycle'
          },
          {
            action: 'Adjust HVAC settings for optimal energy consumption',
            priority: energyData.hvacUsage > 70 ? 'MEDIUM' : 'LOW',
            reason: 'High HVAC usage impacts overall vehicle energy efficiency',
            urgency: 'When convenient'
          },
          {
            action: 'Enhance regenerative braking calibration',
            priority: energyData.regenerativeEfficiency < 35 ? 'HIGH' : 'MEDIUM',
            reason: 'Regenerative braking efficiency can be optimized for better energy recovery',
            urgency: 'Next service appointment'
          }
        ],
        next_inspection: "45 days",
        source: "Energy Management GenAI Analysis"
      };
      
      setGenAiAnalysis(analysis);
      console.log('Energy Management GenAI analysis completed:', analysis);
      
    } catch (error) {
      console.error('Energy Management GenAI analysis failed:', error);
      
      // Fallback analysis
      const fallbackAnalysis = {
        error: true,
        error_message: 'GenAI service temporarily unavailable. Using intelligent energy management fallback analysis.',
        overall_status: 'GOOD',
        risk_level: 'LOW',
        key_findings_summary: 'Energy management system operating within normal parameters with routine optimization opportunities identified.',
        recommendations: [
          {
            action: 'Continue regular energy management system monitoring',
            priority: 'LOW',
            reason: 'Preventive maintenance for optimal energy efficiency',
            urgency: 'Next scheduled maintenance'
          }
        ],
        next_inspection: "45 days",
        source: "Energy Management Rule-Based Analysis",
        fallback: true
      };
      
      setGenAiAnalysis(fallbackAnalysis);
    } finally {
      setGenAiLoading(false);
    }
  };

  // Responsive sizing functions
  const spacing = useMemo(() => {
    const width = windowWidth;
    const height = window.innerHeight;
    
    return {
      fontSize: width < 1200 ? '12px' : width < 1400 ? '14px' : '16px',
      smallFontSize: width < 1200 ? '8px' : width < 1400 ? '9px' : '10px',
      titleFontSize: width < 1200 ? '14px' : width < 1400 ? '16px' : '18px',
      gaugeSize: width < 1200 ? 80 : width < 1400 ? 90 : 100,
      chartHeight: height < 800 ? 200 : height < 900 ? 220 : 240,
      containerPadding: width < 1200 ? '10px' : '15px',
      margin: width < 1200 ? '10px' : '15px',
      thermalContainerHeight: `${Math.max(450, Math.min(600, height * 0.6))}px`,
      regenerativeContainerHeight: `${Math.max(200, Math.min(300, height * 0.25))}px`
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

  // Generate dynamic failure prediction data for Energy Management
  const generateEnergyFailurePredictionData = () => {
    // Fixed pattern for Energy Management system - gradual decline
    const pattern = { baseHealth: 75, trend: 'declining', severity: 'moderate' };
    
    // Generate stable historical data points
    const historicalPoints = [];
    const baseHealthStart = pattern.baseHealth + 20; // Start at 95%
    
    for (let i = 0; i < 7; i++) {
      const x = 35 + (i * 15);
      let health;
      
      // Gradual decline pattern for energy management
      const decline = (35 * i / 6) + (pattern.severity === 'high' ? 8 : 5);
      health = baseHealthStart - decline;
      
      const y = 155 - (health * 1.3);
      historicalPoints.push({ x, y, health: Math.max(20, health) });
    }
    
    // Generate stable predicted data points
    const predictedPoints = [];
    const currentHealth = historicalPoints[6].health;
    
    // Energy management specific degradation rate
    const degradationRate = currentHealth < 50 ? 2.5 : currentHealth < 70 ? 1.5 : 0.8;
    
    let futureHealth = currentHealth;
    for (let i = 1; i <= 6; i++) {
      const x = 125 + (i * 15);
      futureHealth = Math.max(20, futureHealth - degradationRate);
      const y = 155 - (futureHealth * 1.3);
      predictedPoints.push({ x, y, health: futureHealth });
    }
    
    return {
      historical: historicalPoints,
      predicted: predictedPoints,
      currentHealth,
      degradationRate,
      vehiclePattern: pattern
    };
  };

  // Get dynamic graph data
  const energyGraphData = generateEnergyFailurePredictionData();

  // Calculate remaining useful life for energy management
  const calculateEnergyRemainingLife = () => {
    const health = energyGraphData.currentHealth;
    
    // Fixed remaining life for Energy Management - moderate decline
    let baseRemainingLife = 72;
    
    // Adjustments based on current conditions
    let adjustment = 0;
    if (health < 50) adjustment -= 15;
    else if (health < 70) adjustment -= 8;
    
    const finalRemainingLife = Math.max(25, Math.min(95, baseRemainingLife + adjustment));
    return Math.round(finalRemainingLife);
  };

  const energyRemainingLife = calculateEnergyRemainingLife();

  return (
    <div className="energymanagement-page">
      <div className="energymanagement-container" style={{ 
        zoom: windowWidth <= 1024 ? windowWidth / 1440 : (windowWidth >= 1820 && windowWidth <= 2400 ? windowWidth / 2560 : (windowWidth >= 2685 ? Math.min(windowWidth / 1920, 1.4) : undefined)),
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
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
        <div className="nav-header" style={{ margin: '20px 20px 20px', borderBottom: 'none' }}>
          <button 
            className="back-button"
            onClick={() => navigate(`/car/${carId}`)}
          >
            <span>←</span>
            <span>Energy Management</span>
          </button>
          <span className="vin-number" style={{ transform: `translateX(-${window.innerWidth >= 1920 ? '500' : window.innerWidth >= 1400 ? '400' : '300'}px)` }}>VIN Number</span>
        </div>

        <div style={{ margin: '10px 20px 5px' }}>
          <div className="energymanagement-layout">
          {/* Main Panel */}
          <div className="main-panel" style={{ marginTop: '50px' }}>
            {/* Top Container: Thermal Values */}
            <div className="data-container" style={{ height: spacing.thermalContainerHeight, maxHeight: windowWidth <= 1440 ? '370px' : windowWidth <= 1700 ? '400px' : windowWidth <= 1815 ? '450px' : 'none', marginBottom: "20px" }}>
              <h3>Thermal Values</h3>
              {/* Top Row - 4 items */}
              <div className="thermal-metrics-grid" style={{ transform: windowWidth <= 1440 ? 'scale(0.85)' : 'scale(1)', transformOrigin: 'top center' }}>
                <div className="thermal-gauge">
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
                        d={createGaugeArc(gaugeAngles.thermalEfficiency)}
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
                      {Math.round(60 + Math.sin(Date.now() * 0.0005) * 10)}%
                    </div>
                    <div className="gauge-label">Thermal Efficiency Score</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path
                      d={generateSVGPath(chartData.thermalEfficiency.current)}
                      fill="none"
                      stroke="#37bc12"
                      strokeWidth="1.5"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(55, 188, 18, 0.3))'
                      }}
                    />
                    <path
                      d={generateSVGPath(chartData.thermalEfficiency.expected)}
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
                <div className="thermal-gauge">
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
                        d={createGaugeArc(gaugeAngles.motorTemperature)}
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
                      {Math.round(60 + Math.sin(Date.now() * 0.0003) * 15)}°C
                    </div>
                    <div className="gauge-label">Motor/Inverter Temperature</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path
                      d={generateSVGPath(chartData.motorTemperature.current)}
                      fill="none"
                      stroke="#ff6b35"
                      strokeWidth="1.5"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(255, 107, 53, 0.3))'
                      }}
                    />
                    <path
                      d={generateSVGPath(chartData.motorTemperature.expected)}
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
                <div className="thermal-gauge">
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
                        d={createGaugeArc(gaugeAngles.coolantInlet)}
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
                      {Math.round(30 + Math.sin(Date.now() * 0.0002) * 5)}°C
                    </div>
                    <div className="gauge-label">Coolant Inlet Temperatures</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path
                      d={generateSVGPath(chartData.coolantInlet.current)}
                      fill="none"
                      stroke="#0088ff"
                      strokeWidth="1.5"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(0, 136, 255, 0.3))'
                      }}
                    />
                    <path
                      d={generateSVGPath(chartData.coolantInlet.expected)}
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
                <div className="thermal-gauge">
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
                        d={createGaugeArc(gaugeAngles.coolantOutlet)}
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
                      {Math.round(35 + Math.sin(Date.now() * 0.0002) * 5)}°C
                    </div>
                    <div className="gauge-label">Coolant Outlet Temperatures</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path
                      d={generateSVGPath(chartData.coolantOutlet.current)}
                      fill="none"
                      stroke="#9b59b6"
                      strokeWidth="1.5"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(155, 89, 182, 0.3))'
                      }}
                    />
                    <path
                      d={generateSVGPath(chartData.coolantOutlet.expected)}
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
              </div>
              
              {/* Bottom Row - 4 items */}
              <div className="thermal-metrics-grid-bottom" style={{ transform: windowWidth <= 1440 ? 'scale(0.85)' : 'scale(1)', transformOrigin: 'top center' }}>
                <div className="thermal-gauge">
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
                        d={createGaugeArc(gaugeAngles.coolantFlow)}
                        fill="none"
                        stroke="#1abc9c"
                        strokeWidth="3"
                        strokeLinecap="round"
                        style={{ 
                          transition: 'all 0.5s ease-in-out',
                          filter: 'drop-shadow(0 0 3px rgba(26, 188, 156, 0.5))'
                        }}
                      />
                      <circle cx="45" cy="45" r="2" fill="#1abc9c" />
                    </svg>
                    <div className="gauge-value" style={{ fontWeight: 'bold', color: '#1abc9c' }}>
                      {(5 + Math.sin(Date.now() * 0.0004) * 1).toFixed(1)} L/min
                    </div>
                    <div className="gauge-label">Coolant Flow Rate</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path
                      d={generateSVGPath(chartData.coolantFlow.current)}
                      fill="none"
                      stroke="#1abc9c"
                      strokeWidth="1.5"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(26, 188, 156, 0.3))'
                      }}
                    />
                    <path
                      d={generateSVGPath(chartData.coolantFlow.expected)}
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
                <div className="thermal-gauge">
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
                        d={createGaugeArc(gaugeAngles.heaterPower)}
                        fill="none"
                        stroke="#e74c3c"
                        strokeWidth="3"
                        strokeLinecap="round"
                        style={{ 
                          transition: 'all 0.5s ease-in-out',
                          filter: 'drop-shadow(0 0 3px rgba(231, 76, 60, 0.5))'
                        }}
                      />
                      <circle cx="45" cy="45" r="2" fill="#e74c3c" />
                    </svg>
                    <div className="gauge-value" style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                      {(2 + Math.sin(Date.now() * 0.0006) * 0.8).toFixed(1)} kW
                    </div>
                    <div className="gauge-label">Heater/Cooler Power Consumption</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path
                      d={generateSVGPath(chartData.heaterPower.current)}
                      fill="none"
                      stroke="#e74c3c"
                      strokeWidth="1.5"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(231, 76, 60, 0.3))'
                      }}
                    />
                    <path
                      d={generateSVGPath(chartData.heaterPower.expected)}
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
                <div className="thermal-gauge">
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
                        d={createGaugeArc(gaugeAngles.ambientTemp)}
                        fill="none"
                        stroke="#f39c12"
                        strokeWidth="3"
                        strokeLinecap="round"
                        style={{ 
                          transition: 'all 0.5s ease-in-out',
                          filter: 'drop-shadow(0 0 3px rgba(243, 156, 18, 0.5))'
                        }}
                      />
                      <circle cx="45" cy="45" r="2" fill="#f39c12" />
                    </svg>
                    <div className="gauge-value" style={{ fontWeight: 'bold', color: '#f39c12' }}>
                      {Math.round(25 + Math.sin(Date.now() * 0.0001) * 8)}°C
                    </div>
                    <div className="gauge-label">Ambient Temperature</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path
                      d={generateSVGPath(chartData.ambientTemp.current)}
                      fill="none"
                      stroke="#f39c12"
                      strokeWidth="1.5"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(243, 156, 18, 0.3))'
                      }}
                    />
                    <path
                      d={generateSVGPath(chartData.ambientTemp.expected)}
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
                <div className="thermal-gauge">
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
                        d={createGaugeArc(gaugeAngles.hvacUsage)}
                        fill="none"
                        stroke="#8e44ad"
                        strokeWidth="3"
                        strokeLinecap="round"
                        style={{ 
                          transition: 'all 0.5s ease-in-out',
                          filter: 'drop-shadow(0 0 3px rgba(142, 68, 173, 0.5))'
                        }}
                      />
                      <circle cx="45" cy="45" r="2" fill="#8e44ad" />
                    </svg>
                    <div className="gauge-value" style={{ fontWeight: 'bold', color: '#8e44ad' }}>
                      {Math.round(65 + Math.sin(Date.now() * 0.0007) * 15)}%
                    </div>
                    <div className="gauge-label">HVAC System Usage</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path
                      d={generateSVGPath(chartData.hvacUsage.current)}
                      fill="none"
                      stroke="#8e44ad"
                      strokeWidth="1.5"
                      style={{ 
                        transition: 'all 0.3s ease-in-out',
                        filter: 'drop-shadow(0 0 2px rgba(142, 68, 173, 0.3))'
                      }}
                    />
                    <path
                      d={generateSVGPath(chartData.hvacUsage.expected)}
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
              </div>
            </div>

            {/* Bottom Container: Regenerative Data */}
            <div className="data-container" style={{ 
              height: spacing.regenerativeContainerHeight, 
              marginBottom: windowWidth <= 1440 ? '-30px' : windowWidth <= 1700 ? '-20px' : windowWidth <= 1815 ? '0px' : '20px', 
              maxHeight: windowWidth <= 1440 ? '160px' : windowWidth <= 1700 ? '180px' : windowWidth <= 1815 ? '200px' : 'none', 
              overflow: windowWidth <= 1440 ? 'hidden' : windowWidth <= 1700 ? 'hidden' : windowWidth <= 1815 ? 'hidden' : 'visible'
            }}>
              <h3>Regenerative Data</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="regenerative-metrics-grid">
                  <div className="regenerative-gauge">
                    <div className="gauge-value" style={{ fontSize: '22px', color: '#37bc12', fontWeight: 'bold' }}>
                      {Math.round(200 + Math.sin(Date.now() * 0.0008) * 50)} Nm
                    </div>
                    <div className="gauge-label" style={{ fontSize: '8px' }}>Braking Force</div>
                    <svg width="140px" height="95px" viewBox="0 0 140 95">
                      {Array.from({ length: 9 }, (_, i) => (
                        <line key={i} x1="0" y1={10 + i * 9} x2="140" y2={10 + i * 9} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      ))}
                      <path 
                        d={generateSVGPath(chartData.brakingForce.current?.map(point => ({
                          x: point.x * 140 / 250, // Scale to fit 140px width
                          y: point.y + 30 // Offset for chart positioning
                        })) || [])}
                        fill="none" 
                        stroke="#37bc12" 
                        strokeWidth="2"
                        style={{ 
                          transition: 'all 0.3s ease-in-out',
                          filter: 'drop-shadow(0 0 3px rgba(55, 188, 18, 0.4))'
                        }}
                      />
                    </svg>
                  </div>
                  <div className="regenerative-gauge">
                    <div className="gauge-value" style={{ fontSize: '22px', color: '#1abc9c', fontWeight: 'bold' }}>
                      {(0.05 + Math.sin(Date.now() * 0.0006) * 0.02).toFixed(3)} kWh
                    </div>
                    <div className="gauge-label" style={{ fontSize: '8px' }}>Energy Recovered/Braking Event</div>
                    <svg width="140px" height="95px" viewBox="0 0 140 95">
                      {Array.from({ length: 9 }, (_, i) => (
                        <line key={i} x1="0" y1={10 + i * 9} x2="140" y2={10 + i * 9} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      ))}
                      <path 
                        d={generateSVGPath(chartData.energyRecovered.current?.map(point => ({
                          x: point.x * 140 / 250, // Scale to fit 140px width
                          y: point.y + 30 // Offset for chart positioning
                        })) || [])}
                        fill="none" 
                        stroke="#1abc9c" 
                        strokeWidth="2"
                        style={{ 
                          transition: 'all 0.3s ease-in-out',
                          filter: 'drop-shadow(0 0 3px rgba(26, 188, 156, 0.4))'
                        }}
                      />
                    </svg>
                  </div>
                </div>
                
                <div className="regenerative-stacked-section">
                  <div className="stacked-bar-item">
                    <svg width="250px" height="35px" viewBox="0 0 250 35">
                      <line x1="0" y1="10" x2="250" y2="10" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <line x1="0" y1="17" x2="250" y2="17" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <line x1="0" y1="24" x2="250" y2="24" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <path 
                        d={generateSVGPath(chartData.frictionBraking.current || [])}
                        fill="none" 
                        stroke="#e74c3c" 
                        strokeWidth="2"
                        style={{ 
                          transition: 'all 0.3s ease-in-out',
                          filter: 'drop-shadow(0 0 2px rgba(231, 76, 60, 0.4))'
                        }}
                      />
                    </svg>
                    <div className="stacked-bar-label" style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                      {Math.round(20 + Math.sin(Date.now() * 0.0004) * 10)}%
                    </div>
                  </div>
                  <div style={{ fontSize: '8px', color: 'white', textAlign: 'right', marginTop: '-10px', marginRight: '10px' }}>Friction Braking Usage</div>
                  
                  <div className="stacked-bar-item">
                    <svg width="250px" height="35px" viewBox="0 0 250 35">
                      <line x1="0" y1="10" x2="250" y2="10" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <line x1="0" y1="17" x2="250" y2="17" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <line x1="0" y1="24" x2="250" y2="24" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <path 
                        d={generateSVGPath(chartData.brakePedalPosition.current || [])}
                        fill="none" 
                        stroke="#f39c12" 
                        strokeWidth="2"
                        style={{ 
                          transition: 'all 0.3s ease-in-out',
                          filter: 'drop-shadow(0 0 2px rgba(243, 156, 18, 0.4))'
                        }}
                      />
                    </svg>
                    <div className="stacked-bar-label" style={{ color: '#f39c12', fontWeight: 'bold' }}>
                      {Math.round(40 + Math.sin(Date.now() * 0.0009) * 15)}%
                    </div>
                  </div>
                  <div style={{ fontSize: '8px', color: 'white', textAlign: 'right', marginTop: '-10px', marginRight: '10px' }}>Brake Pedal Position</div>
                  
                  <div className="stacked-bar-item">
                    <svg width="250px" height="35px" viewBox="0 0 250 35">
                      <line x1="0" y1="10" x2="250" y2="10" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <line x1="0" y1="17" x2="250" y2="17" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <line x1="0" y1="24" x2="250" y2="24" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <path 
                        d={generateSVGPath(chartData.regenerativeEfficiency.current || [])}
                        fill="none" 
                        stroke="#9b59b6" 
                        strokeWidth="2"
                        style={{ 
                          transition: 'all 0.3s ease-in-out',
                          filter: 'drop-shadow(0 0 2px rgba(155, 89, 182, 0.4))'
                        }}
                      />
                    </svg>
                    <div className="stacked-bar-label" style={{ color: '#9b59b6', fontWeight: 'bold' }}>
                      {Math.round(40 + Math.sin(Date.now() * 0.0007) * 12)}%
                    </div>
                  </div>
                  <div style={{ fontSize: '8px', color: 'white', textAlign: 'right', marginTop: '-10px', marginRight: '10px' }}>Regenerative Efficiency</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="right-panel">
            <div className="battery-prediction">
              <div className="prediction-header">
                <h2 style={{ fontSize: windowWidth <= 1440 ? '16px' : windowWidth <= 1700 ? '18px' : windowWidth <= 1815 ? '22px' : '24px', marginTop: windowWidth <= 1440 ? '-15px' : windowWidth <= 1700 ? '-10px' : windowWidth <= 1815 ? '-5px' : '0' }}>Energy Management Prediction</h2>
                <img src={require('./assets/warning.png')} alt="Warning" className="info-icon" style={{ width: '20px', height: '20px', cursor: 'pointer', zIndex: 99999, position: 'relative', marginTop: windowWidth <= 1440 ? '-15px' : windowWidth <= 1700 ? '-10px' : windowWidth <= 1815 ? '-5px' : '0' }} onClick={() => setShowModal(true)} />
              </div>

              {/* Energy Management Prediction Container */}
              <div className="motor-prediction-container" style={{ paddingLeft: windowWidth <= 1440 ? '15px' : windowWidth <= 1700 ? '20px' : windowWidth <= 1815 ? '25px' : '30px' }}>
                <div className="failure-prediction" style={{ marginTop: windowWidth <= 1440 ? '-15px' : windowWidth <= 1700 ? '-10px' : windowWidth <= 1815 ? '-5px' : '0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: windowWidth <= 1440 ? '12px' : windowWidth <= 1700 ? '14px' : windowWidth <= 1815 ? '17px' : '20px', marginTop: windowWidth <= 1700 ? '-25px' : '-15px' }}>Energy Management Failure Prediction</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: windowWidth <= 1700 ? '5px' : '10px', position: 'relative', zIndex: 100 }}>
                      <span style={{ fontSize: windowWidth <= 1440 ? '10px' : '11px', color: 'rgba(255,255,255,0.7)' }}>
                        Show Prediction
                      </span>
                      <button
                        onClick={() => {
                          console.log('Energy Management Toggle button clicked! Current state:', showPrediction);
                          setShowPrediction(!showPrediction);
                        }}
                        style={{
                          background: showPrediction ? '#37bc12' : 'rgba(255,255,255,0.2)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          borderRadius: '12px',
                          width: '40px',
                          height: '20px',
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: 1000,
                          transition: 'all 0.3s ease',
                          outline: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: showPrediction ? 'flex-end' : 'flex-start',
                          paddingLeft: showPrediction ? '0' : '2px',
                          paddingRight: showPrediction ? '2px' : '0',
                          pointerEvents: 'auto'
                        }}
                      >
                        <div style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}></div>
                      </button>
                    </div>
                  </div>
                  <div className="prediction-legend" style={{ marginTop: windowWidth <= 1700 ? '5px' : '10px', fontSize: windowWidth <= 1700 ? '11px' : '12px' }}>
                    <div className="legend-item" style={{ fontSize: windowWidth <= 1700 ? '11px' : '12px' }}>
                      <div style={{ width: '15px', height: '2px', backgroundColor: 'rgba(255,153,0,1)' }}></div>
                      <span>Past</span>
                    </div>
                    <div className="legend-item" style={{ fontSize: windowWidth <= 1700 ? '11px' : '12px' }}>
                      <div style={{ width: '15px', height: '2px', borderTop: '2px dashed rgba(56,239,125,1)', backgroundColor: 'transparent' }}></div>
                      <span>Predicted</span>
                    </div>
                  </div>
                  <div style={{ position: 'relative', marginTop: '100px' }}>
                    <div className="prediction-chart" style={{ marginTop: windowWidth <= 1440 ? '-180px' : windowWidth <= 1700 ? '-160px' : windowWidth <= 1815 ? '-80px' : windowWidth > 1815 && windowWidth <= 1950 ? '-60px' : windowWidth >= 2560 ? '-100px' : '-60px' }}>
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
                      
                      {/* Dynamic Past data (orange) - Based on energy management health */}
                      <polyline
                        points={energyGraphData.historical.map(point => `${point.x},${point.y}`).join(' ')}
                        fill="none"
                        stroke="rgba(255,153,0,1)"
                        strokeWidth="2"
                      />
                      
                      {/* Dynamic Predicted data (green/orange based on trend) - Animated based on toggle */}
                      {showPrediction && (
                        <polyline
                          points={`125,${energyGraphData.historical[6].y} ${energyGraphData.predicted.map(point => `${point.x},${point.y}`).join(' ')}`}
                          fill="none"
                          stroke={energyGraphData.degradationRate > 2.0 ? "rgba(255,153,0,1)" : "rgba(56,239,125,1)"}
                          strokeWidth="2"
                          strokeDasharray="4,4"
                          opacity={animationProgress}
                        />
                      )}
                      
                      {/* Dynamic Data points - Historical */}
                      {energyGraphData.historical.slice(0, 6).map((point, index) => (
                        <circle key={`hist-${index}`} cx={point.x} cy={point.y} r="1.5" fill="rgba(255,153,0,1)"/>
                      ))}
                      
                      {/* Current point - Highlighted with dynamic position */}
                      <circle cx="125" cy={energyGraphData.historical[6].y} r="2.5" fill="rgba(255,153,0,1)" stroke="white" strokeWidth="1.5"/>
                      
                      {/* Dynamic Data points - Predicted (appear progressively) */}
                      {energyGraphData.predicted.map((point, index) => {
                        const threshold = 0.15 + (index * 0.15);
                        return showPrediction && animationProgress > threshold && (
                          <circle 
                            key={`pred-${index}`} 
                            cx={point.x} 
                            cy={point.y} 
                            r="1.5" 
                            fill={point.health < 40 ? "rgba(255,68,68,1)" : point.health < 60 ? "rgba(255,153,0,1)" : "rgba(56,239,125,1)"}
                            opacity={Math.min(1, (animationProgress - threshold) * 5)}
                          />
                        );
                      })}
                      
                      {/* Dynamic Annotations */}
                      <text x="125" y={energyGraphData.historical[6].y - 7} fill="rgba(255,255,255,0.9)" fontSize="7" textAnchor="middle" fontWeight="bold">NOW</text>
                      <text x="125" y={energyGraphData.historical[6].y + 15} fill="rgba(255,255,255,0.7)" fontSize="6" textAnchor="middle">{Math.round(energyGraphData.currentHealth)}%</text>
                      
                      {/* Dynamic status annotation - Animated */}
                      {showPrediction && animationProgress > 0.5 && (
                        <text 
                          x="185" 
                          y={energyGraphData.predicted[3]?.y - 5 || 70} 
                          fill={energyGraphData.degradationRate > 2.0 ? "rgba(255,153,0,0.9)" : "rgba(56,239,125,0.9)"} 
                          fontSize="6" 
                          textAnchor="middle"
                          opacity={Math.min(1, (animationProgress - 0.5) * 2)}
                        >
                          {energyGraphData.degradationRate > 2.0 ? "Declining" : "Stable"}
                        </text>
                      )}
                      
                      {/* End point status - Animated */}
                      {showPrediction && animationProgress > 0.8 && (
                        <text 
                          x="215" 
                          y={energyGraphData.predicted[5]?.y + 12 || 85} 
                          fill={energyGraphData.predicted[5]?.health < 40 ? "rgba(255,68,68,0.9)" : energyGraphData.predicted[5]?.health < 60 ? "rgba(255,153,0,0.9)" : "rgba(56,239,125,0.9)"} 
                          fontSize="6" 
                          textAnchor="middle"
                          opacity={Math.min(1, (animationProgress - 0.8) * 5)}
                        >
                          {energyGraphData.predicted[5]?.health < 40 ? "Critical" : energyGraphData.predicted[5]?.health < 60 ? "Warning" : "Good"}
                        </text>
                      )}
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Remaining Useful Life */}
                <div className="useful-life" style={{ marginBottom: '20px', marginTop: windowWidth <= 1440 ? '-110px' : windowWidth <= 1700 ? '-90px' : windowWidth <= 1815 ? '-40px' : windowWidth >= 2560 ? '80px' : '0px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: spacing.smallFontSize, color: 'white' }}>Remaining useful life</span>
                    <span style={{ fontSize: spacing.fontSize, color: 'white', fontWeight: 'bold' }}>{energyRemainingLife}%</span>
                  </div>
                  <div className="life-bar" style={{ borderRadius: '0' }}>
                    <div className="life-fill" style={{ 
                      width: `${energyRemainingLife}%`, 
                      borderRadius: '0',
                      background: energyRemainingLife < 30 ? '#ff4444' : 
                                 energyRemainingLife < 60 ? '#ff9900' : 
                                 'linear-gradient(90deg, #ff9900 0%, #37bc12 100%)'
                    }}></div>
                  </div>
                </div>

                {/* GenAI Recommendations */}
                <div className="genai-recommendations" style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: spacing.titleFontSize, margin: 0 }}>GenAI Recommendations</h3>
                    <button
                      onClick={analyzeEnergyManagementWithGenAI}
                      disabled={genAiLoading}
                      style={{
                        background: genAiLoading ? '#666' : '#00ff88',
                        color: genAiLoading ? '#ccc' : '#000',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: genAiLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {genAiLoading ? (
                        <>
                          <div style={{ width: '10px', height: '10px', border: '2px solid #999', borderTop: '2px solid #ccc', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          🤖 Analyze
                        </>
                      )}
                    </button>
                    {genAiAnalysis && !genAiLoading && (
                      <div style={{ fontSize: '11px', color: genAiAnalysis.error ? '#ff6b6b' : '#00ff88', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{genAiAnalysis.error ? '🛡️' : '🤖'}</span> 
                        {genAiAnalysis.error ? 'Enhanced Fallback' : 'GenAI Analysis'}
                      </div>
                    )}
                  </div>
                  
                  <p style={{ 
                    fontSize: '12px', 
                    marginBottom: '12px',
                    color: 'rgba(255,255,255,0.8)'
                  }}>
                    {genAiAnalysis ? 
                      (genAiAnalysis.error ? 
                        genAiAnalysis.error_message :
                        `Real-time energy management analysis. Status: ${genAiAnalysis.overall_status} | Risk: ${genAiAnalysis.risk_level}`
                      ) :
                      'AI-powered energy optimization. Analyzing thermal management, regenerative braking, and HVAC efficiency...'
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
                    {genAiAnalysis?.recommendations?.map((rec, index) => (
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
                    ))}
                    
                    {(!genAiAnalysis?.recommendations || genAiAnalysis.recommendations.length === 0) && (
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
                            <span>Dynamic Energy Distribution</span>
                          </div>
                          <div className="recommendation-details" style={{ 
                            paddingLeft: '22px',
                            fontSize: windowWidth >= 1920 ? spacing.fontSize : spacing.smallFontSize,
                            color: 'rgba(255,255,255,0.7)',
                            lineHeight: '1.3'
                        }}>
                          <p style={{ margin: '5px 0' }}><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Step 1:</strong> Set up dynamic load balancing and configure power distribution algorithms</p>
                          <p style={{ margin: '5px 0' }}><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Step 2:</strong> Track energy efficiency metrics and evaluate system response time</p>
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
      <DataNeededModal open={showModal} onClose={() => setShowModal(false)} type="energy" />
    </div>
  );
};

export default EnergyManagement;