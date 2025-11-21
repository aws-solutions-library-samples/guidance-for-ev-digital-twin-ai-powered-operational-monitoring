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

# Track browser tool executions per session to prevent duplicates
BROWSER_TOOL_EXECUTED = set()

@app.entrypoint
def invoke(payload):
    """AgentCore Runtime entrypoint with memory-based pattern detection"""
    user_input = payload.get("prompt", "")
    actor_id = payload.get("actor_id", "fleet_manager")
    session_id = payload.get("session_id", "default")
    
    # Update actor_id if provided
    if actor_id != maintenance_agent.actor_id:
        maintenance_agent.actor_id = actor_id
        if maintenance_agent.memory_hooks:
            maintenance_agent.memory_hooks.actor_id = actor_id
    
    # SMART BYPASS: Prevent Strands event loop crash with browser tool
    # Strands has a bug where it can't handle long-running nested agents (NovaAct)
    # This bypass calls the tool directly, avoiding the event loop entirely
    if "order_tire_online" in user_input.lower():
        # Check if already executed for this session
        if session_id in BROWSER_TOOL_EXECUTED:
            print(f"⚠️  BYPASS: Browser tool already executed for session {session_id}")
            return "Browser tool already executed for this session. Tire order is being processed."
        
        try:
            import re
            # Match both numeric IDs and VIN strings
            match = re.search(r'order_tire_online\((["\']?)([A-Z0-9]+)\1\)', user_input)
            if match:
                vehicle_id = match.group(2)
                
                # Mark as executed BEFORE running to prevent race conditions
                BROWSER_TOOL_EXECUTED.add(session_id)
                print(f"✓ BYPASS: Directly calling order_tire_online({vehicle_id}) for session {session_id}")
                
                result = order_tire_online(vehicle_id)
                return result
        except Exception as e:
            # Remove from executed set on error so it can be retried
            BROWSER_TOOL_EXECUTED.discard(session_id)
            print(f"❌ BYPASS FAILED: {str(e)}")
            raise
    
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
