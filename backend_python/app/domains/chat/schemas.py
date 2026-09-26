from pydantic import BaseModel
from typing import Optional


class CreateSessionRequest(BaseModel):
    productionPlanId: str
    userId: Optional[str] = None


class SendMessageRequest(BaseModel):
    message: str
