"""
app/utils/geospatial.py
────────────────────────
Geospatial utility functions shared across API routers and services.
"""

from __future__ import annotations

import base64
import io
import logging
import math
from pathlib import Path
from typing import Any, Optional

import numpy as np

logger = logging.getLogger(__name__)


# ── Bounding box helpers ──────────────────────────────────────────────────────

def bbox_to_polygon(
    west: float,
    south: float,
    east: float,
    north: float,
) -> dict[str, Any]:
    """
    Convert bounding-box coordinates to a GeoJSON Polygon.

    Args:
        west:  Minimum longitude (decimal degrees).
        south: Minimum latitude (decimal degrees).
        east:  Maximum longitude (decimal degrees).
        north: Maximum latitude (decimal degrees).

    Returns:
        GeoJSON Polygon dict.
    """
    return {
        "type": "Polygon",
        "coordinates": [[
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],   # close ring
        ]],
    }


def point_in_bbox(
    lat: float,
    lon: float,
    west: float,
    south: float,
    east: float,
    north: float,
) -> bool:
    """Return True if (lat, lon) falls within the bounding box."""
    return south <= lat <= north and west <= lon <= east


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Compute the great-circle distance between two GPS points in metres.

    Uses the Haversine formula.
    """
    R = 6_371_000  # Earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Raster helpers ────────────────────────────────────────────────────────────

def raster_to_base64(raster_path: str | Path, band: int = 1) -> str:
    """
    Read a single-band GeoTIFF and return it as a base64-encoded PNG string.

    Args:
        raster_path: Path to the GeoTIFF file.
        band:        Band index (1-based).

    Returns:
        ``data:image/png;base64,...`` data URI string.
    """
    try:
        import rasterio
        from PIL import Image as PILImage

        with rasterio.open(raster_path) as src:
            arr = src.read(band).astype(np.float32)
            nodata = src.nodata

        if nodata is not None:
            arr = np.where(arr == nodata, np.nan, arr)

        valid = arr[~np.isnan(arr)]
        if valid.size == 0:
            # Return empty PNG
            img = PILImage.new("RGB", (1, 1), (0, 0, 0))
        else:
            v_min, v_max = valid.min(), valid.max()
            span = v_max - v_min if v_max != v_min else 1.0
            normalised = (arr - v_min) / span
            normalised = np.nan_to_num(normalised, nan=0.0)
            rgb = _apply_ndvi_colormap(normalised)
            img = PILImage.fromarray(rgb, "RGB")

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        encoded = base64.b64encode(buf.getvalue()).decode()
        return f"data:image/png;base64,{encoded}"
    except Exception as exc:
        logger.error("raster_to_base64 failed: %s", exc)
        return ""


def reproject_raster(
    input_path: str | Path,
    output_path: str | Path,
    target_crs: str = "EPSG:4326",
) -> str:
    """
    Reproject a raster file to a target CRS using rasterio.

    Args:
        input_path:  Source GeoTIFF path.
        output_path: Destination GeoTIFF path.
        target_crs:  Target coordinate reference system string.

    Returns:
        Absolute path string of the reprojected file.
    """
    try:
        import rasterio
        from rasterio.warp import calculate_default_transform, reproject, Resampling

        with rasterio.open(input_path) as src:
            transform, width, height = calculate_default_transform(
                src.crs, target_crs, src.width, src.height, *src.bounds
            )
            kwargs = src.meta.copy()
            kwargs.update({
                "crs": target_crs,
                "transform": transform,
                "width": width,
                "height": height,
            })
            with rasterio.open(output_path, "w", **kwargs) as dst:
                for i in range(1, src.count + 1):
                    reproject(
                        source=rasterio.band(src, i),
                        destination=rasterio.band(dst, i),
                        src_transform=src.transform,
                        src_crs=src.crs,
                        dst_transform=transform,
                        dst_crs=target_crs,
                        resampling=Resampling.bilinear,
                    )
        return str(Path(output_path).resolve())
    except Exception as exc:
        logger.error("reproject_raster failed: %s", exc)
        return str(input_path)


def calculate_statistics(raster_path: str | Path, band: int = 1) -> dict[str, float]:
    """
    Compute basic descriptive statistics for a raster band.

    Args:
        raster_path: Path to the GeoTIFF.
        band:        Band index (1-based).

    Returns:
        Dict with keys: mean, std, min, max, median, valid_pixels, nodata_pixels.
    """
    try:
        import rasterio

        with rasterio.open(raster_path) as src:
            arr = src.read(band).astype(np.float32)
            nodata = src.nodata

        mask = ~np.isnan(arr)
        if nodata is not None:
            mask &= arr != nodata

        valid = arr[mask]
        nodata_count = int((~mask).sum())

        if valid.size == 0:
            return {
                "mean": 0.0, "std": 0.0, "min": 0.0, "max": 0.0,
                "median": 0.0, "valid_pixels": 0, "nodata_pixels": nodata_count,
            }

        return {
            "mean": float(np.mean(valid)),
            "std": float(np.std(valid)),
            "min": float(np.min(valid)),
            "max": float(np.max(valid)),
            "median": float(np.median(valid)),
            "valid_pixels": int(valid.size),
            "nodata_pixels": nodata_count,
        }
    except Exception as exc:
        logger.error("calculate_statistics failed: %s", exc)
        return {"mean": 0.0, "std": 0.0, "min": 0.0, "max": 0.0,
                "median": 0.0, "valid_pixels": 0, "nodata_pixels": 0}


# ── Colour ramp ───────────────────────────────────────────────────────────────

def generate_color_ramp(
    n_classes: int = 10,
    scheme: str = "ndvi",
) -> list[tuple[int, int, int]]:
    """
    Generate an RGB colour ramp for raster visualisation.

    Args:
        n_classes: Number of discrete colour stops.
        scheme:    One of "ndvi", "ndwi", "terrain", "heat".

    Returns:
        List of (R, G, B) tuples, length == n_classes.
    """
    ramps: dict[str, list[tuple[int, int, int]]] = {
        "ndvi": [
            (215, 25, 28), (253, 174, 97), (255, 255, 191),
            (166, 217, 106), (26, 152, 80),
        ],
        "ndwi": [
            (215, 48, 39), (252, 141, 89), (255, 255, 191),
            (145, 191, 219), (69, 117, 180),
        ],
        "terrain": [
            (70, 130, 180), (34, 139, 34), (107, 142, 35),
            (184, 134, 11), (139, 69, 19), (255, 255, 255),
        ],
        "heat": [
            (255, 255, 178), (254, 204, 92), (253, 141, 60),
            (240, 59, 32), (189, 0, 38),
        ],
    }

    stops = ramps.get(scheme, ramps["ndvi"])
    if n_classes == len(stops):
        return stops

    # Interpolate between stops
    result: list[tuple[int, int, int]] = []
    for i in range(n_classes):
        t = i / max(n_classes - 1, 1) * (len(stops) - 1)
        lo = int(t)
        hi = min(lo + 1, len(stops) - 1)
        frac = t - lo
        r = int(stops[lo][0] + frac * (stops[hi][0] - stops[lo][0]))
        g = int(stops[lo][1] + frac * (stops[hi][1] - stops[lo][1]))
        b = int(stops[lo][2] + frac * (stops[hi][2] - stops[lo][2]))
        result.append((r, g, b))
    return result


# ── Internal ──────────────────────────────────────────────────────────────────

def _apply_ndvi_colormap(normalised: np.ndarray) -> np.ndarray:
    """Map [0,1] float array to RGB using the NDVI colour ramp."""
    stops = generate_color_ramp(256, "ndvi")
    r_lut = np.array([s[0] for s in stops], dtype=np.uint8)
    g_lut = np.array([s[1] for s in stops], dtype=np.uint8)
    b_lut = np.array([s[2] for s in stops], dtype=np.uint8)

    idx = (np.clip(normalised, 0, 1) * 255).astype(np.uint8)
    return np.stack([r_lut[idx], g_lut[idx], b_lut[idx]], axis=-1)
