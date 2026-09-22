# 🌊 WatershedVision — Geospatial Watershed Monitoring & Intelligence Platform

> **Smart India Hackathon (SIH) — Problem Statement ID: 26015**  
> **Ministry:** Ministry of Rural Development (MoRD)  
> **Department:** Department of Land Resources (DoLR)  
> **Theme:** Agriculture, FoodTech & Rural Development  
> **Platform Alignment:** Dedicated analytical companion to ISRO/NRSC's **SRISHTI-DRISHTI** platform.

---

## 📑 Executive Summary

Watershed development is essential for soil moisture conservation, groundwater recharge, and drought mitigation across rural and semi-arid India. Under programs such as **WDC-PMKSY** (Watershed Development Component of Pradhan Mantri Krishi Sinchayee Yojana), thousands of field photographs are collected using the mobile app **DRISHTI** and stored in the **SRISHTI** portal. 

However, existing monitoring approaches suffer from major limitations:
- **Unanalyzed Field Photos**: Geo-tagged images are collected merely for documentation rather than automated spatial analytics.
- **Disconnected Data Silos**: Field photographs, 30m satellite data, and cadastral/watershed boundaries are not integrated into a unified analytical view.
- **Lack of Decision Support**: Administrators lack automated thematic maps, temporal change detection, and AI-driven structure health evaluations.

**WatershedVision** solves this problem by fusing field-level geo-coded photographs with multispectral satellite data (Sentinel-2 / Landsat 30m) and cutting-edge multimodal AI (Google Gemini Vision) to provide a real-time, interactive **Geospatial Command Center** for planners, evaluators, and district officers.

---

## 🏆 Key SIH Evaluation Criteria Alignment

| SIH 26015 PS Requirement | WatershedVision Solution | Technical Implementation |
|---|---|---|
| **a) Integrated Geospatial Visualization Framework** | Full-stack interactive map combining vector layers, raster overlays, and field survey markers. | React 18, Leaflet, PostGIS, TileLayer with Esri Satellite, OSM, and CartoDB Dark basemaps. |
| **b) Improved Geo-Coded Image Interpretation** | Automated AI classification of field images into 7 watershed categories with confidence scoring and recommendations. | Google Gemini 1.5 Flash Vision API with deterministic heuristic fallback. |
| **c) Generation of Thematic Maps & Products** | Real-time generation of NDVI (vegetation), NDWI (water bodies), LULC (land use), drainage lines, and KDE intervention heatmaps. | GDAL/Rasterio, Google Earth Engine, PostGIS spatial clustering, and Recharts. |
| **d) Enhanced Watershed Monitoring & Assessment** | Multi-temporal before/after change detection tracking vegetation recovery and water storage changes. | Earth Engine ImageCollection diffing, NDVI trend timeseries, and composite Watershed Health Index (0–100). |
| **e) Scientific Support for Decision-Making** | Instant generation of evidence-based PDF analytical dossiers with component scores. | FastAPI `/analysis/report-data` endpoint and interactive Reports builder. |
| **f) Scalable and Cost-Effective Approach** | Fully containerized with Docker, zero licensing fees, free open satellite data, and offline mock capability. | Docker Compose, FastAPI (Python 3.11), PostGIS 15, and Vite SPA. |
| **g) Strengthening Use of SRISHTI-DRISHTI** | Directly ingests DRISHTI-style EXIF metadata (GPS, altitude, device, timestamp) and aligns with SRISHTI 30m raster standards. | `piexif` / `Pillow` EXIF parser and Bhoonidhi/Copernicus STAC-compliant schemas. |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WATERSHEDVISION COMMAND CENTER (FRONTEND)                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────────┐ │
│  │ Interactive Map │  │  Thematic Maps   │  │   Field Image Gallery       │ │
│  │ (Leaflet + WMS) │  │ (NDVI/NDWI/LULC) │  │ (EXIF + AI Metadata Modals) │ │
│  └────────┬────────┘  └────────┬─────────┘  └──────────────┬──────────────┘ │
│           │                    │                           │                │
│           └────────────────────┼───────────────────────────┘                │
│                                │ REST APIs (Axios)                          │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────────┐
│                    FASTAPI ASYNCHRONOUS BACKEND                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ API Routers: /images  |  /satellite  |  /thematic  |  /analysis  | ...│  │
│  └───────┬─────────────────────────┬───────────────────────────┬─────────┘  │
│          │                         │                           │            │
│  ┌───────▼─────────────┐   ┌───────▼─────────────┐     ┌───────▼──────────┐ │
│  │   EXIF & Metadata   │   │  Satellite Engine   │     │  AI Classifier   │ │
│  │   Parser (Pillow)   │   │ (Google Earth Eng)  │     │ (Gemini Vision)  │ │
│  └───────┬─────────────┘   └───────┬─────────────┘     └───────┬──────────┘ │
└──────────┼─────────────────────────┼───────────────────────────┼────────────┘
           │                         │                           │
┌──────────▼─────────────┐   ┌───────▼─────────────┐     ┌───────▼──────────┐
│   PostgreSQL 15        │   │ Sentinel-2 / Landsat│     │ Gemini 1.5 Flash │
│   + PostGIS Spat. DB   │   │ Earth Engine Cloud  │     │ Vision API Cloud │
└────────────────────────┘   └─────────────────────┘     └──────────────────┘
```

---

## 🎨 UI/UX Design (Figma-Grade Geospatial Command Center)

The frontend is built using a dark, high-contrast command center aesthetic tailored for GIS professionals:
- **Palette**: Deep Charcoal (`#030712`, `#111827`) with Emerald Green (`#10b981`) and Water Blue (`#0ea5e9`) accents.
- **Interactive Leaflet Map**:
  - Multi-basemap switcher (OpenStreetMap, Esri High-Res Satellite, CartoDB Dark).
  - PostGIS boundary polygons with live tooltip highlighting.
  - Geo-image markers dynamically colored by activity type (Afforestation, Water Body, Check Dam, Contour Bund, etc.).
  - Interactive layer toggle (NDVI raster, NDWI water bodies, drainage polylines, image markers).
- **Executive Analytics Dashboard**:
  - Real-time stat cards with percentage delta indicators.
  - Composite **Watershed Health Index** gauge (0–100) combining NDVI, water extent, and survey density.
  - Recharts temporal NDVI curves with shaded min/max confidence bands.
  - Activity breakdown progress bars with color-coded taxonomy.
- **Field Image Gallery**:
  - Instant client-side search across AI labels, coordinates, and survey notes.
  - Multi-parameter filter panel (Watershed, Activity Type, Date range).
  - High-tech image inspection modal displaying camera device, altitude (m ASL), GPS coordinates, AI confidence bar, and expert recommendations.
- **Thematic Maps Hub**:
  - 6 analysis cards (LULC, NDVI, Water Body, Drainage, Soil Moisture, Heatmap).
  - Modal with live interactive map inspection.
  - Instant export options (PNG & GeoTIFF).

---

## 🗄️ Database & Spatial Models

The database uses **PostgreSQL 15** with the **PostGIS** spatial extension:

### `geo_images` Table
- `id` (UUID, Primary Key)
- `filename`, `original_filename`, `file_path`
- `latitude`, `longitude` (Float, WGS84)
- `geom` (PostGIS `Geometry(Point, 4326)`, spatially indexed via GIST)
- `altitude` (Float, Elevation in meters ASL)
- `captured_at` (Timestamp from EXIF)
- `uploaded_at` (Timestamp)
- `watershed_id` (Foreign Key → `watersheds.id`)
- `activity_type` (Enum: `check_dam`, `contour_bund`, `afforestation`, `water_body`, `soil_erosion`, `drainage`, `other`)
- `ai_label`, `ai_confidence`, `ai_description`, `ai_recommendations`
- `is_processed` (Boolean)

### `watersheds` Table
- `id` (UUID, Primary Key)
- `name` (String, e.g., "Bhor Watershed - Maharashtra")
- `state`, `district`
- `area_ha` (Float, Area in hectares)
- `boundary` (PostGIS `Geometry(Polygon, 4326)`, spatially indexed)
- `status` (Enum: `active`, `completed`, `pending`)

---

## 🛰️ Dual-Mode Satellite & AI Processing

WatershedVision guarantees **100% operational functionality** under all conditions:

### 1. Live Cloud Mode (With Optional Keys)
- **Google Earth Engine (GEE)**: Queries `COPERNICUS/S2_SR_HARMONIZED` to calculate real-time cloud-masked NDVI, NDWI, and ESA WorldCover LULC rasters. Supports Service Account JSON or Project ID / ADC.
- **Google Gemini Vision API**: Passes field photos to `gemini-1.5-flash` with custom system prompts to detect watershed interventions, rate structure integrity, and output actionable repair recommendations in structured JSON.

### 2. Autonomous Mock Mode (Default / Offline)
- **Synthetic Sentinel-2 Rasters**: Generates mathematically realistic NumPy rasters simulating monsoon vegetation surges (June–September) and water catchment dynamics.
- **Deterministic Heuristic Classifier**: Analyzes color-channel distributions and metadata to assign plausible classifications and recommendations without crashing or requiring API access.

---

## 🚀 Quick Start Guide

### Prerequisites
- Docker & Docker Compose **OR**
- Node.js 18+ and Python 3.10+

### Option A: 1-Click Launch with Docker Compose
```bash
# 1. Navigate to project root
cd /path/to/SIH

# 2. Launch all services (PostGIS, FastAPI Backend, React Frontend)
docker-compose up -d

# 3. Access applications:
# Frontend : http://localhost:5173
# Backend  : http://localhost:8000
# API Docs : http://localhost:8000/docs
```

### Option B: Local Development

#### 1. Backend Setup
```bash
cd backend

# Create & activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
# Opens at http://localhost:5173
```

### 3. Verify API Keys & Services
```bash
# Run diagnostics to see Live vs Mock status
python3 scripts/verify_api_keys.py
```

### 4. Seed Sample Watershed Data
```bash
python3 scripts/seed_sample_data.py
```

---

## 🧪 Verification & Health Checks

- **Backend Health Check**:
  ```bash
  curl http://localhost:8000/health
  ```
  Returns:
  ```json
  {
    "status": "healthy",
    "service": "WatershedVision API",
    "version": "1.0.0",
    "features": {
      "gee_configured": false,
      "gemini_configured": false
    }
  }
  ```

- **Frontend Production Build**:
  ```bash
  cd frontend && npm run build
  ```
  Generates optimized production assets in under 3 seconds.

---

## 📂 Project Directory Structure

```
SIH/
├── docker-compose.yml              # Multi-container orchestration (DB, API, Web)
├── README.md                       # Comprehensive master documentation
├── scripts/
│   ├── verify_api_keys.py          # Interactive diagnostic tool for GEE & Gemini
│   ├── seed_sample_data.py         # Realistic Indian watershed data generator
│   ├── process_sentinel.py         # Sentinel-2 processing CLI
│   └── init_db.sql                 # PostGIS spatial database initialization
├── backend/
│   ├── Dockerfile                  # GDAL-enabled FastAPI container
│   ├── requirements.txt            # Python dependencies (GeoAlchemy2, GEE, etc.)
│   ├── .env                        # Active environment configuration
│   ├── .env.example                # Template configuration
│   └── app/
│       ├── main.py                 # FastAPI application entry point & CORS
│       ├── core/
│       │   ├── config.py           # Pydantic settings with GEE/Gemini validation
│       │   └── database.py         # SQLAlchemy engine & PostGIS session manager
│       ├── models/
│       │   ├── geo_image.py        # PostGIS GeoImage ORM model
│       │   └── watershed.py        # PostGIS Watershed boundary ORM model
│       ├── api/
│       │   ├── images.py           # Upload, EXIF extraction, GeoJSON endpoints
│       │   ├── satellite.py        # NDVI, NDWI, LULC, Timeseries endpoints
│       │   ├── thematic.py         # Thematic layers (Vegetation, Water, Drainage)
│       │   ├── analysis.py         # Change detection, Health score, PDF report
│       │   └── auth.py             # User authentication router
│       ├── services/
│       │   ├── exif_parser.py      # Camera EXIF GPS extraction
│       │   ├── satellite_processor.py # Sentinel-2 / GEE processing service
│       │   ├── image_classifier.py # Gemini Vision AI classifier service
│       │   └── thematic_map_gen.py # KDE heatmap & polygon vectorization
│       └── utils/
│           └── geospatial.py       # Color ramps, bounding boxes, raster helpers
└── frontend/
    ├── package.json                # React 18, Leaflet, Recharts, Tailwind
    ├── vite.config.js              # Vite build configuration
    ├── tailwind.config.js          # Custom theme configuration
    └── src/
        ├── App.jsx                 # Router configuration
        ├── RootLayout.jsx          # Top-level shell with Navbar
        ├── main.jsx                # Application root with React Query
        ├── index.css               # Tailwind & Leaflet styles
        ├── pages/
        │   ├── HomePage.jsx        # Split View: Command Map + Live Analytics
        │   ├── WatershedAnalysis.jsx # Focused Watershed Analysis & Timeseries
        │   ├── ThematicMaps.jsx    # Interactive Thematic Map Explorer
        │   ├── ImageGallery.jsx    # Field Survey Photograph Gallery
        │   └── Reports.jsx         # Evidence-based PDF Report Builder
        ├── components/
        │   ├── Layout/             # Navbar and collapsible GIS Sidebar
        │   ├── Map/                # Leaflet map, GeoImage markers, Thematic overlay
        │   ├── Dashboard/          # StatCards, NDVI charts, Health gauge
        │   ├── ImageGallery/       # ImageCard, ConfidenceBar, Inspection Modal
        │   └── Upload/             # Drag-and-drop uploader with EXIF preview
        ├── hooks/                  # React Query hooks for API endpoints
        └── services/               # Axios API client
```

---

## 👥 Team & Submission Information

- **Project Name**: WatershedVision
- **Problem Statement ID**: 26015
- **Category**: Software
- **Theme**: Agriculture, FoodTech & Rural Development
- **Organization**: Ministry of Rural Development, Dept. of Land Resources (DoLR)
- **License**: MIT License (Educational / Hackathon Use)
