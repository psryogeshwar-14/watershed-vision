"""
app/models/watershed.py
────────────────────────
SQLAlchemy ORM model for Watershed entities.

Each watershed record holds metadata (name, state, district, area) and a
PostGIS geometry column for its boundary polygon/multipolygon.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from geoalchemy2 import Geometry
from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class WatershedStatus(str, PyEnum):
    active = "active"
    completed = "completed"
    pending = "pending"


class Watershed(Base):
    """
    Represents a delineated watershed / micro-watershed boundary.

    The ``boundary`` column stores a PostGIS geometry (Polygon or
    MultiPolygon) in EPSG:4326.
    """

    __tablename__ = "watersheds"

    # ── Primary key ──────────────────────────────────────────────────────
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    # ── Descriptive fields ────────────────────────────────────────────────
    name = Column(String(255), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)

    # Area in hectares
    area_ha = Column(Float, nullable=True)

    # ── Geometry ──────────────────────────────────────────────────────────
    # Accepts both Polygon and MultiPolygon to handle merged sub-watersheds
    boundary = Column(
        Geometry(geometry_type="GEOMETRY", srid=4326),
        nullable=True,
    )

    # ── Temporal ─────────────────────────────────────────────────────────
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True,
    )

    # ── Status ────────────────────────────────────────────────────────────
    status = Column(
        Enum(WatershedStatus, name="watershedstatus"),
        default=WatershedStatus.active,
        nullable=False,
    )

    # ── Relationships ─────────────────────────────────────────────────────
    images = relationship(
        "GeoImage",
        back_populates="watershed",
        cascade="all, delete-orphan",
        lazy="select",
    )

    # ── Repr ─────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return (
            f"<Watershed id={self.id!s} name={self.name!r} "
            f"district={self.district!r} status={self.status}>"
        )
