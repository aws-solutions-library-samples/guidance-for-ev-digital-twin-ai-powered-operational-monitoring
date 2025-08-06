#!/bin/bash

# Tire Maintenance System - Setup Script
# This script sets up the development environment

set -e

echo "🚗 Setting up Tire Maintenance System..."
echo "======================================"

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.8+ is required. Found: $python_version"
    exit 1
fi

echo "✅ Python version: $python_version"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Generate sample data
echo "📊 Generating sample data..."
python data_generator.py

# Train models
echo "🤖 Training ML models..."
python tire_predictor.py

# Make CLI executable
chmod +x cli_interface.py

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To get started:"
echo "  1. Activate the virtual environment: source venv/bin/activate"
echo "  2. Run the application: python cli_interface.py"
echo "  3. Or use make commands: make run"
echo ""
echo "Available make commands:"
echo "  make help     - Show all available commands"
echo "  make run      - Run the CLI application"
echo "  make test     - Run tests (when implemented)"
echo "  make clean    - Clean generated files"
echo ""
echo "Happy tire maintenance! 🚗✨"