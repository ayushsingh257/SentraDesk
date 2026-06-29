from pydantic import BaseModel, Field, EmailStr

class MockEmailRequest(BaseModel):
    sender: str = Field(..., description="Email address or name of the sender")
    subject: str = Field(..., min_length=2, max_length=255)
    body: str = Field(..., min_length=1)
