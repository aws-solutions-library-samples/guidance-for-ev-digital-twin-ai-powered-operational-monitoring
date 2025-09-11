import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/charger.css";

const Charger = () => {
  const navigate = useNavigate();
  const { carId } = useParams();

  return (
    <div className="charger-page">
      <div className="charger-container">
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
        <div className="nav-header" style={{ margin: '20px 20px 20px', borderBottom: 'none' }}>
          <button className="back-button" onClick={() => navigate(-1)}>
            <span>←</span>
            <span>On Board Chargers</span>
          </button>
          <span className="vin-number">VIN Number</span>
        </div>

        <div className="charger-layout">
          {/* Main Panel */}
          <div className="main-panel">
            {/* Top Container: Charging Sessions */}
            <div className="data-container" style={{ height: "410px", marginBottom: "20px", marginTop: "-20px" }}>
              <h3>Charging Sessions</h3>
              <span className="charger-status in-use">In Use</span>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                <div className="charger-metrics-grid">
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
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={require('./assets/divider.png')} alt="Divider" style={{ width: '10px', height: '250px' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginLeft: '40px', marginTop: '30px', flex: '1' }}>
                  <div style={{ fontSize: '12px', color: 'white', marginBottom: '10px' }}>Charger Efficiency: 85%</div>
                  <img src={require('./assets/chargericon.png')} alt="Charger Icon" style={{ width: '280px', height: 'auto' }} />
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
            <div className="data-container" style={{ height: "220px" }}>
              <h3>Charge Efficiency</h3>
              <div style={{ background: 'transparent', width: '100%', height: '150px', marginTop: '20px' }}>
                <svg width="100%" height="150" viewBox="0 0 1000 150">
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
            <div className="invertor-prediction">
              <div className="prediction-header">
                <h2>On Board Chargers Prediction</h2>
                <img src={require('./assets/warning.png')} alt="Warning" className="info-icon" style={{ width: '20px', height: '20px' }} />
              </div>

              {/* Charger Prediction Container */}
              <div className="invertor-prediction-container" style={{ paddingLeft: '30px' }}>
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
                        
                        {/* Y-axis labels */}
                        {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map((value, i) => (
                          <text key={i} x="15" y={25 + i * 18} fill="#fff" fontSize="8" textAnchor="end">{value}</text>
                        ))}
                        
                        {/* Past data (orange) */}
                        <polyline
                          points="0,200 18,195 36,190 54,185 72,180 90,175 108,170"
                          fill="none"
                          stroke="rgba(255,153,0,1)"
                          strokeWidth="2"
                        />
                        
                        {/* Predicted data (green) */}
                        <polyline
                          points="108,170 126,165 144,160 162,155 180,150 198,145 216,140 234,135"
                          fill="none"
                          stroke="rgba(56,239,125,1)"
                          strokeWidth="2"
                          strokeDasharray="4,4"
                        />
                        
                        {/* X-axis labels */}
                        {Array.from({ length: 21 }, (_, i) => (
                          <text key={i} x={i * 12} y="215" fill="#fff" fontSize="8" textAnchor="middle">{i * 2}</text>
                        ))}
                        
                        {/* Data points */}
                        {Array.from({ length: 13 }, (_, i) => (
                          <circle key={i} cx={i * 18} cy={200 - i * 5} r="2" fill={i < 6 ? "rgba(255,153,0,1)" : "rgba(56,239,125,1)"}/>
                        ))}
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Remaining Useful Life */}
                <div className="useful-life" style={{ marginBottom: '-80px', marginTop: '-100px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '10px', color: 'white' }}>Remaining useful life</span>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>60%</span>
                  </div>
                  <div className="life-bar" style={{ borderRadius: '0' }}>
                    <div className="life-fill" style={{ width: '60%', borderRadius: '0' }}></div>
                  </div>
                </div>

                {/* GenAI Recommendations */}
                <div className="genai-recommendations">
                  <h3>GenAI Recommendations</h3>
                  <p>Use Battery health, SOC, Temperature and environmental data, Charging station load, Real-time traffic and user location data to dynamic power adjustment during charging</p>
                  
                  <div className="recommendations-list">
                    <div className="recommendation-item">
                      <span className="warning-icon">⚠️</span>
                      <span>Dynamic Power Adjustment</span>
                    </div>
                    <div className="recommendation-details">
                      <p><strong>Step 1:</strong> Initial assessment and configure power ramping rates</p>
                      <p><strong>Step 2:</strong> Configure adaptive charging rates</p>
                    </div>
                    <div className="more-link">More.....</div>
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