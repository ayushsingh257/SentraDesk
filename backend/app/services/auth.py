from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
import redis
import uuid

from app.models.user import RefreshToken
from app.repositories.user import user_repository
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import AuthError
from app.core.config import settings

class AuthService:
    """Operations executing login checks, refresh rotation and sessions revocation."""

    def authenticate_user(self, db: Session, *, email: str, password: str) -> dict:
        """Authenticate user credentials and issue active access and refresh tokens."""
        user = user_repository.get_by_email(db, email)
        if not user or not user.is_active:
            raise AuthError(message="Invalid credentials or inactive account", code="AUTHENTICATION_FAILED")
            
        if not verify_password(password, user.hashed_password):
            raise AuthError(message="Invalid credentials or inactive account", code="AUTHENTICATION_FAILED")
            
        # Create token pairs
        access_token = create_access_token(subject=str(user.id), role=user.role)
        refresh_token = create_refresh_token(subject=str(user.id))
        
        # Save refresh session token in database
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        db_refresh = RefreshToken(
            token=refresh_token,
            user_id=user.id,
            expires_at=expires_at,
            is_revoked=False
        )
        db.add(db_refresh)
        db.commit()
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": user.role,
            "user_id": str(user.id),
            "name": user.name
        }

    def rotate_refresh_token(self, db: Session, *, refresh_token: str) -> dict:
        """Verify, rotate, and issue a new pair of JWT access and refresh tokens."""
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise AuthError(message="Invalid token type", code="INVALID_REFRESH_TOKEN")
            
        # Check token entry in db
        db_token = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
        if not db_token or db_token.is_revoked or db_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            raise AuthError(message="Refresh token revoked or expired", code="REFRESH_SESSION_EXPIRED")
            
        user = user_repository.get(db, db_token.user_id)
        if not user or not user.is_active:
            raise AuthError(message="User is disabled or missing", code="USER_INACTIVE")
            
        # Revoke old token
        db_token.is_revoked = True
        db.add(db_token)
        
        # Create new tokens pair
        new_access = create_access_token(subject=str(user.id), role=user.role)
        new_refresh = create_refresh_token(subject=str(user.id))
        
        # Save new refresh session in database
        new_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        new_db_refresh = RefreshToken(
            token=new_refresh,
            user_id=user.id,
            expires_at=new_expires_at,
            is_revoked=False
        )
        db.add(new_db_refresh)
        db.commit()
        
        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
            "role": user.role
        }

    def invalidate_session(self, db: Session, r: redis.Redis, *, access_token: str, refresh_token: str) -> None:
        """Denylist active access token in Redis and revoke refresh session token in database."""
        # Block access token
        try:
            payload = decode_token(access_token)
            exp = payload.get("exp")
            now = datetime.now(timezone.utc).timestamp()
            ttl = int(exp - now) if exp and exp > now else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            r.setex(f"denylist:{access_token}", ttl, "1")
        except Exception:
            # If access token is corrupted or already expired, still block it with default expiry
            r.setex(f"denylist:{access_token}", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, "1")
            
        # Revoke database refresh token
        db_token = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
        if db_token:
            db_token.is_revoked = True
            db.add(db_token)
            db.commit()

auth_service = AuthService()
