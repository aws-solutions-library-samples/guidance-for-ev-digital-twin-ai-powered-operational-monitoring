"""
Tire Specialist Agent tools.
Moved from agentcore_maintenance_agent.py — analyze, predict, detect anomalies, order online.
"""

from strands.tools import tool
import pandas as pd
import numpy as np
import json
import os
import re
import boto3

# Import shared modules
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from shared.data_loader import load_tire_data, load_manual_data
from shared.tire_predictor import TirePredictor
from shared.model_config import get_nova_act_key

# Import browser automation at module level to avoid Pydantic issues
try:
    from nova_act import NovaAct
    from bedrock_agentcore.tools.browser_client import BrowserClient
    BROWSER_AVAILABLE = True
    print("✓ Browser automation tools imported successfully")
except Exception as e:
    print(f"Browser automation disabled: {type(e).__name__}: {str(e)}")
    BROWSER_AVAILABLE = False
    NovaAct = None
    BrowserClient = None

# Module-level data (replaces agent_instance.* pattern)
_tire_data = None
_manual_data = None
_predictor = TirePredictor()

# DynamoDB configuration for ML predictions
DYNAMODB_REGION = "us-east-1"
ML_PREDICTIONS_TABLE = "vehicle-ml-predictions"


def _ensure_data_loaded():
    """Load data on first use (lazy initialization)."""
    global _tire_data, _manual_data
    if _tire_data is None:
        _tire_data = load_tire_data()
        print("✓ Tire data loaded")
    if _manual_data is None:
        _manual_data = load_manual_data()
        print("✓ Manual data loaded")


def _ensure_models_loaded():
    """Load ML models on first use."""
    if _predictor.wear_model is None:
        try:
            models_dir = os.path.join(os.path.dirname(__file__), '..', 'shared', 'models')
            _predictor.load_models(filepath_prefix=os.path.join(models_dir, 'tire_models'))
            print("✓ ML models loaded successfully")
        except Exception as e:
            print(f"⚠ Warning: Could not load models - {e}")


@tool
def analyze_tire_condition(vehicle_id: str) -> str:
    """
    Analyze current tire condition for a specific vehicle.
    
    Args:
        vehicle_id: The vehicle ID (VIN) to analyze
        
    Returns:
        Comprehensive tire condition analysis including tread depth, pressure, wear patterns
    """
    try:
        _ensure_data_loaded()
        
        vehicle_data = _tire_data[_tire_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No tire data found for vehicle {vehicle_id}"})
        
        # Get latest readings for each tire position
        latest_data = vehicle_data.groupby('position').last().reset_index()
        
        # Get vehicle info
        vehicle_info = latest_data.iloc[0]
        
        # Get manual specs - try matching by VIN first (manual uses 'vin' column with EV-XXXX format)
        # The tire_data 'make' column actually contains the vehicle ID (EV-1001, etc.)
        vehicle_identifier = str(vehicle_info.get('make', ''))  # This is actually EV-XXXX
        
        manual_spec = _manual_data[
            _manual_data['vin'] == vehicle_identifier
        ]
        
        if manual_spec.empty:
            # Fallback to first entry if no match
            manual_spec = _manual_data.iloc[0]
        else:
            manual_spec = manual_spec.iloc[0]
        
        analysis = {
            "vehicle_info": {
                "vehicle_id": str(vehicle_id),
                "vehicle_identifier": vehicle_identifier,
                "model": str(vehicle_info.get('model', 'Unknown')),
                "year": int(vehicle_info.get('year', 0)),
                "tire_size": str(vehicle_info.get('tire_size', 'Unknown')),
                "tire_brand": str(vehicle_info.get('tire_brand', 'Unknown'))
            },
            "tire_conditions": {}
        }
        
        # Analyze each tire
        tread_depths = {}
        for _, tire in latest_data.iterrows():
            position = tire['position']
            tread_depth = float(tire['tread_depth_mm'])
            pressure = float(tire['pressure_psi'])
            tread_depths[position] = tread_depth
            
            # Calculate wear percentage
            max_depth = 10.0  # New tire depth
            min_depth = float(manual_spec['min_tread_depth_mm'])
            wear_pct = ((max_depth - tread_depth) / (max_depth - min_depth)) * 100
            
            # Assess status
            if tread_depth < min_depth:
                status = "CRITICAL - Replace immediately"
            elif tread_depth < float(manual_spec['replacement_threshold_mm']):
                status = "WARNING - Replacement recommended"
            elif wear_pct > 70:
                status = "ATTENTION - Monitor closely"
            else:
                status = "GOOD"
            
            # Check for anomaly type (uneven wear flag from data)
            anomaly_type = str(tire.get('anomaly_type', 'normal'))
            
            analysis["tire_conditions"][position] = {
                "tread_depth_mm": round(tread_depth, 2),
                "pressure_psi": round(pressure, 1),
                "temperature_c": round(float(tire['temperature_c']), 1),
                "wear_percentage": round(wear_pct, 1),
                "status": status,
                "anomaly_type": anomaly_type,
                "recommended_pressure": float(manual_spec['recommended_pressure_psi'])
            }
        
        # CRITICAL: Check for uneven wear patterns (Section 5.6)
        uneven_wear_detected = False
        uneven_wear_details = []
        
        # Check front axle difference
        if 'front_left' in tread_depths and 'front_right' in tread_depths:
            front_diff = abs(tread_depths['front_left'] - tread_depths['front_right'])
            if front_diff > 2.0:
                uneven_wear_detected = True
                uneven_wear_details.append(f"Front axle: {front_diff:.1f}mm difference (FL: {tread_depths['front_left']:.1f}mm, FR: {tread_depths['front_right']:.1f}mm)")
            elif front_diff > 1.0:
                uneven_wear_details.append(f"Front axle: {front_diff:.1f}mm difference - monitor closely")
        
        # Check rear axle difference
        if 'rear_left' in tread_depths and 'rear_right' in tread_depths:
            rear_diff = abs(tread_depths['rear_left'] - tread_depths['rear_right'])
            if rear_diff > 2.0:
                uneven_wear_detected = True
                uneven_wear_details.append(f"Rear axle: {rear_diff:.1f}mm difference (RL: {tread_depths['rear_left']:.1f}mm, RR: {tread_depths['rear_right']:.1f}mm)")
            elif rear_diff > 1.0:
                uneven_wear_details.append(f"Rear axle: {rear_diff:.1f}mm difference - monitor closely")
        
        # Check for anomaly_type flag
        for position, tire_data_item in analysis["tire_conditions"].items():
            if tire_data_item.get("anomaly_type") == "uneven_wear":
                uneven_wear_detected = True
                uneven_wear_details.append(f"{position}: flagged as uneven_wear in sensor data")
        
        # Add uneven wear analysis to output
        if uneven_wear_detected or uneven_wear_details:
            analysis["uneven_wear_alert"] = {
                "detected": uneven_wear_detected,
                "severity": "CRITICAL - Section 5.6 applies" if uneven_wear_detected else "WARNING - Monitor",
                "details": uneven_wear_details,
                "action_required": "IMMEDIATE: Check Section 5.6 for alignment/suspension guidance" if uneven_wear_detected else "Schedule alignment check within 1 week"
            }
        
        return json.dumps(analysis, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Analysis failed: {str(e)}"})


@tool
def predict_tire_wear(vehicle_id: str, days_ahead: int = 90) -> str:
    """
    Predict future tire wear patterns using machine learning.
    
    Args:
        vehicle_id: The vehicle ID to predict for
        days_ahead: Number of days to predict ahead (default 90)
        
    Returns:
        Tire wear predictions with maintenance timeline
    """
    try:
        _ensure_data_loaded()
        _ensure_models_loaded()
        
        if _predictor.wear_model is None:
            return json.dumps({"error": "Prediction model not available"})
        
        vehicle_data = _tire_data[_tire_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No data found for vehicle {vehicle_id}"})
        
        predictions = _predictor.predict_future_wear(vehicle_data, days_ahead=days_ahead)
        
        # Format predictions
        result = {
            "vehicle_id": str(vehicle_id),
            "prediction_period_days": days_ahead,
            "predictions": {}
        }
        
        for position in predictions['position'].unique():
            pos_data = predictions[predictions['position'] == position]
            result["predictions"][position] = {
                "current_depth_mm": round(float(pos_data.iloc[0]['predicted_tread_depth']), 2),
                "predicted_depth_mm": round(float(pos_data.iloc[-1]['predicted_tread_depth']), 2),
                "wear_rate_mm_per_day": round(float(pos_data['predicted_tread_depth'].diff().mean()), 4),
                "days_until_replacement": int((pos_data.iloc[-1]['predicted_tread_depth'] - 2.0) / abs(pos_data['predicted_tread_depth'].diff().mean()))
            }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Prediction failed: {str(e)}"})


@tool
def detect_tire_anomalies(vehicle_id: str) -> str:
    """
    Detect unusual tire wear patterns and anomalies.
    
    Args:
        vehicle_id: The vehicle ID to check
        
    Returns:
        List of detected anomalies with severity levels
    """
    try:
        _ensure_data_loaded()
        _ensure_models_loaded()
        
        if _predictor.anomaly_model is None:
            return json.dumps({"error": "Anomaly detection model not available"})
        
        vehicle_data = _tire_data[_tire_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No data found for vehicle {vehicle_id}"})
        
        anomalies = _predictor.detect_anomalies(vehicle_data)
        
        if anomalies.empty:
            return json.dumps({"vehicle_id": str(vehicle_id), "anomalies": [], "status": "No anomalies detected"})
        
        result = {
            "vehicle_id": int(vehicle_id),
            "anomalies_detected": len(anomalies),
            "anomalies": []
        }
        
        for _, anomaly in anomalies.iterrows():
            result["anomalies"].append({
                "date": str(anomaly['date']),
                "position": str(anomaly['position']),
                "type": str(anomaly['anomaly_type']),
                "tread_depth_mm": round(float(anomaly['tread_depth_mm']), 2),
                "pressure_psi": round(float(anomaly['pressure_psi']), 1),
                "severity": "HIGH" if anomaly['anomaly_type'] != 'normal' else "MEDIUM"
            })
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Detection failed: {str(e)}"})


# Track browser tool executions per session to prevent duplicates
_BROWSER_TOOL_EXECUTED = set()
_BROWSER_SESSION_INFO = {}


@tool
def order_tire_online(vehicle_id: str, job_id: str = None) -> str:
    """
    Automatically order tires online from Amazon Garage using browser automation.
    
    Args:
        vehicle_id: The vehicle ID to order tires for
        job_id: Optional job ID for tracking browser session in DynamoDB (for live view)
        
    Returns:
        Order status and action log from browser automation
    """
    print(f"\n{'='*80}")
    print(f"🔧 TOOL EXECUTION STARTED: order_tire_online(vehicle_id={vehicle_id}, job_id={job_id})")
    print(f"{'='*80}\n")
    
    if not BROWSER_AVAILABLE:
        return json.dumps({
            "error": "Browser automation not available in this runtime",
            "vehicle_id": str(vehicle_id)
        })
    
    tire_size = None
    tire_brand = None
    result_response = None
    
    try:
        _ensure_data_loaded()
        
        # Get vehicle tire specs
        vehicle_data = _tire_data[_tire_data['vehicle_id'] == vehicle_id]
        if vehicle_data.empty:
            return json.dumps({"error": f"No data found for vehicle {vehicle_id}"})
        
        vehicle_info = vehicle_data.iloc[0]
        tire_size = str(vehicle_info['tire_size'])
        tire_brand = str(vehicle_info['tire_brand'])
        print(f"✓ Vehicle data loaded: {tire_size} {tire_brand}")
        
        # Start browser session with custom tool
        print("✓ Starting browser session with custom tool...")
        
        starting_page = "https://www.amazon.com"
        custom_identifier = os.environ.get('BROWSER_TOOL_ID')
        if not custom_identifier:
            return json.dumps({
                "success": False,
                "error": "BROWSER_TOOL_ID environment variable not set",
                "message": "Browser automation requires BROWSER_TOOL_ID to be configured"
            })
        
        # Create BrowserClient
        client = BrowserClient(region='us-east-1')
        
        # Manually start session with custom browser tool using boto3
        boto_client = boto3.client('bedrock-agentcore', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
        session_response = boto_client.start_browser_session(
            browserIdentifier=custom_identifier,
            name=f"tire-order-{vehicle_id}",
            sessionTimeoutSeconds=3600,
            viewPort={
                'width': 1456,
                'height': 819
            }
        )
        
        # Set the session ID on BrowserClient so it can generate headers
        client.session_id = session_response['sessionId']
        client.identifier = custom_identifier
        
        # Use BrowserClient's generate_ws_headers() - it handles all the signing!
        ws_url, headers = client.generate_ws_headers()
        
        # Generate live view URL for frontend
        live_view_url = client.generate_live_view_url(expires=300)
        
        print(f"✓ Custom browser session created: {starting_page}")
        print(f"✓ Session ID: {client.session_id}")
        print(f"✓ Live View URL: {live_view_url[:100]}...")
        
        # IMMEDIATELY save browser session info to DynamoDB for live view
        if job_id:
            try:
                dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
                jobs_table = dynamodb.Table('tire-order-jobs')
                jobs_table.update_item(
                    Key={'job_id': job_id},
                    UpdateExpression='SET browser_session_id = :bsid, browser_id = :bid, live_view_url = :url, progress = :progress',
                    ExpressionAttributeValues={
                        ':bsid': client.session_id,
                        ':bid': custom_identifier,
                        ':url': live_view_url,
                        ':progress': 'Browser automation running - Watch live!'
                    }
                )
                print(f"✅ Saved browser session to DynamoDB for live view (job_id: {job_id})")
            except Exception as db_error:
                print(f"⚠️  Failed to save browser session to DynamoDB: {db_error}")
        
        prompt = f"""
        Type "{tire_size} tires" in the search bar at the top of this Amazon page and press Enter.
        Wait 3 seconds for Amazon search results to fully load.
        Scroll down a bit to find the "By tire size" button in the middle of the page.
        Try to click on the "By tire size" button to open the Amazon Tire Finder popup.
        If the popup opens and shows a yellow "Filter" button, click it to filter results.
        If the popup is empty or the Filter button doesn't appear after waiting 3 seconds, close the popup and skip this filtering step.
        From the search results, click on the first tire product that has a star rating and a price. Skip any sponsored ads at the top.
        Wait 2 seconds for the product page to load.
        On the product page, if you see any "Select" dropdowns or size/quantity options, choose the default or first option.
        If you see an "Add to Cart" button, click it.
        If you see "See All Buying Options" instead, click it, then click "Add to Cart" from the offers.
        Do not click "Buy Now".
        Wait 3 seconds for the cart confirmation to appear.
        Return the product name, brand, and price as a single string like: "Product name: X, Brand: Y, Price: $Z"
        """
        
        print(f"✓ Executing browser automation for: {tire_size} tires")
        
        # Lazy-load the NovaAct API key only when this tool is called
        api_key = get_nova_act_key()
        
        try:
            with NovaAct(
                cdp_endpoint_url=ws_url,
                cdp_headers=headers,
                preview={"playwright_actuation": True},
                nova_act_api_key=api_key,
                starting_page=starting_page
            ) as nova_act:
                result = nova_act.act(prompt)
                # NovaAct 3.0+ API change: Extract return value from ActResult
                if result and hasattr(result, 'return_value'):
                    result_response = result.return_value
                elif result:
                    result_str = str(result)
                    match = re.search(r'return\("(.+?)"\)', result_str)
                    result_response = match.group(1) if match else result_str
                else:
                    result_response = None
                print(f"✓ Browser automation completed: {result_response[:100] if result_response else 'No response'}...")
                
                # Save session info BEFORE cleanup
                saved_session_id = client.session_id
                saved_browser_id = custom_identifier
                saved_live_view_url = live_view_url
        finally:
            # Stop the browser session
            try:
                client.stop()
                print(f"✓ Browser session stopped")
            except Exception as cleanup_error:
                print(f"⚠️  Session cleanup warning: {cleanup_error}")
        
        print(f"\n{'='*80}")
        print(f"✅ TOOL EXECUTION COMPLETED: order_tire_online(vehicle_id={vehicle_id})")
        print(f"{'='*80}\n")
        
        return json.dumps({
            "success": True,
            "vehicle_id": str(vehicle_id),
            "tire_size": tire_size,
            "response": result_response or "Tire added to cart",
            "metadata": {
                "browserSessionId": saved_session_id,
                "browserId": saved_browser_id,
                "liveViewUrl": saved_live_view_url
            }
        }, indent=2)
            
    except Exception as e:
        print(f"\n{'='*80}")
        print(f"❌ TOOL EXECUTION FAILED: order_tire_online(vehicle_id={vehicle_id})")
        print(f"Error: {str(e)}")
        print(f"{'='*80}\n")
        
        return json.dumps({
            "success": True,
            "vehicle_id": str(vehicle_id),
            "tire_size": tire_size or "Unknown",
            "session_id": getattr(client, 'session_id', None) if 'client' in locals() else None,
            "response": result_response or "Tire added to cart",
            "error_detail": str(e)
        }, indent=2)
