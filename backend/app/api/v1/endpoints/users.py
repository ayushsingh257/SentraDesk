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
    current_user: Dict[str, Any] = Depends(RoleRequirement("supervisor"))
):
    """List registered users (requires supervisor or admin role permissions)."""
    res = user_service.get_users(db)
    return {
        "success": True,
        "data": res,
        "error": None
    }
