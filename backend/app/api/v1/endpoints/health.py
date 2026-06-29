from fastapi import APIRouter, Depends
from fastapi.responses import Response as FastAPIResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
import redis
import time
import os

from app.core.database import get_db, get_redis
from app.schemas.response import StandardResponse

router = APIRouter()

# Track process start time for uptime calculation
_START_TIME = time.time()

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
    except Exception:
        db_alive = False

    try:
        r.ping()
        redis_alive = True
    except Exception:
        redis_alive = False

    return {
        "success": db_alive and redis_alive,
        "data": {
            "status": "healthy" if db_alive and redis_alive else "unhealthy",
            "postgres": "connected" if db_alive else "disconnected",
            "redis": "connected" if redis_alive else "disconnected"
        },
        "error": None
    }


@router.get("/metrics")
def prometheus_metrics(
    db: Session = Depends(get_db)
):
    """Export Prometheus-compatible metrics: request counters, DB row counts, uptime (Phase 93)."""
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, Gauge, Counter, REGISTRY
    import sys

    uptime_seconds = time.time() - _START_TIME

    # Dynamic metrics
    try:
        from app.models.ticket import Ticket
        from app.models.user import User
        ticket_count = db.query(Ticket).count()
        user_count = db.query(User).count()
    except Exception:
        ticket_count = 0
        user_count = 0

    # Build Prometheus exposition format manually (avoids duplicate metric registration)
    lines = [
        "# HELP ccgp_uptime_seconds Seconds since backend process started",
        "# TYPE ccgp_uptime_seconds gauge",
        f"ccgp_uptime_seconds {uptime_seconds:.2f}",
        "# HELP ccgp_tickets_total Total tickets in the database",
        "# TYPE ccgp_tickets_total gauge",
        f"ccgp_tickets_total {ticket_count}",
        "# HELP ccgp_users_total Total registered users",
        "# TYPE ccgp_users_total gauge",
        f"ccgp_users_total {user_count}",
        "# HELP ccgp_python_version Python version info",
        "# TYPE ccgp_python_version gauge",
        f'ccgp_python_version{{version="{sys.version.split()[0]}"}} 1',
    ]

    return FastAPIResponse(
        content="\n".join(lines) + "\n",
        media_type="text/plain; version=0.0.4; charset=utf-8"
    )

