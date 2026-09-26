"""
Chat domain: HTTP API routes.
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException

from app.domains.chat.schemas import CreateSessionRequest, SendMessageRequest
from app.domains.chat.service import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])
_service: ChatService | None = None


def get_service() -> ChatService:
    global _service
    if _service is None:
        _service = ChatService()
    return _service


@router.post("/sessions", status_code=201)
async def create_chat_session(body: CreateSessionRequest):
    if not body.productionPlanId:
        raise HTTPException(status_code=400, detail="Production plan ID is required")
    try:
        svc = get_service()
        data = await svc.create_session(
            production_plan_id=body.productionPlanId,
            user_id=body.userId,
        )
        return {"success": True, "data": data}
    except ValueError as e:
        raise HTTPException(status_code=404 if "not found" in str(e).lower() else 400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e) or "Failed to create chat session")


@router.post("/sessions/{session_id}/messages")
async def send_message(session_id: str, body: SendMessageRequest):
    if not body.message:
        raise HTTPException(status_code=400, detail="Message is required")
    try:
        svc = get_service()
        data = await svc.send_message(session_id, body.message)
        return {"success": True, "data": data}
    except ValueError as e:
        raise HTTPException(status_code=404 if "not found" in str(e).lower() else 400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e) or "Failed to send message")


@router.get("/sessions/{session_id}")
async def get_chat_history(session_id: str):
    svc = get_service()
    data = await svc.get_history(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return {"success": True, "data": data}


@router.delete("/sessions/{session_id}")
async def delete_chat_session(session_id: str):
    svc = get_service()
    ok = await svc.delete_session(session_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return {"success": True, "message": "Chat session deleted successfully"}
