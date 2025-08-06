# Tire Maintenance System - Makefile

.PHONY: help install dev-install test clean run lint format check-format setup

# Default target
help:
	@echo "🚗 Tire Maintenance System - Available Commands:"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install      - Install production dependencies"
	@echo "  make dev-install  - Install development dependencies"
	@echo "  make setup        - Complete development setup"
	@echo ""
	@echo "Development:"
	@echo "  make run          - Run the CLI application"
	@echo "  make test         - Run tests"
	@echo "  make lint         - Run linting checks"
	@echo "  make format       - Format code with black"
	@echo "  make check-format - Check code formatting"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean        - Clean generated files"
	@echo "  make clean-data   - Clean generated data files"
	@echo "  make clean-models - Clean trained models"

# Installation
install:
	@echo "📦 Installing production dependencies..."
	pip install -r requirements.txt

dev-install:
	@echo "🛠️ Installing development dependencies..."
	pip install -r requirements.txt
	pip install black flake8 pytest pytest-cov

setup: dev-install
	@echo "🚀 Development environment setup complete!"
	@echo "Run 'make run' to start the application"

# Running
run:
	@echo "🚗 Starting Tire Maintenance System..."
	python cli_interface.py

# Testing
test:
	@echo "🧪 Running tests..."
	python -m pytest tests/ -v --cov=. --cov-report=html

# Code Quality
lint:
	@echo "🔍 Running linting checks..."
	flake8 *.py --max-line-length=100 --ignore=E203,W503

format:
	@echo "✨ Formatting code..."
	black *.py --line-length=100

check-format:
	@echo "📏 Checking code formatting..."
	black *.py --check --line-length=100

# Cleaning
clean: clean-data clean-models
	@echo "🧹 Cleaning generated files..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/ dist/ .coverage htmlcov/

clean-data:
	@echo "🗑️ Cleaning generated data files..."
	rm -f *.csv
	rm -f maintenance_report_*.json

clean-models:
	@echo "🤖 Cleaning trained models..."
	rm -f tire_models_*.pkl

# Data Generation
generate-data:
	@echo "📊 Generating sample data..."
	python data_generator.py

# Model Training
train-models:
	@echo "🤖 Training ML models..."
	python tire_predictor.py

# Development Workflow
dev-setup: setup generate-data train-models
	@echo "🎯 Complete development setup finished!"
	@echo "Ready to run: make run"

# Docker (future)
docker-build:
	@echo "🐳 Building Docker image..."
	docker build -t tire-maintenance-system .

docker-run:
	@echo "🐳 Running Docker container..."
	docker run -it tire-maintenance-system

# Package Distribution
build:
	@echo "📦 Building distribution packages..."
	python setup.py sdist bdist_wheel

upload-test:
	@echo "🚀 Uploading to Test PyPI..."
	twine upload --repository testpypi dist/*

upload:
	@echo "🚀 Uploading to PyPI..."
	twine upload dist/*