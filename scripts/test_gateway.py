#!/usr/bin/env python3
"""
Test the AgentCore Gateway vehicle history tools.

Usage:
    python scripts/test_gateway.py
    python scripts/test_gateway.py --vehicle-id 1 --category tire
"""

import json
import argparse
import os
import sys


def test_gateway(vehicle_id="1", category="all"):
    """Test Gateway tools via MCP client."""
    
    config_path = os.path.join(os.path.dirname(__file__), '..', 'gateway_config.json')
    
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        print("❌ gateway_config.json not found. Run setup_gateway.py first.")
        sys.exit(1)
    
    from bedrock_agentcore_starter_toolkit.operations.gateway.client import GatewayClient
    from strands.tools.mcp.mcp_client import MCPClient
    from mcp.client.streamable_http import streamablehttp_client
    
    gateway_url = config["gateway_url"]
    client_info = config["client_info"]
    
    # Get access token
    print("🔑 Getting access token...")
    gw_client = GatewayClient(region_name=config["region"])
    access_token = gw_client.get_access_token_for_cognito(client_info)
    print("✅ Token obtained\n")
    
    # Connect to Gateway
    print(f"🌐 Connecting to Gateway: {gateway_url}")
    
    def create_transport():
        return streamablehttp_client(
            gateway_url,
            headers={"Authorization": f"Bearer {access_token}"}
        )
    
    mcp_client = MCPClient(create_transport)
    
    with mcp_client:
        # List tools
        tools = mcp_client.list_tools_sync()
        print(f"📋 Available tools: {[t.tool_name for t in tools]}\n")
        
        # Test get_vehicle_history
        print(f"🔍 Testing get_vehicle_history(vehicle_id={vehicle_id}, category={category})")
        print("-" * 60)
        
        result = mcp_client.call_tool_sync(
            "get_vehicle_history",
            {"vehicle_id": vehicle_id, "category": category, "limit": 10}
        )
        
        if result:
            data = json.loads(result[0].text) if hasattr(result[0], 'text') else result
            print(json.dumps(data, indent=2))
        
        print()
        
        # Test generate_vehicle_report
        print(f"📊 Testing generate_vehicle_report(vehicle_id={vehicle_id})")
        print("-" * 60)
        
        result = mcp_client.call_tool_sync(
            "generate_vehicle_report",
            {"vehicle_id": vehicle_id, "include_recommendations": True}
        )
        
        if result:
            data = json.loads(result[0].text) if hasattr(result[0], 'text') else result
            print(json.dumps(data, indent=2))
    
    print("\n✅ Gateway test complete!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--vehicle-id', default='1')
    parser.add_argument('--category', default='all')
    args = parser.parse_args()
    test_gateway(args.vehicle_id, args.category)
