FROM public.ecr.aws/docker/library/python:3.11

WORKDIR /app

# Copy requirements and install dependencies
# Using full python image (not slim) which has build tools pre-installed
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY tire_ordering_runtime.py .

# Copy data files (needed for tire specs)
COPY tire_wear_data.csv car_manual_specs.csv ./

# Run the agent
CMD ["python", "tire_ordering_runtime.py"]
