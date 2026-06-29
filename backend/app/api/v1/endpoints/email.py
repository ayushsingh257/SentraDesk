from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.core.security import RoleRequirement
from app.schemas.response import StandardResponse
from app.schemas.ticket import TicketResponse
from app.schemas.notification import MockEmailRequest
from app.services.email_listener import email_listener_service

router = APIRouter()

@router.post("/receive-mock", response_model=StandardResponse[TicketResponse])
def trigger_mock_email_intake(
    payload: MockEmailRequest,
    db: Session = Depends(get_db)
):
    """Simulate receiving an incoming email complaint to trigger parser and ticketing logic (Phase 37)."""
    ticket, is_new = email_listener_service.receive_mock_email(
        db,
        sender=payload.sender,
        subject=payload.subject,
        body=payload.body
    )
    return {
        "success": True,
        "data": ticket,
        "error": None
    }

@router.post("/poll", response_model=StandardResponse[str])
def trigger_mailbox_poll(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("system_administrator"))
):
    """Manually trigger IMAP mailbox polling check cycle (Phase 33)."""
    email_listener_service.poll_mailbox(db)
    return {
        "success": True,
        "data": "IMAP mailbox polling successfully executed",
        "error": None
    }
