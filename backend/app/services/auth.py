from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
import redis
import uuid
import logging

logger = logging.getLogger(__name__)

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
        # Block access token in Redis (gracefully degrade if Redis is offline)
        try:
            try:
                payload = decode_token(access_token)
                exp = payload.get("exp")
                now = datetime.now(timezone.utc).timestamp()
                ttl = int(exp - now) if exp and exp > now else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
                r.setex(f"denylist:{access_token}", ttl, "1")
            except Exception:
                # If access token is corrupted or already expired, still block it with default expiry
                r.setex(f"denylist:{access_token}", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, "1")
        except (redis.exceptions.ConnectionError, Exception) as e:
            logger.warning(f"Failed to record blacklisted token in Redis (service offline): {str(e)}")
            
        # Revoke database refresh token
        db_token = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
        if db_token:
            db_token.is_revoked = True
            db.add(db_token)
            db.commit()

    def verify_email(self, db: Session, *, token: str) -> dict:
        from app.models.user import EmailVerificationToken
        db_token = db.query(EmailVerificationToken).filter(
            EmailVerificationToken.token == token,
            EmailVerificationToken.is_used == False
        ).first()
        
        if not db_token:
            raise AuthError(message="Invalid or expired verification token", code="INVALID_TOKEN")
            
        if db_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            raise AuthError(message="Verification token has expired", code="EXPIRED_TOKEN")
            
        user = db_token.user
        user.email_verified = True
        db_token.is_used = True
        db.commit()
        return {"email": user.email, "verified": True}

    def generate_forgot_password_link(self, db: Session, *, email: str) -> None:
        from app.models.user import User, PasswordResetToken
        from app.services.notification import notification_service
        import secrets
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise AuthError(message="User with this email address does not exist", code="USER_NOT_FOUND")
            
        # Invalidate any previous reset tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.is_used == False
        ).update({PasswordResetToken.is_used: True})
        
        token_str = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        db_token = PasswordResetToken(
            token=token_str,
            user_id=user.id,
            expires_at=expires_at,
            is_used=False
        )
        db.add(db_token)
        db.commit()
        
        reset_link = f"http://localhost:3000/reset-password?token={token_str}"
        try:
            notification_service.send_email(
                db,
                recipient=user.email,
                template_name="reset_password",
                subject="Reset your CCGP Account Password",
                variables={
                    "name": user.name,
                    "reset_link": reset_link
                }
            )
        except Exception as e:
            from app.core.logging import logger
            logger.error(f"Failed to send reset password email to {user.email}: {str(e)}")

    def reset_password(self, db: Session, *, token: str, new_password: str) -> None:
        from app.models.user import PasswordResetToken, RefreshToken
        from app.core.security import hash_password
        
        db_token = db.query(PasswordResetToken).filter(
            PasswordResetToken.token == token,
            PasswordResetToken.is_used == False
        ).first()
        
        if not db_token:
            raise AuthError(message="Invalid or expired reset token", code="INVALID_TOKEN")
            
        if db_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            raise AuthError(message="Reset token has expired", code="EXPIRED_TOKEN")
            
        user = db_token.user
        user.hashed_password = hash_password(new_password)
        db_token.is_used = True
        
        # Invalidate all active session tokens for the user to force re-authentication
        db.query(RefreshToken).filter(RefreshToken.user_id == user.id).update({RefreshToken.is_revoked: True})
        db.commit()

auth_service = AuthService()
