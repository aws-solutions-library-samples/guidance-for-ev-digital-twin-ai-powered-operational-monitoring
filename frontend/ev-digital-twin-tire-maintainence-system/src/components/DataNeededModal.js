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
  { label: "Tread Depth", freq: "AI Derived Value" },
  { label: "Wear Patterns", freq: "AI Derived Value" },
  { label: "Load Distribution", freq: "5-min" },
  { label: "Road Surface Conditions", freq: "event based" },
  { label: "Vibration/Frequency Signatures", freq: "event based" },
];

const INVERTER_DATA_POINTS = [
  { label: "Input Voltage (DC Voltage)", freq: "5-min trends" },
  { label: "Input Current (DC Current)", freq: "hourly" },
  { label: "Output Voltage (AC Voltage)", freq: "hourly" },
  { label: "Output Current (AC Current)", freq: "hourly" },
  { label: "Inverter Temperature", freq: "5-min avg." },
  { label: "DC Link Voltage", freq: "hourly" },
  { label: "PWM (Pulse Width Modulation)", freq: "10-min avg." },
  { label: "Harmonic Distortion", freq: "hourly" },
  { label: "Fault Codes", freq: "event based" },
];

const ENERGY_DATA_POINTS = [
  { label: "Thermal Efficiency Score", freq: "derived value" },
  { label: "Motor/Inverter Temperature", freq: "5-min avg." },
  { label: "Coolant Inlet Temperatures", freq: "hourly" },
  { label: "Coolant Outlet Temperatures", freq: "hourly" },
  { label: "Coolant Flow Rate", freq: "5-min avg." },
  { label: "Heater/Cooler Power Consumption", freq: "5-min avg." },
  { label: "Ambient Temperature", freq: "5-min avg." },
  { label: "Regenerative Braking Force", freq: "event based" },
  { label: "Energy Recovered per Braking Event", freq: "event based" },
  { label: "Brake Pedal Position", freq: "event based" },
];

const CHARGER_DATA_POINTS = [
  { label: "Input Voltage (AC)", freq: "5-min" },
  { label: "Input Current (AC)", freq: "5-min" },
  { label: "Output Voltage (DC)", freq: "5-min" },
  { label: "Output Current (DC)", freq: "5-min" },
  { label: "Charger Temperature", freq: "15-min" },
  { label: "Coolant Temperature", freq: "15-min" },
  { label: "Charger Efficiency", freq: "5-min" },
  { label: "Coolant Flow Rate", freq: "15-min" },
  { label: "Power Factor", freq: "per session" },
  { label: "Charging Rate", freq: "5-min" },
];

const DataNeededModal = ({ open, onClose, type = "motor" }) => {
  if (!open) return null;

  const dataPoints = type === "tire" ? TIRE_DATA_POINTS : type === "inverter" ? INVERTER_DATA_POINTS : type === "energy" ? ENERGY_DATA_POINTS : type === "charger" ? CHARGER_DATA_POINTS : MOTOR_DATA_POINTS;
  const title = type === "tire" ? "Tire" : type === "inverter" ? "Inverter" : type === "energy" ? "Energy Management" : type === "charger" ? "Charger" : "Motor";
  const description = type === "tire" ? "Tire monitoring and diagnostic data." : type === "inverter" ? "Inverter performance and diagnostic data." : type === "energy" ? "Energy management and thermal efficiency data." : type === "charger" ? "Charger performance and diagnostic data." : "Motor performance and diagnostic data.";

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