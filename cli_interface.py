#!/usr/bin/env python3

import pandas as pd
import json
import sys
import os
from datetime import datetime, timedelta
from maintenance_agent import MaintenanceAgent
from data_generator import VehicleDataGenerator
from tire_predictor import TirePredictor

class VehicleMaintenanceCLI:
    def __init__(self):
        self.tire_data = None
        self.motor_data = None
        self.combined_data = None
        self.manual_data = None
        self.load_data()
        self.agent = MaintenanceAgent()  # Initialize agent after data is loaded
    
    def load_data(self):
        """Load or generate vehicle maintenance data"""
        try:
            self.tire_data = pd.read_csv("tire_wear_data.csv")
            self.motor_data = pd.read_csv("motor_sensor_data.csv")
            self.manual_data = pd.read_csv("car_manual_specs.csv")
            print("✓ Data loaded successfully")
        except FileNotFoundError:
            print("⚠ Data files not found. Generating sample data...")
            self.generate_sample_data()
    
    def generate_sample_data(self):
        """Generate sample vehicle maintenance data"""
        generator = VehicleDataGenerator()
        
        print("Generating vehicle maintenance data...")
        self.tire_data = generator.generate_tire_dataset(num_vehicles=5, days_history=180)
        self.motor_data = generator.generate_motor_dataset(num_vehicles=5, days_history=180)
        self.manual_data = generator.generate_car_manual_data()
        
        # Save data
        self.tire_data.to_csv("tire_wear_data.csv", index=False)
        self.motor_data.to_csv("motor_sensor_data.csv", index=False)
        self.manual_data.to_csv("car_manual_specs.csv", index=False)
        
        print(f"✓ Generated data for {self.tire_data['vehicle_id'].nunique()} vehicles")
        
        # Train models
        print("Training prediction models...")
        tire_predictor = TirePredictor()
        tire_predictor.train_wear_prediction_model(self.tire_data)
        tire_predictor.train_anomaly_detection_model(self.tire_data)
        tire_predictor.save_models()
        
        # Motor models integrated into maintenance agent
        print("✓ Motor analysis integrated into maintenance agent")
        
        print("✓ Models trained and saved")
        
        # Reload the agent to use the new models
        self.agent = MaintenanceAgent()
    
    def display_menu(self):
        """Display main menu"""
        print("\n" + "="*70)
        print("🚗 VEHICLE MAINTENANCE SYSTEM - PoC")
        print("="*70)
        print("TIRE MANAGEMENT:")
        print("1. 📊 View Vehicle Fleet")
        print("2. 🔍 Analyze Vehicle Tires")
        print("3. 📈 View Tire Predictions")
        print("4. ⚠️  Detect Tire Anomalies")
        print("")
        print("MOTOR MANAGEMENT:")
        print("10. ⚙️  View Motor Health")
        print("11. 🔧 Analyze Engine Performance")
        print("12. 📈 Motor Failure Predictions")
        print("13. ⚠️  Detect Motor Anomalies")
        print("")
        print("UNIFIED OPERATIONS:")
        print("20. 📅 Schedule Appointment")
        print("21. 📋 View Appointments")
        print("22. 📄 Generate Report")
        print("23. 📊 Unified Fleet Dashboard")
        print("24. 🔄 Cross-System Analysis")
        print("")
        print("SYSTEM:")
        print("30. 🔧 Regenerate Data")
        print("0. 🚪 Exit")
        print("="*70)
    
    def view_fleet(self):
        """Display vehicle fleet information"""
        print("\n🚗 VEHICLE FLEET OVERVIEW")
        print("-" * 50)
        
        fleet_summary = self.tire_data.groupby(['vehicle_id', 'make', 'model', 'year']).agg({
            'tread_depth_mm': 'mean',
            'anomaly': 'sum',
            'maintenance_due': 'any'
        }).reset_index()
        
        fleet_summary['avg_tread_depth'] = fleet_summary['tread_depth_mm'].round(2)
        fleet_summary['status'] = fleet_summary.apply(self._get_vehicle_status, axis=1)
        
        for _, vehicle in fleet_summary.iterrows():
            status_icon = "🔴" if vehicle['maintenance_due'] else "🟡" if vehicle['anomaly'] > 0 else "🟢"
            print(f"{status_icon} Vehicle {vehicle['vehicle_id']:2d}: {vehicle['year']} {vehicle['make']} {vehicle['model']}")
            print(f"   Avg Tread Depth: {vehicle['avg_tread_depth']}mm | Anomalies: {vehicle['anomaly']} | Status: {vehicle['status']}")
    
    def _get_vehicle_status(self, row):
        """Determine vehicle status"""
        if row['maintenance_due']:
            return "MAINTENANCE REQUIRED"
        elif row['anomaly'] > 0:
            return "ATTENTION NEEDED"
        else:
            return "GOOD"
    
    def analyze_vehicle(self):
        """Analyze specific vehicle tires"""
        try:
            vehicle_id = int(input("\n🔍 Enter Vehicle ID to analyze: "))
            
            if vehicle_id not in self.tire_data['vehicle_id'].values:
                print(f"❌ Vehicle {vehicle_id} not found!")
                return
            
            print(f"\n🔍 ANALYZING VEHICLE {vehicle_id}...")
            print("-" * 40)
            
            analysis = self.agent.analyze_tire_condition(vehicle_id, self.tire_data, self.manual_data)
            
            if "error" in analysis:
                print(f"❌ Error: {analysis['error']}")
                return
            
            # Display vehicle info
            info = analysis['vehicle_info']
            print(f"🚗 {info['year']} {info['make']} {info['model']}")
            print(f"   Tire Size: {info['tire_size']} | Brand: {info['tire_brand']}")
            
            # Display current condition
            print(f"\n📊 CURRENT TIRE CONDITION:")
            for position, condition in analysis['current_condition'].items():
                status_icon = "🔴" if "CRITICAL" in condition['status'] else "🟡" if "WARNING" in condition['status'] else "🟢"
                print(f"{status_icon} {position.replace('_', ' ').title()}: {condition['tread_depth_mm']}mm ({condition['wear_percentage']:.1f}% worn)")
                print(f"   Pressure: {condition['pressure_psi']} PSI | Status: {condition['status']}")
            
            # Display predictions
            if 'error' not in analysis['predictions']:
                print(f"\n📈 PREDICTIONS (Next 90 days):")
                for position, pred in analysis['predictions'].items():
                    if pred['days_until_maintenance']:
                        print(f"⚠️  {position.replace('_', ' ').title()}: Maintenance needed in {pred['days_until_maintenance']} days")
                    elif pred['days_until_replacement']:
                        print(f"🔄 {position.replace('_', ' ').title()}: Replacement recommended in {pred['days_until_replacement']} days")
            
            # Display anomalies
            if analysis['anomalies']:
                print(f"\n⚠️  ANOMALIES DETECTED:")
                for anomaly in analysis['anomalies']:
                    severity_icon = "🔴" if anomaly['severity'] == 'high' else "🟡"
                    print(f"{severity_icon} {anomaly['position'].replace('_', ' ').title()}: {anomaly['anomaly_type']} ({anomaly['date']})")
            
            # Display recommendations
            print(f"\n💡 RECOMMENDATIONS:")
            for rec in analysis['recommendations']:
                priority_icon = "🚨" if rec['priority'] == 'URGENT' else "⚠️" if rec['priority'] == 'HIGH' else "ℹ️"
                print(f"{priority_icon} {rec['action']} - {rec['estimated_cost']}")
                print(f"   Reason: {rec['reason']}")
            
        except ValueError:
            print("❌ Please enter a valid vehicle ID number")
        except Exception as e:
            print(f"❌ Error analyzing vehicle: {str(e)}")
    
    def view_predictions(self):
        """View tire wear predictions"""
        try:
            # Check if models are available
            if self.agent.predictor.wear_model is None:
                print("❌ Prediction models not available. Training models now...")
                self.train_models_if_needed()
                if self.agent.predictor.wear_model is None:
                    print("❌ Failed to train models. Please try regenerating data.")
                    return
            
            vehicle_id = int(input("\n📈 Enter Vehicle ID for predictions: "))
            
            if vehicle_id not in self.tire_data['vehicle_id'].values:
                print(f"❌ Vehicle {vehicle_id} not found!")
                return
            
            vehicle_data = self.tire_data[self.tire_data['vehicle_id'] == vehicle_id]
            
            print(f"\n📈 TIRE WEAR PREDICTIONS - VEHICLE {vehicle_id}")
            print("-" * 50)
            
            try:
                predictions = self.agent.predictor.predict_future_wear(vehicle_data, days_ahead=60)
                
                if predictions.empty:
                    print("No predictions available")
                    return
                
                for position in predictions['position'].unique():
                    pos_data = predictions[predictions['position'] == position]
                    print(f"\n🔧 {position.replace('_', ' ').title()}:")
                    
                    for _, pred in pos_data.head(10).iterrows():  # Show first 10 days
                        status = "🔴 REPLACE" if pred['maintenance_needed'] else "🟡 MONITOR" if pred['replacement_recommended'] else "🟢 GOOD"
                        print(f"   Day {pred['days_ahead']:2d}: {pred['predicted_tread_depth']:.2f}mm {status}")
                        
            except Exception as e:
                print(f"❌ Error generating predictions: {str(e)}")
                
        except ValueError:
            print("❌ Please enter a valid vehicle ID number")
    
    def train_models_if_needed(self):
        """Train models if they're not available"""
        try:
            print("🔄 Training prediction models...")
            predictor = TirePredictor()
            predictor.train_wear_prediction_model(self.tire_data)
            predictor.train_anomaly_detection_model(self.tire_data)
            predictor.save_models()
            
            # Reload the agent with new models
            self.agent = MaintenanceAgent()
            print("✅ Models trained successfully!")
            
        except Exception as e:
            print(f"❌ Error training models: {str(e)}")
    
    def detect_anomalies(self):
        """Detect and display anomalies"""
        print("\n⚠️  ANOMALY DETECTION RESULTS")
        print("-" * 40)
        
        try:
            # Check if models are available
            if self.agent.predictor.anomaly_model is None:
                print("❌ Anomaly detection models not available. Training models now...")
                self.train_models_if_needed()
                if self.agent.predictor.anomaly_model is None:
                    print("❌ Failed to train models. Please try regenerating data.")
                    return
            
            anomalies = self.agent.predictor.detect_anomalies(self.tire_data)
            
            if anomalies.empty:
                print("✅ No anomalies detected in the fleet")
                return
            
            # Group by vehicle
            for vehicle_id in anomalies['vehicle_id'].unique():
                vehicle_anomalies = anomalies[anomalies['vehicle_id'] == vehicle_id]
                print(f"\n🚗 Vehicle {vehicle_id}:")
                
                for _, anomaly in vehicle_anomalies.iterrows():
                    severity = "🔴 HIGH" if anomaly['anomaly_score'] < -0.5 else "🟡 MEDIUM"
                    print(f"   {severity} | {anomaly['position'].replace('_', ' ').title()} | {anomaly['date']}")
                    print(f"   Tread: {anomaly['tread_depth_mm']}mm | Pressure: {anomaly['pressure_psi']} PSI")
                    if 'anomaly_type' in anomaly and anomaly['anomaly_type'] != 'normal':
                        print(f"   Type: {anomaly['anomaly_type']}")
                        
        except Exception as e:
            print(f"❌ Error detecting anomalies: {str(e)}")
    
    # MOTOR MANAGEMENT METHODS
    def view_motor_health(self):
        """Display motor health overview for all vehicles"""
        print("\n⚙️  MOTOR HEALTH OVERVIEW")
        print("-" * 50)
        
        if self.motor_data is None:
            print("❌ Motor data not available")
            return
        
        # Get latest readings for each vehicle
        latest_motor = self.motor_data.groupby('vehicle_id').last().reset_index()
        
        for _, vehicle in latest_motor.iterrows():
            # Determine status based on performance and failure risk
            if vehicle['failure_risk'] >= 2:
                status_icon = "🔴"
                status = "CRITICAL"
            elif vehicle['failure_risk'] == 1 or vehicle['performance_score'] < 70:
                status_icon = "🟡"
                status = "WARNING"
            else:
                status_icon = "🟢"
                status = "GOOD"
            
            print(f"{status_icon} Vehicle {vehicle['vehicle_id']:2d}: {vehicle['year']} {vehicle['make']} {vehicle['model']}")
            print(f"   Performance: {vehicle['performance_score']:.1f}% | Engine Temp: {vehicle['engine_temp_c']:.1f}°C")
            print(f"   Oil Pressure: {vehicle['oil_pressure_psi']:.1f} PSI | Status: {status}")
            if vehicle['motor_anomaly']:
                print(f"   ⚠️  Anomaly: {vehicle['anomaly_type']}")
    
    def analyze_engine_performance(self):
        """Analyze specific vehicle engine performance"""
        try:
            vehicle_id = int(input("\n🔧 Enter Vehicle ID to analyze: "))
            
            if self.motor_data is None or vehicle_id not in self.motor_data['vehicle_id'].values:
                print(f"❌ Vehicle {vehicle_id} motor data not found!")
                return
            
            vehicle_motor_data = self.motor_data[self.motor_data['vehicle_id'] == vehicle_id]
            latest = vehicle_motor_data.iloc[-1]
            
            print(f"\n🔧 ENGINE PERFORMANCE ANALYSIS - VEHICLE {vehicle_id}")
            print("-" * 50)
            
            # Vehicle info
            print(f"🚗 {latest['year']} {latest['make']} {latest['model']}")
            print(f"   Engine: {latest['engine_type']} | Fuel: {latest['fuel_type']}")
            
            # Current performance metrics
            print(f"\n📊 CURRENT PERFORMANCE:")
            perf_icon = "🔴" if latest['performance_score'] < 60 else "🟡" if latest['performance_score'] < 80 else "🟢"
            print(f"{perf_icon} Overall Performance: {latest['performance_score']:.1f}%")
            
            temp_icon = "🔴" if latest['engine_temp_c'] > 105 else "🟡" if latest['engine_temp_c'] > 95 else "🟢"
            print(f"{temp_icon} Engine Temperature: {latest['engine_temp_c']:.1f}°C")
            
            oil_icon = "🔴" if latest['oil_pressure_psi'] < 15 else "🟡" if latest['oil_pressure_psi'] < 20 else "🟢"
            print(f"{oil_icon} Oil Pressure: {latest['oil_pressure_psi']:.1f} PSI")
            
            vib_icon = "🔴" if latest['vibration_level'] > 4 else "🟡" if latest['vibration_level'] > 2.5 else "🟢"
            print(f"{vib_icon} Vibration Level: {latest['vibration_level']:.2f}")
            
            print(f"⛽ Fuel Consumption: {latest['fuel_consumption_l100km']:.2f} L/100km")
            print(f"🔄 Average RPM: {latest['rpm_avg']:.0f}")
            
            # Failure risk assessment
            risk_levels = ["🟢 LOW", "🟡 MEDIUM", "🔴 HIGH"]
            print(f"\n⚠️  FAILURE RISK: {risk_levels[int(latest['failure_risk'])]}")
            
            # Recent anomalies
            recent_anomalies = vehicle_motor_data[vehicle_motor_data['motor_anomaly'] == True].tail(5)
            if not recent_anomalies.empty:
                print(f"\n⚠️  RECENT ANOMALIES:")
                for _, anomaly in recent_anomalies.iterrows():
                    print(f"   📅 {anomaly['date']}: {anomaly['anomaly_type']}")
            
            # Performance trend (last 30 days)
            recent_data = vehicle_motor_data.tail(30)
            if len(recent_data) > 1:
                perf_trend = recent_data['performance_score'].iloc[-1] - recent_data['performance_score'].iloc[0]
                trend_icon = "📈" if perf_trend > 0 else "📉" if perf_trend < -2 else "➡️"
                print(f"\n📊 30-DAY TREND: {trend_icon} Performance change: {perf_trend:+.1f}%")
            
        except ValueError:
            print("❌ Please enter a valid vehicle ID number")
        except Exception as e:
            print(f"❌ Error analyzing engine performance: {str(e)}")
    
    def motor_failure_predictions(self):
        """View motor failure predictions"""
        try:
            vehicle_id = int(input("\n📈 Enter Vehicle ID for motor predictions: "))
            
            if self.motor_data is None or vehicle_id not in self.motor_data['vehicle_id'].values:
                print(f"❌ Vehicle {vehicle_id} motor data not found!")
                return
            
            # Load motor predictor
            vehicle_data = self.motor_data[self.motor_data['vehicle_id'] == vehicle_id]
            
            print(f"\n📈 MOTOR PERFORMANCE ANALYSIS - VEHICLE {vehicle_id}")
            print("-" * 50)
            
            try:
                # Get latest motor data
                latest_data = vehicle_data.iloc[-1]
                
                # Basic motor health assessment
                temp = latest_data['engine_temp_c']
                oil_pressure = latest_data['oil_pressure_psi']
                performance = latest_data['performance_score']
                vibration = latest_data['vibration_level']
                
                print(f"Current Status:")
                print(f"  Engine Temperature: {temp:.1f}°C")
                print(f"  Oil Pressure: {oil_pressure:.1f} PSI")
                print(f"  Performance Score: {performance:.1f}%")
                print(f"  Vibration Level: {vibration:.2f} g RMS")
                
                # Determine status
                if temp > 105 or oil_pressure < 15 or performance < 70:
                    status = "🔴 CRITICAL"
                    days_remaining = 7
                elif temp > 95 or oil_pressure < 20 or performance < 85:
                    status = "🟡 WARNING"
                    days_remaining = 60
                else:
                    status = "🟢 GOOD"
                    days_remaining = 180
                
                print(f"\nMotor Status: {status}")
                print(f"Estimated maintenance needed in: {days_remaining} days")
                
                # Show recommendations
                if status == "🔴 CRITICAL":
                    print("\n⚠️  IMMEDIATE ACTION REQUIRED:")
                    print("  - Stop driving if temperature > 105°C")
                    print("  - Check oil system if pressure < 15 PSI")
                    print("  - Schedule emergency service")
                elif status == "🟡 WARNING":
                    print("\n🔧 MAINTENANCE RECOMMENDED:")
                    print("  - Monitor engine parameters daily")
                    print("  - Schedule service within 2 months")
                    print("  - Check cooling and oil systems")
                else:
                    print("\n✅ MOTOR RUNNING WELL:")
                    print("  - Continue regular maintenance schedule")
                    print("  - Monitor monthly")
                    
            except Exception as e:
                print(f"❌ Error analyzing motor data: {e}")
                
        except ValueError:
            print("❌ Please enter a valid vehicle ID number")
    
    def detect_motor_anomalies(self):
        """Detect and display motor anomalies"""
        print("\n⚠️  MOTOR ANOMALY DETECTION RESULTS")
        print("-" * 40)
        
        if self.motor_data is None:
            print("❌ Motor data not available")
            return
        
        try:
            # Find motor anomalies from CSV data
            anomalies = self.motor_data[self.motor_data['motor_anomaly'] == True]
            
            if anomalies.empty:
                print("✅ No motor anomalies detected in the fleet")
                return
            
            # Group by vehicle
            for vehicle_id in anomalies['vehicle_id'].unique():
                vehicle_anomalies = anomalies[anomalies['vehicle_id'] == vehicle_id]
                print(f"\n🚗 Vehicle {vehicle_id}:")
                
                for _, anomaly in vehicle_anomalies.iterrows():
                    severity = "🔴 HIGH" if anomaly['failure_risk'] >= 2 else "🟡 MEDIUM"
                    print(f"   {severity} | {anomaly['date']}")
                    print(f"   Temp: {anomaly['engine_temp_c']:.1f}°C | Oil: {anomaly['oil_pressure_psi']:.1f} PSI")
                    print(f"   Performance: {anomaly['performance_score']:.1f}% | Vibration: {anomaly['vibration_level']:.2f}")
                    if anomaly['anomaly_type'] != 'normal':
                        print(f"   Type: {anomaly['anomaly_type']}")
                        
        except Exception as e:
            print(f"❌ Error detecting motor anomalies: {str(e)}")
    
    def schedule_appointment(self):
        """Schedule maintenance appointment"""
        try:
            vehicle_id = int(input("\n📅 Enter Vehicle ID for appointment: "))
            
            if vehicle_id not in self.tire_data['vehicle_id'].values:
                print(f"❌ Vehicle {vehicle_id} not found!")
                return
            
            print("\nService Types:")
            print("1. Tire Replacement")
            print("2. Tire Rotation")
            print("3. Pressure Check")
            print("4. Alignment Check")
            print("5. General Inspection")
            
            service_choice = input("Select service type (1-5): ")
            service_types = {
                "1": "Tire Replacement",
                "2": "Tire Rotation", 
                "3": "Pressure Check",
                "4": "Alignment Check",
                "5": "General Inspection"
            }
            
            service_type = service_types.get(service_choice, "General Inspection")
            
            preferred_date = input("Preferred date (YYYY-MM-DD) or press Enter for next week: ").strip()
            if not preferred_date:
                preferred_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
            
            notes = input("Additional notes (optional): ").strip()
            
            appointment = self.agent.schedule_appointment(vehicle_id, service_type, preferred_date, notes)
            
            print(f"\n✅ APPOINTMENT SCHEDULED")
            print(f"   ID: {appointment['appointment_id']}")
            print(f"   Vehicle: {vehicle_id}")
            print(f"   Service: {service_type}")
            print(f"   Date: {preferred_date}")
            print(f"   Status: {appointment['status']}")
            
        except ValueError:
            print("❌ Please enter a valid vehicle ID number")
        except Exception as e:
            print(f"❌ Error scheduling appointment: {str(e)}")
    
    def view_appointments(self):
        """View scheduled appointments"""
        appointments = self.agent.get_appointments()
        
        if not appointments:
            print("\n📅 No appointments scheduled")
            return
        
        print(f"\n📅 SCHEDULED APPOINTMENTS ({len(appointments)} total)")
        print("-" * 60)
        
        for apt in appointments:
            status_icon = "✅" if apt['status'] == 'completed' else "📅" if apt['status'] == 'scheduled' else "⏳"
            print(f"{status_icon} ID: {apt['appointment_id']} | Vehicle: {apt['vehicle_id']} | {apt['service_type']}")
            print(f"   Date: {apt['scheduled_date']} | Status: {apt['status']}")
            if apt['notes']:
                print(f"   Notes: {apt['notes']}")
            print()
    
    def generate_report(self):
        """Generate maintenance report"""
        try:
            vehicle_id = int(input("\n📄 Enter Vehicle ID for report: "))
            
            if vehicle_id not in self.tire_data['vehicle_id'].values:
                print(f"❌ Vehicle {vehicle_id} not found!")
                return
            
            print(f"\n📄 GENERATING MAINTENANCE REPORT...")
            
            report = self.agent.generate_maintenance_report(vehicle_id, self.tire_data, self.manual_data)
            
            print(f"\n📄 MAINTENANCE REPORT - VEHICLE {vehicle_id}")
            print("=" * 60)
            print(f"Report Date: {report['report_date']}")
            
            # Vehicle info
            info = report['vehicle_analysis']['vehicle_info']
            print(f"\n🚗 Vehicle: {info['year']} {info['make']} {info['model']}")
            print(f"Tire Size: {info['tire_size']} | Brand: {info['tire_brand']}")
            
            # Summary
            summary = report['summary']
            print(f"\n📊 SUMMARY:")
            print(f"   Total Recommendations: {summary['total_recommendations']}")
            print(f"   Urgent Actions: {summary['urgent_actions']}")
            print(f"   Estimated Cost: {summary['estimated_total_cost']}")
            print(f"   Next Inspection: {summary['next_inspection_date']}")
            
            # Save report
            filename = f"maintenance_report_vehicle_{vehicle_id}_{datetime.now().strftime('%Y%m%d')}.json"
            with open(filename, 'w') as f:
                json.dump(report, f, indent=2, default=str)
            
            print(f"\n💾 Report saved to: {filename}")
            
        except ValueError:
            print("❌ Please enter a valid vehicle ID number")
        except Exception as e:
            print(f"❌ Error generating report: {str(e)}")
    
    def fleet_dashboard(self):
        """Display fleet dashboard"""
        print(f"\n📊 FLEET DASHBOARD")
        print("=" * 50)
        
        # Fleet statistics
        total_vehicles = self.tire_data['vehicle_id'].nunique()
        total_tires = len(self.tire_data.groupby(['vehicle_id', 'position']).last())
        
        # Current status
        latest_data = self.tire_data.groupby(['vehicle_id', 'position']).last().reset_index()
        critical_tires = len(latest_data[latest_data['tread_depth_mm'] < 2.0])
        warning_tires = len(latest_data[(latest_data['tread_depth_mm'] >= 2.0) & (latest_data['tread_depth_mm'] < 4.0)])
        good_tires = total_tires - critical_tires - warning_tires
        
        # Anomalies
        total_anomalies = self.tire_data['anomaly'].sum()
        
        print(f"🚗 Total Vehicles: {total_vehicles}")
        print(f"🔧 Total Tires: {total_tires}")
        print(f"🔴 Critical Tires: {critical_tires}")
        print(f"🟡 Warning Tires: {warning_tires}")
        print(f"🟢 Good Tires: {good_tires}")
        print(f"⚠️  Total Anomalies: {total_anomalies}")
        
        # Maintenance priority
        vehicles_needing_urgent = len(latest_data[latest_data['maintenance_due'] == True]['vehicle_id'].unique())
        print(f"🚨 Vehicles Needing Urgent Maintenance: {vehicles_needing_urgent}")
        
        # Appointments
        appointments = self.agent.get_appointments()
        scheduled_appointments = len([a for a in appointments if a['status'] == 'scheduled'])
        print(f"📅 Scheduled Appointments: {scheduled_appointments}")
        
        # Motor statistics
        if self.motor_data is not None:
            latest_motor = self.motor_data.groupby('vehicle_id').last().reset_index()
            critical_motors = len(latest_motor[latest_motor['failure_risk'] >= 2])
            warning_motors = len(latest_motor[latest_motor['failure_risk'] == 1])
            good_motors = len(latest_motor) - critical_motors - warning_motors
            motor_anomalies = self.motor_data['motor_anomaly'].sum()
            
            print(f"\n⚙️  MOTOR HEALTH:")
            print(f"🔴 Critical Motors: {critical_motors}")
            print(f"🟡 Warning Motors: {warning_motors}")
            print(f"🟢 Good Motors: {good_motors}")
            print(f"⚠️  Motor Anomalies: {motor_anomalies}")
    
    def cross_system_analysis(self):
        """Analyze correlations between tire and motor systems"""
        print("\n🔄 CROSS-SYSTEM CORRELATION ANALYSIS")
        print("-" * 50)
        
        if self.combined_data is None:
            print("❌ Combined data not available")
            return
        
        try:
            # Analyze correlations
            latest_data = self.combined_data.groupby('vehicle_id').last().reset_index()
            
            print("🔍 SYSTEM CORRELATIONS:")
            
            # Vehicles with both tire and motor issues
            critical_both = latest_data[
                (latest_data['maintenance_due_tire'] == True) & 
                (latest_data['failure_risk'] >= 2)
            ]
            
            if not critical_both.empty:
                print(f"\n🚨 VEHICLES WITH BOTH TIRE & MOTOR ISSUES ({len(critical_both)}):")
                for _, vehicle in critical_both.iterrows():
                    print(f"   Vehicle {vehicle['vehicle_id']}: {vehicle['year']} {vehicle['make']} {vehicle['model']}")
                    print(f"   Tire: Avg {vehicle[['tread_depth_mm']].mean():.1f}mm | Motor: {vehicle['performance_score']:.1f}%")
            
            # Performance correlation insights
            print(f"\n📊 INSIGHTS:")
            
            # Vehicles with good tires but poor motor performance
            good_tires_bad_motor = latest_data[
                (latest_data['maintenance_due_tire'] == False) & 
                (latest_data['performance_score'] < 70)
            ]
            if not good_tires_bad_motor.empty:
                print(f"   🔧 {len(good_tires_bad_motor)} vehicles have good tires but poor motor performance")
            
            # Vehicles with worn tires and good motor
            bad_tires_good_motor = latest_data[
                (latest_data['maintenance_due_tire'] == True) & 
                (latest_data['performance_score'] > 80)
            ]
            if not bad_tires_good_motor.empty:
                print(f"   🛞 {len(bad_tires_good_motor)} vehicles have worn tires but good motor performance")
            
            # Driving pattern analysis
            pattern_analysis = latest_data.groupby('driving_pattern').agg({
                'performance_score': 'mean',
                'tread_depth_mm': 'mean',
                'fuel_consumption_l100km': 'mean'
            }).round(2)
            
            print(f"\n🚗 DRIVING PATTERN IMPACT:")
            for pattern, data in pattern_analysis.iterrows():
                print(f"   {pattern.title()}: Motor {data['performance_score']:.1f}% | Tires {data['tread_depth_mm']:.1f}mm | Fuel {data['fuel_consumption_l100km']:.1f}L/100km")
            
        except Exception as e:
            print(f"❌ Error in cross-system analysis: {str(e)}")
    
    def regenerate_data(self):
        """Regenerate sample data"""
        confirm = input("\n⚠️  This will regenerate all data. Continue? (y/N): ").lower()
        if confirm == 'y':
            print("🔄 Regenerating data...")
            self.generate_sample_data()
            self.load_data()
            print("✅ Data regenerated successfully!")
    
    def run(self):
        """Main CLI loop"""
        print("🚗 Welcome to Vehicle Maintenance System PoC!")
        
        while True:
            try:
                self.display_menu()
                choice = input("\n👉 Select option: ").strip()
                
                if choice == "0":
                    print("\n👋 Thank you for using Vehicle Maintenance System!")
                    break
                # Tire Management (1-4)
                elif choice == "1":
                    self.view_fleet()
                elif choice == "2":
                    self.analyze_vehicle()
                elif choice == "3":
                    self.view_predictions()
                elif choice == "4":
                    self.detect_anomalies()
                # Motor Management (10-13)
                elif choice == "10":
                    self.view_motor_health()
                elif choice == "11":
                    self.analyze_engine_performance()
                elif choice == "12":
                    self.motor_failure_predictions()
                elif choice == "13":
                    self.detect_motor_anomalies()
                # Unified Operations (20-24)
                elif choice == "20":
                    self.schedule_appointment()
                elif choice == "21":
                    self.view_appointments()
                elif choice == "22":
                    self.generate_report()
                elif choice == "23":
                    self.fleet_dashboard()
                elif choice == "24":
                    self.cross_system_analysis()
                # System (30)
                elif choice == "30":
                    self.regenerate_data()
                else:
                    print("❌ Invalid option. Please select a valid menu number.")
                
                input("\n📱 Press Enter to continue...")
                
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"\n❌ Unexpected error: {str(e)}")
                input("📱 Press Enter to continue...")

def main():
    """Main entry point for the CLI application"""
    cli = VehicleMaintenanceCLI()
    cli.run()

# Maintain backward compatibility
TireMaintenanceCLI = VehicleMaintenanceCLI

if __name__ == "__main__":
    main()