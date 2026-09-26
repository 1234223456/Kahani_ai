# Story Arc Engine - Complete Setup Guide

This guide will help you set up and run the Story Arc Engine project with both frontend and backend.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running the Project](#running-the-project)
6. [Architecture](#architecture)
7. [API Documentation](#api-documentation)
8. [Security](#security)
9. [Troubleshooting](#troubleshooting)

## 🎯 Project Overview

Story Arc Engine is a children's animation platform powered by Google's Gemini AI. It allows users to:

- Create animated stories from children's drawings
- Generate character models and animations
- Interactive chat with story characters
- Video generation using AI

### Why Backend?

The backend was created to:
- **Secure API Keys**: Gemini API keys are never exposed to the frontend
- **Data Persistence**: Store production plans, assets, and chat history in MongoDB
- **Scalability**: Better control over API rate limits and resource management
- **Security**: Prevent unauthorized API usage and billing abuse

## 🔧 Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **MongoDB** (Choose one):
  - Local: [Download MongoDB Community Server](https://www.mongodb.com/try/download/community)
  - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free tier available)
- **Google Gemini API Key**: [Get one here](https://ai.google.dev/)

### Check Your Node Version

```bash
node --version
# Should show v20.x.x or higher
```

If you need to upgrade Node.js, use [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install 20
nvm use 20
```

## 📦 Installation

### 1. Clone or Navigate to the Project

```bash
cd /Users/sukhvirsingh/webdev/story-arc-engine
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

## ⚙️ Configuration

### Frontend Configuration

1. Create `.env.local` in the project root:

```bash
cp env.local.example .env.local
```

2. Edit `.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
```

### Backend Configuration

1. Create `.env` in the backend directory:

```bash
cd backend
cp env.example .env
```

2. Edit `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
# Option 1: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/story-arc-engine

# Option 2: MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/story-arc-engine

# Gemini API Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

**Important**: Replace `your_actual_gemini_api_key_here` with your real Gemini API key!

### MongoDB Setup

#### Option A: Local MongoDB

1. Start MongoDB:

```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Or start manually
mongod --dbpath /path/to/your/data/directory
```

2. Verify it's running:

```bash
mongosh
# Should connect successfully
```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier)
3. Add your IP address to the whitelist (or use 0.0.0.0/0 for development)
4. Create a database user
5. Get your connection string and update `MONGODB_URI` in `backend/.env`

## 🚀 Running the Project

You'll need to run both the backend and frontend simultaneously.

### Option 1: Two Terminal Windows

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server is running on port 5000
📍 API Base URL: http://localhost:5000/api
🏥 Health check: http://localhost:5000/health
```

**Terminal 2 - Frontend:**
```bash
# From project root
npm run dev
```

You should see:
```
  VITE v6.2.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Option 2: Using tmux (Single Terminal)

```bash
# Create new tmux session
tmux new -s storyarc

# Split window horizontally
Ctrl+b "

# In first pane, run backend
cd backend && npm run dev

# Switch to second pane
Ctrl+b (down arrow)

# Run frontend
npm run dev
```

### Verify Everything is Running

1. **Backend Health Check**: Visit http://localhost:5000/health
   - Should show: `{"status":"ok","message":"Story Arc Engine Backend API is running"}`

2. **Frontend**: Visit http://localhost:5173
   - Should show the Story Arc Engine interface

3. **MongoDB Connection**: Check backend terminal for "✅ MongoDB connected successfully"

## 🏗️ Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │         │             │         │             │
│   Frontend  │────────▶│   Backend   │────────▶│   MongoDB   │
│   (React)   │         │  (Express)  │         │  (Database) │
│             │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              │
                              ▼
                        ┌─────────────┐
                        │             │
                        │  Gemini AI  │
                        │   (Google)  │
                        │             │
                        └─────────────┘
```

### Frontend
- **Tech**: React 19, TypeScript, Vite
- **Purpose**: User interface for creating and viewing stories
- **Security**: No API keys exposed, all AI calls routed through backend

### Backend
- **Tech**: Node.js, Express, TypeScript
- **Purpose**: Secure API gateway, business logic, data persistence
- **Security**: API keys stored securely, CORS enabled, input validation

### Database
- **Tech**: MongoDB with Mongoose ODM
- **Collections**:
  - `productionplans`: Story production plans
  - `generatedassets`: Images and videos
  - `chathistories`: Character chat sessions

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Production Plans
```
POST   /production-plans          # Create new production plan
GET    /production-plans           # Get all production plans
GET    /production-plans/:id       # Get specific production plan
DELETE /production-plans/:id       # Delete production plan
```

#### Assets
```
POST   /assets/character-model     # Generate character model
POST   /assets/keyframe            # Generate keyframe image
POST   /assets/video               # Generate video clip
GET    /assets/plan/:planId        # Get all assets for a plan
GET    /assets/:id                 # Get specific asset
```

#### Chat
```
POST   /chat                       # Send chat message
GET    /chat/:planId/:sessionId    # Get chat history
DELETE /chat/:planId/:sessionId    # Clear chat history
```

### Example: Create Production Plan

```javascript
const response = await fetch('http://localhost:5000/api/production-plans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    drawing: "A brave knight with a red cape",
    parentPrompt: "Teaching about courage",
    language: "English",
    imageBase64: null,
    imageMimeType: null
  })
});

const result = await response.json();
console.log(result.data); // Production plan object
```

## 🔒 Security

### Current Implementation

1. **API Key Security**:
   - ✅ API keys stored only in backend `.env`
   - ✅ Never exposed to frontend/client
   - ✅ All AI calls proxied through backend

2. **CORS Protection**:
   - ✅ Restricted to specific frontend URL
   - ✅ Configurable via environment variables

3. **Input Validation**:
   - ✅ Request validation in controllers
   - ✅ Error handling middleware

### Additional Security Recommendations

For production deployment, consider:

- Add authentication (JWT, OAuth)
- Rate limiting (express-rate-limit)
- Input sanitization
- API key rotation
- HTTPS only
- Environment-specific configurations
- Database connection encryption

## 🐛 Troubleshooting

### Issue: Backend won't start

**Error**: `GEMINI_API_KEY is not configured`

**Solution**: 
```bash
cd backend
cat .env  # Check if GEMINI_API_KEY is set
# If not, edit .env and add your API key
```

---

**Error**: `MongoDB connection failed`

**Solution**:
```bash
# Check if MongoDB is running
mongosh

# If not running, start it:
brew services start mongodb-community  # macOS
# or
sudo systemctl start mongod  # Linux
```

---

**Error**: `Port 5000 already in use`

**Solution**:
```bash
# Find and kill the process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change the port in backend/.env
PORT=5001
```

### Issue: Frontend can't connect to backend

**Error**: Network errors, CORS errors

**Solution**:
1. Check backend is running: http://localhost:5000/health
2. Verify `VITE_API_URL` in `.env.local` matches backend URL
3. Check `FRONTEND_URL` in `backend/.env` matches frontend URL
4. Restart both frontend and backend

### Issue: Node version too old

**Error**: `Unsupported engine`

**Solution**:
```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 20
nvm install 20
nvm use 20

# Verify
node --version  # Should show v20.x.x
```

### Issue: Images/Videos not generating

**Error**: API errors from Gemini

**Solution**:
1. Verify API key is valid and has credits
2. Check backend logs for specific error messages
3. Ensure you're using a Gemini API key with access to image/video models
4. Check MongoDB is storing data correctly

## 📞 Additional Help

### Check Logs

**Backend logs**:
```bash
cd backend
npm run dev
# Watch the console output
```

**Frontend logs**:
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### Database Inspection

```bash
# Connect to MongoDB
mongosh

# Switch to database
use story-arc-engine

# View collections
show collections

# View production plans
db.productionplans.find().pretty()

# Count documents
db.productionplans.countDocuments()
```

### Common Commands

```bash
# Backend
cd backend
npm run dev      # Development mode with hot-reload
npm run build    # Build for production
npm start        # Run production build

# Frontend
npm run dev      # Development mode
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🎉 Success!

If everything is working, you should be able to:

1. ✅ Visit http://localhost:5173
2. ✅ Enter a character description and parent prompt
3. ✅ Click "Generate Story"
4. ✅ See the production plan, images, and videos generate
5. ✅ Chat with the character
6. ✅ View stored data in MongoDB

Enjoy creating stories with Story Arc Engine! 🚀

