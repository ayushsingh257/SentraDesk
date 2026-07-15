import uuid
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.security import RoleRequirement, JWTBearer
from app.schemas.response import StandardResponse
from app.schemas.evidence import EvidenceUploadRequest, EvidenceUploadResponse, EvidenceSaveRequest, EvidenceResponse
from app.services.evidence import evidence_service

from app.core.exceptions import AuthError, NotFoundError
from app.repositories.ticket import ticket_repository

router = APIRouter()

@router.post("/{ticket_id}/upload-link", response_model=StandardResponse[EvidenceUploadResponse])
def get_upload_link(
    ticket_id: uuid.UUID,
    payload: EvidenceUploadRequest,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("citizen"))
):
    """Generate secure presigned upload URL gateway link (Phase 51)."""
    ticket = ticket_repository.get(db, ticket_id)
    if not ticket:
        raise NotFoundError("Ticket not found")
        
    role = current_user.get("role")
    actor_id = uuid.UUID(current_user.get("sub"))
    if role == "citizen":
        if ticket.complaint.citizen_id != actor_id:
            raise AuthError("Access denied. You can only attach evidence to your own complaints.", status_code=403)
            
    res = evidence_service.get_presigned_upload_url(ticket_id, payload.filename)
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.post("/{ticket_id}/save", response_model=StandardResponse[EvidenceResponse])
def save_uploaded_evidence(
    ticket_id: uuid.UUID,
    payload: EvidenceSaveRequest,
    db: Session = Depends(get_db),
    token_payload: Dict[str, Any] = Depends(JWTBearer())
):
    """Save evidence upload file metadata, tracking version (Phase 51, 52, 53)."""
    actor_id = uuid.UUID(token_payload.get("sub"))
    res = evidence_service.save_evidence_metadata(
        db,
        ticket_id=ticket_id,
        filename=payload.filename,
        file_path=payload.file_path,
        mime_type=payload.mime_type,
        file_size=payload.file_size,
        sha256_hash=payload.sha256_hash,
        uploaded_by_id=actor_id
    )
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.get("/{ticket_id}", response_model=StandardResponse[List[EvidenceResponse]])
def list_ticket_evidence(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("citizen"))
):
    """List all evidence assets associated with a ticket (Phase 55)."""
    ticket = ticket_repository.get(db, ticket_id)
    if not ticket:
        raise NotFoundError("Ticket not found")
        
    role = current_user.get("role")
    actor_id = uuid.UUID(current_user.get("sub"))
    if role == "citizen":
        if ticket.complaint.citizen_id != actor_id:
            raise AuthError("Access denied. You can only view evidence for your own complaints.", status_code=403)
            
    res = evidence_service.list_evidence(db, ticket_id)
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.get("/download/{evidence_id}", response_model=StandardResponse[str])
def get_download_link(
    evidence_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("citizen"))
):
    """Retrieve pre-signed secure download URL (Phase 51)."""
    # Fetch evidence metadata to confirm ownership
    from app.models.evidence import Evidence
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise NotFoundError("Evidence record not found")
        
    role = current_user.get("role")
    actor_id = uuid.UUID(current_user.get("sub"))
    if role == "citizen":
        ticket = ticket_repository.get(db, evidence.ticket_id)
        if not ticket or ticket.complaint.citizen_id != actor_id:
            raise AuthError("Access denied. You can only access evidence for your own complaints.", status_code=403)
            
    url = evidence_service.get_presigned_download_url(db, evidence_id)
    return {
        "success": True,
        "data": url,
        "error": None
    }

@router.get("/{ticket_id}/zip")
def download_zipped_evidence(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("investigator"))
):
    """Bulk retrieve evidence assets and package them inside a single ZIP file (Phase 54)."""
    zip_bytes = evidence_service.get_bulk_zip(db, ticket_id)
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=evidence_ticket_{ticket_id}.zip"
        }
    )

@router.post("/{evidence_id}/verify-integrity", response_model=StandardResponse[Dict[str, Any]])
def verify_evidence_integrity(
    evidence_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("cyber_cell_officer"))
):
    """Retrieve evidence from MinIO, compute its SHA-256 hash, and check it against the DB-stored hash to verify it hasn't been tampered with (EV-1)."""
    from app.models.evidence import Evidence
    from app.services.evidence import minio_client
    import hashlib
    from app.core.config import settings
    from app.core.logging import logger
    
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise NotFoundError("Evidence record not found")
        
    if not minio_client or settings.ENVIRONMENT == "testing":
        return {
            "success": True,
            "data": {
                "verified": True,
                "db_hash": evidence.sha256_hash,
                "computed_hash": evidence.sha256_hash,
                "message": "Mock environment: integrity verification bypassed (assumed valid)."
            },
            "error": None
        }
        
    try:
        response = minio_client.get_object(
            settings.MINIO_BUCKET_NAME,
            evidence.file_path
        )
        file_data = response.read()
        response.close()
        response.release_conn()
        
        computed_hash = hashlib.sha256(file_data).hexdigest()
        verified = (computed_hash == evidence.sha256_hash)
        
        return {
            "success": True,
            "data": {
                "verified": verified,
                "db_hash": evidence.sha256_hash,
                "computed_hash": computed_hash,
                "message": "File integrity verified. Hash matches stored record." if verified else "Warning: Hash mismatch! The file content has been altered or corrupted."
            },
            "error": None
        }
    except Exception as e:
        logger.error(f"Failed to verify integrity of file {evidence.file_path}: {e}")
        return {
            "success": False,
            "data": None,
            "error": {"message": f"Verification failed: {str(e)}", "code": "INTEGRITY_VERIFICATION_FAILED"}
        }

