from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.response import StandardResponse
from app.schemas.ticket import ComplaintCreate, TicketResponse
from app.services.ticket import ticket_service

router = APIRouter()

@router.post("/submit", response_model=StandardResponse[TicketResponse])
def submit_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db)
):
    """Public citizen complaint submission endpoint (does not require authentication headers)."""
    res = ticket_service.create_complaint_and_ticket(
        db,
        title=payload.title,
        description=payload.description,
        source=payload.source,
        reporter_name=payload.reporter_name,
        reporter_email=payload.reporter_email,
        reporter_phone=payload.reporter_phone,
        metadata_json=payload.metadata_json
    )
    return {
        "success": True,
        "data": res,
        "error": None
    }
