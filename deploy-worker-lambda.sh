#!/bin/bash

# Deploy Tire Order Worker Lambda
# This script packages and deploys the worker Lambda with all dependencies

set -e

echo "📦 Packaging tire order worker Lambda..."

# Create temp directory
rm -rf lambda-package
mkdir -p lambda-package

# Copy Python files
cp tire_order_worker.py lambda-package/
cp agentcore_maintenance_agent.py lambda-package/
cp agentcore_runtime_app.py lambda-package/
cp knowledge-base/knowledge_base_tools.py lambda-package/
cp tire_predictor.py lambda-package/
cp tire_wear_data.csv lambda-package/
cp motor_sensor_data.csv lambda-package/
cp inverter_sensor_data.csv lambda-package/
cp car_manual_specs.csv lambda-package/
cp tire_models_*.pkl lambda-package/ 2>/dev/null || true

# Install dependencies
echo "📥 Installing Python dependencies..."
pip3 install -r requirements-agentcore.txt -t lambda-package/ --quiet

# Create zip
echo "🗜️  Creating deployment package..."
cd lambda-package
zip -r ../tire-order-worker.zip . -q
cd ..

echo "☁️  Deploying to Lambda..."
aws lambda update-function-code \
  --function-name ev-digital-twin-tire-order-worker \
  --zip-file fileb://tire-order-worker.zip \
  --region us-east-1

echo "⏳ Waiting for Lambda to update..."
aws lambda wait function-updated \
  --function-name ev-digital-twin-tire-order-worker \
  --region us-east-1

# Cleanup
rm -rf lambda-package
rm tire-order-worker.zip

echo "✅ Worker Lambda deployed successfully!"
echo ""
echo "🧪 Test it with:"
echo "curl -X POST https://b4blc4xmh4.execute-api.us-east-1.amazonaws.com/tire-order/start \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"vehicle_id\": \"1\"}'"
