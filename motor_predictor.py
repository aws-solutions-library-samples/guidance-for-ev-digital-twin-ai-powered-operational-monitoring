#!/usr/bin/env python3

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score, classification_report
import joblib
import warnings
warnings.filterwarnings('ignore')

class MotorPredictor:
    def __init__(self):
        self.performance_model = None
        self.failure_model = None
        self.anomaly_model = None
        self.label_encoders = {}
        
    def prepare_features(self, df):
        """Prepare features for motor analysis"""
        # Create a copy to avoid modifying original data
        data = df.copy()
        
        # Convert date to datetime and extract features
        data['date'] = pd.to_datetime(data['date'])
        data['day_of_year'] = data['date'].dt.dayofyear
        data['month'] = data['date'].dt.month
        
        # Encode categorical variables
        categorical_cols = ['make', 'model', 'engine_type', 'fuel_type', 'driving_pattern', 'weather_condition']
        
        for col in categorical_cols:
            if col in data.columns:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                    data[f'{col}_encoded'] = self.label_encoders[col].fit_transform(data[col])
                else:
                    data[f'{col}_encoded'] = self.label_encoders[col].transform(data[col])
        
        # Create lag features (previous readings)
        data = data.sort_values(['vehicle_id', 'date'])
        data['prev_engine_temp'] = data.groupby('vehicle_id')['engine_temp_c'].shift(1)
        data['prev_oil_pressure'] = data.groupby('vehicle_id')['oil_pressure_psi'].shift(1)
        data['prev_rpm_avg'] = data.groupby('vehicle_id')['rpm_avg'].shift(1)
        
        # Calculate performance degradation indicators
        data['temp_increase'] = data['engine_temp_c'] - data['prev_engine_temp']
        data['temp_increase'] = data['temp_increase'].fillna(0)
        
        data['oil_pressure_drop'] = data['prev_oil_pressure'] - data['oil_pressure_psi']
        data['oil_pressure_drop'] = data['oil_pressure_drop'].fillna(0)
        
        # Temperature deviation from optimal (85-95°C for most engines)
        data['temp_deviation'] = np.abs(data['engine_temp_c'] - 90)
        
        # RPM efficiency (lower RPM for same speed is better)
        data['rpm_efficiency'] = data['rpm_avg'] / (data['speed_kmh'] + 1)  # +1 to avoid division by zero
        
        # Vibration severity categories
        data['vibration_severity'] = pd.cut(data['vibration_level'], 
                                          bins=[0, 2, 4, 6, 10], 
                                          labels=['low', 'normal', 'high', 'critical'])
        
        return data
    
    def train_performance_model(self, df):
        """Train model to predict motor performance degradation"""
        print("Training motor performance prediction model...")
        
        # Prepare features
        data = self.prepare_features(df)
        data = data.dropna()
        
        # Feature columns for prediction
        feature_cols = [
            'year', 'day_of_year', 'month', 'engine_temp_c', 'oil_pressure_psi', 
            'rpm_avg', 'vibration_level', 'mileage', 'temp_deviation', 'rpm_efficiency',
            'prev_engine_temp', 'prev_oil_pressure', 'prev_rpm_avg',
            'make_encoded', 'model_encoded', 'engine_type_encoded', 'fuel_type_encoded',
            'driving_pattern_encoded', 'weather_condition_encoded'
        ]
        
        # Filter available columns
        available_cols = [col for col in feature_cols if col in data.columns]
        
        X = data[available_cols]
        y = data['performance_score']  # Target: performance score (0-100)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        self.performance_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.performance_model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.performance_model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"Performance Prediction Model - MAE: {mae:.3f}, R²: {r2:.3f}")
        
        return self.performance_model
    
    def train_failure_prediction_model(self, df):
        """Train model to predict motor failure probability"""
        print("Training motor failure prediction model...")
        
        # Prepare features
        data = self.prepare_features(df)
        data = data.dropna()
        
        # Feature columns for failure prediction
        feature_cols = [
            'engine_temp_c', 'oil_pressure_psi', 'rpm_avg', 'vibration_level',
            'mileage', 'temp_deviation', 'rpm_efficiency', 'temp_increase', 'oil_pressure_drop',
            'make_encoded', 'model_encoded', 'engine_type_encoded', 'fuel_type_encoded'
        ]
        
        # Filter available columns
        available_cols = [col for col in feature_cols if col in data.columns]
        
        X = data[available_cols]
        y = data['failure_risk']  # Target: failure risk (0=low, 1=medium, 2=high)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        self.failure_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.failure_model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.failure_model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"Failure Prediction Model - MAE: {mae:.3f}, R²: {r2:.3f}")
        
        return self.failure_model
    
    def train_anomaly_detection_model(self, df):
        """Train model to detect motor anomalies"""
        print("Training motor anomaly detection model...")
        
        # Prepare features
        data = self.prepare_features(df)
        data = data.dropna()
        
        # Features for anomaly detection
        anomaly_features = [
            'engine_temp_c', 'oil_pressure_psi', 'rpm_avg', 'vibration_level',
            'temp_deviation', 'rpm_efficiency', 'temp_increase', 'oil_pressure_drop'
        ]
        
        # Filter available columns
        available_features = [col for col in anomaly_features if col in data.columns]
        X_anomaly = data[available_features]
        
        # Train isolation forest
        self.anomaly_model = IsolationForest(contamination=0.1, random_state=42)
        self.anomaly_model.fit(X_anomaly)
        
        # Evaluate on known anomalies if available
        if 'motor_anomaly' in data.columns:
            anomaly_pred = self.anomaly_model.predict(X_anomaly)
            anomaly_pred_binary = (anomaly_pred == -1)
            
            actual_anomalies = data['motor_anomaly'].values
            accuracy = np.mean(anomaly_pred_binary == actual_anomalies)
            print(f"Motor Anomaly Detection Model - Accuracy: {accuracy:.3f}")
        else:
            print("Motor Anomaly Detection Model - Trained (no ground truth for evaluation)")
        
        return self.anomaly_model
    
    def predict_performance_degradation(self, vehicle_data, days_ahead=30):
        """Predict motor performance degradation"""
        if self.performance_model is None:
            raise ValueError("Performance prediction model not trained")
        
        predictions = []
        current_data = vehicle_data.copy()
        
        # Get latest reading for the vehicle
        latest_reading = current_data.sort_values('date').iloc[-1:].copy()
        
        for day in range(1, days_ahead + 1):
            # Prepare features for prediction
            features_data = self.prepare_features(latest_reading)
            
            feature_cols = [
                'year', 'day_of_year', 'month', 'engine_temp_c', 'oil_pressure_psi', 
                'rpm_avg', 'vibration_level', 'mileage', 'temp_deviation', 'rpm_efficiency',
                'prev_engine_temp', 'prev_oil_pressure', 'prev_rpm_avg',
                'make_encoded', 'model_encoded', 'engine_type_encoded', 'fuel_type_encoded',
                'driving_pattern_encoded', 'weather_condition_encoded'
            ]
            
            # Filter available columns
            available_cols = [col for col in feature_cols if col in features_data.columns]
            
            if len(available_cols) > 0:
                X_pred = features_data[available_cols].iloc[0].values.reshape(1, -1)
                
                # Handle any NaN values
                if not np.isnan(X_pred).any():
                    predicted_performance = self.performance_model.predict(X_pred)[0]
                    
                    predictions.append({
                        'vehicle_id': latest_reading['vehicle_id'].iloc[0],
                        'days_ahead': day,
                        'predicted_performance': predicted_performance,
                        'maintenance_recommended': predicted_performance < 70,
                        'critical_attention': predicted_performance < 50
                    })
        
        return pd.DataFrame(predictions)
    
    def detect_motor_anomalies(self, df):
        """Detect anomalies in motor data"""
        if self.anomaly_model is None:
            raise ValueError("Anomaly detection model not trained")
        
        # Prepare features
        data = self.prepare_features(df)
        data = data.dropna()
        
        anomaly_features = [
            'engine_temp_c', 'oil_pressure_psi', 'rpm_avg', 'vibration_level',
            'temp_deviation', 'rpm_efficiency', 'temp_increase', 'oil_pressure_drop'
        ]
        
        # Filter available columns
        available_features = [col for col in anomaly_features if col in data.columns]
        X_anomaly = data[available_features]
        
        # Predict anomalies
        anomaly_pred = self.anomaly_model.predict(X_anomaly)
        anomaly_scores = self.anomaly_model.decision_function(X_anomaly)
        
        # Add predictions to dataframe
        data['predicted_motor_anomaly'] = (anomaly_pred == -1)
        data['motor_anomaly_score'] = anomaly_scores
        
        return data[data['predicted_motor_anomaly'] == True]
    
    def save_models(self, filepath_prefix="motor_models"):
        """Save trained models"""
        if self.performance_model:
            joblib.dump(self.performance_model, f"{filepath_prefix}_performance.pkl")
        if self.failure_model:
            joblib.dump(self.failure_model, f"{filepath_prefix}_failure.pkl")
        if self.anomaly_model:
            joblib.dump(self.anomaly_model, f"{filepath_prefix}_anomaly.pkl")
        joblib.dump(self.label_encoders, f"{filepath_prefix}_encoders.pkl")
        print("Motor models saved successfully")
    
    def load_models(self, filepath_prefix="motor_models"):
        """Load trained models"""
        try:
            self.performance_model = joblib.load(f"{filepath_prefix}_performance.pkl")
            self.failure_model = joblib.load(f"{filepath_prefix}_failure.pkl")
            self.anomaly_model = joblib.load(f"{filepath_prefix}_anomaly.pkl")
            self.label_encoders = joblib.load(f"{filepath_prefix}_encoders.pkl")
            print("Motor models loaded successfully")
        except FileNotFoundError:
            print("Motor model files not found. Please train models first.")

if __name__ == "__main__":
    # This would be used for testing
    print("Motor Predictor module loaded successfully")