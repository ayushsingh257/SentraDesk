from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class StandardResponse(BaseModel, Generic[T]):
    """Standard unified response wrapper for all CCGP API schemas."""
    success: bool
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None
