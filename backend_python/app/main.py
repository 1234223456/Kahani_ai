"""
Kahani backend - FastAPI application entrypoint.
Domain-centric structure: each domain (production_plans, chat, assets, gemini) owns its routes and logic.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.database import connect_db, close_db
from app.config.settings import get_settings
from app.domains.production_plans.routes import router as production_plans_router
from app.domains.chat.routes import router as chat_router
from app.domains.assets.routes import router as assets_router
from app.domains.gemini.routes import router as gemini_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Story Arc Engine API",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "https://www.teamevoke.xyz",
        "https://teamevoke.xyz",
        "http://localhost:5173",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
)

# Mount domain routes under /api so frontend VITE_API_URL works unchanged
app.include_router(production_plans_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(assets_router, prefix="/api")
app.include_router(gemini_router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "Story Arc Engine API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "productionPlans": "/api/production-plans",
            "chat": "/api/chat",
            "assets": "/api/assets",
            "gemini": "/api/gemini",
        },
    }


@app.get("/health")
def health():
    import time
    return {
        "status": "OK",
        "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "uptime_seconds": time.monotonic(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.debug,
    )
