import { useState } from 'react'
import { Map, Layers, Droplets, GitBranch, Thermometer, Activity, X, Download, Eye } from 'lucide-react'
import WatershedMap from '../components/Map/WatershedMap.jsx'
import toast from 'react-hot-toast'

const THEMATIC_MAPS = [
  {
    id: 'lulc',
    layerType: 'lulc',
    title: 'Land Use / Land Cover (LULC)',
    description: 'Classification of land into agriculture, forest, water bodies, built-up, and barren categories based on Sentinel-2 imagery.',
    icon: Layers,
    color: 'from-green-900 to-emerald-800',
    badge: 'Sentinel-2',
    badgeColor: 'bg-emerald-700',
    stats: '6 classes · 30m resolution',
    gradient: 'linear-gradient(135deg, #064e3b, #065f46, #047857)',
  },
  {
    id: 'ndvi',
    layerType: 'ndvi',
    title: 'Vegetation Index Map (NDVI)',
    description: 'Normalized Difference Vegetation Index showing vegetation health across the watershed. Higher values indicate denser, healthier vegetation.',
    icon: Activity,
    color: 'from-lime-900 to-green-800',
    badge: 'Sentinel-2 B8/B4',
    badgeColor: 'bg-lime-700',
    stats: 'Range: -1 to +1 · Monthly composite',
    gradient: 'linear-gradient(135deg, #365314, #4d7c0f, #84cc16)',
  },
  {
    id: 'water',
    layerType: 'ndwi',
    title: 'Water Body Extent Map',
    description: 'Mapping of surface water bodies including ponds, check dams, percolation tanks, and rivers using NDWI spectral index.',
    icon: Droplets,
    color: 'from-blue-900 to-cyan-800',
    badge: 'NDWI · Sentinel-2',
    badgeColor: 'bg-blue-700',
    stats: 'Water area estimate in ha',
    gradient: 'linear-gradient(135deg, #0c4a6e, #0369a1, #0ea5e9)',
  },
  {
    id: 'drainage',
    layerType: 'drainage',
    title: 'Drainage Network Map',
    description: 'Automated delineation of stream networks and drainage basins derived from SRTM Digital Elevation Model analysis.',
    icon: GitBranch,
    color: 'from-sky-900 to-indigo-800',
    badge: 'SRTM DEM · 30m',
    badgeColor: 'bg-sky-700',
    stats: 'Stream order 1–5 mapped',
    gradient: 'linear-gradient(135deg, #1e3a5f, #1e40af, #3b82f6)',
  },
  {
    id: 'soil-moisture',
    layerType: 'ndwi',
    title: 'Soil Moisture Index',
    description: 'Estimated surface soil moisture using Modified Normalized Difference Water Index (MNDWI) from Sentinel-2 bands.',
    icon: Thermometer,
    color: 'from-amber-900 to-yellow-800',
    badge: 'MNDWI · Sentinel-2',
    badgeColor: 'bg-amber-700',
    stats: 'Seasonal moisture tracking',
    gradient: 'linear-gradient(135deg, #78350f, #b45309, #d97706)',
  },
  {
    id: 'intervention-heatmap',
    layerType: 'heatmap',
    title: 'Intervention Heatmap',
    description: 'Kernel density estimation of geo-tagged field images showing spatial distribution and intensity of watershed interventions.',
    icon: Map,
    color: 'from-red-900 to-orange-800',
    badge: 'Geo-Images · KDE',
    badgeColor: 'bg-red-700',
    stats: 'Based on uploaded field images',
    gradient: 'linear-gradient(135deg, #7f1d1d, #b91c1c, #ef4444)',
  },
]

export default function ThematicMaps() {
  const [activeModalMap, setActiveModalMap] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('Jun–Sep 2024')
  const [selectedWatershed, setSelectedWatershed] = useState('Bhor Watershed — Maharashtra')

  const handleDownload = (format, mapTitle) => {
    toast.success(`Preparing ${format} download for ${mapTitle}...`)
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Thematic Maps</h1>
        <p className="text-gray-400 text-sm max-w-2xl">
          Geospatial analysis products derived from Sentinel-2 satellite imagery and field data.
          These maps support evidence-based watershed planning and monitoring aligned with SRISHTI-DRISHTI platform objectives.
        </p>
      </div>

      {/* Date period selector */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Analysis Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-gray-900 text-white border border-gray-800 rounded-lg px-3 py-1.5 text-sm focus:border-emerald-500 outline-none"
          >
            <option>Jun–Sep 2024 (Kharif / Monsoon)</option>
            <option>Oct–Jan 2024 (Rabi / Post-Monsoon)</option>
            <option>Feb–May 2024 (Summer / Pre-Monsoon)</option>
            <option>Full Year 2024</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Target Watershed:</label>
          <select
            value={selectedWatershed}
            onChange={(e) => setSelectedWatershed(e.target.value)}
            className="bg-gray-900 text-white border border-gray-800 rounded-lg px-3 py-1.5 text-sm focus:border-emerald-500 outline-none"
          >
            <option>Bhor Watershed — Maharashtra</option>
            <option>Alwar Watershed — Rajasthan</option>
            <option>Tumkur Watershed — Karnataka</option>
          </select>
        </div>
      </div>

      {/* Map cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {THEMATIC_MAPS.map((map) => {
          const Icon = map.icon
          return (
            <div
              key={map.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all group flex flex-col justify-between"
            >
              {/* Map preview (gradient placeholder) */}
              <div>
                <div
                  className="h-44 relative overflow-hidden"
                  style={{ background: map.gradient }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-25 group-hover:scale-110 transition-transform duration-500">
                    <Icon className="w-24 h-24 text-white" />
                  </div>
                  {/* Mock grid lines to simulate map */}
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }} />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className={`${map.badgeColor} text-white text-[11px] px-2.5 py-0.5 rounded-full font-medium shadow-sm`}>
                      {map.badge}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm mb-1">{map.title}</h3>
                      <p className="text-gray-400 text-xs leading-relaxed mb-3">{map.description}</p>
                      <p className="text-gray-500 text-[11px] font-mono">{map.stats}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 pt-0">
                <div className="flex gap-2 border-t border-gray-800/80 pt-3">
                  <button
                    onClick={() => setActiveModalMap(map)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 rounded-lg transition-colors font-medium shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Map
                  </button>
                  <button
                    onClick={() => handleDownload('PNG', map.title)}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors border border-gray-700"
                  >
                    ↓ PNG
                  </button>
                  <button
                    onClick={() => handleDownload('GeoTIFF', map.title)}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors border border-gray-700"
                  >
                    ↓ GeoTIFF
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info banner */}
      <div className="mt-8 bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 text-sm text-emerald-300 flex items-start gap-3">
        <span className="text-lg">📡</span>
        <div>
          <strong className="text-white">Earth Observation Pipeline:</strong> Sentinel-2 MSI multispectral imagery (ESA Copernicus) processed via Google Earth Engine and the SRISHTI-DRISHTI platform specifications. Real-time raster composites compute NDVI vegetation indices, NDWI water body extents, and digital elevation model drainage topologies with automatic cloud masking.
        </div>
      </div>

      {/* Interactive Map Modal */}
      {activeModalMap && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl w-full max-w-5xl border border-gray-800 shadow-2xl flex flex-col h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center">
                  <activeModalMap.icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">{activeModalMap.title}</h3>
                  <p className="text-xs text-gray-400">{selectedWatershed} · {selectedPeriod}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalMap(null)}
                className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Map */}
            <div className="flex-1 relative">
              <WatershedMap
                activeThematic={activeModalMap.layerType}
                activeLayers={{
                  ndvi: activeModalMap.layerType === 'ndvi',
                  ndwi: activeModalMap.layerType === 'ndwi',
                  images: true,
                  waterBodies: activeModalMap.layerType === 'water',
                }}
                height="100%"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
