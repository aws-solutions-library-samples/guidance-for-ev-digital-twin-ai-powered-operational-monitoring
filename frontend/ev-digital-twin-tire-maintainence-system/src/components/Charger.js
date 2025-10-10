import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/charger.css";

const Charger = () => {
  const navigate = useNavigate();
  const { carId } = useParams();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  return (
    <div className="charger-page">
o      <div className="charger-container" style={{ 
        transform: windowWidth <= 1024 ? `scale(${windowWidth / 1440})` : (windowWidth >= 2685 ? `scale(${windowWidth / 1920})` : undefined),
        transformOrigin: windowWidth <= 1024 ? 'top left' : (windowWidth >= 2685 ? 'top left' : undefined),
        width: windowWidth <= 1024 ? `${100 / (windowWidth / 1440)}%` : (windowWidth >= 2685 ? `${100 / (windowWidth / 1920)}%` : undefined),
        height: windowWidth <= 1024 ? `${100 / (windowWidth / 1440)}%` : (windowWidth >= 2685 ? `${100 / (windowWidth / 1920)}%` : (windowWidth <= 1700 ? '100vh' : 'auto')),
        overflowY: windowWidth <= 1700 ? 'auto' : 'hidden'
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
          <button className="back-button" onClick={() => navigate(-1)}>
            <span>←</span>
            <span>On Board Chargers</span>
          </button>
        </div>
        


        <div style={{ margin: '10px 20px 5px' }}>
          <div className="charger-layout">
            {/* Main Panel */}
            <div className="main-panel" style={{ marginTop: '50px' }}>
              {/* Top Container: Charging Sessions */}
              <div className="data-container" style={{ marginBottom: "20px", marginTop: "0px", minHeight: windowWidth <= 1440 ? '400px' : windowWidth <= 1700 ? '450px' : '500px', overflow: 'visible' }}>
              <h3>Charging Sessions</h3>
              <span className="charger-status in-use">In Use</span>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '30px', height: 'calc(100% - 60px)', width: '100%' }}>
                <div className="charger-metrics-grid" style={{ flex: '0 0 380px' }}>
                <div className="charger-gauge">
                  <div className="gauge-container">
                    <div className="gauge-arc"></div>
                    <div className="gauge-value">180 V</div>
                    <div className="gauge-label">Input Voltage (AC)</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path d="M0,22 Q20,10 40,30 T90,22" fill="none" stroke="#37bc12" strokeWidth="1"/>
                    <path d="M0,28 Q20,18 40,38 T90,28" fill="none" stroke="#ff9900" strokeWidth="1"/>
                  </svg>
                </div>
                <div className="charger-gauge">
                  <div className="gauge-container">
                    <div className="gauge-arc"></div>
                    <div className="gauge-value">180 V</div>
                    <div className="gauge-label">Output Voltage (AC)</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path d="M0,22 Q20,30 40,10 T90,22" fill="none" stroke="#37bc12" strokeWidth="1"/>
                    <path d="M0,28 Q20,38 40,18 T90,28" fill="none" stroke="#ff9900" strokeWidth="1"/>
                  </svg>
                </div>
                <div className="charger-gauge">
                  <div className="gauge-container">
                    <div className="gauge-arc"></div>
                    <div className="gauge-value">27 A</div>
                    <div className="gauge-label">Input Current (AC)</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path d="M0,22 Q20,15 40,35 T90,22" fill="none" stroke="#37bc12" strokeWidth="1"/>
                    <path d="M0,28 Q20,21 40,41 T90,28" fill="none" stroke="#ff9900" strokeWidth="1"/>
                  </svg>
                </div>
                <div className="charger-gauge">
                  <div className="gauge-container">
                    <div className="gauge-arc"></div>
                    <div className="gauge-value">27 A</div>
                    <div className="gauge-label">Output Current (AC)</div>
                  </div>
                  <svg width="90px" height="45px" viewBox="0 0 90 45">
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                    ))}
                    <path d="M0,22 Q20,35 40,15 T90,22" fill="none" stroke="#37bc12" strokeWidth="1"/>
                    <path d="M0,28 Q20,41 40,21 T90,28" fill="none" stroke="#ff9900" strokeWidth="1"/>
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
              <div className="data-container">
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
                <img src={require('./assets/warning.png')} alt="Warning" className="info-icon" style={{ width: '20px', height: '20px' }} />
              </div>

              {/* Charger Prediction Container */}
              <div className="motor-prediction-container" style={{ paddingLeft: windowWidth <= 1440 ? '15px' : windowWidth <= 1700 ? '20px' : windowWidth <= 1815 ? '25px' : '30px' }}>
                <div className="failure-prediction">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>Charger Failure Prediction</h3>
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
                <div className="useful-life" style={{ marginBottom: '20px', marginTop: windowWidth <= 1440 ? '-140px' : windowWidth <= 1700 ? '-120px' : windowWidth <= 1815 ? '-60px' : windowWidth >= 1920 ? '20px' : '-40px' }}>
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
                  }}>Use Battery health, SOC, Temperature and environmental data, Charging station load, Real-time traffic and user location data to dynamic power adjustment during charging</p>
                  
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

export default Charger;