"""
Gemini domain: AI generation service (production plan, image, video, chat).
"""
import json
import os
import time
from typing import Any, Optional

from app.config.settings import get_settings

# Lazy client to avoid import errors if key missing
_client: Any = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    try:
        from google import genai
    except ImportError:
        raise RuntimeError(
            "Install google-genai: pip install google-genai"
        )
    settings = get_settings()
    api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY", "")
    if not api_key or not api_key.strip():
        raise RuntimeError(
            "GEMINI_API_KEY environment variable is required. Set it in .env or environment."
        )
    print(f"✅ Initializing Gemini with API key (length: {len(api_key)})")
    _client = genai.Client(api_key=api_key)
    return _client


# Production plan JSON schema for structured output (matches Node schema)
PRODUCTION_PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "characterModel": {
            "type": "object",
            "properties": {"source": {"type": "string"}, "action": {"type": "string"}},
            "required": ["source", "action"],
        },
        "storyAnalysis": {
            "type": "object",
            "properties": {
                "hero": {"type": "string"},
                "parentPrompt": {"type": "string"},
                "coreLesson": {"type": "string"},
                "villain": {"type": "string"},
                "characterArc": {"type": "string"},
                "characterPersona": {"type": "string"},
            },
            "required": ["hero", "parentPrompt", "coreLesson", "villain", "characterArc", "characterPersona"],
        },
        "episodeScript": {
            "type": "object",
            "properties": {
                "action": {"type": "string"},
                "scenes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "scene": {"type": "integer"},
                            "title": {"type": "string"},
                            "dialog": {"type": "string"},
                        },
                        "required": ["scene", "title", "dialog"],
                    },
                },
            },
            "required": ["action", "scenes"],
        },
        "staticKeyframes": {
            "type": "object",
            "properties": {
                "action": {"type": "string"},
                "keyframes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "keyframe": {"type": "integer"},
                            "scene": {"type": "integer"},
                            "prompt": {"type": "string"},
                        },
                        "required": ["keyframe", "scene", "prompt"],
                    },
                },
            },
            "required": ["action", "keyframes"],
        },
        "videoGeneration": {
            "type": "object",
            "properties": {
                "action": {"type": "string"},
                "clips": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "clip": {"type": "integer"},
                            "input": {"type": "string"},
                            "prompt": {"type": "string"},
                        },
                        "required": ["clip", "input", "prompt"],
                    },
                },
            },
            "required": ["action", "clips"],
        },
        "postProcessing": {
            "type": "object",
            "properties": {"action": {"type": "string"}},
            "required": ["action"],
        },
    },
    "required": [
        "characterModel",
        "storyAnalysis",
        "episodeScript",
        "staticKeyframes",
        "videoGeneration",
        "postProcessing",
    ],
}


class GeminiService:
    """AI generation via Gemini API."""

    def __init__(self):
        self._client = None
        self._api_key = None

    def _client_or_init(self):
        if self._client is None:
            self._client = _get_client()
            self._api_key = get_settings().gemini_api_key or os.environ.get("GEMINI_API_KEY", "")
        return self._client

    def generate_production_plan(
        self,
        *,
        drawing: str,
        parent_prompt: str,
        language: str = "English",
        image_base64: Optional[str] = None,
        image_mime_type: Optional[str] = None,
    ) -> dict[str, Any]:
        prompt = f"""
You are Gemini 2.5 Pro, the 'Story Arc Engine' for a children's animation platform. Your task is to receive a child's drawing (as an image) and/or a text description, plus a parent's lesson, then output a complete Image-to-Video (I2V) production plan for a 32-second cartoon. The provided image of the drawing is the primary source of truth for the character's appearance.

Your operation is governed by these strict constraints:
1.  Total Length: Exactly 32 seconds.
2.  Clip Structure: 4 (four) 8-second video clips.
3.  Creative Structure: Every story must contain a Hero, a Villain, and a Character Arc.
4.  I2V Workflow:
    - A 'gemini-2.5-flash-image' model is used to first create a master character avatar based on the user's drawing, and then to generate 4 static keyframes (one for each scene), placing the hero avatar into the scene.
    - A 'veo-3.1-fast-generate-preview' model is used in I2V mode to animate each of the 4 static keyframes for 8 seconds.
5.  Visual Style: ALL images (character model and all keyframes) MUST be in 3D Disney Pixar animation style.
6.  Consistency: The Hero's appearance (based on the input drawing) MUST be EXACTLY consistent across all clips.
7.  Episode Script Requirements: Each scene MUST have "dialog" (the actual words the hero character speaks). The "dialog" field should contain direct speech suitable for an 8-second clip.
8.  Output: You MUST output a single, valid JSON object that strictly adheres to the provided schema. Do not include any text, markdown formatting, or explanations outside of the JSON object.

Language for all generated content: {language}

Inputs:
[Drawing Description]: {drawing}
[Parent Prompt]: {parent_prompt}
"""
        client = self._client_or_init()
        parts: list[Any] = []
        if image_base64 and image_mime_type:
            parts.append(
                client.types.Part.from_bytes(
                    data=bytes(image_base64, "utf-8") if isinstance(image_base64, str) else image_base64,
                    mime_type=image_mime_type,
                )
            )
        parts.append(client.types.Part.from_text(prompt))

        models_to_try = ["gemini-2.5-pro", "gemini-1.5-pro", "gemini-pro"]
        last_error: Optional[Exception] = None
        for model in models_to_try:
            try:
                print(f"🔄 Attempting to use model: {model}")
                response = client.models.generate_content(
                    model=model,
                    contents=parts if len(parts) > 1 else prompt,
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": PRODUCTION_PLAN_SCHEMA,
                    },
                )
                print(f"✅ Successfully used model: {model}")
                return self._parse_production_plan_response(response)
            except Exception as e:
                print(f"⚠️ Model {model} failed: {e}")
                last_error = e
                if "403" in str(e) or "PERMISSION_DENIED" in str(e) or "not found" in str(e).lower():
                    continue
                raise
        raise RuntimeError(
            f"Failed to generate production plan with all models. Last error: {last_error}. "
            f"Ensure API key has access to one of: {', '.join(models_to_try)}."
        )

    def _parse_production_plan_response(self, response: Any) -> dict[str, Any]:
        text = getattr(response, "text", None) or (response.candidates[0].content.parts[0].text if getattr(response, "candidates", None) else None)
        if not text or not str(text).strip():
            raise ValueError("The AI returned an empty response. Please try again.")
        try:
            return json.loads(str(text).strip())
        except json.JSONDecodeError as e:
            raise ValueError("The AI returned an invalid story structure. Please try again.") from e

    def generate_image(
        self,
        prompt: str,
        image: Optional[dict] = None,
    ) -> str:
        """Generate image; returns data URI (data:mime;base64,...)."""
        client = self._client_or_init()
        contents: list[Any] = []
        if image:
            data = image.get("data")
            mime = image.get("mimeType", "image/png")
            if isinstance(data, str):
                import base64
                data = base64.b64decode(data)
            contents.append(client.types.Part.from_bytes(data=data, mime_type=mime))
        contents.append(client.types.Part.from_text(prompt))

        response = client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=contents if len(contents) > 1 else prompt,
            config={"response_modalities": ["IMAGE", "TEXT"]},
        )
        # Extract image from response
        if getattr(response, "candidates", None) and response.candidates:
            for part in response.candidates[0].content.parts:
                if getattr(part, "inline_data", None):
                    import base64
                    b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                    mime = getattr(part.inline_data, "mime_type", "image/png") or "image/png"
                    return f"data:{mime};base64,{b64}"
        raise ValueError("Image generation failed to return an image.")

    def generate_video(self, prompt: str, keyframe_image_data_uri: str) -> str:
        """Generate video from keyframe image; returns URL with key."""
        import base64
        if "," in keyframe_image_data_uri:
            header, b64 = keyframe_image_data_uri.split(",", 1)
            mime = "image/png"
            if ";" in header:
                for part in header.split(";"):
                    if part.strip().startswith("data:"):
                        mime = part.replace("data:", "").strip()
                        break
            image_bytes = base64.b64decode(b64)
        else:
            image_bytes = base64.b64decode(keyframe_image_data_uri)
            mime = "image/png"

        client = self._client_or_init()
        op = client.models.generate_videos(
            model="veo-3.1-fast-generate-preview",
            prompt=prompt,
            image=image_bytes,
            config={"number_of_videos": 1, "resolution": "720p", "aspect_ratio": "16:9"},
        )
        while not getattr(op, "done", True):
            time.sleep(10)
            op = client.operations.get(op)

        download_link = None
        if getattr(op, "response", None) and getattr(op.response, "generated_videos", None) and op.response.generated_videos:
            v = op.response.generated_videos[0]
            if getattr(v, "video", None) and getattr(v.video, "uri", None):
                download_link = v.video.uri
        if not download_link:
            raise ValueError("Video generation failed or did not return a valid link.")
        api_key = self._api_key or get_settings().gemini_api_key or os.environ.get("GEMINI_API_KEY", "")
        return f"{download_link}&key={api_key}"

    def create_chat_session(self, persona: str) -> Any:
        """Create a chat session object for multi-turn conversation."""
        return self._client_or_init().chats.create(
            model="gemini-2.5-flash",
            config={
                "system_instruction": f'You are a character for a child. Your persona is: "{persona}". Keep your responses friendly, simple, and in character. Never break character.',
            },
        )


# Singleton used by domains
def get_gemini_service() -> GeminiService:
    return GeminiService()
