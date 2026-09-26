"""
Production plans domain: persistence models (MongoDB documents).
"""
from datetime import datetime
from typing import Optional


def _serialize_id(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc = {**doc, "id": str(doc["_id"]), "_id": str(doc["_id"])}
    return doc


# Collection name
COLLECTION = "productionplans"


def production_plan_from_doc(doc: dict) -> dict:
    """Normalize MongoDB document for API (id as string, dates)."""
    if not doc:
        return doc
    out = _serialize_id(dict(doc))
    for key in ("createdAt", "updatedAt", "created_at", "updated_at"):
        if key in out and hasattr(out[key], "isoformat"):
            out[key] = out[key].isoformat()
    return out


class ProductionPlanDocument:
    """In-memory representation of a production plan document."""

    def __init__(
        self,
        *,
        id: Optional[str] = None,
        user_id: Optional[str] = None,
        character_model: dict,
        story_analysis: dict,
        episode_script: dict,
        static_keyframes: dict,
        video_generation: dict,
        post_processing: dict,
        language: str,
        drawing_description: str,
        parent_prompt: str,
        character_image: Optional[str] = None,
        generated_assets: Optional[dict] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        self.id = id
        self.user_id = user_id
        self.character_model = character_model
        self.story_analysis = story_analysis
        self.episode_script = episode_script
        self.static_keyframes = static_keyframes
        self.video_generation = video_generation
        self.post_processing = post_processing
        self.language = language
        self.drawing_description = drawing_description
        self.parent_prompt = parent_prompt
        self.character_image = character_image
        self.generated_assets = generated_assets or {}
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    def to_db(self) -> dict:
        return {
            "userId": self.user_id,
            "characterModel": self.character_model,
            "storyAnalysis": self.story_analysis,
            "episodeScript": self.episode_script,
            "staticKeyframes": self.static_keyframes,
            "videoGeneration": self.video_generation,
            "postProcessing": self.post_processing,
            "language": self.language,
            "drawingDescription": self.drawing_description,
            "parentPrompt": self.parent_prompt,
            "characterImage": self.character_image,
            "generatedAssets": self.generated_assets,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }

    @classmethod
    def from_db(cls, doc: dict) -> "ProductionPlanDocument":
        if not doc:
            raise ValueError("Empty document")
        oid = doc.get("_id")
        return cls(
            id=str(oid) if oid else None,
            user_id=doc.get("userId"),
            character_model=doc.get("characterModel", {}),
            story_analysis=doc.get("storyAnalysis", {}),
            episode_script=doc.get("episodeScript", {}),
            static_keyframes=doc.get("staticKeyframes", {}),
            video_generation=doc.get("videoGeneration", {}),
            post_processing=doc.get("postProcessing", {}),
            language=doc.get("language", "English"),
            drawing_description=doc.get("drawingDescription", ""),
            parent_prompt=doc.get("parentPrompt", ""),
            character_image=doc.get("characterImage"),
            generated_assets=doc.get("generatedAssets"),
            created_at=doc.get("createdAt"),
            updated_at=doc.get("updatedAt"),
        )
