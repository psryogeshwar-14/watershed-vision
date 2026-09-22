"""
app/api/thematic.py
────────────────────
REST API router for thematic map layers.

Endpoints
─────────
GET /thematic/maps                  List available thematic layers for a watershed
GET /thematic/vegetation            Vegetation index map (NDVI colour ramp)
GET /thematic/water-bodies          Water body polygons as GeoJSON
GET /thematic/drainage              Drainage network as GeoJSON LineStrings
GET /thematic/intervention-heatmap  KDE heatmap from field image locations
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.geo_image import GeoImage
from app.models.watershed import Watershed
from app.services.thematic_map_gen import thematic_map_generator
from app.utils.geospatial import generate_color_ramp

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/thematic", tags=["Thematic Maps"])


# ── Available maps ────────────────────────────────────────────────────────────

@router.get("/maps", response_model=None)
def list_thematic_maps(
    watershed_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    List all thematic map layers available for the given watershed.

    Each layer entry includes its endpoint URL, description, and type.
    """
    base = "/thematic"
    qs = f"?watershed_id={watershed_id}" if watershed_id else ""

    maps = [
        {
            "id": "vegetation",
            "name": "Vegetation Index (NDVI)",
            "description": "Normalised Difference Vegetation Index derived from Sentinel-2",
            "type": "raster",
            "endpoint": f"{base}/vegetation{qs}",
            "legend_type": "color_ramp",
            "legend_colors": generate_color_ramp(5, "ndvi"),
            "legend_labels": ["No vegetation", "Sparse", "Moderate", "Dense", "Very Dense"],
        },
        {
            "id": "water_bodies",
            "name": "Water Bodies",
            "description": "Detected surface water bodies (NDWI > 0)",
            "type": "vector_polygon",
            "endpoint": f"{base}/water-bodies{qs}",
            "legend_type": "simple",
            "fill_color": "#4575b4",
            "stroke_color": "#1a3a6e",
        },
        {
            "id": "drainage",
            "name": "Drainage Network",
            "description": "Stream channels and drainage lines",
            "type": "vector_line",
            "endpoint": f"{base}/drainage{qs}",
            "legend_type": "simple",
            "stroke_color": "#1f78b4",
        },
        {
            "id": "intervention_heatmap",
            "name": "Intervention Heatmap",
            "description": "Density map of field survey activity locations",
            "type": "heatmap",
            "endpoint": f"{base}/intervention-heatmap{qs}",
            "legend_type": "color_ramp",
            "legend_colors": generate_color_ramp(5, "heat"),
            "legend_labels": ["Low", "Moderate", "Medium", "High", "Very High"],
        },
    ]

    return {
        "watershed_id": watershed_id,
        "available_maps": maps,
        "count": len(maps),
    }


# ── Vegetation (NDVI colour ramp info) ───────────────────────────────────────

@router.get("/vegetation", response_model=None)
async def get_vegetation_map(
    watershed_id: Optional[str] = Query(None),
    start_date: str = Query("2023-06-01"),
    end_date: str = Query("2023-09-30"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Return vegetation index (NDVI) raster data for the watershed.

    Delegates to the satellite processor and enhances the response with
    colour-ramp metadata for direct use by the frontend map renderer.
    """
    from app.services.satellite_processor import satellite_processor
    from datetime import date

    try:
        date.fromisoformat(start_date)
        date.fromisoformat(end_date)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    geom = _resolve_geom(watershed_id, db)
    ndvi_result = await satellite_processor.get_ndvi_image(geom, start_date, end_date)

    return {
        **ndvi_result,
        "layer_type": "vegetation_ndvi",
        "color_ramp": {
            "colors": generate_color_ramp(8, "ndvi"),
            "min_value": -0.2,
            "max_value": 0.8,
            "labels": ["-0.2", "0.0", "0.15", "0.30", "0.45", "0.60", "0.70", "0.80"],
        },
        "watershed_id": watershed_id,
        "start_date": start_date,
        "end_date": end_date,
    }


# ── Water bodies ──────────────────────────────────────────────────────────────

@router.get("/water-bodies", response_model=None)
def get_water_bodies(
    watershed_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Return detected surface water bodies as a GeoJSON FeatureCollection.

    Polygons are vectorised from NDWI analysis. Each feature includes
    estimated area and water body type.
    """
    geojson = thematic_map_generator.generate_water_body_polygons()
    geojson["watershed_id"] = watershed_id
    geojson["is_mock"] = True
    return geojson


# ── Drainage network ──────────────────────────────────────────────────────────

@router.get("/drainage", response_model=None)
def get_drainage_network(
    watershed_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Return drainage network as GeoJSON LineStrings with stream-order attributes.

    Features use Strahler stream ordering and include flow-direction metadata.
    """
    geojson = thematic_map_generator.generate_drainage_network()
    geojson["watershed_id"] = watershed_id
    geojson["is_mock"] = True
    return geojson


# ── Intervention heatmap ──────────────────────────────────────────────────────

@router.get("/intervention-heatmap", response_model=None)
def get_intervention_heatmap(
    watershed_id: Optional[str] = Query(None),
    activity_type: Optional[str] = Query(None, description="Filter by activity type"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Return KDE-based intervention density heatmap as a GeoJSON FeatureCollection.

    Each point feature has a ``weight`` (0.0–1.0) property suitable for
    Leaflet.heat or MapLibre-GL heatmap layer styling.
    """
    query = db.query(GeoImage).filter(
        GeoImage.latitude.isnot(None),
        GeoImage.longitude.isnot(None),
    )

    if watershed_id:
        try:
            query = query.filter(GeoImage.watershed_id == uuid.UUID(watershed_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid watershed_id")

    if activity_type:
        query = query.filter(GeoImage.activity_type == activity_type)

    images = query.all()

    if not images:
        # Return mock heatmap when no real data exists
        locations = _mock_locations()
        is_mock = True
    else:
        locations = [{"lat": img.latitude, "lon": img.longitude} for img in images]
        is_mock = False

    heatmap = thematic_map_generator.generate_intervention_heatmap(locations)
    heatmap["watershed_id"] = watershed_id
    heatmap["is_mock"] = is_mock
    heatmap["point_count"] = len(locations)

    return heatmap


# ── Helpers ───────────────────────────────────────────────────────────────────

def _resolve_geom(watershed_id: Optional[str], db: Session) -> Optional[dict]:
    if not watershed_id:
        return None
    try:
        from geoalchemy2.shape import to_shape
        ws = db.query(Watershed).filter(
            Watershed.id == uuid.UUID(watershed_id)
        ).first()
        if ws and ws.boundary is not None:
            return to_shape(ws.boundary).__geo_interface__
    except Exception as exc:
        logger.warning("Could not resolve watershed geom: %s", exc)
    return None


def _mock_locations() -> list[dict]:
    """Generate 30 synthetic GPS points near Nashik, Maharashtra."""
    import random
    rng = random.Random(42)
    return [
        {
            "lat": 19.92 + rng.uniform(-0.02, 0.04),
            "lon": 73.79 + rng.uniform(-0.01, 0.04),
        }
        for _ in range(30)
    ]
