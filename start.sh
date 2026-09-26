#!/bin/bash

# Story Arc Engine - Start Script
# This script starts both the backend and frontend servers

echo "🚀 Starting Story Arc Engine..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js >= 20.0.0${NC}"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js version 20 or higher is required. Current version: $(node -v)${NC}"
    echo "Install using: nvm install 20 && nvm use 20"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo -e "${RED}⚠️  MongoDB doesn't appear to be running${NC}"
    echo "Start MongoDB with: brew services start mongodb-community (macOS)"
    echo "Or use MongoDB Atlas and configure MONGODB_URI in backend/.env"
    echo ""
fi

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env file not found${NC}"
    echo "Create it from the example:"
    echo "  cd backend && cp env.example .env"
    echo "Then edit backend/.env and add your GEMINI_API_KEY"
    exit 1
fi

# Check if frontend .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local file not found${NC}"
    echo "Create it from the example:"
    echo "  cp env.local.example .env.local"
    exit 1
fi

echo -e "${GREEN}✅ Configuration files found${NC}"
echo ""

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${BLUE}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${BLUE}🔧 Starting backend server...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Check if backend started successfully
if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${RED}❌ Backend failed to start. Check backend.log for errors${NC}"
    cat backend.log
    exit 1
fi

echo -e "${GREEN}✅ Backend running on http://localhost:5000${NC}"

# Start frontend
echo -e "${BLUE}🎨 Starting frontend server...${NC}"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a bit for frontend to start
sleep 3

# Check if frontend started successfully
if ! ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${RED}❌ Frontend failed to start. Check frontend.log for errors${NC}"
    cat frontend.log
    kill $BACKEND_PID
    exit 1
fi

echo -e "${GREEN}✅ Frontend running on http://localhost:5173${NC}"
echo ""
echo -e "${GREEN}🎉 Story Arc Engine is ready!${NC}"
echo ""
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend:  http://localhost:5000/api"
echo "🏥 Health:   http://localhost:5000/health"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all servers${NC}"
echo ""

# Keep script running and show logs
tail -f backend.log frontend.log &
TAIL_PID=$!

# Wait for user to press Ctrl+C
wait $BACKEND_PID $FRONTEND_PID

