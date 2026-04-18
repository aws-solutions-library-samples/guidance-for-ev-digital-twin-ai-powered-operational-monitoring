"""
AgentCore Lambda Proxy - Full-featured version with DynamoDB caching and tire order support
Handler: index.lambda_handler

CRITICAL: The invoke_agent_runtime response uses 'response' key, NOT 'payload'
Set LOG_GROUP_NAME env var to match your AgentCore Runtime log group
"""

import json
import boto3
import os
import re
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

bedrock_agentcore = boto3.client('bedrock-agentcore', region_name='us-east-1')
logs_client = boto3.client('logs', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Get log group from environment variable (set by CloudFormation)
LOG_GROUP_NAME = os.environ.get('LOG_GROUP_NAME', '/aws/bedrock-agentcore/runtimes/vehicle_maintenance_agent-DEFAULT')
APPOINTMENTS_TABLE = 'vehicle-appointment-slots'
GENAI_RECS_TABLE = 'vehicle-genai-recs'

def get_available_appointments(date):
    """Query DynamoDB for available appointment slots on a specific date"""
    table = dynamodb.Table(APPOINTMENTS_TABLE)
    
    try:
        response = table.query(
            KeyConditionExpression='#d = :date',
            FilterExpression='available = :avail',
            ExpressionAttributeNames={'#d': 'date'},
            ExpressionAttributeValues={':date': date, ':avail': True}
        )
        
        slots = response.get('Items', [])
        return sorted(slots, key=lambda x: x['time_slot'])
    except Exception as e:
        print(f"DynamoDB query error: {e}")
        return []

def save_genai_recommendation(vin, recommendation):
    """Save GenAI recommendation to DynamoDB — skip scheduling/slot responses"""
    if not vin:
        return
    
    # Don't cache scheduling responses — they overwrite real recommendations
    if isinstance(recommendation, str):
        skip_keywords = ['available_slots', 'schedule_appointment', 'Appointment booked', 'time_slot']
        if any(kw in recommendation for kw in skip_keywords):
            print(f"Skipping cache for VIN {vin}: scheduling response detected")
            return
    
    table = dynamodb.Table(GENAI_RECS_TABLE)
    try:
        table.put_item(
            Item={
                'vin': vin,
                'recommendation': recommendation,
                'timestamp': datetime.now().isoformat(),
                'ttl': int((datetime.now() + timedelta(hours=24)).timestamp())
            }
        )
        print(f"Saved recommendation for VIN: {vin}")
    except Exception as e:
        print(f"Error saving to DynamoDB: {e}")

def lambda_handler(event, context):
    print(f"Event: {json.dumps(event)}")
    
    # Handle OPTIONS requests (CORS preflight)
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': ''
        }
    
    # Handle GET requests
    if event.get('requestContext', {}).get('http', {}).get('method') == 'GET':
        path = event.get('rawPath', '')
        
        # GET /genai-recs/{vin}
        if path.startswith('/genai-recs/'):
            vin = path.split('/')[-1]
            table = dynamodb.Table(GENAI_RECS_TABLE)
            
            try:
                response = table.get_item(Key={'vin': vin})
                item = response.get('Item')
                
                if item:
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                        },
                        'body': json.dumps(item, default=decimal_default)
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                        },
                        'body': json.dumps({'error': 'No cached recommendation found'})
                    }
            except Exception as e:
                print(f"DynamoDB get error: {e}")
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                    },
                    'body': json.dumps({'error': str(e)})
                }
        
        # GET /action-logs/{job_id}
        if path.startswith('/action-logs/'):
            job_id = path.split('/')[-1]
            
            try:
                actions = []
                result_text = None
                
                # Query CloudWatch for browser actions (no filter - get all logs)
                print(f"Querying CloudWatch for browser actions (job_id: {job_id})")
                end_time = int(datetime.now().timestamp() * 1000)
                start_time = int((datetime.now() - timedelta(minutes=5)).timestamp() * 1000)  # Last 5 minutes
                
                # Query without filter pattern to get all logs (same as test script)
                log_response = logs_client.filter_log_events(
                    logGroupName=LOG_GROUP_NAME,
                    startTime=start_time,
                    endTime=end_time
                    # No filterPattern - parse in Python instead
                )
                
                for event in log_response.get('events', []):
                    message = event.get('message', '')
                    
                    # Extract return value FIRST (highest priority)
                    if 'return(' in message:
                        return_match = re.search(r'return\(["\'](.+?)["\']\);?', message, re.DOTALL)
                        if return_match:
                            result_text = return_match.group(1)
                            actions.append({'type': 'result', 'text': result_text, 'icon': '✅'})
                            continue
                    
                    # Skip if this message doesn't contain relevant action patterns
                    if not any(pattern in message for pattern in ['think(', 'agentClick', 'agentType', 'agentScroll']):
                        continue
                    
                    # Extract think statements
                    if 'think(' in message:
                        think_match = re.search(r'think\("(.+?)"\)', message, re.DOTALL)
                        if think_match:
                            text = think_match.group(1)[:150]
                            actions.append({'type': 'think', 'text': text, 'icon': '💭'})
                    
                    # Extract clicks
                    elif 'agentClick(' in message:
                        actions.append({'type': 'click', 'text': 'Clicked element on page', 'icon': '👆'})
                    
                    # Extract typing
                    elif 'agentType(' in message:
                        type_match = re.search(r'agentType\("(.+?)"', message)
                        if type_match:
                            actions.append({'type': 'type', 'text': f'Typed: {type_match.group(1)}', 'icon': '⌨️'})
                    
                    # Extract scrolling
                    elif 'agentScroll(' in message:
                        actions.append({'type': 'scroll', 'text': 'Scrolled page', 'icon': '📜'})
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                    },
                    'body': json.dumps({
                        'job_id': job_id,
                        'actions': actions,
                        'count': len(actions),
                        'result': result_text
                    })
                }
            except Exception as e:
                print(f"Error fetching action logs: {e}")
                import traceback
                traceback.print_exc()
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': str(e)})
                }
        
        # GET /browser-session/{conversation_session_id} - NEW ENDPOINT
        if path.startswith('/browser-session/'):
            conversation_session_id = path.split('/')[-1]
            
            try:
                table = dynamodb.Table('browser-session-tracking')
                response = table.get_item(Key={'conversation_session_id': conversation_session_id})
                item = response.get('Item')
                
                if item:
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                        },
                        'body': json.dumps({
                            'browser_session_id': item['browser_session_id'],
                            'vehicle_id': item.get('vehicle_id'),
                            'timestamp': item.get('timestamp')
                        }, default=decimal_default)
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'No browser session found for this conversation'})
                    }
            except Exception as e:
                print(f"Error fetching browser session: {e}")
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': str(e)})
                }
        
        # GET /tire-order/status/{job_id}
        if path.startswith('/tire-order/status/'):
            job_id = path.split('/')[-1]
            jobs_table = dynamodb.Table('tire-order-jobs')
            
            try:
                response = jobs_table.get_item(Key={'job_id': job_id})
                
                if 'Item' not in response:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                        },
                        'body': json.dumps({'error': 'Job not found'})
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                    },
                    'body': json.dumps(response['Item'], default=decimal_default)
                }
            except Exception as e:
                print(f"Error fetching tire order status: {e}")
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': str(e)})
                }
        
        # GET /browser-live-view/{job_id} - Generate live view URL for browser session
        if path.startswith('/browser-live-view/'):
            job_id = path.split('/')[-1]
            jobs_table = dynamodb.Table('tire-order-jobs')
            
            try:
                response = jobs_table.get_item(Key={'job_id': job_id})
                
                if 'Item' not in response:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                        },
                        'body': json.dumps({'error': 'Job not found'})
                    }
                
                job = response['Item']
                live_view_url = job.get('live_view_url')
                browser_session_id = job.get('browser_session_id')
                browser_id = job.get('browser_id')
                
                if not live_view_url:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                        },
                        'body': json.dumps({'error': 'No browser session available yet'})
                    }
                
                # Return the presigned URL that was generated by BrowserClient.generate_live_view_url()
                # This URL was created using the proper SDK method and will work with DCV Web Client
                print(f"✅ Returning live view URL for job {job_id}: {live_view_url[:100]}...")
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                    },
                    'body': json.dumps({
                        'liveViewUrl': live_view_url,
                        'browserSessionId': browser_session_id,
                        'browserId': browser_id,
                        'expiresIn': 300
                    })
                }
            except Exception as e:
                print(f"Error generating live view URL: {e}")
                import traceback
                traceback.print_exc()
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': str(e)})
                }
        
        # GET /available-appointments
        query_params = event.get('queryStringParameters', {}) or {}
        date = query_params.get('date')
        
        if not date:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                'body': json.dumps({'error': 'date parameter required (YYYY-MM-DD)'})
            }
        
        slots = get_available_appointments(date)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': json.dumps({
                'date': date,
                'available_slots': slots,
                'count': len(slots)
            }, default=decimal_default)
        }
    
    # Handle POST /tire-order/start
    if event.get('requestContext', {}).get('http', {}).get('method') == 'POST':
        path = event.get('rawPath', '')
        
        if path == '/tire-order/start':
            body = json.loads(event.get('body', '{}'))
            vehicle_id = body.get('vehicle_id')
            
            if not vehicle_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                    },
                    'body': json.dumps({'error': 'vehicle_id is required'})
                }
            
            # Generate job ID
            job_id = f"job-{uuid.uuid4()}"
            
            # Save to DynamoDB
            jobs_table = dynamodb.Table('tire-order-jobs')
            try:
                jobs_table.put_item(Item={
                    'job_id': job_id,
                    'status': 'pending',
                    'vehicle_id': vehicle_id,
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat(),
                    'ttl': int((datetime.now() + timedelta(hours=24)).timestamp())
                })
                
                print(f"✅ Created job {job_id} for vehicle {vehicle_id}")
                
                # Invoke worker Lambda async
                lambda_client = boto3.client('lambda', region_name='us-east-1')
                lambda_client.invoke(
                    FunctionName='ev-digital-twin-tire-order-worker',
                    InvocationType='Event',  # Async invocation
                    Payload=json.dumps({
                        'job_id': job_id,
                        'vehicle_id': vehicle_id
                    })
                )
                
                print(f"✅ Invoked worker Lambda for job {job_id}")
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                    },
                    'body': json.dumps({
                        'job_id': job_id,
                        'status': 'pending',
                        'message': 'Tire order started'
                    })
                }
                
            except Exception as e:
                print(f"Error starting tire order: {e}")
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': str(e)})
                }
    
    # Handle POST /chat
    try:
        body = json.loads(event.get('body', '{}'))
        prompt = body.get('prompt', body.get('message', ''))
        session_id = body.get('session_id')
        vin = body.get('vin')
        
        print(f"📥 Lambda received session_id from frontend: {session_id}")
        
        if not session_id or session_id == 'null':
            session_id = f"session-{uuid.uuid4()}"
            print(f"🔄 Generated new session_id: {session_id}")
        
        if not prompt:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({'error': 'prompt or message is required'})
            }
        
        agent_arn = os.environ['AGENT_RUNTIME_ARN']
        
        print(f"Invoking AgentCore Runtime: {agent_arn}")
        print(f"Session ID: {session_id}")
        print(f"Prompt: {prompt}")
        
        is_tire_order = 'order_tire_online' in prompt.lower() or 'order replacement tires' in prompt.lower()
        
        payload_data = {
            "prompt": prompt,
            "session_id": session_id
        }
        
        try:
            response = bedrock_agentcore.invoke_agent_runtime(
                agentRuntimeArn=agent_arn,
                runtimeSessionId=session_id,
                payload=json.dumps(payload_data)
            )
            
            full_response = ""
            
            if 'response' in response:
                streaming_body = response['response']
                response_bytes = streaming_body.read()
                
                if isinstance(response_bytes, bytes):
                    full_response = response_bytes.decode('utf-8')
                else:
                    full_response = str(response_bytes)
                
                try:
                    response_json = json.loads(full_response)
                    if isinstance(response_json, str):
                        full_response = response_json
                except:
                    pass
            
            print(f"Response length: {len(full_response)}")
            
            if vin and full_response:
                save_genai_recommendation(vin, full_response)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({
                    'response': full_response,
                    'session_id': session_id,
                    'agent': 'AgentCore Runtime',
                    'timestamp': datetime.now().isoformat()
                })
            }
            
        except Exception as runtime_error:
            error_str = str(runtime_error)
            print(f"AgentCore Runtime error: {error_str}")
            
            is_browser_tool_timeout = is_tire_order and 'timeout' in error_str.lower()
            if not is_browser_tool_timeout and any(keyword in error_str.lower() for keyword in ['validationexception', 'timeout', 'tool_use', 'tool_id']):
                new_session_id = f"session-{uuid.uuid4()}"
                print(f"Session corrupted - resetting from {session_id} to {new_session_id}")
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS'
                    },
                    'body': json.dumps({
                        'session_reset': True,
                        'new_session_id': new_session_id,
                        'message': 'Session reset due to error. Please retry with new session.',
                        'original_error': error_str
                    })
                }
            
            if is_browser_tool_timeout:
                print("Browser tool timeout - this is expected for tire ordering")
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS'
                    },
                    'body': json.dumps({
                        'response': 'Tire order is being processed. Browser automation is adding tires to your Amazon cart.',
                        'session_id': session_id,
                        'agent': 'AgentCore Runtime',
                        'timestamp': datetime.now().isoformat(),
                        'browser_tool_running': True
                    })
                }
            
            if '500' in error_str and is_tire_order:
                print("Attempting to extract tire order result from CloudWatch...")
                
                try:
                    end_time = int(datetime.now().timestamp() * 1000)
                    start_time = int((datetime.now() - timedelta(minutes=2)).timestamp() * 1000)
                    
                    log_response = logs_client.filter_log_events(
                        logGroupName=LOG_GROUP_NAME,
                        startTime=start_time,
                        endTime=end_time,
                        filterPattern='"order_tire_online"'
                    )
                    
                    for event in reversed(log_response.get('events', [])):
                        message = event.get('message', '')
                        
                        product_match = re.search(r'Product name:\s*([^,]+)', message)
                        brand_match = re.search(r'Brand:\s*([^,]+)', message)
                        price_match = re.search(r'Price:\s*\$?([\d.]+)', message)
                        
                        if product_match and brand_match and price_match:
                            extracted_response = f"Product name: {product_match.group(1).strip()}, Brand: {brand_match.group(1).strip()}, Price: ${price_match.group(1).strip()}"
                            
                            print(f"Extracted from logs: {extracted_response}")
                            
                            return {
                                'statusCode': 200,
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*',
                                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                                },
                                'body': json.dumps({
                                    'response': extracted_response,
                                    'session_id': session_id,
                                    'agent': 'AgentCore Runtime',
                                    'timestamp': datetime.now().isoformat(),
                                    'extracted_from_logs': True
                                })
                            }
                    
                    print("No tire data found in CloudWatch logs")
                    
                except Exception as log_error:
                    print(f"CloudWatch query error: {log_error}")
            
            raise runtime_error
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            'body': json.dumps({'error': str(e)})
        }
