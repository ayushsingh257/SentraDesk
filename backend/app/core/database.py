from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import redis
from app.core.config import settings

# Configure SQLAlchemy connection with dynamic SQLite fallback for local developer readiness
import os
try:
    if settings.DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
    else:
        engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_size=20,
            max_overflow=10
        )
        # Test connection immediately
        with engine.connect() as conn:
            pass
except Exception as db_err:
    print(f"PostgreSQL connection failed ({db_err}). Falling back to local SQLite database.")
    sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ccgp_local.db"))
    engine = create_engine(
        f"sqlite:///{sqlite_path}",
        connect_args={"check_same_thread": False}
    )


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db() -> Generator[Session, None, None]:
    """Dependency injection for request-scoped database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Configure Redis Client Pool with strict timeouts to prevent offline hangs
redis_pool = redis.ConnectionPool.from_url(
    settings.REDIS_URL, 
    decode_responses=True,
    socket_connect_timeout=0.2,
    socket_timeout=0.2
)

def get_redis() -> redis.Redis:
    """Helper service to fetch an active Redis connection client."""
    return redis.Redis(
        connection_pool=redis_pool,
        socket_connect_timeout=0.2,
        socket_timeout=0.2
    )
