import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

class TireDataGenerator:
    def __init__(self):
        # Load actual car specifications from manual data
        try:
            self.manual_data = pd.read_csv("car_manual_specs.csv")
            self.car_models = self.manual_data.to_dict('records')
        except FileNotFoundError:
            # Fallback to basic models if CSV not found
            self.car_models = [
                {"make": "Toyota", "model": "Camry", "year": 2020, "tire_size": "215/60R16"},
                {"make": "Honda", "model": "Accord", "year": 2019, "tire_size": "235/45R18"},
                {"make": "Ford", "model": "F-150", "year": 2021, "tire_size": "275/65R18"},
                {"make": "BMW", "model": "3 Series", "year": 2022, "tire_size": "225/50R17"},
                {"make": "Mercedes-Benz", "model": "C-Class", "year": 2021, "tire_size": "225/45R18"}
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
        
    def generate_tire_dataset(self, num_vehicles=50, days_history=365):
        """Generate comprehensive tire wear dataset"""
        data = []
        
        for vehicle_id in range(1, num_vehicles + 1):
            car = random.choice(self.car_models)
            
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

if __name__ == "__main__":
    generator = TireDataGenerator()
    
    # Generate datasets
    tire_data = generator.generate_tire_dataset(num_vehicles=50, days_history=365)
    manual_data = generator.generate_car_manual_data()
    
    # Save to CSV
    tire_data.to_csv("tire_wear_data.csv", index=False)
    manual_data.to_csv("car_manual_specs.csv", index=False)
    
    print(f"Generated {len(tire_data)} tire readings for {tire_data['vehicle_id'].nunique()} vehicles")
    print(f"Generated manual data for {len(manual_data)} car models")
    print(f"Anomalies detected: {tire_data['anomaly'].sum()}")