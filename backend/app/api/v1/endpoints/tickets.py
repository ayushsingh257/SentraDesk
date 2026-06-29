from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import uuid

from app.core.database import get_db
from app.core.security import JWTBearer, RoleRequirement
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
    ApprovalAction,
    MergeRequest
)
from app.services.ticket import ticket_service
from app.repositories.ticket import ticket_repository

router = APIRouter()

@router.post("", response_model=StandardResponse[TicketResponse])
def create_ticket(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("complaint_operator"))
):
    """File a new complaint and generate a corresponding ticket (requires operator or higher permissions)."""
    actor_id = uuid.UUID(current_user.get("sub"))
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

@router.get("/{id}", response_model=StandardResponse[TicketResponse])
def get_ticket_details(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Retrieve detailed properties of a specific ticket (requires officer or higher permissions)."""
    res = ticket_repository.get(db, id)
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
    res = ticket_service.update_ticket_status(
        db,
        ticket_id=id,
        new_status=payload.status,
        actor_id=actor_id
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
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Submit a public discussion thread comment (requires officer or higher permissions)."""
    actor_id = uuid.UUID(current_user.get("sub"))
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

@router.get("/{id}/timeline", response_model=StandardResponse[List[TimelineResponse]])
def get_timeline(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Retrieve chronologically ordered lifecycle logs for a ticket (requires officer or higher permissions)."""
    res = ticket_repository.get_timeline(db, ticket_id=id)
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.post("/{id}/approvals", response_model=StandardResponse[TicketResponse])
def submit_approval(
    id: uuid.UUID,
    payload: ApprovalAction,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("supervisor"))
):
    """Review and submit approval actions for closure requests (requires supervisor permissions)."""
    actor_id = uuid.UUID(current_user.get("sub"))
    res = ticket_service.submit_approval_action(
        db,
        ticket_id=id,
        approver_id=actor_id,
        decision=payload.decision,
        reason=payload.reason,
        level=payload.level
    )
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
