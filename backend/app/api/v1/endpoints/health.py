from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import redis

from app.core.database import get_db, get_redis
from app.schemas.response import StandardResponse

router = APIRouter()

@router.get("/health", response_model=StandardResponse[dict])
def health_check(
    db: Session = Depends(get_db),
    r: redis.Redis = Depends(get_redis)
):
    """Diagnose backend Postgres and Redis service connection status."""
    db_alive = False
    redis_alive = False
    
    try:
        db.execute(text("SELECT 1"))
        db_alive = True
    except Exception as e:
        db_alive = False
        
    try:
        r.ping()
        redis_alive = True
    except Exception as e:
        redis_alive = False
        
    status_code = 200 if db_alive and redis_alive else 500
    
    return {
        "success": db_alive and redis_alive,
        "data": {
            "status": "healthy" if db_alive and redis_alive else "unhealthy",
            "postgres": "connected" if db_alive else "disconnected",
            "redis": "connected" if redis_alive else "disconnected"
        },
        "error": None
    }
