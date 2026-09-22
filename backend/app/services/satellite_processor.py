"""
app/services/satellite_processor.py
─────────────────────────────────────
Satellite imagery processing service.

When GEE credentials are configured the service uses the Google Earth Engine
Python API to fetch and process Sentinel-2 imagery.  When credentials are
absent it generates synthetic rasters using NumPy for demo/development.
"""

from __future__ import annotations

import io
import json
import logging
import os
import uuid
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Optional

import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Sample Maharashtra watershed boundary ─────────────────────────────────────
# Approximate boundary of a micro-watershed near Nashik, Maharashtra
_SAMPLE_BOUNDARY = {
    "type": "Polygon",
    "coordinates": [
        [
            [73.7800, 19.9200],
            [73.8200, 19.9200],
            [73.8200, 19.9600],
            [73.7800, 19.9600],
            [73.7800, 19.9200],
        ]
    ],
}


# ── Service class ─────────────────────────────────────────────────────────────

class SatelliteProcessor:
    """
    Provides NDVI, NDWI, LULC, and timeseries data from Sentinel-2.

    Falls back to synthetic rasters when GEE is not configured.
    """

    RASTER_CACHE_DIR: Path = Path(settings.upload_dir_abs) / "satellite_cache"

    def __init__(self) -> None:
        self._gee_initialised = False
        self.RASTER_CACHE_DIR.mkdir(parents=True, exist_ok=True)

        if settings.gee_configured:
            self._init_gee()

    # ── GEE initialisation ────────────────────────────────────────────────

    def _init_gee(self) -> bool:
        """
        Initialise Earth Engine using the best available authentication strategy:
        1. Service Account (if GEE_SERVICE_ACCOUNT and GEE_KEY_FILE are provided)
        2. Project ID / ADC (if GEE_PROJECT_ID is provided)
        3. Default credentials (if GOOGLE_APPLICATION_CREDENTIALS or gcloud auth exists)
        """
        try:
            import ee

            if settings.GEE_SERVICE_ACCOUNT and settings.GEE_KEY_FILE and os.path.isfile(settings.GEE_KEY_FILE):
                credentials = ee.ServiceAccountCredentials(
                    settings.GEE_SERVICE_ACCOUNT,
                    settings.GEE_KEY_FILE,
                )
                ee.Initialize(credentials)
                logger.info("Google Earth Engine initialised with Service Account: %s", settings.GEE_SERVICE_ACCOUNT)
            elif settings.GEE_PROJECT_ID:
                ee.Initialize(project=settings.GEE_PROJECT_ID.strip())
                logger.info("Google Earth Engine initialised with Project ID: %s", settings.GEE_PROJECT_ID)
            else:
                ee.Initialize()
                logger.info("Google Earth Engine initialised with default credentials")

            self._gee_initialised = True
            return True
        except Exception as exc:
            logger.warning("GEE initialisation failed: %s – using mock data", exc)
            self._gee_initialised = False
            return False

    def _is_gee_ready(self) -> bool:
        """Check if GEE is ready, attempting lazy initialisation if configured."""
        if self._gee_initialised:
            return True
        if settings.gee_configured:
            return self._init_gee()
        return False

    # ── Public API ────────────────────────────────────────────────────────

    async def get_ndvi_image(
        self,
        watershed_geom: Optional[dict],
        start_date: str,
        end_date: str,
    ) -> dict[str, Any]:
        """
        Return NDVI raster as a base64 PNG and local file path.

        Returns dict: {raster_path, base64_png, is_mock, stats}
        """
        if self._is_gee_ready():
            try:
                return await self._gee_get_index(
                    watershed_geom, start_date, end_date, "NDVI"
                )
            except Exception as e:
                logger.error("Live GEE NDVI calculation failed: %s, falling back to mock", e)
        return self._mock_raster("ndvi", start_date, end_date, watershed_geom)

    async def get_ndwi_image(
        self,
        watershed_geom: Optional[dict],
        start_date: str,
        end_date: str,
    ) -> dict[str, Any]:
        """Return NDWI raster."""
        if self._is_gee_ready():
            try:
                return await self._gee_get_index(
                    watershed_geom, start_date, end_date, "NDWI"
                )
            except Exception as e:
                logger.error("Live GEE NDWI calculation failed: %s, falling back to mock", e)
        return self._mock_raster("ndwi", start_date, end_date, watershed_geom)

    async def get_lulc_classification(
        self,
        watershed_geom: Optional[dict],
    ) -> dict[str, Any]:
        """Return Land Use / Land Cover classification data."""
        if self._is_gee_ready():
            try:
                return await self._gee_get_lulc(watershed_geom)
            except Exception as e:
                logger.error("Live GEE LULC calculation failed: %s, falling back to mock", e)
        return self._mock_lulc()

    async def get_timeseries(
        self,
        watershed_geom: Optional[dict],
        start_date: str,
        end_date: str,
    ) -> list[dict[str, Any]]:
        """
        Return monthly NDVI timeseries.

        Each item: {date, mean_ndvi, min_ndvi, max_ndvi}
        """
        if self._is_gee_ready():
            try:
                return await self._gee_timeseries(watershed_geom, start_date, end_date)
            except Exception as e:
                logger.error("Live GEE timeseries failed: %s, falling back to mock", e)
        return self._mock_timeseries(start_date, end_date)

    async def get_sentinel_preview(
        self,
        watershed_geom: Optional[dict],
        start_date: str,
        end_date: str,
    ) -> dict[str, Any]:
        """Return a true-colour RGB composite preview."""
        if self._is_gee_ready():
            try:
                return await self._gee_rgb_preview(watershed_geom, start_date, end_date)
            except Exception as e:
                logger.error("Live GEE preview failed: %s, falling back to mock", e)
        return self._mock_raster("rgb_preview", start_date, end_date, watershed_geom)

    # ── GEE helpers ───────────────────────────────────────────────────────

    async def _gee_get_index(
        self,
        geom: Optional[dict],
        start_date: str,
        end_date: str,
        index: str,
    ) -> dict[str, Any]:
        import ee

        boundary = geom or _SAMPLE_BOUNDARY
        roi = ee.Geometry(boundary)

        s2 = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(roi)
            .filterDate(start_date, end_date)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
            .median()
        )

        if index == "NDVI":
            img = s2.normalizedDifference(["B8", "B4"]).rename("index")
            vis = {"min": -0.2, "max": 0.8, "palette": ["#d73027", "#fee08b", "#1a9850"]}
        else:  # NDWI
            img = s2.normalizedDifference(["B3", "B8"]).rename("index")
            vis = {"min": -0.5, "max": 0.5, "palette": ["#d73027", "#fee08b", "#4575b4"]}

        url = img.visualize(**vis).getThumbURL(
            {"region": roi, "dimensions": 512, "format": "png"}
        )

        stats = img.reduceRegion(
            reducer=ee.Reducer.mean().combine(
                ee.Reducer.minMax(), sharedInputs=True
            ),
            geometry=roi,
            scale=10,
            maxPixels=1e9,
        ).getInfo()

        return {
            "preview_url": url,
            "stats": stats,
            "is_mock": False,
            "index": index,
        }

    async def _gee_get_lulc(self, geom: Optional[dict]) -> dict[str, Any]:
        import ee

        boundary = geom or _SAMPLE_BOUNDARY
        roi = ee.Geometry(boundary)

        lulc = ee.ImageCollection("ESA/WorldCover/v200").first().clip(roi)
        url = lulc.visualize().getThumbURL(
            {"region": roi, "dimensions": 512, "format": "png"}
        )
        return {"preview_url": url, "is_mock": False}

    async def _gee_timeseries(
        self,
        geom: Optional[dict],
        start_date: str,
        end_date: str,
    ) -> list[dict[str, Any]]:
        import ee

        boundary = geom or _SAMPLE_BOUNDARY
        roi = ee.Geometry(boundary)

        def _monthly_ndvi(month_start):
            month_end = ee.Date(month_start).advance(1, "month").format("YYYY-MM-dd")
            img = (
                ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                .filterBounds(roi)
                .filterDate(month_start, month_end)
                .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
                .median()
                .normalizedDifference(["B8", "B4"])
                .rename("NDVI")
            )
            stats = img.reduceRegion(
                reducer=ee.Reducer.mean().combine(
                    ee.Reducer.minMax(), sharedInputs=True
                ),
                geometry=roi,
                scale=10,
                maxPixels=1e9,
            )
            return ee.Feature(None, {
                "date": month_start,
                "mean_ndvi": stats.get("NDVI_mean"),
                "min_ndvi": stats.get("NDVI_min"),
                "max_ndvi": stats.get("NDVI_max"),
            })

        # Build monthly date list
        months = ee.List.sequence(
            0,
            ee.Date(end_date).difference(ee.Date(start_date), "month").subtract(1),
        )
        date_list = months.map(
            lambda n: ee.Date(start_date).advance(n, "month").format("YYYY-MM-dd")
        )

        fc = ee.FeatureCollection(date_list.map(_monthly_ndvi))
        info = fc.getInfo()
        return [
            {
                "date": f["properties"]["date"],
                "mean_ndvi": f["properties"].get("mean_ndvi"),
                "min_ndvi": f["properties"].get("min_ndvi"),
                "max_ndvi": f["properties"].get("max_ndvi"),
            }
            for f in info.get("features", [])
        ]

    async def _gee_rgb_preview(
        self,
        geom: Optional[dict],
        start_date: str,
        end_date: str,
    ) -> dict[str, Any]:
        import ee

        boundary = geom or _SAMPLE_BOUNDARY
        roi = ee.Geometry(boundary)

        s2 = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(roi)
            .filterDate(start_date, end_date)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
            .median()
            .select(["B4", "B3", "B2"])
        )
        url = s2.visualize(min=0, max=3000).getThumbURL(
            {"region": roi, "dimensions": 512, "format": "png"}
        )
        return {"preview_url": url, "is_mock": False}

    # ── Mock helpers ──────────────────────────────────────────────────────

    def _mock_raster(
        self,
        index_name: str,
        start_date: str,
        end_date: str,
        geom: Optional[dict],
    ) -> dict[str, Any]:
        """Generate a synthetic 128×128 raster and encode it as base64 PNG."""
        from PIL import Image as PILImage

        rng = np.random.default_rng(seed=hash(f"{index_name}{start_date}") % (2**31))

        size = 128
        if index_name == "ndvi":
            # Simulate vegetated watershed: higher values in centre
            x, y = np.meshgrid(np.linspace(-1, 1, size), np.linspace(-1, 1, size))
            base = np.exp(-(x**2 + y**2) * 1.5) * 0.7 + 0.1
            noise = rng.normal(0, 0.05, (size, size))
            arr = np.clip(base + noise, -0.2, 1.0)
            # Colour ramp: brown→yellow→green
            r = np.clip(215 - arr * 215, 0, 255).astype(np.uint8)
            g = np.clip(arr * 180 + 40, 0, 255).astype(np.uint8)
            b = np.clip(40 - arr * 40, 0, 80).astype(np.uint8)
        elif index_name == "ndwi":
            x, y = np.meshgrid(np.linspace(-1, 1, size), np.linspace(-1, 1, size))
            base = np.exp(-(x**2 + (y - 0.3)**2) * 3.0) * 0.6 - 0.2
            noise = rng.normal(0, 0.04, (size, size))
            arr = np.clip(base + noise, -0.5, 0.5)
            r = np.clip(215 - arr * 300, 0, 255).astype(np.uint8)
            g = np.clip(arr * 200 + 100, 0, 255).astype(np.uint8)
            b = np.clip(arr * 200 + 100, 100, 255).astype(np.uint8)
        else:  # RGB preview
            arr = rng.integers(40, 200, (size, size, 3), dtype=np.uint8)
            # add a green-ish cast for vegetation
            arr[:, :, 1] = np.clip(arr[:, :, 1] + 30, 0, 255).astype(np.uint8)
            rgb_img = PILImage.fromarray(arr, "RGB")
            buf = io.BytesIO()
            rgb_img.save(buf, format="PNG")
            import base64
            b64 = base64.b64encode(buf.getvalue()).decode()
            return {
                "base64_png": f"data:image/png;base64,{b64}",
                "is_mock": True,
                "index": index_name,
                "stats": {"mean": 0.0, "min": 0.0, "max": 0.0},
            }

        rgb = np.stack([r, g, b], axis=-1)
        pil_img = PILImage.fromarray(rgb, "RGB")
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")

        import base64
        b64 = base64.b64encode(buf.getvalue()).decode()

        return {
            "base64_png": f"data:image/png;base64,{b64}",
            "is_mock": True,
            "index": index_name,
            "stats": {
                "mean": float(np.mean(arr)),
                "min": float(np.min(arr)),
                "max": float(np.max(arr)),
            },
        }

    @staticmethod
    def _mock_timeseries(start_date: str, end_date: str) -> list[dict[str, Any]]:
        """Generate synthetic monthly NDVI timeseries with seasonal variation."""
        try:
            sd = date.fromisoformat(start_date)
            ed = date.fromisoformat(end_date)
        except ValueError:
            sd = date(2023, 1, 1)
            ed = date(2023, 12, 31)

        results = []
        current = sd.replace(day=1)
        month_idx = 0

        while current <= ed:
            # Seasonal sine wave peaking in Aug (month 8 = post-monsoon)
            month = current.month
            base_ndvi = 0.35 + 0.30 * np.sin(np.pi * (month - 2) / 6)
            rng = np.random.default_rng(seed=month_idx + month)
            noise = rng.normal(0, 0.03)
            mean_val = float(np.clip(base_ndvi + noise, 0.05, 0.85))
            results.append({
                "date": current.isoformat(),
                "mean_ndvi": round(mean_val, 4),
                "min_ndvi": round(max(0.0, mean_val - 0.12), 4),
                "max_ndvi": round(min(1.0, mean_val + 0.12), 4),
            })
            # Advance one month
            if current.month == 12:
                current = current.replace(year=current.year + 1, month=1)
            else:
                current = current.replace(month=current.month + 1)
            month_idx += 1

        return results

    @staticmethod
    def _mock_lulc() -> dict[str, Any]:
        return {
            "classes": [
                {"code": 10, "name": "Tree cover", "area_ha": 245.3, "percentage": 32.1},
                {"code": 20, "name": "Shrubland", "area_ha": 120.7, "percentage": 15.8},
                {"code": 30, "name": "Grassland", "area_ha": 98.4, "percentage": 12.9},
                {"code": 40, "name": "Cropland", "area_ha": 210.5, "percentage": 27.6},
                {"code": 60, "name": "Bare/sparse vegetation", "area_ha": 55.2, "percentage": 7.2},
                {"code": 80, "name": "Permanent water bodies", "area_ha": 33.1, "percentage": 4.3},
            ],
            "is_mock": True,
        }


# ── Module-level singleton ────────────────────────────────────────────────────
satellite_processor = SatelliteProcessor()
