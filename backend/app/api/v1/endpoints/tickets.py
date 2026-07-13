from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.core.security import JWTBearer, RoleRequirement
from app.core.exceptions import AuthError, NotFoundError, ValidationError
from app.schemas.response import StandardResponse
from app.schemas.ticket import (
    ComplaintCreate,
    TicketResponse,
    AssignmentUpdate,
    StatusUpdate,
    CommentCreate,
    CommentResponse,
    NoteCreate,
    NoteResponse,
    TimelineResponse,
    MergeRequest
)
from app.services.ticket import ticket_service
from app.repositories.ticket import ticket_repository

router = APIRouter()

@router.post("", response_model=StandardResponse[TicketResponse])
def create_ticket(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("citizen"))
):
    """File a new complaint and generate a corresponding ticket."""
    actor_id = uuid.UUID(current_user.get("sub"))
    role = current_user.get("role")
    
    citizen_id = None
    if role == "citizen":
        citizen_id = actor_id
        
    meta = payload.metadata_json or {}
    if payload.category:
        meta["category"] = payload.category
    if payload.fraud_amount is not None:
        meta["amount"] = payload.fraud_amount
    if payload.incident_date:
        meta["incident_date"] = payload.incident_date
    if payload.suspect_name:
        meta["suspect_name"] = payload.suspect_name
    if payload.suspect_phone:
        meta["suspect_phone"] = payload.suspect_phone
    if payload.upi_id:
        meta["upi_id"] = payload.upi_id
    if payload.bank_account:
        meta["bank_account"] = payload.bank_account
    if payload.wallet_address:
        meta["wallet_address"] = payload.wallet_address
    if payload.url:
        meta["url"] = payload.url
    if payload.email:
        meta["email"] = payload.email

    res = ticket_service.create_complaint_and_ticket(
        db,
        title=payload.title,
        description=payload.description,
        source=payload.source,
        reporter_name=payload.reporter_name,
        reporter_email=payload.reporter_email,
        reporter_phone=payload.reporter_phone,
        citizen_id=citizen_id,
        metadata_json=meta
    )
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.get("", response_model=StandardResponse[List[TicketResponse]])
def list_tickets(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    assigned_officer_id: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
    needs_review: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Retrieve and filter system tickets (requires officer or higher permissions)."""
    res = ticket_repository.get_tickets_filtered(
        db,
        status=status,
        severity=severity,
        assigned_officer_id=assigned_officer_id,
        search_query=search,
        needs_review=needs_review,
        skip=skip,
        limit=limit
    )
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.get("/my-tickets", response_model=StandardResponse[List[TicketResponse]])
def get_my_tickets(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|ticket_number)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("citizen"))
):
    """Retrieve complaints filed by the authenticated citizen."""
    actor_id = uuid.UUID(current_user.get("sub"))
    from app.models.ticket import Ticket, Complaint
    query = db.query(Ticket).join(Complaint).filter(Complaint.citizen_id == actor_id)
    
    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Ticket.category == category)
    if search:
        search_like = f"%{search}%"
        query = query.filter(
            (Ticket.ticket_number.ilike(search_like)) |
            (Complaint.title.ilike(search_like)) |
            (Complaint.description.ilike(search_like))
        )
        
    order_column = Ticket.created_at
    if sort_by == "ticket_number":
        order_column = Ticket.ticket_number
        
    if sort_order == "desc":
        query = query.order_by(order_column.desc())
    else:
        query = query.order_by(order_column.asc())
        
    res = query.all()
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.get("/{id}", response_model=StandardResponse[TicketResponse])
def get_ticket_details(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("citizen"))
):
    """Retrieve detailed properties of a specific ticket."""
    res = ticket_repository.get(db, id)
    if not res:
        raise NotFoundError("Ticket not found")
        
    role = current_user.get("role")
    actor_id = uuid.UUID(current_user.get("sub"))
    if role == "citizen":
        if res.complaint.citizen_id != actor_id:
            raise AuthError(
                message="Access denied. You can only view your own complaints.",
                code="FORBIDDEN_TICKET_ACCESS",
                status_code=403
            )
            
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.put("/{id}/assign", response_model=StandardResponse[TicketResponse])
def assign_ticket(
    id: uuid.UUID,
    payload: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("supervisor"))
):
    """Assign a ticket to an investigator officer/group (requires supervisor or higher permissions)."""
    actor_id = uuid.UUID(current_user.get("sub"))
    res = ticket_service.assign_ticket(
        db,
        ticket_id=id,
        officer_id=payload.officer_id,
        group=payload.group,
        actor_id=actor_id
    )
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.put("/{id}/status", response_model=StandardResponse[TicketResponse])
def update_ticket_status(
    id: uuid.UUID,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Transition the ticket lifecycle status (requires officer or higher permissions)."""
    actor_id = uuid.UUID(current_user.get("sub"))
    actor_role = current_user.get("role")
    res = ticket_service.update_ticket_status(
        db,
        ticket_id=id,
        new_status=payload.status,
        actor_id=actor_id,
        actor_role=actor_role
    )
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.post("/{id}/comments", response_model=StandardResponse[CommentResponse])
def add_comment(
    id: uuid.UUID,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("citizen"))
):
    """Submit a public discussion thread comment."""
    ticket = ticket_repository.get(db, id)
    if not ticket:
        raise NotFoundError("Ticket not found")
        
    role = current_user.get("role")
    actor_id = uuid.UUID(current_user.get("sub"))
    if role == "citizen":
        if ticket.complaint.citizen_id != actor_id:
            raise AuthError(
                message="Access denied. You can only comment on your own complaints.",
                code="FORBIDDEN_TICKET_ACCESS",
                status_code=403
            )
            
    res = ticket_service.submit_comment(
        db,
        ticket_id=id,
        content=payload.content,
        author_id=actor_id
    )
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.post("/{id}/notes", response_model=StandardResponse[NoteResponse])
def add_private_note(
    id: uuid.UUID,
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("investigator"))
):
    """Submit a private internal investigation note (requires investigator or higher permissions)."""
    actor_id = uuid.UUID(current_user.get("sub"))
    res = ticket_service.submit_private_note(
        db,
        ticket_id=id,
        content=payload.content,
        author_id=actor_id
    )
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.get("/{id}/notes", response_model=StandardResponse[List[NoteResponse]])
def get_private_notes(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Retrieve all private internal notes for a ticket (requires investigator or higher)."""
    ticket = ticket_repository.get(db, id)
    if not ticket:
        raise NotFoundError("Ticket not found")
        
    return {
        "success": True,
        "data": ticket.private_notes,
        "error": None
    }

@router.get("/{id}/timeline", response_model=StandardResponse[List[TimelineResponse]])
def get_timeline(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("citizen"))
):
    """Retrieve chronologically ordered lifecycle logs for a ticket."""
    ticket = ticket_repository.get(db, id)
    if not ticket:
        raise NotFoundError("Ticket not found")
        
    role = current_user.get("role")
    actor_id = uuid.UUID(current_user.get("sub"))
    if role == "citizen":
        if ticket.complaint.citizen_id != actor_id:
            raise AuthError(
                message="Access denied. You can only view timeline for your own complaints.",
                code="FORBIDDEN_TICKET_ACCESS",
                status_code=403
            )
            
    res = ticket_repository.get_timeline(db, ticket_id=id)
    return {
        "success": True,
        "data": res,
        "error": None
    }


@router.post("/merge", response_model=StandardResponse[TicketResponse])
def merge_tickets(
    payload: MergeRequest,
    primary_ticket_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("supervisor"))
):
    """Merge a duplicate ticket into primary records (requires supervisor permissions)."""
    actor_id = uuid.UUID(current_user.get("sub"))
    res = ticket_service.merge_duplicate_tickets(
        db,
        primary_ticket_id=primary_ticket_id,
        duplicate_ticket_id=payload.duplicate_ticket_id,
        actor_id=actor_id
    )
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.get("/{id}/similar", response_model=StandardResponse[List[Dict[str, Any]]])
def get_similar_tickets(
    id: uuid.UUID,
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Retrieve highly similar past complaints using vector search (requires officer or higher permissions)."""
    from app.services.ai_pipeline import ai_pipeline_service
    ticket = ticket_repository.get(db, id)
    if not ticket or not ticket.complaint:
        return {
            "success": True,
            "data": [],
            "error": None
        }
    similar = ai_pipeline_service.find_similar_complaints(
        text=ticket.complaint.description,
        limit=limit,
        exclude_id=id
    )
    return {
        "success": True,
        "data": similar,
        "error": None
    }

@router.get("/{id}/explain", response_model=StandardResponse[Dict[str, Any]])
def get_ticket_ai_explanation(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Explain AI model triage predictions and risk scoring breakdown (requires officer or higher permissions)."""
    ticket = ticket_repository.get(db, id)
    if not ticket or not ticket.complaint:
        return {
            "success": False,
            "data": None,
            "error": {"message": "Ticket not found", "code": "TICKET_NOT_FOUND"}
        }
    
    meta = ticket.complaint.metadata_json or {}
    
    # Retrieve pre-stored AI telemetry or calculate dynamically
    ai_cat = meta.get("ai_category_prediction", ticket.category)
    ai_conf = meta.get("ai_confidence", 100.0)
    ai_risk = meta.get("ai_risk_score", 10.0)
    ai_lang = meta.get("ai_language", "en")
    
    # Construct rich reasoning explanation text
    reasoning = (
        f"The AI classification model (SGDClassifier) predicted category '{ai_cat}' "
        f"with {ai_conf}% confidence. Language detected was '{ai_lang}'. "
        f"The Severity Engine computed a risk score of {ai_risk} out of 100, "
        f"which maps to a '{ticket.severity}' severity tier. "
    )
    
    # Add extraction notes
    extracted = meta.get("ai_extracted_entities", {})
    found_entities = []
    for k, v in extracted.items():
        if v:
            found_entities.append(f"{k}: {', '.join(v)}")
    if found_entities:
        reasoning += f"Technical indicators extracted: {'; '.join(found_entities)}."
    else:
        reasoning += "No technical indicators (phone, email, UPI, bank, crypto) were extracted."
        
    return {
        "success": True,
        "data": {
            "predicted_category": ai_cat,
            "confidence": ai_conf,
            "risk_score": ai_risk,
            "language": ai_lang,
            "reasoning": reasoning,
            "extracted_entities": extracted
        },
        "error": None
    }

@router.get("/{id}/ai-summary", response_model=StandardResponse[Dict[str, Any]])
def get_ticket_ai_summary_card(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Retrieve the Investigator AI Assistant summary card (requires officer or higher permissions)."""
    ticket = ticket_repository.get(db, id)
    if not ticket or not ticket.complaint:
        return {
            "success": False,
            "data": None,
            "error": {"message": "Ticket not found", "code": "TICKET_NOT_FOUND"}
        }
    
    meta = ticket.complaint.metadata_json or {}
    category = ticket.category
    amount = meta.get("amount", 0.0)
    
    # Extract key facts
    key_facts = [
        f"Complainant reporter identity matches '{ticket.complaint.reporter_name}'.",
        f"Initial submission source marked as '{ticket.complaint.source}'."
    ]
    if amount > 0:
        key_facts.append(f"Financial transaction loss amount: {amount} INR.")
        
    extracted = meta.get("ai_extracted_entities", {})
    for k, v in extracted.items():
        if v:
            key_facts.append(f"Extracted {k}: {', '.join(v)}")
            
    # Suggested next steps based on category & details
    suggested_steps = ["Establish contact with complainant to verify reporter identity details."]
    if category == "Cyber Financial Fraud":
        suggested_steps.extend([
            "Contact financial partners governing extracted UPI / Bank tags to halt transactions.",
            "Verify SHA-256 signatures of upload receipts/screenshots if available.",
            "Register immediate transaction alert tags with the cyber cell nodal dashboard."
        ])
    elif category == "Hacking":
        suggested_steps.extend([
            "Audit firewall traffic records surrounding target domain/IP address matches.",
            "Instruct target to update compromised login credentials and implement 2FA.",
            "Retrieve system crash dump logs from target host device."
        ])
    elif category == "Ransomware":
        suggested_steps.extend([
            "Isolate compromised subnet hosts from intranet connection tags.",
            "Search local threat repository for known decryptor binaries matching the ransomware extension.",
            "Block payment addresses matching target cryptocurrency wallet addresses."
        ])
    else:
        suggested_steps.extend([
            "Log case file details inside secondary threat indexes.",
            "Assign investigator tasks to respective cyber intelligence unit."
        ])
        
    return {
        "success": True,
        "data": {
            "ticket_id": str(id),
            "category": category,
            "key_facts": key_facts,
            "suggested_next_steps": suggested_steps
        },
        "error": None
    }

@router.get("/global/search", response_model=StandardResponse[List[Dict[str, Any]]])
def global_hybrid_search(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Execute unified SQL keyword + vector semantic global search (requires officer or higher permissions)."""
    from app.services.search import unified_search_service
    res = unified_search_service.hybrid_search(db, query_text=q, limit=limit)
    return {
        "success": True,
        "data": res,
        "error": None
    }

from fastapi.responses import Response

@router.get("/{id}/report/complaint")
def download_complaint_report_pdf(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Compile and download citizen complaint incident record sheet PDF (requires officer or higher permissions)."""
    ticket = ticket_repository.get(db, id)
    if not ticket:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Ticket record not found.")
        
    from app.services.reporting import reporting_service
    pdf_bytes = reporting_service.generate_complaint_pdf(ticket)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=complaint_report_{ticket.ticket_number}.pdf"}
    )

@router.get("/{id}/report/case")
def download_case_investigation_report_pdf(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Compile and download complete case investigation tactical report PDF (requires officer or higher permissions)."""
    ticket = ticket_repository.get(db, id)
    if not ticket:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Ticket record not found.")
        
    from app.services.reporting import reporting_service
    pdf_bytes = reporting_service.generate_case_report_pdf(ticket, db)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=case_report_{ticket.ticket_number}.pdf"}
    )

@router.get("/{id}/comments", response_model=StandardResponse[List[CommentResponse]])
def get_comments(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("citizen"))
):
    """Retrieve public discussion comments for a ticket."""
    ticket = ticket_repository.get(db, id)
    if not ticket:
        raise NotFoundError("Ticket not found")
        
    role = current_user.get("role")
    actor_id = uuid.UUID(current_user.get("sub"))
    if role == "citizen":
        if ticket.complaint.citizen_id != actor_id:
            raise AuthError(
                message="Access denied. You can only view comments for your own complaints.",
                code="FORBIDDEN_TICKET_ACCESS",
                status_code=403
            )
            
    return {
        "success": True,
        "data": ticket.comments,
        "error": None
    }

from app.schemas.ticket import FeedbackSubmit, ReopenRequest
from app.models.ticket import ActivityTimeline

@router.post("/{id}/feedback", response_model=StandardResponse[TicketResponse])
def submit_ticket_feedback(
    id: uuid.UUID,
    payload: FeedbackSubmit,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("citizen"))
):
    """Submit feedback and star rating for a closed ticket."""
    ticket = ticket_repository.get(db, id)
    if not ticket:
        raise NotFoundError("Ticket not found")
        
    role = current_user.get("role")
    actor_id = uuid.UUID(current_user.get("sub"))
    if role == "citizen":
        if ticket.complaint.citizen_id != actor_id:
            raise AuthError("Access denied. You can only rate your own tickets.", status_code=403)
            
    if ticket.complaint.status != "Closed":
        raise ValidationError("Feedback can only be submitted for closed tickets.", status_code=400)
        
    ticket.rating = payload.rating
    ticket.feedback = payload.feedback
    db.commit()
    db.refresh(ticket)
    
    # Log timeline event
    new_event = ActivityTimeline(
        ticket_id=ticket.id,
        event_type="FeedbackSubmitted",
        description=f"Citizen submitted feedback: Rating {payload.rating}/5",
        actor_id=actor_id
    )
    ticket_repository.add_timeline_event(db, event=new_event)
    db.commit()
    
    return {
        "success": True,
        "data": ticket,
        "error": None
    }

from datetime import timezone

@router.post("/{id}/reopen", response_model=StandardResponse[TicketResponse])
def reopen_ticket(
    id: uuid.UUID,
    payload: ReopenRequest,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("citizen"))
):
    """Reopen a closed ticket with a specified reason."""
    ticket = ticket_repository.get(db, id)
    if not ticket:
        raise NotFoundError("Ticket not found")
        
    role = current_user.get("role")
    actor_id = uuid.UUID(current_user.get("sub"))
    if role == "citizen":
        if ticket.complaint.citizen_id != actor_id:
            raise AuthError("Access denied. You can only reopen your own tickets.", status_code=403)
            
    if ticket.complaint.status != "Closed":
        raise ValidationError("Only closed tickets can be reopened.", status_code=400)
        
    ticket.complaint.status = "Under Investigation"
    ticket.reopened_at = datetime.now(timezone.utc)
    ticket.reopen_reason = payload.reason
    
    # Reset approval flags since it's reopened
    ticket.l1_approved = False
    ticket.l2_approved = False
    db.commit()
    db.refresh(ticket)
    
    # Log timeline event
    new_event = ActivityTimeline(
        ticket_id=ticket.id,
        event_type="TicketReopened",
        description=f"Ticket reopened by citizen. Reason: {payload.reason}",
        actor_id=actor_id
    )
    ticket_repository.add_timeline_event(db, event=new_event)
    db.commit()
    
    return {
        "success": True,
        "data": ticket,
        "error": None
    }
