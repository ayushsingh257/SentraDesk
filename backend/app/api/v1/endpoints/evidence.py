import uuid
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.security import RoleRequirement, JWTBearer
from app.schemas.response import StandardResponse
from app.schemas.evidence import EvidenceUploadRequest, EvidenceUploadResponse, EvidenceSaveRequest, EvidenceResponse
from app.services.evidence import evidence_service

router = APIRouter()

@router.post("/{ticket_id}/upload-link", response_model=StandardResponse[EvidenceUploadResponse])
def get_upload_link(
    ticket_id: uuid.UUID,
    payload: EvidenceUploadRequest,
    current_user: Dict[str, Any] = Depends(RoleRequirement("investigator"))
):
    """Generate secure presigned upload URL gateway link (Phase 51)."""
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
    current_user: Dict[str, Any] = Depends(RoleRequirement("investigator"))
):
    """List all evidence assets associated with a ticket (Phase 55)."""
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
    current_user: Dict[str, Any] = Depends(RoleRequirement("investigator"))
):
    """Retrieve pre-signed secure download URL (Phase 51)."""
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
