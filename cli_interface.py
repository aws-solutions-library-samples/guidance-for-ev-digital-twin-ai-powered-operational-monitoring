#!/usr/bin/env python3

import pandas as pd
import json
import sys
import os
from datetime import datetime, timedelta
from maintenance_agent import MaintenanceAgent
from data_generator import TireDataGenerator
from tire_predictor import TirePredictor

class TireMaintenanceCLI:
    def __init__(self):
        self.tire_data = None
        self.manual_data = None
        self.load_data()
        self.agent = MaintenanceAgent()  # Initialize agent after data is loaded
    
    def load_data(self):
        """Load or generate tire data"""
        try:
            self.tire_data = pd.read_csv("tire_wear_data.csv")
            self.manual_data = pd.read_csv("car_manual_specs.csv")
            print("✓ Data loaded successfully")
        except FileNotFoundError:
            print("⚠ Data files not found. Generating sample data...")
            self.generate_sample_data()
    
    def generate_sample_data(self):
        """Generate sample tire data"""
        generator = TireDataGenerator()
        
        print("Generating tire wear data...")
        self.tire_data = generator.generate_tire_dataset(num_vehicles=20, days_history=180)
        self.manual_data = generator.generate_car_manual_data()
        
        # Save data
        self.tire_data.to_csv("tire_wear_data.csv", index=False)
        self.manual_data.to_csv("car_manual_specs.csv", index=False)
        
        print(f"✓ Generated data for {self.tire_data['vehicle_id'].nunique()} vehicles")
        
        # Train models
        print("Training prediction models...")
        predictor = TirePredictor()
        predictor.train_wear_prediction_model(self.tire_data)
        predictor.train_anomaly_detection_model(self.tire_data)
        predictor.save_models()
        print("✓ Models trained and saved")
        
        # Reload the agent to use the new models
        self.agent = MaintenanceAgent()
    
    def display_menu(self):
        """Display main menu"""
        print("\n" + "="*60)
        print("🚗 TIRE MAINTENANCE SYSTEM - PoC")
        print("="*60)
        print("1. 📊 View Vehicle Fleet")
        print("2. 🔍 Analyze Vehicle Tires")
        print("3. 📈 View Tire Predictions")
        print("4. ⚠️  Detect Anomalies")
        print("5. 📅 Schedule Appointment")
        print("6. 📋 View Appointments")
        print("7. 📄 Generate Report")
        print("8. 📊 Fleet Dashboard")
        print("9. 🔧 Regenerate Data")
        print("0. 🚪 Exit")
        print("="*60)
    
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
        print("🚗 Welcome to Tire Maintenance System PoC!")
        
        while True:
            try:
                self.display_menu()
                choice = input("\n👉 Select option (0-9): ").strip()
                
                if choice == "0":
                    print("\n👋 Thank you for using Tire Maintenance System!")
                    break
                elif choice == "1":
                    self.view_fleet()
                elif choice == "2":
                    self.analyze_vehicle()
                elif choice == "3":
                    self.view_predictions()
                elif choice == "4":
                    self.detect_anomalies()
                elif choice == "5":
                    self.schedule_appointment()
                elif choice == "6":
                    self.view_appointments()
                elif choice == "7":
                    self.generate_report()
                elif choice == "8":
                    self.fleet_dashboard()
                elif choice == "9":
                    self.regenerate_data()
                else:
                    print("❌ Invalid option. Please select 0-9.")
                
                input("\n📱 Press Enter to continue...")
                
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"\n❌ Unexpected error: {str(e)}")
                input("📱 Press Enter to continue...")

def main():
    """Main entry point for the CLI application"""
    cli = TireMaintenanceCLI()
    cli.run()

if __name__ == "__main__":
    main()