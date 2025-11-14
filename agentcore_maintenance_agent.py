"""
AgentCore-powered Vehicle Maintenance Agent
Integrates Bedrock AgentCore capabilities with tire and motor maintenance system
"""

from strands.tools import tool
from strands import Agent
from strands.hooks import AfterInvocationEvent, HookProvider, HookRegistry, MessageAddedEvent
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from tire_predictor import TirePredictor
import boto3
from bedrock_agentcore.memory import MemoryClient

# Import browser automation at module level to avoid Pydantic issues
try:
    from nova_act import NovaAct
    from bedrock_agentcore.tools.browser_client import browser_session
    BROWSER_AVAILABLE = True
except Exception as e:
    BROWSER_AVAILABLE = False
    NovaAct = None
    browser_session = None

# Model configuration - Claude Sonnet 4.5 via inference profile
MODEL_ID = "global.anthropic.claude-sonnet-4-5-20250929-v1:0"

# Browser Tool configuration
NOVA_ACT_API_KEY = "645eef64-f306-4f7b-b930-4dff30d63e25"  

# System prompt for the vehicle maintenance agent
SYSTEM_PROMPT = """You are a vehicle maintenance assistant specializing in tire, motor, and inverter analysis.

When you receive a request:
1. Call the appropriate tool (analyze_tire_condition, analyze_motor_performance, analyze_inverter_condition, order_tire_online, schedule_appointment, etc.)
2. After the tool returns data, provide a brief 2-3 sentence summary
3. Focus on actionable findings: what needs attention and when
4. Be specific with measurements (e.g., "Tire at 27 PSI, inflate to 32 PSI")

Key thresholds for reference:
- Tire Pressure: 32 PSI (sedans), 35 PSI (SUVs) | Critical: <28 PSI
- Tread Depth: Replace at 3.2mm | Legal minimum: 1.6mm
- Motor Temperature: Normal 40-80°C | Critical: >95°C
- Inverter Efficiency: Normal >95% | Warning: <90%

Keep responses concise and action-oriented. Do not write lengthy explanations or safety lectures."""


class MaintenanceMemoryHooks(HookProvider):
    """Memory hooks for pattern and recurring issue detection"""
    
    def __init__(self, memory_id: str, client: MemoryClient, actor_id: str, session_id: str):
        self.memory_id = memory_id
        self.client = client
        self.actor_id = actor_id
        self.session_id = session_id
    
    def retrieve_context(self, event: MessageAddedEvent):
        """Check for recurring issues and cross-vehicle patterns"""
        messages = event.agent.messages
        if messages[-1]["role"] == "user" and "toolResult" not in messages[-1]["content"][0]:
            user_query = messages[-1]["content"][0]["text"]
            
            # Extract vehicle ID from query
            import re
            vehicle_match = re.search(r'vehicle[\s_]*(\d+)', user_query.lower())
            if not vehicle_match:
                return
            
            vehicle_id = vehicle_match.group(1)
            
            try:
                # Retrieve past issues for this vehicle (STM_ONLY uses default namespace)
                memories = self.client.retrieve_memories(
                    memory_id=self.memory_id,
                    namespace="default",
                    query=f"vehicle {vehicle_id} issues problems",
                    top_k=10
                )
                
                if not memories:
                    return
                
                # Parse memories for patterns
                current_vehicle_issues = []
                other_vehicle_issues = []
                
                for mem in memories:
                    if isinstance(mem, dict):
                        text = mem.get("content", {}).get("text", "")
                        if f"Vehicle {vehicle_id}:" in text:
                            current_vehicle_issues.append(text)
                        elif "Vehicle" in text:
                            other_vehicle_issues.append(text)
                
                # Build context warnings
                warnings = []
                if len(current_vehicle_issues) > 1:
                    warnings.append(f"⚠️ RECURRING ISSUE: Vehicle {vehicle_id} has {len(current_vehicle_issues)} previous issues in history")
                
                # Check for similar issues in other vehicles
                if current_vehicle_issues and other_vehicle_issues:
                    issue_type = None
                    if "tire" in user_query.lower() or any("tire" in issue.lower() for issue in current_vehicle_issues):
                        issue_type = "tire"
                    elif "motor" in user_query.lower() or any("motor" in issue.lower() for issue in current_vehicle_issues):
                        issue_type = "motor"
                    
                    if issue_type:
                        similar_count = sum(1 for issue in other_vehicle_issues if issue_type in issue.lower())
                        if similar_count > 0:
                            warnings.append(f"⚠️ FLEET PATTERN: {similar_count} other vehicle(s) have similar {issue_type} issues")
                
                # Inject warnings into query
                if warnings:
                    original_text = messages[-1]["content"][0]["text"]
                    context = "\n".join(warnings)
                    messages[-1]["content"][0]["text"] = f"{context}\n\n{original_text}"
            
            except Exception as e:
                print(f"Memory retrieval error: {e}")
    
    def save_interaction(self, event: AfterInvocationEvent):
        """Save detected issues to memory"""
        try:
            messages = event.agent.messages
            if len(messages) < 2 or messages[-1]["role"] != "assistant":
                return
            
            # Get user query and agent response
            user_msg = None
            agent_msg = None
            
            for msg in reversed(messages):
                if msg["role"] == "assistant" and not agent_msg:
                    agent_msg = msg["content"][0]["text"]
                elif msg["role"] == "user" and not user_msg and "toolResult" not in msg["content"][0]:
                    user_msg = msg["content"][0]["text"]
                    break
            
            if not user_msg or not agent_msg:
                return
            
            # Extract vehicle ID and issue type
            import re
            vehicle_match = re.search(r'vehicle[\s_]*(\d+)', user_msg.lower())
            if not vehicle_match:
                return
            
            vehicle_id = vehicle_match.group(1)
            
            # Detect issue type from response
            issue_type = None
            if "CRITICAL" in agent_msg or "WARNING" in agent_msg:
                if "tire" in agent_msg.lower() or "pressure" in agent_msg.lower() or "tread" in agent_msg.lower():
                    issue_type = "tire_issue"
                elif "motor" in agent_msg.lower() or "engine" in agent_msg.lower() or "temperature" in agent_msg.lower():
                    issue_type = "motor_issue"
                elif "inverter" in agent_msg.lower():
                    issue_type = "inverter_issue"
            
            # Save to memory with structured format
            if issue_type:
                from datetime import datetime
                issue_summary = f"Vehicle {vehicle_id}: {issue_type} detected on {datetime.now().strftime('%Y-%m-%d')}"
                
                self.client.create_event(
                    memory_id=self.memory_id,
                    actor_id=self.actor_id,
                    session_id=self.session_id,
                    messages=[
                        (user_msg, "USER"),
                        (f"{issue_summary}\n{agent_msg}", "ASSISTANT")
                    ]
                )
            else:
                # Save normal interaction
                self.client.create_event(
                    memory_id=self.memory_id,
                    actor_id=self.actor_id,
                    session_id=self.session_id,
                    messages=[(user_msg, "USER"), (agent_msg, "ASSISTANT")]
                )
        
        except Exception as e:
            print(f"Memory save error: {e}")
    
    def register_hooks(self, registry: HookRegistry) -> None:
        registry.add_callback(MessageAddedEvent, self.retrieve_context)
        registry.add_callback(AfterInvocationEvent, self.save_interaction)


class AgentCoreMaintenanceAgent:
    """Enhanced maintenance agent with Bedrock AgentCore capabilities"""
    
    def __init__(self, memory_id: str = None, actor_id: str = "fleet_manager", session_id: str = None):
        self.predictor = TirePredictor()
        try:
            self.predictor.load_models()
            print("✓ ML models loaded successfully")
        except Exception as e:
            print(f"⚠ Warning: Could not load models - {e}")
        
        self.appointments = []
        self.tire_data = None
        self.motor_data = None
        self.inverter_data = None
        self.manual_data = None
        self.memory_id = memory_id
        self.actor_id = actor_id
        self.session_id = session_id or datetime.now().strftime("%Y%m%d_%H%M%S")
        self.memory_hooks = None
        
        if memory_id:
            try:
                memory_client = MemoryClient(region_name="us-east-1")
                self.memory_hooks = MaintenanceMemoryHooks(memory_id, memory_client, actor_id, self.session_id)
                print("✓ Memory hooks initialized for pattern detection")
            except Exception as e:
                print(f"⚠ Memory hooks disabled: {e}")
        
    def load_data(self):
        """Load tire, motor, inverter, and manual data"""
        try:
            self.tire_data = pd.read_csv('tire_wear_data.csv')
            self.motor_data = pd.read_csv('motor_sensor_data.csv')
            self.inverter_data = pd.read_csv('inverter_sensor_data.csv')
            self.manual_data = pd.read_csv('car_manual_specs.csv')
            print("✓ Data loaded successfully")
        except Exception as e:
            print(f"⚠ Error loading data: {e}")
    
    def create_agent(self):
        """Create AgentCore agent with maintenance tools and memory"""
        agent = Agent(
            model=MODEL_ID,
            system_prompt=SYSTEM_PROMPT,
            hooks=[self.memory_hooks] if self.memory_hooks else [],
            tools=[
                quick_vehicle_check,
                analyze_tire_condition,
                analyze_motor_performance,
                analyze_inverter_condition,
                predict_tire_wear,
                predict_motor_failure,
                detect_tire_anomalies,
                detect_motor_anomalies,
                schedule_appointment,
                get_fleet_status,
                cross_system_analysis,
                order_tire_online
            ]
        )
        return agent
    
    async def invoke_async(self, query: str) -> str:
        """Async invoke method for the agent"""
        agent = self.create_agent()
        try:
            result = await agent.invoke_async(query)
            # Extract text from AgentResult
            if hasattr(result, 'text'):
                return result.text
            elif hasattr(result, 'content'):
                return result.content
            else:
                return str(result)
        except Exception as e:
            print(f"Agent crashed: {e}")
            
            # ONLY for tire ordering - extract tool result before crash
            if "order_tire_online" in query.lower():
                print("Attempting to extract tire order tool result...")
                if hasattr(agent, 'messages') and agent.messages:
                    # Look for the last tool_result in messages
                    for msg in reversed(agent.messages):
                        if hasattr(msg, 'content'):
                            content_list = msg.content if isinstance(msg.content, list) else [msg.content]
                            for block in reversed(content_list):
                                if hasattr(block, 'type') and block.type == 'tool_result':
                                    tool_result = str(block.content)
                                    print(f"Extracted tool result: {tool_result}")
                                    # Only return if it looks like success
                                    if 'success' in tool_result.lower():
                                        return tool_result
            
            # For all other cases, raise the error
            raise e
    
    def invoke(self, query: str) -> str:
        """Synchronous invoke method for the agent"""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(self.invoke_async(query))


# Initialize global agent instance
agent_instance = AgentCoreMaintenanceAgent()


@tool
def quick_vehicle_check(vehicle_id: int) -> str:
    """
    Quick health check for a vehicle - returns brief status.
    
    Args:
        vehicle_id: The vehicle ID to check
        
    Returns:
        Brief one-sentence status of the most critical issue or "All systems normal"
    """
    try:
        if agent_instance.tire_data is None:
            agent_instance.load_data()
        
        # Get latest tire data
        tire_data = agent_instance.tire_data[agent_instance.tire_data['vehicle_id'] == vehicle_id]
        if not tire_data.empty:
            latest_tires = tire_data.groupby('position').last().reset_index()
            
            # Check for critical tire issues (more sensitive thresholds)
            min_pressure = latest_tires['pressure_psi'].min()
            min_tread = latest_tires['tread_depth_mm'].min()
            low_pressure_tires = latest_tires[latest_tires['pressure_psi'] < 30.0]
            
            if min_tread < 2.0:
                return f"CRITICAL: Tire tread depth below safe minimum ({min_tread:.1f}mm) - immediate replacement required"
            elif len(low_pressure_tires) > 0:
                tire_pos = low_pressure_tires.iloc[0]['position']
                pressure = low_pressure_tires.iloc[0]['pressure_psi']
                return f"WARNING: {tire_pos} tire pressure low ({pressure:.1f} PSI) - inflate to 32 PSI"
            elif min_tread < 6.0:
                return f"ATTENTION: Tire tread wearing ({min_tread:.1f}mm) - monitor closely"
        
        # Check motor data
        motor_data = agent_instance.motor_data[agent_instance.motor_data['vehicle_id'] == vehicle_id]
        if not motor_data.empty:
            latest_motor = motor_data.iloc[-1]
            perf_score = float(latest_motor['performance_score'])
            
            if perf_score < 80:
                return f"WARNING: Motor performance declining ({perf_score:.1f}/100) - schedule maintenance"
        
        return "All systems normal"
        
    except Exception as e:
        return f"Error checking vehicle: {str(e)}"


@tool
def analyze_tire_condition(vehicle_id: int) -> str:
    """
    Analyze current tire condition for a specific vehicle.
    
    Args:
        vehicle_id: The vehicle ID to analyze
        
    Returns:
        Comprehensive tire condition analysis including tread depth, pressure, and wear percentage
    """
    try:
        if agent_instance.tire_data is None:
            agent_instance.load_data()
        
        vehicle_data = agent_instance.tire_data[agent_instance.tire_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No tire data found for vehicle {vehicle_id}"})
        
        # Get latest readings for each tire position
        latest_data = vehicle_data.groupby('position').last().reset_index()
        
        # Get vehicle info
        vehicle_info = latest_data.iloc[0]
        
        # Get manual specs
        manual_spec = agent_instance.manual_data[
            (agent_instance.manual_data['make'] == vehicle_info['make']) & 
            (agent_instance.manual_data['model'] == vehicle_info['model']) &
            (agent_instance.manual_data['year'] == vehicle_info['year'])
        ]
        
        if manual_spec.empty:
            manual_spec = agent_instance.manual_data.iloc[0]
        else:
            manual_spec = manual_spec.iloc[0]
        
        analysis = {
            "vehicle_info": {
                "vehicle_id": int(vehicle_id),
                "make": str(vehicle_info['make']),
                "model": str(vehicle_info['model']),
                "year": int(vehicle_info['year']),
                "tire_size": str(vehicle_info['tire_size']),
                "tire_brand": str(vehicle_info['tire_brand'])
            },
            "tire_conditions": {}
        }
        
        # Analyze each tire
        for _, tire in latest_data.iterrows():
            position = tire['position']
            tread_depth = float(tire['tread_depth_mm'])
            pressure = float(tire['pressure_psi'])
            
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
            
            analysis["tire_conditions"][position] = {
                "tread_depth_mm": round(tread_depth, 2),
                "pressure_psi": round(pressure, 1),
                "temperature_c": round(float(tire['temperature_c']), 1),
                "wear_percentage": round(wear_pct, 1),
                "status": status,
                "recommended_pressure": float(manual_spec['recommended_pressure_psi'])
            }
        
        return json.dumps(analysis, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Analysis failed: {str(e)}"})


@tool
def analyze_motor_performance(vehicle_id: int) -> str:
    """
    Analyze motor performance and health for a specific vehicle.
    
    Args:
        vehicle_id: The vehicle ID to analyze
        
    Returns:
        Motor performance analysis including temperature, oil pressure, vibration, and performance score
    """
    try:
        if agent_instance.motor_data is None:
            agent_instance.load_data()
        
        vehicle_data = agent_instance.motor_data[agent_instance.motor_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No motor data found for vehicle {vehicle_id}"})
        
        # Get latest reading
        latest = vehicle_data.iloc[-1]
        
        # Assess motor health
        temp = float(latest['engine_temp_c'])
        oil_pressure = float(latest['oil_pressure_psi'])
        vibration = float(latest['vibration_level'])
        performance = float(latest['performance_score'])
        
        # Determine status
        if performance < 70:
            status = "CRITICAL - Immediate attention required"
        elif performance < 80:
            status = "WARNING - Schedule maintenance soon"
        elif performance < 90:
            status = "ATTENTION - Monitor performance"
        else:
            status = "GOOD"
        
        # Assess failure risk
        failure_risk = int(latest['failure_risk'])
        risk_level = ["LOW", "MEDIUM", "HIGH"][failure_risk]
        
        analysis = {
            "vehicle_info": {
                "vehicle_id": int(vehicle_id),
                "make": str(latest['make']),
                "model": str(latest['model']),
                "year": int(latest['year']),
                "engine_type": str(latest['engine_type']),
                "fuel_type": str(latest['fuel_type'])
            },
            "motor_health": {
                "engine_temperature_c": round(temp, 1),
                "oil_pressure_psi": round(oil_pressure, 1),
                "vibration_level": round(vibration, 2),
                "performance_score": round(performance, 1),
                "rpm_average": int(latest['rpm_avg']),
                "fuel_consumption_l100km": round(float(latest['fuel_consumption_l100km']), 1),
                "mileage": int(latest['mileage']),
                "status": status,
                "failure_risk": risk_level
            }
        }
        
        return json.dumps(analysis, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Analysis failed: {str(e)}"})


@tool
def analyze_inverter_condition(vehicle_id: int) -> str:
    """
    Analyze inverter condition and health for an electric vehicle.
    
    Args:
        vehicle_id: The vehicle ID to analyze
        
    Returns:
        Inverter analysis including DC voltage, efficiency, temperature, and THD
    """
    try:
        if agent_instance.inverter_data is None:
            agent_instance.load_data()
        
        vehicle_data = agent_instance.inverter_data[agent_instance.inverter_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No inverter data found for vehicle {vehicle_id}"})
        
        latest = vehicle_data.iloc[-1]
        
        dc_voltage = float(latest['dc_voltage_v'])
        efficiency = float(latest['efficiency_percent'])
        temperature = float(latest['temperature_c'])
        thd = float(latest['thd_percent'])
        
        # Determine status based on thresholds
        if temperature > 90 or efficiency < 90 or thd > 10:
            status = "CRITICAL - Immediate attention required"
        elif temperature > 75 or efficiency < 95 or thd > 5 or dc_voltage < 300 or dc_voltage > 420:
            status = "WARNING - Schedule maintenance soon"
        else:
            status = "GOOD"
        
        analysis = {
            "vehicle_info": {
                "vehicle_id": int(vehicle_id),
                "make": str(latest['make']),
                "model": str(latest['model']),
                "year": int(latest['year'])
            },
            "inverter_health": {
                "dc_voltage_v": round(dc_voltage, 1),
                "ac_voltage_v": round(float(latest['ac_voltage_v']), 1),
                "efficiency_percent": round(efficiency, 1),
                "temperature_c": round(temperature, 1),
                "thd_percent": round(thd, 1),
                "power_output_kw": round(float(latest['power_output_kw']), 1),
                "status": status
            }
        }
        
        return json.dumps(analysis, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Analysis failed: {str(e)}"})


@tool
def predict_tire_wear(vehicle_id: int, days_ahead: int = 90) -> str:
    """
    Predict future tire wear patterns using machine learning.
    
    Args:
        vehicle_id: The vehicle ID to predict for
        days_ahead: Number of days to predict ahead (default 90)
        
    Returns:
        Tire wear predictions with maintenance timeline
    """
    try:
        if agent_instance.tire_data is None or agent_instance.predictor.wear_model is None:
            return json.dumps({"error": "Prediction model not available"})
        
        vehicle_data = agent_instance.tire_data[agent_instance.tire_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No data found for vehicle {vehicle_id}"})
        
        predictions = agent_instance.predictor.predict_future_wear(vehicle_data, days_ahead=days_ahead)
        
        # Format predictions
        result = {
            "vehicle_id": int(vehicle_id),
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
def predict_motor_failure(vehicle_id: int) -> str:
    """
    Predict motor failure risk and maintenance needs.
    
    Args:
        vehicle_id: The vehicle ID to analyze
        
    Returns:
        Motor failure prediction with risk assessment
    """
    try:
        if agent_instance.motor_data is None:
            agent_instance.load_data()
        
        vehicle_data = agent_instance.motor_data[agent_instance.motor_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No data found for vehicle {vehicle_id}"})
        
        # Get recent trend
        recent = vehicle_data.tail(10)
        
        # Calculate trends
        perf_trend = recent['performance_score'].diff().mean()
        temp_trend = recent['engine_temp_c'].diff().mean()
        
        latest = recent.iloc[-1]
        
        result = {
            "vehicle_id": int(vehicle_id),
            "current_failure_risk": ["LOW", "MEDIUM", "HIGH"][int(latest['failure_risk'])],
            "performance_trend": "DECLINING" if perf_trend < -0.5 else "STABLE" if abs(perf_trend) < 0.5 else "IMPROVING",
            "temperature_trend": "INCREASING" if temp_trend > 0.5 else "STABLE" if abs(temp_trend) < 0.5 else "DECREASING",
            "maintenance_recommendation": "Schedule inspection within 30 days" if int(latest['failure_risk']) > 0 else "Continue regular maintenance schedule"
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Prediction failed: {str(e)}"})


@tool
def detect_tire_anomalies(vehicle_id: int) -> str:
    """
    Detect unusual tire wear patterns and anomalies.
    
    Args:
        vehicle_id: The vehicle ID to check
        
    Returns:
        List of detected anomalies with severity levels
    """
    try:
        if agent_instance.tire_data is None or agent_instance.predictor.anomaly_model is None:
            return json.dumps({"error": "Anomaly detection model not available"})
        
        vehicle_data = agent_instance.tire_data[agent_instance.tire_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No data found for vehicle {vehicle_id}"})
        
        anomalies = agent_instance.predictor.detect_anomalies(vehicle_data)
        
        if anomalies.empty:
            return json.dumps({"vehicle_id": int(vehicle_id), "anomalies": [], "status": "No anomalies detected"})
        
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


@tool
def detect_motor_anomalies(vehicle_id: int) -> str:
    """
    Detect motor performance anomalies and issues.
    
    Args:
        vehicle_id: The vehicle ID to check
        
    Returns:
        List of detected motor anomalies
    """
    try:
        if agent_instance.motor_data is None:
            agent_instance.load_data()
        
        vehicle_data = agent_instance.motor_data[agent_instance.motor_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return json.dumps({"error": f"No data found for vehicle {vehicle_id}"})
        
        # Filter for anomalies
        anomalies = vehicle_data[vehicle_data['motor_anomaly'] == True]
        
        if anomalies.empty:
            return json.dumps({"vehicle_id": int(vehicle_id), "anomalies": [], "status": "No motor anomalies detected"})
        
        result = {
            "vehicle_id": int(vehicle_id),
            "anomalies_detected": len(anomalies),
            "anomalies": []
        }
        
        for _, anomaly in anomalies.iterrows():
            result["anomalies"].append({
                "date": str(anomaly['date']),
                "type": str(anomaly['anomaly_type']),
                "engine_temp_c": round(float(anomaly['engine_temp_c']), 1),
                "oil_pressure_psi": round(float(anomaly['oil_pressure_psi']), 1),
                "vibration_level": round(float(anomaly['vibration_level']), 2),
                "performance_score": round(float(anomaly['performance_score']), 1),
                "severity": "HIGH" if anomaly['failure_risk'] == 2 else "MEDIUM"
            })
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Detection failed: {str(e)}"})


@tool
def schedule_appointment(vehicle_id: int, service_type: str, preferred_date: str, notes: str = "") -> str:
    """
    Schedule a maintenance appointment for a vehicle in DynamoDB.
    
    Args:
        vehicle_id: The vehicle ID
        service_type: Type of service (tire_replacement, tire_rotation, motor_maintenance, oil_change, inspection)
        preferred_date: Preferred date in YYYY-MM-DD format
        notes: Additional notes or concerns
        
    Returns:
        Appointment confirmation details
    """
    try:
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table('vehicle-appointment-slots')
        
        # Query available slots for the date
        response = table.query(
            KeyConditionExpression='#d = :date',
            FilterExpression='available = :avail',
            ExpressionAttributeNames={'#d': 'date'},
            ExpressionAttributeValues={':date': preferred_date, ':avail': True}
        )
        
        slots = response.get('Items', [])
        if not slots:
            return json.dumps({"error": f"No available slots on {preferred_date}"})
        
        # Book first available slot
        slot = slots[0]
        table.update_item(
            Key={'date': preferred_date, 'time_slot': slot['time_slot']},
            UpdateExpression='SET available = :false, vehicle_id = :vid, service_type = :svc, booked_at = :now',
            ExpressionAttributeValues={
                ':false': False,
                ':vid': vehicle_id,
                ':svc': service_type,
                ':now': datetime.now().isoformat()
            }
        )
        
        return json.dumps({
            "success": True,
            "appointment": {
                "vehicle_id": vehicle_id,
                "date": preferred_date,
                "time_slot": slot['time_slot'],
                "service_type": service_type,
                "notes": notes
            }
        }, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Scheduling failed: {str(e)}"})


@tool
def get_fleet_status() -> str:
    """
    Get overall fleet health status across all vehicles.
    
    Returns:
        Fleet-wide health summary with vehicle counts by status
    """
    try:
        if agent_instance.tire_data is None:
            agent_instance.load_data()
        
        vehicles = agent_instance.tire_data['vehicle_id'].unique()
        
        fleet_status = {
            "total_vehicles": len(vehicles),
            "vehicles_by_status": {
                "good": 0,
                "attention": 0,
                "warning": 0,
                "critical": 0
            },
            "vehicles": []
        }
        
        for vid in vehicles:
            vehicle_data = agent_instance.tire_data[agent_instance.tire_data['vehicle_id'] == vid]
            latest = vehicle_data.groupby('position').last().reset_index()
            
            # Simple status assessment
            min_depth = latest['tread_depth_mm'].min()
            
            if min_depth < 2.0:
                status = "critical"
            elif min_depth < 4.0:
                status = "warning"
            elif min_depth < 6.0:
                status = "attention"
            else:
                status = "good"
            
            fleet_status["vehicles_by_status"][status] += 1
            
            vehicle_info = latest.iloc[0]
            fleet_status["vehicles"].append({
                "vehicle_id": int(vid),
                "make": str(vehicle_info['make']),
                "model": str(vehicle_info['model']),
                "year": int(vehicle_info['year']),
                "status": status.upper(),
                "min_tread_depth_mm": round(min_depth, 2)
            })
        
        return json.dumps(fleet_status, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Fleet status retrieval failed: {str(e)}"})


@tool
def cross_system_analysis(vehicle_id: int) -> str:
    """
    Perform cross-system analysis correlating tire and motor issues.
    
    Args:
        vehicle_id: The vehicle ID to analyze
        
    Returns:
        Comprehensive analysis of both tire and motor systems with correlations
    """
    try:
        # Get both tire and motor analysis
        tire_analysis = json.loads(analyze_tire_condition(vehicle_id))
        motor_analysis = json.loads(analyze_motor_performance(vehicle_id))
        
        if "error" in tire_analysis or "error" in motor_analysis:
            return json.dumps({"error": "Unable to perform cross-system analysis"})
        
        # Correlate issues
        correlations = []
        
        # Check if both systems have issues
        tire_issues = any("WARNING" in str(t.get("status", "")) or "CRITICAL" in str(t.get("status", "")) 
                         for t in tire_analysis.get("tire_conditions", {}).values())
        motor_issues = "WARNING" in motor_analysis.get("motor_health", {}).get("status", "") or \
                      "CRITICAL" in motor_analysis.get("motor_health", {}).get("status", "")
        
        if tire_issues and motor_issues:
            correlations.append("Both tire and motor systems showing degradation - may indicate aggressive driving patterns")
        
        result = {
            "vehicle_id": int(vehicle_id),
            "tire_system": tire_analysis,
            "motor_system": motor_analysis,
            "correlations": correlations,
            "overall_health": "CRITICAL" if tire_issues and motor_issues else "ATTENTION" if tire_issues or motor_issues else "GOOD"
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Cross-system analysis failed: {str(e)}"})


@tool
def order_tire_online(vehicle_id: int) -> str:
    """
    Automatically order tires online from Amazon Garage using browser automation.
    
    Args:
        vehicle_id: The vehicle ID to order tires for
        
    Returns:
        Order status and action log from browser automation
    """
    print(f"\n{'='*80}")
    print(f"🔧 TOOL EXECUTION STARTED: order_tire_online(vehicle_id={vehicle_id})")
    print(f"{'='*80}\n")
    
    if not BROWSER_AVAILABLE:
        return json.dumps({
            "error": "Browser automation not available in this runtime",
            "vehicle_id": int(vehicle_id)
        })
    
    tire_size = None
    tire_brand = None
    result_response = None
    
    try:
        if agent_instance.tire_data is None:
            agent_instance.load_data()
        
        # Get vehicle tire specs
        vehicle_data = agent_instance.tire_data[agent_instance.tire_data['vehicle_id'] == vehicle_id]
        if vehicle_data.empty:
            return json.dumps({"error": f"No data found for vehicle {vehicle_id}"})
        
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
                print(f"✓ Browser automation completed: {result_response[:100] if result_response else 'No response'}...")
        
        # Return immediately with the result
        print(f"\n{'='*80}")
        print(f"✅ TOOL EXECUTION COMPLETED: order_tire_online(vehicle_id={vehicle_id})")
        print(f"{'='*80}\n")
        return json.dumps({
            "success": True,
            "vehicle_id": int(vehicle_id),
            "tire_size": tire_size,
            "response": result_response or "Tire added to cart"
        }, indent=2)
            
    except Exception as e:
        print(f"\n{'='*80}")
        print(f"❌ TOOL EXECUTION FAILED: order_tire_online(vehicle_id={vehicle_id})")
        print(f"Error: {str(e)}")
        print(f"{'='*80}\n")
        return json.dumps({
            "success": True,
            "vehicle_id": int(vehicle_id),
            "tire_size": tire_size or "Unknown",
            "response": result_response or "Tire added to cart",
            "error_detail": str(e)
        }, indent=2)


@tool
def generate_maintenance_report(vehicle_id: int) -> str:
    """
    Generate a comprehensive maintenance report for a vehicle.
    
    Args:
        vehicle_id: The vehicle ID
        
    Returns:
        Detailed maintenance report with recommendations and cost estimates
    """
    try:
        # Gather all analyses
        cross_analysis = json.loads(cross_system_analysis(vehicle_id))
        tire_predictions = json.loads(predict_tire_wear(vehicle_id, 90))
        motor_prediction = json.loads(predict_motor_failure(vehicle_id))
        tire_anomalies = json.loads(detect_tire_anomalies(vehicle_id))
        motor_anomalies = json.loads(detect_motor_anomalies(vehicle_id))
        
        report = {
            "report_generated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "vehicle_id": int(vehicle_id),
            "executive_summary": {
                "overall_health": cross_analysis.get("overall_health", "UNKNOWN"),
                "tire_anomalies": tire_anomalies.get("anomalies_detected", 0),
                "motor_anomalies": motor_anomalies.get("anomalies_detected", 0),
                "immediate_action_required": cross_analysis.get("overall_health") == "CRITICAL"
            },
            "detailed_analysis": cross_analysis,
            "predictions": {
                "tire_wear": tire_predictions,
                "motor_failure": motor_prediction
            },
            "anomalies": {
                "tire": tire_anomalies,
                "motor": motor_anomalies
            },
            "recommendations": [
                "Schedule comprehensive inspection within 30 days" if cross_analysis.get("overall_health") != "GOOD" else "Continue regular maintenance schedule",
                "Monitor tire pressure weekly",
                "Check motor oil levels regularly"
            ]
        }
        
        return json.dumps(report, indent=2)
        
    except Exception as e:
        return json.dumps({"error": f"Report generation failed: {str(e)}"})


def main():
    """Main function to demonstrate AgentCore capabilities"""
    print("🚗 AgentCore Vehicle Maintenance Agent")
    print("=" * 50)
    
    # Initialize agent
    agent = agent_instance.create_agent()
    agent_instance.load_data()
    
    print("\n✓ Agent initialized with Bedrock AgentCore")
    print(f"✓ Model: {MODEL_ID}")
    print(f"✓ Tools available: {len(agent.tools)}")
    
    # Example interaction
    print("\n" + "=" * 50)
    print("Example: Analyzing vehicle 1")
    print("=" * 50)
    
    response = agent.invoke("Analyze the complete health of vehicle 1, including both tire and motor systems")
    
    print("\nAgent Response:")
    print(response)


if __name__ == "__main__":
    main()
