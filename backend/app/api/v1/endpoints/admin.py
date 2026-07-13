import uuid
import smtplib
import urllib.request
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, func

from app.core.database import get_db, get_redis
from app.core.security import RoleRequirement, hash_password
from app.models.user import User
from app.models.ticket import Complaint, Ticket
from app.models.notification import InAppNotification
from app.models.config import SystemConfig
from app.schemas.response import StandardResponse

import redis
from pydantic import BaseModel, Field

router = APIRouter()

# Schema models for request payloads
class UserUpdatePayload(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    department: Optional[str] = None
    jurisdiction: Optional[str] = None

class ConfigUpdatePayload(BaseModel):
    key: str
    value: dict

# Default Configurations
DEFAULTS = {
    "email_settings": {
        "smtp_host": "smtp.gmail.com",
        "smtp_port": 587,
        "smtp_user": "alerts.ccgp@example.com",
        "smtp_from_email": "alerts.ccgp@example.com",
        "smtp_from_name": "CCGP Alert System"
    },
    "notification_settings": {
        "email_notifications_enabled": True,
        "in_app_notifications_enabled": True,
        "sms_alerts_enabled": False,
        "weekly_reports_enabled": True
    },
    "assignment_settings": {
        "auto_assignment_enabled": True,
        "routing_strategy": "round_robin",
        "max_workload_per_officer": 15
    },
    "security_settings": {
        "mfa_required": False,
        "rate_limit_per_minute": 60,
        "session_timeout_minutes": 30,
        "min_password_length": 12
    },
    "ai_settings": {
        "auto_classification_enabled": True,
        "min_confidence_threshold": 0.85,
        "extract_entities_enabled": True,
        "threat_intel_scans_enabled": True
    },
    "feature_flags": {
        "email_intake": True,
        "ai_copilot": True,
        "threat_intel": True,
        "blockchain_anchoring": True
    },
    "assignment_rules": {
        "category_rules": [
            {"category": "UPI Fraud", "group": "Financial Fraud Unit"},
            {"category": "Banking Fraud", "group": "Financial Fraud Unit"},
            {"category": "Malware", "group": "Technical Investigation Cell"},
            {"category": "Cyber Harassment", "group": "Women & Children Safety Cell"}
        ],
        "severity_rules": [
            {"severity": "Critical", "escalate_to": "Supervisor"},
            {"severity": "High", "escalate_to": "Supervisor"}
        ],
        "jurisdiction_rules": [
            {"jurisdiction": "Delhi", "group": "Delhi Cyber Cell"},
            {"jurisdiction": "Mumbai", "group": "Mumbai Cyber Cell"}
        ]
    }
}

def load_db_config(db: Session, key: str) -> dict:
    cfg = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    if not cfg:
        return DEFAULTS.get(key, {}).copy()
    return cfg.value

# ==========================================
# ADMIN DASHBOARD
# ==========================================
@router.get("/dashboard", response_model=StandardResponse[Dict[str, Any]])
def get_admin_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("system_administrator"))
):
    """Retrieve full system platform statistics and trends analytics (requires admin permissions)."""
    # General User counts
    total_citizens = db.query(User).filter(User.role == "citizen").count()
    total_officers = db.query(User).filter(User.role != "citizen").count()
    
    # Complaints aggregates
    total_complaints = db.query(Complaint).count()
    open_complaints = db.query(Complaint).filter(Complaint.status != "Closed").count()
    closed_complaints = db.query(Complaint).filter(Complaint.status == "Closed").count()
    
    # Advanced KPIs
    pending_approvals = db.query(Complaint).filter(Complaint.status == "Closure Requested").count()
    
    # SLA Breach
    now = datetime.now(timezone.utc)
    sla_breaches = db.query(Ticket).join(Complaint).filter(
        Complaint.status != "Closed",
        Ticket.sla_deadline < now
    ).count()
    
    active_investigations = db.query(Complaint).filter(Complaint.status == "Under Investigation").count()
    
    # AI Processed count: tickets where category classification exists
    ai_processed = db.query(Ticket).filter(Ticket.category != "Unclassified").count()
    
    # Notification stats
    total_notifications = db.query(InAppNotification).count()
    unread_notifications = db.query(InAppNotification).filter(InAppNotification.is_read == False).count()

    # Category distributions
    category_counts = db.query(Ticket.category, func.count(Ticket.id)).group_by(Ticket.category).all()
    category_distribution = [{"name": c[0], "value": c[1]} for c in category_counts]

    # Officer workloads list
    officers = db.query(User).filter(User.role.in_([
        "cyber_cell_officer", "investigator", "senior_investigator", "supervisor"
    ])).all()
    
    officer_workloads = []
    for o in officers:
        assigned = db.query(Ticket).filter(Ticket.assigned_officer_id == o.id).count()
        officer_workloads.append({
            "id": str(o.id),
            "name": o.name,
            "role": o.role,
            "assigned_tickets": assigned,
            "department": o.department or "General Triage Unit",
            "jurisdiction": o.jurisdiction or "District Cyber Cell"
        })

    # Generate monthly complaint graph counts for last 6 months
    monthly_graph = []
    for i in range(5, -1, -1):
        target_date = now - timedelta(days=i*30)
        month_name = target_date.strftime("%b")
        # Query count for target month
        cnt = db.query(Complaint).filter(
            func.strftime("%Y-%m", Complaint.created_at) == target_date.strftime("%Y-%m")
        ).count()
        monthly_graph.append({"month": month_name, "count": cnt})

    return {
        "success": True,
        "data": {
            "stats": {
                "total_citizens": total_citizens,
                "total_officers": total_officers,
                "total_complaints": total_complaints,
                "open_complaints": open_complaints,
                "closed_complaints": closed_complaints,
                "pending_approvals": pending_approvals,
                "sla_breach_count": sla_breaches,
                "active_investigations": active_investigations,
                "ai_processed_complaints": ai_processed,
                "total_notifications": total_notifications,
                "unread_notifications": unread_notifications
            },
            "category_distribution": category_distribution,
            "officer_workloads": officer_workloads,
            "monthly_complaint_graph": monthly_graph
        },
        "error": None
    }

# ==========================================
# USER DIRECTORY MANAGEMENT
# ==========================================
@router.get("/users", response_model=StandardResponse[List[Dict[str, Any]]])
def list_system_users(
    q: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("system_administrator"))
):
    """Search, filter, and fetch all system users (requires admin permissions)."""
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
        
    if q:
        search_filter = f"%{q}%"
        query = query.filter(
            (User.name.like(search_filter)) | 
            (User.email.like(search_filter))
        )
        
    users = query.all()
    user_list = []
    for u in users:
        user_list.append({
            "id": str(u.id),
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "is_active": u.is_active,
            "email_verified": u.email_verified,
            "department": u.department,
            "jurisdiction": u.jurisdiction
        })
        
    return {
        "success": True,
        "data": user_list,
        "error": None
    }

@router.get("/users/{user_id}", response_model=StandardResponse[Dict[str, Any]])
def get_user_profile(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("system_administrator"))
):
    """Retrieve full details of a specific user account (requires admin permissions)."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User account not found")
        
    return {
        "success": True,
        "data": {
            "id": str(u.id),
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "is_active": u.is_active,
            "email_verified": u.email_verified,
            "department": u.department,
            "jurisdiction": u.jurisdiction,
            "created_at": u.created_at.isoformat() if u.created_at else None
        },
        "error": None
    }

@router.put("/users/{user_id}", response_model=StandardResponse[Dict[str, Any]])
def update_user_profile(
    user_id: uuid.UUID,
    payload: UserUpdatePayload,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("system_administrator"))
):
    """Modify user state, assign jurisdictional parameters, toggle activation status, or reset credentials (requires admin)."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User account not found")
        
    if payload.name is not None:
        u.name = payload.name
    if payload.role is not None:
        u.role = payload.role
    if payload.is_active is not None:
        u.is_active = payload.is_active
    if payload.department is not None:
        u.department = payload.department
    if payload.jurisdiction is not None:
        u.jurisdiction = payload.jurisdiction
    if payload.password is not None:
        # Reset password to secure hash
        u.hashed_password = hash_password(payload.password)
        
    db.commit()
    db.refresh(u)
    
    return {
        "success": True,
        "data": {
            "id": str(u.id),
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "is_active": u.is_active,
            "department": u.department,
            "jurisdiction": u.jurisdiction
        },
        "error": None
    }

# ==========================================
# SYSTEM HEALTH DIAGNOSTICS
# ==========================================
@router.get("/system-health", response_model=StandardResponse[Dict[str, Any]])
def execute_system_health_check(
    db: Session = Depends(get_db),
    r: redis.Redis = Depends(get_redis),
    current_user: Dict[str, Any] = Depends(RoleRequirement("system_administrator"))
):
    """Run comprehensive connection probes on all backend dependencies (requires admin permissions)."""
    import socket
    
    def is_service_port_open(host: str, port: int, timeout: float = 0.5) -> bool:
        try:
            with socket.create_connection((host, port), timeout=timeout):
                return True
        except Exception:
            return False

    status_report = {}
    from app.core.config import settings

    # 1. PostgreSQL DB
    try:
        db.execute(text("SELECT 1"))
        status_report["postgres"] = "connected"
    except Exception:
        status_report["postgres"] = "disconnected"

    # 2. Redis Cache
    try:
        r.ping()
        status_report["redis"] = "connected"
    except Exception:
        status_report["redis"] = "disconnected"

    # 3. MinIO Storage
    minio_host, minio_port = "127.0.0.1", 9000
    minio_endpoint = settings.MINIO_ENDPOINT.replace("http://", "").replace("https://", "")
    if ":" in minio_endpoint:
        parts = minio_endpoint.split(":")
        minio_host = parts[0]
        minio_port = int(parts[1])
    else:
        minio_host = minio_endpoint
    status_report["minio"] = "connected" if is_service_port_open(minio_host, minio_port) else "disconnected"

    # 4. Qdrant Vector Search
    status_report["qdrant"] = "connected" if is_service_port_open(settings.QDRANT_HOST, settings.QDRANT_PORT) else "disconnected"

    # 5. SMTP Connection
    status_report["smtp"] = "connected" if is_service_port_open(settings.SMTP_HOST, settings.SMTP_PORT) else "disconnected"

    # 6. Celery Worker
    # Check if RabbitMQ or Redis broker is active
    celery_broker_host, celery_broker_port = "127.0.0.1", 6379
    if "redis://" in settings.REDIS_URL:
        redis_endpoint = settings.REDIS_URL.replace("redis://", "").split("/")[0]
        if ":" in redis_endpoint:
            parts = redis_endpoint.split(":")
            celery_broker_host = parts[0]
            celery_broker_port = int(parts[1])
        else:
            celery_broker_host = redis_endpoint
    status_report["celery"] = "connected (idle)" if is_service_port_open(celery_broker_host, celery_broker_port) else "disconnected"

    # 7. AI services (MLflow tracking server connection)
    if settings.MLFLOW_TRACKING_URI.startswith("sqlite://"):
        status_report["ai_services"] = "connected"
    else:
        mlflow_host, mlflow_port = "127.0.0.1", 5000
        mlflow_endpoint = settings.MLFLOW_TRACKING_URI.replace("http://", "").replace("https://", "")
        if "/" in mlflow_endpoint:
            mlflow_endpoint = mlflow_endpoint.split("/")[0]
        if ":" in mlflow_endpoint:
            parts = mlflow_endpoint.split(":")
            mlflow_host = parts[0]
            mlflow_port = int(parts[1])
        else:
            mlflow_host = mlflow_endpoint
        status_report["ai_services"] = "connected" if is_service_port_open(mlflow_host, mlflow_port) else "disconnected"

    # 8. Main API status
    status_report["api"] = "connected"

    # Overall system health flag
    is_healthy = all(s in ("connected", "connected (idle)") for s in [
        status_report["postgres"], status_report["redis"], status_report["api"]
    ])

    return {
        "success": True,
        "data": {
            "status": "healthy" if is_healthy else "unhealthy",
            "services": status_report
        },
        "error": None
    }

# ==========================================
# ADMINISTRATIVE CONFIG MANAGER
# ==========================================
@router.get("/config", response_model=StandardResponse[Dict[str, Any]])
def get_system_configurations(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("system_administrator"))
):
    """Retrieve full dynamic settings configuration profiles (requires admin permissions)."""
    configs = {}
    for key in DEFAULTS.keys():
        configs[key] = load_db_config(db, key)
        
    return {
        "success": True,
        "data": configs,
        "error": None
    }

@router.put("/config", response_model=StandardResponse[Dict[str, Any]])
def update_system_configuration(
    payload: ConfigUpdatePayload,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("system_administrator"))
):
    """Update dynamic configuration profile key (requires admin permissions)."""
    if payload.key not in DEFAULTS:
        raise HTTPException(status_code=400, detail="Invalid configuration profile key")
        
    cfg = db.query(SystemConfig).filter(SystemConfig.key == payload.key).first()
    if not cfg:
        cfg = SystemConfig(key=payload.key, value=payload.value)
        db.add(cfg)
    else:
        cfg.value = payload.value
        db.add(cfg)
        
    db.commit()
    db.refresh(cfg)
    
    return {
        "success": True,
        "data": {
            "key": cfg.key,
            "value": cfg.value
        },
        "error": None
    }
