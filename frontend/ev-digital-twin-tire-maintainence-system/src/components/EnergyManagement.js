import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/energymanagement.css";

const EnergyManagement = () => {
  const navigate = useNavigate();
  const { carId } = useParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  return (
    <div className="energymanagement-page">
      <div className="energymanagement-container">
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
            <span>Energy Management</span>
          </button>
          <span className="vin-number" style={{ transform: `translateX(-${window.innerWidth >= 1920 ? '500' : window.innerWidth >= 1400 ? '400' : '300'}px)` }}>VIN Number</span>
        </div>

        <div style={{ margin: '10px 20px 5px' }}>
          <div className="energymanagement-layout">
          {/* Main Panel */}
          <div className="main-panel" style={{ marginTop: '50px' }}>
            {/* Top Container: Thermal Values */}
            <div className="data-container" style={{ height: spacing.thermalContainerHeight, maxHeight: windowWidth < 1600 ? '400px' : 'none', marginBottom: "20px" }}>
              <h3>Thermal Values</h3>
              {/* Top Row - 4 items */}
              <div className="thermal-metrics-grid">
                <div className="thermal-gauge">
                  <div className="gauge-container">
                    <div className="gauge-arc"></div>
                    <div className="gauge-value">60%</div>
                    <div className="gauge-label">Thermal Efficiency Score</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path d="M0,22 Q20,10 40,30 T90,22" fill="none" stroke="#37bc12" strokeWidth="1"/>
                    <path d="M0,28 Q20,18 40,38 T90,28" fill="none" stroke="#ff9900" strokeWidth="1"/>
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
                    <div className="gauge-arc"></div>
                    <div className="gauge-value">60°C</div>
                    <div className="gauge-label">Motor/Inverter Temperature</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path d="M0,22 Q20,30 40,10 T90,22" fill="none" stroke="#37bc12" strokeWidth="1"/>
                    <path d="M0,28 Q20,38 40,18 T90,28" fill="none" stroke="#ff9900" strokeWidth="1"/>
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
                    <div className="gauge-arc"></div>
                    <div className="gauge-value">30°C</div>
                    <div className="gauge-label">Coolant Inlet Temperatures</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path d="M0,22 Q20,15 40,35 T90,22" fill="none" stroke="#37bc12" strokeWidth="1"/>
                    <path d="M0,28 Q20,21 40,41 T90,28" fill="none" stroke="#ff9900" strokeWidth="1"/>
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
                    <div className="gauge-arc"></div>
                    <div className="gauge-value">30°C</div>
                    <div className="gauge-label">Coolant Outlet Temperatures</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path d="M0,22 Q20,35 40,15 T90,22" fill="none" stroke="#37bc12" strokeWidth="1"/>
                    <path d="M0,28 Q20,41 40,21 T90,28" fill="none" stroke="#ff9900" strokeWidth="1"/>
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
              <div className="thermal-metrics-grid-bottom">
                <div className="thermal-gauge">
                  <div className="gauge-container">
                    <div className="gauge-arc"></div>
                    <div className="gauge-value">5 L/min</div>
                    <div className="gauge-label">Coolant Flow Rate</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path d="M0,22 Q20,10 40,30 T90,22" fill="none" stroke="#37bc12" strokeWidth="1"/>
                    <path d="M0,28 Q20,18 40,38 T90,28" fill="none" stroke="#ff9900" strokeWidth="1"/>
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
                    <div className="gauge-arc"></div>
                    <div className="gauge-value">2 kW</div>
                    <div className="gauge-label">Heater/Cooler Power Consumption</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path d="M0,22 Q20,30 40,10 T90,22" fill="none" stroke="#37bc12" strokeWidth="1"/>
                    <path d="M0,28 Q20,38 40,18 T90,28" fill="none" stroke="#ff9900" strokeWidth="1"/>
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
                    <div className="gauge-arc"></div>
                    <div className="gauge-value">30°C</div>
                    <div className="gauge-label">Ambient Temperature</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path d="M0,22 Q20,15 40,35 T90,22" fill="none" stroke="#37bc12" strokeWidth="1"/>
                    <path d="M0,28 Q20,21 40,41 T90,28" fill="none" stroke="#ff9900" strokeWidth="1"/>
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
                    <div className="gauge-arc"></div>
                    <div className="gauge-value">65%</div>
                    <div className="gauge-label">HVAC System Usage</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path d="M0,22 Q20,35 40,15 T90,22" fill="none" stroke="#37bc12" strokeWidth="1"/>
                    <path d="M0,28 Q20,41 40,21 T90,28" fill="none" stroke="#ff9900" strokeWidth="1"/>
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
            <div className="data-container" style={{ height: spacing.regenerativeContainerHeight, marginBottom: windowWidth < 1600 ? '-20px' : '20px', maxHeight: windowWidth < 1600 ? '180px' : 'none', overflow: windowWidth < 1600 ? 'hidden' : 'visible' }}>
              <h3>Regenerative Data</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="regenerative-metrics-grid">
                  <div className="regenerative-gauge">
                    <div className="gauge-value" style={{ fontSize: '22px' }}>200 Nm</div>
                    <div className="gauge-label" style={{ fontSize: '8px' }}>Braking Force</div>
                    <svg width="140px" height="95px" viewBox="0 0 140 95">
                      {Array.from({ length: 9 }, (_, i) => (
                        <line key={i} x1="0" y1={10 + i * 9} x2="140" y2={10 + i * 9} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      ))}
                      <path d="M0,47 Q35,25 70,65 T140,47" fill="none" stroke="#37bc12" strokeWidth="1"/>
                    </svg>
                  </div>
                  <div className="regenerative-gauge">
                    <div className="gauge-value" style={{ fontSize: '22px' }}>0.05 kWh</div>
                    <div className="gauge-label" style={{ fontSize: '8px' }}>Energy Recovered/Braking Event</div>
                    <svg width="140px" height="95px" viewBox="0 0 140 95">
                      {Array.from({ length: 9 }, (_, i) => (
                        <line key={i} x1="0" y1={10 + i * 9} x2="140" y2={10 + i * 9} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      ))}
                      <path d="M0,47 Q35,65 70,25 T140,47" fill="none" stroke="#37bc12" strokeWidth="1"/>
                    </svg>
                  </div>
                </div>
                
                <div className="regenerative-stacked-section">
                  <div className="stacked-bar-item">
                    <svg width="250px" height="35px" viewBox="0 0 250 35">
                      <line x1="0" y1="10" x2="250" y2="10" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <line x1="0" y1="17" x2="250" y2="17" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <line x1="0" y1="24" x2="250" y2="24" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <path d="M0,17 Q30,12 60,22 Q90,8 120,20 Q150,25 180,15 Q210,19 250,17" fill="none" stroke="#37bc12" strokeWidth="2"/>
                    </svg>
                    <div className="stacked-bar-label">20%</div>
                  </div>
                  <div style={{ fontSize: '8px', color: 'white', textAlign: 'right', marginTop: '-10px', marginRight: '10px' }}>Friction Braking Usage</div>
                  
                  <div className="stacked-bar-item">
                    <svg width="250px" height="35px" viewBox="0 0 250 35">
                      <line x1="0" y1="10" x2="250" y2="10" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <line x1="0" y1="17" x2="250" y2="17" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <line x1="0" y1="24" x2="250" y2="24" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <path d="M0,17 Q30,22 60,12 Q90,25 120,15 Q150,10 180,20 Q210,14 250,17" fill="none" stroke="#37bc12" strokeWidth="2"/>
                    </svg>
                    <div className="stacked-bar-label">40%</div>
                  </div>
                  <div style={{ fontSize: '8px', color: 'white', textAlign: 'right', marginTop: '-10px', marginRight: '10px' }}>Brake Pedal Position</div>
                  
                  <div className="stacked-bar-item">
                    <svg width="250px" height="35px" viewBox="0 0 250 35">
                      <line x1="0" y1="10" x2="250" y2="10" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <line x1="0" y1="17" x2="250" y2="17" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <line x1="0" y1="24" x2="250" y2="24" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      <path d="M0,17 Q30,14 60,20 Q90,23 120,12 Q150,18 180,25 Q210,16 250,17" fill="none" stroke="#37bc12" strokeWidth="2"/>
                    </svg>
                    <div className="stacked-bar-label">40%</div>
                  </div>
                  <div style={{ fontSize: '8px', color: 'white', textAlign: 'right', marginTop: '-10px', marginRight: '10px' }}>Brake Pedal Position</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="right-panel">
            <div className="battery-prediction">
              <div className="prediction-header">
                <h2 style={{ fontSize: windowWidth < 1600 ? '18px' : '24px' }}>Energy Management Prediction</h2>
                <img src={require('./assets/warning.png')} alt="Warning" className="info-icon" style={{ width: '20px', height: '20px' }} />
              </div>

              {/* Energy Management Prediction Container */}
              <div className="motor-prediction-container" style={{ paddingLeft: windowWidth < 1600 ? '20px' : '30px' }}>
                <div className="failure-prediction">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>Energy Management Failure Prediction</h3>
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
                  <div style={{ position: 'relative', marginTop: windowWidth < 1600 ? '20px' : '100px' }}>
                    <div className="prediction-chart" style={{ transform: windowWidth < 1600 ? 'scale(0.95)' : 'none', transformOrigin: 'left top' }}>
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
                      
                      {/* Past data (orange) - Energy management declining: 95% → 60% */}
                      <polyline
                        points="35,25 50,35 65,45 80,55 95,65 110,75 125,85"
                        fill="none"
                        stroke="rgba(255,153,0,1)"
                        strokeWidth="2"
                      />
                      
                      {/* Predicted data (green) - Static prediction */}
                      <polyline
                        points="125,85 140,90 155,95 170,100 185,105 200,110 215,115"
                        fill="none"
                        stroke="rgba(56,239,125,1)"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                      />
                      
                      {/* Data points - Historical */}
                      <circle cx="35" cy="25" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="50" cy="35" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="65" cy="45" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="80" cy="55" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="95" cy="65" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="110" cy="75" r="1.5" fill="rgba(255,153,0,1)"/>
                      
                      {/* Current point - Highlighted */}
                      <circle cx="125" cy="85" r="2.5" fill="rgba(255,153,0,1)" stroke="white" strokeWidth="1.5"/>
                      
                      {/* Data points - Predicted */}
                      <circle cx="140" cy="90" r="1.5" fill="rgba(56,239,125,1)"/>
                      <circle cx="155" cy="95" r="1.5" fill="rgba(56,239,125,1)"/>
                      <circle cx="170" cy="100" r="1.5" fill="rgba(56,239,125,1)"/>
                      <circle cx="185" cy="105" r="1.5" fill="rgba(56,239,125,1)"/>
                      <circle cx="200" cy="110" r="1.5" fill="rgba(56,239,125,1)"/>
                      <circle cx="215" cy="115" r="1.5" fill="rgba(255,153,0,1)"/>
                      
                      {/* Annotations */}
                      <text x="125" y="78" fill="rgba(255,255,255,0.9)" fontSize="7" textAnchor="middle" fontWeight="bold">NOW</text>
                      <text x="170" y="93" fill="rgba(56,239,125,0.9)" fontSize="6" textAnchor="middle">Stable</text>
                      <text x="215" y="108" fill="rgba(255,153,0,0.9)" fontSize="6" textAnchor="middle">Monitor</text>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Remaining Useful Life */}
                <div className="useful-life" style={{ marginBottom: '20px', marginTop: windowWidth < 1600 ? '-120px' : windowWidth >= 1920 ? '20px' : '-40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: spacing.smallFontSize, color: 'white' }}>Remaining useful life</span>
                    <span style={{ fontSize: spacing.fontSize, color: 'white', fontWeight: 'bold' }}>60%</span>
                  </div>
                  <div className="life-bar" style={{ borderRadius: '0' }}>
                    <div className="life-fill" style={{ 
                      width: '60%', 
                      borderRadius: '0',
                      background: 60 < 30 ? '#ff4444' : 
                                 60 < 60 ? '#ff9900' : 
                                 'linear-gradient(90deg, #ff9900 0%, #37bc12 100%)'
                    }}></div>
                  </div>
                </div>

                {/* GenAI Recommendations */}
                <div className="genai-recommendations" style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ fontSize: spacing.titleFontSize, margin: 0 }}>GenAI Recommendations</h3>
                  </div>
                  <p style={{ 
                    fontSize: windowWidth >= 1920 ? spacing.fontSize : spacing.smallFontSize, 
                    color: 'rgba(255,255,255,0.8)', 
                    lineHeight: '1.4',
                    marginBottom: '20px'
                  }}>Use real-time vehicle speed, acceleration, battery SOC and health, environmental data and driving habits to implement energy-saving strategies.</p>
                  
                  <div className="recommendations-list" style={{ marginTop: '15px' }}>
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
                  </div>
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

export default EnergyManagement;