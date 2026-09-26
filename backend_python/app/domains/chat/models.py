"""
Chat domain: persistence models (MongoDB documents).
"""
from datetime import datetime
from typing import Optional

COLLECTION = "chatsessions"


def chat_session_from_doc(doc: dict) -> dict:
    if not doc:
        return doc
    out = dict(doc)
    if "_id" in out:
        out["id"] = str(out["_id"])
    for key in ("createdAt", "updatedAt", "created_at", "updated_at"):
        if key in out and hasattr(out.get(key), "isoformat"):
            out[key] = out[key].isoformat()
    if "messages" in out:
        for m in out["messages"]:
            if hasattr(m.get("timestamp"), "isoformat"):
                m["timestamp"] = m["timestamp"].isoformat()
    return out
