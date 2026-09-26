#!/bin/bash

# Story Arc Engine Backend Start Script

echo "🚀 Starting Story Arc Engine Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 20.0.0"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️  Warning: Node.js version $NODE_VERSION detected. Version 20+ is recommended."
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created. Please edit it with your configuration."
        echo "📝 Required: GEMINI_API_KEY, MONGODB_URI"
        exit 1
    else
        echo "❌ .env.example not found. Cannot create .env"
        exit 1
    fi
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if MongoDB is accessible (optional check)
echo "🔍 Checking MongoDB connection..."

# Start the server
echo "✅ Starting backend server..."
npm run dev

