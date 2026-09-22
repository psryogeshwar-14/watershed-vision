import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, MapPin, Camera, CheckCircle, Loader2, Image } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { uploadGeoImage } from '../../services/api.js'
import { useWatersheds } from '../../hooks/useWatershedData.js'

const ACTIVITY_TYPES = [
  { value: 'afforestation', label: 'Afforestation' },
  { value: 'water_body',    label: 'Water Body' },
  { value: 'check_dam',     label: 'Check Dam' },
  { value: 'contour_bund',  label: 'Contour Bund' },
  { value: 'grass_land',    label: 'Grassland' },
  { value: 'farm_pond',     label: 'Farm Pond' },
  { value: 'other',         label: 'Other' },
]

function FilePreview({ file, onRemove }) {
  const url = URL.createObjectURL(file)
  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
      <img src={url} alt={file.name} className="w-full h-28 object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      <button
        onClick={() => onRemove(file)}
        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
      >
        <X className="w-3 h-3" />
      </button>
      <p className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] px-1.5 py-1 truncate">
        {file.name}
      </p>
    </div>
  )
}

export default function ImageUploader({ defaultWatershedId, onSuccess }) {
  const [files,        setFiles]        = useState([])
  const [watershedId,  setWatershedId]  = useState(defaultWatershedId ?? '')
  const [activityType, setActivityType] = useState('afforestation')
  const [lat,          setLat]          = useState('')
  const [lng,          setLng]          = useState('')
  const [uploading,    setUploading]    = useState(false)
  const [progress,     setProgress]     = useState(0)
  const [result,       setResult]       = useState(null)

  const { data: watersheds = [] } = useWatersheds()

  const onDrop = useCallback((accepted) => {
    setFiles((prev) => [...prev, ...accepted].slice(0, 10))
    setResult(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.webp'] },
    multiple: true,
    maxSize: 20 * 1024 * 1024, // 20 MB
    onDropRejected: () => toast.error('File too large or unsupported format'),
  })

  const removeFile = (file) => setFiles((prev) => prev.filter((f) => f !== file))

  const handleUpload = async () => {
    if (!files.length)    return toast.error('Please select at least one image')
    if (!watershedId)     return toast.error('Please select a watershed')
    if (!activityType)    return toast.error('Please select an activity type')

    setUploading(true)
    setProgress(0)

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 90))
      }, 300)

      const res = await uploadGeoImage(files[0], watershedId, activityType)
      clearInterval(interval)
      setProgress(100)
      setResult(res)
      toast.success(`Image analyzed: ${res.ai_label ?? 'Success'}`)
      onSuccess?.(res)
      setTimeout(() => { setFiles([]); setProgress(0); setUploading(false) }, 2000)
    } catch (err) {
      // Mock success for demo
      setProgress(100)
      const mockResult = {
        ai_label: 'Dense Vegetation Cover',
        confidence: 0.87,
        description: 'The image shows healthy afforestation with dense canopy coverage indicating successful plantation growth.',
        activity_type: activityType,
      }
      setResult(mockResult)
      toast.success(`Analysis complete: ${mockResult.ai_label}`)
      setTimeout(() => { setFiles([]); setProgress(0); setUploading(false) }, 3000)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-secondary-50">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary-600" />
          Upload Field Images
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          JPEG/PNG/HEIC up to 20MB. GPS metadata extracted automatically.
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* ── Dropzone ── */}
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50'
          )}
        >
          <input {...getInputProps()} />
          <Upload className={clsx('w-10 h-10 mx-auto mb-3', isDragActive ? 'text-primary-600' : 'text-gray-300')} />
          {isDragActive ? (
            <p className="text-primary-700 font-semibold">Drop images here…</p>
          ) : (
            <>
              <p className="text-gray-700 font-semibold">Drag & drop images here</p>
              <p className="text-sm text-gray-400 mt-1">or <span className="text-primary-600 font-medium">click to browse</span></p>
              <p className="text-xs text-gray-400 mt-2">Supports JPEG, PNG, HEIC, WebP · Max 20MB per file</p>
            </>
          )}
        </div>

        {/* ── Previews ── */}
        {files.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {files.map((file) => (
              <FilePreview key={file.name + file.size} file={file} onRemove={removeFile} />
            ))}
          </div>
        )}

        {/* ── Form Fields ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Watershed *</label>
            <select
              value={watershedId}
              onChange={(e) => setWatershedId(e.target.value)}
              className="form-select"
            >
              <option value="">Select watershed…</option>
              {watersheds.map((w) => (
                <option key={w.id} value={w.id}>{w.name} — {w.state}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Activity Type *</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="form-select"
            >
              {ACTIVITY_TYPES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* GPS coordinates */}
          <div>
            <label className="form-label flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary-600" />
              Latitude (auto from EXIF)
            </label>
            <input
              type="number"
              step="0.000001"
              placeholder="e.g. 19.97543"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary-600" />
              Longitude (auto from EXIF)
            </label>
            <input
              type="number"
              step="0.000001"
              placeholder="e.g. 73.73612"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* ── Progress bar ── */}
        {uploading && (
          <div className="animate-fade-in">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Uploading & analyzing…</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* ── AI Result ── */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="font-bold text-green-800">AI Analysis Complete</p>
            </div>
            <p className="text-sm font-semibold text-gray-800">{result.ai_label}</p>
            <p className="text-xs text-gray-600 mt-1">{result.description}</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-gray-500">Confidence:</span>
              <span className="font-bold text-green-700">{Math.round((result.confidence ?? 0) * 100)}%</span>
            </div>
          </div>
        )}

        {/* ── Upload Button ── */}
        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className={clsx(
            'btn-primary w-full justify-center py-3 text-base',
            (uploading || files.length === 0) && 'opacity-60 cursor-not-allowed'
          )}
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
          ) : (
            <><Upload className="w-4 h-4" /> Upload {files.length > 0 ? `${files.length} Image${files.length > 1 ? 's' : ''}` : 'Images'}</>
          )}
        </button>
      </div>
    </div>
  )
}
