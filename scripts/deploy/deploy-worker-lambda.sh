#!/bin/bash

# Deploy Tire Order Worker Lambda
# This script packages and deploys the worker Lambda with all dependencies

set -e

echo "📦 Packaging tire order worker Lambda..."

# Create temp directory
rm -rf lambda-package
mkdir -p lambda-package

# Copy worker Lambda code
cp infrastructure/lambda/tire_order_worker.py lambda-package/

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
