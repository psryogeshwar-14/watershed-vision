import clsx from 'clsx'

function getColorConfig(score) {
  if (score >= 75) return { color: '#16a34a', label: 'Excellent',  ring: 'text-green-600',  bg: 'bg-green-50' }
  if (score >= 60) return { color: '#22c55e', label: 'Good',       ring: 'text-green-500',  bg: 'bg-green-50' }
  if (score >= 40) return { color: '#f59e0b', label: 'Moderate',   ring: 'text-amber-500',  bg: 'bg-amber-50' }
  return               { color: '#ef4444', label: 'Poor',       ring: 'text-red-500',    bg: 'bg-red-50' }
}

export default function WatershedHealthGauge({ score = 72 }) {
  const s = Math.max(0, Math.min(100, score))
  const cfg = getColorConfig(s)

  // SVG arc parameters
  const radius = 60
  const stroke = 10
  const cx = 80
  const cy = 80
  const circumference = Math.PI * radius  // half circle arc length
  const offset = circumference - (s / 100) * circumference

  // Arc path: left side to right side (bottom semicircle up)
  const startAngle = 180 // degrees
  const endAngle   = 0
  const toRad = (d) => (d * Math.PI) / 180
  const arcX1 = cx + radius * Math.cos(toRad(startAngle))
  const arcY1 = cy + radius * Math.sin(toRad(startAngle))
  const arcX2 = cx + radius * Math.cos(toRad(endAngle))
  const arcY2 = cy + radius * Math.sin(toRad(endAngle))

  // Needle angle mapped from score (180° → 0°)
  const needleAngle = 180 - (s / 100) * 180
  const needleRad = toRad(needleAngle)
  const needleLen = radius - stroke / 2 - 8
  const needleX = cx + needleLen * Math.cos(needleRad)
  const needleY = cy - needleLen * Math.sin(toRad(180 - needleAngle))

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="100" viewBox="0 0 160 100">
        {/* Background arc */}
        <path
          d={`M ${arcX1},${arcY1} A ${radius},${radius} 0 0,1 ${arcX2},${arcY2}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Colored progress arc */}
        <path
          d={`M ${arcX1},${arcY1} A ${radius},${radius} 0 0,1 ${arcX2},${arcY2}`}
          fill="none"
          stroke={cfg.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />

        {/* Ticks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const a = toRad(180 - (tick / 100) * 180)
          const x1 = cx + (radius - stroke - 4) * Math.cos(a)
          const y1 = cy - (radius - stroke - 4) * Math.sin(a)  // flip y for svg
          const y1svg = cy + (radius - stroke - 4) * Math.sin(toRad(180 - (tick / 100) * 180)) * (tick <= 50 ? -1 : 1)
          return (
            <text
              key={tick}
              x={cx + (radius + 8) * Math.cos(a)}
              y={cy + (radius + 8) * -Math.sin(toRad(180 - (tick / 100) * 180)) + (tick === 0 || tick === 100 ? 4 : 0)}
              textAnchor="middle"
              fontSize="8"
              fill="#9ca3af"
            >
              {tick}
            </text>
          )
        })}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + needleLen * Math.cos(toRad(needleAngle))}
          y2={cy - needleLen * Math.sin(toRad(needleAngle))}
          stroke={cfg.color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={5} fill={cfg.color} />

        {/* Score text */}
        <text x={cx} y={cy + 20} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1f2937">
          {s}
        </text>
        <text x={cx} y={cy + 32} textAnchor="middle" fontSize="9" fill="#6b7280">
          / 100
        </text>
      </svg>

      <span className={clsx('badge text-sm px-3 py-1 mt-1', cfg.bg, cfg.ring, 'border', 'border-current/20')}>
        {cfg.label} Health
      </span>
    </div>
  )
}
