#!/usr/bin/env python3
"""
WatershedVision — Sample Data Seeder
======================================
Seeds the database with realistic sample watershed data for demo purposes.

Usage:
    python scripts/seed_sample_data.py

Creates:
  - 3 sample watersheds in Maharashtra, Rajasthan, and Karnataka
  - 20+ sample geo-tagged images with realistic GPS coordinates
  - Watershed boundaries as GeoJSON polygons
"""

import asyncio
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
import random

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

# Sample watersheds (real approximate coordinates in India)
SAMPLE_WATERSHEDS = [
    {
        "name": "Bhor Watershed - Maharashtra",
        "state": "Maharashtra",
        "district": "Pune",
        "area_ha": 2450.5,
        "status": "active",
        "center": (18.152, 73.846),
        # Approximate polygon around Bhor, Pune district
        "boundary": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.80, 18.10],
                    [73.90, 18.10],
                    [73.90, 18.20],
                    [73.80, 18.20],
                    [73.80, 18.10],
                ]
            ],
        },
    },
    {
        "name": "Alwar Watershed - Rajasthan",
        "state": "Rajasthan",
        "district": "Alwar",
        "area_ha": 3820.0,
        "status": "active",
        "center": (27.563, 76.629),
        "boundary": {
            "type": "Polygon",
            "coordinates": [
                [
                    [76.58, 27.52],
                    [76.68, 27.52],
                    [76.68, 27.62],
                    [76.58, 27.62],
                    [76.58, 27.52],
                ]
            ],
        },
    },
    {
        "name": "Tumkur Watershed - Karnataka",
        "state": "Karnataka",
        "district": "Tumkur",
        "area_ha": 1890.3,
        "status": "completed",
        "center": (13.340, 77.101),
        "boundary": {
            "type": "Polygon",
            "coordinates": [
                [
                    [77.05, 13.29],
                    [77.15, 13.29],
                    [77.15, 13.39],
                    [77.05, 13.39],
                    [77.05, 13.29],
                ]
            ],
        },
    },
]

# Sample geo-tagged images metadata
ACTIVITY_TYPES = [
    "check_dam", "contour_bund", "afforestation",
    "water_body", "soil_erosion", "drainage", "other"
]

AI_LABELS = {
    "check_dam": "Check Dam / Gabion Structure",
    "contour_bund": "Contour Bund / Trench",
    "afforestation": "Afforestation / Plantation",
    "water_body": "Water Body / Farm Pond",
    "soil_erosion": "Soil Erosion / Degraded Land",
    "drainage": "Drainage Channel",
    "other": "Other Activity",
}

AI_DESCRIPTIONS = {
    "check_dam": "A concrete/masonry check dam is visible across a small nala, designed to slow water flow and promote groundwater recharge. The structure appears to be in good condition with slight sedimentation upstream.",
    "contour_bund": "Contour bunds are visible along the hillside, constructed perpendicular to the slope to retain rainwater and reduce runoff. These earthen embankments help prevent soil erosion.",
    "afforestation": "A plantation site showing young saplings of native species at approximately 3m x 3m spacing. The plantation appears healthy with good canopy coverage developing.",
    "water_body": "A farm pond or percolation tank is visible, constructed to capture and store monsoon runoff. The water body appears to have good water retention capacity.",
    "soil_erosion": "Active gully erosion is visible with exposed subsoil and rill formations. This site requires immediate bio-engineering and structural interventions.",
    "drainage": "A lined drainage channel is visible directing surface runoff away from agricultural fields. The channel appears to be well-maintained.",
    "other": "A general watershed development activity is visible at this location requiring detailed field assessment for proper classification.",
}


def generate_sample_images(watershed_center: tuple, watershed_id: str, count: int = 8):
    """Generate sample image metadata for a watershed."""
    lat_center, lon_center = watershed_center
    images = []
    
    for i in range(count):
        activity = random.choice(ACTIVITY_TYPES)
        lat = lat_center + random.uniform(-0.04, 0.04)
        lon = lon_center + random.uniform(-0.04, 0.04)
        days_ago = random.randint(1, 180)
        captured_at = datetime.now() - timedelta(days=days_ago)
        
        images.append({
            "watershed_id": watershed_id,
            "filename": f"sample_{watershed_id[:8]}_{i:03d}.jpg",
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "altitude": round(random.uniform(200, 800), 1),
            "activity_type": activity,
            "ai_label": AI_LABELS[activity],
            "ai_confidence": round(random.uniform(0.72, 0.98), 3),
            "ai_description": AI_DESCRIPTIONS[activity],
            "captured_at": captured_at.isoformat(),
            "is_processed": True,
        })
    
    return images


async def seed_database():
    """Main seeding function."""
    print("🌊 WatershedVision — Seeding sample data...")
    
    # Output as JSON for inspection/import
    seed_data = {
        "watersheds": SAMPLE_WATERSHEDS,
        "images": [],
    }
    
    for i, ws in enumerate(SAMPLE_WATERSHEDS):
        ws_id = f"ws-{i+1:03d}"
        images = generate_sample_images(ws["center"], ws_id, count=10)
        seed_data["images"].extend(images)
        print(f"  ✓ {ws['name']}: {len(images)} sample images")
    
    # Write to JSON file for import
    output_path = Path(__file__).parent / "sample_data.json"
    with open(output_path, "w") as f:
        json.dump(seed_data, f, indent=2, default=str)
    
    print(f"\n✅ Sample data written to: {output_path}")
    print(f"   Watersheds: {len(seed_data['watersheds'])}")
    print(f"   Images:     {len(seed_data['images'])}")
    print("\nTo load into database, run the API seed endpoint:")
    print("   curl -X POST http://localhost:8000/admin/seed")


if __name__ == "__main__":
    asyncio.run(seed_database())
