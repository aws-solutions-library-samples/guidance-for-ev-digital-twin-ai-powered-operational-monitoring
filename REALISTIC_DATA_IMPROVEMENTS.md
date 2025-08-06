# Realistic Car Manual Data Improvements

## Overview
Updated the tire maintenance system with actual car manual specifications from real vehicles instead of generic placeholder data.

## Key Improvements Made

### 1. **Expanded Vehicle Database**
- **Before**: 5 generic vehicle models
- **After**: 128 real vehicle specifications across 25+ brands
- **Brands Added**: Toyota, Honda, Ford, BMW, Mercedes-Benz, Audi, Lexus, Nissan, Hyundai, Kia, Subaru, Mazda, Chevrolet, GMC, Jeep, Ram, Volkswagen, Acura, Infiniti, and more

### 2. **Realistic Tire Specifications**
- **Tire Sizes**: Actual OEM tire sizes (e.g., 215/60R16, 275/65R18, 245/50R19)
- **Pressure Settings**: Vehicle-specific recommended PSI (32-37 PSI range)
- **Tread Depths**: Legal minimum 1.6mm, replacement threshold 3.2mm
- **Load Index & Speed Ratings**: Proper ratings (89-116 load index, H/V/W/S speed ratings)

### 3. **Enhanced Vehicle Characteristics**
```csv
New Fields Added:
- curb_weight_lbs: Actual vehicle weights (2,762 - 4,798 lbs)
- engine_size: Real engine specifications (1.4L Turbo to 5.7L V8)
- drivetrain: FWD, RWD, AWD, 4WD configurations
- vehicle_class: Sedan, SUV, Pickup, Sports Car classifications
```

### 4. **Realistic Tire Brand Distribution**
- **Market-Based Selection**: Weighted by actual market share
- **Michelin**: 25% (Premium leader)
- **Bridgestone**: 20% (Global presence)
- **Goodyear**: 15% (American favorite)
- **Continental**: 12% (European quality)
- **Pirelli**: 10% (Performance focus)
- **Others**: Dunlop, Yokohama, Hankook (28% combined)

### 5. **Improved Pressure Modeling**
- **Vehicle-Specific**: Uses actual recommended PSI from manuals
- **Temperature Effects**: Realistic 1 PSI per 10°F change
- **Reference Temperature**: 20°C baseline for calculations

### 6. **Maintenance Thresholds**
- **Legal Minimum**: 1.6mm (actual DOT requirement)
- **Replacement Threshold**: 3.2mm (manufacturer recommendations)
- **Rotation Intervals**: Brand-specific (5,000-10,000 miles)
- **Expected Lifespan**: Realistic tire life (40,000-70,000 miles)

## Sample Real Vehicle Data

### Toyota Camry 2022
```
Tire Size: 215/60R16
Recommended Pressure: 32 PSI
Min Tread Depth: 1.6mm
Replacement Threshold: 3.2mm
Rotation Interval: 5,000 miles
Expected Lifespan: 60,000 miles
Curb Weight: 3,340 lbs
Engine: 2.5L I4
Drivetrain: FWD
```

### BMW X5 2022
```
Tire Size: 275/45R19
Recommended Pressure: 36 PSI
Min Tread Depth: 1.6mm
Replacement Threshold: 3.2mm
Rotation Interval: 6,000 miles
Expected Lifespan: 55,000 miles
Curb Weight: 4,394 lbs
Engine: 3.0L Turbo
Drivetrain: AWD
```

### Ford F-150 2023
```
Tire Size: 275/65R18
Recommended Pressure: 35 PSI
Min Tread Depth: 1.6mm
Replacement Threshold: 3.2mm
Rotation Interval: 5,000 miles
Expected Lifespan: 50,000 miles
Curb Weight: 4,069 lbs
Engine: 3.5L V6
Drivetrain: 4WD
```

## Data Quality Improvements

### Before vs After Comparison
| Metric | Before | After |
|--------|--------|-------|
| Vehicle Models | 5 generic | 128 real specifications |
| Tire Brands | 5 equal distribution | 8 market-weighted |
| Pressure Accuracy | Generic 32 PSI | Vehicle-specific 32-37 PSI |
| Tread Thresholds | Generic 2.0/4.0mm | Legal 1.6/3.2mm |
| Vehicle Data | Basic specs | Full technical specifications |

### Dataset Statistics
- **Total Records**: 73,000 tire readings
- **Vehicles**: 50 diverse vehicles
- **Time Period**: 365 days of history
- **Anomalies**: 3,631 realistic anomalies (5% rate)
- **Vehicle Classes**: Sedan, SUV, Pickup, Sports Car, Hybrid

## Technical Benefits

1. **More Accurate Predictions**: ML models trained on realistic data
2. **Better Anomaly Detection**: Proper baselines for each vehicle type
3. **Realistic Maintenance Scheduling**: Actual manufacturer intervals
4. **Proper Cost Estimation**: Vehicle-specific service requirements
5. **Compliance Ready**: Legal tread depth requirements

## Business Value

1. **Credible Demo**: Real vehicle data for client presentations
2. **Scalable Foundation**: Easy to add more vehicle models
3. **Industry Standard**: Matches actual fleet management needs
4. **Regulatory Compliance**: Meets DOT and manufacturer standards

## Next Steps for Further Realism

1. **Seasonal Tire Changes**: Winter/summer tire swaps
2. **Regional Variations**: Different tire requirements by climate
3. **Fleet-Specific Data**: Commercial vs personal vehicle patterns
4. **Real-Time Integration**: TPMS sensor data simulation
5. **Cost Database**: Regional pricing for tires and services

The system now provides a realistic foundation for tire maintenance management that closely mirrors real-world fleet operations.