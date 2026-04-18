# Fleet Operations Agent — AgentCore Runtime container
# Build context: this directory. Run `cp -r ../shared/ ./shared/` before building.
FROM public.ecr.aws/docker/library/python:3.11-slim

ARG AGENTCORE_MEMORY_ID=""
ARG BEDROCK_GUARDRAIL_ID=""
ARG BEDROCK_GUARDRAIL_VERSION=""

WORKDIR /app

RUN apt-get update && apt-get install -y gcc g++ curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY shared/ /app/shared/
COPY fleet_runtime.py .
COPY fleet_tools.py .

ENV AGENTCORE_MEMORY_ID=${AGENTCORE_MEMORY_ID:-}
ENV BEDROCK_GUARDRAIL_ID=${BEDROCK_GUARDRAIL_ID:-}
ENV BEDROCK_GUARDRAIL_VERSION=${BEDROCK_GUARDRAIL_VERSION:-}

EXPOSE 8000
CMD ["python", "fleet_runtime.py"]
