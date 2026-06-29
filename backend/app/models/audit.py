import uuid
from sqlalchemy import String, ForeignKey, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin

class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_role: Mapped[str] = mapped_column(String(50), nullable=True)
    action: Mapped[str] = mapped_column(String(255), nullable=False) # e.g. USER_LOGIN, TICKET_UPDATE, VIEW_EVIDENCE
    target_type: Mapped[str] = mapped_column(String(100), nullable=True) # e.g. ticket, user
    target_id: Mapped[str] = mapped_column(String(100), nullable=True)
    
    before_state: Mapped[dict] = mapped_column(JSON, default=dict, nullable=True)
    after_state: Mapped[dict] = mapped_column(JSON, default=dict, nullable=True)
    
    ip_address: Mapped[str] = mapped_column(String(50), nullable=True)
    request_id: Mapped[str] = mapped_column(String(100), nullable=True)

class SecurityAuditChain(Base, TimestampMixin):
    __tablename__ = "security_audit_chains"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    audit_log_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("audit_logs.id", ondelete="CASCADE"), nullable=False)
    previous_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    current_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    
    merkle_root: Mapped[str] = mapped_column(String(64), nullable=True)
    is_anchored: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    anchored_tx_id: Mapped[str] = mapped_column(String(255), nullable=True)
