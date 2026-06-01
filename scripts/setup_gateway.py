#!/usr/bin/env python3
"""
Add Vehicle History Lambda target to existing AgentCore Gateway.

Uses the existing vehicle-maintenance-gateway. Creates the Lambda function
and registers it as a target with get_vehicle_history + generate_vehicle_report tools.

Usage:
    python scripts/setup_gateway.py
    python scripts/setup_gateway.py --profile demo
    python scripts/setup_gateway.py --memory-id vehicle_maintenance_agent_mem-XXXXXXXXXX

Required env vars or CLI args:
    MAINTENANCE_AGENT_MEMORY_ID (or --memory-id) - AgentCore Memory ID
    AGENTCORE_GATEWAY_ID         (or --gateway-id) - Gateway ID
"""

import boto3
import json
import time
import argparse
import os
import sys
import io
import zipfile

# Existing gateway config — set via environment or pass as arguments
GATEWAY_ID = os.environ.get('AGENTCORE_GATEWAY_ID', '')
GATEWAY_URL = os.environ.get('AGENTCORE_GATEWAY_URL', '')
GATEWAY_ROLE_ARN = os.environ.get('AGENTCORE_GATEWAY_ROLE_ARN', '')
COGNITO_CLIENT_ID = os.environ.get('GATEWAY_CLIENT_ID', '')
COGNITO_POOL_ID = os.environ.get('GATEWAY_COGNITO_POOL_ID', '')

# Default memory config — override with --memory-id and --memory-namespace
# Accept either AGENTCORE_MEMORY_ID or MAINTENANCE_AGENT_MEMORY_ID
DEFAULT_MEMORY_ID = os.environ.get('MAINTENANCE_AGENT_MEMORY_ID', os.environ.get('AGENTCORE_MEMORY_ID', ''))
DEFAULT_NAMESPACE = os.environ.get('MEMORY_NAMESPACE', '')

LAMBDA_FUNCTION_NAME = "ev-digital-twin-vehicle-history"
LAMBDA_ROLE_NAME = "ev-digital-twin-vehicle-history-role"

# Tool schema for Gateway target
TOOL_SCHEMA = [
    {
        "name": "get_vehicle_history",
        "description": "Retrieve maintenance history for a vehicle from AgentCore Memory. Returns past issues, analyses, appointments, and service records categorized by system (tire, motor, inverter).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "vehicle_id": {
                    "type": "string",
                    "description": "Vehicle identifier - vehicle number (1, 2, 3), fleet ID (EV-1001), or VIN"
                },
                "category": {
                    "type": "string",
                    "description": "Filter by maintenance category: all, tire, motor, inverter, or appointment. Default: all"
                },
                "limit": {
                    "type": "integer",
                    "description": "Max records to return (1-50). Default: 20"
                }
            },
            "required": ["vehicle_id"]
        }
    },
    {
        "name": "generate_vehicle_report",
        "description": "Generate a structured maintenance summary report for a vehicle. Pulls history across all systems and produces recommendations based on recurring patterns.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "vehicle_id": {
                    "type": "string",
                    "description": "Vehicle identifier - vehicle number (1, 2, 3), fleet ID (EV-1001), or VIN"
                },
                "include_recommendations": {
                    "type": "boolean",
                    "description": "Include prioritized action items. Default: true"
                }
            },
            "required": ["vehicle_id"]
        }
    }
]


def parse_args():
    parser = argparse.ArgumentParser(description='Add vehicle history target to existing Gateway')
    parser.add_argument('--profile', default=os.environ.get('AWS_PROFILE', ''))
    parser.add_argument('--region', default='us-east-1')
    parser.add_argument('--gateway-id', default=GATEWAY_ID, required=not GATEWAY_ID,
                        help='AgentCore Gateway ID (or set AGENTCORE_GATEWAY_ID env var)')
    parser.add_argument('--memory-id', default=DEFAULT_MEMORY_ID, required=not DEFAULT_MEMORY_ID,
                        help='AgentCore Memory ID (or set AGENTCORE_MEMORY_ID env var)')
    parser.add_argument('--memory-namespace', default=DEFAULT_NAMESPACE,
                        help='Memory namespace (or set MEMORY_NAMESPACE env var)')
    return parser.parse_args()


def create_lambda_function(session, region, memory_id, memory_namespace):
    """Create or update the vehicle history Lambda."""
    lambda_client = session.client('lambda', region_name=region)
    iam = session.client('iam')

    # Create execution role
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }

    try:
        role = iam.create_role(
            RoleName=LAMBDA_ROLE_NAME,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description='Role for vehicle history Gateway Lambda'
        )
        role_arn = role['Role']['Arn']
        print(f"  ✅ Created IAM role: {role_arn}")

        iam.attach_role_policy(
            RoleName=LAMBDA_ROLE_NAME,
            PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        )

        # AgentCore Memory read permissions
        iam.put_role_policy(
            RoleName=LAMBDA_ROLE_NAME,
            PolicyName='AgentCoreMemoryAccess',
            PolicyDocument=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "bedrock-agentcore:RetrieveMemoryRecords",
                        "bedrock-agentcore:GetMemoryRecord"
                    ],
                    "Resource": "*"
                }]
            })
        )

        print("  ⏳ Waiting 10s for IAM propagation...")
        time.sleep(10)  # nosemgrep: arbitrary-sleep — required for IAM eventual consistency

    except iam.exceptions.EntityAlreadyExistsException:
        role = iam.get_role(RoleName=LAMBDA_ROLE_NAME)
        role_arn = role['Role']['Arn']
        print(f"  ✅ IAM role exists: {role_arn}")

    # Package Lambda code
    lambda_code_path = os.path.join(os.path.dirname(__file__), '..', 'infrastructure', 'lambda', 'vehicle_history.py')

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        with open(lambda_code_path, 'r') as f:
            zf.writestr('vehicle_history.py', f.read())
    zip_buffer.seek(0)

    try:
        response = lambda_client.create_function(
            FunctionName=LAMBDA_FUNCTION_NAME,
            Runtime='python3.11',
            Role=role_arn,
            Handler='vehicle_history.lambda_handler',
            Code={'ZipFile': zip_buffer.read()},
            Description='Vehicle history tools for AgentCore Gateway',
            Timeout=30,
            MemorySize=256,
            Environment={
                'Variables': {
                    'AGENTCORE_MEMORY_ID': memory_id,
                    'MEMORY_NAMESPACE': memory_namespace
                }
            }
        )
        lambda_arn = response['FunctionArn']
        print(f"  ✅ Created Lambda: {lambda_arn}")

    except lambda_client.exceptions.ResourceConflictException:
        zip_buffer.seek(0)
        lambda_client.update_function_code(
            FunctionName=LAMBDA_FUNCTION_NAME,
            ZipFile=zip_buffer.read()
        )
        time.sleep(2)  # nosemgrep: arbitrary-sleep — wait for Lambda code update before config update
        lambda_client.update_function_configuration(
            FunctionName=LAMBDA_FUNCTION_NAME,
            Environment={
                'Variables': {
                    'AGENTCORE_MEMORY_ID': memory_id,
                    'MEMORY_NAMESPACE': memory_namespace
                }
            }
        )
        response = lambda_client.get_function(FunctionName=LAMBDA_FUNCTION_NAME)
        lambda_arn = response['Configuration']['FunctionArn']
        print(f"  ✅ Updated Lambda: {lambda_arn}")

    return lambda_arn


def add_lambda_invoke_permission(session, region, lambda_arn):
    """Allow Gateway role to invoke the Lambda."""
    lambda_client = session.client('lambda', region_name=region)

    try:
        lambda_client.add_permission(
            FunctionName=lambda_arn,
            StatementId='AllowAgentCoreGatewayInvoke',
            Action='lambda:InvokeFunction',
            Principal='bedrock-agentcore.amazonaws.com'
        )
        print("  ✅ Lambda invoke permission added for Gateway")
    except lambda_client.exceptions.ResourceConflictException:
        print("  ✅ Lambda invoke permission already exists")


def add_gateway_target(session, region, lambda_arn, gateway_id):
    """Add Lambda as a target to the existing Gateway."""
    control_client = session.client('bedrock-agentcore-control', region_name=region)

    # Check if target already exists
    existing = control_client.list_gateway_targets(gatewayIdentifier=gateway_id)
    for target in existing.get('items', []):
        if target.get('name') == 'VehicleHistoryTools':
            print(f"  ⚠️  Target 'VehicleHistoryTools' already exists: {target['targetId']}")
            print("  Updating target...")
            response = control_client.update_gateway_target(
                gatewayIdentifier=gateway_id,
                targetId=target['targetId'],
                name='VehicleHistoryTools',
                description='Vehicle maintenance history and report generation tools',
                targetConfiguration={
                    'mcp': {
                        'lambda': {
                            'lambdaArn': lambda_arn,
                            'toolSchema': {
                                'inlinePayload': TOOL_SCHEMA
                            }
                        }
                    }
                },
                credentialProviderConfigurations=[{
                    'credentialProviderType': 'GATEWAY_IAM_ROLE'
                }]
            )
            print(f"  ✅ Target updated: {target['targetId']}")
            return target['targetId']

    # Create new target
    response = control_client.create_gateway_target(
        gatewayIdentifier=gateway_id,
        name='VehicleHistoryTools',
        description='Vehicle maintenance history and report generation tools',
        targetConfiguration={
            'mcp': {
                'lambda': {
                    'lambdaArn': lambda_arn,
                    'toolSchema': {
                        'inlinePayload': TOOL_SCHEMA
                    }
                }
            }
        },
        credentialProviderConfigurations=[{
            'credentialProviderType': 'GATEWAY_IAM_ROLE'
        }]
    )
    target_id = response.get('targetId', 'created')
    print(f"  ✅ Target created: {target_id}")
    return target_id


def main():
    args = parse_args()
    session = boto3.Session(region_name=args.region) if not args.profile else boto3.Session(profile_name=args.profile, region_name=args.region)

    print("🚀 Adding Vehicle History tools to existing Gateway")
    print(f"   Gateway: {args.gateway_id}")
    print(f"   Memory:  {args.memory_id}")
    print()

    # Step 1: Lambda
    print("Step 1: Lambda function")
    lambda_arn = create_lambda_function(session, args.region, args.memory_id, args.memory_namespace)

    # Step 2: Permissions
    print("\nStep 2: Lambda permissions")
    add_lambda_invoke_permission(session, args.region, lambda_arn)

    # Step 3: Gateway target
    print("\nStep 3: Gateway target")
    target_id = add_gateway_target(session, args.region, lambda_arn, args.gateway_id)

    # Get gateway URL
    control_client = session.client('bedrock-agentcore-control', region_name=args.region)
    gw = control_client.get_gateway(gatewayIdentifier=args.gateway_id)
    gateway_url = gw.get('gatewayUrl', '')

    # Save config
    config = {
        "gateway_id": args.gateway_id,
        "gateway_url": gateway_url,
        "target_id": target_id,
        "lambda_arn": lambda_arn,
        "memory_id": args.memory_id,
        "region": args.region,
    }

    config_path = os.path.join(os.path.dirname(__file__), '..', 'gateway_config.json')
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

    print()
    print("=" * 60)
    print("✅ Done!")
    print(f"   Gateway URL: {gateway_url}")
    print(f"   Tools: get_vehicle_history, generate_vehicle_report")
    print(f"   Config: gateway_config.json")
    print()
    print("Test: python scripts/test_gateway.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
