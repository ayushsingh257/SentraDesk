from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from jose import jwt, JWTError
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import redis

from app.core.config import settings
from app.core.database import get_db, get_redis
from app.core.exceptions import AuthError
from app.core.logging import logger

import bcrypt
security_scheme = HTTPBearer(auto_error=False)

# Role definitions mapping
ROLE_HIERARCHY = {
    "citizen": 1,
    "complaint_operator": 2,
    "cyber_cell_officer": 3,
    "investigator": 4,
    "senior_investigator": 5,
    "supervisor": 6,
    "security_auditor": 6,
    "state_administrator": 7,
    "system_administrator": 8
}

def hash_password(password: str) -> str:
    """Hash password string using bcrypt."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password match against hashed format."""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def create_access_token(subject: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generate JWT Access Token containing user ID subject and role claim."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "type": "access"
    }
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

import uuid

def create_refresh_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generate JWT Refresh Token containing user ID subject claim and unique jti."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": str(uuid.uuid4())
    }
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> Dict[str, Any]:
    """Parse, decode and validate JWT payload claims, throwing AuthError on failure."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError as e:
        raise AuthError(message="Invalid token or expired signature", code="TOKEN_INVALID_OR_EXPIRED")

class JWTBearer:
    """Security dependency checking JWT authentication header and Redis denylists."""
    async def __call__(
        self,
        request: Request,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
        r: redis.Redis = Depends(get_redis)
    ) -> Dict[str, Any]:
        token = None
        if credentials:
            token = credentials.credentials
        else:
            token = request.cookies.get("access_token")
            
        if not token:
            raise AuthError(message="Not authenticated: token missing", code="TOKEN_MISSING", status_code=401)
            
        # Check Redis token denylist
        try:
            if r.exists(f"denylist:{token}"):
                raise AuthError(message="Token has been blacklisted/logged out", code="TOKEN_REVOKED")
        except (redis.exceptions.ConnectionError, Exception) as e:
            logger.warning(f"Redis lookup failed or is offline: {str(e)}. Proceeding with fallback JWT verification.")
            
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise AuthError(message="Access token type required", code="INVALID_TOKEN_TYPE")
            
        return payload

class RoleRequirement:
    """RBAC Route Guard checking hierarchical authorization requirements."""
    def __init__(self, required_role: str):
        self.required_role = required_role

    def __call__(self, token_payload: Dict[str, Any] = Depends(JWTBearer())) -> Dict[str, Any]:
        user_role = token_payload.get("role", "citizen")
        
        required_level = ROLE_HIERARCHY.get(self.required_role, 1)
        user_level = ROLE_HIERARCHY.get(user_role, 1)
        
        if user_level < required_level:
            logger.warning(f"RBAC authorization denied for user {token_payload.get('sub')}: required={self.required_role}, user={user_role}")
            raise AuthError(
                message=f"Insufficient permissions. Required role level: {self.required_role}",
                code="FORBIDDEN_INSUFFICIENT_ROLE",
                status_code=403
            )
            
        return token_payload
