import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MapView = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const vehicles = [
    { id: 1, x: 871, y: 121, status: 'charging', battery: 85 },
    { id: 2, x: 979, y: 532, status: 'low', battery: 15 },
    { id: 3, x: 772, y: 233, status: 'charging', battery: 92 },
    { id: 4, x: 1261, y: 384, status: 'charging', battery: 78 },
    { id: 5, x: 1156, y: 564, status: 'idle', battery: 45 }
  ];

  const getMarkerColor = (status) => {
    switch(status) {
      case 'charging': return '#4CAF50';
      case 'low': return '#DD9436';
      case 'idle': return '#474B54';
      default: return '#474B54';
    }
  };

  const handleVehicleClick = (vehicleId) => {
    navigate(`/car/${vehicleId}`);
  };

  return (
    <div className="map-page">
      <div className="map-container-wrapper">
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
                <span className="user-profile">bhuser</span>
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
        <div className="map-container">
      <div className="map-background">
        <svg width="100%" height="100%" viewBox="0 0 1400 744" className="map-svg">
          {/* Map background */}
          <image href={require('./assets/map.png')} x="0" y="0" width="1400" height="744" preserveAspectRatio="xMidYMid slice"/>
          
          {/* Vehicle markers */}
          {vehicles.map(vehicle => (
            <g key={vehicle.id} style={{ cursor: 'pointer' }} onClick={() => handleVehicleClick(vehicle.id)} transform={`scale(1.5)`}>
              <path
                d={`M${vehicle.x/1.5 + 29.0858} ${vehicle.y/1.5 + 7.43978} C${vehicle.x/1.5 + 26.2026} ${vehicle.y/1.5 + 2.7813} ${vehicle.x/1.5 + 21.2072} ${vehicle.y/1.5} ${vehicle.x/1.5 + 15.7231} ${vehicle.y/1.5} C${vehicle.x/1.5 + 10.2389} ${vehicle.y/1.5} ${vehicle.x/1.5 + 5.24293} ${vehicle.y/1.5 + 2.7813} ${vehicle.x/1.5 + 2.36034} ${vehicle.y/1.5 + 7.43978} C${vehicle.x/1.5 - 0.522865} ${vehicle.y/1.5 + 12.0989} ${vehicle.x/1.5 - 0.779876} ${vehicle.y/1.5 + 17.8043} ${vehicle.x/1.5 + 1.67313} ${vehicle.y/1.5 + 22.7021} L${vehicle.x/1.5 + 15.1702} ${vehicle.y/1.5 + 49.6584} C${vehicle.x/1.5 + 15.2768} ${vehicle.y/1.5 + 49.872} ${vehicle.x/1.5 + 15.4845} ${vehicle.y/1.5 + 50} ${vehicle.x/1.5 + 15.7237} ${vehicle.y/1.5 + 50} C${vehicle.x/1.5 + 15.9628} ${vehicle.y/1.5 + 50} ${vehicle.x/1.5 + 16.1699} ${vehicle.y/1.5 + 49.872} ${vehicle.x/1.5 + 16.2771} ${vehicle.y/1.5 + 49.6584} L${vehicle.x/1.5 + 29.7736} ${vehicle.y/1.5 + 22.7021} C${vehicle.x/1.5 + 32.226} ${vehicle.y/1.5 + 17.8043} ${vehicle.x/1.5 + 31.969} ${vehicle.y/1.5 + 12.0983} ${vehicle.x/1.5 + 29.0864} ${vehicle.y/1.5 + 7.43978} L${vehicle.x/1.5 + 29.0858} ${vehicle.y/1.5 + 7.43978} Z`}
                fill={getMarkerColor(vehicle.status)}
              />
              {/* Car icon inside marker */}
              <g transform={`translate(${vehicle.x/1.5 + 7.7}, ${vehicle.y/1.5 + 8})`}>
                <path
                  d="M1.23075 12L1.23075 13.5C1.23075 13.6417 1.18283 13.7604 1.087 13.8562C0.991167 13.9521 0.872417 14 0.73075 14L0.5 14C0.358333 14 0.239583 13.9521 0.14375 13.8562C0.0479167 13.7604 0 13.6417 0 13.5L0 6.15375L1.9845 0.5C2.03333 0.341 2.12725 0.217916 2.26625 0.13075C2.40542 0.0435828 2.56025 0 2.73075 0L13.3462 0C13.4976 0 13.635 0.0458333 13.7585 0.1375C13.882 0.229167 13.9677 0.35 14.0155 0.5L16 6.15375L16 13.5C16 13.6417 15.9521 13.7604 15.8562 13.8562C15.7604 13.9521 15.6417 14 15.5 14L15.2693 14C15.1276 14 15.0088 13.9521 14.913 13.8562C14.8172 13.7604 14.7693 13.6417 14.7693 13.5L14.7693 12L1.23075 12ZM1.4155 5.15375L14.5845 5.15375L13.1115 1L2.8885 1L1.4155 5.15375ZM3.4275 9.69225C3.73867 9.69225 4.00158 9.58342 4.21625 9.36575C4.43108 9.14792 4.5385 8.8835 4.5385 8.5725C4.5385 8.26133 4.42958 7.99842 4.21175 7.78375C3.99408 7.56892 3.72967 7.4615 3.4185 7.4615C3.1075 7.4615 2.84458 7.57042 2.62975 7.78825C2.41508 8.00592 2.30775 8.27033 2.30775 8.5815C2.30775 8.8925 2.41658 9.15542 2.63425 9.37025C2.85208 9.58492 3.1165 9.69225 3.4275 9.69225ZM12.5815 9.69225C12.8925 9.69225 13.1554 9.58342 13.3702 9.36575C13.5849 9.14792 13.6923 8.8835 13.6923 8.5725C13.6923 8.26133 13.5834 7.99842 13.3658 7.78375C13.1479 7.56892 12.8835 7.4615 12.5725 7.4615C12.2613 7.4615 11.9984 7.57042 11.7837 7.78825C11.5689 8.00592 11.4615 8.27033 11.4615 8.5815C11.4615 8.8925 11.5704 9.15542 11.7883 9.37025C12.0059 9.58492 12.2703 9.69225 12.5815 9.69225ZM1 11L15 11L15 6.15375L1 6.15375L1 11Z"
                  fill="white"
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            </g>
          ))}
        </svg>
      </div>
      
      <div className="map-legend" style={{ background: '#333740' }}>
        <h3>Connected Vehicles</h3>
        <div className="legend-item" style={{ position: 'absolute', top: '1px', right: '-40px', background: '#1b1e20', padding: '16px 50px 16px 32px', borderRadius: '4px', height: '98px', width: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="legend-label">Total Vehicles</div>
          <div className="legend-count">0{vehicles.length}</div>
        </div>
        <div className="legend-items">
          <div className="legend-item" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
            <svg className="legend-marker" viewBox="0 0 31.45 50" style={{ width: '16px', height: '25px' }}>
              <path d="M29.0858 7.43978 C26.2026 2.7813 21.2072 0 15.7231 0 C10.2389 0 5.24293 2.7813 2.36034 7.43978 C-0.522865 12.0989 -0.779876 17.8043 1.67313 22.7021 L15.1702 49.6584 C15.2768 49.872 15.4845 50 15.7237 50 C15.9628 50 16.1699 49.872 16.2771 49.6584 L29.7736 22.7021 C32.226 17.8043 31.969 12.0983 29.0864 7.43978 L29.0858 7.43978 Z" fill="#4CAF50"/>
            </svg>
            <div>
              <div className="legend-label">Charging</div>
              <div className="legend-count">03</div>
            </div>
          </div>
          <div className="legend-item" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
            <svg className="legend-marker" viewBox="0 0 31.45 50" style={{ width: '16px', height: '25px' }}>
              <path d="M29.0858 7.43978 C26.2026 2.7813 21.2072 0 15.7231 0 C10.2389 0 5.24293 2.7813 2.36034 7.43978 C-0.522865 12.0989 -0.779876 17.8043 1.67313 22.7021 L15.1702 49.6584 C15.2768 49.872 15.4845 50 15.7237 50 C15.9628 50 16.1699 49.872 16.2771 49.6584 L29.7736 22.7021 C32.226 17.8043 31.969 12.0983 29.0864 7.43978 L29.0858 7.43978 Z" fill="#DD9436"/>
            </svg>
            <div>
              <div className="legend-label">Below 20%</div>
              <div className="legend-count">01</div>
            </div>
          </div>
          <div className="legend-item" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
            <svg className="legend-marker" viewBox="0 0 31.45 50" style={{ width: '16px', height: '25px' }}>
              <path d="M29.0858 7.43978 C26.2026 2.7813 21.2072 0 15.7231 0 C10.2389 0 5.24293 2.7813 2.36034 7.43978 C-0.522865 12.0989 -0.779876 17.8043 1.67313 22.7021 L15.1702 49.6584 C15.2768 49.872 15.4845 50 15.7237 50 C15.9628 50 16.1699 49.872 16.2771 49.6584 L29.7736 22.7021 C32.226 17.8043 31.969 12.0983 29.0864 7.43978 L29.0858 7.43978 Z" fill="#474B54"/>
            </svg>
            <div>
              <div className="legend-label">Not Charging</div>
              <div className="legend-count">01</div>
            </div>
          </div>

        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;