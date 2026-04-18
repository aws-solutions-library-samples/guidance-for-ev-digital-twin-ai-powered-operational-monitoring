"""
Vehicle History Lambda - AgentCore Gateway Tool
Retrieves vehicle maintenance history from AgentCore Memory.
Exposed as an MCP tool via AgentCore Gateway.

Gateway invokes this Lambda with the tool arguments as the event payload.
The tool name is passed via context.client_context.custom['bedrockAgentCoreToolName'].
"""

import json
import boto3
import os
from datetime import datetime

# Initialize AgentCore data plane client
agentcore_client = boto3.client('bedrock-agentcore', region_name='us-east-1')

# Memory configuration from environment
MEMORY_ID = os.environ.get('AGENTCORE_MEMORY_ID', '')
MEMORY_NAMESPACE = os.environ.get('MEMORY_NAMESPACE', '/strategies/semantic_builtin_j1hpp-7SvGWG8R9T/actors/fleet_manager')

# VIN mapping (same as used across the project)
VIN_MAP = {
    "1": "2T1BURHE8JC987654",
    "2": "5YJSA1E26HF123456",
    "3": "1HGBH41JXMN109186",
    "EV-1001": "2T1BURHE8JC987654",
    "EV-1002": "5YJSA1E26HF123456",
    "EV-1003": "1HGBH41JXMN109186",
}


def lambda_handler(event, context):
    """
    Gateway Lambda handler for vehicle history tools.
    
    Gateway passes tool arguments directly as the event.
    Tool name comes from context.client_context.custom['bedrockAgentCoreToolName'].
    """
    print(f"📥 Event: {json.dumps(event)}")
    
    # Determine which tool was called
    # Gateway passes only the tool arguments as the event — no tool name in context.
    # Detection strategy:
    #   1. Explicit 'tool_name' field (direct invocation)
    #   2. context.client_context (if available)
    #   3. Argument-based detection: 'include_recommendations' is unique to generate_vehicle_report
    tool_name = event.pop('tool_name', None)
    
    if not tool_name and context and hasattr(context, 'client_context'):
        try:
            cc = context.client_context
            if isinstance(cc, str):
                import json as _json
                cc = _json.loads(cc)
            if isinstance(cc, dict):
                custom = cc.get('custom', {})
                if isinstance(custom, str):
                    custom = _json.loads(custom)
                gw_tool = custom.get('bedrockAgentCoreToolName', '')
                if gw_tool:
                    tool_name = gw_tool.split('___')[-1] if '___' in gw_tool else gw_tool
        except Exception:
            pass
    
    if not tool_name:
        # Detect by argument signature
        if 'include_recommendations' in event:
            tool_name = 'generate_vehicle_report'
        else:
            tool_name = 'get_vehicle_history'
    
    print(f"🔧 Tool: {tool_name}")
    
    if tool_name == 'get_vehicle_history':
        return get_vehicle_history(event)
    elif tool_name == 'generate_vehicle_report':
        return generate_vehicle_report(event)
    else:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': f'Unknown tool: {tool_name}'})
        }


def get_vehicle_history(event):
    """
    Retrieve maintenance history for a vehicle from AgentCore Memory.
    
    Args (from event):
        vehicle_id: Vehicle identifier (e.g., "1", "EV-1001", or VIN)
        category: Optional filter - "tire", "motor", "inverter", "appointment", or "all"
        limit: Max number of records to return (default 20)
    """
    vehicle_id = event.get('vehicle_id', '')
    category = event.get('category', 'all').lower()
    limit = min(int(event.get('limit', 20)), 50)
    
    if not vehicle_id:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'vehicle_id is required'})
        }
    
    if not MEMORY_ID:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'AGENTCORE_MEMORY_ID not configured'})
        }
    
    # Build search query based on category
    if category == 'all':
        query = f"vehicle {vehicle_id} maintenance issues history"
    elif category == 'appointment':
        query = f"vehicle {vehicle_id} appointment scheduled service"
    else:
        query = f"vehicle {vehicle_id} {category} issues problems analysis"
    
    try:
        print(f"🔍 Retrieving memories for vehicle {vehicle_id}, category={category}")
        
        response = agentcore_client.retrieve_memory_records(
            memoryId=MEMORY_ID,
            namespace=MEMORY_NAMESPACE,
            searchCriteria={
                'searchQuery': query,
                'topK': limit
            }
        )
        
        records = response.get('memoryRecordSummaries', [])
        print(f"✅ Found {len(records)} memory records")
        
        # Parse and categorize memories
        history = []
        for record in records:
            content = record.get('content', {})
            text = content.get('text', '')
            score = record.get('score', 0)
            created_at = record.get('createdAt')
            record_id = record.get('memoryRecordId', '')
            
            # Categorize the memory
            record_category = categorize_memory(text)
            
            # Apply category filter
            if category != 'all' and record_category != category:
                continue
            
            history.append({
                'id': record_id,
                'text': clean_memory_text(text),
                'category': record_category,
                'relevance_score': round(score, 3) if score else 0,
                'created_at': str(created_at) if created_at else None
            })
        
        # Sort by relevance
        history.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        result = {
            'vehicle_id': vehicle_id,
            'category': category,
            'total_records': len(history),
            'history': history,
            'retrieved_at': datetime.now().isoformat()
        }
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        print(f"❌ Error retrieving vehicle history: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def categorize_memory(text):
    """Categorize a memory record based on its content."""
    text_lower = text.lower()
    
    if any(w in text_lower for w in ['tire', 'tread', 'pressure', 'wheel', 'alignment', 'wear']):
        return 'tire'
    elif any(w in text_lower for w in ['motor', 'engine', 'rpm', 'vibration', 'oil']):
        return 'motor'
    elif any(w in text_lower for w in ['inverter', 'power electronics', 'thermal', 'coolant']):
        return 'inverter'
    elif any(w in text_lower for w in ['appointment', 'schedule', 'slot', 'service date']):
        return 'appointment'
    else:
        return 'general'

def clean_memory_text(text):
    """Strip XML/topic tags from memory text and clean up whitespace."""
    import re
    # Remove <topic ...> and </topic> tags
    text = re.sub(r'</?topic[^>]*>', '', text)
    # Collapse multiple newlines/whitespace
    text = re.sub(r'\n\s*\n', '\n', text).strip()
    return text



def generate_vehicle_report(event):
    """
    Generate a maintenance summary report for a vehicle.
    Pulls all history and produces a structured report.
    
    Args (from event):
        vehicle_id: Vehicle identifier
        include_recommendations: Whether to include action items (default true)
    """
    vehicle_id = event.get('vehicle_id', '')
    include_recommendations = event.get('include_recommendations', True)
    
    if not vehicle_id:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'vehicle_id is required'})
        }
    
    if not MEMORY_ID:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'AGENTCORE_MEMORY_ID not configured'})
        }
    
    try:
        # Pull all categories
        categories = ['tire', 'motor', 'inverter', 'appointment']
        report_sections = {}
        
        for cat in categories:
            query = f"vehicle {vehicle_id} {cat} issues problems analysis history"
            
            response = agentcore_client.retrieve_memory_records(
                memoryId=MEMORY_ID,
                namespace=MEMORY_NAMESPACE,
                searchCriteria={
                    'searchQuery': query,
                    'topK': 10
                }
            )
            
            records = response.get('memoryRecordSummaries', [])
            section_items = []
            
            for record in records:
                text = record.get('content', {}).get('text', '')
                record_cat = categorize_memory(text)
                if record_cat == cat:
                    section_items.append(clean_memory_text(text))
            
            report_sections[cat] = {
                'count': len(section_items),
                'items': section_items
            }
        
        # Build report
        report = {
            'vehicle_id': vehicle_id,
            'report_type': 'maintenance_summary',
            'generated_at': datetime.now().isoformat(),
            'sections': report_sections,
            'total_records': sum(s['count'] for s in report_sections.values())
        }
        
        if include_recommendations:
            recommendations = []
            
            tire_count = report_sections['tire']['count']
            motor_count = report_sections['motor']['count']
            inverter_count = report_sections['inverter']['count']
            
            if tire_count > 3:
                recommendations.append({
                    'priority': 'HIGH',
                    'system': 'tire',
                    'action': f'Recurring tire issues detected ({tire_count} records). Schedule comprehensive tire inspection.'
                })
            elif tire_count > 0:
                recommendations.append({
                    'priority': 'MEDIUM',
                    'system': 'tire',
                    'action': 'Monitor tire condition. Previous issues on record.'
                })
            
            if motor_count > 2:
                recommendations.append({
                    'priority': 'HIGH',
                    'system': 'motor',
                    'action': f'Multiple motor issues detected ({motor_count} records). Prioritize motor diagnostics.'
                })
            
            if inverter_count > 2:
                recommendations.append({
                    'priority': 'HIGH',
                    'system': 'inverter',
                    'action': f'Inverter issues recurring ({inverter_count} records). Check cooling system.'
                })
            
            if not recommendations:
                recommendations.append({
                    'priority': 'LOW',
                    'system': 'general',
                    'action': 'No recurring issues detected. Continue regular maintenance schedule.'
                })
            
            report['recommendations'] = recommendations
        
        return {
            'statusCode': 200,
            'body': json.dumps(report)
        }
        
    except Exception as e:
        print(f"❌ Error generating report: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
