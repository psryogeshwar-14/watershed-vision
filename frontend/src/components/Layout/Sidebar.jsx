import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Map,
  Layers,
  Calendar,
  BarChart2,
  Droplets,
  Eye,
  EyeOff,
} from 'lucide-react'
import clsx from 'clsx'
import { useWatersheds, useWatershedStats } from '../../hooks/useWatershedData.js'

const LAYER_OPTIONS = [
  { key: 'ndvi',       label: 'NDVI Layer',       color: 'bg-green-500',  icon: Layers },
  { key: 'ndwi',       label: 'NDWI Layer',        color: 'bg-blue-500',   icon: Layers },
  { key: 'images',     label: 'Field Images',      color: 'bg-amber-500',  icon: Map },
  { key: 'waterBodies',label: 'Water Bodies',      color: 'bg-cyan-500',   icon: Droplets },
]

export default function Sidebar({ activeLayers, onLayerToggle, selectedWatershed, onWatershedChange }) {
  const [collapsed, setCollapsed] = useState(false)
  const [startDate, setStartDate] = useState('2024-01-01')
  const [endDate, setEndDate]     = useState(new Date().toISOString().slice(0, 10))

  const { data: watersheds = [] } = useWatersheds()
  const { data: stats } = useWatershedStats(selectedWatershed)

  return (
    <aside
      className={clsx(
        'sidebar h-full relative z-10 flex-shrink-0 transition-all duration-300',
        collapsed ? 'w-14' : 'w-72'
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3.5 top-6 z-20 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-primary-50 hover:border-primary-300 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
        )}
      </button>

      <div className={clsx('flex flex-col h-full overflow-hidden', collapsed && 'items-center')}>
        {/* ── Watershed Selector ── */}
        <div className={clsx('p-4 border-b border-gray-100', collapsed && 'px-2')}>
          {!collapsed && (
            <>
              <label className="form-label flex items-center gap-1.5">
                <Map className="w-3.5 h-3.5 text-primary-600" />
                Watershed
              </label>
              <select
                value={selectedWatershed ?? ''}
                onChange={(e) => onWatershedChange?.(e.target.value || null)}
                className="form-select mt-1"
              >
                <option value="">All Watersheds</option>
                {watersheds.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} — {w.state}
                  </option>
                ))}
              </select>
            </>
          )}
          {collapsed && (
            <Map className="w-5 h-5 text-primary-600 mt-1" title="Watershed" />
          )}
        </div>

        {/* ── Date Range ── */}
        <div className={clsx('p-4 border-b border-gray-100', collapsed && 'px-2 flex flex-col items-center gap-2')}>
          {!collapsed ? (
            <>
              <label className="form-label flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-600" />
                Date Range
              </label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input mt-1"
              />
              <span className="text-xs text-gray-400 text-center mt-1">to</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input mt-1"
              />
            </>
          ) : (
            <Calendar className="w-5 h-5 text-primary-600" title="Date Range" />
          )}
        </div>

        {/* ── Layer Toggles ── */}
        <div className={clsx('p-4 border-b border-gray-100 flex-1', collapsed && 'px-2')}>
          {!collapsed && (
            <p className="form-label flex items-center gap-1.5 mb-3">
              <Layers className="w-3.5 h-3.5 text-primary-600" />
              Map Layers
            </p>
          )}
          <div className="flex flex-col gap-2">
            {LAYER_OPTIONS.map(({ key, label, color, icon: Icon }) => {
              const isOn = activeLayers?.[key] ?? true
              return (
                <button
                  key={key}
                  onClick={() => onLayerToggle?.(key)}
                  className={clsx(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all',
                    isOn
                      ? 'bg-primary-50 text-primary-800 border border-primary-200'
                      : 'bg-gray-50 text-gray-400 border border-gray-200'
                  )}
                  title={label}
                >
                  <span className={clsx('w-2.5 h-2.5 rounded-full shrink-0', isOn ? color : 'bg-gray-300')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{label}</span>
                      {isOn ? (
                        <Eye className="w-3.5 h-3.5 opacity-60" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Quick Stats ── */}
        {!collapsed && stats && (
          <div className="p-4 bg-gradient-to-b from-primary-50 to-white">
            <p className="form-label flex items-center gap-1.5 mb-3">
              <BarChart2 className="w-3.5 h-3.5 text-primary-600" />
              Quick Stats
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Images',    value: stats.total_images?.toLocaleString()    ?? '—' },
                { label: 'Area (ha)', value: stats.area_covered_ha?.toLocaleString() ?? '—' },
                { label: 'NDVI',      value: stats.ndvi_current?.toFixed(2)          ?? '—' },
                { label: 'Water Bodies', value: stats.water_bodies_count ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-lg p-2 border border-gray-100 text-center">
                  <p className="text-lg font-bold text-primary-700">{value}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
