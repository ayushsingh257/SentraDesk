import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class EvidenceUploadRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)

class EvidenceUploadResponse(BaseModel):
    upload_url: str
    file_path: str

class EvidenceSaveRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    file_path: str = Field(..., min_length=1, max_length=500)
    mime_type: str = Field(..., min_length=1, max_length=100)
    file_size: int = Field(..., gt=0)
    sha256_hash: str = Field(..., min_length=64, max_length=64)

class EvidenceResponse(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    filename: str
    file_path: str
    mime_type: str
    file_size: int
    sha256_hash: str
    version: int
    uploaded_by_id: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True
