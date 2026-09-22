"""
app/models/geo_image.py
────────────────────────
SQLAlchemy ORM model for field photographs uploaded by surveyors.

Each image is geo-tagged (point geometry) and may carry AI classification
results from the Gemini Vision service.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class ActivityType(str, PyEnum):
    """Watershed intervention / observation categories."""
    check_dam = "check_dam"
    contour_bund = "contour_bund"
    afforestation = "afforestation"
    water_body = "water_body"
    soil_erosion = "soil_erosion"
    drainage = "drainage"
    other = "other"


class GeoImage(Base):
    """
    Stores a single geotagged field photograph together with its extracted
    metadata and AI-generated classification results.
    """

    __tablename__ = "geo_images"

    # ── Primary key ──────────────────────────────────────────────────────
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    # ── File info ─────────────────────────────────────────────────────────
    filename = Column(String(255), nullable=False, unique=True)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)

    # ── GPS / location ────────────────────────────────────────────────────
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    # PostGIS Point geometry (EPSG:4326) — populated after GPS extraction
    geom = Column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=True,
    )
    altitude = Column(Float, nullable=True)  # metres above sea level

    # ── Temporal ──────────────────────────────────────────────────────────
    captured_at = Column(DateTime(timezone=True), nullable=True)  # EXIF datetime
    uploaded_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ── Watershed FK ─────────────────────────────────────────────────────
    watershed_id = Column(
        UUID(as_uuid=True),
        ForeignKey("watersheds.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ── Activity classification ───────────────────────────────────────────
    activity_type = Column(
        Enum(ActivityType, name="activitytype"),
        default=ActivityType.other,
        nullable=False,
    )
    description = Column(Text, nullable=True)

    # ── AI results (from Gemini Vision) ──────────────────────────────────
    ai_label = Column(String(100), nullable=True)
    ai_confidence = Column(Float, nullable=True)   # 0.0 – 1.0
    ai_description = Column(Text, nullable=True)
    ai_recommendations = Column(Text, nullable=True)
    is_processed = Column(Boolean, default=False, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────
    watershed = relationship(
        "Watershed",
        back_populates="images",
        lazy="select",
    )

    # ── Repr ─────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return (
            f"<GeoImage id={self.id!s} filename={self.filename!r} "
            f"activity={self.activity_type} processed={self.is_processed}>"
        )
