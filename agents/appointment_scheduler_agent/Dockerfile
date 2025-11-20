FROM public.ecr.aws/docker/library/python:3.11

WORKDIR /app

# Copy requirements and install dependencies
# Using full python image (not slim) which has build tools pre-installed
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY appointment_scheduler_runtime.py .

# Run the agent
CMD ["python", "appointment_scheduler_runtime.py"]
