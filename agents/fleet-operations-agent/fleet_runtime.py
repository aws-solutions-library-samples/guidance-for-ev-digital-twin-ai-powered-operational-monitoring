#!/usr/bin/env python3
"""
Fleet Operations Agent — AgentCore Runtime entry point.
Creates a Strands Agent with fleet tools, MaintenanceMemoryHooks for
cross-vehicle pattern detection, and AgentCore Gateway (MCP) connection.
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from bedrock_agentcore.memory import MemoryClient
import os
import sys
from datetime import datetime

# Add parent dir so shared module is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.model_config import create_bedrock_model
from shared.memory_hooks import MaintenanceMemoryHooks

# Import fleet-specific tools
from fleet_tools import (
    quick_vehicle_check,
    get_available_slots,
    schedule_appointment,
)

# Fleet operations system prompt
SYSTEM_PROMPT_FLEET = """You are a fleet operations specialist for electric vehicles. You handle fleet-wide monitoring, appointment scheduling, and cross-vehicle pattern detection.

CAPABILITIES:
1. Quick vehicle health checks across the fleet
2. Appointment scheduling for maintenance services
3. Cross-vehicle pattern detection using memory (recurring issues, fleet-wide trends)

WORKFLOW:
1. For health checks: Call quick_vehicle_check() for the requested vehicle
2. For scheduling: First call get_available_slots() to show options, then schedule_appointment() to book
3. For fleet patterns: Memory hooks automatically detect and surface recurring issues

Keep responses concise and action-oriented. Focus on fleet efficiency and proactive maintenance."""

# Memory configuration
MEMORY_ID = os.environ.get("AGENTCORE_MEMORY_ID")
memory_hooks = None

if MEMORY_ID:
    try:
        memory_client = MemoryClient(region_name="us-east-1")
        session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        memory_hooks = MaintenanceMemoryHooks(MEMORY_ID, memory_client, "fleet_manager", session_id)
        print("✓ Memory hooks initialized for pattern detection")
    except Exception as e:
        print(f"⚠ Memory hooks disabled: {e}")
else:
    print("⚠️  AGENTCORE_MEMORY_ID not set - memory features disabled")

# Build tools list
tools_list = [
    quick_vehicle_check,
    get_available_slots,
    schedule_appointment,
]

# AgentCore Gateway (MCP) tools — loaded dynamically if configured
try:
    from bedrock_agentcore.tools import AgentCoreGatewayTool
    gateway_tool = AgentCoreGatewayTool()
    tools_list.append(gateway_tool)
    print("✅ AgentCore Gateway (MCP) tools enabled")
except Exception as e:
    print(f"ℹ️  AgentCore Gateway tools not available: {e}")

# Create the Strands Agent at startup
model = create_bedrock_model()
fleet_agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT_FLEET,
    hooks=[memory_hooks] if memory_hooks else [],
    tools=tools_list,
)

# Initialize the AgentCore Runtime App
app = BedrockAgentCoreApp()


@app.entrypoint
def invoke(payload):
    """AgentCore Runtime entrypoint for Fleet Operations Agent."""
    user_input = payload.get("prompt", "")
    actor_id = payload.get("actor_id", "fleet_manager")
    session_id = payload.get("session_id", "default")

    print(f"🚛 FLEET AGENT INVOKE: {user_input[:50]}")

    # Update actor_id if provided
    if memory_hooks and actor_id != memory_hooks.actor_id:
        memory_hooks.actor_id = actor_id

    response = fleet_agent(user_input)

    if hasattr(response, 'text'):
        return response.text
    elif hasattr(response, 'message') and response.message.get("content"):
        content = response.message["content"]
        if content and len(content) > 0:
            return content[0].get("text", str(response))

    return str(response)


if __name__ == "__main__":
    app.run()
