from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
import redis

from app.core.database import get_db, get_redis
from app.core.security import JWTBearer
from app.schemas.response import StandardResponse
from app.schemas.user import (
    UserLogin, TokenResponse, TokenRefreshRequest, TokenRefreshResponse, LogoutRequest,
    ForgotPasswordRequest, ResetPasswordRequest, EmailVerificationRequest
)
from app.services.auth import auth_service

router = APIRouter()

@router.post("/login", response_model=StandardResponse[TokenResponse])
def login(
    payload: UserLogin,
    db: Session = Depends(get_db)
):
    """Authenticate user credentials and retrieve signed JWT access and refresh token keys."""
    res = auth_service.authenticate_user(db, email=payload.email, password=payload.password)
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.post("/refresh", response_model=StandardResponse[TokenRefreshResponse])
def refresh_token(
    payload: TokenRefreshRequest,
    db: Session = Depends(get_db)
):
    """Rotate JWT refresh token and provision a fresh access token."""
    res = auth_service.rotate_refresh_token(db, refresh_token=payload.refresh_token)
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.post("/logout", response_model=StandardResponse[str])
def logout(
    payload: LogoutRequest,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
    r: redis.Redis = Depends(get_redis)
):
    """Invalidate session: revoke database refresh tokens and place access token in Redis denylist."""
    token = authorization.split(" ")[1] if " " in authorization else authorization
    auth_service.invalidate_session(db, r, access_token=token, refresh_token=payload.refresh_token)
    return {
        "success": True,
        "data": "Successfully logged out and invalidated session",
        "error": None
    }

@router.post("/verify-email", response_model=StandardResponse[dict])
def verify_email(
    payload: EmailVerificationRequest,
    db: Session = Depends(get_db)
):
    """Verify citizen email address with token from verification link."""
    res = auth_service.verify_email(db, token=payload.token)
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.post("/forgot-password", response_model=StandardResponse[str])
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """Initiate password recovery flow: send secure reset links to registered email."""
    auth_service.generate_forgot_password_link(db, email=payload.email)
    return {
        "success": True,
        "data": "Password reset instructions dispatched to email",
        "error": None
    }

@router.post("/reset-password", response_model=StandardResponse[str])
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Commit password change using reset token."""
    auth_service.reset_password(db, token=payload.token, new_password=payload.new_password)
    return {
        "success": True,
        "data": "Password changed successfully",
        "error": None
    }
