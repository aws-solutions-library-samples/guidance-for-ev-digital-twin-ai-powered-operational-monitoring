"""
Fleet Operations Agent tools.
Moved from agentcore_maintenance_agent.py — quick vehicle check, appointment scheduling.
"""

from strands.tools import tool
import pandas as pd
import numpy as np
from datetime import datetime
import json
import os
import sys
import boto3

# Import shared modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from shared.data_loader import load_tire_data, load_motor_data

# Module-level data (replaces agent_instance.* pattern)
_tire_data = None
_motor_data = None


def _ensure_data_loaded():
    """Load data on first use (lazy initialization)."""
    global _tire_data, _motor_data
    if _tire_data is None:
        _tire_data = load_tire_data()
        print("✓ Tire data loaded (fleet)")
    if _motor_data is None:
        _motor_data = load_motor_data()
        print("✓ Motor data loaded (fleet)")


@tool
def quick_vehicle_check(vehicle_id: str) -> str:
    """
    Quick health check for a vehicle - returns brief status.
    
    Args:
        vehicle_id: The vehicle ID (VIN) to check
        
    Returns:
        Brief one-sentence status of the most critical issue or "All systems normal"
    """
    try:
        _ensure_data_loaded()
        
        # Get latest tire data
        tire_data = _tire_data[_tire_data['vehicle_id'] == vehicle_id]
        if not tire_data.empty:
            latest_tires = tire_data.groupby('position').last().reset_index()
            
            # Check for critical tire issues (more sensitive thresholds)
            min_pressure = latest_tires['pressure_psi'].min()
            min_tread = latest_tires['tread_depth_mm'].min()
            low_pressure_tires = latest_tires[latest_tires['pressure_psi'] < 30.0]
            
            if min_tread < 2.0:
                return f"CRITICAL: Tire tread depth below safe minimum ({min_tread:.1f}mm) - immediate replacement required"
            elif len(low_pressure_tires) > 0:
                tire_pos = low_pressure_tires.iloc[0]['position']
                pressure = low_pressure_tires.iloc[0]['pressure_psi']
                return f"WARNING: {tire_pos} tire pressure low ({pressure:.1f} PSI) - inflate to 32 PSI"
            elif min_tread < 6.0:
                return f"ATTENTION: Tire tread wearing ({min_tread:.1f}mm) - monitor closely"
        
        # Check motor data
        motor_data = _motor_data[_motor_data['vehicle_id'] == vehicle_id]
        if not motor_data.empty:
            latest_motor = motor_data.iloc[-1]
            perf_score = float(latest_motor['performance_score'])
            
            if perf_score < 80:
                return f"WARNING: Motor performance declining ({perf_score:.1f}/100) - schedule maintenance"
        
        return "All systems normal"
        
    except Exception as e:
        return f"Error checking vehicle: {str(e)}"


@tool
def get_available_slots(vehicle_id: str, service_type: str, preferred_date: str) -> str:
    """
    IMPORTANT: Use this tool to find available appointment time slots WITHOUT booking them.
    This tool queries the appointment database and returns 2-4 available time slots.
    The user will select one slot, then you use schedule_appointment to book it.
    
    Args:
        vehicle_id: The vehicle ID (e.g., "1", "2", "3")
        service_type: Type of service - must be one of: tire_replacement, tire_rotation, motor_maintenance, oil_change, inspection
        preferred_date: Date in YYYY-MM-DD format (e.g., "2025-11-25")
        
    Returns:
        JSON with available_slots array containing date, time_slot, service_type, and duration for each slot
    
    Example:
        get_available_slots("1", "tire_replacement", "2025-11-25")
        Returns: {"success": true, "available_slots": [{"date": "2025-11-25", "time_slot": "15:00", ...}]}
    """
    try:
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table('vehicle-appointment-slots')
        
        # Query available slots for the date
        response = table.query(
            KeyConditionExpression='#d = :date',
            FilterExpression='available = :avail',
            ExpressionAttributeNames={'#d': 'date'},
            ExpressionAttributeValues={':date': preferred_date, ':avail': True}
        )
        
        slots = response.get('Items', [])
        if not slots:
            return json.dumps({"error": f"No available slots on {preferred_date}", "available_slots": []})
        
        # Return 2-4 available slots (don't book them yet)
        available_slots = []
        for slot in slots[:4]:  # Max 4 slots
            available_slots.append({
                "date": preferred_date,
                "time_slot": slot['time_slot'],
                "service_type": service_type,
                "duration": slot.get('duration', '1 hour')
            })
        
        return json.dumps({
            "success": True,
            "vehicle_id": vehicle_id,
            "service_type": service_type,
            "available_slots": available_slots,
            "message": f"Found {len(available_slots)} available time slots"
        }, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Failed to get slots: {str(e)}", "available_slots": []})


@tool
def schedule_appointment(vehicle_id: str, service_type: str, preferred_date: str, time_slot: str, notes: str = "") -> str:
    """
    Schedule a maintenance appointment for a vehicle in DynamoDB.
    This books a specific time slot that was previously shown to the user.
    
    Args:
        vehicle_id: The vehicle ID
        service_type: Type of service (tire_replacement, tire_rotation, motor_maintenance, oil_change, inspection)
        preferred_date: Preferred date in YYYY-MM-DD format
        time_slot: Specific time slot to book in 24-hour format (e.g., "09:00", "15:00")
        notes: Additional notes or concerns
        
    Returns:
        Appointment confirmation details
    """
    try:
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table('vehicle-appointment-slots')
        
        # Book the specific time slot requested
        table.update_item(
            Key={'date': preferred_date, 'time_slot': time_slot},
            UpdateExpression='SET available = :false, vehicle_id = :vid, service_type = :svc, booked_at = :now, notes = :notes',
            ExpressionAttributeValues={
                ':false': False,
                ':vid': vehicle_id,
                ':svc': service_type,
                ':now': datetime.now().isoformat(),
                ':notes': notes,
                ':true': True
            },
            ConditionExpression='available = :true'  # Only book if still available
        )
        
        return json.dumps({
            "success": True,
            "appointment": {
                "vehicle_id": vehicle_id,
                "date": preferred_date,
                "time_slot": time_slot,
                "service_type": service_type,
                "notes": notes
            },
            "message": f"Appointment booked successfully for {preferred_date} at {time_slot}"
        }, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Scheduling failed: {str(e)}"})
