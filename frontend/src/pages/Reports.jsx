import { useState } from 'react'
import { FileText, Download, BarChart2, Map, Eye, Activity } from 'lucide-react'
import NDVIChart from '../components/Dashboard/NDVIChart.jsx'
import WatershedHealthGauge from '../components/Dashboard/WatershedHealthGauge.jsx'

const WATERSHEDS = [
  { id: 'ws-001', name: 'Bhor Watershed — Maharashtra' },
  { id: 'ws-002', name: 'Alwar Watershed — Rajasthan' },
  { id: 'ws-003', name: 'Tumkur Watershed — Karnataka' },
]

const REPORT_TYPES = [
  { id: 'progress', label: 'Progress Report', icon: BarChart2, desc: 'Monthly/quarterly activity progress' },
  { id: 'health', label: 'Watershed Health Assessment', icon: Activity, desc: 'NDVI, water body, erosion analysis' },
  { id: 'spatial', label: 'Spatial Coverage Report', icon: Map, desc: 'Intervention distribution maps' },
  { id: 'verification', label: 'Geo-Image Verification', icon: Eye, desc: 'Field photo audit trail' },
]

// Mock recent reports
const RECENT_REPORTS = [
  { name: 'Bhor_Q2_2024_Health.pdf', watershed: 'Bhor, Maharashtra', date: '15 Sep 2024', size: '2.4 MB' },
  { name: 'Alwar_Progress_Aug2024.pdf', watershed: 'Alwar, Rajasthan', date: '31 Aug 2024', size: '1.8 MB' },
  { name: 'Tumkur_Spatial_July2024.pdf', watershed: 'Tumkur, Karnataka', date: '12 Jul 2024', size: '3.1 MB' },
]

export default function Reports() {
  const [selectedWatershed, setSelectedWatershed] = useState('ws-001')
  const [selectedReport, setSelectedReport] = useState('health')
  const [startDate, setStartDate] = useState('2024-06-01')
  const [endDate, setEndDate] = useState('2024-09-30')
  const [generating, setGenerating] = useState(false)

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      alert('Report generated! (PDF download would trigger here with real backend)')
    }, 2000)
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Report Generation</h1>
        <p className="text-gray-400 text-sm">
          Generate evidence-based PDF reports for watershed planners and policy decision-makers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Report Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider block mb-1.5">
                  Watershed
                </label>
                <select
                  value={selectedWatershed}
                  onChange={e => setSelectedWatershed(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {WATERSHEDS.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider block mb-1.5">
                  Report Type
                </label>
                <div className="space-y-2">
                  {REPORT_TYPES.map(({ id, label, icon: Icon, desc }) => (
                    <label
                      key={id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedReport === id
                          ? 'border-emerald-500 bg-emerald-950'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportType"
                        value={id}
                        checked={selectedReport === id}
                        onChange={() => setSelectedReport(id)}
                        className="mt-0.5 accent-emerald-500"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 text-sm text-white">
                          <Icon className="w-3.5 h-3.5 text-emerald-400" />
                          {label}
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-wider block mb-1.5">
                    From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-wider block mb-1.5">
                    To
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                {generating ? (
                  <>
                    <span className="animate-spin">⟳</span> Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate PDF Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Recent reports */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Recent Reports</h2>
            <div className="space-y-3">
              {RECENT_REPORTS.map(r => (
                <div key={r.name} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                  <FileText className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{r.name}</p>
                    <p className="text-gray-500 text-xs">{r.watershed}</p>
                    <p className="text-gray-600 text-xs">{r.date} · {r.size}</p>
                  </div>
                  <button className="text-gray-500 hover:text-white">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Report Preview</h2>

            {/* Report header mock */}
            <div className="border border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-emerald-900 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">WatershedVision</h3>
                  <p className="text-emerald-300 text-sm">Dept of Land Resources · Ministry of Rural Development</p>
                </div>
                <div className="text-right text-xs text-emerald-300">
                  <p>SRISHTI-DRISHTI Aligned</p>
                  <p>PS #26015 · SIH 2024</p>
                </div>
              </div>

              <div className="p-5 bg-gray-950 space-y-5">
                <div>
                  <h4 className="text-white font-semibold mb-1">
                    Watershed Health Assessment Report
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {WATERSHEDS.find(w => w.id === selectedWatershed)?.name} · Period: {startDate} to {endDate}
                  </p>
                </div>

                {/* Health gauge */}
                <div className="flex items-center gap-8">
                  <WatershedHealthGauge score={71} />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-8">
                      <span className="text-gray-400">Vegetation Cover</span>
                      <span className="text-emerald-400 font-medium">74% ↑</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-gray-400">Water Body Area</span>
                      <span className="text-blue-400 font-medium">42 ha</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-gray-400">Interventions Logged</span>
                      <span className="text-white font-medium">89</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-gray-400">NDVI Change (YoY)</span>
                      <span className="text-green-400 font-medium">+0.12</span>
                    </div>
                  </div>
                </div>

                {/* NDVI Chart */}
                <div>
                  <h5 className="text-gray-300 text-sm font-semibold mb-2">NDVI Trend Analysis</h5>
                  <NDVIChart watershedId={selectedWatershed} height={160} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
