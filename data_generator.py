import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

class VehicleDataGenerator:
    def __init__(self):
        # Load actual car specifications from manual data
        try:
            self.manual_data = pd.read_csv("car_manual_specs.csv")
            # Filter to only 5 vehicles including Honda Civic
            target_vehicles = [
                ("Honda", "Civic", 2020),
                ("Toyota", "Camry", 2022), 
                ("Ford", "F-150", 2023),
                ("BMW", "3 Series", 2020),
                ("Mercedes-Benz", "C-Class", 2022)
            ]
            
            filtered_data = []
            for make, model, year in target_vehicles:
                vehicle_match = self.manual_data[
                    (self.manual_data['make'] == make) & 
                    (self.manual_data['model'] == model) & 
                    (self.manual_data['year'] == year)
                ]
                if not vehicle_match.empty:
                    filtered_data.append(vehicle_match.iloc[0].to_dict())
            
            if filtered_data:
                self.car_models = filtered_data
            else:
                # If no matches found, use fallback
                raise FileNotFoundError("No matching vehicles found in manual data")
        except FileNotFoundError:
            # Fallback to basic models if CSV not found - 5 vehicle fleet
            self.car_models = [
                {"make": "Honda", "model": "Civic", "year": 2020, "tire_size": "215/55R16", "engine_type": "I4", "fuel_type": "gasoline"},
                {"make": "Toyota", "model": "Camry", "year": 2022, "tire_size": "215/60R16", "engine_type": "I4", "fuel_type": "gasoline"},
                {"make": "Ford", "model": "F-150", "year": 2023, "tire_size": "275/65R18", "engine_type": "V6", "fuel_type": "gasoline"},
                {"make": "BMW", "model": "3 Series", "year": 2020, "tire_size": "225/50R17", "engine_type": "I4", "fuel_type": "gasoline"},
                {"make": "Mercedes-Benz", "model": "C-Class", "year": 2022, "tire_size": "225/45R18", "engine_type": "I4", "fuel_type": "gasoline"}
            ]
        
        # Premium tire brands with realistic market distribution
        self.tire_brands = {
            "Michelin": 0.25,      # 25% market share
            "Bridgestone": 0.20,   # 20% market share  
            "Goodyear": 0.15,      # 15% market share
            "Continental": 0.12,   # 12% market share
            "Pirelli": 0.10,       # 10% market share
            "Dunlop": 0.08,        # 8% market share
            "Yokohama": 0.06,      # 6% market share
            "Hankook": 0.04        # 4% market share
        }
        
        # Engine specifications by type
        self.engine_specs = {
            "I4": {"optimal_temp": 90, "max_temp": 110, "optimal_oil_pressure": 25, "base_rpm": 2000},
            "V6": {"optimal_temp": 88, "max_temp": 115, "optimal_oil_pressure": 30, "base_rpm": 1800},
            "V8": {"optimal_temp": 85, "max_temp": 120, "optimal_oil_pressure": 35, "base_rpm": 1600},
            "Hybrid": {"optimal_temp": 85, "max_temp": 105, "optimal_oil_pressure": 20, "base_rpm": 1500}
        }
        
    def generate_tire_dataset(self, num_vehicles=5, days_history=365):
        """Generate comprehensive tire wear dataset"""
        data = []
        
        # Ensure we use each car model exactly once for the first 5 vehicles
        available_cars = self.car_models.copy()
        
        for vehicle_id in range(1, num_vehicles + 1):
            if vehicle_id <= len(available_cars):
                car = available_cars[vehicle_id - 1]  # Use each car once
            else:
                car = random.choice(self.car_models)  # If more vehicles than models, repeat randomly
            
            # Select tire brand based on market distribution
            tire_brand = np.random.choice(
                list(self.tire_brands.keys()), 
                p=list(self.tire_brands.values())
            )
            
            # Initial tire depth (new tires: 10-12mm)
            initial_depth = random.uniform(10.0, 12.0)
            
            # Generate daily readings
            start_date = datetime.now() - timedelta(days=days_history)
            
            for day in range(days_history):
                current_date = start_date + timedelta(days=day)
                
                # Simulate different wear patterns for each tire position
                for position in ["front_left", "front_right", "rear_left", "rear_right"]:
                    # Base wear rate (mm per day)
                    base_wear = random.uniform(0.005, 0.015)
                    
                    # Position-specific wear factors
                    position_factors = {
                        "front_left": 1.2,  # Higher wear due to steering
                        "front_right": 1.1,
                        "rear_left": 0.9,
                        "rear_right": 0.8
                    }
                    
                    # Driving pattern influence
                    driving_patterns = random.choice(["city", "highway", "mixed"])
                    pattern_multiplier = {"city": 1.3, "highway": 0.8, "mixed": 1.0}
                    
                    # Weather influence
                    weather = random.choice(["dry", "wet", "snow"])
                    weather_multiplier = {"dry": 1.0, "wet": 1.1, "snow": 1.4}
                    
                    # Calculate current depth
                    total_wear = (base_wear * position_factors[position] * 
                                pattern_multiplier[driving_patterns] * 
                                weather_multiplier[weather] * day)
                    
                    current_depth = max(0, initial_depth - total_wear)
                    
                    # Add anomalies (uneven wear, damage)
                    anomaly = False
                    anomaly_type = "normal"
                    
                    if random.random() < 0.05:  # 5% chance of anomaly
                        anomaly = True
                        anomaly_types = ["puncture", "sidewall_damage", "irregular_wear", "alignment_issue"]
                        anomaly_type = random.choice(anomaly_types)
                        
                        if anomaly_type == "puncture":
                            current_depth *= 0.3  # Severe depth loss
                        elif anomaly_type == "irregular_wear":
                            current_depth *= random.uniform(0.6, 0.9)
                    
                    # Pressure simulation using actual recommended pressure
                    optimal_pressure = car.get('recommended_pressure_psi', 32)
                    pressure_variance = random.uniform(-2, 2)
                    current_pressure = optimal_pressure + pressure_variance
                    
                    # Temperature effect on pressure (more realistic)
                    temperature = random.uniform(-10, 40)  # Celsius
                    # Pressure changes ~1 PSI per 10°F (5.6°C)
                    temp_pressure_effect = (temperature - 20) * 0.18  # Reference temp 20°C
                    current_pressure += temp_pressure_effect
                    
                    # Get actual specifications for this vehicle
                    min_tread = car.get('min_tread_depth_mm', 1.6)
                    replacement_threshold = car.get('replacement_threshold_mm', 3.2)
                    
                    data.append({
                        "vehicle_id": vehicle_id,
                        "date": current_date.strftime("%Y-%m-%d"),
                        "make": car["make"],
                        "model": car["model"],
                        "year": car["year"],
                        "tire_size": car["tire_size"],
                        "tire_brand": tire_brand,
                        "position": position,
                        "tread_depth_mm": round(current_depth, 2),
                        "pressure_psi": round(current_pressure, 1),
                        "temperature_c": round(temperature, 1),
                        "mileage": day * random.uniform(20, 100),
                        "driving_pattern": driving_patterns,
                        "weather_condition": weather,
                        "anomaly": anomaly,
                        "anomaly_type": anomaly_type,
                        "maintenance_due": current_depth < min_tread,
                        "replacement_recommended": current_depth < replacement_threshold,
                        "curb_weight_lbs": car.get('curb_weight_lbs', 3500),
                        "engine_size": car.get('engine_size', '2.0L I4'),
                        "drivetrain": car.get('drivetrain', 'FWD'),
                        "vehicle_class": car.get('vehicle_class', 'Sedan')
                    })
        
        return pd.DataFrame(data)
    
    def generate_car_manual_data(self):
        """Return the loaded car manual specifications"""
        # Return the already loaded manual data
        if hasattr(self, 'manual_data'):
            return self.manual_data
        else:
            # Fallback: create basic manual data
            manual_data = []
            unique_cars = {}
            
            for car in self.car_models:
                key = f"{car['make']}_{car['model']}_{car['year']}"
                if key not in unique_cars:
                    unique_cars[key] = {
                        "make": car["make"],
                        "model": car["model"], 
                        "year": car["year"],
                        "tire_size": car["tire_size"],
                        "recommended_pressure_psi": car.get("recommended_pressure_psi", 32),
                        "min_tread_depth_mm": car.get("min_tread_depth_mm", 1.6),
                        "replacement_threshold_mm": car.get("replacement_threshold_mm", 3.2),
                        "rotation_interval_miles": car.get("rotation_interval_miles", 6000),
                        "expected_lifespan_miles": car.get("expected_lifespan_miles", 50000),
                        "load_index": car.get("load_index", "91"),
                        "speed_rating": car.get("speed_rating", "H"),
                        "tire_type": car.get("tire_type", "All-Season"),
                        "curb_weight_lbs": car.get("curb_weight_lbs", 3500),
                        "engine_size": car.get("engine_size", "2.0L I4"),
                        "drivetrain": car.get("drivetrain", "FWD"),
                        "vehicle_class": car.get("vehicle_class", "Sedan")
                    }
            
            return pd.DataFrame(list(unique_cars.values()))
    
    def generate_motor_dataset(self, num_vehicles=5, days_history=365):
        """Generate comprehensive motor sensor dataset"""
        data = []
        
        # Ensure we use each car model exactly once for the first 5 vehicles
        available_cars = self.car_models.copy()
        
        for vehicle_id in range(1, num_vehicles + 1):
            if vehicle_id <= len(available_cars):
                car = available_cars[vehicle_id - 1]  # Use each car once
            else:
                car = random.choice(self.car_models)  # If more vehicles than models, repeat randomly
            engine_type = car.get('engine_type', 'I4')
            fuel_type = car.get('fuel_type', 'gasoline')
            
            # Get engine specifications
            engine_spec = self.engine_specs.get(engine_type, self.engine_specs['I4'])
            
            # Initial motor health (new vehicles start at 95-100% performance)
            initial_performance = random.uniform(95, 100)
            
            # Generate daily readings
            start_date = datetime.now() - timedelta(days=days_history)
            
            for day in range(days_history):
                current_date = start_date + timedelta(days=day)
                
                # Performance degradation over time (very gradual)
                age_factor = 1 - (day / (days_history * 10))  # Very slow degradation
                current_performance = max(50, initial_performance * age_factor)
                
                # Driving pattern influence on motor stress
                driving_patterns = random.choice(["city", "highway", "mixed"])
                pattern_stress = {"city": 1.2, "highway": 0.8, "mixed": 1.0}
                
                # Weather influence on motor performance
                weather = random.choice(["dry", "wet", "snow", "hot"])
                weather_multiplier = {"dry": 1.0, "wet": 1.05, "snow": 1.15, "hot": 1.1}
                
                # Base engine temperature (influenced by weather and driving)
                ambient_temp = random.uniform(-10, 40)  # Celsius
                base_engine_temp = engine_spec['optimal_temp']
                
                # Temperature variations based on conditions
                temp_variance = random.uniform(-5, 15)
                if weather == "hot":
                    temp_variance += random.uniform(5, 15)
                elif driving_patterns == "city":
                    temp_variance += random.uniform(2, 8)  # Stop-and-go increases temp
                
                engine_temp = base_engine_temp + temp_variance
                
                # Oil pressure (decreases with age and temperature)
                base_oil_pressure = engine_spec['optimal_oil_pressure']
                age_pressure_loss = (days_history - day) / days_history * 5  # Up to 5 PSI loss over time
                temp_pressure_effect = max(0, (engine_temp - 90) * 0.1)  # Higher temp = lower pressure
                
                oil_pressure = max(10, base_oil_pressure - age_pressure_loss - temp_pressure_effect + random.uniform(-2, 2))
                
                # RPM patterns (varies by driving style and engine load)
                base_rpm = engine_spec['base_rpm']
                if driving_patterns == "city":
                    rpm_avg = base_rpm + random.uniform(200, 800)
                elif driving_patterns == "highway":
                    rpm_avg = base_rpm + random.uniform(500, 1200)
                else:  # mixed
                    rpm_avg = base_rpm + random.uniform(300, 1000)
                
                # Speed correlation with RPM
                speed_kmh = (rpm_avg - base_rpm) / 20 + random.uniform(10, 30)
                speed_kmh = max(0, speed_kmh)
                
                # Vibration level (increases with age, temperature, and RPM)
                base_vibration = 1.0
                age_vibration = (days_history - day) / days_history * 2  # Increases over time
                temp_vibration = max(0, (engine_temp - 95) * 0.05)
                rpm_vibration = (rpm_avg - base_rpm) / 1000
                
                vibration_level = base_vibration + age_vibration + temp_vibration + rpm_vibration + random.uniform(-0.2, 0.5)
                vibration_level = max(0.5, vibration_level)
                
                # Fuel efficiency (decreases with age and poor conditions)
                base_efficiency = 8.0  # L/100km
                efficiency_degradation = (days_history - day) / days_history * 1.5
                weather_efficiency_impact = weather_multiplier[weather] - 1
                
                fuel_consumption = base_efficiency + efficiency_degradation + weather_efficiency_impact + random.uniform(-0.5, 0.5)
                fuel_consumption = max(5.0, fuel_consumption)
                
                # Motor anomalies (mechanical issues, sensor failures)
                motor_anomaly = False
                anomaly_type = "normal"
                failure_risk = 0  # 0=low, 1=medium, 2=high
                
                # Determine failure risk based on conditions
                if engine_temp > engine_spec['max_temp']:
                    failure_risk = 2
                elif oil_pressure < 15:
                    failure_risk = 2
                elif vibration_level > 4:
                    failure_risk = 1
                elif current_performance < 70:
                    failure_risk = 1
                
                # Random anomalies
                if random.random() < 0.03:  # 3% chance of anomaly
                    motor_anomaly = True
                    anomaly_types = ["overheating", "oil_pressure_drop", "excessive_vibration", "sensor_malfunction", "fuel_system_issue"]
                    anomaly_type = random.choice(anomaly_types)
                    
                    if anomaly_type == "overheating":
                        engine_temp += random.uniform(10, 25)
                        failure_risk = 2
                    elif anomaly_type == "oil_pressure_drop":
                        oil_pressure *= random.uniform(0.3, 0.7)
                        failure_risk = 2
                    elif anomaly_type == "excessive_vibration":
                        vibration_level *= random.uniform(1.5, 3.0)
                        failure_risk = 1
                    elif anomaly_type == "fuel_system_issue":
                        fuel_consumption *= random.uniform(1.2, 1.8)
                        current_performance *= random.uniform(0.7, 0.9)
                
                data.append({
                    "vehicle_id": vehicle_id,
                    "date": current_date.strftime("%Y-%m-%d"),
                    "make": car["make"],
                    "model": car["model"],
                    "year": car["year"],
                    "engine_type": engine_type,
                    "fuel_type": fuel_type,
                    "engine_temp_c": round(engine_temp, 1),
                    "oil_pressure_psi": round(oil_pressure, 1),
                    "rpm_avg": round(rpm_avg, 0),
                    "speed_kmh": round(speed_kmh, 1),
                    "vibration_level": round(vibration_level, 2),
                    "fuel_consumption_l100km": round(fuel_consumption, 2),
                    "performance_score": round(current_performance, 1),
                    "mileage": day * random.uniform(20, 100),
                    "driving_pattern": driving_patterns,
                    "weather_condition": weather,
                    "motor_anomaly": motor_anomaly,
                    "anomaly_type": anomaly_type,
                    "failure_risk": failure_risk,
                    "maintenance_due": failure_risk >= 2 or current_performance < 60,
                    "curb_weight_lbs": car.get('curb_weight_lbs', 3500),
                    "drivetrain": car.get('drivetrain', 'FWD'),
                    "vehicle_class": car.get('vehicle_class', 'Sedan')
                })
        
        return pd.DataFrame(data)
    
    def generate_combined_dataset(self, num_vehicles=5, days_history=365):
        """Generate combined tire and motor dataset for the same vehicles"""
        tire_data = self.generate_tire_dataset(num_vehicles, days_history)
        motor_data = self.generate_motor_dataset(num_vehicles, days_history)
        
        # Merge on vehicle_id and date
        combined_data = pd.merge(tire_data, motor_data, 
                               on=['vehicle_id', 'date', 'make', 'model', 'year', 'mileage', 
                                   'driving_pattern', 'weather_condition'], 
                               suffixes=('_tire', '_motor'))
        
        return combined_data

# Maintain backward compatibility
TireDataGenerator = VehicleDataGenerator

if __name__ == "__main__":
    generator = VehicleDataGenerator()
    
    # Generate datasets for 5 vehicles
    tire_data = generator.generate_tire_dataset(num_vehicles=5, days_history=365)
    motor_data = generator.generate_motor_dataset(num_vehicles=5, days_history=365)
    combined_data = generator.generate_combined_dataset(num_vehicles=5, days_history=365)
    manual_data = generator.generate_car_manual_data()
    
    # Save to CSV
    tire_data.to_csv("tire_wear_data.csv", index=False)
    motor_data.to_csv("motor_sensor_data.csv", index=False)
    combined_data.to_csv("vehicle_maintenance_data.csv", index=False)
    manual_data.to_csv("car_manual_specs.csv", index=False)
    
    print(f"Generated {len(tire_data)} tire readings for {tire_data['vehicle_id'].nunique()} vehicles")
    print(f"Generated {len(motor_data)} motor readings for {motor_data['vehicle_id'].nunique()} vehicles")
    print(f"Generated {len(combined_data)} combined readings for {combined_data['vehicle_id'].nunique()} vehicles")
    print(f"Generated manual data for {len(manual_data)} car models")
    print(f"Tire anomalies: {tire_data['anomaly'].sum()}")
    print(f"Motor anomalies: {motor_data['motor_anomaly'].sum()}")