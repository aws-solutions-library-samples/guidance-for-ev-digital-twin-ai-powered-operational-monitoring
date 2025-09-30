from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import json
import os
from maintenance_agent import MaintenanceAgent
from tire_predictor import TirePredictor

app = Flask(__name__)
CORS(app)

# Initialize components
maintenance_agent = MaintenanceAgent()
tire_predictor = TirePredictor()

# Load data
try:
    tire_data = pd.read_csv("tire_wear_data.csv")
    manual_data = pd.read_csv("car_manual_specs.csv")
    motor_data = pd.read_csv("motor_sensor_data.csv") if os.path.exists("motor_sensor_data.csv") else pd.DataFrame()
    vehicle_data = pd.read_csv("vehicle_maintenance_data.csv") if os.path.exists("vehicle_maintenance_data.csv") else pd.DataFrame()
    print("✅ Data files loaded successfully")
except Exception as e:
    print(f"⚠️ Warning: Could not load some data files - {e}")
    tire_data = pd.DataFrame()
    manual_data = pd.DataFrame()
    motor_data = pd.DataFrame()
    vehicle_data = pd.DataFrame()

@app.route('/')
def root():
    """Root endpoint - API info"""
    return jsonify({
        "service": "ev-digital-twin-backend",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "vehicles": "/api/vehicles",
            "vehicle_analysis": "/api/vehicles/{id}/analysis",
            "tire_data": "/api/vehicles/{id}/tires",
            "motor_data": "/api/vehicles/{id}/motor",
            "battery_data": "/api/vehicles/{id}/battery",
            "maintenance": "/api/vehicles/{id}/maintenance",
            "appointments": "/api/appointments"
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for ECS"""
    try:
        print("Health check requested")
        return jsonify({
            "status": "healthy",
            "service": "ev-digital-twin-backend",
            "version": "1.0.0",
            "timestamp": str(pd.Timestamp.now())
        }), 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    """Get list of all vehicles"""
    try:
        if tire_data.empty:
            return jsonify({"error": "No vehicle data available"}), 404
        
        vehicles = tire_data.groupby('vehicle_id').agg({
            'make': 'first',
            'model': 'first',
            'year': 'first',
            'tire_brand': 'first',
            'tire_size': 'first'
        }).reset_index()
        
        vehicle_list = []
        for _, vehicle in vehicles.iterrows():
            vehicle_list.append({
                "id": int(vehicle['vehicle_id']),
                "make": vehicle['make'],
                "model": vehicle['model'],
                "year": int(vehicle['year']),
                "tire_brand": vehicle['tire_brand'],
                "tire_size": vehicle['tire_size']
            })
        
        return jsonify({"vehicles": vehicle_list})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>/analysis', methods=['GET'])
def get_vehicle_analysis(vehicle_id):
    """Get comprehensive vehicle analysis"""
    try:
        if tire_data.empty or manual_data.empty:
            return jsonify({"error": "Required data not available"}), 404
        
        analysis = maintenance_agent.analyze_tire_condition(vehicle_id, tire_data, manual_data)
        return jsonify(analysis)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>/tires', methods=['GET'])
def get_tire_data(vehicle_id):
    """Get tire-specific data for a vehicle"""
    try:
        if tire_data.empty:
            return jsonify({"error": "No tire data available"}), 404
        
        vehicle_tires = tire_data[tire_data['vehicle_id'] == vehicle_id]
        if vehicle_tires.empty:
            return jsonify({"error": f"No data found for vehicle {vehicle_id}"}), 404
        
        # Get latest readings for each tire position
        latest_tires = vehicle_tires.groupby('position').last().reset_index()
        
        tire_info = []
        for _, tire in latest_tires.iterrows():
            tire_info.append({
                "position": tire['position'],
                "tread_depth_mm": float(tire['tread_depth_mm']),
                "pressure_psi": float(tire['pressure_psi']),
                "temperature_c": float(tire['temperature_c']),
                "last_updated": tire['date']
            })
        
        return jsonify({"tires": tire_info})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>/motor', methods=['GET'])
def get_motor_data(vehicle_id):
    """Get motor data for a vehicle"""
    try:
        if motor_data.empty:
            # Return mock data if no motor data file
            return jsonify({
                "motor_data": {
                    "rpm": 2500,
                    "torque_nm": 350,
                    "temperature_c": 65,
                    "efficiency_percent": 94,
                    "vibration_level": 0.2,
                    "status": "normal"
                }
            })
        
        vehicle_motor = motor_data[motor_data['vehicle_id'] == vehicle_id]
        if vehicle_motor.empty:
            return jsonify({"error": f"No motor data found for vehicle {vehicle_id}"}), 404
        
        latest_motor = vehicle_motor.iloc[-1]
        return jsonify({
            "motor_data": {
                "rpm": float(latest_motor.get('rpm', 2500)),
                "torque_nm": float(latest_motor.get('torque_nm', 350)),
                "temperature_c": float(latest_motor.get('temperature_c', 65)),
                "efficiency_percent": float(latest_motor.get('efficiency_percent', 94)),
                "vibration_level": float(latest_motor.get('vibration_level', 0.2)),
                "status": latest_motor.get('status', 'normal')
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>/battery', methods=['GET'])
def get_battery_data(vehicle_id):
    """Get battery data for a vehicle"""
    try:
        # Return mock battery data
        return jsonify({
            "battery_data": {
                "state_of_charge": 75,
                "state_of_health": 92,
                "temperature_c": 32,
                "voltage": 400,
                "current_a": 53,
                "cycle_count": 360,
                "charging": True,
                "cell_balancing": True,
                "cooling_active": False,
                "heating_active": True
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>/maintenance', methods=['GET'])
def get_maintenance_report(vehicle_id):
    """Get maintenance report for a vehicle"""
    try:
        if tire_data.empty or manual_data.empty:
            return jsonify({"error": "Required data not available"}), 404
        
        report = maintenance_agent.generate_maintenance_report(vehicle_id, tire_data, manual_data)
        return jsonify(report)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/appointments', methods=['GET', 'POST'])
def handle_appointments():
    """Handle appointment scheduling"""
    try:
        if request.method == 'GET':
            vehicle_id = request.args.get('vehicle_id')
            appointments = maintenance_agent.get_appointments(
                int(vehicle_id) if vehicle_id else None
            )
            return jsonify({"appointments": appointments})
        
        elif request.method == 'POST':
            data = request.get_json()
            appointment = maintenance_agent.schedule_appointment(
                vehicle_id=data['vehicle_id'],
                service_type=data['service_type'],
                preferred_date=data.get('preferred_date'),
                notes=data.get('notes', '')
            )
            return jsonify({"appointment": appointment}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/data/ml_results.json', methods=['GET'])
def get_ml_results():
    """Serve ML results for frontend"""
    try:
        # Generate mock ML results if file doesn't exist
        mock_results = [
            {
                "vehicle_id": 1,
                "predictions": {
                    "days_until_replacement": 45,
                    "wear_rate": 0.02,
                    "anomaly_score": 0.1
                }
            },
            {
                "vehicle_id": 2,
                "predictions": {
                    "days_until_replacement": 120,
                    "wear_rate": 0.015,
                    "anomaly_score": 0.05
                }
            }
        ]
        return jsonify(mock_results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/data/motor_ml_results.json', methods=['GET'])
def get_motor_ml_results():
    """Serve motor ML results for frontend"""
    try:
        mock_results = [
            {
                "vehicle_id": 1,
                "motor_predictions": {
                    "efficiency_trend": "declining",
                    "maintenance_needed_days": 30,
                    "risk_level": "medium"
                }
            }
        ]
        return jsonify(mock_results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"Starting Flask app on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)