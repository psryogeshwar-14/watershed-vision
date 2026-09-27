import { useParams } from 'react-router-dom'
import WatershedMap from '../components/Map/WatershedMap.jsx'
import AnalyticsDashboard from '../components/Dashboard/AnalyticsDashboard.jsx'
import NDVIChart from '../components/Dashboard/NDVIChart.jsx'
import Sidebar from '../components/Layout/Sidebar.jsx'
import { useLanguage } from '../services/i18n.js'

export default function WatershedAnalysis() {
  const { id } = useParams()
  const { t } = useLanguage()

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <Sidebar watershedId={id} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Map (top 60%) */}
        <div className="flex-1 relative">
          <WatershedMap watershedId={id} />
        </div>

        {/* NDVI Chart (bottom 40%) */}
        <div className="h-64 bg-gray-900 border-t border-gray-800 p-4 overflow-hidden">
          <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            📈 {t('chartNdviTitle')}
          </h3>
          <NDVIChart watershedId={id} height={190} showHeader={false} />
        </div>
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
