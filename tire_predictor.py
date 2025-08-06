# temp tire for prediction model - from Michellin tire

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import warnings
warnings.filterwarnings('ignore')

class TirePredictor:
    def __init__(self):
        self.wear_model = None
        self.anomaly_model = None
        self.label_encoders = {}
        
    def prepare_features(self, df):
        """Prepare features for machine learning"""
        # Create a copy to avoid modifying original data
        data = df.copy()
        
        # Convert date to datetime and extract features
        data['date'] = pd.to_datetime(data['date'])
        data['day_of_year'] = data['date'].dt.dayofyear
        data['month'] = data['date'].dt.month
        
        # Encode categorical variables
        categorical_cols = ['make', 'model', 'tire_brand', 'position', 'driving_pattern', 'weather_condition']
        
        for col in categorical_cols:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                data[f'{col}_encoded'] = self.label_encoders[col].fit_transform(data[col])
            else:
                data[f'{col}_encoded'] = self.label_encoders[col].transform(data[col])
        
        # Create lag features (previous day's readings)
        data = data.sort_values(['vehicle_id', 'position', 'date'])
        data['prev_tread_depth'] = data.groupby(['vehicle_id', 'position'])['tread_depth_mm'].shift(1)
        data['prev_pressure'] = data.groupby(['vehicle_id', 'position'])['pressure_psi'].shift(1)
        
        # Calculate wear rate
        data['wear_rate'] = data['prev_tread_depth'] - data['tread_depth_mm']
        data['wear_rate'] = data['wear_rate'].fillna(0)
        
        # Pressure deviation from optimal
        data['pressure_deviation'] = abs(data['pressure_psi'] - 32)
        
        return data
    
    def train_wear_prediction_model(self, df):
        """Train model to predict tire wear"""
        print("Training tire wear prediction model...")
        
        # Prepare features
        data = self.prepare_features(df)
        
        # Remove rows with NaN values
        data = data.dropna()
        
        # Feature columns for prediction
        feature_cols = [
            'year', 'day_of_year', 'month', 'pressure_psi', 'temperature_c', 
            'mileage', 'pressure_deviation', 'prev_tread_depth', 'prev_pressure',
            'make_encoded', 'model_encoded', 'tire_brand_encoded', 
            'position_encoded', 'driving_pattern_encoded', 'weather_condition_encoded'
        ]
        
        X = data[feature_cols]
        y = data['tread_depth_mm']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        self.wear_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.wear_model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.wear_model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"Wear Prediction Model - MAE: {mae:.3f}, R²: {r2:.3f}")
        
        return self.wear_model
    
    def train_anomaly_detection_model(self, df):
        """Train model to detect tire anomalies"""
        print("Training anomaly detection model...")
        
        # Prepare features
        data = self.prepare_features(df)
        data = data.dropna()
        
        # Features for anomaly detection
        anomaly_features = [
            'tread_depth_mm', 'pressure_psi', 'temperature_c', 'wear_rate',
            'pressure_deviation', 'mileage'
        ]
        
        X_anomaly = data[anomaly_features]
        
        # Train isolation forest
        self.anomaly_model = IsolationForest(contamination=0.1, random_state=42)
        self.anomaly_model.fit(X_anomaly)
        
        # Evaluate on known anomalies
        anomaly_pred = self.anomaly_model.predict(X_anomaly)
        anomaly_pred_binary = (anomaly_pred == -1)
        
        actual_anomalies = data['anomaly'].values
        accuracy = np.mean(anomaly_pred_binary == actual_anomalies)
        
        print(f"Anomaly Detection Model - Accuracy: {accuracy:.3f}")
        
        return self.anomaly_model
    
    def predict_future_wear(self, vehicle_data, days_ahead=30):
        """Predict tire wear for future days"""
        if self.wear_model is None:
            raise ValueError("Wear prediction model not trained")
        
        predictions = []
        current_data = vehicle_data.copy()
        
        for day in range(1, days_ahead + 1):
            # Prepare features for prediction
            features_data = self.prepare_features(current_data)
            
            feature_cols = [
                'year', 'day_of_year', 'month', 'pressure_psi', 'temperature_c', 
                'mileage', 'pressure_deviation', 'prev_tread_depth', 'prev_pressure',
                'make_encoded', 'model_encoded', 'tire_brand_encoded', 
                'position_encoded', 'driving_pattern_encoded', 'weather_condition_encoded'
            ]
            
            # Get latest reading for each tire position
            latest_readings = features_data.groupby('position').last().reset_index()
            
            for _, row in latest_readings.iterrows():
                if not pd.isna(row[feature_cols]).any():
                    X_pred = row[feature_cols].values.reshape(1, -1)
                    predicted_depth = self.wear_model.predict(X_pred)[0]
                    
                    predictions.append({
                        'vehicle_id': row['vehicle_id'],
                        'position': row['position'],
                        'days_ahead': day,
                        'predicted_tread_depth': predicted_depth,
                        'maintenance_needed': predicted_depth < 2.0,
                        'replacement_recommended': predicted_depth < 4.0
                    })
        
        return pd.DataFrame(predictions)
    
    def detect_anomalies(self, df):
        """Detect anomalies in tire data"""
        if self.anomaly_model is None:
            raise ValueError("Anomaly detection model not trained")
        
        # Prepare features
        data = self.prepare_features(df)
        data = data.dropna()
        
        anomaly_features = [
            'tread_depth_mm', 'pressure_psi', 'temperature_c', 'wear_rate',
            'pressure_deviation', 'mileage'
        ]
        
        X_anomaly = data[anomaly_features]
        
        # Predict anomalies
        anomaly_pred = self.anomaly_model.predict(X_anomaly)
        anomaly_scores = self.anomaly_model.decision_function(X_anomaly)
        
        # Add predictions to dataframe
        data['predicted_anomaly'] = (anomaly_pred == -1)
        data['anomaly_score'] = anomaly_scores
        
        return data[data['predicted_anomaly'] == True]
    
    def save_models(self, filepath_prefix="tire_models"):
        """Save trained models"""
        if self.wear_model:
            joblib.dump(self.wear_model, f"{filepath_prefix}_wear.pkl")
        if self.anomaly_model:
            joblib.dump(self.anomaly_model, f"{filepath_prefix}_anomaly.pkl")
        joblib.dump(self.label_encoders, f"{filepath_prefix}_encoders.pkl")
        print("Models saved successfully")
    
    def load_models(self, filepath_prefix="tire_models"):
        """Load trained models"""
        try:
            self.wear_model = joblib.load(f"{filepath_prefix}_wear.pkl")
            self.anomaly_model = joblib.load(f"{filepath_prefix}_anomaly.pkl")
            self.label_encoders = joblib.load(f"{filepath_prefix}_encoders.pkl")
            print("Models loaded successfully")
        except FileNotFoundError:
            print("Model files not found. Please train models first.")

if __name__ == "__main__":
    # Load data
    df = pd.read_csv("tire_wear_data.csv")
    
    # Initialize and train predictor
    predictor = TirePredictor()
    predictor.train_wear_prediction_model(df)
    predictor.train_anomaly_detection_model(df)
    
    # Save models
    predictor.save_models()
    
    print("Training completed and models saved!")