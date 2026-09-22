import { useQuery } from '@tanstack/react-query'
import {
  getWatersheds,
  getGeoImages,
  getSatelliteTimeseries,
  getWatershedHealth,
  getStatistics,
} from '../services/api.js'

// ─── Mock fallback data ──────────────────────────────────────────
const MOCK_WATERSHEDS = [
  { id: 1, name: 'Godavari Upper', state: 'Maharashtra', area_ha: 48200, district: 'Nashik' },
  { id: 2, name: 'Krishna Headwaters', state: 'Karnataka', area_ha: 32100, district: 'Bijapur' },
  { id: 3, name: 'Chambal Basin', state: 'Madhya Pradesh', area_ha: 67800, district: 'Morena' },
  { id: 4, name: 'Damodar Valley', state: 'Jharkhand', area_ha: 24500, district: 'Hazaribagh' },
  { id: 5, name: 'Mahanadi Upper', state: 'Odisha', area_ha: 55300, district: 'Sambalpur' },
]

const MOCK_HEALTH = {
  score: 72,
  ndvi_score: 68,
  water_score: 78,
  intervention_score: 70,
  trend: 'improving',
  last_updated: new Date().toISOString(),
}

const MOCK_STATS = {
  total_images: 847,
  area_covered_ha: 48200,
  water_bodies_count: 23,
  interventions_count: 134,
  ndvi_current: 0.61,
  ndvi_change: +0.04,
}

const MOCK_GEO_IMAGES = {
  count: 847,
  next: null,
  previous: null,
  results: Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    thumbnail: `https://picsum.photos/seed/${i + 10}/400/300`,
    image: `https://picsum.photos/seed/${i + 10}/800/600`,
    activity_type: ['afforestation', 'water_body', 'check_dam', 'contour_bund', 'grass_land'][i % 5],
    ai_label: ['Dense Vegetation', 'Water Surface', 'Check Dam Structure', 'Contour Bund', 'Grassland'][i % 5],
    confidence: 0.75 + Math.random() * 0.24,
    latitude: 19.5 + Math.random() * 2,
    longitude: 73.5 + Math.random() * 3,
    altitude_m: 500 + Math.random() * 300,
    captured_at: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'AI-analyzed field image showing vegetation health and land use patterns in the watershed area.',
    device_model: 'Samsung Galaxy S22',
    watershed: 1,
    watershed_name: 'Godavari Upper',
  })),
}

// ─── Hooks ──────────────────────────────────────────────────────

export function useWatersheds() {
  return useQuery({
    queryKey: ['watersheds'],
    queryFn: getWatersheds,
    placeholderData: MOCK_WATERSHEDS,
    select: (data) => (Array.isArray(data) ? data : data?.results ?? MOCK_WATERSHEDS),
  })
}

export function useGeoImages(filters = {}) {
  return useQuery({
    queryKey: ['geo-images', filters],
    queryFn: () => getGeoImages(filters),
    placeholderData: MOCK_GEO_IMAGES,
    select: (data) => data ?? MOCK_GEO_IMAGES,
  })
}

export function useNDVITimeseries(watershedId, dateRange = {}) {
  return useQuery({
    queryKey: ['ndvi-timeseries', watershedId, dateRange],
    queryFn: () => getSatelliteTimeseries(watershedId),
    enabled: !!watershedId,
    placeholderData: {
      labels: [],
      ndvi_mean: [],
      ndvi_min: [],
      ndvi_max: [],
    },
    select: (data) =>
      data ?? {
        labels: [],
        ndvi_mean: [],
        ndvi_min: [],
        ndvi_max: [],
      },
  })
}

export function useWatershedHealth(watershedId) {
  return useQuery({
    queryKey: ['watershed-health', watershedId],
    queryFn: () => getWatershedHealth(watershedId),
    enabled: !!watershedId,
    placeholderData: MOCK_HEALTH,
    select: (data) => data ?? MOCK_HEALTH,
  })
}

export function useWatershedStats(watershedId) {
  return useQuery({
    queryKey: ['watershed-stats', watershedId],
    queryFn: () => getStatistics(watershedId),
    enabled: !!watershedId,
    placeholderData: MOCK_STATS,
    select: (data) => data ?? MOCK_STATS,
  })
}
