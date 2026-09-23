# ─────────────────────────────────────────────────────────────────────────────
#  WatershedVision – FastAPI Backend Dockerfile
#
#  Production-grade container with GDAL, GEOS, and PROJ support.
#  Uses official python:3.11-slim for reliable, cross-platform cloud builds.
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install system libraries needed for PostGIS/psycopg2 and geospatial processing
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libgeos-dev \
        libproj-dev \
        gdal-bin \
        libgdal-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start Uvicorn, dynamically respecting $PORT if set by Render/Railway (defaults to 8000)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
