#!/usr/bin/env python3
"""
Vehicle Specification Verification Tool

This script helps verify vehicle specifications against official sources
and provides a framework for data quality assurance.
"""

import pandas as pd
import json
from datetime import datetime
import os

class VehicleVerifier:
    def __init__(self):
        self.specs_file = "car_manual_specs.csv"
        self.sources_file = "manuals/manual_sources.csv"
        self.load_data()
    
    def load_data(self):
        """Load vehicle specifications and source data"""
        try:
            self.specs_df = pd.read_csv(self.specs_file)
            self.sources_df = pd.read_csv(self.sources_file)
            print(f"✅ Loaded {len(self.specs_df)} vehicle specifications")
            print(f"✅ Loaded {len(self.sources_df)} verification sources")
        except FileNotFoundError as e:
            print(f"❌ Error loading data: {e}")
            return False
        return True
    
    def verify_vehicle(self, make, model, year):
        """Verify specifications for a specific vehicle"""
        print(f"\n🔍 VERIFYING: {year} {make} {model}")
        print("=" * 50)
        
        # Find vehicle in our database
        vehicle = self.specs_df[
            (self.specs_df['make'] == make) & 
            (self.specs_df['model'] == model) & 
            (self.specs_df['year'] == year)
        ]
        
        if vehicle.empty:
            print(f"❌ Vehicle not found in database")
            return False
        
        vehicle_data = vehicle.iloc[0]
        
        # Display our specifications
        print("📊 OUR SPECIFICATIONS:")
        print(f"   Tire Size: {vehicle_data['tire_size']}")
        print(f"   Recommended Pressure: {vehicle_data['recommended_pressure_psi']} PSI")
        print(f"   Min Tread Depth: {vehicle_data['min_tread_depth_mm']}mm")
        print(f"   Replacement Threshold: {vehicle_data['replacement_threshold_mm']}mm")
        print(f"   Rotation Interval: {vehicle_data['rotation_interval_miles']} miles")
        print(f"   Expected Lifespan: {vehicle_data['expected_lifespan_miles']} miles")
        print(f"   Curb Weight: {vehicle_data['curb_weight_lbs']} lbs")
        print(f"   Engine: {vehicle_data['engine_size']}")
        print(f"   Drivetrain: {vehicle_data['drivetrain']}")
        
        # Find verification source
        source = self.sources_df[
            (self.sources_df['make'] == make) & 
            (self.sources_df['model'] == model) & 
            (self.sources_df['year'] == year)
        ]
        
        if not source.empty:
            source_data = source.iloc[0]
            print(f"\n📚 VERIFICATION SOURCE:")
            print(f"   Type: {source_data['source_type']}")
            print(f"   URL: {source_data['source_url']}")
            print(f"   Last Verified: {source_data['verification_date']}")
            print(f"   Notes: {source_data['notes']}")
        else:
            print(f"\n⚠️  NO VERIFICATION SOURCE FOUND")
            self.suggest_verification_sources(make, model, year)
        
        return True
    
    def suggest_verification_sources(self, make, model, year):
        """Suggest where to find verification sources"""
        print(f"\n💡 SUGGESTED VERIFICATION SOURCES:")
        
        manufacturer_urls = {
            "Toyota": "https://www.toyota.com/owners/",
            "Honda": "https://owners.honda.com/",
            "Ford": "https://owner.ford.com/",
            "BMW": "https://www.bmwusa.com/owners/",
            "Mercedes-Benz": "https://www.mbusa.com/owners/",
            "Audi": "https://www.audiusa.com/owners/",
            "Lexus": "https://drivers.lexus.com/",
            "Nissan": "https://www.nissanusa.com/owners/",
            "Hyundai": "https://www.hyundaiusa.com/owners/",
            "Kia": "https://www.kia.com/owners/",
            "Subaru": "https://www.subaru.com/owners/",
            "Mazda": "https://www.mazdausa.com/owners/",
            "Chevrolet": "https://www.chevrolet.com/owners/",
            "GMC": "https://www.gmc.com/owners/",
            "Jeep": "https://www.jeep.com/owners/",
            "Ram": "https://www.ramtrucks.com/owners/",
            "Volkswagen": "https://www.vw.com/owners/",
            "Acura": "https://owners.acura.com/",
            "Infiniti": "https://www.infinitiusa.com/owners/"
        }
        
        if make in manufacturer_urls:
            print(f"   1. Official {make} Owner's Portal: {manufacturer_urls[make]}")
        
        print(f"   2. Search: '{year} {make} {model} owner manual PDF'")
        print(f"   3. Check vehicle door jamb sticker for tire specifications")
        print(f"   4. VIN lookup on manufacturer website")
    
    def batch_verify(self, sample_size=10):
        """Verify a sample of vehicles"""
        print(f"\n🔄 BATCH VERIFICATION ({sample_size} vehicles)")
        print("=" * 60)
        
        # Get unique vehicles
        unique_vehicles = self.specs_df[['make', 'model', 'year']].drop_duplicates()
        sample_vehicles = unique_vehicles.sample(n=min(sample_size, len(unique_vehicles)))
        
        verified_count = 0
        for _, vehicle in sample_vehicles.iterrows():
            if self.verify_vehicle(vehicle['make'], vehicle['model'], vehicle['year']):
                verified_count += 1
            print()  # Add spacing
        
        print(f"📊 BATCH SUMMARY: {verified_count}/{len(sample_vehicles)} vehicles processed")
    
    def generate_verification_report(self):
        """Generate a comprehensive verification report"""
        print("\n📋 GENERATING VERIFICATION REPORT")
        print("=" * 50)
        
        # Count vehicles by manufacturer
        manufacturer_counts = self.specs_df['make'].value_counts()
        print(f"\n🏭 VEHICLES BY MANUFACTURER:")
        for make, count in manufacturer_counts.items():
            print(f"   {make}: {count} models")
        
        # Count vehicles with verification sources
        verified_vehicles = len(self.sources_df)
        total_vehicles = len(self.specs_df)
        verification_rate = (verified_vehicles / total_vehicles) * 100
        
        print(f"\n✅ VERIFICATION STATUS:")
        print(f"   Total Vehicles: {total_vehicles}")
        print(f"   With Sources: {verified_vehicles}")
        print(f"   Verification Rate: {verification_rate:.1f}%")
        
        # Identify missing sources
        specs_vehicles = set(zip(self.specs_df['make'], self.specs_df['model'], self.specs_df['year']))
        source_vehicles = set(zip(self.sources_df['make'], self.sources_df['model'], self.sources_df['year']))
        missing_sources = specs_vehicles - source_vehicles
        
        if missing_sources:
            print(f"\n⚠️  MISSING VERIFICATION SOURCES ({len(missing_sources)}):")
            for make, model, year in sorted(missing_sources)[:10]:  # Show first 10
                print(f"   {year} {make} {model}")
            if len(missing_sources) > 10:
                print(f"   ... and {len(missing_sources) - 10} more")
    
    def create_verification_template(self, make, model, year):
        """Create a template for manual verification"""
        template = {
            "vehicle": {
                "make": make,
                "model": model,
                "year": year
            },
            "verification_date": datetime.now().strftime("%Y-%m-%d"),
            "verifier": "TBD",
            "sources_checked": [
                {
                    "source_type": "Owner's Manual",
                    "url": "TBD",
                    "page_reference": "TBD",
                    "verified": False
                },
                {
                    "source_type": "Door Jamb Sticker",
                    "photo_available": False,
                    "verified": False
                }
            ],
            "specifications": {
                "tire_size": "TBD",
                "recommended_pressure_psi": "TBD",
                "min_tread_depth_mm": "TBD",
                "load_index": "TBD",
                "speed_rating": "TBD"
            },
            "discrepancies": [],
            "notes": ""
        }
        
        filename = f"manuals/verification_templates/{year}_{make}_{model}_verification.json"
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        with open(filename, 'w') as f:
            json.dump(template, f, indent=2)
        
        print(f"📝 Created verification template: {filename}")
        return filename

def main():
    """Main verification interface"""
    verifier = VehicleVerifier()
    
    if not verifier.load_data():
        return
    
    print("\n🚗 VEHICLE SPECIFICATION VERIFIER")
    print("=" * 50)
    print("Commands:")
    print("  verify <make> <model> <year> - Verify specific vehicle")
    print("  batch <number> - Verify random sample")
    print("  report - Generate verification report")
    print("  template <make> <model> <year> - Create verification template")
    print("  quit - Exit")
    
    while True:
        try:
            command = input("\n👉 Enter command: ").strip().split()
            
            if not command:
                continue
            
            if command[0].lower() == 'quit':
                break
            elif command[0].lower() == 'verify' and len(command) == 4:
                verifier.verify_vehicle(command[1], command[2], int(command[3]))
            elif command[0].lower() == 'batch':
                sample_size = int(command[1]) if len(command) > 1 else 10
                verifier.batch_verify(sample_size)
            elif command[0].lower() == 'report':
                verifier.generate_verification_report()
            elif command[0].lower() == 'template' and len(command) == 4:
                verifier.create_verification_template(command[1], command[2], int(command[3]))
            else:
                print("❌ Invalid command. Type 'quit' to exit.")
        
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n👋 Goodbye!")

if __name__ == "__main__":
    main()