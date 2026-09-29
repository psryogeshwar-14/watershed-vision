import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Map,
  Layers,
  MoveHorizontal,
  Target,
  TrendingUp,
  Droplets,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import WatershedMap from '../components/Map/WatershedMap.jsx'
import AnalyticsDashboard from '../components/Dashboard/AnalyticsDashboard.jsx'
import NDVIChart from '../components/Dashboard/NDVIChart.jsx'
import BeforeAfterSwipeMap from '../components/Map/BeforeAfterSwipeMap.jsx'
import Sidebar from '../components/Layout/Sidebar.jsx'
import { useLanguage } from '../services/i18n.js'
import { getInterventionPrioritization } from '../services/api.js'

export default function WatershedAnalysis() {
  const { id } = useParams()
  const { t, lang } = useLanguage()
  const isHi = lang === 'hi'

  const [viewMode, setViewMode] = useState('map') // 'map', 'swipe', 'prioritization'
  const [prioritizationData, setPrioritizationData] = useState(null)
  const [loadingDSS, setLoadingDSS] = useState(false)

  // Derive watershed key for props
  const wsKey = id?.toLowerCase().includes('alwar')
    ? 'alwar'
    : id?.toLowerCase().includes('tumkur')
    ? 'tumkur'
    : 'bhor'

  const watershedDisplayName =
    wsKey === 'alwar'
      ? t('wsAlwar')
      : wsKey === 'tumkur'
      ? t('wsTumkur')
      : t('wsBhor')

  // Fetch DSS Prioritization
  useEffect(() => {
    let mounted = true
    async function loadPrioritization() {
      try {
        setLoadingDSS(true)
        const res = await getInterventionPrioritization(wsKey)
        if (mounted) setPrioritizationData(res)
      } catch (e) {
        console.warn('DSS API request failed, using default prioritization fallback.')
      } finally {
        if (mounted) setLoadingDSS(false)
      }
    }
    loadPrioritization()
    return () => { mounted = false }
  }, [wsKey])

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <Sidebar watershedId={id} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Mode Switcher Bar ── */}
        <div className="bg-gray-950 border-b border-gray-800 px-6 py-2.5 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider hidden sm:inline">
              {isHi ? 'विश्लेषण दृश्य:' : 'Analysis View:'}
            </span>
            <div className="flex items-center bg-gray-900 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'map'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                {isHi ? 'कमांड मैप' : 'GIS Map & Sensors'}
              </button>

              <button
                onClick={() => setViewMode('swipe')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'swipe'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <MoveHorizontal className="w-3.5 h-3.5" />
                {isHi ? 'पूर्व/पश्चात उपग्रह स्लाइडर' : 'Before/After Satellite Swipe'}
              </button>

              <button
                onClick={() => setViewMode('prioritization')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'prioritization'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                {isHi ? 'हस्तक्षेप प्राथमिकता (DSS)' : 'Intervention Matrix (DSS)'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 hidden md:inline">{watershedDisplayName}</span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[10px]">
              Sentinel-2 · 30m
            </span>
          </div>
        </div>

        {/* ── VIEW 1: INTERACTIVE MAP & CHART ── */}
        {viewMode === 'map' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Map (top 60%) */}
            <div className="flex-1 relative">
              <WatershedMap watershedId={id} />
            </div>

            {/* NDVI Chart (bottom 40%) */}
            <div className="h-64 bg-gray-900 border-t border-gray-800 p-4 overflow-hidden shrink-0">
              <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                📈 {t('chartNdviTitle')}
              </h3>
              <NDVIChart watershedId={id} height={190} showHeader={false} />
            </div>
          </div>
        )}

        {/* ── VIEW 2: BEFORE/AFTER SATELLITE SWIPE MAP ── */}
        {viewMode === 'swipe' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-950 flex flex-col justify-center">
            <div className="max-w-5xl mx-auto w-full">
              <BeforeAfterSwipeMap
                watershedName={watershedDisplayName}
                beforeYear={wsKey === 'alwar' ? 'May 2021 (Dry Baseline)' : 'May 2021 (Pre-Intervention)'}
                afterYear={wsKey === 'alwar' ? 'Oct 2024 (Post-Monsoon)' : 'Oct 2024 (Post-Monsoon Impact)'}
                ndviGain={wsKey === 'alwar' ? '+0.19' : wsKey === 'tumkur' ? '+0.21' : '+0.21'}
                waterGainHa={wsKey === 'alwar' ? '14.8' : wsKey === 'tumkur' ? '16.2' : '18.4'}
                moistureGainPct={wsKey === 'alwar' ? '28' : wsKey === 'tumkur' ? '30' : '32'}
              />
              <p className="text-center text-gray-500 text-xs mt-3">
                {isHi
                  ? 'स्लाइडर को बाएँ या दाएँ खींचकर निर्माण पूर्व एवं निर्माण पश्चात के उपग्रह रिमोट सेंसिंग प्रभाव का निरीक्षण करें।'
                  : 'Drag the split divider left or right to inspect temporal satellite recovery in vegetation and surface water extent.'}
              </p>
            </div>
          </div>
        )}

        {/* ── VIEW 3: DECISION SUPPORT PRIORITIZATION MATRIX ── */}
        {viewMode === 'prioritization' && (
          <div className="flex-1 overflow-y-auto p-6 bg-gray-950 space-y-6">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-xs font-semibold">
                      Scientific Decision Support System (DSS)
                    </span>
                    <span className="text-xs text-gray-400 font-mono">WDC-PMKSY Engineering Planning</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {isHi ? 'उप-जलसंभर हस्तक्षेप प्राथमिकता मैट्रिक्स' : 'Sub-Catchment Intervention Prioritization Matrix'}
                  </h2>
                  <p className="text-gray-400 text-xs mt-1">
                    {isHi
                      ? 'एसआरटीएम ढलान प्रवणता, उपग्रह एनडीवीआई वनस्पति कमी, और दृष्टि फील्ड तस्वीरों का बहु-मानदंड विश्लेषण।'
                      : 'Multi-criteria GIS analysis combining SRTM 30m slope gradients, Sentinel-2 NDVI vegetative deficits, and DRISHTI field erosion photos.'}
                  </p>
                </div>

                {prioritizationData && (
                  <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 p-3 rounded-xl">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Recommended Outlay</p>
                      <p className="text-emerald-400 font-extrabold text-sm">
                        ₹ {prioritizationData.total_recommended_budget_lakhs} Lakhs
                      </p>
                    </div>
                    <div className="text-right border-l border-gray-800 pl-4">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Harvest Potential</p>
                      <p className="text-blue-400 font-extrabold text-sm">
                        {prioritizationData.total_water_harvest_potential_ham} ha-m
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Prioritization Cards */}
              <div className="space-y-4">
                {(prioritizationData?.prioritized_interventions || [
                  {
                    rank: 1,
                    reach_id: 'REACH-BHOR-RIDGE-01',
                    sub_catchment: 'Velhe Ridge Drainage Divide',
                    priority_level: 'High Priority',
                    priority_badge: 'bg-red-950 text-red-300 border-red-800',
                    slope_pct: 12.8,
                    ndvi_current: 0.24,
                    erosion_risk: 'Severe (Active Gully Progression)',
                    recommended_primary: '2 Masonry Check Dams (CD-05 & CD-06)',
                    recommended_secondary: 'Continuous Contour Trenches (2,400m) + Vetiver bio-barrier',
                    est_budget_lakhs: 19.8,
                    water_harvest_pot_ham: 16.5,
                    beneficiary_families: 85,
                  },
                  {
                    rank: 2,
                    reach_id: 'REACH-BHOR-VALLEY-02',
                    sub_catchment: 'Nira Tributary Riparian Zone',
                    priority_level: 'Medium Priority',
                    priority_badge: 'bg-amber-950 text-amber-300 border-amber-800',
                    slope_pct: 5.2,
                    ndvi_current: 0.38,
                    erosion_risk: 'Moderate (Stream Bank Scouring)',
                    recommended_primary: 'Desilting of Percolation Tank PT-02 + Gabion Spurs',
                    recommended_secondary: '5 ha Bamboo & Native Species Riparian Buffer',
                    est_budget_lakhs: 12.4,
                    water_harvest_pot_ham: 9.2,
                    beneficiary_families: 54,
                  },
                ]).map((item) => (
                  <div
                    key={item.reach_id}
                    className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 shadow-lg transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800/80 pb-3 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold flex items-center justify-center text-xs">
                          #{item.rank}
                        </span>
                        <div>
                          <h3 className="text-white font-bold text-sm">{item.sub_catchment}</h3>
                          <p className="text-[11px] text-gray-500 font-mono mt-0.5">{item.reach_id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.priority_badge}`}>
                          {item.priority_level}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                      <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                        <p className="text-gray-400 text-[10px] uppercase font-semibold">Terrain Slope</p>
                        <p className="text-white font-bold mt-0.5">{item.slope_pct}% gradient</p>
                      </div>
                      <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                        <p className="text-gray-400 text-[10px] uppercase font-semibold">NDVI Vegetative Deficit</p>
                        <p className="text-yellow-400 font-bold mt-0.5">{item.ndvi_current} (Low Cover)</p>
                      </div>
                      <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                        <p className="text-gray-400 text-[10px] uppercase font-semibold">Erosion Hazard</p>
                        <p className="text-red-400 font-bold mt-0.5">{item.erosion_risk}</p>
                      </div>
                      <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                        <p className="text-gray-400 text-[10px] uppercase font-semibold">Est. Outlay & Beneficiaries</p>
                        <p className="text-emerald-400 font-bold mt-0.5">
                          ₹ {item.est_budget_lakhs}L ({item.beneficiary_families} families)
                        </p>
                      </div>
                    </div>

                    {/* Prescribed Engineering Interventions */}
                    <div className="bg-gray-950 rounded-xl p-3 border border-gray-800 space-y-1.5 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">1. Primary Structure:</span>
                        <span className="text-gray-200 font-medium">{item.recommended_primary}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">2. Bio-Engineering:</span>
                        <span className="text-gray-300">{item.recommended_secondary}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto hidden xl:block">
        <div className="p-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
            {t('dashTitle')}
          </h2>
          <AnalyticsDashboard watershedId={id} compact />
        </div>
      </div>
    </div>
  )
}
