#!/usr/bin/env python3
"""
Inverter Specialist Agent — AgentCore Runtime entry point.
Creates a Strands Agent with SYSTEM_PROMPT_INVERTER, inverter tools + KB tool,
and the same BedrockModel config as the original monolith.
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
import os
import sys

# Add parent dir so shared module is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.model_config import create_bedrock_model
from shared.system_prompts import SYSTEM_PROMPT_INVERTER

# Import inverter-specific tools
from inverter_tools import (
    analyze_inverter_condition,
    predict_inverter_degradation,
)

# Import Knowledge Base tools (inverter-related)
try:
    from shared.knowledge_base_tools import get_inverter_maintenance_guidance
    KB_AVAILABLE = bool(os.environ.get('KNOWLEDGE_BASE_ID'))
except ImportError:
    KB_AVAILABLE = False
    print("⚠️  Knowledge Base tools not available")

# Build tools list
tools_list = [
    analyze_inverter_condition,
    predict_inverter_degradation,
]

if KB_AVAILABLE:
    tools_list.append(get_inverter_maintenance_guidance)
    print("✅ Knowledge Base tools enabled (Inverter)")
else:
    print("ℹ️  Knowledge Base tools not available - using embedded knowledge only")

# Create the Strands Agent at startup
model = create_bedrock_model()
inverter_agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT_INVERTER,
    tools=tools_list,
)

# Initialize the AgentCore Runtime App
app = BedrockAgentCoreApp()


@app.entrypoint
def invoke(payload):
    """AgentCore Runtime entrypoint for Inverter Specialist Agent."""
    user_input = payload.get("prompt", "")
    session_id = payload.get("session_id", "default")

    print(f"⚡ INVERTER AGENT INVOKE: {user_input[:50]}")

    response = inverter_agent(user_input)

    if hasattr(response, 'text'):
        return response.text
    elif hasattr(response, 'message') and response.message.get("content"):
        content = response.message["content"]
        if content and len(content) > 0:
            return content[0].get("text", str(response))

    return str(response)


if __name__ == "__main__":
    app.run()
