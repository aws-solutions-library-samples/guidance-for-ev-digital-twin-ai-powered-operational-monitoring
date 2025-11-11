# EV Preventive Maintenance AI Recommendation Guidelines

## Tire Pressure Recommendations

### Critical Low Pressure (< 28 PSI)
**Action**: IMMEDIATE - Stop driving and inflate tire
**Reasoning**: Below 85% of recommended pressure. Increases rolling resistance, heat generation, and risk of tire failure.
**Manual Reference**: Section 5.3 - Chronic Under-Inflation

### Warning Low Pressure (28-32 PSI)
**Action**: Within 24 hours - Inflate to recommended pressure
**Reasoning**: 85-95% of recommended. Causes increased energy consumption and uneven wear.
**Manual Reference**: Section 5.3 - Chronic Under-Inflation

### Over-Inflation (> 38 PSI)
**Action**: Within 1 week - Release air to recommended pressure
**Reasoning**: >110% of recommended. Reduces contact patch, harsh ride, center wear.
**Manual Reference**: Section 5.4 - Over-Inflation

## Tread Depth Recommendations

### Critical (< 3.2mm)
**Action**: IMMEDIATE - Replace tire
**Reasoning**: Below replacement threshold. Reduced traction, especially in wet conditions.
**Manual Reference**: Section 5 - Tire System Monitoring

### Warning (3.2-5.0mm)
**Action**: Within 1 month - Plan tire replacement
**Reasoning**: Approaching replacement threshold. Monitor closely.

## Temperature Recommendations

### Excessive Heat (> 60°C)
**Action**: IMMEDIATE - Stop and allow cooling
**Reasoning**: Indicates overload, under-inflation, or brake drag. Risk of tire failure.
**Manual Reference**: Section 5.5 - Excessive Heat Build-Up

### Warning Heat (40-60°C)
**Action**: Monitor - Take cooling breaks on long trips
**Reasoning**: Elevated but manageable. Common during highway driving.

## Motor Temperature Recommendations

### Critical (>= 95°C)
**Action**: IMMEDIATE - Reduce load, allow cooling
**Reasoning**: Above normal operating range. Risk of component damage.

### Warning (80-95°C)
**Action**: Monitor - Reduce sustained high-speed driving
**Reasoning**: Elevated temperature. Normal under heavy load but monitor.

## Maintenance Intervals (from Manual)

- **Tire Rotation**: Every 7,500 miles (12,000 km)
- **Tire Pressure Check**: Weekly (minimum monthly)
- **Wheel Alignment**: Every 12 months or after impact
- **Tire Replacement**: At 3.2mm tread depth or 6 years age
- **Valve Stem Replacement**: Every 5 years or with tire change

## Key Safety Thresholds

1. **Tire Pressure**: 32 PSI (sedans), 35 PSI (SUVs)
2. **Minimum Tread**: 3.2mm replacement, 1.6mm legal minimum
3. **Max Tire Temp**: 90°C absolute maximum
4. **Max Motor Temp**: 95°C warning, 110°C critical
5. **Pressure Loss Rate**: >2 PSI/week requires service

## AI Response Guidelines

When analyzing vehicle data:
1. Always reference specific manual sections
2. Provide clear action timelines (immediate, 24 hours, 1 week, 1 month)
3. Explain the reasoning behind recommendations
4. Prioritize safety-critical issues
5. Use manual threshold ranges for classifications
6. Provide specific PSI/temperature/depth values
7. Mention consequences of not addressing issues
