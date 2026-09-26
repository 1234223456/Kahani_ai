# Story Arc Engine - Backend API

A secure Node.js/Express backend server for the Story Arc Engine application with MongoDB integration. This backend handles all Gemini API interactions, ensuring API keys are never exposed to the client.

## Features

- 🔐 **Secure API Key Management** - API keys stored server-side only
- 🎨 **Production Plan Generation** - Complete story and animation planning
- 🖼️ **Image Generation** - Character models and keyframes using Gemini
- 🎬 **Video Generation** - Animated clips using Veo
- 💬 **Chat System** - Interactive character conversations with history
- 📦 **MongoDB Integration** - Persistent storage for all data
- 🛡️ **Security Features** - Helmet, CORS, Rate Limiting
- 📊 **RESTful API** - Well-structured endpoints

## Prerequisites

- Node.js >= 20.0.0
- MongoDB >= 4.4 (local or cloud instance)
- Gemini API Key with access to:
  - `gemini-2.5-pro`
  - `gemini-2.5-flash`
  - `gemini-2.5-flash-image`
  - `veo-3.1-fast-generate-preview`

## Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   
   Create a `.env` file in the `backend` directory with the following:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Gemini API Key
   GEMINI_API_KEY=your_actual_gemini_api_key_here

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/story-arc-engine

   # CORS Configuration (Frontend URL)
   FRONTEND_URL=http://localhost:5173

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Start MongoDB:**
   
   If using local MongoDB:
   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community

   # Linux (systemd)
   sudo systemctl start mongod

   # Or run manually
   mongod --dbpath /path/to/data/directory
   ```

   Or use MongoDB Atlas (cloud):
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a cluster and get your connection string
   - Update `MONGODB_URI` in `.env` with your Atlas connection string

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and uptime.

### Production Plans

#### Create Production Plan
```
POST /api/production-plans
Content-Type: application/json

{
  "drawingDesc": "A brave knight with a red cape",
  "parentPrompt": "Teach the importance of courage",
  "language": "English",
  "imageBase64": "base64_encoded_image_data",
  "imageMimeType": "image/png",
  "userId": "optional_user_id"
}
```

#### Get Production Plan
```
GET /api/production-plans/:id
```

#### Get User's Production Plans
```
GET /api/production-plans/user/:userId?limit=10&page=1
```

#### Update Production Plan Assets
```
PATCH /api/production-plans/:id/assets
Content-Type: application/json

{
  "characterModelImage": "data:image/png;base64,...",
  "keyframeImages": ["data:image/png;base64,..."],
  "videoUrls": ["https://..."]
}
```

#### Delete Production Plan
```
DELETE /api/production-plans/:id
```

### Gemini AI Operations

#### Generate Image
```
POST /api/gemini/generate-image
Content-Type: application/json

{
  "prompt": "A cheerful cartoon character in a forest",
  "image": {
    "data": "base64_data",
    "mimeType": "image/png"
  }
}
```

#### Generate Video
```
POST /api/gemini/generate-video
Content-Type: application/json

{
  "prompt": "The character waves happily",
  "keyframeImage": "data:image/png;base64,..."
}
```

### Chat System

#### Create Chat Session
```
POST /api/chat/sessions
Content-Type: application/json

{
  "productionPlanId": "mongodb_object_id",
  "userId": "optional_user_id"
}
```

#### Send Message
```
POST /api/chat/sessions/:sessionId/messages
Content-Type: application/json

{
  "message": "Hello! What's your favorite color?"
}
```

#### Get Chat History
```
GET /api/chat/sessions/:sessionId
```

#### Delete Chat Session
```
DELETE /api/chat/sessions/:sessionId
```

## Database Schema

### ProductionPlan Collection
Stores complete story production plans including:
- Character models
- Story analysis
- Episode scripts
- Keyframes
- Video generation plans
- Generated assets

### ChatSession Collection
Stores chat conversations with:
- Session metadata
- Message history
- Character persona
- Timestamps

## Security Features

- **Helmet**: Security headers for Express
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse
  - General API: 100 requests per 15 minutes
  - AI Generation: 10 requests per 15 minutes
- **Request Size Limits**: Prevents large payload attacks
- **Environment Variables**: Sensitive data never in code

## Error Handling

The API returns consistent error responses:
```json
{
  "success": false,
  "error": "Error message here"
}
```

Status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # MongoDB connection
│   ├── controllers/
│   │   ├── chatController.ts    # Chat endpoints
│   │   ├── geminiController.ts  # AI generation endpoints
│   │   └── productionPlanController.ts
│   ├── middleware/
│   │   ├── errorHandler.ts      # Error handling
│   │   └── rateLimiter.ts       # Rate limiting
│   ├── models/
│   │   ├── ChatSession.ts       # Chat schema
│   │   └── ProductionPlan.ts    # Production plan schema
│   ├── routes/
│   │   ├── chatRoutes.ts
│   │   ├── geminiRoutes.ts
│   │   └── productionPlanRoutes.ts
│   ├── services/
│   │   └── geminiService.ts     # Gemini API wrapper
│   └── server.ts                # Main server file
├── .env.example                 # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

### Scripts
- `npm run dev`: Development server with hot reload
- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Run production server
- `npm run lint`: Lint TypeScript code

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network connectivity for Atlas

### Gemini API Errors
- Verify API key is correct
- Check API quota and billing
- Ensure you have access to all required models

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

## Production Deployment

### Recommended Setup
1. Use environment variables for all configuration
2. Enable HTTPS
3. Use a process manager (PM2, systemd)
4. Set up proper logging
5. Use MongoDB Atlas for database
6. Implement authentication/authorization
7. Add request validation
8. Monitor API usage and costs

### PM2 Example
```bash
npm install -g pm2
npm run build
pm2 start dist/server.js --name story-arc-backend
pm2 save
```

## License

ISC

## Support

For issues or questions, please open an issue in the project repository.
