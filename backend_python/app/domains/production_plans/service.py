"""
Production plans domain: application service (orchestrates persistence + Gemini).
"""
from datetime import datetime
from typing import Optional

from app.config.database import get_database
from app.domains.production_plans.models import (
    COLLECTION,
    ProductionPlanDocument,
    production_plan_from_doc,
)
from app.domains.gemini.service import get_gemini_service


class ProductionPlanService:
    def __init__(self):
        self._db = get_database()
        self._coll = self._db[COLLECTION]

    async def create(
        self,
        *,
        drawing_desc: str,
        parent_prompt: str,
        language: str = "English",
        image_base64: Optional[str] = None,
        image_mime_type: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> dict:
        if not drawing_desc and not image_base64:
            raise ValueError("Please provide either a drawing description or an image.")
        if not parent_prompt:
            raise ValueError("Please provide a parent prompt.")

        gemini = get_gemini_service()
        plan_dict = gemini.generate_production_plan(
            drawing=drawing_desc or "",
            parent_prompt=parent_prompt,
            language=language or "English",
            image_base64=image_base64,
            image_mime_type=image_mime_type,
        )

        now = datetime.utcnow()
        doc = {
            "userId": user_id,
            "characterModel": plan_dict.get("characterModel", {}),
            "storyAnalysis": plan_dict.get("storyAnalysis", {}),
            "episodeScript": plan_dict.get("episodeScript", {}),
            "staticKeyframes": plan_dict.get("staticKeyframes", {}),
            "videoGeneration": plan_dict.get("videoGeneration", {}),
            "postProcessing": plan_dict.get("postProcessing", {}),
            "language": language or "English",
            "drawingDescription": drawing_desc or "",
            "parentPrompt": parent_prompt,
            "characterImage": f"data:{image_mime_type};base64,{image_base64}" if image_base64 and image_mime_type else None,
            "generatedAssets": {},
            "createdAt": now,
            "updatedAt": now,
        }
        result = await self._coll.insert_one(doc)
        doc["_id"] = result.inserted_id
        out = production_plan_from_doc(doc)
        return {"id": str(result.inserted_id), **{k: v for k, v in out.items() if k != "id"}}

    async def get_by_id(self, id: str) -> Optional[dict]:
        from bson import ObjectId
        try:
            oid = ObjectId(id)
        except Exception:
            return None
        doc = await self._coll.find_one({"_id": oid})
        if not doc:
            return None
        return production_plan_from_doc(doc)

    async def get_by_user_id(
        self,
        user_id: str,
        *,
        limit: int = 10,
        page: int = 1,
    ) -> tuple[list[dict], int]:
        skip = (page - 1) * limit
        cursor = self._coll.find({"userId": user_id}).sort("createdAt", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        total = await self._coll.count_documents({"userId": user_id})
        items = [production_plan_from_doc(d) for d in docs]
        return items, total

    async def update_assets(
        self,
        id: str,
        *,
        character_model_image: Optional[str] = None,
        keyframe_images: Optional[list[str]] = None,
        video_urls: Optional[list[str]] = None,
    ) -> Optional[dict]:
        from bson import ObjectId
        try:
            oid = ObjectId(id)
        except Exception:
            return None
        doc = await self._coll.find_one({"_id": oid})
        if not doc:
            return None
        updates = {}
        if character_model_image is not None:
            updates["generatedAssets.characterModelImage"] = character_model_image
        if keyframe_images is not None:
            updates["generatedAssets.keyframeImages"] = keyframe_images
        if video_urls is not None:
            updates["generatedAssets.videoUrls"] = video_urls
        if not updates:
            return production_plan_from_doc(doc)
        updates["updatedAt"] = datetime.utcnow()
        await self._coll.update_one({"_id": oid}, {"$set": updates})
        doc = await self._coll.find_one({"_id": oid})
        return production_plan_from_doc(doc)

    async def delete(self, id: str) -> bool:
        from bson import ObjectId
        try:
            oid = ObjectId(id)
        except Exception:
            return False
        result = await self._coll.delete_one({"_id": oid})
        return result.deleted_count > 0
