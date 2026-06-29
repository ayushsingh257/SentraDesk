import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import RoleRequirement
from app.services.audit import audit_service
from app.models.audit import AuditLog, SecurityAuditChain
from app.schemas.response import StandardResponse

router = APIRouter()

@router.get("/logs", response_model=StandardResponse[List[Dict[str, Any]]])
def list_cryptographic_audit_logs(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("security_auditor"))
):
    """Retrieve all audit logs combined with their row-level hash-chain signatures (requires auditor permissions)."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()
    chains = db.query(SecurityAuditChain).all()
    chain_map = {c.audit_log_id: c for c in chains}
    
    data = []
    for log in logs:
        chain = chain_map.get(log.id)
        data.append({
            "id": str(log.id),
            "action": log.action,
            "actor_id": str(log.actor_id) if log.actor_id else None,
            "actor_role": log.actor_role,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "current_hash": chain.current_hash if chain else None,
            "previous_hash": chain.previous_hash if chain else None,
            "is_anchored": chain.is_anchored if chain else False,
            "anchored_tx_id": chain.anchored_tx_id if chain else None
        })
        
    return {
        "success": True,
        "data": data,
        "error": None
    }

@router.get("/verify", response_model=StandardResponse[Dict[str, Any]])
def run_audit_integrity_check(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("security_auditor"))
):
    """Execute row-by-row hash signature integrity audits and detect deleted records or gaps (requires auditor permissions)."""
    report = audit_service.verify_chain_integrity(db)
    return {
        "success": True,
        "data": report,
        "error": None
    }

from fastapi.responses import Response

@router.post("/anchor", response_model=StandardResponse[Dict[str, Any]])
def anchor_unanchored_logs_batch(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("security_auditor"))
):
    """Compile unanchored rows into a Merkle root and anchor it into mock Hyperledger node (requires auditor permissions)."""
    tx_id = audit_service.anchor_batch(db)
    return {
        "success": True,
        "data": {
            "anchored": True if tx_id else False,
            "transaction_id": tx_id,
            "message": f"Successfully anchored batch. Tx ID: {tx_id}" if tx_id else "No unanchored records found."
        },
        "error": None
    }

@router.get("/export/pdf")
def export_audit_logs_report_pdf(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("security_auditor"))
):
    """Compile audit logs and cryptographic verification metadata into a signed PDF file (requires auditor permissions)."""
    pdf_bytes = audit_service.export_audit_pdf(db)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=ccgp_audit_report.pdf"}
    )
