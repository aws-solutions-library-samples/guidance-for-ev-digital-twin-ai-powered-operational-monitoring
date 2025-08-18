#!/usr/bin/env python3
"""
PDF Manual Data Extractor

This script provides tools to extract tire specifications from PDF manuals
and create structured JSON extractions for the tire maintenance system.

Note: The current Honda Civic data was created programmatically based on 
typical Honda Civic specifications. This script provides a framework
for actual PDF extraction when needed.
"""

import json
import os
from datetime import datetime
import pandas as pd

class PDFManualExtractor:
    def __init__(self):
        self.extractions_dir = "manuals/extractions"
        self.ensure_directories()
    
    def ensure_directories(self):
        """Create necessary directories"""
        os.makedirs(self.extractions_dir, exist_ok=True)
        os.makedirs("manuals/verification_templates", exist_ok=True)
    
    def create_extraction_template(self, make, model, year, manual_file=None):
        """Create a blank extraction template for manual data entry"""
        
        template = {
            "vehicle_info": {
                "make": make,
                "model": model,
                "year": year,
                "manual_source": manual_file or f"{make}{model}{year}Manual.pdf",
                "extraction_date": datetime.now().strftime("%Y-%m-%d"),
                "extractor": "Manual Review",
                "verified": False
            },
            "tire_specifications": {
                "primary_tire_size": {
                    "size": "[TO BE FILLED FROM MANUAL]",
                    "load_index": "[TO BE FILLED FROM MANUAL]",
                    "speed_rating": "[TO BE FILLED FROM MANUAL]",
                    "tire_type": "[TO BE FILLED FROM MANUAL]",
                    "manual_page": "[PAGE NUMBER]",
                    "notes": "[ADDITIONAL NOTES]"
                },
                "alternative_sizes": [
                    {
                        "size": "[ALTERNATIVE SIZE IF ANY]",
                        "trim": "[TRIM LEVEL]",
                        "load_index": "[LOAD INDEX]",
                        "speed_rating": "[SPEED RATING]"
                    }
                ],
                "tire_pressure": {
                    "front_psi": "[FRONT PRESSURE FROM MANUAL]",
                    "rear_psi": "[REAR PRESSURE FROM MANUAL]",
                    "spare_psi": "[SPARE PRESSURE FROM MANUAL]",
                    "cold_pressure_note": "[COLD PRESSURE INSTRUCTIONS]",
                    "manual_page": "[PAGE NUMBER]",
                    "door_sticker_reference": "[DOOR STICKER LOCATION]"
                },
                "tread_depth": {
                    "minimum_legal_mm": "[MINIMUM LEGAL DEPTH]",
                    "replacement_recommended_mm": "[REPLACEMENT THRESHOLD]",
                    "measurement_method": "[HOW TO MEASURE]",
                    "manual_page": "[PAGE NUMBER]"
                }
            },
            "maintenance_schedule": {
                "tire_rotation": {
                    "interval_miles": "[ROTATION INTERVAL]",
                    "interval_months": "[ROTATION MONTHS]",
                    "rotation_pattern": "[ROTATION PATTERN]",
                    "manual_page": "[PAGE NUMBER]",
                    "special_conditions": "[SEVERE SERVICE CONDITIONS]"
                },
                "tire_inspection": {
                    "frequency": "[INSPECTION FREQUENCY]",
                    "inspection_points": [
                        "[WHAT TO INSPECT 1]",
                        "[WHAT TO INSPECT 2]",
                        "[WHAT TO INSPECT 3]"
                    ],
                    "manual_page": "[PAGE NUMBER]"
                },
                "replacement_indicators": {
                    "wear_indicators": "[WEAR INDICATOR INFO]",
                    "age_limit": "[AGE LIMIT INFO]",
                    "manual_page": "[PAGE NUMBER]"
                }
            },
            "vehicle_specifications": {
                "weight": {
                    "curb_weight_lbs": "[CURB WEIGHT]",
                    "gross_weight_lbs": "[GROSS WEIGHT]",
                    "manual_page": "[PAGE NUMBER]"
                },
                "engine": {
                    "engine_size": "[ENGINE SIZE]",
                    "engine_type": "[ENGINE TYPE]",
                    "horsepower": "[HORSEPOWER]",
                    "manual_page": "[PAGE NUMBER]"
                },
                "drivetrain": {
                    "type": "[FWD/RWD/AWD/4WD]",
                    "manual_page": "[PAGE NUMBER]"
                },
                "dimensions": {
                    "wheelbase": "[WHEELBASE]",
                    "track_front": "[FRONT TRACK]",
                    "track_rear": "[REAR TRACK]",
                    "manual_page": "[PAGE NUMBER]"
                }
            },
            "tpms_information": {
                "system_type": "[TPMS SYSTEM TYPE]",
                "warning_threshold": "[WARNING THRESHOLD]",
                "reset_procedure": "[RESET PROCEDURE]",
                "manual_page": "[PAGE NUMBER]"
            },
            "load_information": {
                "seating_capacity": "[SEATING CAPACITY]",
                "cargo_capacity": "[CARGO CAPACITY]",
                "towing_capacity": "[TOWING CAPACITY]",
                "tongue_weight": "[TONGUE WEIGHT]",
                "manual_page": "[PAGE NUMBER]"
            },
            "seasonal_recommendations": {
                "winter_tires": "[WINTER TIRE GUIDANCE]",
                "all_season_guidance": "[ALL SEASON GUIDANCE]",
                "performance_tires": "[PERFORMANCE TIRE INFO]",
                "manual_page": "[PAGE NUMBER]"
            },
            "warranty_information": {
                "tire_warranty": "[TIRE WARRANTY INFO]",
                "maintenance_requirements": "[MAINTENANCE REQUIREMENTS]",
                "manual_page": "[PAGE NUMBER]"
            },
            "verification": {
                "cross_checked_sources": [
                    "[SOURCE 1]",
                    "[SOURCE 2]",
                    "[SOURCE 3]"
                ],
                "discrepancies_found": [],
                "confidence_level": "[High/Medium/Low]",
                "reviewer": "[REVIEWER NAME]",
                "review_date": "[REVIEW DATE]"
            }
        }
        
        # Save template
        filename = f"{self.extractions_dir}/{year}_{make}_{model}_template.json"
        with open(filename, 'w') as f:
            json.dump(template, f, indent=2)
        
        print(f"📝 Created extraction template: {filename}")
        print(f"📖 Instructions:")
        print(f"   1. Open the PDF manual: manuals/{make}{model}{year}Manual.pdf")
        print(f"   2. Fill in all '[TO BE FILLED]' fields with actual manual data")
        print(f"   3. Include page numbers for all specifications")
        print(f"   4. Set 'verified': true when complete")
        print(f"   5. Run validation to check completeness")
        
        return filename
    
    def validate_extraction(self, extraction_file):
        """Validate a completed extraction"""
        try:
            with open(extraction_file, 'r') as f:
                data = json.load(f)
            
            print(f"\n🔍 VALIDATING: {extraction_file}")
            print("-" * 50)
            
            # Check if verified
            if not data.get('vehicle_info', {}).get('verified', False):
                print("⚠️  Extraction not marked as verified")
            
            # Count unfilled fields
            content = json.dumps(data)
            unfilled_count = content.count('[TO BE FILLED')
            
            if unfilled_count == 0:
                print("✅ All template fields completed")
            else:
                print(f"⚠️  {unfilled_count} fields still need to be filled")
            
            # Check critical fields
            critical_fields = [
                ('tire_specifications.tire_pressure.front_psi', 'Front tire pressure'),
                ('tire_specifications.primary_tire_size.size', 'Primary tire size'),
                ('maintenance_schedule.tire_rotation.interval_miles', 'Rotation interval'),
                ('vehicle_specifications.weight.curb_weight_lbs', 'Curb weight')
            ]
            
            missing_critical = []
            for field_path, description in critical_fields:
                value = self._get_nested_value(data, field_path)
                if not value or '[TO BE FILLED' in str(value):
                    missing_critical.append(description)
            
            if missing_critical:
                print(f"❌ Missing critical fields: {', '.join(missing_critical)}")
            else:
                print("✅ All critical fields completed")
            
            # Check page references
            page_refs = self._count_page_references(data)
            print(f"📄 Page references documented: {page_refs}")
            
            return unfilled_count == 0 and len(missing_critical) == 0
            
        except Exception as e:
            print(f"❌ Validation failed: {e}")
            return False
    
    def _get_nested_value(self, data, path):
        """Get value from nested dictionary using dot notation"""
        keys = path.split('.')
        value = data
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return None
        return value
    
    def _count_page_references(self, data):
        """Count documented page references"""
        count = 0
        def count_pages(obj):
            nonlocal count
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if key == "manual_page" and value and '[PAGE NUMBER]' not in str(value):
                        count += 1
                    elif isinstance(value, (dict, list)):
                        count_pages(value)
            elif isinstance(obj, list):
                for item in obj:
                    count_pages(item)
        
        count_pages(data)
        return count
    
    def convert_to_system_format(self, extraction_file):
        """Convert completed extraction to system format"""
        try:
            with open(extraction_file, 'r') as f:
                data = json.load(f)
            
            if not self.validate_extraction(extraction_file):
                print("❌ Cannot convert - extraction incomplete")
                return False
            
            # Update car_manual_specs.csv
            self._update_manual_specs(data)
            
            # Mark as system-ready
            data['vehicle_info']['system_integrated'] = True
            data['vehicle_info']['integration_date'] = datetime.now().strftime("%Y-%m-%d")
            
            # Save updated extraction
            with open(extraction_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            print("✅ Extraction converted and integrated into system")
            return True
            
        except Exception as e:
            print(f"❌ Conversion failed: {e}")
            return False
    
    def _update_manual_specs(self, data):
        """Update car_manual_specs.csv with extracted data"""
        try:
            # Load current specs
            specs_df = pd.read_csv("car_manual_specs.csv")
            
            # Extract vehicle info
            vehicle_info = data['vehicle_info']
            tire_specs = data['tire_specifications']
            maintenance = data['maintenance_schedule']
            vehicle_specs = data['vehicle_specifications']
            
            # Find matching entry
            mask = (
                (specs_df['make'] == vehicle_info['make']) &
                (specs_df['model'] == vehicle_info['model']) &
                (specs_df['year'] == vehicle_info['year'])
            )
            
            if mask.any():
                # Update existing entry
                specs_df.loc[mask, 'tire_size'] = tire_specs['primary_tire_size']['size']
                specs_df.loc[mask, 'recommended_pressure_psi'] = int(tire_specs['tire_pressure']['front_psi'])
                specs_df.loc[mask, 'min_tread_depth_mm'] = float(tire_specs['tread_depth']['minimum_legal_mm'])
                specs_df.loc[mask, 'replacement_threshold_mm'] = float(tire_specs['tread_depth']['replacement_recommended_mm'])
                specs_df.loc[mask, 'rotation_interval_miles'] = int(maintenance['tire_rotation']['interval_miles'])
                specs_df.loc[mask, 'curb_weight_lbs'] = int(vehicle_specs['weight']['curb_weight_lbs'])
                specs_df.loc[mask, 'engine_size'] = vehicle_specs['engine']['engine_size']
                specs_df.loc[mask, 'drivetrain'] = vehicle_specs['drivetrain']['type']
                
                # Add verification metadata
                if 'verified' not in specs_df.columns:
                    specs_df['verified'] = False
                if 'manual_source' not in specs_df.columns:
                    specs_df['manual_source'] = ''
                if 'verification_date' not in specs_df.columns:
                    specs_df['verification_date'] = ''
                
                specs_df.loc[mask, 'verified'] = True
                specs_df.loc[mask, 'manual_source'] = vehicle_info['manual_source']
                specs_df.loc[mask, 'verification_date'] = datetime.now().strftime("%Y-%m-%d")
                
                print(f"✅ Updated manual specs for {vehicle_info['make']} {vehicle_info['model']} {vehicle_info['year']}")
            else:
                print(f"⚠️  No matching entry found in manual specs")
            
            # Save updated specs
            specs_df.to_csv("car_manual_specs.csv", index=False)
            
        except Exception as e:
            print(f"❌ Manual specs update failed: {e}")
    
    def show_current_honda_civic_data(self):
        """Show the current Honda Civic extraction data"""
        honda_file = f"{self.extractions_dir}/2020_Honda_Civic_extraction.json"
        
        if os.path.exists(honda_file):
            print("📊 CURRENT HONDA CIVIC EXTRACTION:")
            print("-" * 40)
            
            with open(honda_file, 'r') as f:
                data = json.load(f)
            
            print(f"Source: {data['vehicle_info']['manual_source']}")
            print(f"Extraction Date: {data['vehicle_info']['extraction_date']}")
            print(f"Verified: {data['vehicle_info']['verified']}")
            
            tire_specs = data['tire_specifications']
            print(f"\nTire Specifications:")
            print(f"  Size: {tire_specs['primary_tire_size']['size']}")
            print(f"  Pressure: {tire_specs['tire_pressure']['front_psi']} PSI")
            print(f"  Rotation: {data['maintenance_schedule']['tire_rotation']['interval_miles']} miles")
            
            print(f"\nNote: This data was created programmatically based on")
            print(f"typical Honda Civic specifications, not extracted from the PDF.")
            print(f"Use this script to create templates for actual PDF extraction.")
        else:
            print("❌ Honda Civic extraction file not found")

def main():
    """Main extraction interface"""
    extractor = PDFManualExtractor()
    
    print("📖 PDF MANUAL DATA EXTRACTOR")
    print("=" * 40)
    print("Commands:")
    print("  template <make> <model> <year> - Create extraction template")
    print("  validate <file> - Validate extraction file")
    print("  convert <file> - Convert to system format")
    print("  honda - Show current Honda Civic data")
    print("  quit - Exit")
    
    while True:
        try:
            command = input("\n👉 Enter command: ").strip().split()
            
            if not command:
                continue
            
            if command[0].lower() == 'quit':
                break
            elif command[0].lower() == 'template' and len(command) == 4:
                extractor.create_extraction_template(command[1], command[2], int(command[3]))
            elif command[0].lower() == 'validate' and len(command) == 2:
                extractor.validate_extraction(command[1])
            elif command[0].lower() == 'convert' and len(command) == 2:
                extractor.convert_to_system_format(command[1])
            elif command[0].lower() == 'honda':
                extractor.show_current_honda_civic_data()
            else:
                print("❌ Invalid command. Type 'quit' to exit.")
        
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n👋 Goodbye!")

if __name__ == "__main__":
    main()