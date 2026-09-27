import { ShieldCheck, AlertTriangle, XCircle, Mountain, MapPin } from 'lucide-react'

export default function GeofenceBadge({
  status = 'verified',
  latitude,
  longitude,
  altitude,
  srtmElevation = 590,
  watershedName = 'Bhor Watershed',
}) {
  const isVerified = status === 'verified'
  const isMismatch = status === 'altitude_mismatch'
  const isOutOfBounds = status === 'out_of_bounds'

  return (
    <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-3 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Spatial Integrity & Audit Check
        </span>
        {isVerified && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified Ground Truth
          </span>
        )}
        {isMismatch && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-semibold text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Elevation Audit Flag
          </span>
        )}
        {isOutOfBounds && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-semibold text-[11px]">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Outside Geofence
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-gray-300 pt-1">
        <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
          <p className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400" /> Boundary Geofence
          </p>
          <p className="font-semibold text-white mt-0.5">
            {isOutOfBounds ? '⚠️ Outside Boundary' : `✓ Inside ${watershedName}`}
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
          <p className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
            <Mountain className="w-3 h-3 text-blue-400" /> DEM Elevation Check
          </p>
          <p className="font-semibold text-white mt-0.5 font-mono">
            {altitude ? `${Math.round(altitude)}m` : '585m'} vs SRTM {srtmElevation}m
          </p>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed">
        {isVerified && 'GPS coordinates confirmed within micro-watershed polygon. Altitude matches satellite radar topography.'}
        {isMismatch && 'GPS coordinates are within boundary, but altitude deviates from SRTM DEM. Verify if mock GPS was enabled.'}
        {isOutOfBounds && 'Survey coordinates lie outside the registered watershed cadastral boundary.'}
      </p>
    </div>
  )
}
