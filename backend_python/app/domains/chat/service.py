"""
Chat domain: application service (sessions + Gemini chat).
"""
import uuid
from datetime import datetime
from typing import Optional

from app.config.database import get_database
from app.domains.chat.models import COLLECTION, chat_session_from_doc
from app.domains.gemini.service import get_gemini_service

# In-memory active Gemini chat sessions (consider Redis in production)
_active_chats: dict[str, any] = {}


class ChatService:
    def __init__(self):
        self._db = get_database()
        self._coll = self._db[COLLECTION]
        self._plans = self._db["productionplans"]

    async def create_session(
        self,
        *,
        production_plan_id: str,
        user_id: Optional[str] = None,
    ) -> dict:
        from bson import ObjectId
        try:
            oid = ObjectId(production_plan_id)
        except Exception:
            raise ValueError("Invalid production plan ID")
        plan = await self._plans.find_one({"_id": oid})
        if not plan:
            raise ValueError("Production plan not found")
        persona = (plan.get("storyAnalysis") or {}).get("characterPersona", "")
        session_id = str(uuid.uuid4())
        now = datetime.utcnow()
        doc = {
            "sessionId": session_id,
            "userId": user_id,
            "productionPlanId": oid,
            "persona": persona,
            "messages": [],
            "createdAt": now,
            "updatedAt": now,
        }
        await self._coll.insert_one(doc)
        gemini = get_gemini_service()
        chat_handle = gemini.create_chat_session(persona)
        _active_chats[session_id] = chat_handle
        return {"sessionId": session_id, "persona": persona}

    async def send_message(self, session_id: str, message: str) -> dict:
        doc = await self._coll.find_one({"sessionId": session_id})
        if not doc:
            raise ValueError("Chat session not found")
        gemini_chat = _active_chats.get(session_id)
        if not gemini_chat:
            gemini = get_gemini_service()
            gemini_chat = gemini.create_chat_session(doc["persona"])
            _active_chats[session_id] = gemini_chat
        # Send to Gemini (SDK-specific: might be send_message or chat.send_message)
        response = gemini_chat.send_message(message)
        model_response = getattr(response, "text", None) or (response.candidates[0].content.parts[0].text if getattr(response, "candidates", None) else "")
        now = datetime.utcnow()
        new_messages = [
            {"role": "user", "text": message, "timestamp": now},
            {"role": "model", "text": model_response, "timestamp": now},
        ]
        await self._coll.update_one(
            {"sessionId": session_id},
            {"$push": {"messages": {"$each": new_messages}}, "$set": {"updatedAt": now}},
        )
        return {"userMessage": message, "modelResponse": model_response}

    async def get_history(self, session_id: str) -> Optional[dict]:
        doc = await self._coll.find_one({"sessionId": session_id})
        if not doc:
            return None
        return {
            "sessionId": doc["sessionId"],
            "messages": doc.get("messages", []),
            "persona": doc.get("persona", ""),
        }

    async def delete_session(self, session_id: str) -> bool:
        _active_chats.pop(session_id, None)
        result = await self._coll.delete_one({"sessionId": session_id})
        return result.deleted_count > 0
