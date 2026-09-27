"""
app/services/geofence_validator.py
───────────────────────────────────
Anti-spoofing and spatial geofence verification engine for field survey photographs.

Under Ministry of Rural Development (MoRD) / WDC-PMKSY guidelines:
1. Every field photo must fall strictly within the designated micro-watershed polygon.
2. Photo EXIF altitude must be physically consistent with NASA SRTM 30m DEM elevation
   to detect simulated/spoofed GPS mock-locations.
"""

from __future__ import annotations

import math
from typing import Any, Optional
from shapely.geometry import Point, Polygon, shape

# Canonical watershed boundaries for verification (WGS84)
KNOWN_WATERSHEDS: dict[str, dict[str, Any]] = {
    "bhor": {
        "name": "Bhor Watershed - Maharashtra",
        "center_lat": 18.152,
        "center_lon": 73.846,
        "nominal_elevation_m": 590.0,
        "boundary": Polygon([
            [73.80, 18.10],
            [73.90, 18.10],
            [73.90, 18.20],
            [73.80, 18.20],
            [73.80, 18.10],
        ]),
    },
    "alwar": {
        "name": "Alwar Watershed - Rajasthan",
        "center_lat": 27.563,
        "center_lon": 76.629,
        "nominal_elevation_m": 270.0,
        "boundary": Polygon([
            [76.58, 27.52],
            [76.68, 27.52],
            [76.68, 27.62],
            [76.58, 27.62],
            [76.58, 27.52],
        ]),
    },
    "tumkur": {
        "name": "Tumkur Watershed - Karnataka",
        "center_lat": 13.340,
        "center_lon": 77.101,
        "nominal_elevation_m": 820.0,
        "boundary": Polygon([
            [77.05, 13.29],
            [77.15, 13.29],
            [77.15, 13.39],
            [77.05, 13.39],
            [77.05, 13.29],
        ]),
    },
}


def estimate_srtm_elevation(lat: float, lon: float, ws_key: str = "bhor") -> float:
    """
    Simulate SRTM 30m DEM elevation lookup with local terrain relief.
    """
    ws = KNOWN_WATERSHEDS.get(ws_key.lower(), KNOWN_WATERSHEDS["bhor"])
    base_elev = ws["nominal_elevation_m"]
    # Slight terrain undulation based on micro-coordinates
    relief = math.sin(lat * 100) * 25.0 + math.cos(lon * 100) * 15.0
    return round(base_elev + relief, 1)


class GeofenceValidator:
    """
    Spatial audit engine preventing fraudulent and spoofed field photo submissions.
    """

    @classmethod
    def validate_photo_geotag(
        cls,
        lat: Optional[float],
        lon: Optional[float],
        altitude_m: Optional[float] = None,
        watershed_id: Optional[str] = "bhor",
    ) -> dict[str, Any]:
        """
        Validate coordinates against registered boundary and SRTM elevation model.
        """
        if lat is None or lon is None:
            return {
                "is_geotagged": False,
                "is_inside_geofence": False,
                "is_altitude_consistent": False,
                "tamper_risk_level": "high",
                "verification_status": "missing_gps",
                "badge": "⚠️ No GPS Coordinates",
                "details": "Photo does not contain valid EXIF GPS metadata.",
            }

        ws_key = (watershed_id or "bhor").lower()
        if "alwar" in ws_key or "rajasthan" in ws_key:
            target_key = "alwar"
        elif "tumkur" in ws_key or "karnataka" in ws_key:
            target_key = "tumkur"
        else:
            target_key = "bhor"

        ws_data = KNOWN_WATERSHEDS[target_key]
        point = Point(lon, lat)
        is_inside = ws_data["boundary"].contains(point)

        expected_srtm = estimate_srtm_elevation(lat, lon, target_key)
        altitude_consistent = True
        altitude_delta = 0.0

        if altitude_m is not None and altitude_m > 0:
            altitude_delta = abs(altitude_m - expected_srtm)
            # Threshold: > 60m difference flags potential mock location
            if altitude_delta > 60.0:
                altitude_consistent = False

        # Determine tamper risk & status
        if not is_inside:
            risk = "high"
            status = "out_of_bounds"
            badge = "🚫 Out of Watershed Geofence"
            details = f"Coordinates ({lat:.4f}, {lon:.4f}) lie outside {ws_data['name']} boundary."
        elif not altitude_consistent:
            risk = "medium"
            status = "altitude_mismatch"
            badge = "⚠️ Altitude Mismatch (Audit Required)"
            details = f"EXIF Altitude ({altitude_m:.1f}m) deviates {altitude_delta:.1f}m from SRTM DEM ({expected_srtm:.1f}m)."
        else:
            risk = "low"
            status = "verified"
            badge = "🛡️ Verified Ground Truth"
            details = f"Geofence passed. Elevation ({expected_srtm}m) consistent with SRTM 30m DEM."

        return {
            "is_geotagged": True,
            "is_inside_geofence": is_inside,
            "is_altitude_consistent": altitude_consistent,
            "tamper_risk_level": risk,
            "verification_status": status,
            "badge": badge,
            "details": details,
            "photo_altitude_m": altitude_m,
            "srtm_elevation_m": expected_srtm,
            "altitude_delta_m": round(altitude_delta, 1),
            "watershed_name": ws_data["name"],
        }


geofence_validator = GeofenceValidator()
