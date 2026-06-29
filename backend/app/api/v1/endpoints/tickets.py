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
