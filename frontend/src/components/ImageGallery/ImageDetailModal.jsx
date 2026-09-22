import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  X,
  MapPin,
  Camera,
  Clock,
  Smartphone,
  Mountain,
  Sparkles,
  ChevronRight,
  Download,
  Share2,
} from 'lucide-react'
import { format } from 'date-fns'

const BADGE_MAP = {
  afforestation: 'bg-emerald-950 text-emerald-300 border-emerald-700/50',
  water_body:    'bg-blue-950 text-blue-300 border-blue-700/50',
  check_dam:     'bg-amber-950 text-amber-300 border-amber-700/50',
  contour_bund:  'bg-orange-950 text-orange-300 border-orange-700/50',
  grass_land:    'bg-lime-950 text-lime-300 border-lime-700/50',
  farm_pond:     'bg-purple-950 text-purple-300 border-purple-700/50',
  other:         'bg-gray-800 text-gray-300 border-gray-700',
}

const ACTIVITY_LABELS = {
  afforestation: 'Afforestation',
  water_body:    'Water Body',
  check_dam:     'Check Dam',
  contour_bund:  'Contour Bund',
  grass_land:    'Grassland',
  farm_pond:     'Farm Pond',
  other:         'Other',
}

function ConfidenceBar({ value }) {
  const pct = Math.round((value ?? 0) * 100)
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">AI Confidence</span>
        <span className="font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

function MetaRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-gray-800/60 last:border-0">
      <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-medium text-gray-200 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

const RECOMMENDATIONS = {
  afforestation: [
    'Schedule follow-up monitoring in 6 months to assess canopy growth.',
    'Ensure adequate water supply during dry season for saplings.',
    'Document species diversity and survival rate.',
  ],
  water_body: [
    'Monitor water level monthly and record siltation levels.',
    'Establish riparian buffer zone (minimum 5m width).',
    'Test water quality for agricultural suitability.',
  ],
  check_dam: [
    'Inspect dam structure after each monsoon for siltation.',
    'Clear outlet pipes before monsoon season.',
    'Measure groundwater table rise annually in nearby wells.',
  ],
  default: [
    'Continue regular field monitoring every quarter.',
    'Update watershed management plan with latest spatial data.',
    'Report any structural anomalies to district watershed officer.',
  ],
}

export default function ImageDetailModal({ image, onClose }) {
  if (!image) return null
  const badgeCls   = BADGE_MAP[image.activity_type]   ?? 'bg-gray-800 text-gray-300 border-gray-700'
  const activityLabel = ACTIVITY_LABELS[image.activity_type] ?? 'Other'
  const recs = RECOMMENDATIONS[image.activity_type] ?? RECOMMENDATIONS.default

  return (
    <Transition appear show as={Fragment}>
      <Dialog as="div" className="relative z-[2000]" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-gray-950/80">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeCls}`}>{activityLabel}</span>
                    <span className="text-xs text-gray-500 font-mono">ID: #{image.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <a
                      href={image.image ?? image.thumbnail}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row">
                  {/* ── Left: Image ── */}
                  <div className="md:w-[55%] bg-black/60 flex items-center justify-center max-h-[440px] overflow-hidden border-b md:border-b-0 md:border-r border-gray-800">
                    <img
                      src={image.image ?? image.thumbnail}
                      alt={image.ai_label}
                      className="w-full h-full object-contain max-h-[440px]"
                    />
                  </div>

                  {/* ── Right: Details ── */}
                  <div className="md:w-[45%] overflow-y-auto max-h-[520px] flex flex-col">
                    {/* AI Classification */}
                    <div className="p-4 border-b border-gray-800">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">AI Classification</p>
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">{image.ai_label}</h3>
                      <p className="text-xs text-gray-400 mb-3 leading-relaxed">{image.description}</p>
                      <ConfidenceBar value={image.confidence} />
                    </div>

                    {/* EXIF / Metadata */}
                    <div className="p-4 border-b border-gray-800">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Spatial & Field Metadata</p>
                      <MetaRow
                        icon={MapPin}
                        label="GPS Coordinates"
                        value={
                          image.latitude && image.longitude
                            ? `${image.latitude.toFixed(6)}°N, ${image.longitude.toFixed(6)}°E`
                            : null
                        }
                      />
                      <MetaRow
                        icon={Mountain}
                        label="Elevation"
                        value={image.altitude_m ? `${Math.round(image.altitude_m)} m Above Sea Level` : null}
                      />
                      <MetaRow
                        icon={Clock}
                        label="Survey Timestamp"
                        value={image.captured_at ? format(new Date(image.captured_at), 'dd MMM yyyy, hh:mm a') : null}
                      />
                      <MetaRow
                        icon={Smartphone}
                        label="Capture Device"
                        value={image.device_model ?? 'GPS Field Camera'}
                      />
                      <MetaRow
                        icon={Camera}
                        label="Watershed Boundary"
                        value={image.watershed_name ?? 'Upper Godavari Sub-Basin'}
                      />
                    </div>

                    {/* Open on OSM */}
                    {image.latitude && image.longitude && (
                      <div className="px-4 py-3 border-b border-gray-800 bg-gray-950/40">
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${image.latitude}&mlon=${image.longitude}&zoom=15`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Open Location on OpenStreetMap
                          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                        </a>
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="p-4 bg-emerald-950/20">
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Expert Recommendations</p>
                      <ul className="space-y-2">
                        {recs.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                            <span className="w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
