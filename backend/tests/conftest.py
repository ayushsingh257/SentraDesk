import os

# Force ALL environment variables BEFORE any app imports so module-level init code
# (ml.py MLflow, qdrant.py connection) reads the correct values.
# NOTE: Use direct assignment (not setdefault) so shell env vars cannot override
os.environ["ENVIRONMENT"] = "testing"
os.environ.setdefault("MLFLOW_TRACKING_URI", "sqlite:///mlflow_test.db")
os.environ.setdefault("QDRANT_HOST", "localhost")
os.environ.setdefault("QDRANT_PORT", "6333")
os.environ.setdefault("QDRANT_URL", "http://localhost:6333")
os.environ.setdefault("MINIO_ENDPOINT", "localhost:9000")
os.environ.setdefault("MINIO_ACCESS_KEY", "minioadmin")
os.environ.setdefault("MINIO_SECRET_KEY", "minioadmin")
os.environ.setdefault("MINIO_BUCKET_NAME", "ccgp-evidence")
os.environ.setdefault("JWT_SECRET", "test_secret_key_for_testing_only")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import redis

from app.models.base import Base
from app.core.database import get_db, get_redis
from app.main import app


# In-memory SQLite for isolated testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

class MockRedis:
    def __init__(self):
        self.store = {}
    def exists(self, key):
        return key in self.store
    def setex(self, key, time, value):
        self.store[key] = value
    def get(self, key):
        return self.store.get(key)
    def ping(self):
        return True

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    def override_get_redis():
        return MockRedis()
        
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis
    
    with TestClient(app) as c:
        yield c
        
    app.dependency_overrides.clear()
