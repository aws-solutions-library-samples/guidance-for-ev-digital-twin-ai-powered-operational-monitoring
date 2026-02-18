#!/bin/bash

# Deploy Async Tire Order Updates
# This script deploys the frontend changes for async tire ordering

set -e

echo "🚀 Deploying Async Tire Order Updates..."

# Step 1: Build frontend
echo ""
echo "📦 Building frontend..."
cd frontend/ev-digital-twin-tire-maintainence-system
npm run build

# Step 2: Deploy to S3
echo ""
echo "☁️  Deploying to S3..."
aws s3 sync build/ s3://ev-digital-twin-frontend --delete

# Step 3: Invalidate CloudFront cache
echo ""
echo "🔄 Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='ev-digital-twin-frontend.s3.amazonaws.com']].Id" --output text)

if [ -n "$DISTRIBUTION_ID" ]; then
  aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
  echo "✅ CloudFront cache invalidated"
else
  echo "⚠️  Could not find CloudFront distribution"
fi

cd ../..

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎉 Async tire ordering is now live!"
echo ""
echo "Test it by:"
echo "1. Go to Fleet Portal"
echo "2. Click on Vehicle 1 (EV-1001)"
echo "3. Approve tire maintenance with 'Order tires online' checked"
echo "4. Watch the progress updates as the order processes"
echo ""
