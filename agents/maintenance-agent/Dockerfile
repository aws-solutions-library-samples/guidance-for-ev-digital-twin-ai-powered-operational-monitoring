# Use Python 3.11 slim image from AWS ECR Public (avoids Docker Hub rate limits)
FROM public.ecr.aws/docker/library/python:3.11-slim

# Build arguments for Knowledge Base ID and Memory ID (set during deployment)
ARG KNOWLEDGE_BASE_ID=""
ARG AGENTCORE_MEMORY_ID=""

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (all from requirements-agentcore.txt)
RUN pip install --no-cache-dir \
    pandas>=2.0.0 \
    numpy>=1.24.0 \
    scikit-learn>=1.3.0 \
    matplotlib>=3.7.0 \
    seaborn>=0.12.0 \
    plotly>=5.15.0 \
    joblib>=1.1.0 \
    flask>=2.3.0 \
    flask-cors>=4.0.0 \
    gunicorn>=21.2.0 \
    strands-agents>=0.1.0 \
    strands-agents-tools>=0.1.0 \
    boto3>=1.34.0 \
    botocore>=1.34.0 \
    bedrock-agentcore \
    nova-act \
    duckduckgo-search>=4.0.0

# Copy application code and dependencies
COPY agentcore_runtime_app.py .
COPY agentcore_maintenance_agent.py .
COPY knowledge_base_tools.py .
COPY tire_predictor.py .
COPY tire_wear_data.csv .
COPY motor_sensor_data.csv .
COPY inverter_sensor_data.csv .
COPY car_manual_specs.csv .
COPY models/ models/

# Create directory for models if they don't exist
RUN mkdir -p models

# Set environment variables for Knowledge Base and Memory
# IMPORTANT: Set KNOWLEDGE_BASE_ID to enable KB tools (tire/motor/inverter guidance)
# Get your KB ID from: aws bedrock-agent list-knowledge-bases --query "knowledgeBaseSummaries[*].[knowledgeBaseId,name]"
# Or pass as build arg: docker build --build-arg KNOWLEDGE_BASE_ID=YOUR_KB_ID .
ENV KNOWLEDGE_BASE_ID=${KNOWLEDGE_BASE_ID:-5CZPTMJB9R}

# IMPORTANT: Set AGENTCORE_MEMORY_ID to enable memory features (pattern detection, recurring issues)
# Get your Memory ID from: .bedrock_agentcore.yaml after running 'bedrock-agentcore launch'
# Or pass as build arg: docker build --build-arg AGENTCORE_MEMORY_ID=YOUR_MEMORY_ID .
ENV AGENTCORE_MEMORY_ID=${AGENTCORE_MEMORY_ID:-}

# Expose port (AgentCore Runtime uses 8000 to match ALB configuration)
EXPOSE 8000

# Run the AgentCore Runtime application
CMD ["python", "agentcore_runtime_app.py"]