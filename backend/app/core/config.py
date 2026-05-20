from __future__ import annotations

from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.db_url import normalize_database_url

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_ENV_FILE = _BACKEND_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Arce Sabin Engineering (ASE) Backend"

    DATABASE_URL: str = Field(
        ...,
        description="PostgreSQL connection URL (postgresql+psycopg://…)",
    )

    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    MVP_MODE: bool = True

    CORS_ALLOW_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176",
        description="Comma-separated browser origins (SPA URLs) allowed for CORS.",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _validate_database_url(cls, value: object) -> str:
        if value is None or (isinstance(value, str) and not value.strip()):
            raise ValueError("DATABASE_URL is required")
        return normalize_database_url(str(value))

    @property
    def sqlalchemy_database_url(self) -> str:
        """Alias kept for Alembic and existing imports."""
        return self.DATABASE_URL

    @property
    def cors_origins_list(self) -> list[str]:
        xs = [o.strip() for o in self.CORS_ALLOW_ORIGINS.split(",") if o.strip()]
        return xs if xs else ["http://localhost:5173"]


settings = Settings()
