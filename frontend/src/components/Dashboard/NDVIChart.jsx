import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { subMonths } from 'date-fns'

// Generate mock series if not provided
function generateMockSeries(months = 18) {
  const now = new Date()
  return Array.from({ length: months }, (_, i) => {
    const date = subMonths(now, months - 1 - i)
    const base = 0.35 + Math.sin((i / months) * Math.PI) * 0.28
    const mean = parseFloat((base + (Math.random() - 0.5) * 0.06).toFixed(3))
    return {
      date: format(date, 'yyyy-MM-dd'),
      ndvi_mean: Math.max(0, Math.min(1, mean)),
      ndvi_min:  Math.max(0, Math.min(1, mean - 0.12 - Math.random() * 0.04)),
      ndvi_max:  Math.max(0, Math.min(1, mean + 0.12 + Math.random() * 0.04)),
    }
  })
}

const MOCK_SERIES = generateMockSeries()

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-gray-900 text-white rounded-lg px-3 py-2.5 shadow-xl text-xs">
      <p className="font-semibold mb-1">
        {label ? format(parseISO(label), 'dd MMM yyyy') : ''}
      </p>
      <p className="text-green-400">Mean NDVI: <strong>{d?.ndvi_mean?.toFixed(3)}</strong></p>
      <p className="text-gray-400">Range: {d?.ndvi_min?.toFixed(3)} – {d?.ndvi_max?.toFixed(3)}</p>
    </div>
  )
}

export default function NDVIChart({ series }) {
  const data = Array.isArray(series) && series.length > 0 ? series : MOCK_SERIES

  const formatted = data.map((d) => ({
    ...d,
    label: d.date,
    display: format(parseISO(d.date), 'MMM yy'),
  }))

  return (
    <div className="bg-white rounded-xl p-5 shadow-card border border-gray-100 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="section-title">NDVI Trend</h3>
          <p className="text-xs text-gray-500 mt-0.5">Satellite-derived vegetation health over time</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />Mean NDVI
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-200" />Min–Max Range
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={formatted} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="ndviRange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#86efac" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#86efac" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="display"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickCount={6}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Min-Max shaded area */}
          <Area
            dataKey="ndvi_max"
            stroke="none"
            fill="url(#ndviRange)"
            fillOpacity={1}
          />
          <Area
            dataKey="ndvi_min"
            stroke="none"
            fill="white"
            fillOpacity={1}
          />

          {/* Reference line for healthy vegetation */}
          <ReferenceLine
            y={0.3}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            label={{ value: 'Healthy (0.3)', position: 'insideTopRight', fontSize: 10, fill: '#f59e0b' }}
          />

          {/* Mean NDVI line */}
          <Line
            type="monotone"
            dataKey="ndvi_mean"
            stroke="#16a34a"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: '#16a34a', strokeWidth: 2, fill: '#fff' }}
            name="Mean NDVI"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
