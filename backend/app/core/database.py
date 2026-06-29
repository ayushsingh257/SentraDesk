from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import redis
from app.core.config import settings

# Configure SQLAlchemy connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10
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

# Configure Redis Client Pool
redis_pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)

def get_redis() -> redis.Redis:
    """Helper service to fetch an active Redis connection client."""
    return redis.Redis(connection_pool=redis_pool)
