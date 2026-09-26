"""
Assets domain: application service (generate and store character model, keyframe, video).
"""
from datetime import datetime
from typing import Optional

from app.config.database import get_database
from app.domains.assets.models import COLLECTION, asset_from_doc
from app.domains.gemini.service import get_gemini_service


class AssetService:
    def __init__(self):
        self._db = get_database()
        self._coll = self._db[COLLECTION]
        self._plans = self._db["productionplans"]

    async def _get_plan(self, production_plan_id: str):
        from bson import ObjectId
        try:
            oid = ObjectId(production_plan_id)
        except Exception:
            return None
        return await self._plans.find_one({"_id": oid})

    async def generate_character_model(
        self,
        *,
        production_plan_id: str,
        image_base64: Optional[str] = None,
        image_mime_type: Optional[str] = None,
    ) -> dict:
        plan = await self._get_plan(production_plan_id)
        if not plan:
            raise ValueError("Production plan not found")
        cm = plan.get("characterModel") or {}
        prompt = f'{cm.get("action", "")}. The character should be based on this description: "{cm.get("source", "")}". Style: 3D Disney Pixar animation style, high quality, vibrant colors, smooth textures, expressive features, professional animation quality.'
        image_input = None
        if image_base64 and image_mime_type:
            image_input = {"data": image_base64, "mimeType": image_mime_type}
        gemini = get_gemini_service()
        generated_image = gemini.generate_image(prompt, image_input)
        now = datetime.utcnow()
        doc = {
            "productionPlanId": plan["_id"],
            "assetType": "character_model",
            "data": generated_image,
            "prompt": prompt,
            "status": "completed",
            "createdAt": now,
            "updatedAt": now,
        }
        result = await self._coll.insert_one(doc)
        doc["_id"] = result.inserted_id
        return asset_from_doc(doc)

    async def generate_keyframe(
        self,
        *,
        production_plan_id: str,
        keyframe_index: int,
        character_model_data: Optional[str] = None,
        character_model_mime_type: Optional[str] = None,
    ) -> dict:
        plan = await self._get_plan(production_plan_id)
        if not plan:
            raise ValueError("Production plan not found")
        keyframes = (plan.get("staticKeyframes") or {}).get("keyframes") or []
        if keyframe_index < 0 or keyframe_index >= len(keyframes):
            raise ValueError("Invalid keyframe index")
        kf = keyframes[keyframe_index]
        prompt = kf.get("prompt", "")
        image_input = None
        if character_model_data and character_model_mime_type:
            image_input = {"data": character_model_data, "mimeType": character_model_mime_type}
        gemini = get_gemini_service()
        generated_image = gemini.generate_image(prompt, image_input)
        now = datetime.utcnow()
        doc = {
            "productionPlanId": plan["_id"],
            "assetType": "keyframe",
            "assetIndex": keyframe_index,
            "data": generated_image,
            "prompt": prompt,
            "status": "completed",
            "createdAt": now,
            "updatedAt": now,
        }
        result = await self._coll.insert_one(doc)
        doc["_id"] = result.inserted_id
        return asset_from_doc(doc)

    async def generate_video(
        self,
        *,
        production_plan_id: str,
        clip_index: int,
        keyframe_data: str,
        keyframe_mime_type: str,
    ) -> dict:
        plan = await self._get_plan(production_plan_id)
        if not plan:
            raise ValueError("Production plan not found")
        clips = (plan.get("videoGeneration") or {}).get("clips") or []
        if clip_index < 0 or clip_index >= len(clips):
            raise ValueError("Invalid clip index")
        if not keyframe_data or not keyframe_mime_type:
            raise ValueError("Keyframe data is required for video generation")
        clip = clips[clip_index]
        prompt = clip.get("prompt", "")
        now = datetime.utcnow()
        doc = {
            "productionPlanId": plan["_id"],
            "assetType": "video",
            "assetIndex": clip_index,
            "prompt": prompt,
            "status": "generating",
            "createdAt": now,
            "updatedAt": now,
        }
        result = await self._coll.insert_one(doc)
        doc["_id"] = result.inserted_id
        try:
            gemini = get_gemini_service()
            keyframe_uri = f"data:{keyframe_mime_type};base64,{keyframe_data}"
            video_url = gemini.generate_video(prompt, keyframe_uri)
            await self._coll.update_one(
                {"_id": doc["_id"]},
                {"$set": {"url": video_url, "status": "completed", "updatedAt": datetime.utcnow()}},
            )
            doc["url"] = video_url
            doc["status"] = "completed"
        except Exception as e:
            await self._coll.update_one(
                {"_id": doc["_id"]},
                {"$set": {"status": "failed", "errorMessage": str(e), "updatedAt": datetime.utcnow()}},
            )
            doc["status"] = "failed"
            doc["errorMessage"] = str(e)
            raise
        return asset_from_doc(doc)

    async def get_by_plan(self, production_plan_id: str) -> list[dict]:
        from bson import ObjectId
        try:
            oid = ObjectId(production_plan_id)
        except Exception:
            return []
        cursor = self._coll.find({"productionPlanId": oid}).sort([("assetType", 1), ("assetIndex", 1)])
        docs = await cursor.to_list(length=1000)
        return [asset_from_doc(d) for d in docs]

    async def get_by_id(self, asset_id: str) -> Optional[dict]:
        from bson import ObjectId
        try:
            oid = ObjectId(asset_id)
        except Exception:
            return None
        doc = await self._coll.find_one({"_id": oid})
        if not doc:
            return None
        return asset_from_doc(doc)
