from pydantic import BaseModel, Field

class ClosureRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)

class ApprovalDecision(BaseModel):
    comment: str = Field(..., min_length=3, max_length=500)
