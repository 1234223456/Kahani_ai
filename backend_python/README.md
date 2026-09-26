# Kahani Backend (Python, domain-centric)

This is the **Python** rewrite of the Kahani backend, organized by **domain** instead of by technical layer.

---

## Tech stack (description)

| Component | Role |
|-----------|------|
| **Python 3.10+** | Runtime. Enables modern syntax and type hints used across the app. |
| **FastAPI** | Web framework. Handles HTTP, JSON, CORS, and lifespan (DB connect/disconnect). Routes are grouped by domain and mounted under `/api`. |
| **Uvicorn** | ASGI server. Runs the FastAPI app with optional hot-reload in development. |
| **Motor** | Async MongoDB driver. All DB access is async; used inside domain services to read/write plans, chat sessions, and assets. |
| **Pydantic** | Data validation and settings. Request/response bodies are defined as Pydantic models (`schemas.py`); app config (port, MongoDB URI, API key) is loaded via `pydantic-settings` from env/`.env`. |
| **google-genai** | Official Gemini Python SDK. Used only in the `gemini` domain for: structured production-plan generation, image generation, video (Veo), and chat. Keeps AI logic in one place. |
| **python-dotenv** | Optional. Loads `.env` so you can set `GEMINI_API_KEY`, `MONGODB_URI`, etc. without exporting in the shell. |

**Flow:** The React frontend sends requests to `/api/*`. FastAPI routes (in each domain’s `routes.py`) validate input with Pydantic, call the domain **service** (business logic + DB + Gemini), and return JSON. The **gemini** domain is the only one that talks to the Gemini API; other domains call it when they need AI (e.g. production_plans for story generation, chat for character replies).

---

## Domain-centric layout

Each business domain is self-contained under `app/domains/`:

- **production_plans** – create, read, update, delete production plans; uses Gemini to generate plans.
- **chat** – chat sessions and messages; uses Gemini for character chat.
- **assets** – character model, keyframe, and video generation; uses Gemini and persists in MongoDB.
- **gemini** – shared AI service (production plan, image, video, chat) and optional direct image/video API routes.

Within each domain you typically have:

- `models.py` – MongoDB document shape and serialization
- `schemas.py` – Pydantic request/response models
- `service.py` – application logic (orchestrates persistence + Gemini)
- `routes.py` – FastAPI routes

Shared app-level pieces:

- `app/config/` – settings (env), database (Motor)
- `app/main.py` – FastAPI app, CORS, lifespan, mounting domain routers under `/api`

## Prerequisites

- Python 3.10+
- MongoDB (local or Atlas)
- Google Gemini API key

## Setup

```bash
cd backend_python
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

Create a `.env` file (or set env vars):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017
# optional: MONGODB db name defaults to story-arc-engine
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
```

Or:

```bash
python -m app.main
```

- API base: `http://localhost:5000`
- Health: `http://localhost:5000/health`
- Frontend can keep using `VITE_API_URL=http://localhost:5000/api` (same paths as the Node backend).

## API (same as Node backend)

- `POST /api/production-plans` – generate production plan
- `GET /api/production-plans/:id` – get plan
- `GET /api/production-plans/user/:userId` – list by user
- `PATCH /api/production-plans/:id/assets` – update assets
- `DELETE /api/production-plans/:id` – delete plan
- `POST /api/chat/sessions` – create chat session
- `POST /api/chat/sessions/:sessionId/messages` – send message
- `GET /api/chat/sessions/:sessionId` – get history
- `DELETE /api/chat/sessions/:sessionId` – delete session
- `POST /api/assets/character-model` – generate character model
- `POST /api/assets/keyframe` – generate keyframe
- `POST /api/assets/video` – generate video
- `GET /api/assets/plan/:productionPlanId` – list assets
- `GET /api/assets/:id` – get asset
- `POST /api/gemini/generate-image` – direct image generation
- `POST /api/gemini/generate-video` – direct video generation

## Notes

- The **Gemini Python SDK** (`google-genai`) may use slightly different method names (e.g. `generate_content`, `generate_videos`, chat API). Adjust `app/domains/gemini/service.py` to match the latest [Gemini API docs](https://ai.google.dev/gemini-api/docs) if something fails.
- MongoDB collection names match the Node/Mongoose defaults: `productionplans`, `chatsessions`, `generatedassets`, so you can switch between Node and Python backends against the same DB.
