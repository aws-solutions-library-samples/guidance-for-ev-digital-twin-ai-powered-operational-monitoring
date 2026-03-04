#!/usr/bin/env python3
"""
AgentCore Runtime for Tire Ordering
Standalone agent for ordering tires online using browser automation
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel
from strands.tools import tool
import pandas as pd
import json
import boto3
import os
from typing import Optional

# Import browser automation
try:
    from nova_act import NovaAct
    from bedrock_agentcore.tools.browser_client import browser_session
    BROWSER_AVAILABLE = True
except Exception as e:
    BROWSER_AVAILABLE = False
    NovaAct = None
    browser_session = None

# Model configuration - Claude Sonnet 4.5
MODEL_ID = "global.anthropic.claude-sonnet-4-5-20250929-v1:0"

# Browser Tool configuration - loaded from Secrets Manager
def get_nova_act_key():
    try:
        import json
        client = boto3.client('secretsmanager', region_name='us-east-1')
        response = client.get_secret_value(SecretId='/vehicle-maintenance/novaact-api-key')
        return json.loads(response['SecretString'])['NOVA_ACT_API_KEY']
    except Exception:
        return os.environ.get('NOVA_ACT_API_KEY', '')

NOVA_ACT_API_KEY = get_nova_act_key()

# System prompt for tire ordering agent
SYSTEM_PROMPT = """You are a tire ordering assistant that helps customers order replacement tires online.

Your role is to:
1. Look up the correct tire specifications for a vehicle
2. Automatically search and order tires from Amazon
3. Provide order confirmation and product details

When ordering tires:
- Always verify the tire size and specifications first
- Use browser automation to search Amazon
- Add the first highly-rated tire to cart
- Confirm the product name, brand, and price

Be helpful and provide clear confirmation of what was ordered."""


class TireOrderingAgent:
    """Tire ordering agent with data loading capabilities"""
    
    def __init__(self):
        self.tire_data = None
        self.vehicle_specs = None
    
    def load_data(self):
        """Load tire and vehicle specification data"""
        try:
            self.tire_data = pd.read_csv('tire_wear_data.csv')
            self.vehicle_specs = pd.read_csv('car_manual_specs.csv')
            print("✓ Tire data and vehicle specs loaded successfully")
        except Exception as e:
            print(f"⚠️  Warning: Could not load data files: {e}")
            self.tire_data = None
            self.vehicle_specs = None


# Global agent instance
agent_instance = TireOrderingAgent()


@tool
def get_vehicle_tire_specs(vehicle_id: int) -> str:
    """
    Get tire specifications for a vehicle.
    
    Args:
        vehicle_id: The vehicle ID
        
    Returns:
        Tire specifications including size, brand, and recommended pressure
    """
    try:
        if agent_instance.tire_data is None:
            agent_instance.load_data()
        
        if agent_instance.tire_data is None:
            return json.dumps({"error": "Tire data not available"})
        
        # Get vehicle tire data
        vehicle_data = agent_instance.tire_data[
            agent_instance.tire_data['vehicle_id'] == vehicle_id
        ]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No data found for vehicle {vehicle_id}"})
        
        vehicle_info = vehicle_data.iloc[0]
        
        # Get manual specs if available
        specs = {}
        if agent_instance.vehicle_specs is not None:
            vin = vehicle_info.get('make', f'EV-100{vehicle_id}')
            spec_data = agent_instance.vehicle_specs[
                agent_instance.vehicle_specs['vin'] == vin
            ]
            if not spec_data.empty:
                spec_info = spec_data.iloc[0]
                specs = {
                    "recommended_pressure_psi": int(spec_info.get('recommended_pressure_psi', 32)),
                    "min_tread_depth_mm": float(spec_info.get('min_tread_depth_mm', 1.6)),
                    "replacement_threshold_mm": float(spec_info.get('replacement_threshold_mm', 3.2))
                }
        
        return json.dumps({
            "vehicle_id": int(vehicle_id),
            "vin": str(vehicle_info.get('make', f'EV-100{vehicle_id}')),
            "tire_size": str(vehicle_info['tire_size']),
            "tire_brand": str(vehicle_info['tire_brand']),
            "vehicle_type": str(vehicle_info.get('vehicle_class', 'Electric Vehicle')),
            "specifications": specs
        }, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Failed to get tire specs: {str(e)}"})


@tool
def order_tire_online(vehicle_id: int, quantity: int = 4) -> str:
    """
    Automatically order tires online from Amazon using browser automation.
    
    Args:
        vehicle_id: The vehicle ID to order tires for
        quantity: Number of tires to order (default: 4)
        
    Returns:
        Order status and product details from browser automation
    """
    print(f"\n{'='*80}")
    print(f"🔧 TOOL EXECUTION: order_tire_online(vehicle_id={vehicle_id}, quantity={quantity})")
    print(f"{'='*80}\n")
    
    if not BROWSER_AVAILABLE:
        return json.dumps({
            "success": False,
            "error": "Browser automation not available in this runtime",
            "vehicle_id": int(vehicle_id)
        }, indent=2)
    
    tire_size = None
    tire_brand = None
    result_response = None
    
    try:
        if agent_instance.tire_data is None:
            agent_instance.load_data()
        
        # Get vehicle tire specs
        vehicle_data = agent_instance.tire_data[
            agent_instance.tire_data['vehicle_id'] == vehicle_id
        ]
        
        if vehicle_data.empty:
            return json.dumps({
                "success": False,
                "error": f"No data found for vehicle {vehicle_id}"
            }, indent=2)
        
        vehicle_info = vehicle_data.iloc[0]
        tire_size = str(vehicle_info['tire_size'])
        tire_brand = str(vehicle_info['tire_brand'])
        print(f"✓ Vehicle data loaded: {tire_size} {tire_brand}")
        
        # Start browser session
        print("✓ Starting browser session...")
        with browser_session(region="us-east-1") as client:  # type: ignore
            ws_url, headers = client.generate_ws_headers()
            starting_page = "https://www.amazon.com"
            print(f"✓ Browser session created: {starting_page}")
            
            prompt = f"""
            Type "{tire_size} tires" in the search bar at the top of this Amazon page and press Enter.
            Wait for Amazon search results to load.
            Click on the first highly-rated tire in the Amazon results.
            Click the Add to Cart button.
            Wait for the cart to update and verify it shows 1 item.
            Return the product name, brand, and price.
            """
            
            print(f"✓ Executing browser automation for: {tire_size} tires")
            with NovaAct(
                cdp_endpoint_url=ws_url,
                cdp_headers=headers,
                preview={"playwright_actuation": True},
                nova_act_api_key=NOVA_ACT_API_KEY,
                starting_page=starting_page
            ) as nova_act:
                result = nova_act.act(prompt)
                result_response = str(result.response) if result else None
                print(f"✓ Browser automation completed")
        
        print(f"\n{'='*80}")
        print(f"✅ TOOL EXECUTION COMPLETED")
        print(f"{'='*80}\n")
        
        return json.dumps({
            "success": True,
            "vehicle_id": int(vehicle_id),
            "tire_size": tire_size,
            "quantity": quantity,
            "order_details": result_response or "Tire added to cart successfully",
            "message": f"Successfully added {tire_size} tires to Amazon cart"
        }, indent=2)
            
    except Exception as e:
        print(f"\n{'='*80}")
        print(f"❌ TOOL EXECUTION FAILED: {str(e)}")
        print(f"{'='*80}\n")
        
        return json.dumps({
            "success": False,
            "vehicle_id": int(vehicle_id),
            "tire_size": tire_size or "Unknown",
            "error": str(e),
            "message": "Failed to complete tire order"
        }, indent=2)


@tool
def search_tire_prices(tire_size: str, brand: Optional[str] = None) -> str:
    """
    Search for tire prices without ordering.
    
    Args:
        tire_size: Tire size (e.g., "215/55R17")
        brand: Optional tire brand to search for
        
    Returns:
        Price information and available options
    """
    search_query = f"{tire_size} {brand} tires" if brand else f"{tire_size} tires"
    
    return json.dumps({
        "search_query": search_query,
        "message": "Use order_tire_online to automatically search and order tires",
        "note": "Browser automation will find the best-rated tire and add to cart"
    }, indent=2)


# Create the Bedrock model
model = BedrockModel(model_id=MODEL_ID)

# Load data on startup
agent_instance.load_data()

# Create the agent with tire ordering tools
agent = Agent(
    model=model,
    tools=[
        get_vehicle_tire_specs,
        order_tire_online,
        search_tire_prices
    ],
    system_prompt=SYSTEM_PROMPT
)

# Initialize the AgentCore Runtime App
app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload):
    """AgentCore Runtime entrypoint function"""
    user_input = payload.get("prompt", "")
    
    # Invoke the agent
    response = agent(user_input)
    return response.message["content"][0]["text"]

if __name__ == "__main__":
    app.run()
