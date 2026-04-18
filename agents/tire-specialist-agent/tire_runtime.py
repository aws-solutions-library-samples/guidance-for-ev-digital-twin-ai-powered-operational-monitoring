#!/usr/bin/env python3
"""
Tire Specialist Agent — AgentCore Runtime entry point.
Creates a Strands Agent with SYSTEM_PROMPT_TIRE, tire tools + KB tools,
and the same BedrockModel config as the original monolith.
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
import os
import sys
import json
import re

# Add parent dir so shared module is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.model_config import create_bedrock_model
from shared.system_prompts import SYSTEM_PROMPT_TIRE

# Import tire-specific tools
from tire_tools import (
    analyze_tire_condition,
    predict_tire_wear,
    detect_tire_anomalies,
    order_tire_online,
)

# Import Knowledge Base tools (tire-related)
try:
    from shared.knowledge_base_tools import (
        get_tire_maintenance_guidance,
        get_pressure_temperature_guidance,
        get_tread_depth_guidance,
    )
    KB_AVAILABLE = bool(os.environ.get('KNOWLEDGE_BASE_ID'))
except ImportError:
    KB_AVAILABLE = False
    print("⚠️  Knowledge Base tools not available")

# Build tools list
tools_list = [
    analyze_tire_condition,
    predict_tire_wear,
    detect_tire_anomalies,
    order_tire_online,
]

if KB_AVAILABLE:
    tools_list.extend([
        get_tire_maintenance_guidance,
        get_pressure_temperature_guidance,
        get_tread_depth_guidance,
    ])
    print("✅ Knowledge Base tools enabled (Tire)")
else:
    print("ℹ️  Knowledge Base tools not available - using embedded knowledge only")

# Create the Strands Agent at startup
model = create_bedrock_model()
tire_agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT_TIRE,
    tools=tools_list,
)

# Track browser tool executions per session to prevent duplicates
BROWSER_TOOL_EXECUTED = set()
BROWSER_SESSION_INFO = {}

# Initialize the AgentCore Runtime App
app = BedrockAgentCoreApp()


@app.entrypoint
def invoke(payload):
    """AgentCore Runtime entrypoint for Tire Specialist Agent."""
    user_input = payload.get("prompt", "")
    session_id = payload.get("session_id", "default")

    print(f"🛞 TIRE AGENT INVOKE: {user_input[:50]}")

    # SMART BYPASS: Prevent Strands event loop crash with browser tool
    # Strands has a bug where it can't handle long-running nested agents (NovaAct)
    # This bypass calls the tool directly, avoiding the event loop entirely
    if "order_tire_online" in user_input.lower():
        try:
            match = re.search(r'order_tire_online\((["\']?)([A-Z0-9]+)\1(?:,\s*job_id=([^\)]+))?\)', user_input)
            if match:
                vehicle_id = match.group(2)
                job_id = match.group(3)

                # IDEMPOTENCY CHECK: Prevent duplicate browser tool executions
                if job_id and job_id in BROWSER_TOOL_EXECUTED:
                    print(f"⚠️  BYPASS SKIPPED: Browser tool already executed for job {job_id}")
                    if job_id in BROWSER_SESSION_INFO:
                        return BROWSER_SESSION_INFO[job_id]
                    return json.dumps({
                        "success": True,
                        "message": "Browser tool already executed for this job",
                        "job_id": job_id,
                        "vehicle_id": vehicle_id
                    })

                print(f"✓ BYPASS: Directly calling order_tire_online({vehicle_id}, job_id={job_id})")

                if job_id:
                    BROWSER_TOOL_EXECUTED.add(job_id)

                result = order_tire_online(vehicle_id, job_id=job_id)

                if job_id:
                    BROWSER_SESSION_INFO[job_id] = result

                return result
        except Exception as e:
            print(f"❌ BYPASS FAILED: {str(e)}")
            raise

    # Normal agent invocation
    response = tire_agent(user_input)

    if hasattr(response, 'text'):
        return response.text
    elif hasattr(response, 'message') and response.message.get("content"):
        content = response.message["content"]
        if content and len(content) > 0:
            return content[0].get("text", str(response))

    return str(response)


if __name__ == "__main__":
    app.run()
