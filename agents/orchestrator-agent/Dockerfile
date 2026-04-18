# Orchestrator Agent — AgentCore Runtime container
# Lightweight router: no ML dependencies, no pandas, no CSV data
FROM public.ecr.aws/docker/library/python:3.11-slim

# Build arguments for specialist agent ARNs
ARG TIRE_AGENT_ARN=""
ARG MOTOR_AGENT_ARN=""
ARG INVERTER_AGENT_ARN=""
ARG FLEET_AGENT_ARN=""

WORKDIR /app

# Install Python dependencies (minimal — routing only)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent-specific code (no shared module needed)
COPY orchestrator_runtime.py .

# Environment variables — specialist agent ARNs
ENV TIRE_AGENT_ARN=${TIRE_AGENT_ARN:-}
ENV MOTOR_AGENT_ARN=${MOTOR_AGENT_ARN:-}
ENV INVERTER_AGENT_ARN=${INVERTER_AGENT_ARN:-}
ENV FLEET_AGENT_ARN=${FLEET_AGENT_ARN:-}

EXPOSE 8000

CMD ["python", "orchestrator_runtime.py"]
