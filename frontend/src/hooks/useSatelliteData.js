import { useQuery } from '@tanstack/react-query'
import { getSatelliteNDVI, getWaterBodies, getChangeDetection } from '../services/api.js'
import { subMonths, format } from 'date-fns'

// ─── Mock satellite NDVI data ────────────────────────────────────
function generateMockNDVI(months = 12) {
  const now = new Date()
  return Array.from({ length: months }, (_, i) => {
    const date = subMonths(now, months - 1 - i)
    const base = 0.42 + Math.sin((i / months) * Math.PI) * 0.25
    return {
      date: format(date, 'yyyy-MM-dd'),
      ndvi_mean: parseFloat((base + (Math.random() - 0.5) * 0.08).toFixed(3)),
      ndvi_min:  parseFloat((base - 0.12 - Math.random() * 0.05).toFixed(3)),
      ndvi_max:  parseFloat((base + 0.12 + Math.random() * 0.05).toFixed(3)),
      cloud_cover_pct: Math.round(Math.random() * 30),
    }
  })
}

const MOCK_NDVI_SERIES = generateMockNDVI(18)

const MOCK_WATER_BODIES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Gangapur Reservoir', area_ha: 8.4, type: 'reservoir' },
      geometry: { type: 'Point', coordinates: [73.73, 19.97] },
    },
    {
      type: 'Feature',
      properties: { name: 'Nashik Check Dam 7', area_ha: 1.2, type: 'check_dam' },
      geometry: { type: 'Point', coordinates: [73.85, 20.01] },
    },
    {
      type: 'Feature',
      properties: { name: 'Village Pond — Igatpuri', area_ha: 0.6, type: 'pond' },
      geometry: { type: 'Point', coordinates: [73.56, 19.69] },
    },
  ],
}

const MOCK_CHANGE_DETECTION = {
  ndvi_change: +0.08,
  water_area_change_ha: +4.2,
  vegetation_gain_ha: 312,
  vegetation_loss_ha: 48,
  net_change_ha: 264,
  change_map_url: null,
  before_date: '2023-06-01',
  after_date: '2024-06-01',
}

// ─── Hooks ──────────────────────────────────────────────────────

export function useSatelliteNDVI(watershedId, startDate, endDate) {
  return useQuery({
    queryKey: ['satellite-ndvi', watershedId, startDate, endDate],
    queryFn: () => getSatelliteNDVI(watershedId, startDate, endDate),
    enabled: !!watershedId,
    placeholderData: MOCK_NDVI_SERIES,
    select: (data) => (Array.isArray(data) ? data : MOCK_NDVI_SERIES),
  })
}

export function useWaterBodies(watershedId) {
  return useQuery({
    queryKey: ['water-bodies', watershedId],
    queryFn: () => getWaterBodies(watershedId),
    enabled: !!watershedId,
    placeholderData: MOCK_WATER_BODIES,
    select: (data) => data ?? MOCK_WATER_BODIES,
  })
}

export function useChangeDetection(watershedId, beforeDate, afterDate) {
  return useQuery({
    queryKey: ['change-detection', watershedId, beforeDate, afterDate],
    queryFn: () => getChangeDetection(watershedId, beforeDate, afterDate),
    enabled: !!(watershedId && beforeDate && afterDate),
    placeholderData: MOCK_CHANGE_DETECTION,
    select: (data) => data ?? MOCK_CHANGE_DETECTION,
  })
}
