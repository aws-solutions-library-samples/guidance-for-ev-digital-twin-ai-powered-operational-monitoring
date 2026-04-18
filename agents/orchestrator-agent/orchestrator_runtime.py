#!/usr/bin/env python3
"""
Orchestrator Agent — AgentCore Runtime entry point.
Lightweight router that classifies user intent via keyword matching
and routes to the appropriate specialist agent via invoke_agent_runtime.
No domain tools, no ML dependencies — routing only.
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
import boto3
import json
import os

# Read specialist agent ARNs from environment variables
TIRE_AGENT_ARN = os.environ.get("TIRE_AGENT_ARN", "")
MOTOR_AGENT_ARN = os.environ.get("MOTOR_AGENT_ARN", "")
INVERTER_AGENT_ARN = os.environ.get("INVERTER_AGENT_ARN", "")
FLEET_AGENT_ARN = os.environ.get("FLEET_AGENT_ARN", "")

# Validate ARNs at startup
_missing = []
if not TIRE_AGENT_ARN:
    _missing.append("TIRE_AGENT_ARN")
if not MOTOR_AGENT_ARN:
    _missing.append("MOTOR_AGENT_ARN")
if not INVERTER_AGENT_ARN:
    _missing.append("INVERTER_AGENT_ARN")
if not FLEET_AGENT_ARN:
    _missing.append("FLEET_AGENT_ARN")

if _missing:
    print(f"⚠️  Missing specialist agent ARN env vars: {', '.join(_missing)}")
    print("   Routing to missing specialists will fail at invocation time.")

# boto3 client for invoking specialist agent runtimes
agentcore_client = boto3.client("bedrock-agentcore", region_name="us-east-1")

# Initialize the AgentCore Runtime App
app = BedrockAgentCoreApp()


def classify_and_route(user_input: str) -> str:
    """Classify user intent and return the appropriate specialist agent ARN.

    Replicates the exact keyword matching logic from the original
    agentcore_runtime_app.py:
      - "motor" or "engine" → Motor Specialist
      - "inverter" or "power electronics" → Inverter Specialist
      - "appointment", "schedule", "slot", "quick check", "quick_vehicle_check" → Fleet Operations
      - everything else (including "order_tire_online") → Tire Specialist (default)
    """
    lower = user_input.lower()

    # Fleet operations keywords take priority (scheduling, appointments)
    if any(kw in lower for kw in ["appointment", "schedule", "slot", "quick check", "quick_vehicle_check", "get_available_slots", "schedule_appointment"]):
        return FLEET_AGENT_ARN
    elif "motor" in lower or "engine" in lower:
        return MOTOR_AGENT_ARN
    elif "inverter" in lower or "power electronics" in lower:
        return INVERTER_AGENT_ARN
    else:
        # Default: Tire Specialist (also handles order_tire_online)
        return TIRE_AGENT_ARN


@app.entrypoint
def invoke(payload):
    """AgentCore Runtime entrypoint — classify intent and route to specialist."""
    user_input = payload.get("prompt", "")
    session_id = payload.get("session_id", "default")
    actor_id = payload.get("actor_id", "fleet_manager")

    print(f"🎯 ORCHESTRATOR INVOKE: {user_input[:80]}")

    # Classify and pick the target specialist
    target_arn = classify_and_route(user_input)
    print(f"📡 Routing to: {target_arn}")

    # Forward the full payload to the specialist agent
    response = agentcore_client.invoke_agent_runtime(
        agentRuntimeArn=target_arn,
        runtimeSessionId=session_id,
        payload=json.dumps(payload),
    )

    # Read and return specialist response without modification
    # The response may be JSON-encoded (with escaped newlines) — unwrap if so
    result = response["response"].read().decode("utf-8")
    try:
        parsed = json.loads(result)
        if isinstance(parsed, str):
            return parsed
    except (json.JSONDecodeError, TypeError):
        pass
    return result


if __name__ == "__main__":
    app.run()
