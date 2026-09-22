import { useEffect, useRef } from 'react'
import {
  MapContainer,
  TileLayer,
  LayersControl,
  GeoJSON,
  ScaleControl,
  ZoomControl,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import GeoImageLayer from './GeoImageLayer.jsx'
import ThematicLayer from './ThematicLayer.jsx'

// Maharashtra sample watershed boundary (simplified polygon)
const MAHARASHTRA_WATERSHED_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Godavari Upper Watershed', area_ha: 48200 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [73.6, 19.5],
          [74.2, 19.5],
          [74.5, 19.8],
          [74.4, 20.3],
          [73.9, 20.5],
          [73.4, 20.2],
          [73.3, 19.9],
          [73.6, 19.5],
        ]],
      },
    },
  ],
}

const WATERSHED_STYLE = {
  color: '#16a34a',
  weight: 2.5,
  opacity: 0.9,
  fillColor: '#22c55e',
  fillOpacity: 0.08,
  dashArray: '6 4',
}

// Fix Leaflet default marker icon paths broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Fit bounds helper
function FitBounds({ geojson }) {
  const map = useMap()
  useEffect(() => {
    if (geojson) {
      try {
        const layer = L.geoJSON(geojson)
        map.fitBounds(layer.getBounds(), { padding: [40, 40] })
      } catch (e) {
        // fallback: keep default center
      }
    }
  }, [map, geojson])
  return null
}

export default function WatershedMap({
  watershedId,
  activeLayers = { ndvi: false, ndwi: false, images: true, waterBodies: false },
  activeThematic = null,
  onImageClick,
  height = '100%',
  className = '',
}) {
  return (
    <MapContainer
      center={[20.5, 78.9]}
      zoom={5}
      style={{ height, width: '100%' }}
      className={className}
      zoomControl={false}
      scrollWheelZoom
    >
      {/* ── Base Layers ── */}
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Esri Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="CartoDB Dark">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {/* ── Scale & Zoom Controls ── */}
      <ScaleControl position="bottomleft" imperial={false} />
      <ZoomControl position="bottomright" />

      {/* ── Fit Bounds on Mount ── */}
      <FitBounds geojson={MAHARASHTRA_WATERSHED_GEOJSON} />

      {/* ── Watershed Boundary ── */}
      <GeoJSON
        data={MAHARASHTRA_WATERSHED_GEOJSON}
        style={WATERSHED_STYLE}
        onEachFeature={(feature, layer) => {
          layer.bindTooltip(feature.properties.name, {
            permanent: false,
            className: 'text-xs font-semibold',
          })
        }}
      />

      {/* ── Thematic Overlay (NDVI / NDWI / LULC) ── */}
      {activeThematic && (
        <ThematicLayer watershedId={watershedId} type={activeThematic} />
      )}

      {/* ── Field Image Markers ── */}
      {activeLayers.images && (
        <GeoImageLayer watershedId={watershedId} onImageClick={onImageClick} />
      )}
    </MapContainer>
  )
}
