import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.core.security import RoleRequirement, JWTBearer
from app.schemas.response import StandardResponse
from app.schemas.ticket import TicketResponse
from app.schemas.approval import ClosureRequest, ApprovalDecision
from app.services.approval import approval_service

router = APIRouter()

@router.post("/{ticket_id}/request-closure", response_model=StandardResponse[TicketResponse])
def request_ticket_closure(
    ticket_id: uuid.UUID,
    payload: ClosureRequest,
    db: Session = Depends(get_db),
    token_payload: Dict[str, Any] = Depends(JWTBearer()),
    current_user: Dict[str, Any] = Depends(RoleRequirement("investigator"))
):
    """Submit request to transition ticket to closure pending stage (Phase 46)."""
    actor_id = uuid.UUID(token_payload.get("sub"))
    res = approval_service.request_closure(db, ticket_id=ticket_id, actor_id=actor_id, reason=payload.reason)
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.post("/{ticket_id}/l1-approve", response_model=StandardResponse[TicketResponse])
def submit_l1_closure_approval(
    ticket_id: uuid.UUID,
    payload: ApprovalDecision,
    db: Session = Depends(get_db),
    token_payload: Dict[str, Any] = Depends(JWTBearer()),
    current_user: Dict[str, Any] = Depends(RoleRequirement("supervisor"))
):
    """Approve ticket closure at L1 supervisor tier (Phase 47)."""
    actor_id = uuid.UUID(token_payload.get("sub"))
    res = approval_service.submit_l1_approval(db, ticket_id=ticket_id, actor_id=actor_id, comment_text=payload.comment)
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.post("/{ticket_id}/l2-approve", response_model=StandardResponse[TicketResponse])
def submit_l2_closure_approval(
    ticket_id: uuid.UUID,
    payload: ApprovalDecision,
    db: Session = Depends(get_db),
    token_payload: Dict[str, Any] = Depends(JWTBearer()),
    current_user: Dict[str, Any] = Depends(RoleRequirement("supervisor"))
):
    """Approve ticket closure at L2 senior supervisor tier and resolve case (Phase 48)."""
    actor_id = uuid.UUID(token_payload.get("sub"))
    res = approval_service.submit_l2_approval(db, ticket_id=ticket_id, actor_id=actor_id, comment_text=payload.comment)
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.post("/{ticket_id}/reject", response_model=StandardResponse[TicketResponse])
def reject_ticket_closure(
    ticket_id: uuid.UUID,
    payload: ApprovalDecision,
    db: Session = Depends(get_db),
    token_payload: Dict[str, Any] = Depends(JWTBearer()),
    current_user: Dict[str, Any] = Depends(RoleRequirement("supervisor"))
):
    """Reject ticket closure request and revert status to Under Investigation (Phase 48)."""
    actor_id = uuid.UUID(token_payload.get("sub"))
    res = approval_service.reject_closure(db, ticket_id=ticket_id, actor_id=actor_id, comment_text=payload.comment)
    return {
        "success": True,
        "data": res,
        "error": None
    }
