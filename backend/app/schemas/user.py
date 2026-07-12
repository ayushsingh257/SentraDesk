from pydantic import BaseModel, EmailStr, Field, field_validator
import uuid
import re

COMMON_PASSWORDS = {
    "password", "password123", "12345678", "123456789", "qwerty",
    "qwerty123", "admin", "admin123", "welcome", "letmein",
    "abc123", "test123", "changeme"
}

def validate_password_strength(password: str) -> str:
    errors = []
    if len(password) < 12:
        errors.append("Password must be at least 12 characters long.")
    if len(password) > 128:
        errors.append("Password must not exceed 128 characters.")
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter.")
    if not re.search(r"[0-9]", password):
        errors.append("Password must contain at least one numerical digit.")
    if not re.search(r"[!@#$%^&*()_+=\-\[\]{};':\",./<>?\|`~]", password):
        errors.append("Password must contain at least one special character.")
    if password.lower() in COMMON_PASSWORDS:
        errors.append("Password is too common and easily guessable.")
    
    if errors:
        raise ValueError(" | ".join(errors))
    return password

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str = Field(min_length=2)
    role: str = "citizen" # citizen, investigator, supervisor, admin, auditor, etc.

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_password_strength(v)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_password_strength(v)

class EmailVerificationRequest(BaseModel):
    token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    role: str
    user_id: str
    name: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class TokenRefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    role: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    name: str
    role: str
    is_active: bool
    email_verified: bool

    class Config:
        from_attributes = True
        
class LogoutRequest(BaseModel):
    refresh_token: str

from typing import Optional

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2)

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_password_strength(v)

