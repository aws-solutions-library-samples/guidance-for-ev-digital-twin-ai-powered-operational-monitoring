# Tire Ordering Agent

Standalone AgentCore agent for ordering tires online using browser automation.

## Quick Start

### Deploy
```bash
bedrock-agentcore deploy
```

### Test
```bash
# Get tire specs
bedrock-agentcore invoke --prompt "What are the tire specifications for vehicle 1?"

# Order tires
bedrock-agentcore invoke --prompt "Order replacement tires for vehicle 1"

# Search prices
bedrock-agentcore invoke --prompt "Search for tire prices for 215/55R17"
```

## Features
- ✅ Browser automation (Nova Act SDK)
- ✅ Amazon.com integration
- ✅ Automatic tire size lookup
- ✅ Product details extraction
- ✅ STM_ONLY memory (30-day expiry)

## Tools
1. `get_vehicle_tire_specs` - Retrieve tire specifications
2. `order_tire_online` - Automated Amazon ordering
3. `search_tire_prices` - Price search

## Requirements
- AWS Account: YOUR_ACCOUNT_ID
- Region: us-east-1
- Nova Act API Key: stored in AWS Secrets Manager (`/vehicle-maintenance/novaact-api-key`)
- AgentCore Browser Tool access
- Data files: tire_wear_data.csv, car_manual_specs.csv

## Model
Claude Sonnet 4.5 (global.anthropic.claude-sonnet-4-5-20250929-v1:0)

See `../AGENTCORE_STANDALONE_AGENTS.md` for full documentation.
