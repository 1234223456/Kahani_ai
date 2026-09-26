"""
Production plans domain: API request/response schemas (Pydantic).
"""
from typing import Optional, Any
from pydantic import BaseModel, Field


class ProductionPlanCreate(BaseModel):
    drawingDesc: Optional[str] = None
    parentPrompt: str
    language: str = "English"
    imageBase64: Optional[str] = None
    imageMimeType: Optional[str] = None
    userId: Optional[str] = None


class UpdateAssetsRequest(BaseModel):
    characterModelImage: Optional[str] = None
    keyframeImages: Optional[list[str]] = None
    videoUrls: Optional[list[str]] = None


class ProductionPlanResponse(BaseModel):
    success: bool = True
    data: dict[str, Any]


class ProductionPlanListResponse(BaseModel):
    success: bool = True
    data: list[dict[str, Any]]
    pagination: dict[str, Any]
