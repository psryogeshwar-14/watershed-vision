import { useState } from 'react'
import {
  Satellite,
  Layers,
  Droplets,
  Images,
  BarChart2,
  Calendar,
  Ruler,
  ChevronDown,
} from 'lucide-react'
import clsx from 'clsx'

const LAYER_BUTTONS = [
  { key: 'imagery', icon: Satellite, label: 'Satellite',   color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
  { key: 'ndvi',    icon: BarChart2, label: 'NDVI',        color: 'text-green-700',   bg: 'bg-green-50 border-green-200' },
  { key: 'ndwi',    icon: Droplets,  label: 'NDWI',        color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  { key: 'images',  icon: Images,    label: 'Field Images', color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200' },
  { key: 'water',   icon: Droplets,  label: 'Water Bodies', color: 'text-cyan-700',    bg: 'bg-cyan-50 border-cyan-200' },
]

export default function MapControls({
  activeLayers = {},
  onLayerToggle,
  onDateChange,
  onMeasureToggle,
}) {
  const [measuring, setMeasuring] = useState(false)
  const [showDate, setShowDate] = useState(false)
  const [startDate, setStartDate] = useState('2024-01-01')
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))

  const handleMeasure = () => {
    setMeasuring((v) => !v)
    onMeasureToggle?.(!measuring)
  }

  const handleApplyDate = () => {
    onDateChange?.({ startDate, endDate })
    setShowDate(false)
  }

  return (
    <div className="absolute top-4 right-14 z-[900] flex flex-col gap-2">
      {/* Layer toggles */}
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-200 p-2 flex flex-col gap-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-0.5">Layers</p>
        {LAYER_BUTTONS.map(({ key, icon: Icon, label, color, bg }) => {
          const isOn = activeLayers[key] ?? false
          return (
            <button
              key={key}
              onClick={() => onLayerToggle?.(key)}
              title={label}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                isOn ? `${bg} ${color}` : 'text-gray-500 border-transparent hover:bg-gray-50'
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </button>
          )
        })}
      </div>

      {/* Date range */}
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-200">
        <button
          onClick={() => setShowDate((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 w-full"
        >
          <Calendar className="w-3.5 h-3.5 text-primary-600" />
          Date Filter
          <ChevronDown className={clsx('w-3.5 h-3.5 ml-auto transition-transform', showDate && 'rotate-180')} />
        </button>
        {showDate && (
          <div className="px-3 pb-3 flex flex-col gap-2 border-t border-gray-100 pt-2 animate-fade-in">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input text-xs"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input text-xs"
            />
            <button onClick={handleApplyDate} className="btn-primary text-xs py-1.5 justify-center">
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Measure tool */}
      <button
        onClick={handleMeasure}
        title="Measure Distance"
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border text-xs font-medium transition-all bg-white/95 backdrop-blur',
          measuring
            ? 'bg-primary-600 text-white border-primary-600 shadow-primary-200'
            : 'text-gray-700 border-gray-200 hover:bg-gray-50'
        )}
      >
        <Ruler className="w-3.5 h-3.5" />
        {measuring ? 'Measuring…' : 'Measure'}
      </button>
    </div>
  )
}
