#!/bin/bash
set -e

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="ev-digital-twin-backend"
IMAGE_TAG="latest"

echo "🚀 Starting EV Digital Twin deployment..."

# Step 1: Create ECR repository if it doesn't exist
echo "📦 Setting up ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION 2>/dev/null || \
aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION

# Step 2: Build and push backend for x86_64 architecture
echo "🐳 Building and pushing backend image for x86_64 architecture..."
# Build for x86_64 platform (ECS Fargate requirement)
docker buildx build --platform linux/amd64 -t $ECR_REPO .
docker tag $ECR_REPO:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG

# Step 3: Deploy ECS infrastructure
echo "🏗️ Deploying ECS infrastructure..."
aws cloudformation deploy \
  --template-file infrastructure/ecs-infrastructure.yaml \
  --stack-name ev-digital-twin-ecs \
  --parameter-overrides ImageURI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $AWS_REGION

# Step 4: Deploy frontend infrastructure
echo "🌐 Deploying frontend infrastructure..."
aws cloudformation deploy \
  --template-file infrastructure/frontend-infrastructure.yaml \
  --stack-name ev-digital-twin-frontend \
  --region $AWS_REGION

# Step 5: Build and deploy frontend
echo "⚛️ Building and deploying frontend..."
cd frontend/ev-digital-twin-tire-maintainence-system

ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-ecs \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --region $AWS_REGION)

echo "REACT_APP_API_URL=http://$ALB_DNS" > .env.production
npm install
npm run build

BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
  --output text \
  --region $AWS_REGION)

aws s3 sync build/ s3://$BUCKET_NAME/ --delete --region $AWS_REGION

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text \
  --region $AWS_REGION)

aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

# Step 6: Display URLs
CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
  --output text \
  --region $AWS_REGION)

echo ""
echo "✅ Deployment complete!"
echo "🌐 Frontend URL: https://$CLOUDFRONT_DOMAIN"
echo "🔗 Backend API URL: http://$ALB_DNS"
echo "📊 Health Check: http://$ALB_DNS/health"
echo ""
echo "🔍 Testing endpoints..."
echo "Backend Health: $(curl -s http://$ALB_DNS/health | jq -r .status 2>/dev/null || echo 'Testing...')"
echo ""
echo "📝 Next steps:"
echo "1. Wait 5-10 minutes for ECS service to fully start"
echo "2. Test the frontend at: https://$CLOUDFRONT_DOMAIN"
echo "3. Check ECS service status in AWS Console"

cd ../..