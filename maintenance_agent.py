import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from tire_predictor import TirePredictor

class MaintenanceAgent:
    def __init__(self):
        self.predictor = TirePredictor()
        try:
            self.predictor.load_models()
        except Exception as e:
            print(f"Warning: Could not load models - {e}")
            # Models will be None, but we'll handle this gracefully
        self.appointments = []
        
    def analyze_tire_condition(self, vehicle_id, tire_data, manual_data):
        """Comprehensive tire condition analysis"""
        # Filter data for specific vehicle
        vehicle_data = tire_data[tire_data['vehicle_id'] == vehicle_id]
        
        if vehicle_data.empty:
            return {"error": f"No data found for vehicle {vehicle_id}"}
        
        # Get latest readings
        latest_data = vehicle_data.groupby('position').last().reset_index()
        
        # Get vehicle specifications
        vehicle_info = latest_data.iloc[0]
        manual_spec = manual_data[
            (manual_data['make'] == vehicle_info['make']) & 
            (manual_data['model'] == vehicle_info['model']) &
            (manual_data['year'] == vehicle_info['year'])
        ]
        
        if manual_spec.empty:
            manual_spec = manual_data.iloc[0]  # Default specs
        else:
            manual_spec = manual_spec.iloc[0]
        
        analysis = {
            "vehicle_info": {
                "vehicle_id": vehicle_id,
                "make": vehicle_info['make'],
                "model": vehicle_info['model'],
                "year": vehicle_info['year'],
                "tire_size": vehicle_info['tire_size'],
                "tire_brand": vehicle_info['tire_brand']
            },
            "current_condition": {},
            "predictions": {},
            "anomalies": [],
            "recommendations": [],
            "maintenance_priority": "low"
        }
        
        # Analyze each tire position
        for _, tire in latest_data.iterrows():
            position = tire['position']
            
            # Current condition assessment
            condition = {
                "tread_depth_mm": tire['tread_depth_mm'],
                "pressure_psi": tire['pressure_psi'],
                "temperature_c": tire['temperature_c'],
                "status": self._assess_tire_status(tire, manual_spec),
                "wear_percentage": self._calculate_wear_percentage(tire['tread_depth_mm'], manual_spec)
            }
            
            analysis["current_condition"][position] = condition
        
        # Predict future wear
        try:
            if self.predictor.wear_model is not None:
                future_predictions = self.predictor.predict_future_wear(vehicle_data, days_ahead=90)
                analysis["predictions"] = self._format_predictions(future_predictions)
            else:
                analysis["predictions"] = {"error": "Wear prediction model not available. Please train models first."}
        except Exception as e:
            analysis["predictions"] = {"error": str(e)}
        
        # Detect anomalies
        try:
            if self.predictor.anomaly_model is not None:
                anomalies = self.predictor.detect_anomalies(vehicle_data)
                if not anomalies.empty:
                    analysis["anomalies"] = self._format_anomalies(anomalies)
            else:
                analysis["anomalies"] = []
        except Exception as e:
            analysis["anomalies"] = [{"error": str(e)}]
        
        # Generate recommendations
        analysis["recommendations"] = self._generate_recommendations(analysis, manual_spec)
        analysis["maintenance_priority"] = self._determine_priority(analysis)
        
        return analysis
    
    def _assess_tire_status(self, tire, manual_spec):
        """Assess individual tire status"""
        tread_depth = tire['tread_depth_mm']
        pressure = tire['pressure_psi']
        
        if tread_depth < manual_spec['min_tread_depth_mm']:
            return "CRITICAL - Replace immediately"
        elif tread_depth < manual_spec['replacement_threshold_mm']:
            return "WARNING - Replacement recommended"
        elif abs(pressure - manual_spec['recommended_pressure_psi']) > 5:
            return "ATTENTION - Pressure adjustment needed"
        else:
            return "GOOD"
    
    def _calculate_wear_percentage(self, current_depth, manual_spec):
        """Calculate tire wear percentage"""
        new_tire_depth = 10.0  # Assume new tire depth
        min_depth = manual_spec['min_tread_depth_mm']
        
        wear_percentage = ((new_tire_depth - current_depth) / (new_tire_depth - min_depth)) * 100
        return min(100, max(0, wear_percentage))
    
    def _format_predictions(self, predictions):
        """Format prediction results"""
        if predictions.empty:
            return {"message": "No predictions available"}
        
        formatted = {}
        for position in predictions['position'].unique():
            pos_data = predictions[predictions['position'] == position]
            
            # Find when maintenance will be needed
            maintenance_needed = pos_data[pos_data['maintenance_needed'] == True]
            replacement_needed = pos_data[pos_data['replacement_recommended'] == True]
            
            formatted[position] = {
                "days_until_maintenance": maintenance_needed['days_ahead'].min() if not maintenance_needed.empty else None,
                "days_until_replacement": replacement_needed['days_ahead'].min() if not replacement_needed.empty else None,
                "predicted_depth_30_days": pos_data[pos_data['days_ahead'] == 30]['predicted_tread_depth'].iloc[0] if len(pos_data) >= 30 else None
            }
        
        return formatted
    
    def _format_anomalies(self, anomalies):
        """Format anomaly detection results"""
        formatted_anomalies = []
        
        for _, anomaly in anomalies.iterrows():
            formatted_anomalies.append({
                "date": anomaly['date'],
                "position": anomaly['position'],
                "anomaly_type": anomaly.get('anomaly_type', 'detected'),
                "tread_depth": anomaly['tread_depth_mm'],
                "pressure": anomaly['pressure_psi'],
                "anomaly_score": anomaly['anomaly_score'],
                "severity": "high" if anomaly['anomaly_score'] < -0.5 else "medium"
            })
        
        return formatted_anomalies
    
    def _generate_recommendations(self, analysis, manual_spec):
        """Generate maintenance recommendations"""
        recommendations = []
        
        # Check each tire condition
        for position, condition in analysis["current_condition"].items():
            if "CRITICAL" in condition["status"]:
                recommendations.append({
                    "priority": "URGENT",
                    "action": f"Replace {position} tire immediately",
                    "reason": f"Tread depth {condition['tread_depth_mm']}mm below legal limit",
                    "estimated_cost": "$150-250"
                })
            elif "WARNING" in condition["status"]:
                recommendations.append({
                    "priority": "HIGH",
                    "action": f"Schedule {position} tire replacement",
                    "reason": f"Tread depth {condition['tread_depth_mm']}mm approaching limit",
                    "estimated_cost": "$150-250"
                })
            elif "ATTENTION" in condition["status"]:
                recommendations.append({
                    "priority": "MEDIUM",
                    "action": f"Adjust {position} tire pressure",
                    "reason": f"Pressure {condition['pressure_psi']} PSI deviates from recommended {manual_spec['recommended_pressure_psi']} PSI",
                    "estimated_cost": "Free"
                })
        
        # Check for anomalies
        if analysis["anomalies"]:
            for anomaly in analysis["anomalies"]:
                if isinstance(anomaly, dict) and anomaly.get("severity") == "high":
                    recommendations.append({
                        "priority": "HIGH",
                        "action": f"Inspect {anomaly['position']} tire for {anomaly.get('anomaly_type', 'unknown issue')}",
                        "reason": "Anomalous wear pattern detected",
                        "estimated_cost": "$50-100"
                    })
        
        # General maintenance recommendations
        recommendations.append({
            "priority": "LOW",
            "action": "Schedule tire rotation",
            "reason": f"Recommended every {manual_spec['rotation_interval_miles']} miles",
            "estimated_cost": "$50-80"
        })
        
        return recommendations
    
    def _determine_priority(self, analysis):
        """Determine overall maintenance priority"""
        for rec in analysis["recommendations"]:
            if rec["priority"] == "URGENT":
                return "urgent"
            elif rec["priority"] == "HIGH":
                return "high"
        
        if analysis["anomalies"]:
            return "medium"
        
        return "low"
    
    def schedule_appointment(self, vehicle_id, service_type, preferred_date=None, notes=""):
        """Schedule maintenance appointment"""
        if preferred_date is None:
            preferred_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        
        appointment = {
            "appointment_id": len(self.appointments) + 1,
            "vehicle_id": vehicle_id,
            "service_type": service_type,
            "scheduled_date": preferred_date,
            "status": "scheduled",
            "notes": notes,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        self.appointments.append(appointment)
        return appointment
    
    def get_appointments(self, vehicle_id=None):
        """Get scheduled appointments"""
        if vehicle_id:
            return [apt for apt in self.appointments if apt["vehicle_id"] == vehicle_id]
        return self.appointments
    
    def generate_maintenance_report(self, vehicle_id, tire_data, manual_data):
        """Generate comprehensive maintenance report"""
        analysis = self.analyze_tire_condition(vehicle_id, tire_data, manual_data)
        
        report = {
            "report_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "vehicle_analysis": analysis,
            "summary": {
                "total_recommendations": len(analysis["recommendations"]),
                "urgent_actions": len([r for r in analysis["recommendations"] if r["priority"] == "URGENT"]),
                "estimated_total_cost": self._calculate_total_cost(analysis["recommendations"]),
                "next_inspection_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
            }
        }
        
        return report
    
    def _calculate_total_cost(self, recommendations):
        """Calculate estimated total maintenance cost"""
        total = 0
        for rec in recommendations:
            cost_str = rec["estimated_cost"]
            if "$" in cost_str and "-" in cost_str:
                # Extract average cost from range like "$150-250"
                costs = cost_str.replace("$", "").split("-")
                if len(costs) == 2:
                    try:
                        avg_cost = (int(costs[0]) + int(costs[1])) / 2
                        total += avg_cost
                    except ValueError:
                        pass
        
        return f"${total:.0f}" if total > 0 else "Contact service center"

if __name__ == "__main__":
    # Test the maintenance agent
    agent = MaintenanceAgent()
    
    # Load test data
    tire_data = pd.read_csv("tire_wear_data.csv")
    manual_data = pd.read_csv("car_manual_specs.csv")
    
    # Analyze a vehicle
    vehicle_id = 1
    analysis = agent.analyze_tire_condition(vehicle_id, tire_data, manual_data)
    
    print("=== TIRE MAINTENANCE ANALYSIS ===")
    print(json.dumps(analysis, indent=2, default=str))