import React from 'react';
import { useNavigate } from 'react-router-dom';
import './fleet.css';
import fleetMapImage from './images/fleetmap.png';

const FleetMgmt = () => {
  const navigate = useNavigate();

  // Sample fleet data with regions (using percentages for responsive positioning)
  const regions = [
    { id: 1, x: '22%', y: '31%', count: 10 },
    { id: 2, x: '42%', y: '48%', count: 42 },
    { id: 3, x: '59%', y: '75%', count: 23 },
    { id: 4, x: '16%', y: '79%', count: 15 },
    { id: 5, x: '80%', y: '33%', count: 13 },
    { id: 6, x: '84%', y: '64%', count: 54 }
  ];

  // Total fleet count
  const totalFleet = regions.reduce((sum, region) => sum + region.count, 0);

  const handleRegionClick = (regionId) => {
    // Navigate to fleet portal
    navigate('/fleet/portal');
  };

  return (
    <div className="fleet-management">
      <header className="header">
        <div className="header-left">
          <svg width="43px" height="20px" viewBox="0 0 43 20" style={{ marginRight: '8px' }}>
            <path d="M4.94797 15.7069C4.9294 15.7069 4.91155 15.7069 4.89299 15.7055L2.88435 15.5905C2.10174 15.5834 1.42482 15.3042 0.924977 14.7815C-0.045425 13.7661 -0.00543786 12.2002 0.00241676 12.0245C0.0452601 11.0727 0.283755 10.3158 0.712903 9.77598C0.742179 9.73885 0.771455 9.70458 0.800732 9.67102C0.692195 8.92483 1.01209 8.46426 1.09492 8.3593C1.11634 8.33288 1.13848 8.30717 1.16276 8.28289C2.7958 6.61986 7.60712 5.66159 10.3298 5.23887C11.2152 5.10106 12.07 4.87042 12.8711 4.55266C14.0008 4.10352 15.3054 3.43659 16.45 2.72182C18.3144 1.55791 20.3494 0.773878 22.4995 0.393286C25.1943 -0.0844178 33.9429 -0.0251512 38.9178 0.0526809C41.1885 0.0883838 43.0357 1.96492 43.0357 4.23562C43.0357 6.50632 41.1592 8.41928 38.8521 8.41928L31.7686 8.41928C31.2402 8.41928 30.8111 7.99084 30.8111 7.46173C30.8111 6.93261 31.2395 6.50418 31.7686 6.50418L38.8521 6.50418C40.1031 6.50418 41.1206 5.48665 41.1206 4.23562C41.1206 2.9846 40.1188 1.98635 38.8878 1.96707C30.5383 1.83639 24.6866 1.94993 22.8336 2.27839C20.9264 2.61614 19.1198 3.31163 17.4639 4.34559C16.7363 4.79973 15.2647 5.66159 13.5773 6.33209C12.6434 6.70269 11.6501 6.97117 10.624 7.13041C6.82094 7.72164 3.7862 8.62136 2.71155 9.46323C2.72297 9.50179 2.74082 9.55248 2.77081 9.61532C2.8922 9.87024 2.89434 10.1659 2.77724 10.4229C2.67441 10.6486 2.48805 10.8249 2.26026 10.9156C2.16601 10.992 1.95036 11.3255 1.91537 12.1109C1.90752 12.343 1.96321 13.1021 2.31167 13.4619C2.40093 13.5541 2.56017 13.6769 2.91434 13.6769C2.9329 13.6769 2.95075 13.6769 2.96932 13.6783L4.11895 13.744C4.58951 11.3291 6.72169 9.50036 9.27158 9.50036C11.8215 9.50036 13.8644 11.2327 14.3928 13.5862L32.8526 13.1813C33.1403 12.2623 33.6802 11.4319 34.4164 10.7907C35.3718 9.95878 36.5957 9.50036 37.8638 9.50036C40.3759 9.50036 42.5437 11.2884 43.0186 13.7526C43.1186 14.2717 42.7787 14.7737 42.2595 14.8736C41.7404 14.9736 41.2384 14.6337 41.1385 14.1146C40.8371 12.5508 39.4604 11.4155 37.8638 11.4155C36.2672 11.4155 34.8012 12.6393 34.5634 14.2617C34.4956 14.7237 34.1043 15.07 33.6373 15.08L13.5809 15.5199C13.0604 15.5341 12.6262 15.1243 12.6034 14.6037C12.5262 12.8157 11.0631 11.4155 9.27158 11.4155C7.48001 11.4155 5.93694 12.9114 5.93622 14.7501C5.93622 15.2678 5.52421 15.6919 5.00652 15.7069L4.9751 15.7069C4.96582 15.7084 4.95725 15.7084 4.94797 15.7084L4.94797 15.7069Z" fill="#37bc12"/>
            <circle cx="32.5" cy="10.5" r="5.25" fill="#37bc12"/>
            <circle cx="10.5" cy="10.5" r="5.25" fill="#37bc12"/>
          </svg>
          <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'Amazon Ember' }}>Fleet Management Portal</h1>
        </div>
        <div className="header-right">
          <span className="user-profile">bhuser</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      </header>

      <div className="map-container" style={{ marginTop: '-10px' }}>
        <div className="map-background">
          <img src={fleetMapImage} alt="Fleet Map" className="map-image" />
          {regions.map((region) => (
            <div
              key={region.id}
              className="region-marker"
              style={{
                left: region.x,
                top: region.y
              }}
              onClick={() => handleRegionClick(region.id)}
            >
              <div className="region-pulse"></div>
              <div className="region-count">{region.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="map-legend" style={{ background: '#333740' }}>
        <h3>Vehicles in Fleet</h3>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '40px 0 0 10px' }}>Click on region to view fleet details</p>
        <div className="legend-item" style={{ position: 'absolute', top: '1px', right: '0px', background: '#1b1e20', padding: '16px 50px 16px 32px', borderRadius: '4px', height: '98px', width: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="legend-label">Total Vehicles</div>
          <div className="legend-count">{totalFleet.toString().padStart(3, '0')}</div>
        </div>

      </div>
    </div>
  );
};

export default FleetMgmt;
