# Quick Start Guide - Story Arc Engine

Get the Story Arc Engine up and running in 5 minutes!

## 🎯 What You Need

1. **Node.js 20+** - [Download here](https://nodejs.org/)
2. **MongoDB** - Choose one:
   - Local: [Download MongoDB](https://www.mongodb.com/try/download/community)
   - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free tier available)
3. **Gemini API Key** - [Get it here](https://aistudio.google.com/apikey)

## ⚡ Quick Setup (5 Steps)

### 1️⃣ Install Dependencies
```bash
# In project root
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2️⃣ Create Backend Environment File
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add your keys:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017/story-arc-engine
```

### 3️⃣ Create Frontend Environment File
```bash
# In project root
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4️⃣ Start MongoDB
**Local MongoDB:**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**OR use MongoDB Atlas** (cloud - no installation needed!)

### 5️⃣ Start the Application

**Option A: Two Terminals (Recommended)**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

**Option B: Single Command** (requires concurrently)
```bash
npm install -g concurrently
npm run dev:all
```

## ✅ Verify It's Working

1. **Backend Health Check:**
   Open: http://localhost:5000/health
   Should see: `{"status":"OK",...}`

2. **Frontend:**
   Open: http://localhost:5173
   Should see the Story Arc Engine interface

## 🎨 Create Your First Story

1. Go to http://localhost:5173
2. Enter a character description (e.g., "A brave knight with a red cape")
3. Enter a parent's lesson (e.g., "Teach the importance of courage")
4. Select language (English or Hindi)
5. Optionally upload a drawing
6. Click "Generate Production Plan"
7. Wait for the AI to create your story!
8. Chat with your character or make a voice call

## 🐛 Common Issues

### "GEMINI_API_KEY not set"
- Make sure you created `backend/.env`
- Add your actual Gemini API key

### "MongoDB connection failed"
- Check if MongoDB is running: `mongosh`
- Or use MongoDB Atlas connection string

### "Port 5000 already in use"
```bash
lsof -i :5000
kill -9 <PID>
```

### "Failed to fetch"
- Make sure backend is running on port 5000
- Check `VITE_API_BASE_URL` in `.env.local`

## 📚 Next Steps

- **Full Setup Guide**: See `SETUP.md`
- **Backend API Docs**: See `backend/README.md`
- **Migration Guide**: See `MIGRATION_GUIDE.md`

## 🎉 That's It!

You're now ready to create amazing AI-powered stories!

**Need help?** Check the detailed guides or open an issue.

