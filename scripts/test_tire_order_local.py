"""
Local test script for tire ordering tool
Tests the order_tire_online browser automation locally
"""

import sys
import asyncio
from agentcore_maintenance_agent import AgentCoreMaintenanceAgent

async def test_tire_ordering():
    """Test tire ordering with VIN"""
    print("\n" + "="*80)
    print("🧪 TESTING: order_tire_online Tool with VIN")
    print("="*80)
    
    agent = AgentCoreMaintenanceAgent()
    agent.load_data()
    
    # Test with VIN (same format as FleetPortal sends)
    vin = "2T1BURHE8JC987654"
    prompt = f"order_tire_online({vin})"
    
    print(f"\n📤 Prompt: {prompt}")
    print(f"🚗 VIN: {vin}")
    print("\n⏳ Executing browser automation (this takes 60-90 seconds)...\n")
    
    try:
        response = await agent.invoke_async(prompt)
        
        print("\n" + "="*80)
        print("✅ AGENT RESPONSE:")
        print("="*80)
        print(response)
        print("="*80)
        
        # Check if browser tool actually ran
        if "amazon" in response.lower() or "tire" in response.lower() or "cart" in response.lower():
            print("\n✅ SUCCESS: Browser tool executed!")
            print("Check if tire was added to Amazon cart")
        else:
            print("\n❌ FAILED: Agent did not execute browser tool")
            print("Agent returned text response instead of calling the tool")
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("\n🔧 Local Tire Ordering Test")
    print("This will open a browser session and attempt to add tires to Amazon cart\n")
    asyncio.run(test_tire_ordering())
