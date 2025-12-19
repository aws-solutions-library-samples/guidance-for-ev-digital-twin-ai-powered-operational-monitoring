"""
Tire Order Worker Lambda
This Lambda function handles long-running tire ordering operations asynchronously.
It's invoked by the main proxy Lambda and updates job status in DynamoDB.
"""

import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

# We'll invoke AgentCore Runtime instead of importing directly
# from agentcore_maintenance_agent import order_tire_online

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('tire-order-jobs')


def decimal_default(obj):
    """JSON serializer for Decimal objects"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def lambda_handler(event, context):
    """
    Worker Lambda that executes the long-running browser tool.
    This runs async - no API Gateway timeout issues!
    
    Expected event format:
    {
        "job_id": "job-uuid",
        "vehicle_id": "1"
    }
    """
    print(f"📥 Received event: {json.dumps(event)}")
    
    job_id = event.get('job_id')
    vehicle_id = event.get('vehicle_id')
    
    if not job_id or not vehicle_id:
        print("❌ Missing job_id or vehicle_id in event")
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing job_id or vehicle_id'})
        }
    
    print(f"🚀 Starting tire order job {job_id} for vehicle {vehicle_id}")
    
    # Update status to running
    try:
        table.update_item(
            Key={'job_id': job_id},
            UpdateExpression='SET #status = :running, updated_at = :now, progress = :progress',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':running': 'running',
                ':now': datetime.now().isoformat(),
                ':progress': 'Starting browser automation...'
            }
        )
        print(f"✅ Updated job {job_id} status to 'running'")
    except Exception as e:
        print(f"❌ Failed to update job status to running: {str(e)}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
    
    try:
        # Update progress - searching for tires
        table.update_item(
            Key={'job_id': job_id},
            UpdateExpression='SET progress = :progress, updated_at = :now',
            ExpressionAttributeValues={
                ':progress': 'Searching Amazon for tires...',
                ':now': datetime.now().isoformat()
            }
        )
        print(f"📊 Progress: Searching Amazon for tires...")
        
        # Call AgentCore Runtime to execute the browser tool
        print(f"🌐 Calling AgentCore Runtime to order tires for vehicle {vehicle_id}")
        
        bedrock_agentcore = boto3.client('bedrock-agentcore', region_name='us-east-1')
        agent_arn = os.environ.get('AGENT_RUNTIME_ARN')
        
        if not agent_arn:
            raise ValueError("AGENT_RUNTIME_ARN environment variable not set")
        
        # Generate unique session ID for this order
        import uuid
        runtime_session_id = f"tire-order-{uuid.uuid4()}"
        
        # Map vehicle_id to VIN (same mapping as frontend uses)
        vin_map = {
            "1": "2T1BURHE8JC987654",
            "2": "5YJSA1E26HF123456",
            "3": "1HGBH41JXMN109186",
            "4": "WBADT43452G123456",
            "5": "JM1BL1SF7A1234567"
        }
        vin = vin_map.get(str(vehicle_id), vehicle_id)
        
        # Invoke AgentCore Runtime with tire ordering prompt
        # Pass job_id so the tool can save browser session info for live view
        response = bedrock_agentcore.invoke_agent_runtime(
            agentRuntimeArn=agent_arn,
            runtimeSessionId=runtime_session_id,
            payload=json.dumps({
                "prompt": f"order_tire_online({vin}, job_id={job_id})",
                "session_id": runtime_session_id
            })
        )
        
        # Read response
        if 'response' in response:
            streaming_body = response['response']
            response_bytes = streaming_body.read()
            result = response_bytes.decode('utf-8') if isinstance(response_bytes, bytes) else str(response_bytes)
        else:
            result = "Tire order completed"
        
        print(f"✅ AgentCore Runtime completed successfully")
        
        # Parse result
        if isinstance(result, str):
            try:
                result_data = json.loads(result)
            except json.JSONDecodeError:
                # If it's not JSON, wrap it
                result_data = {'raw_result': result}
        else:
            result_data = result
        
        # IMMEDIATELY save browser session info for live viewing (if available)
        metadata = result_data.get('metadata', {}) if isinstance(result_data, dict) else {}
        browser_session_id = metadata.get('browserSessionId')
        browser_id = metadata.get('browserId')
        
        if browser_session_id and browser_id:
            try:
                table.update_item(
                    Key={'job_id': job_id},
                    UpdateExpression='SET browser_session_id = :bsid, browser_id = :bid, updated_at = :now',
                    ExpressionAttributeValues={
                        ':bsid': browser_session_id,
                        ':bid': browser_id,
                        ':now': datetime.now().isoformat()
                    }
                )
                print(f"✅ Saved browser session info for live viewing: {browser_session_id[:20]}...")
            except Exception as session_error:
                print(f"⚠️  Failed to save browser session info: {str(session_error)}")
        
        # Extract live view URL if present
        live_view_url = result_data.get('liveViewUrl') if isinstance(result_data, dict) else None
        if live_view_url:
            print(f"🎥 Live View URL: {live_view_url[:100]}...")
        
        print(f"📦 Result data: {json.dumps(result_data, default=str)[:200]}...")
        
        # Update status to complete (include live view URL if available)
        update_expression = 'SET #status = :complete, updated_at = :now, #result = :result, progress = :progress'
        expression_values = {
            ':complete': 'complete',
            ':now': datetime.now().isoformat(),
            ':result': result_data,
            ':progress': 'Tire order complete!'
        }
        expression_names = {'#status': 'status', '#result': 'result'}
        
        if live_view_url:
            update_expression += ', liveViewUrl = :liveViewUrl'
            expression_values[':liveViewUrl'] = live_view_url
        
        table.update_item(
            Key={'job_id': job_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_names,
            ExpressionAttributeValues=expression_values
        )
        
        print(f"✅ Job {job_id} completed successfully")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'job_id': job_id,
                'status': 'complete',
                'result': result_data
            }, default=decimal_default)
        }
        
    except Exception as e:
        print(f"❌ Job {job_id} failed: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Update status to failed
        try:
            table.update_item(
                Key={'job_id': job_id},
                UpdateExpression='SET #status = :failed, updated_at = :now, #error = :error, progress = :progress',
                ExpressionAttributeNames={'#status': 'status', '#error': 'error'},
                ExpressionAttributeValues={
                    ':failed': 'failed',
                    ':now': datetime.now().isoformat(),
                    ':error': str(e),
                    ':progress': 'Tire order failed'
                }
            )
        except Exception as update_error:
            print(f"❌ Failed to update error status: {str(update_error)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'job_id': job_id,
                'status': 'failed',
                'error': str(e)
            })
        }
