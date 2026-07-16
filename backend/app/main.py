from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
import uuid

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.api.v1.router import api_router
from app.core.logging import logger

from contextlib import asynccontextmanager
from app.core.database import engine
from app.models import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.ENVIRONMENT != "testing":
        Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register central error handling wrappers
register_exception_handlers(app)

# Inject request ID tracking and rate limiting middleware (Phase 8A / SEC-1)
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Enforce API rate limits (except for test runner/health routes) (SEC-1)
    client_ip = request.client.host if request.client else "127.0.0.1"
    if settings.ENVIRONMENT != "testing" and not request.url.path.startswith("/api/v1/health"):
        try:
            from app.core.database import get_redis
            r = get_redis()
            key = f"ratelimit:{client_ip}"
            current_count = r.incr(key)
            if current_count == 1:
                r.expire(key, 60)
            if current_count > 200: # Threshold set to 200 requests/min
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    status_code=429,
                    content={
                        "success": False,
                        "data": None,
                        "error": {
                            "code": "TOO_MANY_REQUESTS",
                            "message": "Rate limit exceeded. Please try again later."
                        }
                    }
                )
        except Exception:
            # Fail-open if Redis connections fail to prevent availability outage
            pass

    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Request-ID"] = request_id
    
    # Inject Enterprise Security Headers (Phase 8A / SEC-2)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    logger.info(
        f"API Request processed: {request.method} {request.url.path} - {response.status_code} in {process_time:.4f}s",
        extra={"request_id": request_id}
    )
    
    return response

# Mount routers
app.include_router(api_router, prefix=settings.API_V1_STR)
