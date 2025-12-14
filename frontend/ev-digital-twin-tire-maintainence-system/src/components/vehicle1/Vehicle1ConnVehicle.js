import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import VehicleHeader from '../shared/VehicleHeader';
import SafetyChecksPanel from '../shared/SafetyChecksPanel';
import '../../css/connvehicle.css';

const Vehicle1ConnVehicle = () => {
  const navigate = useNavigate();
  const [tireData, setTireData] = useState(null);
  const [, setDataIndex] = useState(0);
  const [, setTick] = useState(0);

  const displayVIN = '2T1BURHE8JC987654';

  useEffect(() => {
    Papa.parse('/tire_wear_data.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const vehicle1Data = results.data
          .filter(row => row.vehicle_id === '2T1BURHE8JC987654' || row.vin === 'EV-1001')
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Get latest data for ALL tire positions
        if (vehicle1Data.length > 0) {
          const latestDate = vehicle1Data[vehicle1Data.length - 1]?.date;
          const allPositions = vehicle1Data.filter(row => row.date === latestDate);
          setTireData(allPositions);
        }
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

  // Update metrics every 2 seconds for dynamic feel
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Get worst tire status across all positions
  const getWorstTireStatus = () => {
    if (!tireData || tireData.length === 0) {
      return { tread: 11, pressure: 32, anomaly: null, pattern: 'city' };
    }
    
    const worstTread = Math.min(...tireData.map(t => parseFloat(t.tread_depth_mm) || 11));
    const worstPressure = Math.min(...tireData.map(t => parseFloat(t.pressure_psi) || 32));
    const criticalAnomaly = tireData.find(t => t.anomaly_type === 'puncture' || t.anomaly_type === 'uneven_wear');
    const pattern = tireData[0]?.driving_pattern || 'city';
    
    return {
      tread: worstTread,
      pressure: worstPressure,
      anomaly: criticalAnomaly?.anomaly_type || null,
      pattern: pattern
    };
  };

  const worstStatus = getWorstTireStatus();
  const tread = worstStatus.tread;
  const pressure = worstStatus.pressure;
  const anomaly = worstStatus.anomaly;
  const pattern = worstStatus.pattern;

  const getMetrics = () => {
    if (!tireData) return { speed: '12 mph', accel: '2 m/s²', throttle: '40%', steering: '54°' };
    
    let base = pattern === 'city' ? [30, 2.0, 40, 50] : pattern === 'highway' ? [70, 0.8, 70, 10] : [50, 1.5, 55, 30];
    let mod = anomaly === 'puncture' ? [0.3, 0.2, 0.3, 2.5] : tread < 3 ? [0.4, 0.3, 0.4, 2.0] : tread < 4 ? [0.6, 0.5, 0.6, 1.5] : tread < 6 ? [0.8, 0.7, 0.8, 1.2] : anomaly === 'irregular_wear' ? [0.7, 0.6, 0.7, 1.4] : [1, 1, 1, 1];
    if (pressure < 28) mod = mod.map((v, i) => i < 3 ? v * 0.7 : v * 1.3);
    
    // Add time-based variation to make metrics feel more dynamic
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

  const getFault = () => {
    if (!tireData) return '⚠️ Uneven Tire Wear - Check Alignment';
    if (anomaly === 'puncture') return '🚨 Tire Puncture Detected';
    if (anomaly === 'uneven_wear') return '⚠️ Uneven Tire Wear - Check Alignment';
    if (tread < 4) return '⚠️ Uneven Tire Wear - Check Alignment';
    if (pressure < 28) return '⚠️ Low Tire Pressure';
    if (anomaly === 'irregular_wear') return '⚠️ Uneven Tire Wear - Check Alignment';
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
    if (!tireData) return 'Uneven tire wear - alignment check needed';
    if (anomaly === 'puncture') return 'Puncture detected - immediate service required';
    if (anomaly === 'uneven_wear') return 'Uneven tire wear - alignment check needed';
    if (tread < 3) return 'Tread depth critically low - replace immediately';
    if (tread < 4) return 'Uneven tire wear - alignment check needed';
    if (pressure < 28) return 'Tire pressure critically low';
    if (anomaly === 'irregular_wear') return 'Uneven tire wear - alignment check needed';
    if (tread < 6) return 'Tire tread approaching replacement threshold';
    return 'All tires within normal parameters';
  };

  const getSafetyStatuses = () => {
    return {
      electrical: 'Good',
      canBus: 'Good',
      traction: 'Good',
      das: 'Good'
    };
  };

  const metrics = getMetrics();
  const fault = getFault();
  const error = getError();
  const message = getMessage();
  const safetyStatuses = getSafetyStatuses();

  return (
    <div className="connvehicle-page">
      <div className="connvehicle-container">
        {/* NEW: Using shared header component */}
        <VehicleHeader onNavigate={navigate} />

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
              <SafetyChecksPanel 
                safetyStatuses={safetyStatuses} 
                fault={fault} 
                motorEfficiency={98} 
              />

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
                <div className="connvehicle-card-error" style={{ color: message.includes('Puncture') || message.includes('critically low') ? '#ff4444' : '#ff9900' }}>{message}</div>
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
