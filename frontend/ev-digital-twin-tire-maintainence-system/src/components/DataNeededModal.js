import React from "react";
import "../css/dataneededmodal.css";

const MOTOR_DATA_POINTS = [
  { label: "Phase Currents", freq: "hourly min/max/avg" },
  { label: "Bus Voltage", freq: "hourly min/max/avg" },
  { label: "Motor Voltage", freq: "hourly min/max/avg" },
  { label: "RPM", freq: "10-minutes trend" },
  { label: "Torque Output", freq: "hourly" },
  { label: "Rotor Position", freq: "10-minute trend" },
  { label: "Motor Temperature", freq: "5 min avg." },
  { label: "Insulation Resistance", freq: "Once per hour" },
  { label: "Bearing Health", freq: "Daily" },
  { label: "Energy Consumption", freq: "10-minute trend" },
];

const TIRE_DATA_POINTS = [
  { label: "Tire Pressure", freq: "5-min" },
  { label: "Tire Temperature", freq: "5-min" },
  { label: "Tread Depth", freq: "Daily" },
  { label: "Wear Patterns", freq: "Daily" },
  { label: "Load Distribution", freq: "5-min" },
  { label: "Road Surface Conditions", freq: "event based" },
  { label: "Vibration/Frequency Signatures", freq: "event based" },
];

const DataNeededModal = ({ open, onClose, type = "motor" }) => {
  if (!open) return null;

  const dataPoints = type === "tire" ? TIRE_DATA_POINTS : MOTOR_DATA_POINTS;
  const title = type === "tire" ? "Tire" : "Motor";
  const description = type === "tire" ? "Tire monitoring and diagnostic data." : "Motor performance and diagnostic data.";

  return (
    <div className="data-modal-overlay">
      <div className="data-modal">
        <div className="data-modal-header">
          <span className="data-modal-title">{title}</span>
          <button className="data-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="data-modal-desc">
          {description}
        </div>
        <div className="data-modal-table">
          <div className="data-modal-table-header">
            <span>Data Point</span>
            <span>Frequency</span>
          </div>
          {dataPoints.map((row, idx) => (
            <div className="data-modal-table-row" key={idx}>
              <span>{row.label}</span>
              <span>{row.freq}</span>
            </div>
          ))}
        </div>
        <button className="data-modal-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default DataNeededModal;