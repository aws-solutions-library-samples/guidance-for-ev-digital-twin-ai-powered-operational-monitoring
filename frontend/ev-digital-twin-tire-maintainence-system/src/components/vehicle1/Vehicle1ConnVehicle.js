import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Papa from 'papaparse';
import '../../css/connvehicle.css';
import { VEHICLE_INFO } from '../../utils/vinMapping';

const Vehicle1ConnVehicle = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tireData, setTireData] = useState(null);
  const [dataIndex, setDataIndex] = useState(0);

  const displayVIN = '2T1BURHE8JC987654';
  const vehicleInfo = VEHICLE_INFO[displayVIN];

  useEffect(() => {
    Papa.parse('/data/tire_wear_data.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const vehicle1Data = results.data
          .filter(row => row.vehicle_id === '1' && row.position === 'front_left')
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        if (vehicle1Data.length > 0) setTireData(vehicle1Data);
      }
    });
  }, []);

  useEffect(() => {
    if (tireData && tireData.length > 0) {
      const savedIndex = parseInt(sessionStorage.getItem('vehicle1TireIndex')) || 0;
      if (savedIndex < tireData.length) setDataIndex(savedIndex);
      
      const interval = setInterval(() => {
        setDataIndex(prev => {
          const nextIndex = (prev + 1) % tireData.length;
          sessionStorage.setItem('vehicle1TireIndex', nextIndex);
          return nextIndex;
        });
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [tireData]);

  const currentData = tireData?.[dataIndex] || {};
  const tread = parseFloat(currentData.tread_depth_mm) || 11;
  const pressure = parseFloat(currentData.pressure_psi) || 32;
  const anomaly = currentData.anomaly_type;
  const pattern = currentData.driving_pattern;

  const getMetrics = () => {
    if (!tireData) return { speed: '12 mph', accel: '2 m/s²', throttle: '40%', steering: '54°' };
    
    let base = pattern === 'city' ? [30, 2.0, 40, 50] : pattern === 'highway' ? [70, 0.8, 70, 10] : [50, 1.5, 55, 30];
    let mod = anomaly === 'puncture' ? [0.3, 0.2, 0.3, 2.5] : tread < 3 ? [0.4, 0.3, 0.4, 2.0] : tread < 4 ? [0.6, 0.5, 0.6, 1.5] : tread < 6 ? [0.8, 0.7, 0.8, 1.2] : anomaly === 'irregular_wear' ? [0.7, 0.6, 0.7, 1.4] : [1, 1, 1, 1];
    if (pressure < 28) mod = mod.map((v, i) => i < 3 ? v * 0.7 : v * 1.3);
    
    return {
      speed: Math.round(base[0] * mod[0]) + ' mph',
      accel: (base[1] * mod[1]).toFixed(1) + ' m/s²',
      throttle: Math.round(base[2] * mod[2]) + '%',
      steering: Math.round(base[3] * mod[3]) + '°'
    };
  };

  const getFault = () => {
    if (!tireData) return '⚠️ Critical Tire Wear';
    if (anomaly === 'puncture') return '🚨 Tire Puncture Detected';
    if (tread < 4) return '⚠️ Critical Tire Wear';
    if (pressure < 28) return '⚠️ Low Tire Pressure';
    if (anomaly === 'irregular_wear') return '⚠️ Irregular Tire Wear';
    if (tread < 6) return '⚠️ Tire Wear Detected';
    return '✅ Tires Normal';
  };

  const getError = () => {
    if (!tireData) return 'T0001';
    if (anomaly === 'puncture') return 'T0001';
    if (anomaly === 'irregular_wear') return 'T0002';
    if (pressure < 28) return 'T0003';
    if (tread < 4) return 'T0004';
    return 'None';
  };

  const getMessage = () => {
    if (!tireData) return 'Tire wear below safety threshold';
    if (anomaly === 'puncture') return 'Puncture detected - immediate service required';
    if (tread < 3) return 'Tread depth critically low - replace immediately';
    if (tread < 4) return 'Tire wear below safety threshold';
    if (pressure < 28) return 'Tire pressure critically low';
    if (anomaly === 'irregular_wear') return 'Uneven wear pattern detected';
    if (tread < 6) return 'Tire tread approaching replacement threshold';
    return 'All tires within normal parameters';
  };

  const metrics = getMetrics();
  const fault = getFault();
  const error = getError();
  const message = getMessage();

  return (
    <div className="connvehicle-page">
      <div className="connvehicle-container">
        {/* Header */}
        <header className="connvehicle-header">
          <div className="connvehicle-header-left">
            <svg width="43px" height="20px" viewBox="0 0 43 20">
              <path d="M4.94797 15.7069C4.9294 15.7069 4.91155 15.7069 4.89299 15.7055L2.88435 15.5905C2.10174 15.5834 1.42482 15.3042 0.924977 14.7815C-0.045425 13.7661 -0.00543786 12.2002 0.00241676 12.0245C0.0452601 11.0727 0.283755 10.3158 0.712903 9.77598C0.742179 9.73885 0.771455 9.70458 0.800732 9.67102C0.692195 8.92483 1.01209 8.46426 1.09492 8.3593C1.11634 8.33288 1.13848 8.30717 1.16276 8.28289C2.7958 6.61986 7.60712 5.66159 10.3298 5.23887C11.2152 5.10106 12.07 4.87042 12.8711 4.55266C14.0008 4.10352 15.3054 3.43659 16.45 2.72182C18.3144 1.55791 20.3494 0.773878 22.4995 0.393286C25.1943 -0.0844178 33.9429 -0.0251512 38.9178 0.0526809C41.1885 0.0883838 43.0357 1.96492 43.0357 4.23562C43.0357 6.50632 41.1592 8.41928 38.8521 8.41928L31.7686 8.41928C31.2402 8.41928 30.8111 7.99084 30.8111 7.46173C30.8111 6.93261 31.2395 6.50418 31.7686 6.50418L38.8521 6.50418C40.1031 6.50418 41.1206 5.48665 41.1206 4.23562C41.1206 2.9846 40.1188 1.98635 38.8878 1.96707C30.5383 1.83639 24.6866 1.94993 22.8336 2.27839C20.9264 2.61614 19.1198 3.31163 17.4639 4.34559C16.7363 4.79973 15.2647 5.66159 13.5773 6.33209C12.6434 6.70269 11.6501 6.97117 10.624 7.13041C6.82094 7.72164 3.7862 8.62136 2.71155 9.46323C2.72297 9.50179 2.74082 9.55248 2.77081 9.61532C2.8922 9.87024 2.89434 10.1659 2.77724 10.4229C2.67441 10.6486 2.48805 10.8249 2.26026 10.9156C2.16601 10.992 1.95036 11.3255 1.91537 12.1109C1.90752 12.343 1.96321 13.1021 2.31167 13.4619C2.40093 13.5541 2.56017 13.6769 2.91434 13.6769C2.9329 13.6769 2.95075 13.6769 2.96932 13.6783L4.11895 13.744C4.58951 11.3291 6.72169 9.50036 9.27158 9.50036C11.8215 9.50036 13.8644 11.2327 14.3928 13.5862L32.8526 13.1813C33.1403 12.2623 33.6802 11.4319 34.4164 10.7907C35.3718 9.95878 36.5957 9.50036 37.8638 9.50036C40.3759 9.50036 42.5437 11.2884 43.0186 13.7526C43.1186 14.2717 42.7787 14.7737 42.2595 14.8736C41.7404 14.9736 41.2384 14.6337 41.1385 14.1146C40.8371 12.5508 39.4604 11.4155 37.8638 11.4155C36.2672 11.4155 34.8012 12.6393 34.5634 14.2617C34.4956 14.7237 34.1043 15.07 33.6373 15.08L13.5809 15.5199C13.0604 15.5341 12.6262 15.1243 12.6034 14.6037C12.5262 12.8157 11.0631 11.4155 9.27158 11.4155C7.48001 11.4155 5.93694 12.9114 5.93622 14.7501C5.93622 15.2678 5.52421 15.6919 5.00652 15.7069L4.9751 15.7069C4.96582 15.7084 4.95725 15.7084 4.94797 15.7084L4.94797 15.7069Z" fill="#37bc12"/>
              <circle cx="32.5" cy="10.5" r="5.25" fill="#37bc12"/>
              <circle cx="10.5" cy="10.5" r="5.25" fill="#37bc12"/>
            </svg>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: 0 }}>EV Digital Twin</h1>
          </div>
          <div className="connvehicle-header-right">
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              >
                <span>newuser</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
              {dropdownOpen && (
                <div style={{
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
                  <div onClick={() => navigate('/')} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={require('../assets/car.png')} alt="Car" style={{ width: '16px', height: '16px' }} />
                    Connected Vehicles
                  </div>
                  <div onClick={() => navigate('/fleet')} style={{ padding: '10px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
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

        {/* VIN Header */}
        <div className="connvehicle-vin">
          <button className="connvehicle-back-btn" onClick={() => navigate('/')}>
            <span>←</span>
            <span>{displayVIN}</span>
          </button>
        </div>

        {/* Main Layout */}
        <div className="connvehicle-layout">
          {/* Left Panel */}
          <div className="connvehicle-left">
            {/* Main Container - Everything in one box */}
            <div className="connvehicle-box">
              <div className="connvehicle-version">Software Version ###</div>
              {/* Vehicle Metrics & Image */}
              <div className="connvehicle-metrics">
                <div className="connvehicle-metric">
                  <div className="connvehicle-metric-value">{metrics.speed}</div>
                  <div className="connvehicle-metric-label">Vehicle Speed</div>
                </div>
                <div className="connvehicle-metric">
                  <div className="connvehicle-metric-value">{metrics.accel}</div>
                  <div className="connvehicle-metric-label">Acceleration Rate</div>
                </div>
                <div className="connvehicle-metric">
                  <div className="connvehicle-metric-value">{metrics.throttle}</div>
                  <div className="connvehicle-metric-label">Throttle Position</div>
                </div>
                <div className="connvehicle-metric">
                  <div className="connvehicle-metric-value">{metrics.steering}</div>
                  <div className="connvehicle-metric-label">Steering Angle</div>
                </div>
              </div>
              <img 
                src={require('../assets/vehicledetail.png')} 
                alt="Vehicle" 
                className="connvehicle-vehicle-img"
              />

              {/* Safety Checks & Faults */}
              <div className="connvehicle-safety-row">
                <div className="connvehicle-safety-checks">
                  <div className="connvehicle-safety-title">Safety Checks</div>
                  <div className="connvehicle-safety-items">
                    <div className="connvehicle-safety-item">
                      <div className="connvehicle-safety-badge">Good</div>
                      <div className="connvehicle-safety-label">Electrical Isolation</div>
                    </div>
                    <div className="connvehicle-safety-item">
                      <div className="connvehicle-safety-badge">Good</div>
                      <div className="connvehicle-safety-label">CAN Bus Communication</div>
                    </div>
                    <div className="connvehicle-safety-item">
                      <div className="connvehicle-safety-badge">Good</div>
                      <div className="connvehicle-safety-label">Traction Control Status</div>
                    </div>
                    <div className="connvehicle-safety-item">
                      <div className="connvehicle-safety-badge">Good</div>
                      <div className="connvehicle-safety-label">DAS Status</div>
                    </div>
                  </div>
                </div>

                <div className="connvehicle-divider"></div>

                <div className="connvehicle-safety-checks">
                  <div className="connvehicle-safety-title">Faults</div>
                  <div className="connvehicle-fault-badge" style={{ backgroundColor: fault.includes('✅') ? '#00ff88' : '#ff4444', color: 'white' }}>{fault}</div>
                </div>

                <div className="connvehicle-motor-eff">
                  <img src={require('../assets/motor.png')} alt="Motor" style={{ width: '20px', height: '20px' }} />
                  <span>92%</span>
                  <div style={{ fontSize: window.innerWidth >= 1920 ? '16px' : '12px', opacity: 0.8 }}>Motor Efficiency</div>
                </div>
              </div>

              {/* Component Cards */}
              <div className="connvehicle-components">
              <div className="connvehicle-card" onClick={() => navigate(`/car/2T1BURHE8JC987654/battery`)}>
                <img src={require('../assets/battery.png')} alt="Battery" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                <div className="connvehicle-card-title">Battery</div>
                <div className="connvehicle-card-text">85% Charged</div>
              </div>
              <div className="connvehicle-card" onClick={() => navigate(`/car/2T1BURHE8JC987654/motor`)}>
                <img src={require('../assets/motor.png')} alt="Motor" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                <div className="connvehicle-card-title">Motor</div>
              </div>
              <div className="connvehicle-card" onClick={() => navigate(`/car/2T1BURHE8JC987654/tires`)}>
                <img src={require('../assets/icons/tireicon.png')} alt="Tires" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                <div className="connvehicle-card-title">Tires</div>
                <div className="connvehicle-card-error">{message}</div>
              </div>
              <div className="connvehicle-card" onClick={() => navigate(`/car/2T1BURHE8JC987654/invertor`)}>
                <img src={require('../assets/icons/invertoricon.png')} alt="Inverter" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                <div className="connvehicle-card-title">Inverter</div>
              </div>
              <div className="connvehicle-card" onClick={() => navigate(`/car/2T1BURHE8JC987654/energymanagement`)}>
                <img src={require('../assets/icons/energyicon.png')} alt="Energy" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                <div className="connvehicle-card-title">Energy Management</div>
              </div>
              <div className="connvehicle-card" onClick={() => navigate(`/car/2T1BURHE8JC987654/charger`)}>
                <img src={require('../assets/icons/chargericon.png')} alt="Charger" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                <div className="connvehicle-card-title">On-Board Chargers</div>
                <div className="connvehicle-card-text">Charger in use</div>
              </div>
            </div>
          </div>
          </div>

          {/* Right Panel - Individual Boxes */}
          <div className="connvehicle-right">
            {/* Powertrain & Energy */}
            <div className="connvehicle-right-box">
              <div className="connvehicle-right-title">Powertrain & Energy Management</div>
              <div className="connvehicle-energy-grid">
                <div className="connvehicle-energy-item">
                  <div className="connvehicle-energy-value">2.2mile/kWH</div>
                  <div className="connvehicle-energy-label">Energy Consumption</div>
                </div>
                <div className="connvehicle-energy-item">
                  <div className="connvehicle-energy-value">10%</div>
                  <div className="connvehicle-energy-label">Energy Regeneration</div>
                </div>
                <div className="connvehicle-energy-item">
                  <div className="connvehicle-energy-value">298 Miles</div>
                  <div className="connvehicle-energy-label">Range Estimation</div>
                </div>
                <div className="connvehicle-energy-item">
                  <div className="connvehicle-energy-value">72°F</div>
                  <div className="connvehicle-energy-label">Ambient Temperature</div>
                </div>
              </div>

              <div className="connvehicle-battery-box">
                <div className="connvehicle-right-title" style={{ marginBottom: '8px' }}>Battery Details</div>
                <div className="connvehicle-battery-soh">Battery SoH: 98.1%</div>
                <div className="connvehicle-battery-grid">
                  <div className="connvehicle-energy-item">
                    <div className="connvehicle-energy-value">72°F</div>
                    <div className="connvehicle-energy-label">Temperature</div>
                  </div>
                  <div className="connvehicle-energy-item">
                    <div className="connvehicle-energy-value">76</div>
                    <div className="connvehicle-energy-label">Voltage</div>
                  </div>
                  <div className="connvehicle-energy-item">
                    <div className="connvehicle-energy-value">42%</div>
                    <div className="connvehicle-energy-label">SoC</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification */}
            <div className="connvehicle-right-box">
              <div className="connvehicle-right-title">Notification</div>
            </div>

            {/* Service History */}
            <div className="connvehicle-right-box">
              <div className="connvehicle-right-title">
                Service History
                <span className="connvehicle-view-all">View All</span>
              </div>
              <div className="connvehicle-service-box">
                <h4>Schedule Service</h4>
                <p>Tire replacement recommended due to critical wear.</p>
                <p>Next available appointment, tomorrow @ 3pm.</p>
              </div>
            </div>

            {/* Sensor Health */}
            <div className="connvehicle-right-box">
              <div className="connvehicle-right-title">
                Sensor Health
                <span className="connvehicle-view-all">View All</span>
              </div>
            </div>

            {/* Past Error Codes */}
            <div className="connvehicle-right-box">
              <div className="connvehicle-right-title">
                Past Error Codes
                <span className="connvehicle-view-all">View All</span>
              </div>
              <div className="connvehicle-error-box">{error}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vehicle1ConnVehicle;
