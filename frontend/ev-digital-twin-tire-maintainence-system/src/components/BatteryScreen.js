import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './BatteryPack.css';

const BatteryScreen = () => {
  const navigate = useNavigate();
  const { carId } = useParams();
  
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
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: 'rgba(45,52,61,1)', 
                  borderRadius: '12px', 
                  padding: '2px', 
                  width: '48px', 
                  height: '24px',
                  position: 'relative'
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" style={{ position: 'absolute', right: '2px' }}>
                    <circle cx="10" cy="10" r="10" fill="rgba(0,136,0,1)" />
                  </svg>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '700', 
                    color: 'white',
                    position: 'absolute',
                    right: '6px',
                    top: '7px'
                  }}>On</span>
                </div>
              </div>
              <div className="charging-info">
                <span>Charging Current 53A</span>
                <span style={{ fontSize: '8px', transform: 'translateX(-245px)', position: 'relative' }}>Fast Charge Duration 00:34:34</span>
              </div>
              <div style={{ marginTop: '-40px' }}>
                <div style={{ marginBottom: '5px', textAlign: 'center' }}>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '10px' }}>Charge time to Target</h4>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>00:00:32</div>
                </div>
                <div className="charging-bar" style={{ width: '50%', borderRadius: '0' }}>
                  <div className="charging-fill" style={{ width: '75%', borderRadius: '0' }}></div>
                </div>
              </div>
              <div className="charging-details" style={{ display: 'flex !important', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', flexDirection: 'row !important' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'white' }}>Total Charging Time:</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>00:02:32</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'white', transform: 'translateX(200px)' }}>75% Charged</span>
                <div style={{ width: '1px', height: '80px', backgroundColor: 'rgba(255,255,255,0.3)', position: 'relative', top: '-60px', left: '-50px' }}></div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'white', fontFamily: 'Amazon Ember', transform: 'translateY(-80px) translateX(-250px)', position: 'relative' }}>Charging Details</span>
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
                
                {/* First Row of Fault Detection Items */}
                <div style={{ position: 'absolute', left: '35%', top: '25px', width: '60%', display: 'flex', gap: '3px' }}>
                  <div style={{ padding: '3px', textAlign: 'center', flex: 1, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '8px', color: 'white' }}>Accelerated Aging</span>
                  </div>
                  <div style={{ padding: '3px', textAlign: 'center', flex: 1, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '8px', color: 'white' }}>Thermal Energy</span>
                  </div>
                  <div style={{ padding: '3px', textAlign: 'center', flex: 1, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '8px', color: 'white' }}>External Short Circuit</span>
                  </div>
                  <div style={{ padding: '3px', textAlign: 'center', flex: 1, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '8px', color: 'white' }}>Over Temp</span>
                  </div>
                </div>
                
                {/* Second Row of Fault Detection Items */}
                <div style={{ position: 'absolute', left: '35%', top: '75px', width: '60%', display: 'flex', gap: '3px' }}>
                  <div style={{ padding: '3px', textAlign: 'center', flex: 1, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '8px', color: 'white' }}>Voltage Draft</span>
                  </div>
                  <div style={{ padding: '3px', textAlign: 'center', flex: 1, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '8px', color: 'white' }}>Deep Temp Charge</span>
                  </div>
                  <div style={{ padding: '3px', textAlign: 'center', flex: 1, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '8px', color: 'white' }}>Internal Short Circuit</span>
                  </div>
                  <div style={{ padding: '3px', textAlign: 'center', flex: 1, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '8px', color: 'white' }}>Overvoltage</span>
                  </div>
                </div>
                
                {/* Third Row of Fault Detection Items */}
                <div style={{ position: 'absolute', left: '35%', top: '125px', width: '30%', display: 'flex', gap: '3px' }}>
                  <div style={{ padding: '3px', textAlign: 'center', flex: 1, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '8px', color: 'white' }}>Deep Discharge</span>
                  </div>
                  <div style={{ padding: '3px', textAlign: 'center', flex: 1, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '8px', color: 'white' }}>Overcurrent</span>
                  </div>
                </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'white' }}>Cell Balancing</span>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      backgroundColor: 'rgba(45,52,61,1)', 
                      borderRadius: '12px', 
                      padding: '2px', 
                      width: '48px', 
                      height: '24px',
                      position: 'relative'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" style={{ position: 'absolute', right: '2px' }}>
                        <circle cx="10" cy="10" r="10" fill="rgba(0,136,0,1)" />
                      </svg>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '700', 
                        color: 'white',
                        position: 'absolute',
                        right: '6px',
                        top: '7px'
                      }}>On</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'white' }}>Start Cooling</span>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      backgroundColor: 'rgba(45,52,61,1)', 
                      borderRadius: '12px', 
                      padding: '2px', 
                      width: '48px', 
                      height: '24px',
                      position: 'relative'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" style={{ position: 'absolute', left: '2px' }}>
                        <circle cx="10" cy="10" r="10" fill="rgba(128,128,128,1)" />
                      </svg>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '700', 
                        color: 'white',
                        position: 'absolute',
                        left: '5px',
                        top: '7px'
                      }}>Off</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'white' }}>Start Heating</span>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      backgroundColor: 'rgba(45,52,61,1)', 
                      borderRadius: '12px', 
                      padding: '2px', 
                      width: '48px', 
                      height: '24px',
                      position: 'relative'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" style={{ position: 'absolute', right: '2px' }}>
                        <circle cx="10" cy="10" r="10" fill="rgba(0,136,0,1)" />
                      </svg>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '700', 
                        color: 'white',
                        position: 'absolute',
                        right: '6px',
                        top: '7px'
                      }}>On</span>
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
                <h3>State of Health</h3>
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
                    <svg width="240px" height="300px" viewBox="0 0 240 300">
                  {/* Grid lines */}
                  {Array.from({ length: 11 }, (_, i) => (
                    <line key={i} x1="0" y1={20 + i * 18} x2="240" y2={20 + i * 18} stroke="rgba(104,111,120,1)" strokeWidth="0.5"/>
                  ))}
                  
                  {/* Past data (orange) */}
                  <polyline
                    points="0,30 18,40 36,50 54,60 72,70 90,80 108,90"
                    fill="none"
                    stroke="rgba(255,153,0,1)"
                    strokeWidth="2"
                  />
                  
                  {/* Predicted data (green) */}
                  <polyline
                    points="108,90 126,105 144,120 162,135 180,150 198,165 216,180 234,195"
                    fill="none"
                    stroke="rgba(56,239,125,1)"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                  
                  {/* Data points */}
                  {Array.from({ length: 13 }, (_, i) => (
                    <circle key={i} cx={i * 18} cy={30 + i * (i < 6 ? 10 : 15)} r="2" fill={i < 6 ? "rgba(255,153,0,1)" : "rgba(56,239,125,1)"}/>
                  ))}
                  
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
              


              {/* Battery Bars */}
              <div className="battery-bars" style={{ marginBottom: '20px', marginTop: '-120px' }}>
                <div style={{ textAlign: 'center', marginBottom: '-5px' }}>
                  <span style={{ fontSize: '10px', color: 'white' }}>Charging Cycle</span>
                </div>
                <div className="battery-bar-item" style={{ marginBottom: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '10px', color: 'white' }}>State of Certified Energy</span>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>85%</span>
                  </div>
                  <div className="life-bar" style={{ borderRadius: '0', height: '20px' }}>
                    <div className="life-fill" style={{ width: '85%', borderRadius: '0' }}></div>
                  </div>
                </div>
                
                <div className="battery-bar-item" style={{ marginBottom: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '10px', color: 'white' }}>State of Power</span>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>75%</span>
                  </div>
                  <div className="life-bar" style={{ borderRadius: '0', height: '20px' }}>
                    <div className="life-fill" style={{ width: '75%', borderRadius: '0' }}></div>
                  </div>
                </div>
                
                <div className="battery-bar-item" style={{ marginBottom: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '10px', color: 'white' }}>Remaining Useful Life</span>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>70%</span>
                  </div>
                  <div className="life-bar" style={{ borderRadius: '0', height: '20px' }}>
                    <div className="life-fill" style={{ width: '70%', borderRadius: '0' }}></div>
                  </div>
                </div>
              </div>

              {/* Expected End of Life */}
              <div className="expected-end-of-life" style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '8px', color: 'white' }}>Expected End of Life</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px', fontSize: '18px', color: 'white' }}>
                  <img src={require('./assets/batterycrossed.png')} alt="Battery Crossed" style={{ width: '20px', height: '20px' }} />
                  <span>2,000 <span style={{ fontSize: '12px' }}>cycle</span></span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'red' }}></div>
                    <span>1/1/2026</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'green' }}></div>
                    <span>1/4/2026</span>
                  </div>
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

export default BatteryScreen;