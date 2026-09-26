"""
Gemini domain: HTTP API routes for direct image/video generation.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.domains.gemini.service import get_gemini_service

router = APIRouter(prefix="/gemini", tags=["gemini"])


class GenerateImageRequest(BaseModel):
    prompt: str
    image: Optional[dict] = None  # { data: str, mimeType: str }


class GenerateVideoRequest(BaseModel):
    prompt: str
    keyframeImage: str  # data URI


@router.post("/generate-image")
async def generate_image(body: GenerateImageRequest):
    if not body.prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    try:
        svc = get_gemini_service()
        image_input = None
        if body.image and body.image.get("data") and body.image.get("mimeType"):
            image_input = {"data": body.image["data"], "mimeType": body.image["mimeType"]}
        img = svc.generate_image(body.prompt, image=image_input)
        return {"success": True, "data": {"image": img}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e) or "Failed to generate image")


@router.post("/generate-video")
async def generate_video(body: GenerateVideoRequest):
    if not body.prompt or not body.keyframeImage:
        raise HTTPException(status_code=400, detail="Prompt and keyframe image are required")
    try:
        svc = get_gemini_service()
        video_url = svc.generate_video(body.prompt, body.keyframeImage)
        return {"success": True, "data": {"videoUrl": video_url}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e) or "Failed to generate video")
