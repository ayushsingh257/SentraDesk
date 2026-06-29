from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid

from app.models.ticket import Complaint, Ticket, TicketVersion, Comment, PrivateNote, ActivityTimeline
from app.repositories.base import BaseRepository

class TicketRepository(BaseRepository[Ticket]):
    """Ticket and Complaint database operations layer."""
    def __init__(self):
        super().__init__(Ticket)

    def generate_next_ticket_number(self, db: Session) -> str:
        """Create a sequentially incremented ticket serial tag."""
        current_year = datetime.now(timezone.utc).year
        # Count tickets created this year
        prefix = f"CCGP-{current_year}-"
        count = db.query(func.count(Ticket.id)).filter(Ticket.ticket_number.like(f"{prefix}%")).scalar()
        next_seq = (count or 0) + 1
        return f"{prefix}{next_seq:04d}"

    def get_ticket_by_number(self, db: Session, ticket_number: str) -> Optional[Ticket]:
        return db.query(Ticket).filter(Ticket.ticket_number == ticket_number).first()

    def get_tickets_filtered(
        self,
        db: Session,
        *,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        assigned_officer_id: Optional[uuid.UUID] = None,
        search_query: Optional[str] = None,
        needs_review: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Ticket]:
        """Query tickets applying dynamic filtering logic."""
        query = db.query(Ticket).join(Ticket.complaint)
        
        if status:
            query = query.filter(Complaint.status == status)
        if severity:
            query = query.filter(Ticket.severity == severity)
        if assigned_officer_id:
            query = query.filter(Ticket.assigned_officer_id == assigned_officer_id)
        if needs_review is not None:
            query = query.filter(Complaint.metadata_json["needs_ai_review"].as_boolean() == needs_review)
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(
                (Complaint.title.like(search_pattern)) | 
                (Complaint.description.like(search_pattern)) | 
                (Ticket.ticket_number.like(search_pattern))
            )
            
        return query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()

    def create_complaint(self, db: Session, *, complaint: Complaint) -> Complaint:
        db.add(complaint)
        db.commit()
        db.refresh(complaint)
        return complaint

    def get_complaint(self, db: Session, complaint_id: uuid.UUID) -> Optional[Complaint]:
        return db.query(Complaint).filter(Complaint.id == complaint_id).first()

    def add_comment(self, db: Session, *, comment: Comment) -> Comment:
        db.add(comment)
        db.commit()
        db.refresh(comment)
        return comment

    def add_private_note(self, db: Session, *, note: PrivateNote) -> PrivateNote:
        db.add(note)
        db.commit()
        db.refresh(note)
        return note

    def add_timeline_event(self, db: Session, *, event: ActivityTimeline) -> ActivityTimeline:
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    def get_timeline(self, db: Session, ticket_id: uuid.UUID) -> List[ActivityTimeline]:
        return db.query(ActivityTimeline).filter(ActivityTimeline.ticket_id == ticket_id).order_by(ActivityTimeline.created_at.desc()).all()

    def add_ticket_version(self, db: Session, *, version: TicketVersion) -> TicketVersion:
        # Determine version number
        max_ver = db.query(func.max(TicketVersion.version_number)).filter(TicketVersion.ticket_id == version.ticket_id).scalar()
        version.version_number = (max_ver or 0) + 1
        db.add(version)
        db.commit()
        db.refresh(version)
        return version

ticket_repository = TicketRepository()
