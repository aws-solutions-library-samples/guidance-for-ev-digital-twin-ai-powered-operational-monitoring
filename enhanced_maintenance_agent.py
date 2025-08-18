import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os
from maintenance_agent import MaintenanceAgent

class EnhancedMaintenanceAgent(MaintenanceAgent):
    """
    Enhanced maintenance agent that uses manufacturer-verified data
    for improved recommendations and analysis.
    """
    
    def __init__(self):
        super().__init__()
        self.manual_data = {}
        self.load_manual_specifications()
    
    def load_manual_specifications(self):
        """Load manufacturer-verified specifications from manual extractions"""
        extractions_dir = "manuals/extractions"
        
        if not os.path.exists(extractions_dir):
            print("⚠️  No manual extractions found. Using standard recommendations.")
            return
        
        # Load all manual extractions
        for filename in os.listdir(extractions_dir):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(extractions_dir, filename), 'r') as f:
                        data = json.load(f)
                        
                    # Extract vehicle key
                    vehicle_info = data.get('vehicle_info', {})
                    key = f"{vehicle_info.get('make')}_{vehicle_info.get('model')}_{vehicle_info.get('year')}"
                    
                    if vehicle_info.get('verified', False):
                        self.manual_data[key] = data
                        print(f"✅ Loaded verified data for {key}")
                    
                except Exception as e:
                    print(f"⚠️  Error loading {filename}: {e}")
    
    def analyze_tire_condition(self, vehicle_id, tire_data, manual_data):
        """Enhanced tire condition analysis using manufacturer data"""
        # Get base analysis
        analysis = super().analyze_tire_condition(vehicle_id, tire_data, manual_data)
        
        if "error" in analysis:
            return analysis
        
        # Get vehicle info
        vehicle_info = analysis["vehicle_info"]
        manual_key = f"{vehicle_info['make']}_{vehicle_info['model']}_{vehicle_info['year']}"
        
        # Check if we have manufacturer-verified data
        if manual_key in self.manual_data:
            print(f"🔍 Using manufacturer-verified data for {manual_key}")
            analysis = self._enhance_with_manual_data(analysis, self.manual_data[manual_key])
            analysis["data_source"] = "manufacturer_verified"
            analysis["manual_reference"] = self.manual_data[manual_key]['vehicle_info']['manual_source']
        else:
            analysis["data_source"] = "synthesized"
            analysis["manual_reference"] = None
        
        return analysis
    
    def _enhance_with_manual_data(self, analysis, manual_specs):
        """Enhance analysis with manufacturer-verified specifications"""
        
        # Update tire specifications with verified data
        tire_specs = manual_specs.get('tire_specifications', {})
        
        if tire_specs:
            # Update pressure recommendations
            pressure_info = tire_specs.get('tire_pressure', {})
            if pressure_info.get('front_psi'):
                analysis['manufacturer_pressure'] = {
                    'front': pressure_info['front_psi'],
                    'rear': pressure_info.get('rear_psi', pressure_info['front_psi']),
                    'source_page': pressure_info.get('manual_page', 'Unknown')
                }
            
            # Update tread depth requirements
            tread_info = tire_specs.get('tread_depth', {})
            if tread_info.get('minimum_legal_mm'):
                analysis['manufacturer_tread_requirements'] = {
                    'minimum_legal': tread_info['minimum_legal_mm'],
                    'replacement_recommended': tread_info.get('replacement_recommended_mm'),
                    'source_page': tread_info.get('manual_page', 'Unknown')
                }
        
        # Update maintenance schedule with verified data
        maintenance_info = manual_specs.get('maintenance_schedule', {})
        if maintenance_info:
            rotation_info = maintenance_info.get('tire_rotation', {})
            if rotation_info.get('interval_miles'):
                analysis['manufacturer_maintenance'] = {
                    'rotation_interval': rotation_info['interval_miles'],
                    'rotation_pattern': rotation_info.get('rotation_pattern', 'Standard'),
                    'inspection_frequency': maintenance_info.get('tire_inspection', {}).get('frequency', 'Monthly'),
                    'source_page': rotation_info.get('manual_page', 'Unknown')
                }
        
        # Enhanced recommendations based on manual data
        analysis['recommendations'] = self._generate_manual_based_recommendations(
            analysis, manual_specs
        )
        
        return analysis
    
    def _generate_manual_based_recommendations(self, analysis, manual_specs):
        """Generate recommendations based on manufacturer specifications"""
        recommendations = []
        
        # Get manufacturer specifications
        tire_specs = manual_specs.get('tire_specifications', {})
        maintenance_specs = manual_specs.get('maintenance_schedule', {})
        
        # Check each tire against manufacturer specifications
        for position, condition in analysis["current_condition"].items():
            
            # Pressure recommendations based on manual
            pressure_info = tire_specs.get('tire_pressure', {})
            if pressure_info.get('front_psi'):
                recommended_psi = float(pressure_info['front_psi'])
                current_psi = condition['pressure_psi']
                
                if abs(current_psi - recommended_psi) > 2:
                    recommendations.append({
                        "priority": "HIGH" if abs(current_psi - recommended_psi) > 5 else "MEDIUM",
                        "action": f"Adjust {position} tire pressure to {recommended_psi} PSI",
                        "reason": f"Current pressure {current_psi} PSI deviates from Honda manual specification",
                        "estimated_cost": "Free",
                        "manual_reference": f"Page {pressure_info.get('manual_page', 'N/A')}",
                        "manufacturer_verified": True
                    })
            
            # Tread depth recommendations based on manual
            tread_info = tire_specs.get('tread_depth', {})
            if tread_info.get('minimum_legal_mm'):
                min_legal = float(tread_info['minimum_legal_mm'])
                replacement_threshold = float(tread_info.get('replacement_recommended_mm', min_legal * 2))
                current_depth = condition['tread_depth_mm']
                
                if current_depth < min_legal:
                    recommendations.append({
                        "priority": "URGENT",
                        "action": f"Replace {position} tire immediately - below legal limit",
                        "reason": f"Tread depth {current_depth}mm below Honda manual minimum {min_legal}mm",
                        "estimated_cost": "$150-250",
                        "manual_reference": f"Page {tread_info.get('manual_page', 'N/A')}",
                        "manufacturer_verified": True
                    })
                elif current_depth < replacement_threshold:
                    recommendations.append({
                        "priority": "HIGH",
                        "action": f"Schedule {position} tire replacement soon",
                        "reason": f"Tread depth {current_depth}mm approaching Honda manual replacement threshold {replacement_threshold}mm",
                        "estimated_cost": "$150-250",
                        "manual_reference": f"Page {tread_info.get('manual_page', 'N/A')}",
                        "manufacturer_verified": True
                    })
        
        # Maintenance schedule recommendations
        rotation_info = maintenance_specs.get('tire_rotation', {})
        if rotation_info.get('interval_miles'):
            interval = rotation_info['interval_miles']
            recommendations.append({
                "priority": "LOW",
                "action": f"Schedule tire rotation every {interval} miles",
                "reason": f"Honda manual maintenance schedule requirement",
                "estimated_cost": "$50-80",
                "manual_reference": f"Page {rotation_info.get('manual_page', 'N/A')}",
                "manufacturer_verified": True
            })
        
        # TPMS recommendations if available
        tpms_info = manual_specs.get('tpms_information', {})
        if tpms_info.get('warning_threshold'):
            threshold = tpms_info['warning_threshold']
            recommendations.append({
                "priority": "LOW",
                "action": f"Monitor TPMS warnings - system alerts at {threshold} PSI",
                "reason": "Honda TPMS system specification",
                "estimated_cost": "Free",
                "manual_reference": f"Page {tpms_info.get('manual_page', 'N/A')}",
                "manufacturer_verified": True
            })
        
        # Seasonal recommendations if available
        seasonal_info = manual_specs.get('seasonal_recommendations', {})
        if seasonal_info.get('winter_tires'):
            recommendations.append({
                "priority": "LOW",
                "action": "Consider seasonal tire changes",
                "reason": seasonal_info['winter_tires'],
                "estimated_cost": "$400-800",
                "manual_reference": f"Page {seasonal_info.get('manual_page', 'N/A')}",
                "manufacturer_verified": True
            })
        
        return recommendations
    
    def generate_maintenance_report(self, vehicle_id, tire_data, manual_data):
        """Generate enhanced maintenance report with manufacturer verification"""
        report = super().generate_maintenance_report(vehicle_id, tire_data, manual_data)
        
        # Add manufacturer verification information
        vehicle_analysis = report['vehicle_analysis']
        vehicle_info = vehicle_analysis['vehicle_info']
        manual_key = f"{vehicle_info['make']}_{vehicle_info['model']}_{vehicle_info['year']}"
        
        if manual_key in self.manual_data:
            manual_spec = self.manual_data[manual_key]
            report['manufacturer_verification'] = {
                'verified': True,
                'manual_source': manual_spec['vehicle_info']['manual_source'],
                'extraction_date': manual_spec['vehicle_info']['extraction_date'],
                'confidence_level': manual_spec.get('verification', {}).get('confidence_level', 'Unknown'),
                'page_references': self._extract_page_references(manual_spec)
            }
        else:
            report['manufacturer_verification'] = {
                'verified': False,
                'note': 'Recommendations based on industry standards. Verify against manufacturer manual for production use.'
            }
        
        return report
    
    def _extract_page_references(self, manual_spec):
        """Extract all page references from manual specification"""
        page_refs = []
        
        def extract_pages(obj, section=""):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if key == "manual_page" and value:
                        page_refs.append(f"{section}: Page {value}")
                    elif isinstance(value, (dict, list)):
                        extract_pages(value, key)
            elif isinstance(obj, list):
                for item in obj:
                    extract_pages(item, section)
        
        extract_pages(manual_spec)
        return page_refs
    
    def get_manufacturer_compliance_status(self, vehicle_id, tire_data, manual_data):
        """Check compliance with manufacturer specifications"""
        analysis = self.analyze_tire_condition(vehicle_id, tire_data, manual_data)
        
        if analysis.get('data_source') != 'manufacturer_verified':
            return {
                'compliant': None,
                'note': 'Cannot determine compliance - no manufacturer data available'
            }
        
        compliance_issues = []
        
        # Check manufacturer recommendations
        for rec in analysis.get('recommendations', []):
            if rec.get('manufacturer_verified') and rec['priority'] in ['URGENT', 'HIGH']:
                compliance_issues.append(rec['action'])
        
        return {
            'compliant': len(compliance_issues) == 0,
            'issues': compliance_issues,
            'manual_reference': analysis.get('manual_reference'),
            'verification_status': 'manufacturer_verified'
        }

if __name__ == "__main__":
    # Test the enhanced maintenance agent
    agent = EnhancedMaintenanceAgent()
    
    # Load test data
    tire_data = pd.read_csv("tire_wear_data.csv")
    manual_data = pd.read_csv("car_manual_specs.csv")
    
    # Test with Honda Civic if available
    honda_civics = tire_data[
        (tire_data['make'] == 'Honda') & 
        (tire_data['model'] == 'Civic') & 
        (tire_data['year'] == 2020)
    ]
    
    if not honda_civics.empty:
        vehicle_id = honda_civics['vehicle_id'].iloc[0]
        print(f"🚗 Testing enhanced analysis for Honda Civic (Vehicle {vehicle_id})")
        
        analysis = agent.analyze_tire_condition(vehicle_id, tire_data, manual_data)
        
        print("\n=== ENHANCED TIRE MAINTENANCE ANALYSIS ===")
        print(f"Data Source: {analysis.get('data_source', 'Unknown')}")
        if analysis.get('manual_reference'):
            print(f"Manual Reference: {analysis['manual_reference']}")
        
        print(f"\n📊 RECOMMENDATIONS ({len(analysis.get('recommendations', []))}):")
        for i, rec in enumerate(analysis.get('recommendations', []), 1):
            verified_icon = "✅" if rec.get('manufacturer_verified') else "⚠️"
            print(f"{i}. {verified_icon} {rec['action']}")
            if rec.get('manual_reference'):
                print(f"   📖 {rec['manual_reference']}")
    else:
        print("No Honda Civic data found for testing")