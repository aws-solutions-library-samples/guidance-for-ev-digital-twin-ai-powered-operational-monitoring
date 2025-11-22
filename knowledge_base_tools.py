"""
Knowledge Base Tools for EV Maintenance Manual Integration
Uses AWS Bedrock Knowledge Base for dynamic retrieval
"""

from strands.tools import tool
import boto3
import json
import os

# Initialize Bedrock client
bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name='us-east-1')

# Knowledge Base ID - will be set after KB creation
KNOWLEDGE_BASE_ID = os.environ.get('KNOWLEDGE_BASE_ID', '')

@tool
def get_tire_maintenance_guidance(question: str) -> str:

    """
    Retrieve tire maintenance guidance from the official EV Preventive Maintenance Manual.
    Use this tool BEFORE analyzing tire data to get authoritative recommendations.
    
    Args:
        Get the guidance from TIRE MONITORING SYSTEM SECTION AND ALL THE INFORMATION AVAILABLE IN THE SUB SECTION
        - TIRE FAILURE PREDICTION SCENARIOS
    Returns:
        Relevant guidance from the EV Maintenance Manual with confidence scores
    """
    if not KNOWLEDGE_BASE_ID:
        return "Knowledge Base not configured. Please set KNOWLEDGE_BASE_ID environment variable."
    
    try:
        response = bedrock_runtime.retrieve(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalQuery={'text': question},
            retrievalConfiguration={
                'vectorSearchConfiguration': {
                    'numberOfResults': 3,  # Top 3 most relevant passages
                    'overrideSearchType': 'HYBRID'  # Combines semantic + keyword search
                }
            }
        )
        
        if not response.get('retrievalResults'):
            return "No specific guidance found in manual for this question."
        
        # Format results with sources
        passages = []
        for idx, result in enumerate(response['retrievalResults'], 1):
            content = result['content']['text']
            score = result.get('score', 0)
            
            # Extract source location if available
            location = result.get('location', {})
            source_info = f"(Confidence: {score:.2f})"
            if location.get('s3Location'):
                source_info += f" [Source: {location['s3Location'].get('uri', 'Manual')}]"
            
            passages.append(f"**Passage {idx}** {source_info}:\n{content}")
        
        return "\n\n".join(passages)
        
    except Exception as e:
        return f"Error retrieving manual guidance: {str(e)}"


@tool
def search_tire_troubleshooting(symptom: str) -> str:
    """
    Search the manual for tire troubleshooting guidance based on symptoms.
    
    Args:
        symptom: Tire issue symptom (e.g., "uneven wear", "vibration", "noise", "pulling to one side")
        
    Returns:
        Troubleshooting steps and potential causes from the manual
    """
    query = f"Tire troubleshooting: {symptom}. What causes this and how to fix it?"
    return get_tire_maintenance_guidance(query)


@tool
def get_tire_maintenance_schedule(vehicle_type: str = "electric vehicle") -> str:
    """
    Get the recommended tire maintenance schedule from the manual.
    
    Args:
        vehicle_type: Type of vehicle (default: "electric vehicle")
        
    Returns:
        Maintenance schedule including rotation, inspection, and replacement intervals
    """
    query = f"What is the recommended tire maintenance schedule for {vehicle_type}? Include rotation intervals, inspection frequency, and replacement guidelines."
    return get_tire_maintenance_guidance(query)


@tool
def get_pressure_temperature_guidance(pressure_psi: float, temperature_c: float) -> str:
    """
    Get manual guidance for specific pressure and temperature readings.
    
    Args:
        pressure_psi: Current tire pressure in PSI
        temperature_c: Current tire temperature in Celsius
        
    Returns:
        Manual guidance on whether readings are normal and what action to take
    """
    query = f"Tire pressure is {pressure_psi} PSI and temperature is {temperature_c}°C. What does the manual say about these readings? Are they normal? What action should be taken?"
    return get_tire_maintenance_guidance(query)


@tool
def get_tread_depth_guidance(tread_depth_mm: float) -> str:
    """
    Get manual guidance for specific tread depth reading.
    
    Args:
        tread_depth_mm: Current tread depth in millimeters
        
    Returns:
        Manual guidance on tread depth safety thresholds and replacement timing
    """
    query = f"Tire tread depth is {tread_depth_mm}mm. What does the manual say about this depth? When should tires be replaced? What are the safety thresholds?"
    return get_tire_maintenance_guidance(query)


@tool
def get_motor_maintenance_guidance(question: str) -> str:
    """
    Retrieve motor maintenance guidance from the official EV Preventive Maintenance Manual.
    Use this tool BEFORE analyzing motor data to get authoritative recommendations.
    
    Args:
        Retrieve guidance from ELECTRIC MOTOR SYSTEM MONITORING section and MOTOR FAILURE PREDICTION SCENARIOS subsection
        
    Returns:
        Motor maintenance guidance with confidence scores and source citations
    """
    if not KNOWLEDGE_BASE_ID:
        return "Knowledge Base not configured. Please set KNOWLEDGE_BASE_ID environment variable."
    
    # Enhance query to target ELECTRIC MOTOR SYSTEM MONITORING and MOTOR FAILURE PREDICTION SCENARIOS
    enhanced_query = f"ELECTRIC MOTOR SYSTEM MONITORING MOTOR FAILURE PREDICTION SCENARIOS: {question}"
    
    try:
        response = bedrock_runtime.retrieve(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalQuery={'text': enhanced_query},
            retrievalConfiguration={
                'vectorSearchConfiguration': {
                    'numberOfResults': 3,
                    'overrideSearchType': 'HYBRID'
                }
            }
        )
        
        if not response.get('retrievalResults'):
            return "No specific motor guidance found in manual for this question."
        
        # Format results with sources
        passages = []
        for idx, result in enumerate(response['retrievalResults'], 1):
            content = result['content']['text']
            score = result.get('score', 0)
            
            location = result.get('location', {})
            source_info = f"(Confidence: {score:.2f})"
            if location.get('s3Location'):
                source_info += f" [Source: {location['s3Location'].get('uri', 'Manual')}]"
            
            passages.append(f"**Passage {idx}** {source_info}:\n{content}")
        
        return "\n\n".join(passages)
        
    except Exception as e:
        return f"Error retrieving motor guidance: {str(e)}"


@tool
def get_motor_temperature_guidance(temperature_c: float) -> str:
    """
    Get motor temperature guidance from Section 2.1 based on current temperature reading.
    
    Args:
        temperature_c: Current motor temperature in Celsius
        
    Returns:
        Temperature-specific guidance from the manual
    """
    query = f"Motor temperature {temperature_c}°C - is this normal? What are safe operating temperatures for EV motors?"
    return get_motor_maintenance_guidance(query)
