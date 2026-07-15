import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Boolean, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class Complaint(Base, TimestampMixin):
    __tablename__ = "complaints"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(5000), nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="portal", nullable=False) # portal, email, mobile, helpline, station
    status: Mapped[str] = mapped_column(String(50), default="New", nullable=False)
    
    # Complainant information
    reporter_name: Mapped[str] = mapped_column(String(255), nullable=False)
    reporter_email: Mapped[str] = mapped_column(String(255), nullable=True)
    reporter_phone: Mapped[str] = mapped_column(String(50), nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=True)

    citizen_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    ticket: Mapped["Ticket"] = relationship(back_populates="complaint", cascade="all, delete-orphan")
    citizen: Mapped["User"] = relationship(foreign_keys=[citizen_id])

class Ticket(Base, TimestampMixin):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ticket_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    complaint_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="Unclassified", nullable=False)
    severity: Mapped[str] = mapped_column(String(50), default="Low", nullable=False) # Critical, High, Medium, Low
    
    # Assignment
    assigned_officer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_group: Mapped[str] = mapped_column(String(100), nullable=True) # e.g. Fraud Investigation Unit
    jurisdiction: Mapped[str] = mapped_column(String(255), nullable=True) # e.g. District Cyber Cell
    
    # Workflow and SLA
    sla_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    is_escalated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    l1_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    l2_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Citizen Feedback & Reopen
    rating: Mapped[int] = mapped_column(Integer, nullable=True)
    feedback: Mapped[str] = mapped_column(String(1000), nullable=True)
    reopened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    reopen_reason: Mapped[str] = mapped_column(String(1000), nullable=True)

    # Relationships
    complaint: Mapped["Complaint"] = relationship(back_populates="ticket")
    assigned_officer: Mapped["User"] = relationship(back_populates="assigned_tickets", foreign_keys=[assigned_officer_id])
    versions: Mapped[list["TicketVersion"]] = relationship(back_populates="ticket", cascade="all, delete-orphan")
    comments: Mapped[list["Comment"]] = relationship(back_populates="ticket", cascade="all, delete-orphan")
    private_notes: Mapped[list["PrivateNote"]] = relationship(back_populates="ticket", cascade="all, delete-orphan")
    timeline: Mapped[list["ActivityTimeline"]] = relationship(back_populates="ticket", cascade="all, delete-orphan")
    extracted_entities = relationship("ExtractedEntityIndex", back_populates="ticket", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="ticket", cascade="all, delete-orphan", foreign_keys="Evidence.ticket_id")
    approval_records = relationship("ApprovalRecord", back_populates="ticket", cascade="all, delete-orphan")

class TicketVersion(Base, TimestampMixin):
    __tablename__ = "ticket_versions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    old_values: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    new_values: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    changed_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    ticket: Mapped["Ticket"] = relationship(back_populates="versions")

class Comment(Base, TimestampMixin):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(String(1000), nullable=False)
    attachment_meta: Mapped[dict] = mapped_column(JSON, default=dict, nullable=True)

    # Relationships
    ticket: Mapped["Ticket"] = relationship(back_populates="comments")

class PrivateNote(Base, TimestampMixin):
    __tablename__ = "private_notes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(String(4000), nullable=False)

    # Relationships
    ticket: Mapped["Ticket"] = relationship(back_populates="private_notes")

class ActivityTimeline(Base, TimestampMixin):
    __tablename__ = "activity_timeline"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False) # StatusChanged, Assigned, NoteAdded, Resolved, etc.
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    actor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    ticket: Mapped["Ticket"] = relationship(back_populates="timeline")


class ApprovalRecord(Base, TimestampMixin):
    __tablename__ = "approval_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    approver_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False) # 1 or 2
    decision: Mapped[str] = mapped_column(String(50), nullable=False) # approved, rejected
    comment: Mapped[str] = mapped_column(String(1000), nullable=True)

    # Relationships
    ticket: Mapped["Ticket"] = relationship(back_populates="approval_records")
    approver: Mapped["User"] = relationship()
