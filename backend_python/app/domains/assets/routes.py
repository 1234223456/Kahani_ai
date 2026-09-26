"""
Assets domain: HTTP API routes.
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.domains.assets.service import AssetService

router = APIRouter(prefix="/assets", tags=["assets"])
_service: AssetService | None = None


def get_service() -> AssetService:
    global _service
    if _service is None:
        _service = AssetService()
    return _service


class CharacterModelRequest(BaseModel):
    productionPlanId: str
    imageBase64: Optional[str] = None
    imageMimeType: Optional[str] = None


class KeyframeRequest(BaseModel):
    productionPlanId: str
    keyframeIndex: int
    characterModelData: Optional[str] = None
    characterModelMimeType: Optional[str] = None


class VideoRequest(BaseModel):
    productionPlanId: str
    clipIndex: int
    keyframeData: str
    keyframeMimeType: str


@router.post("/character-model", status_code=201)
async def generate_character_model(body: CharacterModelRequest):
    try:
        svc = get_service()
        data = await svc.generate_character_model(
            production_plan_id=body.productionPlanId,
            image_base64=body.imageBase64,
            image_mime_type=body.imageMimeType,
        )
        return {"success": True, "data": data}
    except ValueError as e:
        raise HTTPException(status_code=404 if "not found" in str(e).lower() else 400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e) or "Failed to generate character model")


@router.post("/keyframe", status_code=201)
async def generate_keyframe(body: KeyframeRequest):
    try:
        svc = get_service()
        data = await svc.generate_keyframe(
            production_plan_id=body.productionPlanId,
            keyframe_index=body.keyframeIndex,
            character_model_data=body.characterModelData,
            character_model_mime_type=body.characterModelMimeType,
        )
        return {"success": True, "data": data}
    except ValueError as e:
        raise HTTPException(status_code=404 if "not found" in str(e).lower() else 400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e) or "Failed to generate keyframe")


@router.post("/video", status_code=201)
async def generate_video(body: VideoRequest):
    try:
        svc = get_service()
        data = await svc.generate_video(
            production_plan_id=body.productionPlanId,
            clip_index=body.clipIndex,
            keyframe_data=body.keyframeData,
            keyframe_mime_type=body.keyframeMimeType,
        )
        return {"success": True, "data": data}
    except ValueError as e:
        raise HTTPException(status_code=404 if "not found" in str(e).lower() else 400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e) or "Failed to generate video")


@router.get("/plan/{production_plan_id}")
async def get_assets_by_plan(production_plan_id: str):
    svc = get_service()
    data = await svc.get_by_plan(production_plan_id)
    return {"success": True, "data": data}


@router.get("/{id}")
async def get_asset(id: str):
    svc = get_service()
    asset = await svc.get_by_id(id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"success": True, "data": asset}
