import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './BatteryPack.css';

const BatteryScreen = () => {
  const navigate = useNavigate();
  const { carId } = useParams();
  
  // State for fault detection simulation
  const [simulateAnomalies, setSimulateAnomalies] = useState(false);
  const [visibleAnomalies, setVisibleAnomalies] = useState(new Set());
  
  // State for dynamic battery health prediction
  const [showHealthPrediction, setShowHealthPrediction] = useState(false);
  const [healthAnimationProgress, setHealthAnimationProgress] = useState(0);
  const [currentHealthData, setCurrentHealthData] = useState({
    currentHealth: 92,
    predictedHealth: 78,
    cycleCount: 360,
    temperature: 32,
    chargingCycles: {
      fastCharge350: 30,
      fastCharge150: 90,
      l2_22kw: 210,
      l1_11kw: 30
    }
  });

  // State for toggle buttons
  const [isCharging, setIsCharging] = useState(true);
  const [cellBalancing, setCellBalancing] = useState(true);
  const [startCooling, setStartCooling] = useState(false);
  const [startHeating, setStartHeating] = useState(true);
  
  // Define fault detection items with their anomaly status and delay
  const faultDetectionItems = [
    { name: 'Accelerated Aging', hasAnomaly: false, delay: 0 },
    { name: 'Thermal Energy', hasAnomaly: true, delay: 500 },
    { name: 'External Short Circuit', hasAnomaly: false, delay: 0 },
    { name: 'Over Temp', hasAnomaly: true, delay: 1200 },
    { name: 'Voltage Draft', hasAnomaly: false, delay: 0 },
    { name: 'Deep Temp Charge', hasAnomaly: false, delay: 0 },
    { name: 'Internal Short Circuit', hasAnomaly: true, delay: 800 },
    { name: 'Overvoltage', hasAnomaly: false, delay: 0 },
    { name: 'Deep Discharge', hasAnomaly: false, delay: 0 },
    { name: 'Overcurrent', hasAnomaly: false, delay: 0 }
  ];
  
  // Effect to handle delayed anomaly appearance
  useEffect(() => {
    if (simulateAnomalies) {
      // Clear previous anomalies
      setVisibleAnomalies(new Set());
      
      // Set up delayed timers for each anomaly
      const timers = [];
      faultDetectionItems.forEach((item, index) => {
        if (item.hasAnomaly) {
          const timer = setTimeout(() => {
            setVisibleAnomalies(prev => new Set([...prev, index]));
          }, item.delay);
          timers.push(timer);
        }
      });
      
      // Cleanup timers
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    } else {
      // Immediately clear all anomalies when turned off
      setVisibleAnomalies(new Set());
    }
  }, [simulateAnomalies]);

  // Effect for health prediction animation
  useEffect(() => {
    if (showHealthPrediction) {
      setHealthAnimationProgress(0);
      const animationInterval = setInterval(() => {
        setHealthAnimationProgress(prev => {
          if (prev >= 1) {
            clearInterval(animationInterval);
            return 1;
          }
          return prev + 0.02;
        });
      }, 50);
      return () => clearInterval(animationInterval);
    }
  }, [showHealthPrediction]);

  // Simulate dynamic battery data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHealthData(prev => {
        let tempChange = (Math.random() - 0.5) * 2;
        
        // Adjust temperature based on cooling/heating state
        if (startCooling && !startHeating) {
          tempChange -= 1.5; // Cooling effect
        } else if (startHeating && !startCooling) {
          tempChange += 1.5; // Heating effect
        }
        
        // Charging affects temperature slightly
        if (isCharging) {
          tempChange += 0.5;
        }
        
        return {
          ...prev,
          currentHealth: Math.max(70, prev.currentHealth + (Math.random() - 0.5) * 2),
          predictedHealth: Math.max(60, prev.predictedHealth + (Math.random() - 0.5) * 1.5),
          temperature: Math.max(15, Math.min(45, prev.temperature + tempChange)),
          cycleCount: prev.cycleCount + (isCharging ? Math.floor(Math.random() * 2) : 0)
        };
      });
    }, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, [startCooling, startHeating, isCharging]);
  
  // Function to get box color based on anomaly status with delayed visibility
  const getBoxColor = (hasAnomaly, index) => {
    if (!simulateAnomalies) return '#37bc12'; // All green when simulation is off
    if (hasAnomaly && visibleAnomalies.has(index)) return '#ff4444'; // Red for visible anomalies
    return '#37bc12'; // Green for normal or not-yet-visible anomalies
  };
  
  // Dynamic spacing based on screen width
  const getResponsiveSpacing = () => {
    const width = window.innerWidth;
    if (width >= 2560) return { margin: '5px', padding: '10px', containerWidth: '420px', safetyWidth: '1100px' };
    if (width >= 1920) return { margin: '10px', padding: '15px', containerWidth: '380px', safetyWidth: '950px' };
    return { margin: '20px', padding: '20px', containerWidth: '330px', safetyWidth: '800px' };
  };
  
  const spacing = getResponsiveSpacing();

  return (
    <div className="battery-page">
      <div className="battery-container" style={{ overflowY: 'auto' }}>
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

      {/* Navigation Header */}
      <div className="nav-header" style={{ margin: '20px 20px 20px', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          className="back-button"
          onClick={() => navigate(`/car/${carId}`)}
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
          <span>Battery Digital Twin</span>
        </button>
        <span className="vin-number" style={{ transform: 'translateX(-100px)' }}>VIN Number: ###</span>
      </div>



      <div style={{ margin: '0px 20px 5px' }}>
      <div className="battery-layout">
        {/* Main Content */}
        <div className="main-panel" style={{ marginTop: '-40px' }}>
          {/* Battery Details Container - Top */}
          <div className="data-container" style={{ marginBottom: '20px', marginTop: '0px', maxHeight: '580px', overflow: 'hidden', width: 'calc(100% + 20px)', marginLeft: '-10px' }}>
            
            {/* Battery Visualization */}
            <div className="battery-visual">
              <div className="battery-name">Battery Name</div>
              <div className="battery-modules" style={{ marginTop: '-15px' }}>32 Modules</div>
              
              {/* Battery Pack Visualization */}
              <div className="battery-pack">
                <div className="cell-info">
                  {Array.from({ length: 32 }, (_, i) => (
                    <div key={i} className={i === 9 ? 'medium' : ''}></div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Charging Section */}
            <div className="charging-section" style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h4>Charging</h4>
                <div 
                  onClick={() => setIsCharging(!isCharging)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    backgroundColor: 'rgba(45,52,61,1)', 
                    borderRadius: '12px', 
                    padding: '2px', 
                    width: '48px', 
                    height: '24px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" style={{ 
                    position: 'absolute', 
                    right: isCharging ? '2px' : 'auto',
                    left: isCharging ? 'auto' : '2px',
                    transition: 'all 0.3s ease'
                  }}>
                    <circle cx="10" cy="10" r="10" fill={isCharging ? "rgba(0,136,0,1)" : "rgba(128,128,128,1)"} />
                  </svg>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '700', 
                    color: 'white',
                    position: 'absolute',
                    right: isCharging ? '6px' : 'auto',
                    left: isCharging ? 'auto' : '5px',
                    top: '7px',
                    transition: 'all 0.3s ease'
                  }}>{isCharging ? 'On' : 'Off'}</span>
                </div>
              </div>
              <div className="charging-info">
                <span>{isCharging ? 'Charging Current 53A' : 'Charging Stopped'}</span>
                <span style={{ 
                  fontSize: '8px', 
                  position: 'relative', 
                  display: 'block', 
                  marginTop: '5px',
                  transform: 'translateX(220px)'
                }}>
                  {isCharging ? 'Fast Charge Duration 00:34:34' : 'Not Charging'}
                </span>
              </div>
              <div style={{ marginTop: '-40px' }}>
                <div style={{ marginBottom: '5px', textAlign: 'center' }}>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '10px' }}>
                    {isCharging ? 'Charge time to Target' : 'Charging Paused'}
                  </h4>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: isCharging ? 'white' : 'rgba(255,255,255,0.5)' }}>
                    {isCharging ? '00:00:32' : '--:--:--'}
                  </div>
                </div>
                <div className="charging-bar" style={{ width: '50%', borderRadius: '0' }}>
                  <div className="charging-fill" style={{ 
                    width: '75%', 
                    borderRadius: '0',
                    backgroundColor: isCharging ? '#37bc12' : 'rgba(55, 188, 18, 0.5)'
                  }}></div>
                </div>
              </div>
              <div className="charging-details" style={{ display: 'flex !important', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', flexDirection: 'row !important' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'white' }}>Total Charging Time:</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: isCharging ? 'white' : 'rgba(255,255,255,0.5)' }}>
                    {isCharging ? '00:02:32' : 'Paused'}
                  </span>
                </div>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '700', 
                  color: isCharging ? 'white' : 'rgba(255,255,255,0.5)', 
                  transform: 'translateX(200px)' 
                }}>
                  75% {isCharging ? 'Charging' : 'Paused'}
                </span>
                <div style={{ width: '1px', height: '80px', backgroundColor: 'rgba(255,255,255,0.3)', position: 'relative', top: '-60px', left: '-50px' }}></div>
                
                {/* Charging Details Section - Properly aligned */}
                <div style={{ 
                  position: 'relative',
                  marginTop: '-80px', 
                  marginLeft: 'auto',
                  width: '300px',
                  transform: 'translateX(-80px)'
                }}>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    color: 'white', 
                    fontFamily: 'Amazon Ember',
                    display: 'block',
                    marginBottom: '10px'
                  }}>Charging Details</span>
                  
                  {/* Charging Cycles Chart - Aligned with title */}
                  <div style={{ 
                    width: '280px',
                    padding: '10px 12px', 
                    backgroundColor: 'rgba(0,0,0,0.4)', 
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                  <div style={{ display: 'flex', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', width: '50px' }}># Cycles</div>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', flex: 1 }}>Charge Type</div>
                  </div>
                  
                  {/* Chart Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {/* Fast Charge 350kW */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'white', width: '50px' }}>{currentHealthData.chargingCycles.fastCharge350}</div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.9)', minWidth: '100px' }}>Fast Charge (350kW)</span>
                        <div style={{ 
                          height: '12px', 
                          backgroundColor: '#37bc12', 
                          width: `${Math.min(80, currentHealthData.chargingCycles.fastCharge350 / 3)}px`,
                          borderRadius: '2px'
                        }}></div>
                      </div>
                    </div>
                    
                    {/* Fast Charge 150kW */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'white', width: '50px' }}>{currentHealthData.chargingCycles.fastCharge150}</div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.9)', minWidth: '100px' }}>Fast Charge (150kW)</span>
                        <div style={{ 
                          height: '12px', 
                          backgroundColor: '#37bc12', 
                          width: `${Math.min(80, currentHealthData.chargingCycles.fastCharge150 / 3)}px`,
                          borderRadius: '2px'
                        }}></div>
                      </div>
                    </div>
                    
                    {/* L2 22kW */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'white', width: '50px' }}>{currentHealthData.chargingCycles.l2_22kw}</div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.9)', minWidth: '100px' }}>L2 (22kW)</span>
                        <div style={{ 
                          height: '12px', 
                          backgroundColor: '#37bc12', 
                          width: `${Math.min(80, currentHealthData.chargingCycles.l2_22kw / 3)}px`,
                          borderRadius: '2px'
                        }}></div>
                      </div>
                    </div>
                    
                    {/* L1 11kW */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'white', width: '50px' }}>{currentHealthData.chargingCycles.l1_11kw}</div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.9)', minWidth: '100px' }}>L1 (11kW)</span>
                        <div style={{ 
                          height: '12px', 
                          backgroundColor: '#37bc12', 
                          width: `${Math.min(80, currentHealthData.chargingCycles.l1_11kw / 3)}px`,
                          borderRadius: '2px'
                        }}></div>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Containers */}
          <div className="bottom-containers" style={{ marginBottom: '0' }}>
            <div className="data-container" style={{ minHeight: '300px', maxHeight: '300px', marginLeft: '-10px' }}>
              <h3>Driving Details</h3>
              <div style={{ fontSize: '8px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '5px' }}>Odometer: 50,546 Km</div>
              
              {/* Driving Details */}
              <div className="driving-details" style={{ display: 'flex', gap: '30px', marginTop: '15px', justifyContent: 'space-around' }}>
                <div style={{ position: 'relative', textAlign: 'center' }}>
                  <img src={require('./assets/car.png')} alt="Car" style={{ width: '25px', height: '25px' }} />
                  <div style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', color: 'white' }}>Driving Score</div>
                  <div style={{ position: 'absolute', bottom: '-45px', left: '50%', transform: 'translateX(-50%)', fontSize: '18px', fontWeight: '700', color: 'white' }}>86%</div>
                </div>
                <div style={{ position: 'relative', textAlign: 'center' }}>
                  <div style={{ fontSize: '25px' }}>🌡️</div>
                  <div style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', color: 'white' }}>Ambient Temperature</div>
                  <div style={{ position: 'absolute', bottom: '-45px', left: '50%', transform: 'translateX(-50%)', fontSize: '18px', fontWeight: '700', color: 'white' }}>72°F</div>
                </div>
                <div style={{ position: 'relative', textAlign: 'center' }}>
                  <div style={{ fontSize: '25px' }}>🎯</div>
                  <div style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', color: 'white' }}>Range</div>
                  <div style={{ position: 'absolute', bottom: '-65px', left: '50%', transform: 'translateX(-50%)', fontSize: '18px', fontWeight: '700', color: 'white' }}>350 <span style={{ fontSize: '10px' }}>Km</span></div>
                </div>
              </div>
            </div>

            <div className="data-container" style={{ minHeight: '300px', maxHeight: '300px' }}>
              
              {/* Safety & Control */}
              <div style={{ marginBottom: '20px', position: 'relative' }}>
                <h3>Safety & Control</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <img src={require('./assets/divider.png')} alt="Divider" style={{ width: '12px', height: '120px', position: 'absolute', left: '30%', top: '30px' }} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'white', fontFamily: 'Amazon Ember', position: 'absolute', left: '35%', top: '0px' }}>Fault Detection</span>
                
                {/* First Row of Fault Detection Items - 4 boxes */}
                <div style={{ position: 'absolute', left: '35%', top: '25px', width: '60%', display: 'flex', gap: '3px' }}>
                  {faultDetectionItems.slice(0, 4).map((item, index) => (
                    <div key={index} style={{ 
                      padding: '6px 3px', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center', 
                      flex: 1, 
                      backgroundColor: getBoxColor(item.hasAnomaly, index),
                      border: '1px solid rgba(255,255,255,0.8)',
                      borderRadius: '8px',
                      transition: 'all 0.5s ease',
                      minHeight: '22px'
                    }}>
                      <span style={{ fontSize: '8px', color: 'white', fontWeight: '600', lineHeight: '1.2' }}>{item.name}</span>
                    </div>
                  ))}
                </div>
                
                {/* Second Row of Fault Detection Items - 4 boxes */}
                <div style={{ position: 'absolute', left: '35%', top: '65px', width: '60%', display: 'flex', gap: '3px' }}>
                  {faultDetectionItems.slice(4, 8).map((item, index) => (
                    <div key={index + 4} style={{ 
                      padding: '6px 3px', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center', 
                      flex: 1, 
                      backgroundColor: getBoxColor(item.hasAnomaly, index + 4),
                      border: '1px solid rgba(255,255,255,0.8)',
                      borderRadius: '8px',
                      transition: 'all 0.5s ease',
                      minHeight: '22px'
                    }}>
                      <span style={{ fontSize: '8px', color: 'white', fontWeight: '600', lineHeight: '1.2' }}>{item.name}</span>
                    </div>
                  ))}
                </div>
                
                {/* Third Row of Fault Detection Items - 2 boxes (left-aligned) */}
                <div style={{ position: 'absolute', left: '35%', top: '105px', width: '30%', display: 'flex', gap: '3px' }}>
                  {faultDetectionItems.slice(8, 10).map((item, index) => (
                    <div key={index + 8} style={{ 
                      padding: '6px 3px', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center', 
                      flex: 1, 
                      backgroundColor: getBoxColor(item.hasAnomaly, index + 8),
                      border: '1px solid rgba(255,255,255,0.8)',
                      borderRadius: '8px',
                      transition: 'all 0.5s ease',
                      minHeight: '22px'
                    }}>
                      <span style={{ fontSize: '8px', color: 'white', fontWeight: '600', lineHeight: '1.2' }}>{item.name}</span>
                    </div>
                  ))}
                </div>
                
                {/* Anomaly Toggle Button - Bottom Right */}
                <div style={{ position: 'absolute', right: '5%', top: '135px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>
                    {simulateAnomalies ? 'Normal Operation' : 'Anomaly Simulation'}
                  </span>
                  <button
                    onClick={() => setSimulateAnomalies(!simulateAnomalies)}
                    style={{
                      background: simulateAnomalies ? '#37bc12' : 'rgba(128,128,128,0.6)',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '6px 12px',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    }}
                  >
                    {simulateAnomalies ? 'OFF' : 'ON'}
                  </button>
                </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'white' }}>Cell Balancing</span>
                    <div 
                      onClick={() => setCellBalancing(!cellBalancing)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        backgroundColor: 'rgba(45,52,61,1)', 
                        borderRadius: '12px', 
                        padding: '2px', 
                        width: '48px', 
                        height: '24px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" style={{ 
                        position: 'absolute', 
                        right: cellBalancing ? '2px' : 'auto',
                        left: cellBalancing ? 'auto' : '2px',
                        transition: 'all 0.3s ease'
                      }}>
                        <circle cx="10" cy="10" r="10" fill={cellBalancing ? "rgba(0,136,0,1)" : "rgba(128,128,128,1)"} />
                      </svg>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '700', 
                        color: 'white',
                        position: 'absolute',
                        right: cellBalancing ? '6px' : 'auto',
                        left: cellBalancing ? 'auto' : '5px',
                        top: '7px',
                        transition: 'all 0.3s ease'
                      }}>{cellBalancing ? 'On' : 'Off'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'white' }}>Start Cooling</span>
                    <div 
                      onClick={() => setStartCooling(!startCooling)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        backgroundColor: 'rgba(45,52,61,1)', 
                        borderRadius: '12px', 
                        padding: '2px', 
                        width: '48px', 
                        height: '24px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" style={{ 
                        position: 'absolute', 
                        right: startCooling ? '2px' : 'auto',
                        left: startCooling ? 'auto' : '2px',
                        transition: 'all 0.3s ease'
                      }}>
                        <circle cx="10" cy="10" r="10" fill={startCooling ? "rgba(0,136,0,1)" : "rgba(128,128,128,1)"} />
                      </svg>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '700', 
                        color: 'white',
                        position: 'absolute',
                        right: startCooling ? '6px' : 'auto',
                        left: startCooling ? 'auto' : '5px',
                        top: '7px',
                        transition: 'all 0.3s ease'
                      }}>{startCooling ? 'On' : 'Off'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'white' }}>Start Heating</span>
                    <div 
                      onClick={() => setStartHeating(!startHeating)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        backgroundColor: 'rgba(45,52,61,1)', 
                        borderRadius: '12px', 
                        padding: '2px', 
                        width: '48px', 
                        height: '24px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" style={{ 
                        position: 'absolute', 
                        right: startHeating ? '2px' : 'auto',
                        left: startHeating ? 'auto' : '2px',
                        transition: 'all 0.3s ease'
                      }}>
                        <circle cx="10" cy="10" r="10" fill={startHeating ? "rgba(0,136,0,1)" : "rgba(128,128,128,1)"} />
                      </svg>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '700', 
                        color: 'white',
                        position: 'absolute',
                        right: startHeating ? '6px' : 'auto',
                        left: startHeating ? 'auto' : '5px',
                        top: '7px',
                        transition: 'all 0.3s ease'
                      }}>{startHeating ? 'On' : 'Off'}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Battery Prediction Panel */}
        <div className="right-panel">
          <div className="battery-prediction">
            <div className="prediction-header">
              <h2>Battery Prediction</h2>
              <img src={require('./assets/warning.png')} alt="Warning" className="info-icon" style={{ width: '20px', height: '20px' }} />
            </div>

            {/* Health Prediction Chart */}
            <div className="motor-prediction-container" style={{ paddingLeft: '30px' }}>
              <div className="failure-prediction">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3>State of Health</h3>
                  <button
                    onClick={() => setShowHealthPrediction(!showHealthPrediction)}
                    style={{
                      background: showHealthPrediction ? '#37bc12' : 'rgba(128,128,128,0.6)',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '6px 12px',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {showHealthPrediction ? 'Hide Prediction' : 'Show Prediction'}
                  </button>
                </div>
                <div className="prediction-legend">
                  <div className="legend-item">
                    <div style={{ width: '15px', height: '2px', backgroundColor: 'rgba(255,153,0,1)' }}></div>
                    <span>Historical</span>
                  </div>
                  <div className="legend-item">
                    <div style={{ width: '15px', height: '2px', backgroundColor: 'rgba(56,239,125,1)', borderTop: '2px dashed rgba(56,239,125,1)', backgroundColor: 'transparent' }}></div>
                    <span>ML Prediction</span>
                  </div>
                </div>
                <div style={{ position: 'relative', marginTop: '80px' }}>
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
                    <svg width="320px" height="300px" viewBox="0 0 320 300">
                      {/* Grid lines */}
                      {Array.from({ length: 11 }, (_, i) => (
                        <line key={i} x1="40" y1={20 + i * 16} x2="310" y2={20 + i * 16} stroke="rgba(104,111,120,1)" strokeWidth="0.5"/>
                      ))}
                      
                      {/* Y-axis labels (State of Health %) */}
                      {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map((value, i) => (
                        <text key={i} x="35" y={25 + i * 16} fill="rgba(255,255,255,0.6)" fontSize="8" textAnchor="end">
                          {value}%
                        </text>
                      ))}
                      
                      {/* Calculate positions: X-axis = cycles, Y-axis = health % */}
                      {(() => {
                        const maxCycles = 2000;
                        const chartWidth = 270;
                        const chartHeight = 160;
                        const baseX = 40;
                        const baseY = 180;
                        
                        // Historical data points (health decreasing as cycles increase)
                        const historicalData = [
                          { cycles: 0, health: 100 },
                          { cycles: 50, health: 98 },
                          { cycles: 100, health: 96 },
                          { cycles: 200, health: 94 },
                          { cycles: 300, health: currentHealthData.currentHealth + 2 },
                          { cycles: currentHealthData.cycleCount - 20, health: currentHealthData.currentHealth + 1 },
                          { cycles: currentHealthData.cycleCount, health: currentHealthData.currentHealth }
                        ];
                        
                        const historicalPoints = historicalData.map(point => {
                          const x = baseX + (point.cycles / maxCycles) * chartWidth;
                          const y = baseY - (point.health / 100) * chartHeight;
                          return `${x},${y}`;
                        }).join(' ');
                        
                        // Predicted data points (continuing degradation)
                        const predictedData = [
                          { cycles: currentHealthData.cycleCount, health: currentHealthData.currentHealth },
                          { cycles: currentHealthData.cycleCount + 200, health: currentHealthData.predictedHealth + 8 },
                          { cycles: currentHealthData.cycleCount + 400, health: currentHealthData.predictedHealth + 4 },
                          { cycles: currentHealthData.cycleCount + 600, health: currentHealthData.predictedHealth },
                          { cycles: currentHealthData.cycleCount + 800, health: Math.max(20, currentHealthData.predictedHealth - 5) },
                          { cycles: currentHealthData.cycleCount + 1000, health: Math.max(10, currentHealthData.predictedHealth - 15) }
                        ];
                        
                        const predictedPoints = predictedData.map(point => {
                          const x = baseX + (point.cycles / maxCycles) * chartWidth;
                          const y = baseY - (point.health / 100) * chartHeight;
                          return `${x},${y}`;
                        }).join(' ');
                        
                        return (
                          <>
                            {/* Historical data (orange) - smooth connected line */}
                            <polyline
                              points={historicalPoints}
                              fill="none"
                              stroke="rgba(255,153,0,1)"
                              strokeWidth="2"
                            />
                            
                            {/* Predicted data (green) - connected to historical data */}
                            {showHealthPrediction && (
                              <polyline
                                points={predictedPoints}
                                fill="none"
                                stroke="rgba(56,239,125,1)"
                                strokeWidth="2"
                                strokeDasharray="4,4"
                                opacity={healthAnimationProgress}
                              />
                            )}
                            
                            {/* Data points - Historical */}
                            {historicalData.map((point, i) => (
                              <circle 
                                key={i} 
                                cx={baseX + (point.cycles / maxCycles) * chartWidth} 
                                cy={baseY - (point.health / 100) * chartHeight} 
                                r="3" 
                                fill="rgba(255,153,0,1)"
                              />
                            ))}
                            
                            {/* Data points - Predicted */}
                            {showHealthPrediction && predictedData.map((point, i) => (
                              <circle 
                                key={i + 7} 
                                cx={baseX + (point.cycles / maxCycles) * chartWidth} 
                                cy={baseY - (point.health / 100) * chartHeight} 
                                r="3" 
                                fill="rgba(56,239,125,1)"
                                opacity={healthAnimationProgress}
                              />
                            ))}
                          </>
                        );
                      })()}
                      
                      {/* X-axis labels (Charge Cycles) */}
                      {[0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000].map((value, i) => (
                        <text key={i} x={40 + (value / 2000) * 270} y="200" fill="rgba(255,255,255,0.6)" fontSize="8" textAnchor="middle">
                          {value}
                        </text>
                      ))}
                      
                      {/* Current cycle indicator */}
                      <line 
                        x1={40 + (currentHealthData.cycleCount / 2000) * 270} 
                        y1="20" 
                        x2={40 + (currentHealthData.cycleCount / 2000) * 270} 
                        y2="180" 
                        stroke="rgba(255,255,255,0.5)" 
                        strokeWidth="1" 
                        strokeDasharray="2,2"
                      />
                      <text 
                        x={45 + (currentHealthData.cycleCount / 2000) * 270} 
                        y="15" 
                        fill="rgba(255,255,255,0.8)" 
                        fontSize="8"
                      >
                        Now: {currentHealthData.cycleCount} cycles
                      </text>
                      
                      {/* Y-axis line */}
                      <line x1="40" y1="20" x2="40" y2="180" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                      
                      {/* X-axis line */}
                      <line x1="40" y1="180" x2="310" y2="180" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                      
                      {/* Axis labels */}
                      <text x="175" y="220" fill="rgba(255,255,255,0.8)" fontSize="10" textAnchor="middle">Charge Cycles</text>
                      <text x="15" y="100" fill="rgba(255,255,255,0.8)" fontSize="10" textAnchor="middle" transform="rotate(-90, 15, 100)">Health %</text>
                    </svg>
                  </div>
                  
                  {/* Real-time battery metrics */}
                  <div style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    top: '10px', 
                    backgroundColor: 'rgba(0,0,0,0.6)', 
                    padding: '8px', 
                    borderRadius: '6px',
                    fontSize: '9px',
                    color: 'white'
                  }}>
                    <div>Current Cycles: {currentHealthData.cycleCount}</div>
                    <div>Remaining: {Math.max(0, 2000 - currentHealthData.cycleCount)}</div>
                    <div>Health: {Math.round(currentHealthData.currentHealth)}%</div>
                    <div>Temp: {Math.round(currentHealthData.temperature)}°C</div>
                  </div>
                </div>
              </div>
              


              {/* Battery Bars */}
              <div className="battery-bars" style={{ marginBottom: '20px', marginTop: '-120px' }}>
                <div style={{ textAlign: 'center', marginBottom: '-5px' }}>
                  <span style={{ fontSize: '10px', color: 'white' }}>Battery Metrics</span>
                </div>
                <div className="battery-bar-item" style={{ marginBottom: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '10px', color: 'white' }}>State of Certified Energy</span>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>{Math.round(currentHealthData.currentHealth - 5)}%</span>
                  </div>
                  <div className="life-bar" style={{ borderRadius: '0', height: '20px' }}>
                    <div className="life-fill" style={{ width: `${currentHealthData.currentHealth - 5}%`, borderRadius: '0' }}></div>
                  </div>
                </div>
                
                <div className="battery-bar-item" style={{ marginBottom: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '10px', color: 'white' }}>State of Power</span>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>{Math.round(currentHealthData.currentHealth - 10)}%</span>
                  </div>
                  <div className="life-bar" style={{ borderRadius: '0', height: '20px' }}>
                    <div className="life-fill" style={{ width: `${currentHealthData.currentHealth - 10}%`, borderRadius: '0' }}></div>
                  </div>
                </div>
                
                <div className="battery-bar-item" style={{ marginBottom: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '10px', color: 'white' }}>Remaining Useful Life</span>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>{Math.round(currentHealthData.predictedHealth)}%</span>
                  </div>
                  <div className="life-bar" style={{ borderRadius: '0', height: '20px' }}>
                    <div className="life-fill" style={{ width: `${currentHealthData.predictedHealth}%`, borderRadius: '0' }}></div>
                  </div>
                </div>
              </div>

              {/* Expected End of Life */}
              <div className="expected-end-of-life" style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '8px', color: 'white' }}>Expected End of Life</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px', fontSize: '18px', color: 'white' }}>
                  <img src={require('./assets/batterycrossed.png')} alt="Battery Crossed" style={{ width: '20px', height: '20px' }} />
                  <span>{Math.round(2000 - (currentHealthData.cycleCount * 0.8))} <span style={{ fontSize: '12px' }}>cycles left</span></span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: currentHealthData.currentHealth < 80 ? 'red' : 'orange' }}></div>
                    <span style={{ fontSize: '12px' }}>{currentHealthData.currentHealth < 80 ? 'Critical' : 'Warning'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'green' }}></div>
                    <span style={{ fontSize: '12px' }}>Optimal</span>
                  </div>
                </div>
              </div>

              {/* AWS Battery Digital Twin Link */}
              <div style={{ 
                marginTop: '25px', 
                padding: '15px', 
                backgroundColor: 'rgba(55, 188, 18, 0.15)', 
                border: '1px solid rgba(55, 188, 18, 0.3)', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: '#37bc12', fontWeight: '600', marginBottom: '8px' }}>
                  🚀 Advanced Analytics
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px', lineHeight: '1.3' }}>
                  Access the full AWS Battery Digital Twin with ML-powered predictions and advanced monitoring
                </div>
                <button
                  onClick={() => window.open('https://d641sgdoddhxl.cloudfront.net/dashboard', '_blank')}
                  style={{
                    background: '#37bc12',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    width: '100%'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#2d9a0f';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#37bc12';
                  }}
                >
                  Launch Battery Twin →
                </button>
              </div>



            </div>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default BatteryScreen;