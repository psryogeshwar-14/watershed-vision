import { Link } from 'react-router-dom'
import { Upload, Map, BarChart2, FileText, TrendingUp, Eye, Activity } from 'lucide-react'
import WatershedMap from '../components/Map/WatershedMap.jsx'
import AnalyticsDashboard from '../components/Dashboard/AnalyticsDashboard.jsx'
import ImageUploader from '../components/Upload/ImageUploader.jsx'
import { useState } from 'react'
import { useLanguage } from '../services/i18n.js'

export default function HomePage() {
  const [showUploader, setShowUploader] = useState(false)
  const { t } = useLanguage()

  const stats = [
    { label: t('tickerWatersheds'), value: '3', icon: Map, color: 'text-emerald-400' },
    { label: t('tickerImages'), value: '247', icon: Eye, color: 'text-blue-400' },
    { label: t('tickerNdvi'), value: '0.54', icon: TrendingUp, color: 'text-yellow-400' },
    { label: t('tickerArea'), value: '8,160', icon: Activity, color: 'text-purple-400' },
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Hero stats banner */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-white font-semibold">{value}</span>
                <span className="text-gray-400 text-sm">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUploader(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg transition-colors shadow-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              {t('btnUpload')}
            </button>
            <Link
              to="/reports"
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <FileText className="w-4 h-4" />
              {t('btnGenerateReport')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main content: Map + Dashboard side by side */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map (65%) */}
        <div className="flex-1 relative">
          <WatershedMap />
        </div>

        {/* Dashboard panel (35%) */}
        <div className="w-96 bg-gray-900 border-l border-gray-800 overflow-y-auto flex-shrink-0 hidden lg:block">
          <div className="p-4">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              {t('dashTitle')}
            </h2>
            <AnalyticsDashboard />
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl w-full max-w-lg border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-white font-semibold">{t('uploadTitle')}</h3>
              <button
                onClick={() => setShowUploader(false)}
                className="text-gray-400 hover:text-white"
              >✕</button>
            </div>
            <div className="p-4">
              <ImageUploader onSuccess={() => setShowUploader(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

