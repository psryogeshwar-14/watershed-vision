"""
app/api/satellite.py
─────────────────────
REST API router for satellite imagery endpoints.

All endpoints accept an optional ``watershed_id`` and date range.
When GEE is not configured, responses include ``is_mock: true``.

Endpoints
─────────
GET /satellite/ndvi
GET /satellite/ndwi
GET /satellite/lulc
GET /satellite/timeseries
GET /satellite/sentinel-preview
"""

from __future__ import annotations

import logging
from datetime import date
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.watershed import Watershed
from app.services.satellite_processor import satellite_processor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/satellite", tags=["Satellite"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_watershed_geom(watershed_id: Optional[str], db: Session) -> Optional[dict]:
    """Fetch a watershed's GeoJSON boundary from the DB, or return None."""
    if not watershed_id:
        return None
    try:
        import uuid
        from geoalchemy2.shape import to_shape
        ws = db.query(Watershed).filter(Watershed.id == uuid.UUID(watershed_id)).first()
        if ws and ws.boundary is not None:
            shape = to_shape(ws.boundary)
            return shape.__geo_interface__
    except Exception as exc:
        logger.warning("Could not resolve watershed geometry: %s", exc)
    return None


def _validate_dates(start_date: str, end_date: str) -> None:
    """Raise 400 if dates are invalid or end is before start."""
    try:
        sd = date.fromisoformat(start_date)
        ed = date.fromisoformat(end_date)
        if ed < sd:
            raise ValueError("end_date must be >= start_date")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ── NDVI ──────────────────────────────────────────────────────────────────────

@router.get("/ndvi", response_model=None)
async def get_ndvi(
    watershed_id: Optional[str] = Query(None, description="Watershed UUID"),
    start_date: str = Query("2023-06-01", description="ISO date YYYY-MM-DD"),
    end_date: str = Query("2023-09-30", description="ISO date YYYY-MM-DD"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Return NDVI composite for the specified period.

    Response includes either a ``preview_url`` (GEE) or a ``base64_png``
    data URI (mock/offline) plus band statistics and an ``is_mock`` flag.
    """
    _validate_dates(start_date, end_date)
    geom = _get_watershed_geom(watershed_id, db)
    result = await satellite_processor.get_ndvi_image(geom, start_date, end_date)
    result["watershed_id"] = watershed_id
    result["start_date"] = start_date
    result["end_date"] = end_date
    return result


# ── NDWI ──────────────────────────────────────────────────────────────────────

@router.get("/ndwi", response_model=None)
async def get_ndwi(
    watershed_id: Optional[str] = Query(None),
    start_date: str = Query("2023-06-01"),
    end_date: str = Query("2023-09-30"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Return NDWI composite (Normalised Difference Water Index) for the
    specified period. High values indicate water bodies.
    """
    _validate_dates(start_date, end_date)
    geom = _get_watershed_geom(watershed_id, db)
    result = await satellite_processor.get_ndwi_image(geom, start_date, end_date)
    result["watershed_id"] = watershed_id
    result["start_date"] = start_date
    result["end_date"] = end_date
    return result


# ── LULC ──────────────────────────────────────────────────────────────────────

@router.get("/lulc", response_model=None)
async def get_lulc(
    watershed_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Return Land Use / Land Cover (ESA WorldCover 2020) classification for
    the watershed area. Includes class breakdown with area in hectares.
    """
    geom = _get_watershed_geom(watershed_id, db)
    result = await satellite_processor.get_lulc_classification(geom)
    result["watershed_id"] = watershed_id
    return result


# ── NDVI Timeseries ───────────────────────────────────────────────────────────

@router.get("/timeseries", response_model=None)
async def get_timeseries(
    watershed_id: Optional[str] = Query(None),
    start_date: str = Query("2023-01-01"),
    end_date: str = Query("2023-12-31"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Return monthly NDVI timeseries as a JSON array.

    Each array element: ``{date, mean_ndvi, min_ndvi, max_ndvi}``

    Useful for charting vegetation recovery trends over time.
    """
    _validate_dates(start_date, end_date)
    geom = _get_watershed_geom(watershed_id, db)
    series = await satellite_processor.get_timeseries(geom, start_date, end_date)

    is_mock = all(isinstance(v, dict) for v in series)  # always a list
    # Detect mock by checking if processor had GEE
    is_mock = not satellite_processor._gee_initialised

    return {
        "watershed_id": watershed_id,
        "start_date": start_date,
        "end_date": end_date,
        "is_mock": is_mock,
        "count": len(series),
        "data": series,
    }


# ── Sentinel RGB Preview ──────────────────────────────────────────────────────

@router.get("/sentinel-preview", response_model=None)
async def get_sentinel_preview(
    watershed_id: Optional[str] = Query(None),
    start_date: str = Query("2023-06-01"),
    end_date: str = Query("2023-09-30"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Return a Sentinel-2 true-colour RGB composite preview for the watershed.

    Response includes a ``preview_url`` (GEE thumbnail) or ``base64_png``
    data URI when running in mock mode.
    """
    _validate_dates(start_date, end_date)
    geom = _get_watershed_geom(watershed_id, db)
    result = await satellite_processor.get_sentinel_preview(geom, start_date, end_date)
    result["watershed_id"] = watershed_id
    result["start_date"] = start_date
    result["end_date"] = end_date
    return result
