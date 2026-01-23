#!/usr/bin/env python3
"""
Check Browser Tool Configuration
Verifies that the AgentCore Runtime has the browser tool properly configured
"""

import boto3
import json

def main():
    print("🔍 Checking Browser Tool Configuration\n")
    
    # Initialize clients
    cfn = boto3.client('cloudformation', region_name='us-east-1')
    agentcore = boto3.client('bedrock-agentcore', region_name='us-east-1')
    
    # Step 1: Get browser tool ID from CloudFormation
    print("1️⃣  Getting Browser Tool ID from CloudFormation...")
    try:
        response = cfn.describe_stacks(StackName='ev-digital-twin-browser-tool')
        outputs = response['Stacks'][0]['Outputs']
        
        browser_tool_id = None
        for output in outputs:
            if output['OutputKey'] == 'BrowserToolId':
                browser_tool_id = output['OutputValue']
                break
        
        if browser_tool_id:
            print(f"   ✅ Browser Tool ID: {browser_tool_id}")
        else:
            print("   ❌ BrowserToolId output not found in stack")
            return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Step 2: Get AgentCore Runtime ID
    print("\n2️⃣  Getting AgentCore Runtime...")
    try:
        runtimes = agentcore.list_runtimes()
        
        maintenance_runtime = None
        for runtime in runtimes.get('runtimes', []):
            if 'vehicle_maintenance' in runtime['name'].lower():
                maintenance_runtime = runtime
                break
        
        if not maintenance_runtime:
            print("   ❌ vehicle_maintenance_agent runtime not found")
            print("   Available runtimes:")
            for runtime in runtimes.get('runtimes', []):
                print(f"      - {runtime['name']} ({runtime['runtimeId']})")
            return
        
        runtime_id = maintenance_runtime['runtimeId']
        runtime_arn = f"arn:aws:bedrock-agentcore:us-east-1:{boto3.client('sts').get_caller_identity()['Account']}:runtime/{runtime_id}"
        
        print(f"   ✅ Runtime: {maintenance_runtime['name']}")
        print(f"   ✅ Runtime ID: {runtime_id}")
        print(f"   ✅ Status: {maintenance_runtime['status']}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Step 3: Check if runtime has browser tool configured
    print("\n3️⃣  Checking Runtime Configuration...")
    try:
        runtime_details = agentcore.get_runtime(runtimeId=runtime_id)
        
        # Check if browser tool is in the runtime's tools
        tools = runtime_details.get('tools', [])
        
        browser_tool_found = False
        for tool in tools:
            if tool.get('type') == 'browser' or browser_tool_id in str(tool):
                browser_tool_found = True
                print(f"   ✅ Browser tool found in runtime configuration")
                print(f"      Tool: {json.dumps(tool, indent=6)}")
                break
        
        if not browser_tool_found:
            print(f"   ❌ Browser tool NOT configured in runtime")
            print(f"\n   📋 Current tools in runtime:")
            for tool in tools:
                print(f"      - {tool.get('type', 'unknown')}: {tool.get('name', 'unnamed')}")
            
            print(f"\n   ⚠️  ACTION REQUIRED:")
            print(f"      The AgentCore Runtime needs to have the browser tool added.")
            print(f"      You need to update the runtime configuration to include:")
            print(f"      Browser Tool ID: {browser_tool_id}")
            print(f"\n      This is typically done through the AWS Console:")
            print(f"      1. Go to Bedrock AgentCore Console")
            print(f"      2. Select runtime: {maintenance_runtime['name']}")
            print(f"      3. Edit Tools configuration")
            print(f"      4. Add Browser Tool: {browser_tool_id}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Step 4: Test browser tool directly
    print("\n4️⃣  Testing Browser Tool Directly...")
    try:
        # Try to start a test session
        session_response = agentcore.start_browser_session(
            browserIdentifier=browser_tool_id,
            name="test-session",
            sessionTimeoutSeconds=300
        )
        
        session_id = session_response['sessionId']
        print(f"   ✅ Browser tool is accessible")
        print(f"   ✅ Test session created: {session_id[:30]}...")
        
        # Clean up test session
        try:
            agentcore.stop_browser_session(
                browserIdentifier=browser_tool_id,
                sessionId=session_id
            )
            print(f"   ✅ Test session cleaned up")
        except:
            pass
            
    except Exception as e:
        print(f"   ❌ Error testing browser tool: {e}")
    
    print("\n" + "="*60)
    print("Summary:")
    print(f"  Browser Tool ID: {browser_tool_id}")
    print(f"  Runtime ID: {runtime_id}")
    print(f"  Browser Tool in Runtime: {'✅ Yes' if browser_tool_found else '❌ No'}")
    print("="*60)

if __name__ == "__main__":
    main()
