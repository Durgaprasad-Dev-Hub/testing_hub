import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  X, Shield, LayoutDashboard, FolderOpen, Plus,
  AlertTriangle, GitMerge, FileText, Settings, ShieldCheck
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Overview' },
  { to: '/projects',     icon: FolderOpen,      label: 'Projects' },
  { to: '/new-analysis', icon: Plus,            label: 'New Scan', accent: true },
  { divider: true, label: 'Analysis & Triage' },
  { to: '/findings',     icon: AlertTriangle,   label: 'Findings Register' },
  { to: '/patches',      icon: GitMerge,        label: 'Patch Center' },
  { to: '/reports',      icon: FileText,        label: 'Compliance Reports' },
  { divider: true, label: 'Platform' },
  { to: '/settings',     icon: Settings,        label: 'Scanner Health' },
]

export default function MobileDrawer({ open, onClose }) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 md:hidden"
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 left-0 bottom-0 w-72 bg-[#070B16] border-r border-slate-800 z-50 flex flex-col md:hidden animate-in slide-in-from-left duration-200 shadow-2xl">
        <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-sm text-white">Vibe Shield AI</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item, idx) => {
            if (item.divider) {
              return (
                <div
                  key={idx}
                  className="pt-4 pb-1 px-3 text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400"
                >
                  {item.label}
                </div>
              )
            }

            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''} ${
                    item.accent
                      ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/30'
                      : ''
                  }`
                }
              >
                <Icon size={16} className={item.accent ? 'text-indigo-400' : ''} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span>Human-in-the-Loop Enforced</span>
          </div>
        </div>
      </div>
    </>
  )
}
