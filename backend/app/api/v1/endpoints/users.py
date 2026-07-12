from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.security import JWTBearer, RoleRequirement
from app.schemas.response import StandardResponse
from app.schemas.user import UserRegister, UserResponse
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
    current_user: Dict[str, Any] = Depends(RoleRequirement("system_administrator"))
):
    """List registered users (requires supervisor or admin role permissions)."""
    res = user_service.get_users(db)
    return {
        "success": True,
        "data": res,
        "error": None
    }

from app.schemas.notification import NotificationLogResponse
from app.models.notification import NotificationLog

@router.get("/notifications", response_model=StandardResponse[List[NotificationLogResponse]])
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(RoleRequirement("citizen"))
):
    """Retrieve notifications sent to the logged-in user."""
    actor_id = uuid.UUID(current_user.get("sub"))
    user = user_service.get_user_by_id(db, user_id=actor_id)
    if not user:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("User not found")
        
    notifications = db.query(NotificationLog).filter(
        NotificationLog.recipient == user.email
    ).order_by(NotificationLog.created_at.desc()).all()
    
    return {
        "success": True,
        "data": notifications,
        "error": None
    }
