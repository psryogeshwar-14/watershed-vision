# 🌊 WatershedVision — Geospatial Watershed Monitoring & Intelligence Platform

> **Smart India Hackathon (SIH) — Problem Statement ID: 26015**  
> **Ministry:** Ministry of Rural Development (MoRD)  
> **Department:** Department of Land Resources (DoLR)  
> **Theme:** Agriculture, FoodTech & Rural Development  
> **Platform Alignment:** Dedicated analytical companion to ISRO/NRSC's **SRISHTI-DRISHTI** platform.

---

### 🔗 Quick Links & Hackathon Deliverables

- 🌐 **Live Web Application (Vercel)**: [https://watershed-vision.vercel.app](https://watershed-vision.vercel.app/)
- 💻 **GitHub Repository**: [https://github.com/psryogeshwar-14/watershed-vision](https://github.com/psryogeshwar-14/watershed-vision)
- 🛰️ **SRISHTI-DRISHTI Geospatial Sync Center**: `/drishti-sync` (Live on Web App)
- 📋 **Statutory MoRD Audit Dossier**: `/reports` (Print-to-PDF ready)

---

## 📑 Problem Statement & Background Analysis

### 🎯 Official SIH Problem Statement Details
- **Problem Statement ID**: `26015`
- **Problem Statement Title**: *Application of Geospatial Techniques for visualization and analysis to interpret Geo-Coded Images to enhance watershed Development Outcomes.*
- **Nodal Ministry**: Ministry of Rural Development (MoRD)
- **Department**: Department of Land Resources (DoLR)
- **Category**: Software
- **Theme**: Agriculture, FoodTech & Rural Development
- **Official Dataset & Reference Link**: [Google Drive PS Folder (DoLR / WDC-PMKSY)](https://drive.google.com/drive/folders/1ibmzWpl_nK7aBhQurs22R9kqh9fPAQwC)

---

### 🔍 Background & Diagnosis of the Core Problem
Watershed development plays a vital role in sustainable management of land, water, and natural resources across rural and semi-arid India under programs like **WDC-PMKSY** (*Watershed Development Component of Pradhan Mantri Krishi Sinchayee Yojana*).

Despite significant investments, monitoring and interpretation remain major challenges:
1. **Unanalyzed Field Photos**: Field photographs collected via the **DRISHTI** mobile application and deposited into the **SRISHTI** portal are currently treated as **static dead storage** (mere proof-of-work) rather than being analytically interpreted.
2. **Disconnected Spatial Silos**: Ground-level geo-coded images, 30m satellite data (from SRISHTI / Landsat / Sentinel-2 / ISRO Bhuvan), and watershed cadastral boundaries exist in completely isolated silos.
3. **Absence of Standardized Visualization Frameworks**: Administrators lack automated thematic maps, temporal change detection, and AI-driven structure health evaluations.
4. **GPS Spoofing & Verification Gaps**: Lack of automated verification tools to check if field photos match real terrain elevations or if coordinates have been tampered with.

---

### 📊 Scope of the Study Matrix (Resolving PS Mandate)
*(The original problem statement noted `Scope of the Study: Table to be Added here`. Below is the complete, structured Scope Matrix addressing every facet of the MoRD/DoLR mandate.)*

| Study Component | Target Geospatial Technique | Input Datasets & Sources | Analytical & AI Processing | Expected Output / Deliverable | WDC-PMKSY Administrative Impact |
|---|---|---|---|---|---|
| **1. Ground Truth Ingestion & Anti-Spoofing** | Spatial geofencing & 3D radar DEM validation | DRISHTI mobile survey EXIF, SRTM 30m DEM, WGS84 GPS | EXIF parser, Haversine spatial buffer, altitude discrepancy filtering | Verified ground photos with tamper-evident audit badge | Prevents fraudulent contractor billing & GPS spoofing |
| **2. Computer Vision & Structural Health** | Deep multimodal vision & heuristic inference | Geo-coded field photos (check dams, ponds, bunds) | Google Gemini Vision API / CNN classification, siltation estimation | Structural soundness score (0–100%), siltation grade, desilting notice | Shifts maintenance from reactive to proactive before monsoon |
| **3. SRISHTI 30m Grid Harmonization** | Satellite raster grid aggregation (30m GSD) | SRISHTI / Bhoonidhi 30m rasters, Sentinel-2 (B2-B8) | Spatial intersection, STAC-compliant band mapping | Geo-coded photos mapped onto exact 30m satellite raster cells | Direct operational integration with ISRO/NRSC SRISHTI platform |
| **4. Thematic Mapping Hub** | Multispectral index generation & vectorization | Sentinel-2 L2A surface reflectance, SRTM DEM | Normalized Difference algorithms (NDVI, NDWI), Strahler stream ordering | 6 real-time thematic maps (LULC, NDVI, Water Bodies, Drainage, Heatmap) | High-level situational awareness for District Watershed Cells |
| **5. Temporal Change Detection** | Multi-temporal raster difference analysis | Pre-intervention baseline vs post-monsoon composites | ImageCollection temporal diffing, NDVI gain curves, water spread | Split-screen interactive before/after swipe map & impact stats | Quantifiable evidence of ecological recovery (+NDVI, +water ha) |
| **6. Decision Support & Prioritization (DSS)** | Multi-criteria spatial decision analysis (MCDA) | NDVI deficits, terrain slope %, DRISHTI erosion points | Weighted overlay modeling (NDVI 35%, Slope 30%, Erosion 25%, Drainage 10%) | Ranked micro-catchment action matrix with prescribed engineering structures & budget | Direct scientific guidance for annual action plans (AAP) |

---

## 🏆 Key SIH Evaluation Criteria Alignment

| SIH 26015 PS Requirement | WatershedVision Solution | Technical Implementation |
|---|---|---|
| **a) Integrated Geospatial Visualization Framework** | Full-stack interactive map combining vector layers, raster overlays, and field survey markers. | React 18, Leaflet, PostGIS, TileLayer with Esri Satellite, OSM, and CartoDB Dark basemaps. |
| **b) Improved Geo-Coded Image Interpretation** | Automated AI classification of field images into 7 watershed categories with confidence scoring and recommendations. | Google Gemini 1.5 Flash Vision API with deterministic heuristic fallback. |
| **c) Generation of Thematic Maps & Products** | Real-time generation of NDVI (vegetation), NDWI (water bodies), LULC (land use), drainage lines, and KDE intervention heatmaps. | GDAL/Rasterio, Google Earth Engine, PostGIS spatial clustering, and Recharts. |
| **d) Enhanced Watershed Monitoring & Assessment** | Multi-temporal before/after change detection tracking vegetation recovery and water storage changes. | Earth Engine ImageCollection diffing, NDVI trend timeseries, and composite Watershed Health Index (0–100). |
| **e) Scientific Support for Decision-Making** | Automated Intervention Prioritization Matrix & instant generation of evidence-based PDF analytical dossiers. | FastAPI `/analysis/prioritization` and `/analysis/report-data` endpoints with Reports builder. |
| **f) Scalable and Cost-Effective Approach** | Fully containerized with Docker, zero licensing fees, free open satellite data, and offline mock capability. | Docker Compose, FastAPI (Python 3.11), PostGIS 15, and Vite SPA. |
| **g) Strengthening Use of SRISHTI-DRISHTI** | **SRISHTI-DRISHTI Geospatial Integration Center (`/drishti-sync`)**: Ingests WDC-PMKSY work codes, verifies EXIF altitude vs SRTM 30m DEM, maps photos to SRISHTI 30m raster grid cells, and tracks Pre vs Post work progression. | [drishti.py](file:///Users/psryogeshwar/Documents/Documents/Project/SIH/backend/app/api/drishti.py), [DrishtiSync.jsx](file:///Users/psryogeshwar/Documents/Documents/Project/SIH/frontend/src/pages/DrishtiSync.jsx), and Bhoonidhi/Copernicus STAC-compliant schemas. |

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

## 🎨 UI/UX Design & High-Impact Features

The frontend is built using a dark, high-contrast command center aesthetic tailored for GIS professionals and government auditors:
- **Palette**: Deep Charcoal (`#030712`, `#111827`) with Emerald Green (`#10b981`) and Water Blue (`#0ea5e9`) accents.
- **🇮🇳 Dual-Language Localization (English & Hindi `हिंदी`)**:
  - Full toggle in top navigation translating navigation, metrics, sidebar controls, filter chips, modal inspectors, and audit tables.
  - Zero-drop layout stability with localized terminology aligned with Indian rural administration standards.
- **Interactive Leaflet Map**:
  - Multi-basemap switcher (OpenStreetMap, Esri High-Res Satellite, CartoDB Dark).
  - PostGIS boundary polygons with live tooltip highlighting.
  - Geo-image markers dynamically colored by activity type (Afforestation, Water Body, Check Dam, Contour Bund, etc.).
  - Interactive layer toggle (NDVI raster, NDWI water bodies, drainage polylines, image markers).
- **🛰️ SRISHTI-DRISHTI Integration & Ingestion Center (`/drishti-sync`)**:
  - Direct integration bridge fusing field-collected DRISHTI mobile survey photographs with SRISHTI 30m satellite rasters.
  - Ingests WDC-PMKSY work codes, asset IDs, Gram Panchayat metadata, and surveyor device details.
  - Work Stage Progression tracker (Pre-Work baseline vs During-Work execution vs Post-Work completed impact).
  - SRISHTI 30m Ground Sampling Distance (GSD) pixel grid overlay matching ISRO Bhuvan standards.
- **🎯 Scientific Decision Support System (DSS) Prioritization Matrix**:
  - Automatically synthesizes satellite NDVI vegetative deficits, SRTM 30m slope gradients, drainage stream orders, and DRISHTI field erosion photos.
  - Generates ranked micro-catchment intervention dossiers with primary structures (masonry check dams), bio-engineering barriers (vetiver / CCT), and budget outlays.
- **🔀 Before/After Temporal Swipe Map**:
  - Split-pane interactive comparison slider on `/watershed/:id` allowing side-by-side inspection of pre-intervention baseline vs post-monsoon satellite imagery.
- **Executive Analytics Dashboard**:
  - Real-time stat cards with percentage delta indicators.
  - Composite **Watershed Health Index** gauge (0–100) combining NDVI, water extent, and survey density.
  - Recharts temporal NDVI curves with shaded min/max confidence bands and outline-contained margins.
  - Activity breakdown progress bars with color-coded taxonomy.
- **Field Image Gallery & Anti-Spoofing Inspector**:
  - Instant client-side search across AI labels, coordinates, and survey notes.
  - Multi-parameter filter panel (Watershed, Activity Type, Date range).
  - High-tech inspection modal with camera device, altitude (m ASL), GPS coordinates, AI confidence score, and structural recommendations.
  - **Spatial Anti-Spoofing Verification**: Cross-checks EXIF timestamp consistency, GPS cluster bounds, and elevation against SRTM DEM.
- **Thematic Maps Hub**:
  - 6 analysis cards (LULC, NDVI, Water Body, Drainage, Soil Moisture, Heatmap).
  - Modal with live interactive map inspection.
  - Instant export options (PNG & GeoTIFF).
- **🏛️ Statutory MoRD Audit Dossier & Isolated Print-to-PDF**:
  - Official Government of India audit report layout at `/reports`.
  - Clean `@media print` CSS isolating strictly the audit dossier and stripping away headers, sidebars, buttons, and navigation chrome.
  - Resilient date rendering engine guarded by React ErrorBoundary.

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
