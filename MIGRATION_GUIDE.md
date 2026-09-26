# Migration Guide: Frontend-Only to Full Stack

This guide explains how the Story Arc Engine has been migrated from a frontend-only application to a secure full-stack architecture.

## 🔄 What Changed?

### Before (Frontend-Only - ⚠️ Insecure)
```
┌─────────────────┐
│   Frontend      │
│   React App     │
│                 │
│  - Direct API   │──────► Gemini API (API Key Exposed!)
│    calls        │
│  - API key in   │
│    .env.local   │
└─────────────────┘
```

**Problems:**
- ❌ API keys exposed in browser
- ❌ Anyone can extract and abuse your key
- ❌ No request tracking or limits
- ❌ No data persistence
- ❌ Potential billing abuse

### After (Full Stack - ✅ Secure)
```
┌─────────────────┐
│   Frontend      │
│   React App     │
│                 │
│  - HTTP calls   │
│    to backend   │
│  - No API keys  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Backend API   │
│   Express       │
│                 │
│  - API keys     │──────► Gemini API (Secure!)
│    server-side  │
│  - Rate limits  │
│  - Validation   │
└────────┬────────┘
         │
         ↓
    ┌────────┐
    │MongoDB │
    └────────┘
```

**Benefits:**
- ✅ API keys never exposed
- ✅ Request tracking and limits
- ✅ Data persistence
- ✅ User history
- ✅ Better error handling
- ✅ Scalable architecture

## 📁 File Structure Changes

### New Files Added

```
story-arc-engine/
├── backend/                          # NEW: Backend server
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── chatController.ts
│   │   │   ├── geminiController.ts
│   │   │   └── productionPlanController.ts
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   ├── models/
│   │   │   ├── ChatSession.ts
│   │   │   └── ProductionPlan.ts
│   │   ├── routes/
│   │   │   ├── chatRoutes.ts
│   │   │   ├── geminiRoutes.ts
│   │   │   └── productionPlanRoutes.ts
│   │   ├── services/
│   │   │   └── geminiService.ts     # Gemini API wrapper
│   │   └── server.ts                # Main server file
│   ├── .env.example                 # Backend environment template
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md                    # Backend documentation
│   └── start.sh                     # Start script
│
├── services/
│   ├── geminiService.ts             # EXISTING: Original service
│   └── apiService.ts                # NEW: Backend API client
│
├── SETUP.md                          # NEW: Complete setup guide
├── MIGRATION_GUIDE.md                # NEW: This file
└── .env.example                      # NEW: Frontend environment template
```

## 🔧 Configuration Changes

### Old Configuration (.env.local)
```env
# ⚠️ INSECURE - Exposed to client
GEMINI_API_KEY="your_api_key_here"
```

### New Configuration

**Frontend (.env.local):**
```env
# ✅ SECURE - No API keys
VITE_API_BASE_URL=http://localhost:5000/api
```

**Backend (backend/.env):**
```env
# ✅ SECURE - Server-side only
GEMINI_API_KEY=your_api_key_here
MONGODB_URI=mongodb://localhost:27017/story-arc-engine
PORT=5000
FRONTEND_URL=http://localhost:5173
```

## 🔀 Code Changes

### Old Approach (Direct API Calls)

```typescript
// ❌ OLD: geminiService.ts (Frontend)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const response = await ai.models.generateContent({...});
```

### New Approach (Backend API)

```typescript
// ✅ NEW: apiService.ts (Frontend)
const response = await apiService.generateProductionPlan(
  drawingDesc, 
  parentPrompt, 
  language, 
  imageBase64, 
  imageMimeType
);
```

```typescript
// ✅ NEW: geminiService.ts (Backend)
class GeminiService {
  private ai: GoogleGenAI;
  
  constructor() {
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY // Secure!
    });
  }
  
  async generateProductionPlan(input: ProductionPlanInput) {
    // API key never leaves server
    return await this.ai.models.generateContent({...});
  }
}
```

## 📊 Data Persistence

### Before
- No data storage
- Everything lost on page refresh
- No history or tracking

### After
- MongoDB stores all production plans
- Chat history persisted
- User can retrieve past stories
- Analytics and tracking possible

## 🚀 Migration Steps for Existing Deployments

If you have an existing deployment, follow these steps:

### Step 1: Backup
```bash
# Backup your existing .env.local
cp .env.local .env.local.backup
```

### Step 2: Install MongoDB
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Or use MongoDB Atlas (cloud)
```

### Step 3: Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your GEMINI_API_KEY
```

### Step 4: Update Frontend Config
```bash
# In project root
cp .env.example .env.local
# Edit .env.local with VITE_API_BASE_URL
```

### Step 5: Start Services
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
npm run dev
```

## 🔄 Using Both Approaches

You can keep both implementations:

### For Production (Recommended)
Use the new backend API:
- More secure
- Better for deployed apps
- Includes data persistence

### For Quick Testing (Optional)
Keep the old direct approach:
- Faster for local development
- No database needed
- Good for experimentation

**Note:** Never deploy the direct API approach to production!

## 📈 Feature Comparison

| Feature | Old (Frontend-Only) | New (Full Stack) |
|---------|-------------------|------------------|
| API Key Security | ❌ Exposed | ✅ Secure |
| Data Persistence | ❌ No | ✅ MongoDB |
| Rate Limiting | ❌ No | ✅ Yes |
| User Tracking | ❌ No | ✅ Yes |
| Chat History | ❌ Lost on refresh | ✅ Persisted |
| Production Ready | ❌ No | ✅ Yes |
| Cost Control | ❌ No protection | ✅ Rate limits |

## 🛠️ Troubleshooting Migration

### Issue: Frontend can't connect to backend
**Solution:**
- Check backend is running on port 5000
- Verify `VITE_API_BASE_URL` in `.env.local`
- Check CORS settings in `backend/.env`

### Issue: Database connection failed
**Solution:**
- Ensure MongoDB is running
- Check `MONGODB_URI` in `backend/.env`
- Try MongoDB Atlas if local setup fails

### Issue: API calls still failing
**Solution:**
- Verify `GEMINI_API_KEY` in `backend/.env` (not frontend!)
- Check backend logs for errors
- Test backend health: `curl http://localhost:5000/health`

## 📚 Additional Resources

- `SETUP.md` - Complete setup instructions
- `backend/README.md` - Backend API documentation
- `README.md` - Project overview

## ✅ Migration Checklist

- [ ] MongoDB installed and running
- [ ] Backend dependencies installed
- [ ] Backend `.env` configured with GEMINI_API_KEY
- [ ] Frontend `.env.local` configured with API URL
- [ ] Backend starts without errors
- [ ] Frontend connects to backend successfully
- [ ] Test story generation works
- [ ] Test chat functionality
- [ ] Remove old GEMINI_API_KEY from frontend .env.local

## 🎉 Success!

Once migration is complete, you'll have:
- ✅ Secure API key management
- ✅ Persistent data storage
- ✅ Better error handling
- ✅ Production-ready architecture
- ✅ Scalable foundation

Your application is now ready for deployment to production!

