#!/usr/bin/env python3
"""
AgentCore Runtime for Appointment Scheduling
Standalone agent for scheduling vehicle maintenance appointments
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel
from strands.tools import tool
import boto3
import json
import os
from datetime import datetime
from typing import Optional

# Model configuration - Claude Sonnet 4.5
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'global.anthropic.claude-sonnet-4-5-20250929-v1:0')

# DynamoDB configuration
APPOINTMENTS_TABLE = 'vehicle-appointment-slots'

# System prompt for appointment scheduling agent
SYSTEM_PROMPT = """You are a vehicle maintenance appointment scheduling assistant.

Your role is to help customers schedule maintenance appointments for their vehicles.

When scheduling appointments:
1. Ask for vehicle ID, service type, and preferred date
2. Check available time slots for the requested date
3. Book the first available slot
4. Confirm the appointment details

Service types available:
- tire_replacement
- tire_rotation
- motor_maintenance
- oil_change
- inspection
- general_maintenance

Be friendly, efficient, and confirm all details clearly."""


@tool
def check_available_slots(date: str) -> str:
    """
    Check available appointment slots for a specific date.
    
    Args:
        date: Date in YYYY-MM-DD format
        
    Returns:
        List of available time slots
    """
    try:
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table(APPOINTMENTS_TABLE)
        
        response = table.query(
            KeyConditionExpression='#d = :date',
            FilterExpression='available = :avail',
            ExpressionAttributeNames={'#d': 'date'},
            ExpressionAttributeValues={':date': date, ':avail': True}
        )
        
        slots = response.get('Items', [])
        
        if not slots:
            return json.dumps({
                "date": date,
                "available_slots": [],
                "message": f"No available slots on {date}"
            }, indent=2)
        
        # Sort slots by time
        sorted_slots = sorted(slots, key=lambda x: x['time_slot'])
        
        return json.dumps({
            "date": date,
            "available_slots": [slot['time_slot'] for slot in sorted_slots],
            "count": len(sorted_slots)
        }, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Failed to check slots: {str(e)}"})


@tool
def schedule_appointment(
    vehicle_id: int,
    service_type: str,
    preferred_date: str,
    time_slot: Optional[str] = None,
    notes: str = ""
) -> str:
    """
    Schedule a maintenance appointment for a vehicle.
    
    Args:
        vehicle_id: The vehicle ID
        service_type: Type of service (tire_replacement, tire_rotation, motor_maintenance, oil_change, inspection)
        preferred_date: Preferred date in YYYY-MM-DD format
        time_slot: Specific time slot (optional, will book first available if not provided)
        notes: Additional notes or concerns
        
    Returns:
        Appointment confirmation details
    """
    try:
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table(APPOINTMENTS_TABLE)
        
        # Query available slots for the date
        response = table.query(
            KeyConditionExpression='#d = :date',
            FilterExpression='available = :avail',
            ExpressionAttributeNames={'#d': 'date'},
            ExpressionAttributeValues={':date': preferred_date, ':avail': True}
        )
        
        slots = response.get('Items', [])
        if not slots:
            return json.dumps({
                "success": False,
                "error": f"No available slots on {preferred_date}",
                "suggestion": "Please try another date or check available slots first"
            }, indent=2)
        
        # Find the requested slot or use first available
        if time_slot:
            slot = next((s for s in slots if s['time_slot'] == time_slot), None)
            if not slot:
                return json.dumps({
                    "success": False,
                    "error": f"Time slot {time_slot} not available on {preferred_date}",
                    "available_slots": [s['time_slot'] for s in sorted(slots, key=lambda x: x['time_slot'])]
                }, indent=2)
        else:
            # Book first available slot
            slot = sorted(slots, key=lambda x: x['time_slot'])[0]
        
        # Book the appointment
        table.update_item(
            Key={'date': preferred_date, 'time_slot': slot['time_slot']},
            UpdateExpression='SET available = :false, vehicle_id = :vid, service_type = :svc, booked_at = :now, notes = :notes',
            ExpressionAttributeValues={
                ':false': False,
                ':vid': vehicle_id,
                ':svc': service_type,
                ':now': datetime.now().isoformat(),
                ':notes': notes
            }
        )
        
        return json.dumps({
            "success": True,
            "message": "Appointment scheduled successfully",
            "appointment": {
                "vehicle_id": vehicle_id,
                "date": preferred_date,
                "time_slot": slot['time_slot'],
                "service_type": service_type,
                "service_bay": slot.get('service_bay', 'TBD'),
                "notes": notes,
                "confirmation_number": f"APT-{vehicle_id}-{preferred_date.replace('-', '')}"
            }
        }, indent=2)
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Scheduling failed: {str(e)}"
        }, indent=2)


@tool
def cancel_appointment(vehicle_id: int, date: str, time_slot: str) -> str:
    """
    Cancel an existing appointment.
    
    Args:
        vehicle_id: The vehicle ID
        date: Appointment date in YYYY-MM-DD format
        time_slot: Time slot to cancel
        
    Returns:
        Cancellation confirmation
    """
    try:
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table(APPOINTMENTS_TABLE)
        
        # Release the slot
        table.update_item(
            Key={'date': date, 'time_slot': time_slot},
            UpdateExpression='SET available = :true REMOVE vehicle_id, service_type, booked_at, notes',
            ExpressionAttributeValues={':true': True}
        )
        
        return json.dumps({
            "success": True,
            "message": "Appointment cancelled successfully",
            "vehicle_id": vehicle_id,
            "date": date,
            "time_slot": time_slot
        }, indent=2)
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Cancellation failed: {str(e)}"
        }, indent=2)


# Create the Bedrock model
model = BedrockModel(model_id=MODEL_ID)

# Create the agent with appointment scheduling tools
agent = Agent(
    model=model,
    tools=[
        check_available_slots,
        schedule_appointment,
        cancel_appointment
    ],
    system_prompt=SYSTEM_PROMPT
)

# Initialize the AgentCore Runtime App
app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload):
    """AgentCore Runtime entrypoint function"""
    user_input = payload.get("prompt", "")
    
    # Invoke the agent
    response = agent(user_input)
    return response.message["content"][0]["text"]

if __name__ == "__main__":
    app.run()
