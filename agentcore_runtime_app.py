#!/usr/bin/env python3
"""
AgentCore Runtime Application for Vehicle Maintenance
Proper implementation using bedrock_agentcore.runtime SDK
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel
from agentcore_maintenance_agent import (
    quick_vehicle_check,
    analyze_tire_condition,
    analyze_motor_performance,
    predict_tire_wear,
    predict_motor_failure,
    detect_tire_anomalies,
    detect_motor_anomalies,
    schedule_appointment,
    get_fleet_status,
    cross_system_analysis,
    generate_maintenance_report,
    SYSTEM_PROMPT,
    MODEL_ID,
    agent_instance
)

# Create the Bedrock model
model = BedrockModel(model_id=MODEL_ID)

# Load data
agent_instance.load_data()

# Create the agent with all maintenance tools
agent = Agent(
    model=model,
    tools=[
        quick_vehicle_check,
        analyze_tire_condition,
        analyze_motor_performance,
        predict_tire_wear,
        predict_motor_failure,
        detect_tire_anomalies,
        detect_motor_anomalies,
        schedule_appointment,
        get_fleet_status,
        cross_system_analysis,
        generate_maintenance_report
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
