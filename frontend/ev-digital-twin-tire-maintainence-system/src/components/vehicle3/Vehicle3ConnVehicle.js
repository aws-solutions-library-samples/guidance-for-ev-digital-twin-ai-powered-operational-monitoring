import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import VehicleHeader from '../shared/VehicleHeader';
import SafetyChecksPanel from '../shared/SafetyChecksPanel';
import '../../css/connvehicle.css';

const Vehicle3ConnVehicle = () => {
  const navigate = useNavigate();
  const [inverterData, setInverterData] = useState(null);
  const [, setTick] = useState(0);

  const currentVIN = '3VWDX7AJ9DM456321';

  // Load inverter data on mount - SYNCED with Vehicle3Inverter.js
  useEffect(() => {
    Papa.parse('/inverter_sensor_data.csv', {
      download: true,
      header: true,
      complete: (results) => {
        // Filter to match Vehicle3Inverter.js: vehicle_id === '3VWDX7AJ9DM456321'
        const vehicleData = results.data.filter(row => row.vehicle_id === '3VWDX7AJ9DM456321');
        if (vehicleData.length > 0) {
          // Use latest data to match Vehicle3Inverter behavior
          const latestData = vehicleData[vehicleData.length - 1];
          setInverterData(latestData);
        }
      }
    });
  }, []);

  // Update metrics every 2 seconds for dynamic feel
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Calculate dynamic metrics based on inverter data
  const getMetrics = () => {
    if (!inverterData) return { speed: '12 mph', accel: '2 m/s²', throttle: '40%', steering: '54°' };
    
    const temp = parseFloat(inverterData.inverter_temp_c) || 65;
    const dcVoltage = parseFloat(inverterData.dc_link_voltage_v) || 400;
    const efficiency = parseFloat(inverterData.efficiency_percent) || 95;
    
    // Base values for normal inverter operation
    let base = [40, 1.3, 45, 25]; // [speed, accel, throttle, steering]
    
    // Modify based on inverter conditions
    let mod = [1, 1, 1, 1];
    if (temp > 75) mod = [0.75, 0.7, 0.75, 1.15]; // Overheating
    else if (temp > 70) mod = [0.9, 0.85, 0.9, 1.08];
    if (dcVoltage < 380 || dcVoltage > 420) mod = mod.map((v, i) => i < 3 ? v * 0.85 : v * 1.2); // Voltage issues
    if (efficiency < 90) mod = mod.map(v => v * 0.8); // Low efficiency
    
    // Add time-based variation
    const now = Date.now();
    const timeVariation = Math.sin(now / 5000) * 0.15 + 1;
    const steeringVariation = Math.sin(now / 3000) * 15;
    
    return {
      speed: Math.round(base[0] * mod[0] * timeVariation) + ' mph',
      accel: (base[1] * mod[1] * timeVariation).toFixed(1) + ' m/s²',
      throttle: Math.round(base[2] * mod[2] * timeVariation) + '%',
      steering: Math.round(base[3] * mod[3] + steeringVariation) + '°'
    };
  };

  // Calculate safety statuses based on inverter conditions
  const getSafetyStatuses = () => {
    return {
      electrical: 'Good',
      canBus: 'Good',
      traction: 'Good',
      das: 'Good'
    };
  };

  const safetyStatuses = getSafetyStatuses();
  const metrics = getMetrics();

  return (
    <div className="connvehicle-page">
      <div className="connvehicle-container">
        {/* NEW: Using shared header component */}
        <VehicleHeader onNavigate={navigate} />

        {/* VIN Header */}
        <div className="connvehicle-vin">
          <button className="connvehicle-back-btn" onClick={() => navigate('/')}>
            <span>←</span>
            <span>{currentVIN}</span>
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
              <SafetyChecksPanel 
                safetyStatuses={safetyStatuses} 
                fault="⚡ Inverter Fault I002" 
                motorEfficiency={92} 
              />

              {/* Component Cards */}
              <div className="connvehicle-components">
              <div className="connvehicle-card" onClick={() => navigate(`/car/3VWDX7AJ9DM456321/battery`)}>
                <img src={require('../assets/battery.png')} alt="Battery" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                <div className="connvehicle-card-title">Battery</div>
                <div className="connvehicle-card-text">85% Charged</div>
              </div>
              <div className="connvehicle-card" onClick={() => navigate(`/car/3VWDX7AJ9DM456321/motor`)}>
                <img src={require('../assets/motor.png')} alt="Motor" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                <div className="connvehicle-card-title">Motor</div>
              </div>
              <div className="connvehicle-card" onClick={() => navigate(`/car/3VWDX7AJ9DM456321/tires`)}>
                <img src={require('../assets/icons/tireicon.png')} alt="Tires" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                <div className="connvehicle-card-title">Tires</div>
              </div>
              <div className="connvehicle-card" onClick={() => navigate(`/car/3VWDX7AJ9DM456321/invertor`)}>
                <img src={require('../assets/icons/invertoricon.png')} alt="Inverter" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                <div className="connvehicle-card-title">Inverter</div>
                <div className="connvehicle-card-error">⚠️ DC voltage fluctuation detected</div>
              </div>
              <div className="connvehicle-card" onClick={() => navigate(`/car/3VWDX7AJ9DM456321/energymanagement`)}>
                <img src={require('../assets/icons/energyicon.png')} alt="Energy" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                <div className="connvehicle-card-title">Energy Management</div>
              </div>
              <div className="connvehicle-card" onClick={() => navigate(`/car/3VWDX7AJ9DM456321/charger`)}>
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
                  <div className="connvehicle-energy-value">2.3mile/kWH</div>
                  <div className="connvehicle-energy-label">Energy Consumption</div>
                </div>
                <div className="connvehicle-energy-item">
                  <div className="connvehicle-energy-value">6%</div>
                  <div className="connvehicle-energy-label">Energy Regeneration</div>
                </div>
                <div className="connvehicle-energy-item">
                  <div className="connvehicle-energy-value">305 Miles</div>
                  <div className="connvehicle-energy-label">Range Estimation</div>
                </div>
                <div className="connvehicle-energy-item">
                  <div className="connvehicle-energy-value">75°F</div>
                  <div className="connvehicle-energy-label">Ambient Temperature</div>
                </div>
              </div>

              <div className="connvehicle-battery-box">
                <div className="connvehicle-right-title" style={{ marginBottom: '8px' }}>Battery Details</div>
                <div className="connvehicle-battery-soh">Battery SoH: 98.1%</div>
                <div className="connvehicle-battery-grid">
                  <div className="connvehicle-energy-item">
                    <div className="connvehicle-energy-value">75°F</div>
                    <div className="connvehicle-energy-label">Temperature</div>
                  </div>
                  <div className="connvehicle-energy-item">
                    <div className="connvehicle-energy-value">72</div>
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
                <p>Inverter diagnostics and voltage stabilization needed.</p>
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
              <div className="connvehicle-error-box">U1002</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vehicle3ConnVehicle;
