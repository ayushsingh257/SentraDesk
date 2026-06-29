import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class EmailConversation(Base, TimestampMixin):
    __tablename__ = "email_conversations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    message_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    in_reply_to: Mapped[str] = mapped_column(String(255), nullable=True)
    references: Mapped[str] = mapped_column(String(2000), nullable=True)
    sender: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(String(4000), nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    ticket: Mapped["Ticket"] = relationship()

class NotificationLog(Base, TimestampMixin):
    __tablename__ = "notification_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), nullable=True)
    recipient: Mapped[str] = mapped_column(String(255), nullable=False)
    template_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False) # Pending, Sent, Failed
    error_message: Mapped[str] = mapped_column(String(500), nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    ticket: Mapped["Ticket"] = relationship()
