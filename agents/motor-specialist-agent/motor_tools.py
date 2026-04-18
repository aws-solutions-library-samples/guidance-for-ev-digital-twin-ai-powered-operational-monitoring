"""
Motor Specialist Agent tools.
Moved from agentcore_maintenance_agent.py — analyze, predict failure, detect anomalies.
"""

from strands.tools import tool
import pandas as pd
import numpy as np
import json
import os
import sys

# Import shared modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from shared.data_loader import load_motor_data

# Module-level data (replaces agent_instance.* pattern)
_motor_data = None


def _ensure_data_loaded():
    """Load data on first use (lazy initialization)."""
    global _motor_data
    if _motor_data is None:
        _motor_data = load_motor_data()
        print("✓ Motor data loaded")


@tool
def analyze_motor_performance(vehicle_id: str) -> str:
    """
    Analyze motor performance and health for a specific vehicle.
    
    Args:
        vehicle_id: The vehicle ID (VIN) to analyze
        
    Returns:
        Motor performance analysis including temperature, oil pressure, vibration, and performance score
    """
    try:
        _ensure_data_loaded()
        
        vehicle_data = _motor_data[_motor_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No motor data found for vehicle {vehicle_id}"})
        
        # Get latest reading
        latest = vehicle_data.iloc[-1]
        
        # Assess motor health
        temp = float(latest['engine_temp_c'])
        oil_pressure = float(latest['oil_pressure_psi'])
        vibration = float(latest['vibration_level'])
        performance = float(latest['performance_score'])
        
        # Determine status
        if performance < 70:
            status = "CRITICAL - Immediate attention required"
        elif performance < 80:
            status = "WARNING - Schedule maintenance soon"
        elif performance < 90:
            status = "ATTENTION - Monitor performance"
        else:
            status = "GOOD"
        
        # Assess failure risk
        failure_risk = int(latest['failure_risk'])
        risk_level = ["LOW", "MEDIUM", "HIGH"][failure_risk]
        
        analysis = {
            "vehicle_info": {
                "vehicle_id": str(vehicle_id),
                "make": str(latest['make']),
                "model": str(latest['model']),
                "year": int(latest['year']),
                "engine_type": str(latest['engine_type']),
                "fuel_type": str(latest['fuel_type'])
            },
            "motor_health": {
                "engine_temperature_c": round(temp, 1),
                "oil_pressure_psi": round(oil_pressure, 1),
                "vibration_level": round(vibration, 2),
                "performance_score": round(performance, 1),
                "rpm_average": int(latest['rpm_avg']),
                "fuel_consumption_l100km": round(float(latest['fuel_consumption_l100km']), 1),
                "mileage": int(latest['mileage']),
                "status": status,
                "failure_risk": risk_level
            }
        }
        
        return json.dumps(analysis, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Analysis failed: {str(e)}"})


@tool
def predict_motor_failure(vehicle_id: str) -> str:
    """
    Predict motor failure risk and maintenance needs.
    
    Args:
        vehicle_id: The vehicle ID to analyze
        
    Returns:
        Motor failure prediction with risk assessment
    """
    try:
        _ensure_data_loaded()
        
        vehicle_data = _motor_data[_motor_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No data found for vehicle {vehicle_id}"})
        
        # Get recent trend
        recent = vehicle_data.tail(10)
        
        # Calculate trends
        perf_trend = recent['performance_score'].diff().mean()
        temp_trend = recent['engine_temp_c'].diff().mean()
        
        latest = recent.iloc[-1]
        
        result = {
            "vehicle_id": str(vehicle_id),
            "current_failure_risk": ["LOW", "MEDIUM", "HIGH"][int(latest['failure_risk'])],
            "performance_trend": "DECLINING" if perf_trend < -0.5 else "STABLE" if abs(perf_trend) < 0.5 else "IMPROVING",
            "temperature_trend": "INCREASING" if temp_trend > 0.5 else "STABLE" if abs(temp_trend) < 0.5 else "DECREASING",
            "maintenance_recommendation": "Schedule inspection within 30 days" if int(latest['failure_risk']) > 0 else "Continue regular maintenance schedule"
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Prediction failed: {str(e)}"})


@tool
def detect_motor_anomalies(vehicle_id: str) -> str:
    """
    Detect motor performance anomalies and issues.
    
    Args:
        vehicle_id: The vehicle ID to check
        
    Returns:
        List of detected motor anomalies
    """
    try:
        _ensure_data_loaded()
        
        vehicle_data = _motor_data[_motor_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No data found for vehicle {vehicle_id}"})
        
        # Filter for anomalies
        anomalies = vehicle_data[vehicle_data['motor_anomaly'] == True]
        
        if anomalies.empty:
            return json.dumps({"vehicle_id": str(vehicle_id), "anomalies": [], "status": "No motor anomalies detected"})
        
        result = {
            "vehicle_id": int(vehicle_id),
            "anomalies_detected": len(anomalies),
            "anomalies": []
        }
        
        for _, anomaly in anomalies.iterrows():
            result["anomalies"].append({
                "date": str(anomaly['date']),
                "type": str(anomaly['anomaly_type']),
                "engine_temp_c": round(float(anomaly['engine_temp_c']), 1),
                "oil_pressure_psi": round(float(anomaly['oil_pressure_psi']), 1),
                "vibration_level": round(float(anomaly['vibration_level']), 2),
                "performance_score": round(float(anomaly['performance_score']), 1),
                "severity": "HIGH" if anomaly['failure_risk'] == 2 else "MEDIUM"
            })
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Detection failed: {str(e)}"})
