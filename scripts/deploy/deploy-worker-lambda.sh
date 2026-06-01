#!/bin/bash

# Deploy Tire Order Worker Lambda
# This script packages and deploys the worker Lambda with all dependencies

set -e

AWS_REGION="${AWS_REGION:?AWS_REGION env var must be set (e.g., us-east-1)}"
TIRE_ORDER_WORKER_FUNCTION="${TIRE_ORDER_WORKER_FUNCTION:?TIRE_ORDER_WORKER_FUNCTION env var must be set (e.g., <your-tire-order-worker-lambda-name>)}"

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
  --function-name "$TIRE_ORDER_WORKER_FUNCTION" \
  --zip-file fileb://tire-order-worker.zip \
  --region "$AWS_REGION"

echo "⏳ Waiting for Lambda to update..."
aws lambda wait function-updated \
  --function-name "$TIRE_ORDER_WORKER_FUNCTION" \
  --region "$AWS_REGION"

# Cleanup
rm -rf lambda-package
rm tire-order-worker.zip

echo "✅ Worker Lambda deployed successfully!"
echo ""
