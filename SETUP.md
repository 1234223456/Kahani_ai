# Story Arc Engine - Complete Setup Guide

This guide will help you set up both the frontend and backend of the Story Arc Engine application.

## 🎯 Overview

The Story Arc Engine consists of:
- **Frontend**: React + TypeScript + Vite application
- **Backend**: Node.js + Express + MongoDB API server
- **AI Integration**: Google Gemini API for content generation

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** >= 20.0.0
   ```bash
   node --version
   ```
   If you need to upgrade, use [nvm](https://github.com/nvm-sh/nvm):
   ```bash
   nvm install 20
   nvm use 20
   ```

2. **MongoDB** >= 4.4
   - **Option A - Local Installation**:
     - macOS: `brew install mongodb-community`
     - Linux: Follow [MongoDB installation guide](https://docs.mongodb.com/manual/administration/install-on-linux/)
     - Windows: Download from [MongoDB website](https://www.mongodb.com/try/download/community)
   
   - **Option B - MongoDB Atlas (Cloud)**:
     - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
     - Create a free cluster
     - Get your connection string

3. **Gemini API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/apikey)
   - Create a new API key
   - Ensure you have access to:
     - `gemini-2.5-pro`
     - `gemini-2.5-flash`
     - `gemini-2.5-flash-image`
     - `veo-3.1-fast-generate-preview`

## 🚀 Step-by-Step Setup

### Step 1: Clone and Install Dependencies

```bash
# Navigate to the project directory
cd story-arc-engine

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Configure Backend

1. **Create backend environment file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `backend/.env`:**
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Gemini API Key (REQUIRED)
   GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY_HERE

   # MongoDB Configuration
   # For local MongoDB:
   MONGODB_URI=mongodb://localhost:27017/story-arc-engine
   
   # OR for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/story-arc-engine

   # CORS Configuration (Frontend URL)
   FRONTEND_URL=http://localhost:5173

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

3. **Start MongoDB** (if using local):
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Or run manually
   mongod --dbpath /path/to/data/directory
   ```

### Step 3: Configure Frontend

1. **Create frontend environment file:**
   ```bash
   # From the project root
   cp .env.example .env.local
   ```

2. **Edit `.env.local`:**
   ```env
   # Backend API URL
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

### Step 4: Start the Application

You'll need **two terminal windows**:

#### Terminal 1 - Backend Server:
```bash
cd backend
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════╗
║                                               ║
║   🚀 Story Arc Engine Backend Server         ║
║                                               ║
║   Status: Running                             ║
║   Port: 5000                                  ║
║   Environment: development                    ║
║                                               ║
╚═══════════════════════════════════════════════╝

✅ MongoDB connected successfully
```

#### Terminal 2 - Frontend Application:
```bash
# From the project root
npm run dev
```

You should see:
```
  VITE v6.2.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5: Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## ✅ Verification

To verify everything is working:

1. **Check Backend Health:**
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"OK","timestamp":"...","uptime":...}`

2. **Check MongoDB Connection:**
   - Backend terminal should show: `✅ MongoDB connected successfully`

3. **Test the Frontend:**
   - Open http://localhost:5173
   - You should see the Story Arc Engine interface

## 🔧 Troubleshooting

### Backend Issues

**Problem: "GEMINI_API_KEY environment variable not set"**
- Solution: Make sure you created `backend/.env` and added your API key

**Problem: "MongoDB connection failed"**
- Solution: 
  - Check if MongoDB is running: `mongosh` (should connect)
  - Verify connection string in `backend/.env`
  - For Atlas, check network access and credentials

**Problem: "Port 5000 already in use"**
- Solution:
  ```bash
  # Find process using port 5000
  lsof -i :5000
  # Kill it
  kill -9 <PID>
  # Or change PORT in backend/.env
  ```

### Frontend Issues

**Problem: "Failed to fetch" or "Network Error"**
- Solution: 
  - Make sure backend is running on port 5000
  - Check `VITE_API_BASE_URL` in `.env.local`
  - Verify CORS settings in `backend/.env`

**Problem: "Unsupported engine" warnings**
- Solution: Upgrade to Node.js 20+
  ```bash
  nvm install 20
  nvm use 20
  ```

### Gemini API Issues

**Problem: "API key not valid"**
- Solution: 
  - Verify your API key at https://aistudio.google.com/apikey
  - Make sure billing is enabled (some models require it)
  - Check you have access to all required models

**Problem: "Quota exceeded"**
- Solution: Check your API usage and limits in Google Cloud Console

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   Frontend      │  React + TypeScript + Vite
│   (Port 5173)   │  ↓ HTTP Requests
└─────────────────┘
         ↓
┌─────────────────┐
│   Backend API   │  Express + Node.js
│   (Port 5000)   │  ↓ API Calls
└─────────────────┘
         ↓
    ┌────┴────┐
    ↓         ↓
┌────────┐  ┌──────────┐
│MongoDB │  │Gemini API│
└────────┘  └──────────┘
```

## 🔐 Security Notes

### ✅ Secure Setup (Backend API)
- API keys stored server-side only
- Environment variables never exposed to client
- CORS protection
- Rate limiting enabled
- Helmet security headers

### ❌ Insecure Alternative (Direct API calls)
The old approach (calling Gemini directly from frontend) exposed API keys in the browser. This new architecture prevents that.

## 📚 API Documentation

For detailed API documentation, see:
- `backend/README.md` - Complete backend API reference

## 🎨 Usage Flow

1. User uploads drawing and enters prompt
2. Frontend sends request to backend API
3. Backend calls Gemini API securely
4. Production plan generated and saved to MongoDB
5. Frontend displays results
6. User can chat with character (via backend)
7. All data persisted in database

## 🚢 Production Deployment

### Backend Deployment (e.g., Railway, Render, Heroku)

1. Set environment variables in platform
2. Update `MONGODB_URI` to production database
3. Update `FRONTEND_URL` to production frontend URL
4. Deploy backend code

### Frontend Deployment (e.g., Vercel, Netlify)

1. Set `VITE_API_BASE_URL` to production backend URL
2. Deploy frontend code

### Example Production `.env` files:

**Backend Production:**
```env
PORT=5000
NODE_ENV=production
GEMINI_API_KEY=your_production_key
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://your-frontend.vercel.app
```

**Frontend Production:**
```env
VITE_API_BASE_URL=https://your-backend.railway.app/api
```

## 📝 Development Commands

### Frontend:
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend:
```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript
npm start        # Start production server
```

## 🤝 Need Help?

- Check the `backend/README.md` for API details
- Review error messages in both terminal windows
- Ensure all environment variables are set correctly
- Verify Node.js version is >= 20.0.0

## 📄 License

ISC

