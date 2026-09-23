import axios from 'axios'

// ─── Axios Instance ──────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api/v1`
    : '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    console.error('[API Error]', err?.response?.data || err.message)
    return Promise.reject(err)
  }
)

// ─── Image Endpoints ─────────────────────────────────────────────

/**
 * Upload a geotagged image with metadata
 * @param {File} file
 * @param {string|number} watershedId
 * @param {string} activityType
 */
export async function uploadGeoImage(file, watershedId, activityType) {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('watershed_id', watershedId)
  formData.append('activity_type', activityType)
  return api.post('/images/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * Get list of geotagged images with optional filters
 * @param {{ watershedId?, activityType?, startDate?, endDate?, page? }} filters
 */
export async function getGeoImages(filters = {}) {
  const params = {}
  if (filters.watershedId)  params.watershed_id  = filters.watershedId
  if (filters.activityType) params.activity_type = filters.activityType
  if (filters.startDate)    params.start_date    = filters.startDate
  if (filters.endDate)      params.end_date      = filters.endDate
  if (filters.page)         params.page          = filters.page
  return api.get('/images/', { params })
}

/**
 * Get all geo-images as GeoJSON FeatureCollection for map overlay
 */
export async function getGeoImagesGeoJSON() {
  return api.get('/images/geojson/')
}

// ─── Satellite / Analysis Endpoints ──────────────────────────────

/**
 * Get NDVI statistics for a watershed in a date range
 */
export async function getSatelliteNDVI(watershedId, startDate, endDate) {
  return api.get('/satellite/ndvi/', {
    params: { watershed_id: watershedId, start_date: startDate, end_date: endDate },
  })
}

/**
 * Get time-series satellite data (NDVI, NDWI trend)
 */
export async function getSatelliteTimeseries(watershedId) {
  return api.get('/satellite/timeseries/', {
    params: { watershed_id: watershedId },
  })
}

/**
 * Get thematic map layers for a watershed
 */
export async function getThematicMaps(watershedId) {
  return api.get('/analysis/thematic-maps/', {
    params: { watershed_id: watershedId },
  })
}

/**
 * Get water body polygons/GeoJSON for a watershed
 */
export async function getWaterBodies(watershedId) {
  return api.get('/analysis/water-bodies/', {
    params: { watershed_id: watershedId },
  })
}

/**
 * Get intervention heatmap data
 */
export async function getInterventionHeatmap(watershedId) {
  return api.get('/analysis/intervention-heatmap/', {
    params: { watershed_id: watershedId },
  })
}

/**
 * Get composite health score for a watershed
 */
export async function getWatershedHealth(watershedId) {
  return api.get('/analysis/health/', {
    params: { watershed_id: watershedId },
  })
}

/**
 * Get aggregate statistics for a watershed
 */
export async function getStatistics(watershedId) {
  return api.get('/analysis/statistics/', {
    params: { watershed_id: watershedId },
  })
}

/**
 * Get change detection between two dates
 */
export async function getChangeDetection(watershedId, beforeDate, afterDate) {
  return api.get('/analysis/change-detection/', {
    params: { watershed_id: watershedId, before_date: beforeDate, after_date: afterDate },
  })
}

// ─── Watershed Endpoints ──────────────────────────────────────────

/**
 * Get list of all watersheds
 */
export async function getWatersheds() {
  return api.get('/watersheds/')
}

export default api
