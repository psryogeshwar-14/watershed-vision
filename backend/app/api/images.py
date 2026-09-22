"""
app/api/images.py
──────────────────
REST API router for field geo-image management.

Endpoints
─────────
POST   /images/upload          Upload + EXIF-parse + async AI classify
GET    /images/                List images (optional watershed/bbox filter)
GET    /images/geojson         GeoJSON FeatureCollection for Leaflet
GET    /images/{id}            Single image detail with AI results
GET    /images/{id}/thumbnail  Serve image file as HTTP response
DELETE /images/{id}            Remove image record and file
"""

from __future__ import annotations

import asyncio
import logging
import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from geoalchemy2.functions import ST_MakePoint, ST_SetSRID

from app.core.config import settings
from app.core.database import get_db
from app.models.geo_image import ActivityType, GeoImage
from app.services.exif_parser import parse_exif_from_bytes
from app.services.image_classifier import image_classifier

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/images", tags=["Images"])

# ── Allowed MIME types ────────────────────────────────────────────────────────

_ALLOWED_TYPES = {
    "image/jpeg", "image/jpg", "image/png",
    "image/heic", "image/heif", "image/webp",
}

_EXTENSION_MAP = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/webp": ".webp",
}


# ── Background task: AI classification ───────────────────────────────────────

async def _classify_and_update(image_id: str, file_path: str, db: Session) -> None:
    """Run Gemini Vision classification and write results to the database."""
    try:
        result = await image_classifier.classify_image(file_path)
        db.query(GeoImage).filter(GeoImage.id == image_id).update(
            {
                "ai_label": result.label,
                "ai_confidence": result.confidence,
                "ai_description": result.description,
                "ai_recommendations": result.recommendations,
                "is_processed": True,
                "activity_type": result.label,
            }
        )
        db.commit()
        logger.info("AI classification complete for image %s – label=%s", image_id, result.label)
    except Exception as exc:
        logger.error("Background classification failed for %s: %s", image_id, exc)


# ── Upload ────────────────────────────────────────────────────────────────────

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    watershed_id: Optional[str] = Query(None, description="Associate with a watershed UUID"),
    description: Optional[str] = Query(None, description="Optional field note"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Upload a geotagged field photograph.

    - Validates file type and size.
    - Extracts GPS and capture datetime from EXIF.
    - Saves the file to the UPLOAD_DIR.
    - Creates a database record.
    - Triggers background AI classification via Gemini Vision.
    """
    # Validate content type
    content_type = (file.content_type or "").lower()
    if content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {content_type}. Allowed: JPEG, PNG, HEIC, WebP",
        )

    # Read file bytes
    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {settings.MAX_FILE_SIZE // 1_048_576} MB",
        )

    # Parse EXIF
    exif = parse_exif_from_bytes(file_bytes, content_type)

    # Generate unique filename
    ext = _EXTENSION_MAP.get(content_type, ".jpg")
    unique_name = f"{uuid.uuid4().hex}{ext}"
    upload_dir = Path(settings.upload_dir_abs)
    upload_dir.mkdir(parents=True, exist_ok=True)
    dest_path = upload_dir / unique_name

    # Write file
    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    # Build PostGIS geometry if GPS is available
    geom = None
    if exif.has_gps:
        geom = ST_SetSRID(
            ST_MakePoint(exif.longitude, exif.latitude),
            4326,
        )

    # Create DB record
    image_id = uuid.uuid4()
    geo_image = GeoImage(
        id=image_id,
        filename=unique_name,
        original_filename=file.filename or unique_name,
        file_path=str(dest_path),
        latitude=exif.latitude,
        longitude=exif.longitude,
        geom=geom,
        altitude=exif.altitude,
        captured_at=exif.captured_at,
        watershed_id=uuid.UUID(watershed_id) if watershed_id else None,
        description=description,
        activity_type=ActivityType.other,
        is_processed=False,
    )
    db.add(geo_image)
    db.flush()
    db.refresh(geo_image)

    # Schedule background classification (pass a new DB session reference)
    background_tasks.add_task(
        _classify_and_update,
        str(image_id),
        str(dest_path),
        db,
    )

    return {
        "id": str(image_id),
        "filename": unique_name,
        "original_filename": file.filename,
        "latitude": exif.latitude,
        "longitude": exif.longitude,
        "altitude": exif.altitude,
        "captured_at": exif.captured_at.isoformat() if exif.captured_at else None,
        "has_gps": exif.has_gps,
        "is_processed": False,
        "message": "Image uploaded. AI classification queued in background.",
    }


# ── List ──────────────────────────────────────────────────────────────────────

@router.get("/", response_model=None)
def list_images(
    watershed_id: Optional[str] = Query(None),
    west: Optional[float] = Query(None, description="BBox west longitude"),
    south: Optional[float] = Query(None, description="BBox south latitude"),
    east: Optional[float] = Query(None, description="BBox east longitude"),
    north: Optional[float] = Query(None, description="BBox north latitude"),
    activity_type: Optional[str] = Query(None, description="Filter by activity type"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """List all images with optional filtering by watershed, bounding box, and activity type."""
    query = db.query(GeoImage)

    if watershed_id:
        try:
            query = query.filter(GeoImage.watershed_id == uuid.UUID(watershed_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid watershed_id UUID")

    if activity_type:
        try:
            act = ActivityType(activity_type)
            query = query.filter(GeoImage.activity_type == act)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid activity_type: {activity_type}")

    if all(v is not None for v in [west, south, east, north]):
        query = query.filter(
            GeoImage.latitude.between(south, north),
            GeoImage.longitude.between(west, east),
        )

    total = query.count()
    images = query.order_by(GeoImage.uploaded_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": [_image_to_dict(img) for img in images],
    }


# ── GeoJSON endpoint ──────────────────────────────────────────────────────────

@router.get("/geojson", response_model=None)
def images_geojson(
    watershed_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Return all images as a GeoJSON FeatureCollection for use with Leaflet / MapLibre.
    Only images with valid GPS coordinates are included.
    """
    query = db.query(GeoImage).filter(
        GeoImage.latitude.isnot(None),
        GeoImage.longitude.isnot(None),
    )
    if watershed_id:
        try:
            query = query.filter(GeoImage.watershed_id == uuid.UUID(watershed_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid watershed_id UUID")

    images = query.all()
    features = [_image_to_geojson_feature(img) for img in images]

    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "total": len(features),
            "generated_at": datetime.utcnow().isoformat(),
        },
    }


# ── Single image detail ───────────────────────────────────────────────────────

@router.get("/{image_id}", response_model=None)
def get_image(
    image_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Retrieve a single image record including AI classification results."""
    try:
        uid = uuid.UUID(image_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid image ID")

    img = db.query(GeoImage).filter(GeoImage.id == uid).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    return _image_to_dict(img, include_ai=True)


# ── Thumbnail / serve file ────────────────────────────────────────────────────

@router.get("/{image_id}/thumbnail")
def get_thumbnail(
    image_id: str,
    db: Session = Depends(get_db),
) -> FileResponse:
    """Serve the image file directly as an HTTP response."""
    try:
        uid = uuid.UUID(image_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid image ID")

    img = db.query(GeoImage).filter(GeoImage.id == uid).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    if not Path(img.file_path).is_file():
        raise HTTPException(status_code=404, detail="Image file not found on disk")

    ext = Path(img.filename).suffix.lower()
    media_type_map = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".png": "image/png", ".heic": "image/heic",
        ".heif": "image/heif", ".webp": "image/webp",
    }
    media_type = media_type_map.get(ext, "application/octet-stream")

    return FileResponse(
        path=img.file_path,
        media_type=media_type,
        filename=img.original_filename,
    )


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(
    image_id: str,
    db: Session = Depends(get_db),
):
    """Delete an image record and remove the file from disk."""
    try:
        uid = uuid.UUID(image_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid image ID")

    img = db.query(GeoImage).filter(GeoImage.id == uid).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    # Remove file from disk
    try:
        if Path(img.file_path).is_file():
            os.remove(img.file_path)
    except OSError as exc:
        logger.warning("Could not delete file %s: %s", img.file_path, exc)

    db.delete(img)
    db.commit()


# ── Serialisation helpers ─────────────────────────────────────────────────────

def _image_to_dict(img: GeoImage, include_ai: bool = True) -> dict[str, Any]:
    d: dict[str, Any] = {
        "id": str(img.id),
        "filename": img.filename,
        "original_filename": img.original_filename,
        "latitude": img.latitude,
        "longitude": img.longitude,
        "altitude": img.altitude,
        "captured_at": img.captured_at.isoformat() if img.captured_at else None,
        "uploaded_at": img.uploaded_at.isoformat() if img.uploaded_at else None,
        "watershed_id": str(img.watershed_id) if img.watershed_id else None,
        "activity_type": img.activity_type.value if img.activity_type else None,
        "description": img.description,
        "is_processed": img.is_processed,
        "thumbnail_url": f"/images/{img.id}/thumbnail",
    }
    if include_ai:
        d["ai"] = {
            "label": img.ai_label,
            "confidence": img.ai_confidence,
            "description": img.ai_description,
            "recommendations": img.ai_recommendations,
        }
    return d


def _image_to_geojson_feature(img: GeoImage) -> dict[str, Any]:
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [img.longitude, img.latitude],
        },
        "properties": {
            "id": str(img.id),
            "filename": img.filename,
            "activity_type": img.activity_type.value if img.activity_type else "other",
            "ai_label": img.ai_label,
            "ai_confidence": img.ai_confidence,
            "description": img.description,
            "captured_at": img.captured_at.isoformat() if img.captured_at else None,
            "thumbnail_url": f"/images/{img.id}/thumbnail",
            "watershed_id": str(img.watershed_id) if img.watershed_id else None,
        },
    }
