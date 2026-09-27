import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  LayersControl,
  GeoJSON,
  ScaleControl,
  ZoomControl,
  Polyline,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import GeoImageLayer from './GeoImageLayer.jsx'
import ThematicLayer from './ThematicLayer.jsx'
import { useLanguage } from '../../services/i18n.js'
import { Compass, Navigation } from 'lucide-react'

// Canonical Watershed GeoJSON Boundaries for Demo
export const WATERSHED_BOUNDARIES = {
  bhor: {
    id: 'bhor',
    name: 'Bhor Micro-Watershed, Pune (Maharashtra)',
    center: [18.152, 73.846],
    area_ha: 2450.5,
    geojson: {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { name: 'Bhor Watershed', code: '2A1B7b', state: 'Maharashtra', area_ha: 2450.5 },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [73.80, 18.10],
            [73.90, 18.10],
            [73.90, 18.20],
            [73.80, 18.20],
            [73.80, 18.10],
          ]],
        },
      }],
    },
    drainageLines: [
      [[18.185, 73.815], [18.165, 73.840], [18.140, 73.865], [18.115, 73.880]],
      [[18.190, 73.870], [18.165, 73.855], [18.140, 73.865]],
      [[18.125, 73.820], [18.145, 73.845], [18.140, 73.865]],
    ],
  },
  alwar: {
    id: 'alwar',
    name: 'Alwar Rainfed Catchment (Rajasthan)',
    center: [27.563, 76.629],
    area_ha: 3820.0,
    geojson: {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { name: 'Alwar Watershed', code: '1C3A4f', state: 'Rajasthan', area_ha: 3820.0 },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [76.58, 27.52],
            [76.68, 27.52],
            [76.68, 27.62],
            [76.58, 27.62],
            [76.58, 27.52],
          ]],
        },
      }],
    },
    drainageLines: [
      [[27.605, 76.595], [27.575, 76.625], [27.535, 76.660]],
      [[27.610, 76.665], [27.575, 76.635], [27.535, 76.660]],
    ],
  },
  tumkur: {
    id: 'tumkur',
    name: 'Tumkur Semi-Arid Basin (Karnataka)',
    center: [13.340, 77.101],
    area_ha: 1890.3,
    geojson: {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { name: 'Tumkur Watershed', code: '4D2E1a', state: 'Karnataka', area_ha: 1890.3 },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [77.05, 13.29],
            [77.15, 13.29],
            [77.15, 13.39],
            [77.05, 13.39],
            [77.05, 13.29],
          ]],
        },
      }],
    },
    drainageLines: [
      [[13.375, 77.065], [13.345, 77.095], [13.305, 77.135]],
      [[13.380, 77.130], [13.345, 77.105], [13.305, 77.135]],
    ],
  },
}

const WATERSHED_STYLE = {
  color: '#10b981',
  weight: 2.5,
  opacity: 0.95,
  fillColor: '#10b981',
  fillOpacity: 0.08,
  dashArray: '6 4',
}

// Fix Leaflet marker URLs for Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Camera controller helper
function MapCameraController({ selectedKey }) {
  const map = useMap()
  useEffect(() => {
    const ws = WATERSHED_BOUNDARIES[selectedKey] || WATERSHED_BOUNDARIES.bhor
    if (ws && ws.geojson) {
      try {
        const layer = L.geoJSON(ws.geojson)
        map.flyToBounds(layer.getBounds(), { padding: [50, 50], duration: 1.2 })
      } catch (e) {
        // fallback
      }
    }
  }, [map, selectedKey])
  return null
}

export default function WatershedMap({
  watershedId = 'bhor',
  activeLayers = { ndvi: false, ndwi: false, images: true, waterBodies: false, drainage: false },
  activeThematic = null,
  onImageClick,
  height = '100%',
  className = '',
}) {
  const [selectedWsKey, setSelectedWsKey] = useState(
    watershedId?.toLowerCase().includes('alwar')
      ? 'alwar'
      : watershedId?.toLowerCase().includes('tumkur')
      ? 'tumkur'
      : 'bhor'
  )
  const { t } = useLanguage()

  const currentWs = WATERSHED_BOUNDARIES[selectedWsKey] || WATERSHED_BOUNDARIES.bhor

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={currentWs.center}
        zoom={12}
        style={{ height, width: '100%' }}
        className={className}
        zoomControl={false}
        scrollWheelZoom
      >
        <MapCameraController selectedKey={selectedWsKey} />

        {/* ── Base Layers ── */}
        <LayersControl position="topright">
          <LayersControl.BaseLayer name={t('layerOsm')}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer checked name={t('layerSatellite')}>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar'
              maxZoom={18}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name={t('layerDark')}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* ── Watershed Boundary Polygon ── */}
        <GeoJSON
          key={`poly-${selectedWsKey}`}
          data={currentWs.geojson}
          style={WATERSHED_STYLE}
          onEachFeature={(feature, layer) => {
            layer.bindTooltip(
              `<strong>${feature.properties.name}</strong><br/>Area: ${feature.properties.area_ha} ha<br/>WDC Code: ${feature.properties.code}`,
              { sticky: true, className: 'map-tooltip' }
            )
          }}
        />

        {/* ── Vector Drainage Network (Stream Orders) ── */}
        {(activeLayers.drainage || activeThematic === 'drainage') &&
          currentWs.drainageLines.map((lineCoords, idx) => (
            <Polyline
              key={`drain-${idx}`}
              positions={lineCoords}
              pathOptions={{
                color: '#38bdf8',
                weight: idx === 0 ? 3.5 : 2,
                opacity: 0.9,
                dashArray: idx === 0 ? undefined : '4 3',
              }}
            />
          ))}

        {/* ── Thematic Raster Overlay ── */}
        {activeThematic && (
          <ThematicLayer type={activeThematic} watershedId={selectedWsKey} />
        )}

        {/* ── Geo-coded Survey Photograph Pins ── */}
        {activeLayers.images && (
          <GeoImageLayer watershedId={selectedWsKey} onImageClick={onImageClick} />
        )}

        {/* Controls */}
        <ZoomControl position="bottomleft" />
        <ScaleControl position="bottomleft" metric imperial={false} />
      </MapContainer>

      {/* ── Floating Watershed Quick-Fly Navigator ── */}
      <div className="absolute top-3 left-3 z-[800] bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-xl p-2 shadow-2xl flex items-center gap-2">
        <Navigation className="w-4 h-4 text-emerald-400 ml-1 shrink-0" />
        <select
          value={selectedWsKey}
          onChange={(e) => setSelectedWsKey(e.target.value)}
          className="bg-gray-800 text-white text-xs rounded-lg px-2.5 py-1.5 border border-gray-700 focus:outline-none focus:border-emerald-500 font-medium"
        >
          <option value="bhor">{t('wsBhor')}</option>
          <option value="alwar">{t('wsAlwar')}</option>
          <option value="tumkur">{t('wsTumkur')}</option>
        </select>
        <span className="text-[10px] text-gray-400 bg-gray-950 px-2 py-1 rounded border border-gray-800 font-mono hidden sm:inline">
          {currentWs.area_ha} ha
        </span>
      </div>
    </div>
  )
}
