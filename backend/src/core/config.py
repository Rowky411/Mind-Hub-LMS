"""
Configuration management using Pydantic Settings.

Loads configuration from environment variables with type validation.
"""
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Mind Hub LMS"
    APP_ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://mindhub:mindhub_dev_password@localhost:5432/mindhub_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT Authentication
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: Union[List[str], str] = "http://localhost:5173,http://localhost:3000"
    ALLOWED_HOSTS: Union[List[str], str] = "localhost,127.0.0.1"

    @field_validator("CORS_ORIGINS", "ALLOWED_HOSTS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse comma-separated string into list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # File Storage
    STORAGE_PATH: str = "../storage"
    MAX_FILE_SIZE_MB: int = 2048  # 2GB

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # Email (optional for P3)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@mindhub.edu"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


# Global settings instance
settings = Settings()
