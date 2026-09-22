"""
app/services/exif_parser.py
────────────────────────────
Extract GPS coordinates, capture datetime, altitude, and device info from
uploaded images.

Supports:
  • JPEG / PNG — via Pillow + piexif
  • HEIC / HEIF — via pillow-heif + piexif

Returns a typed dataclass so callers never have to deal with raw EXIF dicts.
"""

from __future__ import annotations

import io
import struct
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS


# ── Return type ───────────────────────────────────────────────────────────────

@dataclass
class ExifData:
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude: Optional[float] = None          # metres above sea level
    captured_at: Optional[datetime] = None
    make: Optional[str] = None                # camera manufacturer
    model: Optional[str] = None               # camera model
    software: Optional[str] = None
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    extra: dict = field(default_factory=dict)

    @property
    def has_gps(self) -> bool:
        return self.latitude is not None and self.longitude is not None


# ── Internal helpers ──────────────────────────────────────────────────────────

def _to_decimal_degrees(
    values: tuple,
    ref: str,
) -> Optional[float]:
    """Convert DMS IFD rational tuples to a signed decimal-degree float."""
    try:
        def _rational(v) -> float:
            if isinstance(v, tuple) and len(v) == 2:
                return v[0] / v[1] if v[1] != 0 else 0.0
            return float(v)

        degrees = _rational(values[0])
        minutes = _rational(values[1])
        seconds = _rational(values[2])
        dd = degrees + minutes / 60.0 + seconds / 3600.0
        if ref in ("S", "W"):
            dd = -dd
        return dd
    except (IndexError, ZeroDivisionError, TypeError, ValueError):
        return None


def _parse_gps_info(gps_ifd: dict) -> tuple[Optional[float], Optional[float], Optional[float]]:
    """Return (latitude, longitude, altitude) from a raw GPS IFD dict."""
    lat = lon = alt = None

    lat_val = gps_ifd.get(2)
    lat_ref = gps_ifd.get(1, "N")
    if lat_val:
        lat = _to_decimal_degrees(lat_val, lat_ref)

    lon_val = gps_ifd.get(4)
    lon_ref = gps_ifd.get(3, "E")
    if lon_val:
        lon = _to_decimal_degrees(lon_val, lon_ref)

    alt_val = gps_ifd.get(6)
    alt_ref = gps_ifd.get(5, 0)
    if alt_val is not None:
        try:
            if isinstance(alt_val, tuple) and len(alt_val) == 2:
                alt = alt_val[0] / alt_val[1] if alt_val[1] != 0 else 0.0
            else:
                alt = float(alt_val)
            if alt_ref == 1:  # below sea level
                alt = -alt
        except (ZeroDivisionError, TypeError):
            alt = None

    return lat, lon, alt


def _parse_datetime(raw: str) -> Optional[datetime]:
    """Parse EXIF datetime string 'YYYY:MM:DD HH:MM:SS'."""
    try:
        return datetime.strptime(raw.strip(), "%Y:%m:%d %H:%M:%S")
    except (ValueError, AttributeError):
        return None


def _extract_from_pil_exif(image: Image.Image) -> ExifData:
    """Use Pillow's _getexif() to extract data from JPEG/PNG."""
    data = ExifData()
    try:
        raw_exif = image._getexif()  # type: ignore[attr-defined]
        if raw_exif is None:
            return data

        decoded: dict = {TAGS.get(k, k): v for k, v in raw_exif.items()}

        # GPS
        gps_raw = decoded.get("GPSInfo")
        if isinstance(gps_raw, dict):
            lat, lon, alt = _parse_gps_info(gps_raw)
            data.latitude = lat
            data.longitude = lon
            data.altitude = alt

        # Date/time
        for dt_tag in ("DateTimeOriginal", "DateTimeDigitized", "DateTime"):
            if dt_tag in decoded:
                data.captured_at = _parse_datetime(str(decoded[dt_tag]))
                if data.captured_at:
                    break

        # Device info
        data.make = decoded.get("Make")
        data.model = decoded.get("Model")
        data.software = decoded.get("Software")
        data.image_width = decoded.get("ExifImageWidth") or image.width
        data.image_height = decoded.get("ExifImageHeight") or image.height

    except Exception:
        pass
    return data


# ── Public API ────────────────────────────────────────────────────────────────

def parse_exif(image_path: str | Path) -> ExifData:
    """
    Parse EXIF metadata from an image file.

    Args:
        image_path: Absolute or relative path to the image.

    Returns:
        :class:`ExifData` instance (fields may be None if not present).
    """
    path = Path(image_path)
    suffix = path.suffix.lower()

    # Register HEIF/HEIC opener (no-op if already registered)
    try:
        from pillow_heif import register_heif_opener
        register_heif_opener()
    except ImportError:
        pass

    try:
        with Image.open(path) as img:
            img.load()  # force decode so EXIF is available for HEIF too
            exif_data = _extract_from_pil_exif(img)
            exif_data.image_width = exif_data.image_width or img.width
            exif_data.image_height = exif_data.image_height or img.height
            return exif_data
    except Exception as exc:
        # Return empty data rather than raising — caller decides what to do
        return ExifData(extra={"parse_error": str(exc)})


def parse_exif_from_bytes(data: bytes, mime_type: str = "image/jpeg") -> ExifData:
    """
    Parse EXIF metadata from raw image bytes (e.g. from a file upload buffer).

    Args:
        data: Raw image bytes.
        mime_type: MIME type hint (used to handle HEIC).
    """
    try:
        from pillow_heif import register_heif_opener
        register_heif_opener()
    except ImportError:
        pass

    try:
        with Image.open(io.BytesIO(data)) as img:
            img.load()
            exif_data = _extract_from_pil_exif(img)
            exif_data.image_width = exif_data.image_width or img.width
            exif_data.image_height = exif_data.image_height or img.height
            return exif_data
    except Exception as exc:
        return ExifData(extra={"parse_error": str(exc)})
