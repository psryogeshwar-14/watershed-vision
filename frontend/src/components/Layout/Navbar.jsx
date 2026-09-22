import { Link } from 'react-router-dom'
import { Droplets, Map, Image, BarChart2, FileText, Menu, X } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const NAV_LINKS = [
  { to: '/', label: 'Map', icon: Map },
  { to: '/gallery', label: 'Gallery', icon: Image },
  { to: '/thematic-maps', label: 'Thematic Maps', icon: BarChart2 },
  { to: '/reports', label: 'Reports', icon: FileText },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
            <Droplets className="text-emerald-400 w-7 h-7" />
            <span className="hidden sm:block">
              Watershed<span className="text-emerald-400">Vision</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* DoLR badge */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs text-gray-500 border border-gray-700 px-2 py-1 rounded-full">
              DoLR · MoRD · SIH 2024
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold">
              WV
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-800"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900 px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
