#!/usr/bin/env python3
"""
Seed DynamoDB with appointment slots for the next 14 days.
Time slots: 7:00 AM - 6:00 PM (hourly intervals)
"""

import boto3
from datetime import datetime, timedelta

# Configuration
REGION = 'us-east-1'
TABLE_NAME = 'vehicle-appointment-slots'
DAYS_TO_GENERATE = 30

# Time slots (7 AM to 6 PM)
TIME_SLOTS = [
    "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
]

def seed_appointment_slots():
    """Generate and insert appointment slots into DynamoDB"""
    
    dynamodb = boto3.resource('dynamodb', region_name=REGION)
    table = dynamodb.Table(TABLE_NAME)
    
    start_date = datetime.now()
    total_slots = 0
    
    print(f"🚀 Seeding appointment slots for {DAYS_TO_GENERATE} days...")
    print(f"📅 Starting from: {start_date.strftime('%Y-%m-%d')}")
    print(f"⏰ Time slots per day: {len(TIME_SLOTS)}")
    print("-" * 60)
    
    for day in range(DAYS_TO_GENERATE):
        date = (start_date + timedelta(days=day)).strftime("%Y-%m-%d")
        
        for time_slot in TIME_SLOTS:
            try:
                table.put_item(Item={
                    'date': date,
                    'time_slot': time_slot,
                    'available': True,
                    'vehicle_id': None,
                    'service_type': None,
                    'booked_at': None,
                    'duration_minutes': 60
                })
                total_slots += 1
                print(f"✓ Created slot: {date} at {time_slot}")
                
            except Exception as e:
                print(f"✗ Error creating slot {date} {time_slot}: {e}")
    
    print("-" * 60)
    print(f"✅ Successfully seeded {total_slots} appointment slots")
    print(f"📊 Coverage: {DAYS_TO_GENERATE} days × {len(TIME_SLOTS)} slots = {total_slots} total slots")

if __name__ == "__main__":
    try:
        seed_appointment_slots()
    except Exception as e:
        print(f"❌ Error: {e}")
        exit(1)
