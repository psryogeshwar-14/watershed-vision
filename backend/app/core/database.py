"""
app/core/database.py
─────────────────────
SQLAlchemy engine, session factory, declarative Base, and the FastAPI
get_db dependency that yields scoped sessions.

PostGIS geometry types are available through GeoAlchemy2 once the
PostGIS extension is enabled on the database.
"""

from __future__ import annotations

from typing import Generator

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from app.core.config import settings


# ── Engine ────────────────────────────────────────────────────────────────────

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,          # verify connection liveness before checkout
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG,         # echo SQL only in debug mode
    connect_args={
        "options": "-c timezone=UTC"
    },
)


@event.listens_for(engine, "connect")
def _set_search_path(dbapi_connection, connection_record):
    """Ensure PostGIS functions are available via the public schema."""
    cursor = dbapi_connection.cursor()
    cursor.execute("SET search_path TO public")
    cursor.close()


# ── Session factory ───────────────────────────────────────────────────────────

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


# ── Declarative Base ──────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


# ── Dependency ────────────────────────────────────────────────────────────────

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session and ensures it is
    closed after the request, even if an exception occurs.

    Usage::

        @router.get("/items")
        def list_items(db: Session = Depends(get_db)):
            ...
    """
    db: Session = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def create_all_tables() -> None:
    """
    Create all tables defined by ORM models (called at application startup).
    Also attempts to enable PostGIS extension if it is not already present.
    """
    with engine.connect() as conn:
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis_topology"))
            conn.commit()
        except Exception as exc:  # pragma: no cover
            # Non-fatal: extension may already exist or user may lack privileges
            print(f"[database] Could not enable PostGIS extension: {exc}")

    # Import models so their metadata is registered before create_all
    from app.models import geo_image, watershed  # noqa: F401
    Base.metadata.create_all(bind=engine)
