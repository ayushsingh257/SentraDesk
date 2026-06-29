from datetime import datetime, timezone
import uuid
from sqlalchemy import String, ForeignKey, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class ExtractedEntityIndex(Base):
    """Index mapping extracted entities (e.g. UPI, phone) to tickets for instant cross-referencing (Phase 69)."""
    __tablename__ = "extracted_entity_indices"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), index=True)
    entity_type: Mapped[str] = mapped_column(String(50), index=True) # phone, email, upi, crypto_wallet, bank_account, pan_card, ifsc_code
    entity_value: Mapped[str] = mapped_column(String(255), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    ticket = relationship("Ticket", back_populates="extracted_entities")

class ThreatIndicator(Base):
    """Indicators of Compromise (IoCs) like blacklisted IPs, malicious domains, and fraudulent accounts (Phase 70)."""
    __tablename__ = "threat_indicators"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    indicator_type: Mapped[str] = mapped_column(String(50), index=True) # ip, domain, upi, crypto_wallet, phone, bank_account
    indicator_value: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    source_feed: Mapped[str] = mapped_column(String(100), default="Manual Nodal Entry")
    threat_score: Mapped[float] = mapped_column(Float, default=100.0) # 0 to 100 risk percentage
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
