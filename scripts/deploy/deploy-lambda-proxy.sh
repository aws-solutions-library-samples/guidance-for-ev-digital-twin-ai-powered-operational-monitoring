#!/bin/bash
set -e

echo "🚀 Deploying AgentCore Lambda Proxy"
echo "===================================="
echo ""

# Package Lambda
echo "📦 Packaging Lambda function..."
cd infrastructure/lambda
zip -q lambda-proxy.zip index.py
echo "✅ Lambda packaged"

# Update Lambda function
echo "📤 Uploading to AWS Lambda..."
aws lambda update-function-code \
  --function-name ev-digital-twin-agentcore-proxy \
  --zip-file fileb://lambda-proxy.zip \
  --region us-east-1

echo "✅ Lambda function updated"

# Clean up
rm lambda-proxy.zip
cd ../..

echo ""
echo "🎉 Lambda proxy deployed successfully!"
echo ""
echo "The Lambda now has:"
echo "  ✅ Latest /genai-recs/{vin} endpoint"
echo "  ✅ 5-minute action logs time window"
echo "  ✅ Browser live view endpoint"
echo "  ✅ Tire order async endpoints"
echo ""
