from fastapi import APIRouter, Depends, Header, Request, Response
from sqlalchemy.orm import Session
import redis
from typing import Optional

from app.core.database import get_db, get_redis
from app.core.security import JWTBearer
from app.schemas.response import StandardResponse
from app.schemas.user import (
    UserLogin, TokenResponse, TokenRefreshRequest, TokenRefreshResponse, LogoutRequest,
    ForgotPasswordRequest, ResetPasswordRequest, EmailVerificationRequest
)
from app.services.auth import auth_service
from app.core.config import settings
from app.core.exceptions import AuthError

router = APIRouter()

@router.post("/login", response_model=StandardResponse[TokenResponse])
def login(
    payload: UserLogin,
    response: Response,
    db: Session = Depends(get_db)
):
    """Authenticate user credentials and retrieve signed JWT access and refresh token keys."""
    res = auth_service.authenticate_user(db, email=payload.email, password=payload.password)
    
    # Set httpOnly secure cookies
    response.set_cookie(
        key="access_token",
        value=res["access_token"],
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=30 * 60, # 30 mins
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=res["refresh_token"],
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=7 * 24 * 60 * 60, # 7 days
        path="/"
    )
    
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.post("/refresh", response_model=StandardResponse[TokenRefreshResponse])
def refresh_token(
    request: Request,
    response: Response,
    payload: TokenRefreshRequest,
    db: Session = Depends(get_db)
):
    """Rotate JWT refresh token and provision a fresh access token."""
    ref_token = payload.refresh_token or request.cookies.get("refresh_token")
    if not ref_token:
        raise AuthError(message="Refresh token missing", code="REFRESH_TOKEN_MISSING", status_code=401)
        
    res = auth_service.rotate_refresh_token(db, refresh_token=ref_token)
    
    # Update cookies
    response.set_cookie(
        key="access_token",
        value=res["access_token"],
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=30 * 60,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=res["refresh_token"],
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {
        "success": True,
        "data": res,
        "error": None
    }

@router.post("/logout", response_model=StandardResponse[str])
def logout(
    request: Request,
    response: Response,
    payload: LogoutRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    r: redis.Redis = Depends(get_redis)
):
    """Invalidate session: revoke database refresh tokens and place access token in Redis denylist."""
    token = None
    if authorization:
        token = authorization.split(" ")[1] if " " in authorization else authorization
    else:
        token = request.cookies.get("access_token")
        
    ref_token = payload.refresh_token or request.cookies.get("refresh_token")
    
    if not token:
        # Clear cookies in case we can't find access token
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        raise AuthError(message="Not authenticated: access token missing", code="NOT_AUTHENTICATED", status_code=401)
        
    auth_service.invalidate_session(db, r, access_token=token, refresh_token=ref_token)
    
    # Delete cookies
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    
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
