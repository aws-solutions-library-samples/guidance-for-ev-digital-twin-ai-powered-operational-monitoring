"""
Gateway Proxy Lambda
Proxies frontend requests to AgentCore Gateway MCP tools.
Handles OAuth token management and MCP protocol translation.

Routes:
  GET /vehicle-history/{vehicleId}?category=all&limit=20
  GET /vehicle-report/{vehicleId}?include_recommendations=true
"""

import json
import os
import uuid
import base64
import time
from urllib import request as urllib_request
from urllib.parse import urlencode

# Gateway config
GATEWAY_URL = os.environ.get('AGENTCORE_GATEWAY_URL',
    'https://vehicle-maintenance-gateway-sajombqp8t.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp')
COGNITO_DOMAIN = os.environ.get('GATEWAY_COGNITO_DOMAIN',
    'https://agentcore-b00196cb.auth.us-east-1.amazoncognito.com')
CLIENT_ID = os.environ.get('GATEWAY_CLIENT_ID', '4j8tjl6c2eqrmsqkapuri2qn51')
CLIENT_SECRET = os.environ.get('GATEWAY_CLIENT_SECRET', '')
SCOPE = os.environ.get('GATEWAY_SCOPE', 'vehicle-maintenance-gateway/invoke')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json'
}

# Token cache (persists across warm Lambda invocations)
_token_cache = {'token': None, 'expires_at': 0}


def get_token():
    """Get OAuth token via Cognito client credentials flow. Cached."""
    now = time.time()
    if _token_cache['token'] and _token_cache['expires_at'] > now + 60:
        return _token_cache['token']

    if not CLIENT_SECRET:
        raise ValueError("GATEWAY_CLIENT_SECRET not set")

    creds = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    data = urlencode({'grant_type': 'client_credentials', 'scope': SCOPE}).encode()

    req = urllib_request.Request(
        f"{COGNITO_DOMAIN}/oauth2/token",
        data=data,
        headers={
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': f'Basic {creds}'
        }
    )

    with urllib_request.urlopen(req) as resp:
        token_data = json.loads(resp.read().decode())

    _token_cache['token'] = token_data['access_token']
    _token_cache['expires_at'] = now + token_data.get('expires_in', 3600)
    print("✅ Gateway token obtained")
    return _token_cache['token']


def call_gateway(tool_name, arguments):
    """Call MCP tools/call on AgentCore Gateway and unwrap the result."""
    token = get_token()

    payload = json.dumps({
        "jsonrpc": "2.0",
        "id": str(uuid.uuid4()),
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }).encode()

    req = urllib_request.Request(GATEWAY_URL, data=payload, headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    })

    with urllib_request.urlopen(req, timeout=25) as resp:
        raw = resp.read().decode()

    parsed = json.loads(raw)

    # Unwrap MCP response: result.content[0].text contains the Lambda response
    if 'result' in parsed:
        content = parsed['result'].get('content', [])
        if content and content[0].get('text'):
            inner = json.loads(content[0]['text'])
            # The Lambda returns {statusCode, body} — extract body
            if 'body' in inner:
                return json.loads(inner['body'])
            return inner

    if 'error' in parsed:
        raise Exception(parsed['error'].get('message', str(parsed['error'])))

    return parsed


def lambda_handler(event, context):
    print(f"📥 Event: {json.dumps(event)}")

    method = event.get('requestContext', {}).get('http', {}).get('method', '')
    path = event.get('rawPath', '')

    # CORS preflight
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    query_params = event.get('queryStringParameters', {}) or {}

    try:
        # GET /vehicle-history/{vehicleId}
        if path.startswith('/vehicle-history/'):
            vehicle_id = path.split('/')[-1]
            category = query_params.get('category', 'all')
            limit = int(query_params.get('limit', '20'))

            result = call_gateway(
                'VehicleHistoryTools___get_vehicle_history',
                {'vehicle_id': vehicle_id, 'category': category, 'limit': limit}
            )

            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps(result)
            }

        # GET /vehicle-report/{vehicleId}
        if path.startswith('/vehicle-report/'):
            vehicle_id = path.split('/')[-1]
            include_recs = query_params.get('include_recommendations', 'true').lower() == 'true'

            result = call_gateway(
                'VehicleHistoryTools___generate_vehicle_report',
                {'vehicle_id': vehicle_id, 'include_recommendations': include_recs}
            )

            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps(result)
            }

        return {
            'statusCode': 404,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Not found'})
        }

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }
