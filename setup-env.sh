#!/bin/bash

# Story Arc Engine - Environment Setup Script
# This script helps you set up the environment files for the project

echo "🚀 Story Arc Engine - Environment Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to read user input
read_input() {
    local prompt="$1"
    local var_name="$2"
    local default="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        value=${value:-$default}
    else
        read -p "$prompt: " value
    fi
    
    eval $var_name="'$value'"
}

# Check if .env files already exist
if [ -f ".env.local" ] && [ -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Environment files already exist!${NC}"
    read -p "Do you want to overwrite them? (y/N): " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Existing files preserved."
        exit 0
    fi
fi

echo ""
echo "📝 Please provide the following configuration:"
echo ""

# Get Gemini API Key
echo -e "${YELLOW}1. Gemini API Key${NC}"
echo "   Get it from: https://aistudio.google.com/apikey"
read_input "Enter your Gemini API Key" GEMINI_API_KEY

# Get MongoDB URI
echo ""
echo -e "${YELLOW}2. MongoDB Configuration${NC}"
echo "   Options:"
echo "   - Local: mongodb://localhost:27017/story-arc-engine"
echo "   - Atlas: mongodb+srv://user:pass@cluster.mongodb.net/dbname"
read_input "Enter MongoDB URI" MONGODB_URI "mongodb://localhost:27017/story-arc-engine"

# Backend Port
echo ""
echo -e "${YELLOW}3. Backend Port${NC}"
read_input "Enter backend port" BACKEND_PORT "5000"

# Frontend URL
echo ""
echo -e "${YELLOW}4. Frontend URL${NC}"
read_input "Enter frontend URL" FRONTEND_URL "http://localhost:5173"

# Create backend .env
echo ""
echo "📁 Creating backend/.env..."
cat > backend/.env << EOF
# Server Configuration
PORT=$BACKEND_PORT
NODE_ENV=development

# Gemini API Key
GEMINI_API_KEY=$GEMINI_API_KEY

# MongoDB Configuration
MONGODB_URI=$MONGODB_URI

# CORS Configuration (Frontend URL)
FRONTEND_URL=$FRONTEND_URL

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ backend/.env created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create backend/.env${NC}"
    exit 1
fi

# Create frontend .env.local
echo ""
echo "📁 Creating .env.local..."
cat > .env.local << EOF
# Backend API URL
VITE_API_BASE_URL=http://localhost:$BACKEND_PORT/api
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ .env.local created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create .env.local${NC}"
    exit 1
fi

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}🎉 Environment setup complete!${NC}"
echo "========================================"
echo ""
echo "Configuration:"
echo "  - Backend Port: $BACKEND_PORT"
echo "  - Frontend URL: $FRONTEND_URL"
echo "  - MongoDB: $MONGODB_URI"
echo ""
echo "Next steps:"
echo "  1. Install dependencies:"
echo "     npm install"
echo "     cd backend && npm install"
echo ""
echo "  2. Start MongoDB (if using local):"
echo "     brew services start mongodb-community  # macOS"
echo "     sudo systemctl start mongod            # Linux"
echo ""
echo "  3. Start the backend:"
echo "     cd backend && npm run dev"
echo ""
echo "  4. Start the frontend (in another terminal):"
echo "     npm run dev"
echo ""
echo "  5. Open http://localhost:5173 in your browser"
echo ""
echo "📚 For more information, see:"
echo "   - QUICKSTART.md - Quick start guide"
echo "   - SETUP.md - Detailed setup instructions"
echo "   - backend/README.md - Backend API documentation"
echo ""

