"""
app/main.py
────────────
WatershedVision FastAPI application entry point.

Startup sequence
────────────────
1. Create upload directory.
2. Initialise PostGIS and create all ORM tables.
3. Mount static-file directory for uploaded images (/uploads).
4. Register all API routers.
5. Add CORS middleware (all origins allowed for dev).
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import analysis, auth, images, satellite, thematic
from app.core.config import settings
from app.core.database import create_all_tables

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("watershedvision")


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application startup / shutdown lifecycle handler.

    Startup:
      - Ensure upload directory exists.
      - Enable PostGIS extension and create all DB tables.

    Shutdown:
      - (placeholder for clean-up: close GEE sessions, flush caches, etc.)
    """
    # ── Startup ───────────────────────────────────────────────────────────
    upload_dir = Path(settings.upload_dir_abs)
    upload_dir.mkdir(parents=True, exist_ok=True)
    logger.info("Upload directory: %s", upload_dir)

    try:
        create_all_tables()
        logger.info("Database tables verified / created")
    except Exception as exc:
        logger.error("Database setup failed: %s", exc)
        # Non-fatal in development; raise in production if desired.

    logger.info(
        "🚀 %s v%s started | GEE=%s | Gemini=%s",
        settings.APP_NAME,
        settings.APP_VERSION,
        "✓" if settings.gee_configured else "✗ (mock mode)",
        "✓" if settings.gemini_configured else "✗ (mock mode)",
    )

    yield  # ── Application running ─────────────────────────────────────────

    # ── Shutdown ──────────────────────────────────────────────────────────
    logger.info("Shutting down %s", settings.APP_NAME)


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Geospatial watershed monitoring platform API. "
        "Provides satellite analysis, field image management, "
        "thematic mapping, and AI-powered classification."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # ["*"] in dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


# ── Static files (uploaded images) ───────────────────────────────────────────

_upload_dir = Path(settings.upload_dir_abs)
_upload_dir.mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=str(_upload_dir), check_dir=False),
    name="uploads",
)


# ── API routers ───────────────────────────────────────────────────────────────

for pfx in ("/api", "/api/v1"):
    app.include_router(auth.router,      prefix=pfx)
    app.include_router(images.router,    prefix=pfx)
    app.include_router(satellite.router, prefix=pfx)
    app.include_router(thematic.router,  prefix=pfx)
    app.include_router(analysis.router,  prefix=pfx)


# ── Watersheds endpoint (supports direct frontend and proxy requests) ─────────

SAMPLE_WATERSHEDS_LIST = [
    {"id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "name": "Bhor Watershed - Maharashtra", "state": "Maharashtra", "district": "Pune", "area_ha": 2450.5, "status": "active"},
    {"id": "4ba96a75-6828-5673-c4ad-3d074a77bfb7", "name": "Alwar Watershed - Rajasthan", "state": "Rajasthan", "district": "Alwar", "area_ha": 3820.0, "status": "active"},
    {"id": "5cb07b86-7939-6784-d5be-4e185b88cfc8", "name": "Bellary Watershed - Karnataka", "state": "Karnataka", "district": "Ballari", "area_ha": 1980.2, "status": "active"},
    {"id": "6dc18c97-8040-7895-e6cf-5f296c99d0d9", "name": "Godavari Upper - Maharashtra", "state": "Maharashtra", "district": "Nashik", "area_ha": 48200.0, "status": "active"},
]

@app.get("/watersheds", tags=["Watersheds"])
@app.get("/watersheds/", tags=["Watersheds"])
@app.get("/api/watersheds", tags=["Watersheds"])
@app.get("/api/watersheds/", tags=["Watersheds"])
@app.get("/api/v1/watersheds", tags=["Watersheds"])
@app.get("/api/v1/watersheds/", tags=["Watersheds"])
def list_watersheds_endpoint():
    """Return all watersheds, with graceful fallback to sample watersheds."""
    try:
        from app.core.database import SessionLocal
        from app.models.watershed import Watershed
        db = SessionLocal()
        try:
            ws = db.query(Watershed).all()
            if ws:
                return [
                    {
                        "id": str(w.id),
                        "name": w.name,
                        "state": w.state,
                        "district": w.district,
                        "area_ha": w.area_ha,
                        "status": w.status.value if w.status else "active",
                    }
                    for w in ws
                ]
        finally:
            db.close()
    except Exception as exc:
        logger.debug("Database watershed query fallback: %s", exc)
    return SAMPLE_WATERSHEDS_LIST


# ── Core endpoints ────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health_check() -> dict[str, Any]:
    """
    Liveness probe endpoint.

    Returns HTTP 200 with service status when the application is running.
    Suitable for use with Docker health checks and Kubernetes liveness probes.
    """
    from datetime import datetime
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "features": {
            "gee_configured": settings.gee_configured,
            "gemini_configured": settings.gemini_configured,
        },
    }


@app.get("/", tags=["System"])
def root() -> dict[str, Any]:
    """
    Root endpoint — returns platform info and a list of key API endpoints.
    """
    return {
        "platform": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": (
            "WatershedVision is a geospatial watershed monitoring platform "
            "that combines satellite remote sensing with AI-powered field-image "
            "classification to track watershed health and intervention effectiveness."
        ),
        "endpoints": {
            "docs":          "/docs",
            "redoc":         "/redoc",
            "health":        "/health",
            "images_api":    "/api/v1/images",
            "satellite_api": "/api/v1/satellite",
            "thematic_api":  "/api/v1/thematic",
            "analysis_api":  "/api/v1/analysis",
            "auth_api":      "/api/v1/auth",
        },
        "mock_mode": {
            "satellite": not settings.gee_configured,
            "ai_classification": not settings.gemini_configured,
        },
    }
