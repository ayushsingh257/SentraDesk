from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10, max_length=2000)
    source: str = "portal" # portal, email, mobile, helpline, station
    reporter_name: str = Field(..., min_length=2)
    reporter_email: Optional[EmailStr] = None
    reporter_phone: Optional[str] = None
    category: Optional[str] = None
    fraud_amount: Optional[float] = None
    incident_date: Optional[str] = None
    suspect_name: Optional[str] = None
    suspect_phone: Optional[str] = None
    upi_id: Optional[str] = None
    bank_account: Optional[str] = None
    wallet_address: Optional[str] = None
    url: Optional[str] = None
    email: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class ComplaintResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    source: str
    status: str
    reporter_name: str
    reporter_email: Optional[str]
    reporter_phone: Optional[str]
    citizen_id: Optional[uuid.UUID] = None
    metadata_json: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TicketResponse(BaseModel):
    id: uuid.UUID
    ticket_number: str
    complaint_id: uuid.UUID
    category: str
    severity: str
    assigned_officer_id: Optional[uuid.UUID]
    assigned_group: Optional[str]
    jurisdiction: Optional[str]
    sla_deadline: Optional[datetime]
    is_escalated: bool
    l1_approved: bool
    l2_approved: bool
    rating: Optional[int] = None
    feedback: Optional[str] = None
    reopened_at: Optional[datetime] = None
    reopen_reason: Optional[str] = None
    created_at: datetime
    complaint: ComplaintResponse

    class Config:
        from_attributes = True

class FeedbackSubmit(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = Field(None, max_length=1000)

class ReopenRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=1000)

class AssignmentUpdate(BaseModel):
    officer_id: Optional[uuid.UUID] = None
    group: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

class CommentResponse(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    author_id: uuid.UUID
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class NoteCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

class NoteResponse(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    author_id: uuid.UUID
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class TimelineResponse(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    event_type: str
    description: str
    actor_id: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True

class ApprovalAction(BaseModel):
    decision: str = Field(..., pattern="^(approved|rejected)$")
    reason: str = Field("", max_length=255)
    level: int = Field(..., ge=1, le=2)

class MergeRequest(BaseModel):
    duplicate_ticket_id: uuid.UUID
