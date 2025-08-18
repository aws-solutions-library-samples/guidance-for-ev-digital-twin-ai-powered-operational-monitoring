# Vehicle Maintenance System - Docker Configuration

FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY *.py ./
COPY README.md .
COPY LICENSE .

# Create directories for data persistence
RUN mkdir -p /app/data /app/models /app/reports

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash tire_user \
    && chown -R tire_user:tire_user /app
USER tire_user

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Default command
CMD ["python", "cli_interface.py"]

# Labels for metadata
LABEL maintainer="your.email@example.com"
LABEL version="2.0.0"
LABEL description="AI-powered vehicle maintenance prediction and management system with tire and motor analytics"
LABEL org.opencontainers.image.source="https://github.com/yourusername/vehicle-maintenance-system"