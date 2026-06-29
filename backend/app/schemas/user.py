from pydantic import BaseModel, EmailStr, Field
import uuid

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=2)
    role: str = "citizen" # citizen, investigator, supervisor, admin, auditor, etc.

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

    class Config:
        from_attributes = True
        
class LogoutRequest(BaseModel):
    refresh_token: str
