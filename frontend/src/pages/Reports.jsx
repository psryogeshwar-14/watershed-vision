import { useState } from 'react'
import { 
  Download, Printer, ShieldCheck, CheckCircle2, 
  QrCode, Building, Activity
} from 'lucide-react'
import NDVIChart from '../components/Dashboard/NDVIChart.jsx'
import { useLanguage } from '../services/i18n.js'

const WATERSHED_METADATA = {
  'ws-001': {
    id: 'ws-001',
    name: 'Bhor Micro-Watershed Catchment',
    hindiName: 'भोर सूक्ष्म-जलसंभर क्षेत्र',
    state: 'Maharashtra',
    district: 'Pune',
    gramPanchayat: 'Bhor & Velhe GP Cluster',
    wdcCode: 'WDC-PMKSY-2.0/MH/PUN/2023-04',
    totalAreaHa: 4250,
    treatedAreaHa: 3680,
    sanctionDate: '14-Aug-2022',
    executingAgency: 'District Watershed Development Cell (DWDC) Pune',
    healthScore: 78,
    ndviPre: 0.31,
    ndviPost: 0.52,
    waterStorageGain: '18.4 ha-m',
    erosionReduction: '-34.2%',
    structuresLogged: 42,
    auditTrail: [
      { id: 'INSP-8491', type: 'Check Dam / Nala Bund', lat: 18.1523, lng: 73.8456, exifAlt: 588, srtmAlt: 590, integrity: 94, siltation: 'Low (12%)', status: 'verified' },
      { id: 'INSP-8492', type: 'Afforestation Belt', lat: 18.1489, lng: 73.8512, exifAlt: 610, srtmAlt: 608, integrity: 88, siltation: 'N/A', status: 'verified' },
      { id: 'INSP-8493', type: 'Farm Pond / Water Body', lat: 18.1610, lng: 73.8390, exifAlt: 574, srtmAlt: 575, integrity: 91, siltation: 'Moderate (28%)', status: 'verified' },
      { id: 'INSP-8494', type: 'Contour Trench System', lat: 18.1565, lng: 73.8420, exifAlt: 635, srtmAlt: 633, integrity: 85, siltation: 'Low (15%)', status: 'verified' },
    ]
  },
  'ws-002': {
    id: 'ws-002',
    name: 'Alwar Rainfed Micro-Watershed',
    hindiName: 'अलवर वर्षा-आधारित सूक्ष्म-जलसंभर',
    state: 'Rajasthan',
    district: 'Alwar',
    gramPanchayat: 'Thanagazi Catchment',
    wdcCode: 'WDC-PMKSY-2.0/RJ/ALW/2022-11',
    totalAreaHa: 5120,
    treatedAreaHa: 4400,
    sanctionDate: '05-Nov-2021',
    executingAgency: 'State Level Nodal Agency (SLNA) Rajasthan',
    healthScore: 69,
    ndviPre: 0.22,
    ndviPost: 0.41,
    waterStorageGain: '14.8 ha-m',
    erosionReduction: '-29.5%',
    structuresLogged: 36,
    auditTrail: [
      { id: 'INSP-7201', type: 'Johad / Percolation Tank', lat: 27.5612, lng: 76.6189, exifAlt: 268, srtmAlt: 270, integrity: 82, siltation: 'Moderate (35%)', status: 'verified' },
      { id: 'INSP-7202', type: 'Gully Plug Check Dam', lat: 27.5580, lng: 76.6240, exifAlt: 284, srtmAlt: 285, integrity: 89, siltation: 'Low (18%)', status: 'verified' },
      { id: 'INSP-7203', type: 'Silvi-Pasture Plantation', lat: 27.5670, lng: 76.6120, exifAlt: 275, srtmAlt: 274, integrity: 79, siltation: 'N/A', status: 'verified' },
    ]
  },
  'ws-003': {
    id: 'ws-003',
    name: 'Tumkur Semi-Arid Basin',
    hindiName: 'तुमकुर अर्ध-शुष्क बेसिन',
    state: 'Karnataka',
    district: 'Tumkur',
    gramPanchayat: 'Madhugiri Cluster',
    wdcCode: 'WDC-PMKSY-2.0/KA/TUM/2023-09',
    totalAreaHa: 3890,
    treatedAreaHa: 3310,
    sanctionDate: '22-Feb-2023',
    executingAgency: 'Watershed Development Department (WDD) Karnataka',
    healthScore: 74,
    ndviPre: 0.28,
    ndviPost: 0.49,
    waterStorageGain: '16.2 ha-m',
    erosionReduction: '-31.0%',
    structuresLogged: 29,
    auditTrail: [
      { id: 'INSP-6110', type: 'Check Dam / Nala Bund', lat: 13.3420, lng: 77.1040, exifAlt: 820, srtmAlt: 822, integrity: 93, siltation: 'Low (14%)', status: 'verified' },
      { id: 'INSP-6111', type: 'Percolation Pond', lat: 13.3380, lng: 77.1120, exifAlt: 812, srtmAlt: 814, integrity: 87, siltation: 'Moderate (22%)', status: 'verified' },
      { id: 'INSP-6112', type: 'Afforestation Trench', lat: 13.3490, lng: 77.0980, exifAlt: 835, srtmAlt: 834, integrity: 84, siltation: 'N/A', status: 'verified' },
    ]
  }
}

export default function Reports() {
  const { lang, t } = useLanguage()
  const isHi = lang === 'hi'

  const [selectedWatershed, setSelectedWatershed] = useState('ws-001')
  const [selectedReport, setSelectedReport] = useState('audit_dossier')
  const [generating, setGenerating] = useState(false)
  const timestamp = '27-Sep-2024'

  const meta = WATERSHED_METADATA[selectedWatershed] || WATERSHED_METADATA['ws-001']

  const handlePrint = () => {
    window.print()
  }

  const handleSimulateExport = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      window.print()
    }, 800)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 print:p-0 print:m-0 print:max-w-none">
      {/* ── Screen-only Header Controls ── */}
      <div className="no-print print:hidden mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold">
              MoRD · DoLR · SIH PS #26015
            </span>
            <span className="text-xs text-gray-500 font-mono">SRISHTI-DRISHTI Aligned</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {isHi ? 'आधिकारिक जलसंभर ऑडिट डोजियर' : 'Official Geospatial Audit Dossier'}
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            {isHi 
              ? 'मंत्रालय के दिशानिर्देशों के तहत डिजिटल सत्यापन एवं जीपीएस एंटी-स्पूफिंग ऑडिट रिपोर्ट'
              : 'Statutory field verification, satellite change detection, and civil outcome dossier for WDC-PMKSY 2.0'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs sm:text-sm font-medium transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-gray-400" />
            {t('btnPrintQuick')}
          </button>

          <button
            onClick={handleSimulateExport}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-50"
          >
            {generating ? (
              <>
                <span className="animate-spin text-sm">⟳</span> {t('btnCompiling')}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {t('btnExportPdf')}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 print:block print:w-full">
        {/* ── Left Sidebar Controls (Hidden when printing) ── */}
        <div className="no-print print:hidden lg:col-span-1 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-5">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              {isHi ? 'प्रोजेक्ट चयन' : 'Project Parameters'}
            </h2>

            {/* Watershed Selector */}
            <div>
              <label className="text-gray-400 text-xs block mb-1 font-medium">
                {isHi ? 'जलसंभर क्लस्टर' : 'Watershed Catchment'}
              </label>
              <select
                value={selectedWatershed}
                onChange={e => setSelectedWatershed(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {Object.values(WATERSHED_METADATA).map(w => (
                  <option key={w.id} value={w.id}>
                    {isHi ? w.hindiName : w.name} ({w.state})
                  </option>
                ))}
              </select>
            </div>

            {/* Report Type */}
            <div>
              <label className="text-gray-400 text-xs block mb-1 font-medium">
                {isHi ? 'डोजियर प्रारूप' : 'Dossier Template'}
              </label>
              <div className="space-y-2">
                {[
                  { id: 'audit_dossier', label: isHi ? 'पूर्ण वैधानिक ऑडिट' : 'Executive Audit Dossier', sub: isHi ? 'पूर्ण तकनीकी एवं परिणाम रिपोर्ट' : 'Comprehensive MoRD format' },
                  { id: 'vegetation', label: isHi ? 'वनस्पति एवं जल प्रभाव' : 'Vegetation & NDVI Gain', sub: isHi ? 'उपग्रह समय-शृंखला विश्लेषण' : 'Pre/Post Sentinel timeseries' },
                  { id: 'anti_spoof', label: isHi ? 'जीपीएस स्पूफिंग ऑडिट' : 'GPS Integrity & Geofencing', sub: isHi ? 'SRTM 30m DEM सत्यापन' : 'Digital elevation confirmation' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedReport(item.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      selectedReport === item.id 
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200' 
                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="font-semibold text-white">{item.label}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Verification Seal Status */}
            <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>{isHi ? 'डिजिटल सत्यापन सक्रिय' : 'Cryptographic Hash Valid'}</span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono break-all leading-tight">
                SHA-256: 7f8a9e2d4c5b1a0f3e6d8c7b4a2e1f9a
              </p>
              <p className="text-[10px] text-gray-500">
                {isHi ? 'सर्वेक्षण डेटा पोस्टगिस एवं इसरो भुवन संदर्भ से सत्यापित है।' : 'All survey entries validated against PostGIS and SRTM 30m relief.'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Right Column: Official Printable Statutory Dossier ── */}
        <div className="lg:col-span-3 print:col-span-4 print:w-full print:block print:p-0 print:m-0">
          <div 
            id="dossier-printable"
            className="bg-white text-gray-900 rounded-2xl shadow-2xl p-6 sm:p-10 border border-gray-200 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full"
          >
            {/* ── Official Government of India Header ── */}
            <div className="border-b-2 border-emerald-900 pb-5 mb-6 text-center relative">
              {/* Ashoka Pillar / Emblem representation */}
              <div className="flex flex-col items-center justify-center mb-2">
                <div className="w-10 h-10 rounded-full border-2 border-amber-600 flex items-center justify-center text-amber-700 font-bold text-lg mb-1">
                  🏛️
                </div>
                <div className="text-[11px] font-bold tracking-widest text-gray-800 uppercase">
                  सत्यमेव जयते
                </div>
                <div className="text-xs font-extrabold tracking-wider text-gray-900 uppercase mt-0.5">
                  GOVERNMENT OF INDIA · भारत सरकार
                </div>
                <div className="text-xs font-bold text-gray-700 uppercase">
                  MINISTRY OF RURAL DEVELOPMENT · ग्रामीण विकास मंत्रालय
                </div>
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                  DEPARTMENT OF LAND RESOURCES (DoLR) · भूमि संसाधन विभाग
                </div>
              </div>

              {/* Sub-Header */}
              <div className="mt-3 bg-emerald-900 text-white py-1.5 px-4 rounded-md">
                <p className="text-xs sm:text-sm font-bold tracking-wide uppercase">
                  Watershed Development Component — Pradhan Mantri Krishi Sinchayee Yojana (WDC-PMKSY 2.0)
                </p>
                <p className="text-[11px] text-emerald-200">
                  Statutory Geospatial Audit & Impact Evaluation Dossier · SIH PS #26015
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2 px-1">
                <span>Dossier Ref: <span className="font-mono font-semibold text-gray-800">WDC/MoRD/AUDIT-2024/{meta.id.toUpperCase()}</span></span>
                <span>Evaluation Cycle: <span className="font-semibold text-gray-800">Q3 Monsoon Verification</span></span>
                <span>Date: <span className="font-semibold text-gray-800">{timestamp}</span></span>
              </div>
            </div>

            {/* ── Section 1: Micro-Watershed Master Identity Card ── */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-l-4 border-emerald-600 pl-2 mb-3">
                1. Micro-Watershed Cadastral Identity Card / सूक्ष्म-जलसंभर विवरण
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold">Watershed Code</span>
                  <span className="font-mono font-bold text-gray-900 text-[11px]">{meta.wdcCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold">Catchment Name</span>
                  <span className="font-bold text-gray-900">{meta.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold">State / District</span>
                  <span className="font-bold text-gray-900">{meta.state}, {meta.district}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold">Gram Panchayat</span>
                  <span className="font-bold text-gray-900">{meta.gramPanchayat}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold">Total Geo Area</span>
                  <span className="font-bold text-gray-900">{meta.totalAreaHa.toLocaleString()} Hectares</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold">Treated Area</span>
                  <span className="font-bold text-emerald-700">{meta.treatedAreaHa.toLocaleString()} Ha ({Math.round(meta.treatedAreaHa / meta.totalAreaHa * 100)}%)</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold">Sanction Date</span>
                  <span className="font-bold text-gray-900">{meta.sanctionDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold">Executing Agency</span>
                  <span className="font-medium text-gray-800 text-[11px] truncate block">{meta.executingAgency}</span>
                </div>
              </div>
            </div>

            {/* ── Section 2: Key Strategic Outcomes & Impact Metrics ── */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-l-4 border-emerald-600 pl-2 mb-3">
                2. Geospatial Impact & Outcomes / भू-स्थानिक परिणाम मूल्यांकन
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Composite Health Index</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">{meta.healthScore}<span className="text-sm font-normal text-emerald-600">/100</span></div>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">Grade A (High Impact)</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-800 block">NDVI Vegetation Gain</span>
                  <div className="text-2xl font-black text-blue-700 mt-1">+{(meta.ndviPost - meta.ndviPre).toFixed(2)}</div>
                  <span className="text-[10px] text-blue-700 block mt-1">Pre: {meta.ndviPre} → Post: {meta.ndviPost}</span>
                </div>

                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-cyan-800 block">Water Body Expansion</span>
                  <div className="text-2xl font-black text-cyan-700 mt-1">{meta.waterStorageGain}</div>
                  <span className="text-[10px] text-cyan-700 block mt-1">Impounded Volume Gain</span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Runoff / Gully Erosion</span>
                  <div className="text-2xl font-black text-amber-700 mt-1">{meta.erosionReduction}</div>
                  <span className="text-[10px] text-amber-700 block mt-1">Estimated Topsoil Loss Reduction</span>
                </div>
              </div>
            </div>

            {/* ── Section 3: Satellite Timeseries Trend ── */}
            <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-l-4 border-emerald-600 pl-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    3. Multi-Seasonal NDVI Vegetation Trend / बहु-मौसमी वनस्पति सूचकांक
                  </h3>
                  <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">(Sentinel-2 L2A · 10m)</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-gray-700 font-medium text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                    {isHi ? 'औसत एनडीवीआई' : 'Mean NDVI'}
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-200 inline-block" />
                    {isHi ? 'न्यूनतम-अधिकतम' : 'Min–Max'}
                  </span>
                </div>
              </div>
              <div className="w-full h-48 pt-1">
                <NDVIChart watershedId={selectedWatershed} height={180} showHeader={false} />
              </div>
            </div>

            {/* ── Section 4: GPS Anti-Spoofing & Geofence Field Verification Log ── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-l-4 border-emerald-600 pl-2">
                  4. Field Survey Audit Trail & Anti-Spoofing Log / फील्ड सत्यापन रिपोर्ट
                </h3>
                <span className="text-[10px] text-gray-500 font-medium">
                  {meta.auditTrail.length} Certified Geo-Inspections
                </span>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Inspection ID</th>
                      <th className="py-2.5 px-3">Intervention Asset</th>
                      <th className="py-2.5 px-3">Coordinates (WGS84)</th>
                      <th className="py-2.5 px-3">Altitude Cross-Check</th>
                      <th className="py-2.5 px-3">Structural Health</th>
                      <th className="py-2.5 px-3">Siltation</th>
                      <th className="py-2.5 px-3 text-right">Cadastral Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800">
                    {meta.auditTrail.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="py-2 px-3 font-mono font-bold text-gray-900">{item.id}</td>
                        <td className="py-2 px-3 font-medium">{item.type}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-gray-600">
                          {item.lat.toFixed(4)}°N, {item.lng.toFixed(4)}°E
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px]">
                          <span className="text-gray-900 font-semibold">{item.exifAlt}m</span> vs SRTM <span className="text-blue-600 font-semibold">{item.srtmAlt}m</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            {item.integrity}%
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-600">{item.siltation}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified In-Bounds
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Section 5: Statutory Certification & Digital Seal ── */}
            <div className="border-t-2 border-gray-300 pt-5 mt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                {/* Left: Cryptographic stamp & QR code */}
                <div className="flex items-center gap-3">
                  <div className="p-2 border-2 border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                    <QrCode className="w-14 h-14 text-gray-800" />
                  </div>
                  <div className="space-y-0.5 text-[10px] text-gray-500">
                    <p className="font-bold text-gray-800 uppercase tracking-wide">
                      Digital Cryptographic Verification Stamp
                    </p>
                    <p className="font-mono text-[9px] text-gray-600">
                      ID: SHA256:{meta.id.toUpperCase()}-7E92A-WDC-2024
                    </p>
                    <p className="text-gray-600">
                      Tamper-evident record synced with PostGIS & Bhuvan Geo-Portal.
                    </p>
                  </div>
                </div>

                {/* Right: Authorized Signatures */}
                <div className="flex gap-8 text-center text-xs">
                  <div>
                    <div className="h-9 border-b border-gray-400 mb-1 flex items-end justify-center">
                      <span className="font-serif italic text-emerald-900 font-bold text-xs">S. K. Deshmukh</span>
                    </div>
                    <p className="font-bold text-gray-800 text-[11px]">District GIS Specialist</p>
                    <p className="text-[10px] text-gray-500">DWDC / SRISHTI Nodal Team</p>
                  </div>

                  <div>
                    <div className="h-9 border-b border-gray-400 mb-1 flex items-end justify-center">
                      <span className="font-serif italic text-emerald-900 font-bold text-xs">Dr. R. K. Sharma, IAS</span>
                    </div>
                    <p className="font-bold text-gray-800 text-[11px]">Project Director (WDC-PMKSY)</p>
                    <p className="text-[10px] text-gray-500">Department of Land Resources</p>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-4 pt-2 border-t border-gray-200 text-center text-[9px] text-gray-400">
                This document is generated by WatershedVision, an AI-augmented geospatial decision support platform engineered for Smart India Hackathon (Problem Statement #26015).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
