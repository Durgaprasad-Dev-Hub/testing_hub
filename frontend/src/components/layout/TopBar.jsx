import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Menu, Activity, Shield, Wifi, WifiOff, Plus, Terminal } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const PAGE_TITLES = {
  '/dashboard':    'Security Overview',
  '/projects':     'Project Repositories',
  '/new-analysis': 'New Security Scan',
  '/findings':     'Vulnerability Register',
  '/patches':      'Human-in-the-Loop Patch Center',
  '/reports':      'Compliance Audit Reports',
  '/settings':     'Scanner Registry & Health',
}

export default function TopBar({ onMobileMenuOpen }) {
  const location = useLocation()
  const { health, healthLoading, healthError } = useApp()

  const pathKey = Object.keys(PAGE_TITLES).find((k) => location.pathname.startsWith(k))
  const title = PAGE_TITLES[pathKey] || 'Vibe Shield AI'

  const backendOnline = !healthError && !healthLoading && health

  return (
    <header className="h-14 border-b border-slate-800/80 bg-[#070B16]/90 backdrop-blur-md sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono text-xs hidden sm:inline">VibeShield /</span>
          <h1 className="text-sm md:text-base font-bold text-white tracking-tight">{title}</h1>
        </div>
      </div>

      {/* Right: Status Pills & Action */}
      <div className="flex items-center gap-2.5">
        {/* Backend Connectivity Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
            backendOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
          title={backendOnline ? 'FastAPI Backend connected' : 'Backend connection refused'}
        >
          {healthLoading ? (
            <div className="w-2.5 h-2.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          )}
          <span className="hidden sm:inline">
            {healthLoading ? 'Connecting...' : backendOnline ? 'API Active' : 'API Offline'}
          </span>
        </div>

        {/* AI Engine Status */}
        {health && (
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
              health.ai_enabled
                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Activity size={12} className={health.ai_enabled ? 'text-indigo-400' : 'text-slate-400'} />
            <span>AI: {health.ai_enabled ? health.ai_provider : 'Deterministic'}</span>
          </div>
        )}

        {/* Fast Action */}
        <Link
          to="/new-analysis"
          className="btn-cyan btn-sm text-xs inline-flex items-center gap-1.5 font-semibold"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New Scan</span>
        </Link>
      </div>
    </header>
  )
}
