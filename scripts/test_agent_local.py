"""
Local test script for AgentCore maintenance agent
Tests tool execution without deploying to AWS
"""

import sys
import asyncio
from agentcore_maintenance_agent import AgentCoreMaintenanceAgent

async def test_tire_ordering():
    """Test if order_tire_online tool actually executes"""
    print("\n" + "="*60)
    print("TEST: Tire Ordering Tool Execution")
    print("="*60)
    
    agent = AgentCoreMaintenanceAgent()
    agent.load_data()
    
    # Test prompt (same as FleetPortal sends)
    prompt = "order_tire_online(2T1BURHE8JC987654)"
    
    print(f"\n📤 Sending prompt: {prompt}")
    print("\n⏳ Waiting for agent response...\n")
    
    try:
        response = await agent.invoke_async(prompt)
        print("\n✅ Agent Response:")
        print("-" * 60)
        print(response)
        print("-" * 60)
        
        # Check if browser tool actually ran
        if "nova_act" in response.lower() or "amazon" in response.lower():
            print("\n✅ Browser tool executed!")
        else:
            print("\n❌ Browser tool DID NOT execute - agent returned text fallback")
            
    except Exception as e:
        print(f"\n❌ Agent crashed: {e}")
        import traceback
        traceback.print_exc()

async def test_appointment_scheduling():
    """Test if schedule_appointment tool executes"""
    print("\n" + "="*60)
    print("TEST: Appointment Scheduling Tool Execution")
    print("="*60)
    
    agent = AgentCoreMaintenanceAgent()
    agent.load_data()
    
    prompt = """CONTEXT: Vehicle 1 has tire maintenance issue.
User's scheduling request: "schedule for tomorrow!"

Use the schedule_appointment tool with vehicle_id=1, service type tire_replacement, and date 2025-11-14."""
    
    print(f"\n📤 Sending prompt")
    print("\n⏳ Waiting for agent response...\n")
    
    try:
        response = await agent.invoke_async(prompt)
        print("\n✅ Agent Response:")
        print("-" * 60)
        print(response)
        print("-" * 60)
        
        if "schedule_appointment" in response.lower() or "appointment" in response.lower():
            print("\n✅ Scheduling tool executed!")
        else:
            print("\n❌ Scheduling tool DID NOT execute")
            
    except Exception as e:
        print(f"\n❌ Agent crashed: {e}")

async def main():
    print("\n🧪 AGENTCORE LOCAL TESTING")
    print("Testing tool execution behavior\n")
    
    # Test 1: Tire ordering
    await test_tire_ordering()
    
    # Wait between tests
    await asyncio.sleep(2)
    
    # Test 2: Appointment scheduling
    await test_appointment_scheduling()
    
    print("\n" + "="*60)
    print("TESTING COMPLETE")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
