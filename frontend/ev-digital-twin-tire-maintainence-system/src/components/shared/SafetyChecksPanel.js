import React from 'react';

const SafetyChecksPanel = ({ safetyStatuses, fault, motorEfficiency }) => {
  return (
    <div className="connvehicle-safety-row">
      <div className="connvehicle-safety-checks">
        <div className="connvehicle-safety-title">Safety Checks</div>
        <div className="connvehicle-safety-items">
          <div className="connvehicle-safety-item">
            <div className={`connvehicle-safety-badge ${safetyStatuses.electrical === 'Good' ? '' : safetyStatuses.electrical === 'Warning' ? 'warning' : 'error'}`}>
              {safetyStatuses.electrical}
            </div>
            <div className="connvehicle-safety-label">Electrical Isolation</div>
          </div>
          <div className="connvehicle-safety-item">
            <div className={`connvehicle-safety-badge ${safetyStatuses.canBus === 'Good' ? '' : safetyStatuses.canBus === 'Warning' ? 'warning' : 'error'}`}>
              {safetyStatuses.canBus}
            </div>
            <div className="connvehicle-safety-label">CAN Bus Communication</div>
          </div>
          <div className="connvehicle-safety-item">
            <div className={`connvehicle-safety-badge ${safetyStatuses.traction === 'Good' ? '' : safetyStatuses.traction === 'Warning' ? 'warning' : 'error'}`}>
              {safetyStatuses.traction}
            </div>
            <div className="connvehicle-safety-label">Traction Control Status</div>
          </div>
          <div className="connvehicle-safety-item">
            <div className={`connvehicle-safety-badge ${safetyStatuses.das === 'Good' ? '' : safetyStatuses.das === 'Warning' ? 'warning' : 'error'}`}>
              {safetyStatuses.das}
            </div>
            <div className="connvehicle-safety-label">DAS Status</div>
          </div>
        </div>
      </div>

      <div className="connvehicle-divider"></div>

      <div className="connvehicle-safety-checks">
        <div className="connvehicle-safety-title">Faults</div>
        <div className="connvehicle-fault-badge" style={{ 
          backgroundColor: fault.includes('✅') ? '#00ff88' : fault.includes('🚨') ? '#ff4444' : '#ff9900', 
          color: 'white' 
        }}>
          {fault}
        </div>
      </div>

      <div className="connvehicle-motor-eff">
        <span style={{ fontSize: '20px' }}>⚙️</span>
        <span>{motorEfficiency}%</span>
        <div style={{ fontSize: window.innerWidth >= 1920 ? '16px' : '12px', opacity: 0.8 }}>Motor Efficiency</div>
      </div>
    </div>
  );
};

export default SafetyChecksPanel;
