import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [evData, setEvData] = useState({
    battery: 75,
    speed: 45,
    temperature: 22,
    range: 180,
    charging: false
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setEvData(prev => ({
        ...prev,
        battery: Math.max(0, prev.battery + (Math.random() - 0.5) * 2),
        speed: Math.max(0, prev.speed + (Math.random() - 0.5) * 10),
        temperature: prev.temperature + (Math.random() - 0.5) * 2
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-grid">
      <div className="card">
        <h3>Battery Status</h3>
        <div className="metric">
          <span>Charge Level</span>
          <span className="metric-value">{evData.battery.toFixed(1)}%</span>
        </div>
        <div className="battery-bar">
          <div 
            className="battery-fill" 
            style={{ width: `${evData.battery}%` }}
          />
        </div>
        <div className="metric">
          <span>Status</span>
          <span>{evData.charging ? 'Charging' : 'Discharging'}</span>
        </div>
      </div>

      <div className="card">
        <h3>Vehicle Status</h3>
        <div className="metric">
          <span>Speed</span>
          <span className="metric-value">{evData.speed.toFixed(0)} km/h</span>
        </div>
        <div className="metric">
          <span>Range</span>
          <span className="metric-value">{evData.range} km</span>
        </div>
      </div>

      <div className="card">
        <h3>Temperature</h3>
        <div className="metric">
          <span>Battery Temp</span>
          <span className="metric-value">{evData.temperature.toFixed(1)}°C</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;