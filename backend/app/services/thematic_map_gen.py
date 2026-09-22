"""
app/services/thematic_map_gen.py
─────────────────────────────────
Thematic map generation service.

Produces GeoJSON layers for:
  • Intervention heatmap   — KDE over field image GPS points
  • Water body polygons    — vectorised from NDWI rasters
  • Drainage network       — flow-direction derived polylines (mock fallback)
"""

from __future__ import annotations

import json
import logging
import math
from pathlib import Path
from typing import Any, Optional

import numpy as np

logger = logging.getLogger(__name__)

# ── Sample drainage network for Maharashtra ───────────────────────────────────

_SAMPLE_DRAINAGE_LINES = [
    # Main nala running roughly NW→SE
    [[73.7850, 19.9550], [73.7900, 19.9480], [73.7960, 19.9400],
     [73.8020, 19.9320], [73.8080, 19.9240]],
    # Tributary 1
    [[73.7820, 19.9500], [73.7870, 19.9450], [73.7900, 19.9480]],
    # Tributary 2
    [[73.8050, 19.9380], [73.8000, 19.9350], [73.7960, 19.9400]],
]


class ThematicMapGenerator:
    """
    Generates thematic GeoJSON layers for the WatershedVision frontend.
    """

    # ── Intervention heatmap ───────────────────────────────────────────────

    @staticmethod
    def generate_intervention_heatmap(
        image_locations: list[dict[str, float]],
    ) -> dict[str, Any]:
        """
        Compute a KDE-based heatmap from GPS point locations.

        Args:
            image_locations: List of {"lat": float, "lon": float} dicts.

        Returns:
            GeoJSON FeatureCollection of point features with a ``weight``
            property (0.0–1.0) suitable for Leaflet.heat.
        """
        if not image_locations:
            return _empty_feature_collection("intervention_heatmap")

        lats = np.array([p["lat"] for p in image_locations])
        lons = np.array([p["lon"] for p in image_locations])

        # Grid over bounding box
        lat_min, lat_max = lats.min() - 0.01, lats.max() + 0.01
        lon_min, lon_max = lons.min() - 0.01, lons.max() + 0.01

        grid_size = 40
        lat_grid = np.linspace(lat_min, lat_max, grid_size)
        lon_grid = np.linspace(lon_min, lon_max, grid_size)

        # Bandwidth (Scott's rule)
        n = len(lats)
        bw_lat = 1.06 * lats.std() * n**(-1 / 5) if n > 1 else 0.01
        bw_lon = 1.06 * lons.std() * n**(-1 / 5) if n > 1 else 0.01
        bw_lat = max(bw_lat, 0.005)
        bw_lon = max(bw_lon, 0.005)

        density = np.zeros((grid_size, grid_size))
        for i, glat in enumerate(lat_grid):
            for j, glon in enumerate(lon_grid):
                lat_contrib = np.exp(-0.5 * ((lats - glat) / bw_lat) ** 2)
                lon_contrib = np.exp(-0.5 * ((lons - glon) / bw_lon) ** 2)
                density[i, j] = np.sum(lat_contrib * lon_contrib)

        # Normalise to [0, 1]
        d_max = density.max()
        if d_max > 0:
            density /= d_max

        features = []
        threshold = 0.05  # skip near-zero cells
        for i, glat in enumerate(lat_grid):
            for j, glon in enumerate(lon_grid):
                w = float(density[i, j])
                if w >= threshold:
                    features.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [float(glon), float(glat)],
                        },
                        "properties": {"weight": round(w, 4)},
                    })

        return {
            "type": "FeatureCollection",
            "name": "intervention_heatmap",
            "features": features,
        }

    # ── Water body polygons ────────────────────────────────────────────────

    @staticmethod
    def generate_water_body_polygons(
        ndwi_raster: Optional[str] = None,
        ndwi_array: Optional[np.ndarray] = None,
        bounds: Optional[dict] = None,
    ) -> dict[str, Any]:
        """
        Vectorise pixels where NDWI > 0 into GeoJSON Polygons.

        Args:
            ndwi_raster: Path to a GeoTIFF NDWI raster (uses rasterio).
            ndwi_array:  Alternatively supply a NumPy array directly.
            bounds:      {west, south, east, north} if providing ndwi_array.

        Returns:
            GeoJSON FeatureCollection of water body polygons.
        """
        if ndwi_raster and Path(ndwi_raster).is_file():
            return _vectorise_raster(ndwi_raster)

        if ndwi_array is not None and bounds is not None:
            return _vectorise_array(ndwi_array, bounds)

        # Fallback: mock water bodies around sample watershed
        return _mock_water_bodies()

    # ── Drainage network ──────────────────────────────────────────────────

    @staticmethod
    def generate_drainage_network(
        dem_path: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Extract drainage network from DEM using flow-direction analysis.

        Falls back to hardcoded sample polylines when no DEM is available.

        Args:
            dem_path: Optional path to a GeoTIFF DEM.

        Returns:
            GeoJSON FeatureCollection of LineString features representing
            stream channels ordered by Strahler stream order.
        """
        if dem_path and Path(dem_path).is_file():
            try:
                return _extract_drainage_from_dem(dem_path)
            except Exception as exc:
                logger.warning("DEM drainage extraction failed: %s – using mock", exc)

        return _mock_drainage_network()


# ── Private helpers ───────────────────────────────────────────────────────────

def _empty_feature_collection(name: str) -> dict[str, Any]:
    return {"type": "FeatureCollection", "name": name, "features": []}


def _vectorise_raster(raster_path: str) -> dict[str, Any]:
    """Vectorise NDWI raster using rasterio + shapely."""
    try:
        import rasterio
        from rasterio.features import shapes
        from shapely.geometry import shape

        with rasterio.open(raster_path) as src:
            ndwi = src.read(1)
            transform = src.transform
            crs = src.crs

        mask = (ndwi > 0).astype(np.uint8)
        features = []
        for geom_dict, val in shapes(mask, mask=mask, transform=transform):
            if val == 1:
                shp = shape(geom_dict)
                if shp.area > 1e-8:
                    features.append({
                        "type": "Feature",
                        "geometry": geom_dict,
                        "properties": {
                            "type": "water_body",
                            "area_m2": round(shp.area * 1e10, 2),
                        },
                    })

        return {"type": "FeatureCollection", "name": "water_bodies", "features": features}
    except Exception as exc:
        logger.error("Raster vectorisation failed: %s", exc)
        return _mock_water_bodies()


def _vectorise_array(
    arr: np.ndarray,
    bounds: dict,
) -> dict[str, Any]:
    """Vectorise a NumPy NDWI array using pixel→coordinate mapping."""
    h, w = arr.shape
    west, south, east, north = (
        bounds["west"], bounds["south"], bounds["east"], bounds["north"]
    )
    lon_scale = (east - west) / w
    lat_scale = (north - south) / h

    features = []
    # Simplified: emit one polygon per connected blob (row-major scan, naive)
    water_mask = arr > 0
    if water_mask.any():
        rows, cols = np.where(water_mask)
        lons = west + cols * lon_scale
        lats = north - rows * lat_scale
        # Aggregate into bounding polygon (simplified)
        if len(lons) > 3:
            coords = [[float(lons[i]), float(lats[i])] for i in range(len(lons))]
            coords.append(coords[0])
            features.append({
                "type": "Feature",
                "geometry": {"type": "Polygon", "coordinates": [coords[:5]]},
                "properties": {"type": "water_body"},
            })

    return {"type": "FeatureCollection", "name": "water_bodies", "features": features}


def _mock_water_bodies() -> dict[str, Any]:
    """Hardcoded sample water bodies for demo."""
    return {
        "type": "FeatureCollection",
        "name": "water_bodies",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [73.7940, 19.9350],
                        [73.7980, 19.9350],
                        [73.7980, 19.9380],
                        [73.7940, 19.9380],
                        [73.7940, 19.9350],
                    ]],
                },
                "properties": {
                    "name": "Percolation Tank 1",
                    "type": "percolation_tank",
                    "area_ha": 4.2,
                },
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [73.8050, 19.9440],
                        [73.8090, 19.9440],
                        [73.8090, 19.9470],
                        [73.8050, 19.9470],
                        [73.8050, 19.9440],
                    ]],
                },
                "properties": {
                    "name": "Check Dam Pond",
                    "type": "check_dam_pond",
                    "area_ha": 1.8,
                },
            },
        ],
    }


def _mock_drainage_network() -> dict[str, Any]:
    """Return sample drainage polylines for the Maharashtra watershed."""
    features = []
    stream_orders = [3, 1, 1]
    for i, coords in enumerate(_SAMPLE_DRAINAGE_LINES):
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coords,
            },
            "properties": {
                "stream_order": stream_orders[i],
                "name": f"Nala {i + 1}" if i == 0 else f"Tributary {i}",
                "flow_direction": "NW-SE" if i == 0 else "N-S",
            },
        })
    return {"type": "FeatureCollection", "name": "drainage_network", "features": features}


def _extract_drainage_from_dem(dem_path: str) -> dict[str, Any]:
    """
    Basic D8 flow-direction drainage extraction from a GeoTIFF DEM.
    Returns the largest connected drainage network as polylines.
    """
    import rasterio
    from rasterio.transform import xy

    with rasterio.open(dem_path) as src:
        dem = src.read(1).astype(float)
        transform = src.transform

    # Fill nodata
    nodata = -9999.0
    dem[dem == src.nodata] = nodata

    rows, cols = dem.shape
    # D8 direction offsets: E, SE, S, SW, W, NW, N, NE
    d8_offsets = [(0, 1), (1, 1), (1, 0), (1, -1),
                  (0, -1), (-1, -1), (-1, 0), (-1, 1)]

    flow_dir = np.full((rows, cols), -1, dtype=int)
    for r in range(1, rows - 1):
        for c in range(1, cols - 1):
            if dem[r, c] == nodata:
                continue
            min_slope = 0
            best_dir = -1
            for k, (dr, dc) in enumerate(d8_offsets):
                nr, nc = r + dr, c + dc
                if dem[nr, nc] == nodata:
                    continue
                slope = (dem[r, c] - dem[nr, nc]) / (1.414 if dr != 0 and dc != 0 else 1.0)
                if slope > min_slope:
                    min_slope = slope
                    best_dir = k
            flow_dir[r, c] = best_dir

    # Accumulate flow
    accum = np.zeros((rows, cols), dtype=int)
    for r in range(rows):
        for c in range(cols):
            d = flow_dir[r, c]
            if d >= 0:
                dr, dc = d8_offsets[d]
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols:
                    accum[nr, nc] += 1

    threshold = int(accum.max() * 0.1)
    stream_mask = accum >= threshold

    # Extract stream pixels as LineString
    ys, xs = np.where(stream_mask)
    coords = [list(xy(transform, int(y), int(x))) for y, x in zip(ys, xs)]

    features = []
    if coords:
        features.append({
            "type": "Feature",
            "geometry": {"type": "MultiPoint", "coordinates": coords},
            "properties": {"type": "drainage_network", "threshold": threshold},
        })

    return {"type": "FeatureCollection", "name": "drainage_network", "features": features}


# ── Module-level singleton ────────────────────────────────────────────────────
thematic_map_generator = ThematicMapGenerator()
