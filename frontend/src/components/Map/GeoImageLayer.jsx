import { useState } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { format } from 'date-fns'
import { useGeoImages } from '../../hooks/useWatershedData.js'
import ImageDetailModal from '../ImageGallery/ImageDetailModal.jsx'

// ── Activity type configuration ────────────────────────────────
const ACTIVITY_CONFIG = {
  afforestation: { color: '#16a34a', label: 'Afforestation',  badgeClass: 'badge-green' },
  water_body:    { color: '#0ea5e9', label: 'Water Body',      badgeClass: 'badge-blue' },
  check_dam:     { color: '#92400e', label: 'Check Dam',       badgeClass: 'badge-brown' },
  contour_bund:  { color: '#d97706', label: 'Contour Bund',    badgeClass: 'badge-amber' },
  grass_land:    { color: '#65a30d', label: 'Grassland',       badgeClass: 'badge-teal' },
  farm_pond:     { color: '#7c3aed', label: 'Farm Pond',       badgeClass: 'badge-purple' },
  other:         { color: '#6b7280', label: 'Other',           badgeClass: 'badge-gray' },
}

function makeCircleIcon(color) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:28px; height:28px; border-radius:50%;
        background:${color}; border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        display:flex; align-items:center; justify-content:center;
      ">
        <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'>
          <path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'/><circle cx='12' cy='10' r='3'/>
        </svg>
      </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

function ConfidenceBar({ value }) {
  const pct = Math.round((value ?? 0) * 100)
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#ef4444'
  return (
    <div className="mt-1">
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-500">AI Confidence</span>
        <span className="font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function GeoImageLayer({ watershedId, onImageClick }) {
  const [selected, setSelected] = useState(null)
  const { data } = useGeoImages({ watershedId })
  const images = data?.results ?? []

  const handleClick = (img) => {
    setSelected(img)
    onImageClick?.(img)
  }

  return (
    <>
      {images.map((img) => {
        if (!img.latitude || !img.longitude) return null
        const cfg = ACTIVITY_CONFIG[img.activity_type] ?? ACTIVITY_CONFIG.other
        const icon = makeCircleIcon(cfg.color)

        return (
          <Marker
            key={img.id}
            position={[img.latitude, img.longitude]}
            icon={icon}
          >
            <Popup maxWidth={288} className="!p-0">
              <div className="w-72">
                {/* Thumbnail */}
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={img.thumbnail ?? img.image}
                    alt={img.ai_label}
                    className="w-full h-full object-cover"
                  />
                  <span className={`badge ${cfg.badgeClass} absolute top-2 left-2`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3">
                  <p className="font-semibold text-gray-800 text-sm">{img.ai_label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{img.description}</p>

                  <ConfidenceBar value={img.confidence} />

                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>📍 {img.latitude?.toFixed(4)}, {img.longitude?.toFixed(4)}</span>
                    <span>{img.captured_at ? format(new Date(img.captured_at), 'dd MMM yyyy') : '—'}</span>
                  </div>

                  <button
                    onClick={() => handleClick(img)}
                    className="btn-primary w-full mt-3 justify-center text-xs py-1.5"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* Detail Modal */}
      {selected && (
        <ImageDetailModal image={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
