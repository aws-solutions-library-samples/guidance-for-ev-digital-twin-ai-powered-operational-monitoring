# Use Python 3.11 slim image from AWS ECR Public (avoids Docker Hub rate limits)
FROM public.ecr.aws/docker/library/python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements-agentcore.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements-agentcore.txt

# Copy application code
COPY agentcore_runtime_app.py .
COPY agentcore_maintenance_agent.py .
COPY tire_predictor.py .
COPY tire_wear_data.csv .
COPY motor_sensor_data.csv .
COPY inverter_sensor_data.csv .
COPY car_manual_specs.csv .
COPY tire_models_*.pkl .

# Create directory for models if they don't exist
RUN mkdir -p models

# Expose port (AgentCore Runtime uses 8080)
EXPOSE 8080

# Run the AgentCore Runtime application
CMD ["python", "agentcore_runtime_app.py"]