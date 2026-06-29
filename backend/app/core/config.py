import json
from typing import List, Union
from pydantic import AnyHttpUrl, BeforeValidator, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Annotated

def parse_cors_origins(v: Union[str, List[str]]) -> List[str]:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, (list, str)):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v
    return []

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = "development"

    # JWT Configs
    JWT_SECRET: str = "super_secret_jwt_signing_key_for_development_purposes_only_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # FastAPI settings
    PROJECT_NAME: str = "CCGP — Cyber Complaint Governance Platform"
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: Annotated[
        List[str], BeforeValidator(parse_cors_origins)
    ] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Postgres Database Configs
    POSTGRES_USER: str = "ccgp_admin"
    POSTGRES_PASSWORD: str = "ccgp_secure_password_2026"
    POSTGRES_DB: str = "ccgp_governance"
    POSTGRES_HOST: str = "127.0.0.1"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = "postgresql://ccgp_admin:ccgp_secure_password_2026@127.0.0.1:5432/ccgp_governance"

    # Redis Caching Configs
    REDIS_HOST: str = "127.0.0.1"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://127.0.0.1:6379/0"

    # MinIO Storage Configs
    MINIO_ENDPOINT: str = "127.0.0.1:9000"
    MINIO_ACCESS_KEY: str = "minio_admin_user"
    MINIO_SECRET_KEY: str = "minio_admin_secret_key_2026"
    MINIO_BUCKET_NAME: str = "ccgp-evidence"
    MINIO_SECURE: bool = False

    # Qdrant Vector DB Configs
    QDRANT_HOST: str = "127.0.0.1"
    QDRANT_PORT: int = 6333
    QDRANT_URL: str = "http://127.0.0.1:6333"

    # AI Configurations
    MLFLOW_TRACKING_URI: str = "http://127.0.0.1:5000"
    HF_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"

    # SMTP Configurations
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "alerts.ccgp@example.com"
    SMTP_PASSWORD: str = "gmail_application_password"
    SMTP_FROM_EMAIL: str = "alerts.ccgp@example.com"
    SMTP_FROM_NAME: str = "CCGP Alert System"

    # IMAP Configurations
    IMAP_HOST: str = "imap.gmail.com"
    IMAP_PORT: int = 993
    IMAP_USER: str = "alerts.ccgp@example.com"
    IMAP_PASSWORD: str = "gmail_application_password"
    IMAP_SECURE: bool = True

settings = Settings()
