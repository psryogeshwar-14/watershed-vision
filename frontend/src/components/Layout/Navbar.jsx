import { Link, useLocation } from 'react-router-dom'
import { Droplets, Map, Image, BarChart2, FileText, Menu, X, ShieldCheck, Radio } from 'lucide-react'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import LanguageToggle from './LanguageToggle.jsx'
import { useLanguage } from '../../services/i18n.js'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { t } = useLanguage()
  const [, setRefresh] = useState(0)

  useEffect(() => {
    const onLangChange = () => setRefresh((r) => r + 1)
    window.addEventListener('languagechange', onLangChange)
    return () => window.removeEventListener('languagechange', onLangChange)
  }, [])

  const navLinks = [
    { to: '/', label: t('navMap'), icon: Map },
    { to: '/gallery', label: t('navGallery'), icon: Image },
    { to: '/thematic-maps', label: t('navThematic'), icon: BarChart2 },
    { to: '/drishti-sync', label: t('navDrishti'), icon: Radio },
    { to: '/reports', label: t('navReports'), icon: FileText },
  ]

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 shadow-md print:hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 text-white font-bold text-xl group">
            <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 group-hover:bg-emerald-900 transition-colors">
              <Droplets className="w-6 h-6" />
            </div>
            <span className="tracking-tight">
              {t('brandTitle')}<span className="text-emerald-400">{t('brandSub')}</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1.5">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to || (to === '/' && location.pathname.startsWith('/watershed/'))
              return (
                <Link
                  key={to}
                  to={to}
                  className={clsx(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-300'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                  )}
                >
                  <Icon className={clsx('w-4 h-4', isActive ? 'text-emerald-400' : 'text-gray-400')} />
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Right controls: Language Toggle & Ministry Badge */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle />

            <div className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('ministryBadge')}</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-emerald-600 border border-emerald-400 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              WV
            </div>
          </div>

          {/* Mobile hamburger & Lang toggle */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageToggle />
            <button
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900 px-4 py-3 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium',
                  isActive
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}
