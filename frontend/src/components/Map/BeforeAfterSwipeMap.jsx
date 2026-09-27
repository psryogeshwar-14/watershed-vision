import { useState, useRef, useCallback } from 'react'
import { Sparkles, Calendar, Droplets, TrendingUp, Layers, MoveHorizontal } from 'lucide-react'
import { useLanguage } from '../../services/i18n.js'

export default function BeforeAfterSwipeMap({
  watershedName = 'Bhor Micro-Watershed, Pune (Maharashtra)',
  beforeYear = 'May 2021 (Pre-Intervention)',
  afterYear = 'Oct 2024 (Post-Monsoon Impact)',
  ndviGain = '+0.21',
  waterGainHa = '18.4',
  moistureGainPct = '32',
}) {
  const [sliderPos, setSliderPos] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)
  const { t } = useLanguage()

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100))
    setSliderPos(pct)
  }, [])

  const onMouseDown = () => setIsDragging(true)
  const onMouseUp = () => setIsDragging(false)
  const onMouseMove = (e) => {
    if (isDragging) handleMove(e.clientX)
  }
  const onTouchMove = (e) => {
    if (e.touches[0]) handleMove(e.touches[0].clientX)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-950/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-white font-bold text-base tracking-tight">
              {t('swipeTitle')}
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{watershedName}</p>
        </div>

        {/* Impact HUD Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="bg-emerald-950/80 border border-emerald-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-emerald-300">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">{t('vegGain')}:</span>
            <span className="font-bold text-white">{ndviGain} NDVI</span>
          </div>

          <div className="bg-blue-950/80 border border-blue-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-blue-300">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">{t('waterGain')}:</span>
            <span className="font-bold text-white">+{waterGainHa} ha</span>
          </div>

          <div className="bg-amber-950/80 border border-amber-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">{t('metricMoisture')}:</span>
            <span className="font-bold text-white">+{moistureGainPct}%</span>
          </div>
        </div>
      </div>

      {/* ── Interactive Split-Screen Area ── */}
      <div
        ref={containerRef}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchMove={onTouchMove}
        className="relative h-[420px] sm:h-[480px] w-full select-none cursor-ew-resize overflow-hidden bg-black"
      >
        {/* RIGHT LAYER: Post-Intervention (Full Canvas Underneath) */}
        <div className="absolute inset-0">
          {/* Simulated Post-Intervention Multispectral Satellite Layer */}
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80')`,
              filter: 'saturate(1.35) contrast(1.1) brightness(0.95)',
            }}
          />
          <div className="absolute inset-0 bg-emerald-950/20 mix-blend-overlay pointer-events-none" />

          {/* After Badge (Right) */}
          <div className="absolute top-4 right-4 bg-emerald-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-emerald-500/50 shadow-lg text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {afterYear}
          </div>

          {/* Key Feature Callout */}
          <div className="absolute bottom-6 right-6 bg-black/75 backdrop-blur-md border border-gray-700 p-3 rounded-xl text-left max-w-xs shadow-xl hidden sm:block">
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
              ✓ Post-Intervention Impact
            </p>
            <p className="text-xs text-gray-200">
              Check dams retain 18.4 ha water surface. Continuous contour trenches (CCT) boosted vegetative canopy density across 420 ha hillslopes.
            </p>
          </div>
        </div>

        {/* LEFT LAYER: Pre-Intervention (Clipped to sliderPos) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          {/* Simulated Pre-Intervention Satellite Layer (Dry/Barren) */}
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80')`,
              filter: 'saturate(0.55) sepia(0.35) contrast(1.15) brightness(1.05)',
            }}
          />
          <div className="absolute inset-0 bg-amber-950/20 mix-blend-color pointer-events-none" />

          {/* Before Badge (Left) */}
          <div className="absolute top-4 left-4 bg-red-950/90 text-red-200 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-red-700/60 shadow-lg text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            {beforeYear}
          </div>

          {/* Baseline Callout */}
          <div className="absolute bottom-6 left-6 bg-black/75 backdrop-blur-md border border-gray-700 p-3 rounded-xl text-left max-w-xs shadow-xl hidden sm:block">
            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
              ⚠️ Baseline Condition
            </p>
            <p className="text-xs text-gray-200">
              Severe soil erosion with deep rills, seasonal nala dry by February, average summer NDVI at 0.18 (bare rocky soil).
            </p>
          </div>
        </div>

        {/* ── DRAGGABLE DIVIDER LINE & HANDLE ── */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_15px_rgba(255,255,255,0.7)]"
          style={{ left: `${sliderPos}%` }}
          onMouseDown={onMouseDown}
          onTouchStart={onMouseDown}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white text-gray-900 rounded-full flex items-center justify-center shadow-2xl border-2 border-emerald-500 font-bold hover:scale-110 active:scale-95 transition-transform">
            <MoveHorizontal className="w-5 h-5 text-gray-900" />
          </div>
        </div>
      </div>

      {/* ── Footer instructions ── */}
      <div className="px-6 py-3 bg-gray-950 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
        <p className="flex items-center gap-2">
          <span>💡</span>
          {t('dragHint')}
        </p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-600 inline-block" />
            {t('dryBaselineStat')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            {t('treatedStat')}
          </span>
        </div>
      </div>
    </div>
  )
}
