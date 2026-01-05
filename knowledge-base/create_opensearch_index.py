#!/usr/bin/env python3
"""
Create OpenSearch Serverless index for Bedrock Knowledge Base
"""

import boto3
import json
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

# Configuration
REGION = 'us-east-1'
COLLECTION_ENDPOINT = 'https://vnyyxsltd9rjuz2b3yif.us-east-1.aoss.amazonaws.com'
INDEX_NAME = 'bedrock-knowledge-base-default-index'

# Get AWS credentials
session = boto3.Session()
credentials = session.get_credentials()
awsauth = AWS4Auth(
    credentials.access_key,
    credentials.secret_key,
    REGION,
    'aoss',
    session_token=credentials.token
)

# Create OpenSearch client
client = OpenSearch(
    hosts=[{'host': COLLECTION_ENDPOINT.replace('https://', ''), 'port': 443}],
    http_auth=awsauth,
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection,
    timeout=300
)

# Index mapping for Bedrock Knowledge Base
index_body = {
    "settings": {
        "index": {
            "knn": True,
            "knn.algo_param.ef_search": 512
        }
    },
    "mappings": {
        "properties": {
            "bedrock-knowledge-base-default-vector": {
                "type": "knn_vector",
                "dimension": 1536,
                "method": {
                    "name": "hnsw",
                    "engine": "faiss",
                    "parameters": {
                        "ef_construction": 512,
                        "m": 16
                    },
                    "space_type": "l2"
                }
            },
            "AMAZON_BEDROCK_TEXT_CHUNK": {
                "type": "text"
            },
            "AMAZON_BEDROCK_METADATA": {
                "type": "text",
                "index": False
            }
        }
    }
}

print(f"Creating index: {INDEX_NAME}")
print(f"Collection endpoint: {COLLECTION_ENDPOINT}")

try:
    # Check if index exists
    if client.indices.exists(index=INDEX_NAME):
        print(f"⚠️  Index {INDEX_NAME} already exists")
    else:
        # Create index
        response = client.indices.create(
            index=INDEX_NAME,
            body=index_body
        )
        print(f"✅ Created index: {INDEX_NAME}")
        print(json.dumps(response, indent=2))
except Exception as e:
    print(f"❌ Error creating index: {e}")
    raise

print("\n✅ Index creation complete!")
print(f"\nYou can now create the Knowledge Base with:")
print(f"  Index name: {INDEX_NAME}")
print(f"  Vector field: bedrock-knowledge-base-default-vector")
print(f"  Text field: AMAZON_BEDROCK_TEXT_CHUNK")
print(f"  Metadata field: AMAZON_BEDROCK_METADATA")
