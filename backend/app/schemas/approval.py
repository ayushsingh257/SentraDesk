from pydantic import BaseModel, Field
import uuid
from datetime import datetime
from typing import Optional

class ClosureRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)

class ApprovalDecision(BaseModel):
    comment: str = Field(..., min_length=3, max_length=500)

class ApprovalRecordResponse(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    approver_id: uuid.UUID
    level: int
    decision: str
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

