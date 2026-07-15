from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.security import JWTBearer, RoleRequirement
from app.schemas.response import StandardResponse
from app.schemas.user import UserRegister, UserResponse, UserUpdate, PasswordChangeRequest
from app.services.user import user_service


router = APIRouter()

@router.post("/register", response_model=StandardResponse[UserResponse])
def register(
    payload: UserRegister,
    db: Session = Depends(get_db)
):
    """Register a new user account profile in CCGP."""
    res = user_service.register_user(
        db,
        email=payload.email,
        password=payload.password,
        name=payload.name,
        role=payload.role
    )
    return {
        "success": True,
        "data": res,
        "error": None
    }

import uuid

@router.get("/me", response_model=StandardResponse[UserResponse])
def get_current_user(
    token_payload: Dict[str, Any] = Depends(JWTBearer()),
    db: Session = Depends(get_db)
):
    """Retrieve details of the currently authenticated session user profile."""
    user_id = uuid.UUID(token_payload.get("sub"))
    res = user_service.get_user_by_id(db, user_id=user_id)
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.get("/list", response_model=StandardResponse[List[UserResponse]])
def list_users(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("supervisor"))
):
    """List registered users (requires supervisor or admin role permissions)."""
    res = user_service.get_users(db)
    return {
        "success": True,
        "data": res,
        "error": None
    }

from app.schemas.notification import InAppNotificationResponse, UnreadCountResponse
from app.models.notification import InAppNotification

@router.get("/notifications", response_model=StandardResponse[List[InAppNotificationResponse]])
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(JWTBearer())
):
    """Retrieve notifications sent to the logged-in user."""
    actor_id = uuid.UUID(current_user.get("sub"))
    user = user_service.get_user_by_id(db, user_id=actor_id)
    if not user:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("User not found")
        
    notifications = db.query(InAppNotification).filter(
        InAppNotification.citizen_id == user.id
    ).order_by(InAppNotification.created_at.desc()).all()
    
    return {
        "success": True,
        "data": notifications,
        "error": None
    }

@router.get("/notifications/unread-count", response_model=StandardResponse[UnreadCountResponse])
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(JWTBearer())
):
    """Retrieve the count of unread notifications for the logged-in user."""
    actor_id = uuid.UUID(current_user.get("sub"))
    count = db.query(InAppNotification).filter(
        InAppNotification.citizen_id == actor_id,
        InAppNotification.is_read == False
    ).count()
    return {
        "success": True,
        "data": {"unread_count": count},
        "error": None
    }

@router.put("/notifications/{id}/read", response_model=StandardResponse[InAppNotificationResponse])
def mark_notification_as_read(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(JWTBearer())
):
    """Mark a notification as read."""
    actor_id = uuid.UUID(current_user.get("sub"))
    notification = db.query(InAppNotification).filter(
        InAppNotification.id == id,
        InAppNotification.citizen_id == actor_id
    ).first()
    
    if not notification:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Notification not found")
        
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return {
        "success": True,
        "data": notification,
        "error": None
    }

@router.put("/notifications/read-all", response_model=StandardResponse[Dict[str, Any]])
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(JWTBearer())
):
    """Mark all notifications for the user as read."""
    actor_id = uuid.UUID(current_user.get("sub"))
    db.query(InAppNotification).filter(
        InAppNotification.citizen_id == actor_id,
        InAppNotification.is_read == False
    ).update({InAppNotification.is_read: True}, synchronize_session=False)
    db.commit()
    return {
        "success": True,
        "data": {"message": "All notifications marked as read"},
        "error": None
    }

@router.put("/me", response_model=StandardResponse[UserResponse])
def update_profile(
    payload: UserUpdate,
    token_payload: Dict[str, Any] = Depends(JWTBearer()),
    db: Session = Depends(get_db)
):
    """Update profile attributes for the logged-in user."""
    user_id = uuid.UUID(token_payload.get("sub"))
    user = user_service.get_user_by_id(db, user_id=user_id)
    if not user:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("User not found")
    
    if payload.name is not None:
        user = user_service.update_profile(db, user=user, name=payload.name)
        
    return {
        "success": True,
        "data": user,
        "error": None
    }

@router.put("/me/password", response_model=StandardResponse[UserResponse])
def change_password(
    payload: PasswordChangeRequest,
    token_payload: Dict[str, Any] = Depends(JWTBearer()),
    db: Session = Depends(get_db)
):
    """Change the password for the logged-in user after verifying current credentials."""
    user_id = uuid.UUID(token_payload.get("sub"))
    user = user_service.get_user_by_id(db, user_id=user_id)
    if not user:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("User not found")
    
    user = user_service.update_password(
        db,
        user=user,
        old_password=payload.old_password,
        new_password=payload.new_password
    )
    return {
        "success": True,
        "data": user,
        "error": None
    }

@router.get("/me/stats", response_model=StandardResponse[Dict[str, Any]])
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("citizen"))
):
    """Retrieve ticket stats (total, open, closed, average resolution time) for the authenticated citizen."""
    actor_id = uuid.UUID(current_user.get("sub"))
    user = user_service.get_user_by_id(db, user_id=actor_id)
    if not user:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("User not found")

    from app.models.ticket import Ticket, Complaint
    tickets = db.query(Ticket).join(Complaint).filter(Complaint.citizen_id == actor_id).all()

    total = len(tickets)
    open_cases = sum(1 for t in tickets if t.complaint.status not in ("Closed", "Resolved"))
    closed_cases = sum(1 for t in tickets if t.complaint.status in ("Closed", "Resolved"))
    pending_followups = sum(1 for t in tickets if t.complaint.status == "Pending Response")

    # Calculate average resolution time in hours for closed tickets
    resolution_times = []
    for t in tickets:
        if t.complaint.status in ("Closed", "Resolved") and t.updated_at and t.created_at:
            delta = t.updated_at - t.created_at
            resolution_times.append(delta.total_seconds() / 3600.0)

    avg_res_time = sum(resolution_times) / len(resolution_times) if resolution_times else 0.0

    return {
        "success": True,
        "data": {
            "total_cases": total,
            "open_cases": open_cases,
            "closed_cases": closed_cases,
            "pending_followups": pending_followups,
            "avg_resolution_time_hours": round(avg_res_time, 1)
        },
        "error": None
    }


