# ─────────────────────────────────────────────────────────────────────────────
#  WatershedVision – FastAPI Backend Dockerfile
#
#  Multi-stage build:
#    Stage 1 (builder): Install Python dependencies into a venv
#    Stage 2 (runtime): Copy venv + GDAL system libs → minimal runtime image
#
#  Base image uses osgeo/gdal which ships GDAL, PROJ, and GEOS that are
#  required by rasterio, geopandas, and GeoAlchemy2.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM osgeo/gdal:ubuntu-small-3.8.4 AS builder

# Prevent interactive prompts during apt installs
ENV DEBIAN_FRONTEND=noninteractive

# Install Python build tools and system libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3.11 \
        python3.11-dev \
        python3.11-venv \
        python3-pip \
        build-essential \
        libpq-dev \
        libffi-dev \
        libssl-dev \
        libgeos-dev \
        libproj-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment
RUN python3.11 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip inside the venv
RUN pip install --upgrade pip setuptools wheel

# Copy only requirements first (Docker layer caching)
WORKDIR /build
COPY requirements.txt .

# Install Python dependencies
# GDAL Python bindings must match the system GDAL version
RUN pip install --no-cache-dir \
        GDAL==$(gdal-config --version) \
    && pip install --no-cache-dir -r requirements.txt


# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM osgeo/gdal:ubuntu-small-3.8.4 AS runtime

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH" \
    # rasterio needs these at runtime
    GDAL_DATA=/usr/share/gdal \
    PROJ_LIB=/usr/share/proj

# Runtime system packages only
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3.11 \
        libpq5 \
        libgeos-c1v5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Create non-root user for security
RUN groupadd --gid 1001 appuser \
    && useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser

# Application directory
WORKDIR /app

# Copy application source
COPY --chown=appuser:appuser . .

# Create uploads directory and set ownership
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose FastAPI port
EXPOSE 8000

# Health check (polls the /health endpoint every 30 seconds)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with uvicorn
# Override CMD in docker-compose for development (--reload flag)
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--loop", "uvloop", \
     "--http", "httptools"]
