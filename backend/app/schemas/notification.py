import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr

class MockEmailRequest(BaseModel):
    sender: str = Field(..., description="Email address or name of the sender")
    subject: str = Field(..., min_length=2, max_length=255)
    body: str = Field(..., min_length=1)

class NotificationLogResponse(BaseModel):
    id: uuid.UUID
    ticket_id: Optional[uuid.UUID] = None
    recipient: str
    template_name: str
    status: str
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
