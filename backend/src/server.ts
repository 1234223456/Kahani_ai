import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter, strictLimiter } from './middleware/rateLimiter.js';
import productionPlanRoutes from './routes/productionPlanRoutes.js';
import geminiRoutes from './routes/geminiRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

// Load environment variables
// dotenv.config() automatically looks for .env in the current working directory
// When running from backend directory, it will find backend/.env
dotenv.config();

// Log API key status (without exposing the key)
if (process.env.GEMINI_API_KEY) {
  console.log('✅ GEMINI_API_KEY loaded (length:', process.env.GEMINI_API_KEY.length, ')');
} else {
  console.error('❌ GEMINI_API_KEY not found!');
  console.error('Make sure you are running from the backend directory and .env file exists');
}

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDatabase();

// Middleware
app.use(helmet()); // Security headers

// CORS configuration - allow production frontend, ngrok, and localhost
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://www.teamevoke.xyz',
  'https://teamevoke.xyz',
  'http://localhost:5173',
  'http://localhost:3001',
  /^https?:\/\/.*\.ngrok(-free)?\.app$/, // Allow all ngrok URLs
  /^https?:\/\/.*\.ngrok-free\.app$/,
].filter(Boolean) as (string | RegExp)[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else {
        return allowed.test(origin);
      }
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      callback(null, true); // Allow anyway for development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

app.use(express.json({ limit: '50mb' })); // Parse JSON bodies (large limit for base64 images)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
app.use('/api/', apiLimiter);

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({
    name: 'Story Arc Engine API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      productionPlans: '/api/production-plans',
      gemini: '/api/gemini',
      chat: '/api/chat'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/production-plans', productionPlanRoutes);
app.use('/api/gemini', strictLimiter, geminiRoutes); // Stricter rate limit for AI generation
app.use('/api/chat', chatRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║   🚀 Story Arc Engine Backend Server         ║
║                                               ║
║   Status: Running                             ║
║   Port: ${PORT}                                  ║
║   Environment: ${process.env.NODE_ENV || 'development'}                   ║
║                                               ║
╚═══════════════════════════════════════════════╝
  `);
});

// Handle port conflicts
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`
❌ Error: Port ${PORT} is already in use.

To fix this, you can:
1. Kill the process using port ${PORT}:
   lsof -ti:${PORT} | xargs kill -9

2. Or change the PORT in your .env file to a different port (e.g., 5002, 5003)
    `);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
