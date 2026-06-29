import io
import uuid
import zipfile
import hashlib
from datetime import timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from minio import Minio

from app.core.config import settings
from app.core.logging import logger
from app.models.evidence import Evidence
from app.core.exceptions import ValidationError, NotFoundError

# Initialize MinIO client
try:
    if settings.ENVIRONMENT == "testing":
        minio_client = None
    else:
        minio_client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
except Exception as e:
    logger.error(f"Failed to initialize MinIO client: {str(e)}")
    minio_client = None

class EvidenceService:
    """Service governing evidence uploads, presigned URLs, cryptographic hashing, and bulk downloads."""

    def ensure_bucket(self):
        """Ensure the MinIO bucket exists."""
        if not minio_client:
            return
        try:
            if not minio_client.bucket_exists(settings.MINIO_BUCKET_NAME):
                minio_client.make_bucket(settings.MINIO_BUCKET_NAME)
        except Exception as e:
            logger.error(f"MinIO bucket auto-creation failed: {str(e)}")

    def get_presigned_upload_url(self, ticket_id: uuid.UUID, filename: str) -> dict:
        """Generate a secure pre-signed PUT URL for uploading evidence directly to MinIO."""
        self.ensure_bucket()
        unique_id = uuid.uuid4()
        object_name = f"{ticket_id}/{unique_id}_{filename}"
        
        if not minio_client:
            # Fallback for mock environments
            return {
                "upload_url": f"http://mock-minio/upload/{object_name}",
                "file_path": object_name
            }
            
        try:
            url = minio_client.presigned_put_object(
                settings.MINIO_BUCKET_NAME,
                object_name,
                expires=timedelta(minutes=15)
            )
            return {
                "upload_url": url,
                "file_path": object_name
            }
        except Exception as e:
            logger.error(f"Failed to generate presigned upload URL: {str(e)}")
            raise ValidationError(message="Failed to generate secure upload gateway link")

    def get_presigned_download_url(self, db: Session, evidence_id: uuid.UUID) -> str:
        """Generate a secure pre-signed GET URL for downloading evidence."""
        evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
        if not evidence:
            raise NotFoundError(message="Evidence record not found")
            
        if not minio_client:
            return f"http://mock-minio/download/{evidence.file_path}"
            
        try:
            return minio_client.presigned_get_object(
                settings.MINIO_BUCKET_NAME,
                evidence.file_path,
                expires=timedelta(hours=1)
            )
        except Exception as e:
            logger.error(f"Failed to generate presigned download URL: {str(e)}")
            raise ValidationError(message="Failed to generate secure download link")

    def save_evidence_metadata(
        self,
        db: Session,
        *,
        ticket_id: uuid.UUID,
        filename: str,
        file_path: str,
        mime_type: str,
        file_size: int,
        sha256_hash: str,
        uploaded_by_id: Optional[uuid.UUID] = None
    ) -> Evidence:
        """Save evidence file metadata. Implements automatic file versioning."""
        # Find if a file with the same name already exists to increment version (Phase 53)
        last_version = (
            db.query(Evidence)
            .filter(Evidence.ticket_id == ticket_id, Evidence.filename == filename)
            .order_by(Evidence.version.desc())
            .first()
        )
        version = (last_version.version + 1) if last_version else 1
        
        evidence = Evidence(
            ticket_id=ticket_id,
            filename=filename,
            file_path=file_path,
            mime_type=mime_type,
            file_size=file_size,
            sha256_hash=sha256_hash,
            version=version,
            uploaded_by_id=uploaded_by_id
        )
        
        db.add(evidence)
        db.commit()
        db.refresh(evidence)
        return evidence

    def list_evidence(self, db: Session, ticket_id: uuid.UUID) -> List[Evidence]:
        """List all evidence assets associated with a ticket ID."""
        return db.query(Evidence).filter(Evidence.ticket_id == ticket_id).order_by(Evidence.created_at.desc()).all()

    def get_bulk_zip(self, db: Session, ticket_id: uuid.UUID) -> bytes:
        """Retrieve multiple evidence assets and compile them into a single ZIP archive (Phase 54)."""
        evidence_list = db.query(Evidence).filter(Evidence.ticket_id == ticket_id).all()
        if not evidence_list:
            raise NotFoundError(message="No evidence records found for this ticket")
            
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
            for evidence in evidence_list:
                try:
                    if minio_client:
                        response = minio_client.get_object(
                            settings.MINIO_BUCKET_NAME,
                            evidence.file_path
                        )
                        file_data = response.read()
                        response.close()
                        response.release_conn()
                    else:
                        file_data = f"Mock file data for {evidence.filename}".encode("utf-8")
                        
                    # Add file with unique version prefix if version > 1
                    name_in_zip = evidence.filename
                    if evidence.version > 1:
                        name_in_zip = f"v{evidence.version}_{evidence.filename}"
                    zip_file.writestr(name_in_zip, file_data)
                except Exception as e:
                    logger.error(f"Failed to fetch evidence file {evidence.file_path} for zipping: {str(e)}")
                    # Continue packing other files
                    continue
                    
        zip_buffer.seek(0)
        return zip_buffer.getvalue()

evidence_service = EvidenceService()
