from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.logging import logger

class CCGPException(Exception):
    """Base application exception type."""
    def __init__(self, code: str, message: str, status_code: int = 400, details: dict = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}

class AuthError(CCGPException):
    """Authentication or authorization failures exception."""
    def __init__(self, message: str, code: str = "AUTH_ERROR", status_code: int = 401, details: dict = None):
        super().__init__(code, message, status_code, details)

class NotFoundError(CCGPException):
    """Resource not found exception."""
    def __init__(self, message: str, code: str = "NOT_FOUND", status_code: int = 404, details: dict = None):
        super().__init__(code, message, status_code, details)

class ValidationError(CCGPException):
    """Schema validations failure exception."""
    def __init__(self, message: str, code: str = "VALIDATION_ERROR", status_code: int = 422, details: dict = None):
        super().__init__(code, message, status_code, details)

def register_exception_handlers(app: FastAPI) -> None:
    """Assign unified response mapping hooks to the FastAPI instance."""
    
    @app.exception_handler(CCGPException)
    async def ccgp_exception_handler(request: Request, exc: CCGPException):
        logger.warning(f"Application error handled: {exc.code} - {exc.message}", extra={"request_id": getattr(request.state, "request_id", None)})
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details
                }
            }
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.warning(f"HTTP error handled: {exc.status_code} - {exc.detail}", extra={"request_id": getattr(request.state, "request_id", None)})
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": "HTTP_ERROR",
                    "message": exc.detail,
                    "details": {}
                }
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.info(f"Schema validation error handled: {exc.errors()}", extra={"request_id": getattr(request.state, "request_id", None)})
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": {
                    "code": "SCHEMA_VALIDATION_FAILED",
                    "message": "Invalid request parameter parameters",
                    "details": exc.errors()
                }
            }
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Internal server error unhandled: {str(exc)}", exc_info=exc, extra={"request_id": getattr(request.state, "request_id", None)})
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred on the server",
                    "details": {}
                }
            }
        )
