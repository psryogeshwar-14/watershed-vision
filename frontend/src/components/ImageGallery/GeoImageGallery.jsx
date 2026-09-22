import { useState } from 'react'
import { format } from 'date-fns'
import { SlidersHorizontal, ChevronLeft, ChevronRight, Search, MapPin, Calendar, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { useGeoImages } from '../../hooks/useWatershedData.js'
import { useWatersheds } from '../../hooks/useWatershedData.js'
import ImageDetailModal from './ImageDetailModal.jsx'

const ACTIVITY_TYPES = [
  { value: '',              label: 'All Types' },
  { value: 'afforestation', label: 'Afforestation' },
  { value: 'water_body',    label: 'Water Body' },
  { value: 'check_dam',     label: 'Check Dam' },
  { value: 'contour_bund',  label: 'Contour Bund' },
  { value: 'grass_land',    label: 'Grassland' },
  { value: 'farm_pond',     label: 'Farm Pond' },
  { value: 'other',         label: 'Other' },
]

const BADGE_MAP = {
  afforestation: 'bg-emerald-900/80 text-emerald-300 border-emerald-700/50',
  water_body:    'bg-blue-900/80 text-blue-300 border-blue-700/50',
  check_dam:     'bg-amber-900/80 text-amber-300 border-amber-700/50',
  contour_bund:  'bg-orange-900/80 text-orange-300 border-orange-700/50',
  grass_land:    'bg-lime-900/80 text-lime-300 border-lime-700/50',
  farm_pond:     'bg-purple-900/80 text-purple-300 border-purple-700/50',
  other:         'bg-gray-800 text-gray-300 border-gray-700',
}

function ConfidenceBar({ value }) {
  const pct = Math.round((value ?? 0) * 100)
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-gray-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          AI Confidence
        </span>
        <span className="font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function ImageCard({ image, onClick }) {
  const badgeCls = BADGE_MAP[image.activity_type] ?? 'bg-gray-800 text-gray-300 border-gray-700'
  const label = ACTIVITY_TYPES.find((a) => a.value === image.activity_type)?.label ?? 'Other'
  return (
    <div
      onClick={() => onClick(image)}
      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group flex flex-col"
    >
      <div className="relative h-44 overflow-hidden bg-gray-950">
        <img
          src={image.thumbnail ?? image.image}
          alt={image.ai_label}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-black/30" />
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border backdrop-blur-md absolute top-2.5 left-2.5 shadow-sm ${badgeCls}`}>
          {label}
        </span>
        {image.altitude_m && (
          <span className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-gray-300 text-[10px] px-2 py-0.5 rounded-md border border-white/10 font-mono">
            {Math.round(image.altitude_m)}m ASL
          </span>
        )}
      </div>
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div>
          <p className="font-semibold text-sm text-white leading-tight group-hover:text-emerald-400 transition-colors">
            {image.ai_label}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1 font-mono">
            <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
            {image.latitude?.toFixed(4)}°N, {image.longitude?.toFixed(4)}°E
          </p>
        </div>

        <div className="pt-2 border-t border-gray-800/80 space-y-2">
          <ConfidenceBar value={image.confidence} />
          <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-gray-500" />
            {image.captured_at ? format(new Date(image.captured_at), 'dd MMM yyyy, HH:mm') : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function GeoImageGallery({ defaultWatershedId }) {
  const [activityType, setActivityType] = useState('')
  const [watershedId,  setWatershedId]  = useState(defaultWatershedId ?? '')
  const [startDate,    setStartDate]    = useState('')
  const [endDate,      setEndDate]      = useState('')
  const [page,         setPage]         = useState(1)
  const [selected,     setSelected]     = useState(null)
  const [search,       setSearch]       = useState('')
  const [showFilters,  setShowFilters]  = useState(false)

  const { data: watersheds = [] } = useWatersheds()
  const { data, isLoading } = useGeoImages({
    activityType: activityType || undefined,
    watershedId:  watershedId  || undefined,
    startDate:    startDate    || undefined,
    endDate:      endDate      || undefined,
    page,
  })

  const allImages   = data?.results ?? []
  const totalCount  = data?.count ?? 0
  const pageSize    = 12
  const totalPages  = Math.max(1, Math.ceil(totalCount / pageSize))

  const filtered = search
    ? allImages.filter(
        (img) =>
          img.ai_label?.toLowerCase().includes(search.toLowerCase()) ||
          img.activity_type?.toLowerCase().includes(search.toLowerCase())
      )
    : allImages

  return (
    <div>
      {/* ── Filter Bar ── */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by label or activity…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={clsx(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm border transition-colors',
              showFilters ? 'bg-emerald-950 border-emerald-600 text-emerald-300' : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          <span className="text-xs text-gray-400 ml-auto bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
            {totalCount} Total Geo-Images
          </span>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-900 rounded-xl p-4 border border-gray-800 animate-fade-in">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1.5 font-medium">Watershed</label>
              <select
                value={watershedId}
                onChange={(e) => { setWatershedId(e.target.value); setPage(1) }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Watersheds</option>
                {watersheds.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1.5 font-medium">Activity Type</label>
              <select
                value={activityType}
                onChange={(e) => { setActivityType(e.target.value); setPage(1) }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {ACTIVITY_TYPES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1.5 font-medium">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1.5 font-medium">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Images Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/50 rounded-2xl border border-gray-800">
          <p className="text-gray-400 text-base">No field images found matching your criteria.</p>
          <button
            onClick={() => { setActivityType(''); setWatershedId(''); setSearch(''); setStartDate(''); setEndDate('') }}
            className="mt-3 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((image) => (
            <ImageCard key={image.id} image={image} onClick={setSelected} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-800">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg border border-gray-800 bg-gray-900"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg border border-gray-800 bg-gray-900"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <ImageDetailModal image={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
