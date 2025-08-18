# Changelog

All notable changes to the Tire Maintenance System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-07-24

### Added
- Initial release of Tire Maintenance System PoC
- Machine learning-based tire wear prediction using Random Forest
- Anomaly detection using Isolation Forest algorithm
- Interactive CLI interface for fleet management
- Comprehensive vehicle tire analysis and reporting
- Appointment scheduling system
- Fleet dashboard with real-time statistics
- Sample data generation for 20 vehicles over 180 days
- Support for multiple car makes and models (Toyota, Honda, Ford, BMW, Mercedes)
- Tire specifications and manual data integration
- Predictive maintenance recommendations with cost estimates
- JSON report generation and export functionality

### Features
- **Predictive Analytics**: 90-day tire wear forecasting
- **Anomaly Detection**: Identifies punctures, irregular wear, alignment issues
- **Fleet Management**: Monitor up to 20 vehicles with 4 tires each
- **Maintenance Scheduling**: Book appointments for various service types
- **Cost Estimation**: Automatic cost calculations for recommended services
- **Data Persistence**: Save and load ML models and appointment data
- **Professional CLI**: User-friendly terminal interface with emojis and colors

### Technical Details
- Python 3.8+ compatibility
- Scikit-learn for machine learning models
- Pandas for data manipulation
- Matplotlib/Seaborn for potential visualization extensions
- Modular architecture for easy extension and maintenance

### Performance
- Wear Prediction Model: R² score of ~0.45, MAE of ~0.5mm
- Anomaly Detection Model: ~90% accuracy
- Supports real-time analysis of 80 tires across 20 vehicles
- Fast CLI response times with efficient data processing