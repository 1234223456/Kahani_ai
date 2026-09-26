# Story Arc Engine - Project Summary

## 📋 Overview

The Story Arc Engine is a full-stack AI-powered application that transforms children's drawings and stories into animated videos using Google's Gemini AI and Veo video generation models.

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Google Gemini AI SDK

**Backend:**
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- Google Gemini AI API integration
- Security: Helmet, CORS, Rate Limiting

**AI Models Used:**
- `gemini-2.5-pro` - Story and production plan generation
- `gemini-2.5-flash` - Character chat interactions
- `gemini-2.5-flash-image` - Image generation (characters and keyframes)
- `veo-3.1-fast-generate-preview` - Video generation
- `gemini-2.5-flash-native-audio-preview` - Voice interactions

## 📁 Project Structure

```
story-arc-engine/
├── components/               # React components
│   ├── ApiKeySelector.tsx
│   ├── CharacterInteraction.tsx
│   ├── Chat.tsx
│   ├── Header.tsx
│   ├── InputForm.tsx
│   ├── ProductionPlanDisplay.tsx
│   ├── VoiceCall.tsx
│   └── icons/
│       └── Icons.tsx
│
├── services/                 # API services
│   ├── geminiService.ts     # Original frontend service (optional)
│   └── apiService.ts        # Backend API client (recommended)
│
├── backend/                  # Backend server
│   ├── src/
│   │   ├── config/          # Configuration
│   │   │   └── database.ts
│   │   ├── controllers/     # Request handlers
│   │   │   ├── chatController.ts
│   │   │   ├── geminiController.ts
│   │   │   └── productionPlanController.ts
│   │   ├── middleware/      # Express middleware
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   ├── models/          # MongoDB schemas
│   │   │   ├── ChatSession.ts
│   │   │   └── ProductionPlan.ts
│   │   ├── routes/          # API routes
│   │   │   ├── chatRoutes.ts
│   │   │   ├── geminiRoutes.ts
│   │   │   └── productionPlanRoutes.ts
│   │   ├── services/        # Business logic
│   │   │   └── geminiService.ts
│   │   └── server.ts        # Main server
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md
│   └── start.sh
│
├── App.tsx                   # Main React component
├── index.tsx                 # React entry point
├── types.ts                  # TypeScript types
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
├── README.md                 # Main documentation
├── SETUP.md                  # Detailed setup guide
├── QUICKSTART.md            # Quick start guide
├── MIGRATION_GUIDE.md       # Migration documentation
└── PROJECT_SUMMARY.md       # This file
```

## 🎯 Key Features

### 1. Production Plan Generation
- Accepts character description and/or drawing image
- Parent provides a lesson/theme
- AI generates complete story structure:
  - Character model specifications
  - Story analysis (hero, villain, arc, persona)
  - Episode script with scenes
  - Static keyframe prompts
  - Video generation instructions
  - Post-processing steps

### 2. Asset Generation
- **Character Model**: Generated from user's drawing
- **Keyframes**: 4 static images (one per scene)
- **Videos**: 4 animated 8-second clips (32 seconds total)

### 3. Interactive Features
- **Chat**: Text-based conversations with story character
- **Voice Call**: Real-time voice interactions with character
- Both use character's persona from story analysis

### 4. Data Persistence
- Production plans stored in MongoDB
- Chat history saved and retrievable
- User can access past stories
- Asset URLs/data stored for quick retrieval

### 5. Security Features
- API keys never exposed to frontend
- Rate limiting on all endpoints
- CORS protection
- Helmet security headers
- Request size limits
- Environment-based configuration

## 🔐 Security Architecture

### Why Backend is Essential

**Problem with Frontend-Only Approach:**
```javascript
// ❌ INSECURE: API key exposed in browser
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```
- API key visible in browser dev tools
- Network requests show the key
- Anyone can extract and abuse it
- No cost control

**Solution with Backend:**
```javascript
// ✅ SECURE: API calls through backend
const response = await apiService.generateProductionPlan(...);
```
- API key stays on server
- Rate limiting prevents abuse
- Request validation
- Cost control through throttling

## 🚀 Deployment Guide

### Development
```bash
# Frontend: http://localhost:5173
npm run dev

# Backend: http://localhost:5000
cd backend && npm run dev
```

### Production

**Backend (e.g., Railway, Render, Heroku):**
```bash
npm run build
npm start
```
Environment variables:
- `GEMINI_API_KEY`
- `MONGODB_URI` (MongoDB Atlas)
- `FRONTEND_URL` (production frontend URL)
- `NODE_ENV=production`

**Frontend (e.g., Vercel, Netlify):**
```bash
npm run build
```
Environment variables:
- `VITE_API_BASE_URL` (production backend URL)

## 📊 API Endpoints

### Production Plans
- `POST /api/production-plans` - Generate new plan
- `GET /api/production-plans/:id` - Get specific plan
- `GET /api/production-plans/user/:userId` - Get user's plans
- `PATCH /api/production-plans/:id/assets` - Update assets
- `DELETE /api/production-plans/:id` - Delete plan

### Gemini Operations
- `POST /api/gemini/generate-image` - Generate image
- `POST /api/gemini/generate-video` - Generate video

### Chat
- `POST /api/chat/sessions` - Create chat session
- `POST /api/chat/sessions/:sessionId/messages` - Send message
- `GET /api/chat/sessions/:sessionId` - Get history
- `DELETE /api/chat/sessions/:sessionId` - Delete session

## 💾 Database Schema

### ProductionPlan Collection
```typescript
{
  userId?: string,
  characterModel: { source, action },
  storyAnalysis: { hero, parentPrompt, coreLesson, villain, characterArc, characterPersona },
  episodeScript: { action, scenes[] },
  staticKeyframes: { action, keyframes[] },
  videoGeneration: { action, clips[] },
  postProcessing: { action },
  language: string,
  drawingDescription: string,
  parentPrompt: string,
  characterImage?: string,
  generatedAssets?: { characterModelImage, keyframeImages[], videoUrls[] },
  createdAt, updatedAt
}
```

### ChatSession Collection
```typescript
{
  sessionId: string,
  userId?: string,
  productionPlanId: ObjectId,
  persona: string,
  messages: [{ role, text, timestamp }],
  createdAt, updatedAt
}
```

## 🔄 Workflow

1. **User Input**: Drawing description + parent's lesson
2. **Production Plan**: AI generates complete story structure
3. **Character Model**: Image generated from drawing
4. **Keyframes**: 4 scene images generated
5. **Videos**: 4 animated clips created (takes ~5-10 min each)
6. **Interaction**: User can chat or call with character
7. **Persistence**: All data saved to MongoDB

## 📈 Performance Considerations

- **Image Generation**: ~5-10 seconds per image
- **Video Generation**: ~5-10 minutes per 8-second clip
- **Chat Response**: ~1-3 seconds
- **Voice Call**: Real-time streaming

**Optimization:**
- Sequential generation with progress updates
- Rate limiting prevents overwhelming API
- MongoDB indexes for fast queries
- Efficient data structures

## 🎓 Learning Resources

- **Google Gemini API**: https://ai.google.dev/
- **MongoDB**: https://www.mongodb.com/docs/
- **Express.js**: https://expressjs.com/
- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/

## 📝 Documentation Files

- `README.md` - Project overview and features
- `SETUP.md` - Complete setup instructions
- `QUICKSTART.md` - 5-minute quick start
- `MIGRATION_GUIDE.md` - Frontend-only to full-stack migration
- `backend/README.md` - Backend API documentation
- `PROJECT_SUMMARY.md` - This file

## 🤝 Contributing

When contributing:
1. Follow TypeScript best practices
2. Add proper error handling
3. Update documentation
4. Test both frontend and backend
5. Ensure security best practices

## 📄 License

ISC

## 🎉 Credits

Built with:
- Google Gemini AI
- Google Veo Video Generation
- React and TypeScript
- Express and MongoDB
- Love for AI and creativity! ❤️
