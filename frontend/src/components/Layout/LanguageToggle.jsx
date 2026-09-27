import { useState, useEffect } from 'react'
import { Languages } from 'lucide-react'
import { useLanguage } from '../../services/i18n.js'

export default function LanguageToggle() {
  const { lang, setLanguage } = useLanguage()
  const [currentLang, setCurrentLang] = useState(lang)

  useEffect(() => {
    const handleLangChange = () => setCurrentLang(lang)
    window.addEventListener('languagechange', handleLangChange)
    return () => window.removeEventListener('languagechange', handleLangChange)
  }, [lang])

  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'hi' : 'en'
    setLanguage(newLang)
    setCurrentLang(newLang)
  }

  return (
    <button
      onClick={toggleLanguage}
      title={currentLang === 'en' ? 'Switch to Hindi (हिंदी)' : 'Switch to English'}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-700 bg-gray-800/80 hover:bg-gray-700 text-gray-200 hover:text-white transition-all shadow-sm"
    >
      <Languages className="w-3.5 h-3.5 text-emerald-400" />
      <span>{currentLang === 'en' ? 'हिंदी' : 'EN'}</span>
    </button>
  )
}
