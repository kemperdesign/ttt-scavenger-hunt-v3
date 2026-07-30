"""
Application settings — loaded from environment variables via pydantic-settings.
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://timequest:timequest_dev@localhost:5432/timequest"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://timequest:timequest_dev@localhost:5432/timequest"

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Qdrant ────────────────────────────────────────────────────────────────
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "timequest_docs"

    # ── MinIO ─────────────────────────────────────────────────────────────────
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "timequest-media"
    MINIO_SECURE: bool = False

    # ── LLM ───────────────────────────────────────────────────────────────────
    # Use OpenAI API for character chat AND RAG embeddings (Ollama requires too
    # much RAM on the 2GB VPS and isn't running there).
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBED_MODEL: str = "text-embedding-3-small"
    OPENAI_EMBED_DIM: int = 768  # matches the existing Qdrant collection (was nomic-embed-text's native size)

    # ── Ollama (unused — kept only so old .env files with these keys don't
    # break settings parsing; nothing in the app calls Ollama anymore) ──────────
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_EMBED_MODEL: str = "nomic-embed-text"
    OLLAMA_CHAT_MODEL: str = "llama3.2"

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # ── GPS / Gameplay ────────────────────────────────────────────────────────
    DEFAULT_GPS_RADIUS_METERS: float = 30.0
    HINT_POINT_PENALTY: int = 5
    ALLOW_SIMULATED_GPS: bool = True

    # ── RAG ───────────────────────────────────────────────────────────────────
    RAG_UNCERTAINTY_THRESHOLD: float = 0.65

    # ── Square payments ───────────────────────────────────────────────────────
    SQUARE_ACCESS_TOKEN: str = ""
    SQUARE_LOCATION_ID: str = ""
    SQUARE_WEBHOOK_SIGNATURE_KEY: str = ""
    SQUARE_ENVIRONMENT: str = "sandbox"  # "sandbox" or "production"
    ADVENTURE_PRICE_CENTS: int = 799  # $7.99 per person
    CORPORATE_CODES: str = ""  # comma-separated pre-issued codes, e.g. "ABC123,XYZ789"

    # ── Error monitoring ──────────────────────────────────────────────────────
    SENTRY_DSN: str = ""  # leave empty to disable

    # ── Debug ─────────────────────────────────────────────────────────────────
    DEBUG: bool = True

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_cors(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
