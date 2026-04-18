"""
Inverter Specialist Agent tools.
Moved from agentcore_maintenance_agent.py — analyze condition, predict degradation.
"""

from strands.tools import tool
import pandas as pd
import numpy as np
import json
import os
import sys

# Import shared modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from shared.data_loader import load_inverter_data

# Module-level data (replaces agent_instance.* pattern)
_inverter_data = None


def _ensure_data_loaded():
    """Load data on first use (lazy initialization)."""
    global _inverter_data
    if _inverter_data is None:
        _inverter_data = load_inverter_data()
        print("✓ Inverter data loaded")


@tool
def analyze_inverter_condition(vehicle_id: str) -> str:
    """
    Analyze inverter condition and health for an electric vehicle.
    
    Args:
        vehicle_id: The vehicle ID (VIN) to analyze
        
    Returns:
        Inverter analysis including DC voltage, efficiency, temperature, and THD
    """
    try:
        _ensure_data_loaded()
        
        vehicle_data = _inverter_data[_inverter_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No inverter data found for vehicle {vehicle_id}"})
        
        latest = vehicle_data.iloc[-1]
        
        dc_voltage = float(latest['dc_voltage_v'])
        efficiency = float(latest['efficiency_percent'])
        temperature = float(latest['temperature_c'])
        thd = float(latest['thd_percent'])
        
        # Determine status based on thresholds
        if temperature > 90 or efficiency < 90 or thd > 10:
            status = "CRITICAL - Immediate attention required"
        elif temperature > 75 or efficiency < 95 or thd > 5 or dc_voltage < 300 or dc_voltage > 420:
            status = "WARNING - Schedule maintenance soon"
        else:
            status = "GOOD"
        
        analysis = {
            "vehicle_info": {
                "vehicle_id": str(vehicle_id),
                "make": str(latest['make']),
                "model": str(latest['model']),
                "year": int(latest['year'])
            },
            "inverter_health": {
                "dc_voltage_v": round(dc_voltage, 1),
                "ac_voltage_v": round(float(latest['ac_voltage_v']), 1),
                "efficiency_percent": round(efficiency, 1),
                "temperature_c": round(temperature, 1),
                "thd_percent": round(thd, 1),
                "power_output_kw": round(float(latest['power_output_kw']), 1),
                "status": status
            }
        }
        
        return json.dumps(analysis, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Analysis failed: {str(e)}"})


@tool
def predict_inverter_degradation(vehicle_id: str) -> str:
    """
    Predict inverter degradation and maintenance needs.
    
    Args:
        vehicle_id: The vehicle ID to analyze
        
    Returns:
        Inverter wear prediction with risk assessment
    """
    try:
        _ensure_data_loaded()
        
        vehicle_data = _inverter_data[_inverter_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No data found for vehicle {vehicle_id}"})
        
        # Get recent trend
        recent = vehicle_data.tail(10)
        
        # Calculate trends
        efficiency_trend = recent['efficiency_percent'].diff().mean()
        temp_trend = recent['temperature_c'].diff().mean()
        thd_trend = recent['thd_percent'].diff().mean()
        
        latest = recent.iloc[-1]
        
        # Determine failure risk based on efficiency and temperature
        efficiency = float(latest['efficiency_percent'])
        temperature = float(latest['temperature_c'])
        thd = float(latest['thd_percent'])
        
        if efficiency < 90 or temperature > 85 or thd > 8:
            failure_risk = "HIGH"
        elif efficiency < 94 or temperature > 75 or thd > 5:
            failure_risk = "MEDIUM"
        else:
            failure_risk = "LOW"
        
        result = {
            "vehicle_id": str(vehicle_id),
            "current_failure_risk": failure_risk,
            "efficiency_trend": "DECLINING" if efficiency_trend < -0.5 else "STABLE" if abs(efficiency_trend) < 0.5 else "IMPROVING",
            "temperature_trend": "INCREASING" if temp_trend > 0.5 else "STABLE" if abs(temp_trend) < 0.5 else "DECREASING",
            "thd_trend": "INCREASING" if thd_trend > 0.2 else "STABLE" if abs(thd_trend) < 0.2 else "DECREASING",
            "current_efficiency": f"{efficiency:.1f}%",
            "current_temperature": f"{temperature:.1f}°C",
            "current_thd": f"{thd:.1f}%",
            "maintenance_recommendation": "Schedule inverter inspection within 30 days" if failure_risk == "HIGH" else "Monitor inverter performance" if failure_risk == "MEDIUM" else "Continue regular maintenance schedule"
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Prediction failed: {str(e)}"})
