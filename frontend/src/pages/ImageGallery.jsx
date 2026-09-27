import GeoImageGallery from '../components/ImageGallery/GeoImageGallery.jsx'
import { useLanguage } from '../services/i18n.js'

export default function ImageGallery() {
  const { t } = useLanguage()

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">{t('galleryTitle')}</h1>
        <p className="text-gray-400 text-sm">
          {t('gallerySub')}
        </p>
      </div>
      <GeoImageGallery />
    </div>
  )
}
