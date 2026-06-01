#!/bin/bash

# Programmatic Knowledge Base Creation Script
# Creates IAM roles, OpenSearch Serverless collection, and Bedrock Knowledge Base

set -e

echo "🚀 Creating Bedrock Knowledge Base Programmatically"
echo "===================================================="

# Configuration
REGION="${AWS_REGION:?AWS_REGION env var must be set (e.g., us-east-1)}"
BUCKET_NAME="ev-maintenance-manual-kb-$(aws sts get-caller-identity --query Account --output text)"
KB_NAME="ev-maintenance-manual-kb"
COLLECTION_NAME="ev-manual-vectors"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo ""
echo "Configuration:"
echo "  Account ID: $ACCOUNT_ID"
echo "  Region: $REGION"
echo "  S3 Bucket: $BUCKET_NAME"
echo ""

# Step 1: Create IAM role for Knowledge Base
echo "Step 1: Creating IAM role for Knowledge Base..."
echo "------------------------------------------------"

# Create trust policy
cat > /tmp/kb-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "$ACCOUNT_ID"
        },
        "ArnLike": {
          "aws:SourceArn": "arn:aws:bedrock:$REGION:$ACCOUNT_ID:knowledge-base/*"
        }
      }
    }
  ]
}
EOF

# Create role
ROLE_NAME="AmazonBedrockExecutionRoleForKB_$(date +%s)"
aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file:///tmp/kb-trust-policy.json \
    --description "Service role for Bedrock Knowledge Base" \
    --region $REGION

echo "✅ Created IAM role: $ROLE_NAME"

# Create permissions policy (without OpenSearch Serverless access — that
# permission is added later, scoped to the specific collection ID, after the
# collection is created)
cat > /tmp/kb-permissions-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::$BUCKET_NAME",
        "arn:aws:s3:::$BUCKET_NAME/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:$REGION::foundation-model/amazon.titan-embed-text-v1"
    }
  ]
}
EOF

# Attach inline policy
aws iam put-role-policy \
    --role-name $ROLE_NAME \
    --policy-name KnowledgeBasePermissions \
    --policy-document file:///tmp/kb-permissions-policy.json

echo "✅ Attached permissions policy"

# Wait for role to propagate
echo "⏳ Waiting for IAM role to propagate (10 seconds)..."
sleep 10

ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

# Step 2: Create OpenSearch Serverless collection
echo ""
echo "Step 2: Creating OpenSearch Serverless collection..."
echo "-----------------------------------------------------"

# Create encryption policy
cat > /tmp/aoss-encryption-policy.json <<EOF
{
  "Rules": [
    {
      "ResourceType": "collection",
      "Resource": ["collection/$COLLECTION_NAME"]
    }
  ],
  "AWSOwnedKey": true
}
EOF

aws opensearchserverless create-security-policy \
    --name "${COLLECTION_NAME}-encryption" \
    --type encryption \
    --policy file:///tmp/aoss-encryption-policy.json \
    --region $REGION || echo "⚠️  Encryption policy may already exist"

echo "✅ Created encryption policy"

# Create network policy (allow public access for now)
# WARNING: Public access enabled for demo simplicity. Production deployments
# should use VPC access (set AllowFromPublic to false and configure VPC
# endpoints).
cat > /tmp/aoss-network-policy.json <<EOF
[
  {
    "Rules": [
      {
        "ResourceType": "collection",
        "Resource": ["collection/$COLLECTION_NAME"]
      },
      {
        "ResourceType": "dashboard",
        "Resource": ["collection/$COLLECTION_NAME"]
      }
    ],
    "AllowFromPublic": true
  }
]
EOF

aws opensearchserverless create-security-policy \
    --name "${COLLECTION_NAME}-network" \
    --type network \
    --policy file:///tmp/aoss-network-policy.json \
    --region $REGION || echo "⚠️  Network policy may already exist"

echo "✅ Created network policy"

# Create data access policy
cat > /tmp/aoss-data-policy.json <<EOF
[
  {
    "Rules": [
      {
        "ResourceType": "collection",
        "Resource": ["collection/$COLLECTION_NAME"],
        "Permission": [
          "aoss:CreateCollectionItems",
          "aoss:DeleteCollectionItems",
          "aoss:UpdateCollectionItems",
          "aoss:DescribeCollectionItems"
        ]
      },
      {
        "ResourceType": "index",
        "Resource": ["index/$COLLECTION_NAME/*"],
        "Permission": [
          "aoss:CreateIndex",
          "aoss:DeleteIndex",
          "aoss:UpdateIndex",
          "aoss:DescribeIndex",
          "aoss:ReadDocument",
          "aoss:WriteDocument"
        ]
      }
    ],
    "Principal": [
      "$ROLE_ARN",
      "arn:aws:iam::$ACCOUNT_ID:role/Admin"
    ]
  }
]
EOF

aws opensearchserverless create-access-policy \
    --name "${COLLECTION_NAME}-access" \
    --type data \
    --policy file:///tmp/aoss-data-policy.json \
    --region $REGION || echo "⚠️  Access policy may already exist"

echo "✅ Created data access policy"

# Create collection
echo "⏳ Creating OpenSearch Serverless collection (this takes 3-5 minutes)..."

COLLECTION_OUTPUT=$(aws opensearchserverless create-collection \
    --name $COLLECTION_NAME \
    --type VECTORSEARCH \
    --description "Vector store for EV Maintenance Manual" \
    --region $REGION 2>&1) || true

if echo "$COLLECTION_OUTPUT" | grep -q "ConflictException"; then
    echo "⚠️  Collection already exists, retrieving details..."
    COLLECTION_ID=$(aws opensearchserverless list-collections \
        --region $REGION \
        --query "collectionSummaries[?name=='$COLLECTION_NAME'].id" \
        --output text)
else
    COLLECTION_ID=$(echo "$COLLECTION_OUTPUT" | jq -r '.createCollectionDetail.id')
fi

echo "✅ Collection ID: $COLLECTION_ID"

# Wait for collection to be active
echo "⏳ Waiting for collection to become active..."
for i in {1..60}; do
    STATUS=$(aws opensearchserverless batch-get-collection \
        --ids $COLLECTION_ID \
        --region $REGION \
        --query 'collectionDetails[0].status' \
        --output text)
    
    if [ "$STATUS" == "ACTIVE" ]; then
        echo "✅ Collection is active"
        break
    fi
    
    echo "   Status: $STATUS (attempt $i/60)"
    sleep 10
done

# Get collection endpoint
COLLECTION_ENDPOINT=$(aws opensearchserverless batch-get-collection \
    --ids $COLLECTION_ID \
    --region $REGION \
    --query 'collectionDetails[0].collectionEndpoint' \
    --output text)

echo "✅ Collection endpoint: $COLLECTION_ENDPOINT"

# Now that the collection ID is known, attach the OpenSearch Serverless
# permission scoped to ONLY this collection (rather than collection/*).
echo ""
echo "🔐 Attaching OpenSearch Serverless permission for collection $COLLECTION_ID..."
cat > /tmp/kb-aoss-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "aoss:APIAccessAll"
      ],
      "Resource": "arn:aws:aoss:$REGION:$ACCOUNT_ID:collection/$COLLECTION_ID"
    }
  ]
}
EOF

aws iam put-role-policy \
    --role-name $ROLE_NAME \
    --policy-name KnowledgeBaseAOSSAccess \
    --policy-document file:///tmp/kb-aoss-policy.json
echo "✅ Scoped AOSS permission attached"

# Step 3: Create Knowledge Base
echo ""
echo "Step 3: Creating Bedrock Knowledge Base..."
echo "-------------------------------------------"

# Create KB configuration
cat > /tmp/kb-config.json <<EOF
{
  "name": "$KB_NAME",
  "description": "EV Preventive Maintenance Manual for tire, motor, and inverter recommendations",
  "roleArn": "$ROLE_ARN",
  "knowledgeBaseConfiguration": {
    "type": "VECTOR",
    "vectorKnowledgeBaseConfiguration": {
      "embeddingModelArn": "arn:aws:bedrock:$REGION::foundation-model/amazon.titan-embed-text-v1"
    }
  },
  "storageConfiguration": {
    "type": "OPENSEARCH_SERVERLESS",
    "opensearchServerlessConfiguration": {
      "collectionArn": "arn:aws:aoss:$REGION:$ACCOUNT_ID:collection/$COLLECTION_ID",
      "vectorIndexName": "bedrock-knowledge-base-default-index",
      "fieldMapping": {
        "vectorField": "bedrock-knowledge-base-default-vector",
        "textField": "AMAZON_BEDROCK_TEXT_CHUNK",
        "metadataField": "AMAZON_BEDROCK_METADATA"
      }
    }
  }
}
EOF

KB_OUTPUT=$(aws bedrock-agent create-knowledge-base \
    --cli-input-json file:///tmp/kb-config.json \
    --region $REGION)

KB_ID=$(echo "$KB_OUTPUT" | jq -r '.knowledgeBase.knowledgeBaseId')

echo "✅ Created Knowledge Base"
echo "✅ Knowledge Base ID: $KB_ID"

# Step 4: Create Data Source
echo ""
echo "Step 4: Creating Data Source..."
echo "--------------------------------"

cat > /tmp/data-source-config.json <<EOF
{
  "knowledgeBaseId": "$KB_ID",
  "name": "ev-manual-s3-source",
  "description": "S3 data source for EV maintenance manual",
  "dataSourceConfiguration": {
    "type": "S3",
    "s3Configuration": {
      "bucketArn": "arn:aws:s3:::$BUCKET_NAME",
      "inclusionPrefixes": ["manuals/"]
    }
  },
  "vectorIngestionConfiguration": {
    "chunkingConfiguration": {
      "chunkingStrategy": "FIXED_SIZE",
      "fixedSizeChunkingConfiguration": {
        "maxTokens": 300,
        "overlapPercentage": 20
      }
    }
  }
}
EOF

DS_OUTPUT=$(aws bedrock-agent create-data-source \
    --cli-input-json file:///tmp/data-source-config.json \
    --region $REGION)

DS_ID=$(echo "$DS_OUTPUT" | jq -r '.dataSource.dataSourceId')

echo "✅ Created Data Source"
echo "✅ Data Source ID: $DS_ID"

# Step 5: Start ingestion job
echo ""
echo "Step 5: Starting ingestion job..."
echo "----------------------------------"

INGESTION_OUTPUT=$(aws bedrock-agent start-ingestion-job \
    --knowledge-base-id $KB_ID \
    --data-source-id $DS_ID \
    --region $REGION)

INGESTION_JOB_ID=$(echo "$INGESTION_OUTPUT" | jq -r '.ingestionJob.ingestionJobId')

echo "✅ Started ingestion job"
echo "✅ Ingestion Job ID: $INGESTION_JOB_ID"

# Monitor ingestion
echo ""
echo "⏳ Monitoring ingestion job (this takes 5-10 minutes)..."
for i in {1..60}; do
    JOB_STATUS=$(aws bedrock-agent get-ingestion-job \
        --knowledge-base-id $KB_ID \
        --data-source-id $DS_ID \
        --ingestion-job-id $INGESTION_JOB_ID \
        --region $REGION \
        --query 'ingestionJob.status' \
        --output text)
    
    if [ "$JOB_STATUS" == "COMPLETE" ]; then
        echo "✅ Ingestion complete!"
        break
    elif [ "$JOB_STATUS" == "FAILED" ]; then
        echo "❌ Ingestion failed!"
        aws bedrock-agent get-ingestion-job \
            --knowledge-base-id $KB_ID \
            --data-source-id $DS_ID \
            --ingestion-job-id $INGESTION_JOB_ID \
            --region $REGION
        exit 1
    fi
    
    echo "   Status: $JOB_STATUS (attempt $i/60)"
    sleep 10
done

# Get ingestion statistics
STATS=$(aws bedrock-agent get-ingestion-job \
    --knowledge-base-id $KB_ID \
    --data-source-id $DS_ID \
    --ingestion-job-id $INGESTION_JOB_ID \
    --region $REGION \
    --query 'ingestionJob.statistics')

echo ""
echo "📊 Ingestion Statistics:"
echo "$STATS" | jq '.'

# Cleanup temp files
rm -f /tmp/kb-*.json /tmp/aoss-*.json

echo ""
echo "================================================================"
echo "✅ Knowledge Base Setup Complete!"
echo "================================================================"
echo ""
echo "📝 Important Values:"
echo "   Knowledge Base ID: $KB_ID"
echo "   Data Source ID: $DS_ID"
echo "   Collection ID: $COLLECTION_ID"
echo "   IAM Role: $ROLE_ARN"
echo ""
echo "🔧 Next Steps:"
echo ""
echo "1. Set environment variable:"
echo "   export KNOWLEDGE_BASE_ID=$KB_ID"
echo ""
echo "2. Add to your shell profile:"
echo "   echo 'export KNOWLEDGE_BASE_ID=$KB_ID' >> ~/.bashrc"
echo ""
echo "3. Test the knowledge base:"
echo "   python test_knowledge_base.py"
echo ""
echo "4. Update Lambda environment:"
echo "   aws lambda update-function-configuration \\"
echo "       --function-name agentcore-maintenance-agent \\"
echo "       --environment \"Variables={KNOWLEDGE_BASE_ID=$KB_ID}\" \\"
echo "       --region $REGION"
echo ""
echo "5. Deploy updated agent:"
echo "   cd agents && ./deploy.sh agentcore_maintenance_agent"
echo ""
echo "================================================================"
