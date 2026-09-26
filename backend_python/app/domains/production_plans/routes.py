"""
Production plans domain: HTTP API routes.
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException, Query

from app.domains.production_plans.schemas import ProductionPlanCreate, UpdateAssetsRequest
from app.domains.production_plans.service import ProductionPlanService

router = APIRouter(prefix="/production-plans", tags=["production-plans"])
_service: ProductionPlanService | None = None


def get_service() -> ProductionPlanService:
    global _service
    if _service is None:
        _service = ProductionPlanService()
    return _service


@router.post("", status_code=201)
async def generate_production_plan(body: ProductionPlanCreate):
    try:
        svc = get_service()
        data = await svc.create(
            drawing_desc=body.drawingDesc or "",
            parent_prompt=body.parentPrompt,
            language=body.language or "English",
            image_base64=body.imageBase64,
            image_mime_type=body.imageMimeType,
            user_id=body.userId,
        )
        return {"success": True, "data": data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e) or "Failed to generate production plan")


@router.get("/{id}")
async def get_production_plan(id: str):
    svc = get_service()
    plan = await svc.get_by_id(id)
    if not plan:
        raise HTTPException(status_code=404, detail="Production plan not found")
    return {"success": True, "data": plan}


@router.get("/user/{user_id}")
async def get_user_production_plans(
    user_id: str,
    limit: int = Query(10, ge=1, le=100),
    page: int = Query(1, ge=1),
):
    svc = get_service()
    plans, total = await svc.get_by_user_id(user_id, limit=limit, page=page)
    return {
        "success": True,
        "data": plans,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit if limit else 0,
        },
    }


@router.patch("/{id}/assets")
async def update_production_plan_assets(id: str, body: UpdateAssetsRequest):
    svc = get_service()
    plan = await svc.update_assets(
        id,
        character_model_image=body.characterModelImage,
        keyframe_images=body.keyframeImages,
        video_urls=body.videoUrls,
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Production plan not found")
    return {"success": True, "data": plan}


@router.delete("/{id}")
async def delete_production_plan(id: str):
    svc = get_service()
    ok = await svc.delete(id)
    if not ok:
        raise HTTPException(status_code=404, detail="Production plan not found")
    return {"success": True, "message": "Production plan deleted successfully"}
