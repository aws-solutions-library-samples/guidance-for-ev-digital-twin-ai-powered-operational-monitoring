#!/usr/bin/env python3
"""
AgentCore Runtime Application for Vehicle Maintenance
Proper implementation using bedrock_agentcore.runtime SDK
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from agentcore_maintenance_agent import AgentCoreMaintenanceAgent, order_tire_online
import os

# Get memory ID from environment or config
MEMORY_ID = os.environ.get("AGENTCORE_MEMORY_ID", "vehicle_maintenance_agent_mem-Zz75E62LMt")

# Create agent with memory for pattern detection
maintenance_agent = AgentCoreMaintenanceAgent(
    memory_id=MEMORY_ID,
    actor_id="fleet_manager",
    session_id=None
)

# Load data
maintenance_agent.load_data()

# Create agent with memory hooks
agent = maintenance_agent.create_agent()

# Initialize the AgentCore Runtime App
app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload):
    """AgentCore Runtime entrypoint with memory-based pattern detection"""
    user_input = payload.get("prompt", "")
    actor_id = payload.get("actor_id", "fleet_manager")
    
    # Update actor_id if provided
    if actor_id != maintenance_agent.actor_id:
        maintenance_agent.actor_id = actor_id
        if maintenance_agent.memory_hooks:
            maintenance_agent.memory_hooks.actor_id = actor_id
    
    # BYPASS: If prompt is tire ordering, call tool directly
    # NOTE: Commented out to fix multiple browser sessions issue (was causing 4 sessions)
    # Uncomment if needed, but agent should handle tool calls naturally
    # if "order_tire_online" in user_input.lower():
    #     try:
    #         import re
    #         # Match both numeric IDs and VIN strings
    #         match = re.search(r'order_tire_online\((["\']?)([A-Z0-9]+)\1\)', user_input)
    #         if match:
    #             vehicle_id = match.group(2)
    #             print(f"BYPASS: Directly calling order_tire_online({vehicle_id})")
    #             result = order_tire_online(vehicle_id)
    #             return result
    #     except Exception as e:
    #         print(f"BYPASS FAILED: {str(e)}")
    
    # Invoke agent with memory hooks active
    response = agent(user_input)
    
    if hasattr(response, 'text'):
        return response.text
    elif hasattr(response, 'message') and response.message.get("content"):
        content = response.message["content"]
        if content and len(content) > 0:
            return content[0].get("text", str(response))
    
    return str(response)

if __name__ == "__main__":
    app.run()
