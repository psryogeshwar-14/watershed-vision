import { Camera, MapPin, Activity, Droplets, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import NDVIChart from './NDVIChart.jsx'
import WatershedHealthGauge from './WatershedHealthGauge.jsx'
import { useWatershedStats, useWatershedHealth, useGeoImages } from '../../hooks/useWatershedData.js'
import { useSatelliteNDVI } from '../../hooks/useSatelliteData.js'

const ACTIVITY_COLORS = {
  afforestation: '#16a34a',
  water_body:    '#0ea5e9',
  check_dam:     '#92400e',
  contour_bund:  '#d97706',
  grass_land:    '#65a30d',
  farm_pond:     '#7c3aed',
  other:         '#6b7280',
}

function StatCard({ icon: Icon, label, value, change, unit = '', iconBg = 'bg-emerald-950/80', iconColor = 'text-emerald-400' }) {
  const isPositive = change >= 0
  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-4 shadow-sm hover:border-gray-700 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className={clsx('p-2 rounded-lg border border-gray-800', iconBg)}>
          <Icon className={clsx('w-4 h-4', iconColor)} />
        </div>
        {change !== undefined && (
          <span className={clsx('flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full', isPositive ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' : 'bg-rose-950 text-rose-400 border border-rose-900/50')}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{change}
          </span>
        )}
      </div>
      <div>
        <p className="text-xl font-bold text-white tracking-tight">
          {value}<span className="text-xs font-normal text-gray-400 ml-1">{unit}</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function ActivityBreakdownChart({ images }) {
  const counts = {}
  images.forEach((img) => {
    const key = img.activity_type || 'other'
    counts[key] = (counts[key] ?? 0) + 1
  })
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])

  return (
    <div className="bg-gray-900/90 rounded-xl p-5 border border-gray-800 shadow-sm">
      <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        Activity Breakdown
      </h3>
      <div className="space-y-3">
        {entries.map(([key, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          return (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-300">{label}</span>
                <span className="text-gray-400">{count} ({pct}%)</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: ACTIVITY_COLORS[key] ?? '#6b7280' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RecentImages({ images }) {
  return (
    <div className="bg-gray-900/90 rounded-xl p-5 border border-gray-800 shadow-sm">
      <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
        Recent Field Photos
      </h3>
      <div className="space-y-3">
        {images.slice(0, 5).map((img) => (
          <div key={img.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/60 transition-colors border border-transparent hover:border-gray-800">
            <img
              src={img.thumbnail ?? img.image}
              alt={img.ai_label}
              className="w-11 h-11 rounded-lg object-cover shrink-0 border border-gray-700/50"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-200 truncate">{img.ai_label}</p>
              <p className="text-[11px] text-gray-400 truncate">
                {img.watershed_name} · {img.captured_at ? format(new Date(img.captured_at), 'dd MMM yy') : '—'}
              </p>
            </div>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shrink-0 border border-white/10"
              style={{ background: ACTIVITY_COLORS[img.activity_type] ?? '#6b7280' }}
            >
              {Math.round((img.confidence ?? 0) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsDashboard({ watershedId, compact = false }) {
  const { data: stats }  = useWatershedStats(watershedId)
  const { data: health } = useWatershedHealth(watershedId)
  const { data: imgData } = useGeoImages({ watershedId })
  const { data: ndviSeries } = useSatelliteNDVI(watershedId)

  const images = imgData?.results ?? []

  return (
    <div className="space-y-4">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Camera}
          label="Total Images"
          value={(stats?.total_images ?? 847).toLocaleString()}
          change={12}
          iconBg="bg-purple-950/70"
          iconColor="text-purple-400"
        />
        <StatCard
          icon={MapPin}
          label="Area Covered"
          value={(stats?.area_covered_ha ?? 48200).toLocaleString()}
          unit="ha"
          iconBg="bg-amber-950/70"
          iconColor="text-amber-400"
        />
        <StatCard
          icon={Activity}
          label="NDVI Health"
          value={stats?.ndvi_current?.toFixed(2) ?? '0.61'}
          change={stats?.ndvi_change ?? +0.04}
          iconBg="bg-emerald-950/70"
          iconColor="text-emerald-400"
        />
        <StatCard
          icon={Droplets}
          label="Water Bodies"
          value={stats?.water_bodies_count ?? 23}
          change={3}
          iconBg="bg-blue-950/70"
          iconColor="text-blue-400"
        />
      </div>

      {/* ── NDVI Chart ── */}
      {!compact && (
        <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            NDVI Vegetation Trend
          </h3>
          <NDVIChart series={ndviSeries} height={180} />
        </div>
      )}

      {/* ── Activity Breakdown & Health Gauge ── */}
      <ActivityBreakdownChart images={images} />
      
      <div className="bg-gray-900/90 rounded-xl p-5 border border-gray-800 flex flex-col items-center justify-center">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 self-start flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400"></span>
          Watershed Health Index
        </h3>
        <WatershedHealthGauge score={health?.score ?? 72} />
        <div className="mt-4 grid grid-cols-3 gap-2 w-full text-center text-xs">
          {[
            { label: 'Vegetation', score: health?.ndvi_score ?? 68 },
            { label: 'Water',      score: health?.water_score ?? 78 },
            { label: 'Interventions', score: health?.intervention_score ?? 70 },
          ].map(({ label, score }) => (
            <div key={label} className="bg-gray-800/80 border border-gray-700/50 rounded-lg py-2">
              <p className="font-bold text-white text-sm">{score}</p>
              <p className="text-gray-400 text-[10px] uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <RecentImages images={images} />
    </div>
  )
}
