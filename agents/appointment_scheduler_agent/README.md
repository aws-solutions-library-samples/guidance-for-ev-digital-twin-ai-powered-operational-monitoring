# Appointment Scheduler Agent

Standalone AgentCore agent for scheduling vehicle maintenance appointments.

## Quick Start

### Deploy
```bash
bedrock-agentcore deploy
```

### Test
```bash
# Check available slots
bedrock-agentcore invoke --prompt "What appointment slots are available on 2025-11-20?"

# Schedule appointment
bedrock-agentcore invoke --prompt "Schedule a tire replacement for vehicle 1 on 2025-11-20 at 09:00 AM"

# Cancel appointment
bedrock-agentcore invoke --prompt "Cancel appointment for vehicle 1 on 2025-11-20 at 09:00 AM"
```

## Features
- ✅ DynamoDB integration
- ✅ Multiple service types
- ✅ Time slot management
- ✅ Confirmation numbers
- ✅ STM_ONLY memory (30-day expiry)

## Tools
1. `check_available_slots` - Query available slots
2. `schedule_appointment` - Book appointments
3. `cancel_appointment` - Cancel bookings

## Requirements
- AWS Account: 009296485814
- Region: us-east-1
- DynamoDB table: vehicle-appointment-slots
- IAM permissions for DynamoDB

## Model
Claude Sonnet 4.5 (global.anthropic.claude-sonnet-4-5-20250929-v1:0)

See `../AGENTCORE_STANDALONE_AGENTS.md` for full documentation.
