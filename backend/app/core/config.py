"""
app/core/config.py
──────────────────
Centralised settings loaded from environment / .env file.
All API keys, DB URLs, and feature-flags live here.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide configuration sourced from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────
    DATABASE_URL: str = (
        "postgresql+psycopg2://watershed_user:watershed_pass@localhost:5432/watershed_db"
    )

    # ── Google Earth Engine ───────────────────────────────────────────────
    GEE_PROJECT_ID: Optional[str] = None
    GEE_SERVICE_ACCOUNT: Optional[str] = None
    GEE_KEY_FILE: Optional[str] = None

    # ── Gemini Vision API ─────────────────────────────────────────────────
    GEMINI_API_KEY: Optional[str] = None

    # ── Security / JWT ────────────────────────────────────────────────────
    SECRET_KEY: str = "insecure-dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # ── File storage ──────────────────────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 52_428_800  # 50 MB

    # ── Application metadata ──────────────────────────────────────────────
    APP_NAME: str = "WatershedVision API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── CORS ──────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = ["*"]

    # ── Convenience helpers ───────────────────────────────────────────────

    @property
    def gee_configured(self) -> bool:
        """
        True when either:
        1. A GEE service account email and valid key file path are provided.
        2. A GEE / Google Cloud Project ID is provided (for ADC or earthengine authenticate).
        3. GOOGLE_APPLICATION_CREDENTIALS points to an existing file.
        """
        has_sa = bool(
            self.GEE_SERVICE_ACCOUNT
            and self.GEE_KEY_FILE
            and os.path.isfile(self.GEE_KEY_FILE)
        )
        has_project = bool(self.GEE_PROJECT_ID and self.GEE_PROJECT_ID.strip())
        has_adc = bool(
            os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            and os.path.isfile(os.getenv("GOOGLE_APPLICATION_CREDENTIALS", ""))
        )
        return has_sa or has_project or has_adc

    @property
    def gemini_configured(self) -> bool:
        """True when a valid, non-empty Gemini API key is present."""
        return bool(self.GEMINI_API_KEY and self.GEMINI_API_KEY.strip() and not self.GEMINI_API_KEY.startswith("AIza..."))

    @property
    def upload_dir_abs(self) -> str:
        """Absolute path to the uploads directory."""
        return os.path.abspath(self.UPLOAD_DIR)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the cached singleton Settings instance."""
    return Settings()


# Module-level singleton for import convenience
settings: Settings = get_settings()
