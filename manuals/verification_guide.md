# Manual Verification Guide

## How to Verify Vehicle Specifications

### Step 1: Locate Official Documentation

For each vehicle in our database, you can verify specifications using these methods:

#### Method 1: Manufacturer Websites
- Visit the official manufacturer website
- Navigate to "Owners" or "Support" section
- Download the owner's manual PDF for the specific year/model

#### Method 2: Physical Vehicle Inspection
- **Tire Pressure**: Check the sticker on driver's side door jamb
- **Tire Size**: Read sidewall of current tires
- **Load Rating**: Found on tire sidewall (e.g., 91H)

#### Method 3: VIN Lookup
- Use manufacturer VIN lookup tools
- Provides original equipment specifications
- Confirms tire size, pressure, and load ratings

### Step 2: Key Sections to Check

#### In Owner's Manuals:
1. **"Tire and Loading Information"** (usually Chapter 8-9)
   - Recommended tire pressure
   - Tire size specifications
   - Load index and speed rating

2. **"Maintenance Schedule"** (usually Chapter 7)
   - Tire rotation intervals
   - Inspection requirements

3. **"Vehicle Specifications"** (usually Appendix)
   - Curb weight
   - Engine specifications
   - Drivetrain type

### Step 3: Cross-Reference Our Data

Compare our `car_manual_specs.csv` data with official sources:

```csv
Example verification for 2020 Toyota Camry:
Our Data: 215/60R16, 32 PSI, 1.6mm min, 3340 lbs
Manual: Page 456 - "215/60R16 91H, 32 PSI front/rear"
Door Sticker: "215/60R16 91H, Cold Tire Pressure 32 PSI"
✓ VERIFIED
```

### Step 4: Common Discrepancies to Watch

1. **Pressure Variations**: Some vehicles have different front/rear pressures
2. **Optional Tire Sizes**: Higher trims may have larger wheels
3. **Regional Differences**: US vs European specifications may vary
4. **Model Year Changes**: Mid-year updates can change specifications

### Step 5: Documentation Standards

When verifying data, document:
- Source of verification (manual page, door sticker, etc.)
- Date of verification
- Any discrepancies found
- Photos of door stickers (if available)

## Sample Verification Process

### Toyota Camry 2020 Verification

**Our Database Entry:**
```
Make: Toyota
Model: Camry  
Year: 2020
Tire Size: 215/60R16
Recommended Pressure: 32 PSI
Min Tread Depth: 1.6mm
Curb Weight: 3340 lbs
```

**Verification Sources:**
1. **Owner's Manual**: OM06019U, Page 456
   - Confirms: 215/60R16 91H tires
   - Confirms: 32 PSI cold pressure
   - Confirms: 1.6mm minimum tread depth

2. **Door Jamb Sticker**: 
   - "TIRE 215/60R16 91H"
   - "COLD TIRE PRESSURE 32 PSI"

3. **EPA Data**:
   - Curb Weight: 3,340 lbs (LE trim)
   - Engine: 2.5L 4-cylinder

**Result**: ✅ VERIFIED - All specifications match

## Automated Verification Tools

### Script to Check Specifications
```python
# verification_tool.py - Check our data against known sources
import pandas as pd

def verify_vehicle_specs(make, model, year):
    # Load our data
    our_data = pd.read_csv('car_manual_specs.csv')
    
    # Load verification sources
    sources = pd.read_csv('manuals/manual_sources.csv')
    
    # Find matching vehicle
    vehicle = our_data[
        (our_data['make'] == make) & 
        (our_data['model'] == model) & 
        (our_data['year'] == year)
    ]
    
    if not vehicle.empty:
        print(f"Found {make} {model} {year}")
        print(f"Tire Size: {vehicle.iloc[0]['tire_size']}")
        print(f"Pressure: {vehicle.iloc[0]['recommended_pressure_psi']} PSI")
        
        # Find verification source
        source = sources[
            (sources['make'] == make) & 
            (sources['model'] == model) & 
            (sources['year'] == year)
        ]
        
        if not source.empty:
            print(f"Verification Source: {source.iloc[0]['source_url']}")
        else:
            print("⚠️  No verification source found")
    else:
        print(f"❌ Vehicle not found: {make} {model} {year}")

# Example usage
verify_vehicle_specs("Toyota", "Camry", 2020)
```

## Quality Assurance Checklist

Before accepting any vehicle specification:

- [ ] Tire size matches OEM specification
- [ ] Pressure is within manufacturer range (±2 PSI)
- [ ] Load index supports vehicle weight
- [ ] Speed rating appropriate for vehicle class
- [ ] Tread depth follows legal minimums
- [ ] Rotation interval matches maintenance schedule
- [ ] Source documentation is official/authoritative
- [ ] Data entry has been double-checked

## Reporting Discrepancies

If you find discrepancies between our data and official sources:

1. **Document the Issue**:
   - Vehicle details (make/model/year)
   - Our current data
   - Correct data from official source
   - Source reference (manual page, URL, etc.)

2. **Create Issue Report**:
   - File: `manuals/discrepancy_reports/YYYY-MM-DD_vehicle_issue.md`
   - Include photos/screenshots if available

3. **Update Process**:
   - Correct the data in `car_manual_specs.csv`
   - Update verification date in `manual_sources.csv`
   - Document the change in changelog

This verification system ensures our tire maintenance data remains accurate and trustworthy for production use.