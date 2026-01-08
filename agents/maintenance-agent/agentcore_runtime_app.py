#!/usr/bin/env python3
"""
AgentCore Runtime Application for Vehicle Maintenance
Proper implementation using bedrock_agentcore.runtime SDK
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from agentcore_maintenance_agent import AgentCoreMaintenanceAgent, order_tire_online
import os
import json
from datetime import datetime
import boto3

# Get memory ID from environment variable (set by AgentCore deployment)
# The memory ID is created during 'bedrock-agentcore launch' and stored in .bedrock_agentcore.yaml
# If not set, the agent will work without memory features
MEMORY_ID = os.environ.get("AGENTCORE_MEMORY_ID")

if not MEMORY_ID:
    print("⚠️  AGENTCORE_MEMORY_ID not set - memory features disabled")
    print("   Set via: export AGENTCORE_MEMORY_ID=your_memory_id")
    print("   Or configure in .bedrock_agentcore.yaml during deployment")

# Create agent with memory for pattern detection
maintenance_agent = AgentCoreMaintenanceAgent(
    memory_id=MEMORY_ID,
    actor_id="fleet_manager",
    session_id=None
)

# Load data
maintenance_agent.load_data()

# Create specialized agents at startup (faster than per-request creation)
tire_agent = maintenance_agent.create_agent(prompt_type="tire")
motor_agent = maintenance_agent.create_agent(prompt_type="motor")
inverter_agent = maintenance_agent.create_agent(prompt_type="inverter")

# Initialize the AgentCore Runtime App
app = BedrockAgentCoreApp()

# Initialize DynamoDB client for session tracking
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Track browser tool executions per session to prevent duplicates
BROWSER_TOOL_EXECUTED = set()
# Store browser session info for duplicate calls
BROWSER_SESSION_INFO = {}

@app.entrypoint
def invoke(payload):
    """AgentCore Runtime entrypoint with dynamic prompt selection and STM+LTM memory-based pattern detection"""
    user_input = payload.get("prompt", "")
    actor_id = payload.get("actor_id", "fleet_manager")
    session_id = payload.get("session_id", "default")
    
    print(f"🚀 INVOKE: {user_input[:50]}")
    
    # Update actor_id if provided
    if actor_id != maintenance_agent.actor_id:
        maintenance_agent.actor_id = actor_id
        if maintenance_agent.memory_hooks:
            maintenance_agent.memory_hooks.actor_id = actor_id
    
    # Detect query type and select appropriate agent
    if "motor" in user_input.lower() or "engine" in user_input.lower():
        agent = motor_agent
        print("🔧 Using MOTOR agent")
    elif "inverter" in user_input.lower() or "power electronics" in user_input.lower():
        agent = inverter_agent
        print("⚡ Using INVERTER agent")
    else:
        agent = tire_agent
        print("🛞 Using TIRE agent")
    
    # SMART BYPASS: Prevent Strands event loop crash with browser tool
    # Strands has a bug where it can't handle long-running nested agents (NovaAct)
    # This bypass calls the tool directly, avoiding the event loop entirely
    if "order_tire_online" in user_input.lower():
        try:
            import re
            # Match both numeric IDs and VIN strings, with optional job_id parameter
            match = re.search(r'order_tire_online\((["\']?)([A-Z0-9]+)\1(?:,\s*job_id=([^\)]+))?\)', user_input)
            if match:
                vehicle_id = match.group(2)
                job_id = match.group(3)  # May be None if not provided
                
                # IDEMPOTENCY CHECK: Prevent duplicate browser tool executions for the same job
                if job_id and job_id in BROWSER_TOOL_EXECUTED:
                    print(f"⚠️  BYPASS SKIPPED: Browser tool already executed for job {job_id}")
                    print(f"⚠️  Returning cached result to prevent duplicate browser session")
                    
                    # Return cached result if available
                    if job_id in BROWSER_SESSION_INFO:
                        cached_result = BROWSER_SESSION_INFO[job_id]
                        print(f"✅ Returning cached browser session info")
                        return cached_result
                    
                    # Return success message if no cached result
                    return json.dumps({
                        "success": True,
                        "message": "Browser tool already executed for this job",
                        "job_id": job_id,
                        "vehicle_id": vehicle_id
                    })
                
                print(f"✓ BYPASS: Directly calling order_tire_online({vehicle_id}, job_id={job_id}) for session {session_id}")
                
                # Mark job as being executed
                if job_id:
                    BROWSER_TOOL_EXECUTED.add(job_id)
                
                result = order_tire_online(vehicle_id, job_id=job_id)
                
                # Cache the result for potential duplicate calls
                if job_id:
                    BROWSER_SESSION_INFO[job_id] = result
                
                print(f"✓ BYPASS: Tool execution completed, returning full result")
                
                # Return the full JSON result (includes metadata for frontend)
                return result
        except Exception as e:
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
