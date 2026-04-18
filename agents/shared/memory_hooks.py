"""
MaintenanceMemoryHooks class for cross-vehicle pattern detection.
Moved verbatim from agentcore_maintenance_agent.py.
"""

from strands.hooks import AfterInvocationEvent, HookProvider, HookRegistry, MessageAddedEvent
from bedrock_agentcore.memory import MemoryClient


class MaintenanceMemoryHooks(HookProvider):
    """Memory hooks for pattern and recurring issue detection"""

    def __init__(self, memory_id: str, client: MemoryClient, actor_id: str, session_id: str):
        self.memory_id = memory_id
        self.client = client
        self.actor_id = actor_id
        self.session_id = session_id
        self.browser_tool_active = False  # Track if browser tool is running

    def retrieve_context(self, event: MessageAddedEvent):
        """Check for recurring issues and cross-vehicle patterns"""
        # CRITICAL: Skip ALL memory retrieval if browser tool is active
        # Browser tools (NovaAct) create internal messages that trigger this hook
        # Modifying messages during tool execution corrupts conversation state
        if self.browser_tool_active:
            return

        messages = event.agent.messages
        if messages[-1]["role"] == "user" and "toolResult" not in messages[-1]["content"][0]:
            user_query = messages[-1]["content"][0]["text"]

            # Extract vehicle ID from query
            import re
            vehicle_match = re.search(r'vehicle[\s_]*(\d+)', user_query.lower())
            if not vehicle_match:
                return

            vehicle_id = vehicle_match.group(1)

            try:
                # Retrieve past issues for this vehicle from LTM
                print(f"🔍 MEMORY RETRIEVAL: Searching for vehicle {vehicle_id} history...")
                memories = self.client.retrieve_memories(
                    memory_id=self.memory_id,
                    namespace="/strategies/semantic_builtin_j1hpp-7SvGWG8R9T/actors/fleet_manager",
                    query=f"vehicle {vehicle_id} issues problems",
                    top_k=10
                )
                print(f"   Found {len(memories) if memories else 0} relevant memories")

                if not memories:
                    return

                # Parse memories for patterns
                current_vehicle_issues = []
                other_vehicle_issues = []

                for mem in memories:
                    if isinstance(mem, dict):
                        text = mem.get("content", {}).get("text", "")
                        if f"Vehicle {vehicle_id}:" in text:
                            current_vehicle_issues.append(text)
                        elif "Vehicle" in text:
                            other_vehicle_issues.append(text)

                # Build context warnings
                warnings = []
                if len(current_vehicle_issues) > 1:
                    warnings.append(f"⚠️ RECURRING ISSUE: Vehicle {vehicle_id} has {len(current_vehicle_issues)} previous issues in history")

                # Check for similar issues in other vehicles
                if current_vehicle_issues and other_vehicle_issues:
                    issue_type = None
                    if "tire" in user_query.lower() or any("tire" in issue.lower() for issue in current_vehicle_issues):
                        issue_type = "tire"
                    elif "motor" in user_query.lower() or any("motor" in issue.lower() for issue in current_vehicle_issues):
                        issue_type = "motor"

                    if issue_type:
                        similar_count = sum(1 for issue in other_vehicle_issues if issue_type in issue.lower())
                        if similar_count > 0:
                            warnings.append(f"⚠️ FLEET PATTERN: {similar_count} other vehicle(s) have similar {issue_type} issues")

                # Inject warnings into query
                if warnings:
                    original_text = messages[-1]["content"][0]["text"]
                    context = "\n".join(warnings)
                    messages[-1]["content"][0]["text"] = f"{context}\n\n{original_text}"

            except Exception as e:
                print(f"Memory retrieval error: {e}")

    def save_interaction(self, event: AfterInvocationEvent):
        """Save detected issues to memory"""
        try:
            messages = event.agent.messages
            if len(messages) < 2 or messages[-1]["role"] != "assistant":
                return

            # Get user query and agent response
            user_msg = None
            agent_msg = None

            for msg in reversed(messages):
                if msg["role"] == "assistant" and not agent_msg:
                    agent_msg = msg["content"][0]["text"]
                elif msg["role"] == "user" and not user_msg and "toolResult" not in msg["content"][0]:
                    user_msg = msg["content"][0]["text"]
                    break

            if not user_msg or not agent_msg:
                return

            # Extract vehicle ID and issue type
            import re
            vehicle_match = re.search(r'vehicle[\s_]*(\d+)', user_msg.lower())
            if not vehicle_match:
                return

            vehicle_id = vehicle_match.group(1)

            # Detect issue type from response
            issue_type = None
            if "CRITICAL" in agent_msg or "WARNING" in agent_msg:
                if "tire" in agent_msg.lower() or "pressure" in agent_msg.lower() or "tread" in agent_msg.lower():
                    issue_type = "tire_issue"
                elif "motor" in agent_msg.lower() or "engine" in agent_msg.lower() or "temperature" in agent_msg.lower():
                    issue_type = "motor_issue"
                elif "inverter" in agent_msg.lower():
                    issue_type = "inverter_issue"

            # Save to memory with structured format
            if issue_type:
                from datetime import datetime
                issue_summary = f"Vehicle {vehicle_id}: {issue_type} detected on {datetime.now().strftime('%Y-%m-%d')}"

                self.client.create_event(
                    memory_id=self.memory_id,
                    actor_id=self.actor_id,
                    session_id=self.session_id,
                    messages=[
                        (user_msg, "USER"),
                        (f"{issue_summary}\n{agent_msg}", "ASSISTANT")
                    ]
                )
            else:
                # Save normal interaction
                self.client.create_event(
                    memory_id=self.memory_id,
                    actor_id=self.actor_id,
                    session_id=self.session_id,
                    messages=[(user_msg, "USER"), (agent_msg, "ASSISTANT")]
                )

        except Exception as e:
            print(f"Memory save error: {e}")

    def register_hooks(self, registry: HookRegistry) -> None:
        registry.add_callback(MessageAddedEvent, self.retrieve_context)
        registry.add_callback(AfterInvocationEvent, self.save_interaction)
