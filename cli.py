#!/usr/bin/env python3
"""
Interactive CLI Interface for EV Digital Twin Maintenance System
Recreates the original interactive menu-driven experience
"""

import pandas as pd
import json
import sys
import os
from datetime import datetime, timedelta
from tire_predictor import TirePredictor

class VehicleMaintenanceCLI:
    def __init__(self):
        self.tire_data = None
        self.motor_data = None
        self.manual_data = None
        self.predictor = TirePredictor()
        self.load_data()
    
    def load_data(self):
        """Load vehicle maintenance data"""
        try:
            self.tire_data = pd.read_csv("tire_wear_data.csv")
            self.motor_data = pd.read_csv("motor_sensor_data.csv")
            self.manual_data = pd.read_csv("car_manual_specs.csv")
            print("✓ Data loaded successfully")
            print(f"  - {len(self.tire_data)} tire records")
            print(f"  - {len(self.motor_data)} motor records")
            print(f"  - {len(self.manual_data)} vehicle specifications")
        except FileNotFoundError as e:
            print(f"❌ Data files not found: {e}")
            print("Please ensure tire_wear_data.csv, motor_sensor_data.csv, and car_manual_specs.csv exist")
            sys.exit(1)
    
    def display_menu(self):
        """Display main menu"""
        print("\n" + "="*70)
        print("🚗 VEHICLE MAINTENANCE SYSTEM - CLI Interface")
        print("="*70)
        print("📊 TIRE MANAGEMENT")
        print("   1. View Fleet Tire Status")
        print("   2. Analyze Vehicle Tires")
        print("   3. Tire Wear Predictions")
        print("   4. Detect Tire Anomalies")
        print("")
        print("⚙️  MOTOR MANAGEMENT")
        print("   5. View Motor Health Overview")
        print("   6. Analyze Vehicle Motor")
        print("   7. Motor Performance Predictions")
        print("")
        print("📋 MAINTENANCE & REPORTS")
        print("   8. Schedule Maintenance")
        print("   9. Generate Vehicle Report")
        print("   10. Fleet Summary")
        print("")
        print("🔧 SYSTEM")
        print("   11. List All Vehicles")
        print("   12. System Status")
        print("   0. Exit")
        print("="*70)
    
    def view_fleet_tire_status(self):
        """Display tire status for all vehicles"""
        print("\n🛞 FLEET TIRE STATUS")
        print("-" * 50)
        
        vehicles = self.tire_data['vehicle_id'].unique()
        
        for vehicle_id in sorted(vehicles):
            vehicle_tires = self.tire_data[self.tire_data['vehicle_id'] == vehicle_id]
            latest_tires = vehicle_tires.groupby('position').last().reset_index()
            
            # Get vehicle info
            vehicle_info = latest_tires.iloc[0]
            print(f"\n🚗 Vehicle {vehicle_id}: {vehicle_info['year']} {vehicle_info['make']} {vehicle_info['model']}")
            
            issues = []
            for _, tire in latest_tires.iterrows():
                if tire['pressure_psi'] < 30.0:
                    issues.append(f"{tire['position']} pressure low ({tire['pressure_psi']:.1f} PSI)")
                if tire['tread_depth_mm'] < 4.0:
                    issues.append(f"{tire['position']} tread critical ({tire['tread_depth_mm']:.1f}mm)")
            
            if issues:
                print("   ⚠️  Issues found:")
                for issue in issues:
                    print(f"      - {issue}")
            else:
                print("   ✅ All tires OK")
    
    def analyze_vehicle_tires(self):
        """Analyze specific vehicle tires"""
        try:
            vehicle_id = int(input("\n🔍 Enter Vehicle ID to analyze: "))
            
            if vehicle_id not in self.tire_data['vehicle_id'].values:
                print(f"❌ Vehicle {vehicle_id} not found")
                return
            
            vehicle_tires = self.tire_data[self.tire_data['vehicle_id'] == vehicle_id]
            latest_tires = vehicle_tires.groupby('position').last().reset_index()
            
            # Vehicle info
            vehicle_info = latest_tires.iloc[0]
            print(f"\n🚗 Vehicle {vehicle_id}: {vehicle_info['year']} {vehicle_info['make']} {vehicle_info['model']}")
            print(f"Tire Size: {vehicle_info['tire_size']} ({vehicle_info['tire_brand']})")
            
            print(f"\n🛞 TIRE ANALYSIS")
            print("-" * 40)
            
            recommendations = []
            
            for _, tire in latest_tires.iterrows():
                position = tire['position']
                tread_depth = tire['tread_depth_mm']
                pressure = tire['pressure_psi']
                temp = tire['temperature_c']
                
                # Status indicators
                pressure_status = "🔴" if pressure < 28 else "🟡" if pressure < 30 else "🟢"
                tread_status = "🔴" if tread_depth < 2 else "🟡" if tread_depth < 4 else "🟢"
                
                print(f"{position.upper():<12}: {tread_status} {tread_depth:5.1f}mm | {pressure_status} {pressure:5.1f} PSI | {temp:5.1f}°C")
                
                # Generate recommendations
                if pressure < 30.0:
                    recommendations.append(f"Inflate {position} tire to 32 PSI (currently {pressure:.1f} PSI)")
                if tread_depth < 4.0:
                    recommendations.append(f"Replace {position} tire - tread depth critical ({tread_depth:.1f}mm)")
                elif tread_depth < 6.0:
                    recommendations.append(f"Monitor {position} tire - tread depth low ({tread_depth:.1f}mm)")
            
            if recommendations:
                print(f"\n💡 RECOMMENDATIONS:")
                for i, rec in enumerate(recommendations, 1):
                    print(f"   {i}. {rec}")
            else:
                print(f"\n✅ All tires in good condition")
                
        except ValueError:
            print("❌ Please enter a valid vehicle ID number")
    
    def tire_wear_predictions(self):
        """Show tire wear predictions"""
        try:
            vehicle_id = int(input("\n📈 Enter Vehicle ID for predictions: "))
            
            if vehicle_id not in self.tire_data['vehicle_id'].values:
                print(f"❌ Vehicle {vehicle_id} not found")
                return
            
            print(f"\n📈 TIRE WEAR PREDICTIONS - Vehicle {vehicle_id}")
            print("-" * 50)
            
            vehicle_data = self.tire_data[self.tire_data['vehicle_id'] == vehicle_id]
            
            try:
                # Load models if available
                self.predictor.load_models()
                predictions = self.predictor.predict_future_wear(vehicle_data, days_ahead=30)
                
                if predictions.empty:
                    print("❌ No predictions available - insufficient data")
                    return
                
                for position in predictions['position'].unique():
                    pos_data = predictions[predictions['position'] == position]
                    print(f"\n🔧 {position.replace('_', ' ').title()}:")
                    
                    for _, pred in pos_data.head(5).iterrows():  # Show first 5 predictions
                        days = pred['days_ahead']
                        depth = pred['predicted_tread_depth']
                        
                        if pred['maintenance_needed']:
                            status = "🔴 REPLACE NEEDED"
                        elif pred['replacement_recommended']:
                            status = "🟡 MONITOR CLOSELY"
                        else:
                            status = "🟢 GOOD"
                        
                        print(f"   Day {days:2d}: {depth:.2f}mm - {status}")
                        
            except Exception as e:
                print(f"❌ Prediction error: {str(e)}")
                print("💡 Try training models first (option 12)")
                
        except ValueError:
            print("❌ Please enter a valid vehicle ID number")
    
    def detect_tire_anomalies(self):
        """Detect and display tire anomalies"""
        print("\n⚠️  TIRE ANOMALY DETECTION")
        print("-" * 40)
        
        try:
            self.predictor.load_models()
            
            if self.predictor.anomaly_model is None:
                print("❌ Anomaly detection models not available")
                print("💡 Try training models first (option 12)")
                return
            
            anomalies = self.predictor.detect_anomalies(self.tire_data)
            
            if anomalies.empty:
                print("✅ No tire anomalies detected in the fleet")
                return
            
            # Group by vehicle
            for vehicle_id in anomalies['vehicle_id'].unique():
                vehicle_anomalies = anomalies[anomalies['vehicle_id'] == vehicle_id]
                print(f"\n🚗 Vehicle {vehicle_id} - {len(vehicle_anomalies)} anomalies:")
                
                for _, anomaly in vehicle_anomalies.head(3).iterrows():  # Show top 3
                    severity = "🔴 HIGH" if anomaly['anomaly_score'] < -0.5 else "🟡 MEDIUM"
                    print(f"   {severity} | {anomaly['position'].replace('_', ' ').title()}")
                    print(f"   Date: {anomaly['date']} | Tread: {anomaly['tread_depth_mm']:.1f}mm | Pressure: {anomaly['pressure_psi']:.1f} PSI")
                        
        except Exception as e:
            print(f"❌ Error detecting anomalies: {str(e)}")
    
    def view_motor_health(self):
        """Display motor health overview for all vehicles"""
        print("\n⚙️  MOTOR HEALTH OVERVIEW")
        print("-" * 50)
        
        # Get latest readings for each vehicle
        latest_motor = self.motor_data.groupby('vehicle_id').last().reset_index()
        
        for _, vehicle in latest_motor.iterrows():
            # Determine status
            if vehicle['failure_risk'] >= 2 or vehicle['performance_score'] < 70:
                status_icon = "🔴"
                status = "CRITICAL"
            elif vehicle['failure_risk'] == 1 or vehicle['performance_score'] < 85:
                status_icon = "🟡"
                status = "WARNING"
            else:
                status_icon = "🟢"
                status = "GOOD"
            
            print(f"\n{status_icon} Vehicle {vehicle['vehicle_id']:2d}: {vehicle['year']} {vehicle['make']} {vehicle['model']}")
            print(f"   Performance: {vehicle['performance_score']:.1f}% | Temp: {vehicle['engine_temp_c']:.1f}°C | Oil: {vehicle['oil_pressure_psi']:.1f} PSI")
            print(f"   Status: {status} | Failure Risk: {['LOW', 'MEDIUM', 'HIGH'][vehicle['failure_risk']]}")
    
    def analyze_vehicle_motor(self):
        """Analyze specific vehicle motor"""
        try:
            vehicle_id = int(input("\n🔧 Enter Vehicle ID to analyze: "))
            
            if vehicle_id not in self.motor_data['vehicle_id'].values:
                print(f"❌ Vehicle {vehicle_id} not found")
                return
            
            vehicle_motor = self.motor_data[self.motor_data['vehicle_id'] == vehicle_id]
            latest = vehicle_motor.iloc[-1]
            
            print(f"\n🔧 MOTOR ANALYSIS - Vehicle {vehicle_id}")
            print("-" * 40)
            
            print(f"Performance Score: {latest['performance_score']:.1f}/100")
            print(f"Engine Temperature: {latest['engine_temp_c']:.1f}°C")
            print(f"Oil Pressure: {latest['oil_pressure_psi']:.1f} PSI")
            print(f"Vibration Level: {latest['vibration_level']:.2f}")
            print(f"RPM Average: {latest['rpm_avg']:.0f}")
            print(f"Fuel Consumption: {latest['fuel_consumption_l100km']:.1f} L/100km")
            print(f"Failure Risk: {['LOW', 'MEDIUM', 'HIGH'][latest['failure_risk']]}")
            
            # Recommendations
            recommendations = []
            if latest['performance_score'] < 70:
                recommendations.append("🔴 Critical: Schedule immediate motor service")
            elif latest['performance_score'] < 85:
                recommendations.append("🟡 Warning: Schedule motor maintenance soon")
            
            if latest['engine_temp_c'] > 100:
                recommendations.append("🔴 Critical: Engine overheating - stop driving")
            elif latest['engine_temp_c'] > 90:
                recommendations.append("🟡 Warning: Engine running hot - check cooling system")
            
            if latest['oil_pressure_psi'] < 20:
                recommendations.append("🔴 Critical: Low oil pressure - check oil level")
            
            if recommendations:
                print(f"\n💡 RECOMMENDATIONS:")
                for i, rec in enumerate(recommendations, 1):
                    print(f"   {i}. {rec}")
            else:
                print(f"\n✅ Motor in good condition")
                
        except ValueError:
            print("❌ Please enter a valid vehicle ID number")
    
    def motor_predictions(self):
        """Show motor performance predictions"""
        try:
            vehicle_id = int(input("\n📈 Enter Vehicle ID for motor predictions: "))
            
            if vehicle_id not in self.motor_data['vehicle_id'].values:
                print(f"❌ Vehicle {vehicle_id} not found")
                return
            
            vehicle_motor = self.motor_data[self.motor_data['vehicle_id'] == vehicle_id]
            recent = vehicle_motor.tail(10)
            
            print(f"\n📈 MOTOR PERFORMANCE TREND - Vehicle {vehicle_id}")
            print("-" * 50)
            
            # Calculate trends
            perf_trend = recent['performance_score'].diff().mean()
            temp_trend = recent['engine_temp_c'].diff().mean()
            
            print(f"Performance Trend: {'📈 Improving' if perf_trend > 0.1 else '📉 Declining' if perf_trend < -0.1 else '➡️ Stable'}")
            print(f"Temperature Trend: {'🔥 Increasing' if temp_trend > 0.5 else '❄️ Decreasing' if temp_trend < -0.5 else '➡️ Stable'}")
            
            # Predictions
            current_perf = recent.iloc[-1]['performance_score']
            predicted_30d = current_perf + (perf_trend * 30)
            
            print(f"\nCurrent Performance: {current_perf:.1f}%")
            print(f"Predicted (30 days): {predicted_30d:.1f}%")
            
            if predicted_30d < 70:
                print("🔴 Prediction: Critical maintenance needed within 30 days")
            elif predicted_30d < 85:
                print("🟡 Prediction: Maintenance recommended within 30 days")
            else:
                print("🟢 Prediction: Performance expected to remain good")
                
        except ValueError:
            print("❌ Please enter a valid vehicle ID number")
    
    def schedule_maintenance(self):
        """Schedule maintenance appointment"""
        try:
            vehicle_id = int(input("\n📅 Enter Vehicle ID for appointment: "))
            
            if vehicle_id not in self.tire_data['vehicle_id'].values:
                print(f"❌ Vehicle {vehicle_id} not found")
                return
            
            print("\nMaintenance Types:")
            print("1. Tire Replacement")
            print("2. Tire Rotation")
            print("3. Motor Service")
            print("4. Oil Change")
            print("5. General Inspection")
            
            service_choice = input("Select service type (1-5): ")
            service_types = {
                "1": "Tire Replacement",
                "2": "Tire Rotation", 
                "3": "Motor Service",
                "4": "Oil Change",
                "5": "General Inspection"
            }
            
            service_type = service_types.get(service_choice, "General Inspection")
            
            preferred_date = input("Preferred date (YYYY-MM-DD) or press Enter for next week: ").strip()
            if not preferred_date:
                preferred_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
            
            notes = input("Additional notes (optional): ").strip()
            
            # Create appointment
            appointment = {
                "vehicle_id": vehicle_id,
                "service_type": service_type,
                "date": preferred_date,
                "notes": notes,
                "status": "Scheduled",
                "created": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            print(f"\n✅ APPOINTMENT SCHEDULED")
            print(f"Vehicle: {vehicle_id}")
            print(f"Service: {service_type}")
            print(f"Date: {preferred_date}")
            if notes:
                print(f"Notes: {notes}")
                
        except ValueError:
            print("❌ Please enter a valid vehicle ID number")
    
    def generate_vehicle_report(self):
        """Generate comprehensive vehicle report"""
        try:
            vehicle_id = int(input("\n📄 Enter Vehicle ID for report: "))
            
            if vehicle_id not in self.tire_data['vehicle_id'].values:
                print(f"❌ Vehicle {vehicle_id} not found")
                return
            
            print(f"\n📄 COMPREHENSIVE VEHICLE REPORT - Vehicle {vehicle_id}")
            print("=" * 60)
            
            # Vehicle info
            vehicle_tires = self.tire_data[self.tire_data['vehicle_id'] == vehicle_id]
            vehicle_motor = self.motor_data[self.motor_data['vehicle_id'] == vehicle_id]
            
            latest_tire = vehicle_tires.iloc[-1]
            latest_motor = vehicle_motor.iloc[-1]
            
            print(f"Vehicle: {latest_tire['year']} {latest_tire['make']} {latest_tire['model']}")
            print(f"Report Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Tire summary
            latest_tires = vehicle_tires.groupby('position').last().reset_index()
            tire_issues = sum(1 for _, tire in latest_tires.iterrows() 
                            if tire['pressure_psi'] < 30 or tire['tread_depth_mm'] < 4)
            
            print(f"\n🛞 TIRE STATUS: {'🔴 Issues Found' if tire_issues > 0 else '🟢 All Good'}")
            
            # Motor summary  
            motor_status = "🔴 Critical" if latest_motor['performance_score'] < 70 else \
                          "🟡 Warning" if latest_motor['performance_score'] < 85 else "🟢 Good"
            
            print(f"⚙️  MOTOR STATUS: {motor_status} ({latest_motor['performance_score']:.1f}%)")
            
            # Overall recommendation
            if tire_issues > 0 or latest_motor['performance_score'] < 85:
                print(f"\n💡 RECOMMENDATION: Schedule maintenance appointment")
            else:
                print(f"\n✅ RECOMMENDATION: Continue regular maintenance schedule")
                
        except ValueError:
            print("❌ Please enter a valid vehicle ID number")
    
    def fleet_summary(self):
        """Show fleet-wide summary"""
        print(f"\n🚛 FLEET SUMMARY")
        print("=" * 50)
        
        vehicles = self.tire_data['vehicle_id'].unique()
        total_vehicles = len(vehicles)
        
        tire_issues = 0
        motor_issues = 0
        
        for vehicle_id in vehicles:
            # Check tire issues
            vehicle_tires = self.tire_data[self.tire_data['vehicle_id'] == vehicle_id]
            latest_tires = vehicle_tires.groupby('position').last().reset_index()
            
            has_tire_issue = any(tire['pressure_psi'] < 30 or tire['tread_depth_mm'] < 4 
                               for _, tire in latest_tires.iterrows())
            if has_tire_issue:
                tire_issues += 1
            
            # Check motor issues
            vehicle_motor = self.motor_data[self.motor_data['vehicle_id'] == vehicle_id]
            latest_motor = vehicle_motor.iloc[-1]
            
            if latest_motor['performance_score'] < 85 or latest_motor['failure_risk'] > 0:
                motor_issues += 1
        
        print(f"Total Vehicles: {total_vehicles}")
        print(f"Vehicles with Tire Issues: {tire_issues}")
        print(f"Vehicles with Motor Issues: {motor_issues}")
        print(f"Vehicles Needing Attention: {max(tire_issues, motor_issues)}")
        
        health_percentage = ((total_vehicles - max(tire_issues, motor_issues)) / total_vehicles) * 100
        print(f"Fleet Health: {health_percentage:.1f}%")
    
    def list_vehicles(self):
        """List all available vehicles"""
        vehicles = self.tire_data['vehicle_id'].unique()
        print(f"\n📋 AVAILABLE VEHICLES ({len(vehicles)} total)")
        print("-" * 40)
        
        for vehicle_id in sorted(vehicles):
            vehicle_info = self.tire_data[self.tire_data['vehicle_id'] == vehicle_id].iloc[0]
            print(f"Vehicle {vehicle_id}: {vehicle_info['year']} {vehicle_info['make']} {vehicle_info['model']}")
    
    def system_status(self):
        """Show system status and train models if needed"""
        print(f"\n🔧 SYSTEM STATUS")
        print("-" * 30)
        
        print(f"Data Files: ✅ Loaded")
        print(f"Tire Records: {len(self.tire_data):,}")
        print(f"Motor Records: {len(self.motor_data):,}")
        print(f"Vehicles: {len(self.tire_data['vehicle_id'].unique())}")
        
        # Check models
        try:
            self.predictor.load_models()
            models_available = self.predictor.wear_model is not None and self.predictor.anomaly_model is not None
            print(f"ML Models: {'✅ Available' if models_available else '❌ Not Available'}")
            
            if not models_available:
                train = input("\n🤖 Train ML models now? (y/N): ").lower()
                if train == 'y':
                    print("🔄 Training models...")
                    self.predictor.train_wear_prediction_model(self.tire_data)
                    self.predictor.train_anomaly_detection_model(self.tire_data)
                    self.predictor.save_models()
                    print("✅ Models trained successfully!")
        except Exception as e:
            print(f"ML Models: ❌ Error - {e}")
    
    def run(self):
        """Main interactive loop"""
        print("🚗 Welcome to Vehicle Maintenance System CLI!")
        
        while True:
            try:
                self.display_menu()
                choice = input("\n👉 Select option: ").strip()
                
                if choice == "0":
                    print("\n👋 Goodbye!")
                    break
                elif choice == "1":
                    self.view_fleet_tire_status()
                elif choice == "2":
                    self.analyze_vehicle_tires()
                elif choice == "3":
                    self.tire_wear_predictions()
                elif choice == "4":
                    self.detect_tire_anomalies()
                elif choice == "5":
                    self.view_motor_health()
                elif choice == "6":
                    self.analyze_vehicle_motor()
                elif choice == "7":
                    self.motor_predictions()
                elif choice == "8":
                    self.schedule_maintenance()
                elif choice == "9":
                    self.generate_vehicle_report()
                elif choice == "10":
                    self.fleet_summary()
                elif choice == "11":
                    self.list_vehicles()
                elif choice == "12":
                    self.system_status()
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

if __name__ == "__main__":
    main()