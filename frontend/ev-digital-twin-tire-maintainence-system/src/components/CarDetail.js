import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const CarDetail = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Mock vehicle data based on carId
  const getVehicleData = (id) => {
    const vehicles = {
      1: { vin: 'number', battery: 85, status: 'charging', location: 'Station A' },
      2: { vin: 'number', battery: 15, status: 'low', location: 'Station B' },
      3: { vin: 'number', battery: 92, status: 'charging', location: 'Station C' },
      4: { vin: 'number', battery: 78, status: 'charging', location: 'Station D' },
      5: { vin: 'number', battery: 45, status: 'idle', location: 'Station E' }
    };
    return vehicles[id] || vehicles[1];
  };

  const vehicle = getVehicleData(carId);

  return (
    <div className="car-detail">
      <div className="car-detail-container">
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

      {/* VIN Header - Outside the container */}
      <div className="vin-header" style={{ margin: '30px 20px 20px' }}>
        <button 
          className="back-button"
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '0',
            margin: '0'
          }}
        >
          <span>←</span>
          <span>VIN {vehicle.vin}</span>
        </button>
      </div>

      <div className="detail-layout" style={{ margin: '-30px 20px 20px' }}>
        {/* Main Content Panel */}
        <div className="main-panel">
          {/* Vehicle Image and Metrics Section */}
          <div className="image-metrics-section">
            {/* Vehicle Metrics - Left Side */}
            <div className="vehicle-metrics">
              <div className="metric-item">
                <div className="metric-value">12 mph</div>
                <div className="metric-label">Vehicle Speed</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">2 m/s²</div>
                <div className="metric-label">Acceleration Rate</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">40%</div>
                <div className="metric-label">Throttle Position</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">54°</div>
                <div className="metric-label">Steering Angle</div>
              </div>
            </div>

            {/* Vehicle Image - Right Side */}
            <div className="vehicle-image-section">
              <img 
                src={require('./assets/vehicledetail.png')} 
                alt="Vehicle Detail" 
                className="vehicle-detail-image"
              />
            </div>
          </div>

          {/* Safety Checks */}
          <div className="safety-checks-section">
            <div className="safety-checks">
              <h3>Safety Checks</h3>
              <div className="safety-items">
                <div className="safety-item">
                  <div className="safety-status good">Good</div>
                  <div className="safety-label">Electrical Isolation</div>
                </div>
                <div className="safety-item">
                  <div className="safety-status good">Good</div>
                  <div className="safety-label">CAN Bus Communication</div>
                </div>
                <div className="safety-item">
                  <div className="safety-status good">Good</div>
                  <div className="safety-label">Traction Control Status</div>
                </div>
                <div className="safety-item">
                  <div className="safety-status good">Good</div>
                  <div className="safety-label">DAS Status</div>
                </div>
              </div>
            </div>
            <div className="section-divider"></div>
            <div className="faults-section">
              <h3>Faults</h3>
              <div className="fault-items">
                <div className="fault-item">
                  <div className="fault-status warning">Sensor Glitch</div>
                </div>
              </div>
            </div>
            <div className="motor-efficiency">
              <div className="metric-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={require('./assets/motor.png')} alt="Motor" style={{ width: '20px', height: '20px' }} />
                  <div className="metric-value">92%</div>
                </div>
                <div className="metric-label">Motor Efficiency</div>
              </div>
            </div>
          </div>

          <div className="spacer" style={{ height: window.innerWidth <= 1800 ? '10px' : 'auto' }}></div>

          {/* Component Status Cards */}
          <div className="component-status" style={{ marginTop: window.innerWidth <= 1800 ? '-50px' : '0' }}>
            <div className="component-card clickable" onClick={() => navigate(`/car/${carId}/battery`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-20px' }}>
                <img src={require('./assets/battery.png')} alt="Battery" style={{ width: '20px', height: '20px' }} />
                <h4 style={{ margin: 0 }}>Battery</h4>
              </div>
              <p style={{ marginTop: '15px' }}>{vehicle.battery}% Charged</p>
            </div>
            <div className="component-card clickable" onClick={() => navigate(`/car/${carId}/motor`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-20px' }}>
                <img src={require('./assets/motor.png')} alt="Motor" style={{ width: '20px', height: '20px' }} />
                <h4 style={{ margin: 0 }}>Motor</h4>
              </div>
              <p className="error-text" style={{ marginTop: '15px' }}>Phase currents are imbalanced</p>
            </div>
            <div className="component-card clickable" onClick={() => navigate(`/car/${carId}/tires`)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '-20px' }}>
                <img src={require('./assets/icons/tireicon.png')} alt="Tires" style={{ width: '20px', height: '20px' }} />
                <h4 style={{ margin: 0 }}>Tires</h4>
              </div>
            </div>
            <div className="component-card clickable" onClick={() => navigate(`/car/${carId}/invertor`)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '-20px' }}>
                <img src={require('./assets/icons/invertoricon.png')} alt="Inverter" style={{ width: '20px', height: '20px' }} />
                <h4 style={{ margin: 0 }}>Inverter</h4>
              </div>
            </div>
            <div className="component-card clickable" onClick={() => navigate(`/car/${carId}/energymanagement`)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '-20px' }}>
                <img src={require('./assets/icons/energyicon.png')} alt="Energy Management" style={{ width: '20px', height: '20px' }} />
                <h4 style={{ margin: 0 }}>Energy Management</h4>
              </div>
            </div>
            <div className="component-card clickable" onClick={() => navigate(`/car/${carId}/charger`)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '-20px' }}>
                <img src={require('./assets/icons/chargericon.png')} alt="On-Board Chargers" style={{ width: '20px', height: '20px' }} />
                <h4 style={{ margin: 0 }}>On-Board Chargers</h4>
              </div>
              <p style={{ marginTop: '15px' }}>Charger in use</p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          {/* Powertrain & Energy Management Box */}
          <div className="panel-section">
            <h3>Powertrain & Energy Management</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '8px 0' }}>
              <div className="energy-item">
                <div className="energy-value">2.4mile/kWH</div>
                <div className="energy-label">Energy Consumption</div>
              </div>
              <div className="energy-item">
                <div className="energy-value">10%</div>
                <div className="energy-label">Energy Regeneration</div>
              </div>
              <div className="energy-item">
                <div className="energy-value">315 Miles</div>
                <div className="energy-label">Range Estimation</div>
              </div>
              <div className="energy-item">
                <div className="energy-value">78°F</div>
                <div className="energy-label">Ambient Temperature</div>
              </div>
            </div>
            
            {/* Battery Details */}
            <div style={{ border: '0.5px solid #545b64', padding: '8px', marginTop: '12px' }}>
              <h3 style={{ margin: '0 0 8px 0' }}>Battery Details</h3>
              <div className="battery-soh" style={{ marginBottom: '8px' }}>Battery SoH: 98.1%</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div className="battery-item">
                  <div className="battery-value">78°F</div>
                  <div className="battery-label">Temperature</div>
                </div>
                <div className="battery-item">
                  <div className="battery-value">78</div>
                  <div className="battery-label">Voltage</div>
                </div>
                <div className="battery-item">
                  <div className="battery-value">42%</div>
                  <div className="battery-label">SoC</div>
                </div>
              </div>
            </div>

            {/* Notification */}
            <h3>Notification</h3>
          </div>

          {/* Service History */}
          <div className="panel-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Service History</h3>
              <span style={{ color: '#ff9900', fontSize: '12px', cursor: 'pointer' }}>View All</span>
            </div>
            <div className="schedule-service-box">
              <h4>Schedule Service</h4>
              <p>Schedule a service to fix the charging port.</p>
              <p>Next available appointment, tomorrow @ 3pm.</p>
            </div>
          </div>

          {/* Sensor Health */}
          <div className="panel-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Sensor Health</h3>
              <span style={{ color: '#ff9900', fontSize: '12px', cursor: 'pointer' }}>View All</span>
            </div>
          </div>

          {/* Past Error Codes */}
          <div className="panel-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Past Error Codes</h3>
              <span style={{ color: '#ff9900', fontSize: '12px', cursor: 'pointer' }}>View All</span>
            </div>
            <div className="error-code-box">
              <p>U1002</p>
            </div>
          </div>
        </div>
      </div>

      {/* Software Version */}
      <div className="software-version">
        Software Version ###
      </div>
      </div>
    </div>
  );
};

export default CarDetail;