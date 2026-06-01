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
import re
import uuid
import base64
import time
from urllib import request as urllib_request
from urllib.parse import urlencode

import boto3

# Gateway config — all values must be supplied via environment variables.
# No defaults are baked in: callers must wire real values through their
# Lambda configuration (e.g., the CloudFormation stack) for this account.
def _required_env(name: str, example: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise EnvironmentError(
            f"{name} environment variable is required. Example: {example}"
        )
    return value


GATEWAY_URL = _required_env(
    'AGENTCORE_GATEWAY_URL',
    'https://<gateway-id>.gateway.bedrock-agentcore.<region>.amazonaws.com/mcp'
)
COGNITO_DOMAIN = _required_env(
    'GATEWAY_COGNITO_DOMAIN',
    'https://<your-domain>.auth.<region>.amazoncognito.com'
)
CLIENT_ID = _required_env('GATEWAY_CLIENT_ID', 'your-cognito-app-client-id')
# Client secret is loaded from Secrets Manager (preferred) at first use, with
# a backward-compatible fallback to the GATEWAY_CLIENT_SECRET env var.
GATEWAY_CLIENT_SECRET_ARN = os.environ.get('GATEWAY_CLIENT_SECRET_ARN', '')
_LEGACY_CLIENT_SECRET_ENV = os.environ.get('GATEWAY_CLIENT_SECRET', '')
SCOPE = _required_env('GATEWAY_SCOPE', 'vehicle-maintenance-gateway/invoke')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json'
}

# Permissive but safe vehicle_id pattern. Matches the shared validator in
# agents/shared/validators.py — duplicated here because Lambda packaging does
# not include the agents/shared/ tree.
_VEHICLE_ID_RE = re.compile(r'^[A-Za-z0-9_-]{1,32}$')


def _validate_vehicle_id(vehicle_id: str) -> bool:
    """Return True if ``vehicle_id`` is a safe identifier (1-32 chars, [A-Za-z0-9_-])."""
    return isinstance(vehicle_id, str) and bool(_VEHICLE_ID_RE.match(vehicle_id))

# Token cache (persists across warm Lambda invocations)
_token_cache = {'token': None, 'expires_at': 0}
_client_secret_cache = None


def _load_client_secret() -> str:
    """Load the Cognito client secret from Secrets Manager (preferred) or env."""
    global _client_secret_cache
    if _client_secret_cache:
        return _client_secret_cache

    if GATEWAY_CLIENT_SECRET_ARN:
        secrets_client = boto3.client(
            'secretsmanager', region_name=os.environ['AWS_REGION']
        )
        response = secrets_client.get_secret_value(SecretId=GATEWAY_CLIENT_SECRET_ARN)
        secret = response.get('SecretString', '')
        # Allow JSON-wrapped secrets like {"client_secret": "..."}
        try:
            parsed = json.loads(secret)
            if isinstance(parsed, dict):
                secret = parsed.get('client_secret') or parsed.get(
                    'GATEWAY_CLIENT_SECRET', ''
                ) or secret
        except (json.JSONDecodeError, TypeError):
            pass

        if not secret or secret == 'PLACEHOLDER_POPULATE_POST_DEPLOY':
            raise ValueError(
                "Gateway client secret is not yet populated. Run "
                "'aws secretsmanager put-secret-value --secret-id "
                f"{GATEWAY_CLIENT_SECRET_ARN} --secret-string <client-secret>' "
                "after retrieving the value from Cognito."
            )
        _client_secret_cache = secret
        return secret

    # Fallback to legacy env var (backward compatibility for local testing)
    if _LEGACY_CLIENT_SECRET_ENV:
        _client_secret_cache = _LEGACY_CLIENT_SECRET_ENV
        return _client_secret_cache

    raise ValueError(
        "Gateway client secret not configured. Set GATEWAY_CLIENT_SECRET_ARN "
        "to a Secrets Manager secret containing the Cognito client secret."
    )


def get_token():
    """Get OAuth token via Cognito client credentials flow. Cached."""
    now = time.time()
    if _token_cache['token'] and _token_cache['expires_at'] > now + 60:
        return _token_cache['token']

    client_secret = _load_client_secret()

    creds = base64.b64encode(f"{CLIENT_ID}:{client_secret}".encode()).decode()
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
            if not _validate_vehicle_id(vehicle_id):
                return {
                    'statusCode': 400,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'error': 'Invalid vehicle_id'})
                }
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
            if not _validate_vehicle_id(vehicle_id):
                return {
                    'statusCode': 400,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'error': 'Invalid vehicle_id'})
                }
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
