import GeoImageGallery from '../components/ImageGallery/GeoImageGallery.jsx'

export default function ImageGallery() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Field Image Gallery</h1>
        <p className="text-gray-400 text-sm">
          Browse and analyze geo-coded field photographs. Each image is automatically
          classified by AI and linked to its GPS location for spatial analysis.
        </p>
      </div>
      <GeoImageGallery />
    </div>
  )
}
