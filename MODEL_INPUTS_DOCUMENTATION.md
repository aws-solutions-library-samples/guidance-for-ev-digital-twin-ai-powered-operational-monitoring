# Tire Wear Prediction Model - Input Features

## Overview
The Random Forest Regressor model uses **16 input features** to predict future tire tread depth. Here's the complete breakdown of model inputs:

## 📊 **Model Input Features (16 Total)**

### **1. Temporal Features (3)**
- **`year`**: Vehicle model year (e.g., 2020, 2021, 2022)
- **`day_of_year`**: Day of the year (1-365) for seasonal patterns
- **`month`**: Month (1-12) for seasonal wear variations

### **2. Physical Measurements (3)**
- **`pressure_psi`**: Current tire pressure in PSI (e.g., 32.5)
- **`temperature_c`**: Ambient temperature in Celsius (e.g., 15.3)
- **`mileage`**: Vehicle mileage at time of measurement

### **3. Engineered Features (3)**
- **`pressure_deviation`**: Absolute deviation from optimal 32 PSI
- **`prev_tread_depth`**: Previous day's tread depth (lag feature)
- **`prev_pressure`**: Previous day's tire pressure (lag feature)

### **4. Encoded Categorical Features (6)**
- **`make_encoded`**: Vehicle manufacturer (Honda=0, Toyota=1, etc.)
- **`model_encoded`**: Vehicle model (Civic=0, Camry=1, etc.)
- **`tire_brand_encoded`**: Tire brand (Michelin=0, Bridgestone=1, etc.)
- **`position_encoded`**: Tire position (front_left=0, front_right=1, etc.)
- **`driving_pattern_encoded`**: Driving style (city=0, highway=1, mixed=2)
- **`weather_condition_encoded`**: Weather (dry=0, wet=1, snow=2)

### **5. Target Variable (Output)**
- **`tread_depth_mm`**: Current tire tread depth in millimeters

## 🔍 **Feature Engineering Process**

### **Step 1: Temporal Extraction**
```python
data['day_of_year'] = data['date'].dt.dayofyear  # 1-365
data['month'] = data['date'].dt.month            # 1-12
```

### **Step 2: Lag Features (Time Series)**
```python
data['prev_tread_depth'] = data.groupby(['vehicle_id', 'position'])['tread_depth_mm'].shift(1)
data['prev_pressure'] = data.groupby(['vehicle_id', 'position'])['pressure_psi'].shift(1)
```

### **Step 3: Calculated Features**
```python
data['wear_rate'] = data['prev_tread_depth'] - data['tread_depth_mm']  # mm/day
data['pressure_deviation'] = abs(data['pressure_psi'] - 32)           # PSI deviation
```

### **Step 4: Categorical Encoding**
```python
# LabelEncoder converts categories to integers
make_encoded: Honda=0, Toyota=1, Ford=2, BMW=3, Mercedes=4
position_encoded: front_left=0, front_right=1, rear_left=2, rear_right=3
```

## 📈 **Prediction Process**

### **Input Data Required for Prediction:**
```python
# Example input for Honda Civic prediction
input_features = {
    'year': 2020,
    'day_of_year': 225,           # August 13th
    'month': 8,                   # August
    'pressure_psi': 31.5,         # Current pressure
    'temperature_c': 22.0,        # Current temperature
    'mileage': 25000,             # Vehicle mileage
    'pressure_deviation': 0.5,    # |31.5 - 32|
    'prev_tread_depth': 8.2,      # Yesterday's depth
    'prev_pressure': 32.0,        # Yesterday's pressure
    'make_encoded': 0,            # Honda
    'model_encoded': 1,           # Civic
    'tire_brand_encoded': 2,      # Michelin
    'position_encoded': 0,        # front_left
    'driving_pattern_encoded': 2, # mixed
    'weather_condition_encoded': 0 # dry
}
```

### **Prediction Output:**
```python
predicted_tread_depth = 8.15  # mm (predicted for tomorrow)
```

## 🎯 **Model Capabilities**

### **What the Model Predicts:**
- **Future tread depth** for 1-90 days ahead
- **Maintenance timing** (when depth < 2.0mm)
- **Replacement timing** (when depth < 4.0mm)
- **Wear progression** patterns over time

### **What Influences Predictions:**
1. **Vehicle Characteristics**: Make, model, year, weight
2. **Tire Specifications**: Brand, size, position on vehicle
3. **Environmental Factors**: Temperature, weather conditions
4. **Driving Patterns**: City vs highway vs mixed driving
5. **Maintenance History**: Previous pressure, tread depth
6. **Seasonal Effects**: Month and day of year
7. **Pressure Management**: Deviation from optimal pressure

## 🔧 **Feature Importance (Typical)**

Based on Random Forest feature importance:
1. **prev_tread_depth** (~25%): Most important predictor
2. **mileage** (~15%): Vehicle usage impact
3. **pressure_deviation** (~12%): Pressure maintenance effect
4. **temperature_c** (~10%): Environmental impact
5. **driving_pattern_encoded** (~8%): Usage pattern impact
6. **position_encoded** (~7%): Tire position wear differences
7. **Other features** (~23%): Combined effect of remaining features

## 📊 **Sample Prediction Scenario**

### **Honda Civic Example:**
```
Input:
- Vehicle: 2020 Honda Civic (make_encoded=0, model_encoded=1)
- Current tread: 6.5mm
- Pressure: 30 PSI (deviation: 2 PSI)
- Temperature: 20°C
- Mileage: 35,000
- Driving: Mixed (encoded=2)
- Weather: Dry (encoded=0)
- Position: Front left (encoded=0)

Prediction Process:
1. Feature vector: [2020, 225, 8, 30, 20, 35000, 2, 6.8, 31, 0, 1, 2, 0, 2, 0]
2. Random Forest processes through 100 trees
3. Output: 6.45mm (predicted tread depth in 1 day)

Business Logic:
- 6.45mm > 3.2mm → No immediate replacement needed
- 6.45mm > 1.6mm → Above legal minimum
- Recommendation: Continue monitoring
```

## 🎯 **Key Insights**

### **Model Strengths:**
- **Time Series Awareness**: Uses lag features for trend analysis
- **Multi-Factor Analysis**: Considers vehicle, environment, and usage
- **Position-Specific**: Different predictions for each tire position
- **Seasonal Adaptation**: Accounts for weather and time of year

### **Model Limitations:**
- **Requires Historical Data**: Needs previous readings for lag features
- **Linear Wear Assumption**: May not capture sudden tire failures
- **Limited Anomaly Integration**: Anomaly detection is separate model

The model uses these 16 carefully engineered features to provide accurate tire wear predictions that power the maintenance recommendations in your system.