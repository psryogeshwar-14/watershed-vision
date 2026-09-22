import { useState, useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { Loader2, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getThematicMaps } from '../../services/api.js'

// ── Color ramp configs ─────────────────────────────────────────
const LEGENDS = {
  ndvi: {
    label: 'NDVI',
    unit: '(-1 → 1)',
    stops: [
      { val: '< 0',   color: '#d73027', label: 'No veg / Water' },
      { val: '0–0.2', color: '#f46d43', label: 'Bare / Sparse' },
      { val: '0.2–0.4', color: '#fee090', label: 'Low veg' },
      { val: '0.4–0.6', color: '#74add1', label: 'Moderate veg' },
      { val: '0.6–0.8', color: '#4575b4', label: 'Dense veg' },
      { val: '> 0.8',  color: '#313695', label: 'Very dense' },
    ],
    gradientClass: 'legend-gradient',
  },
  ndwi: {
    label: 'NDWI',
    unit: '(-1 → 1)',
    stops: [
      { val: '< -0.3', color: '#d73027', label: 'Dry' },
      { val: '-0.3–0', color: '#ffffbf', label: 'Moist' },
      { val: '> 0',    color: '#4575b4', label: 'Water' },
    ],
    gradientClass: 'legend-gradient-ndwi',
  },
  lulc: {
    label: 'LULC',
    unit: '',
    stops: [
      { val: '',  color: '#4575b4', label: 'Water' },
      { val: '',  color: '#1a9641', label: 'Dense Forest' },
      { val: '',  color: '#a6d96a', label: 'Scrubland' },
      { val: '',  color: '#fdae61', label: 'Agriculture' },
      { val: '',  color: '#d7191c', label: 'Built-up' },
      { val: '',  color: '#d6d6d6', label: 'Barren' },
    ],
    gradientClass: '',
  },
}

function LegendPanel({ type, opacity, onOpacityChange }) {
  const cfg = LEGENDS[type]
  if (!cfg) return null
  return (
    <div className="absolute bottom-8 right-2 z-[900] bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-200 p-3 w-44 animate-fade-in">
      <p className="text-xs font-bold text-gray-700 mb-1.5">
        {cfg.label} <span className="font-normal text-gray-400">{cfg.unit}</span>
      </p>

      {cfg.gradientClass ? (
        <div className={`${cfg.gradientClass} mb-2`} />
      ) : null}

      <div className="space-y-1">
        {cfg.stops.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-[10px] text-gray-600 leading-tight">
              {s.val ? `${s.val} · ` : ''}{s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Opacity slider */}
      <div className="mt-2.5">
        <p className="text-[10px] text-gray-500 mb-1">Opacity: {Math.round(opacity * 100)}%</p>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          className="w-full h-1.5 accent-primary-600"
        />
      </div>
    </div>
  )
}

export default function ThematicLayer({ watershedId, type = 'ndvi' }) {
  const [opacity, setOpacity] = useState(0.75)
  const map = useMap()

  const { data, isLoading } = useQuery({
    queryKey: ['thematic-map', watershedId, type],
    queryFn: () => getThematicMaps(watershedId),
    enabled: !!watershedId,
    staleTime: 10 * 60 * 1000,
  })

  useEffect(() => {
    // In production this would add a WMS / ImageOverlay layer to the map
    // For now we use a placeholder tile layer with opacity
    let layer = null
    if (map && type) {
      // Placeholder: in production use data.tile_url or data.geotiff_url
      const tileUrl = {
        ndvi: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', // replace with real NDVI tile URL
        ndwi: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        lulc: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      }[type]

      if (tileUrl && data?.tile_url) {
        layer = L.tileLayer(data.tile_url, { opacity, zIndex: 10 })
        layer.addTo(map)
      }
    }
    return () => {
      if (layer) map.removeLayer(layer)
    }
  }, [map, type, data, opacity])

  return (
    <>
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2 bg-white/90 rounded-xl px-4 py-3 shadow-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
          <span className="text-sm text-gray-700">Loading {LEGENDS[type]?.label} layer…</span>
        </div>
      )}
      <LegendPanel type={type} opacity={opacity} onOpacityChange={setOpacity} />
    </>
  )
}
