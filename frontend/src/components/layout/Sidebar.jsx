import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Plus, AlertTriangle,
  GitMerge, FileText, Settings, Shield, ChevronLeft, ChevronRight,
  Terminal, ShieldCheck
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Overview', badge: null },
  { to: '/projects',     icon: FolderOpen,      label: 'Projects', badge: null },
  { to: '/new-analysis', icon: Plus,            label: 'New Scan', accent: true },
  { divider: true, label: 'Analysis & Triage' },
  { to: '/findings',     icon: AlertTriangle,   label: 'Findings' },
  { to: '/patches',      icon: GitMerge,        label: 'Patch Center' },
  { to: '/reports',      icon: FileText,        label: 'Compliance Reports' },
  { divider: true, label: 'Platform' },
  { to: '/settings',     icon: Settings,        label: 'Scanner Health' },
]

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className="hidden md:flex flex-col border-r border-slate-800/80 bg-[#070B16] sticky top-0 h-screen transition-all duration-200 z-30 select-none"
      style={{ width: collapsed ? '70px' : '230px' }}
    >
      {/* Brand Header */}
      <div className="h-14 border-b border-slate-800/80 flex items-center justify-between px-3.5">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <Shield size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Vibe Shield
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  AI
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">AppSec Platform</span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {NAV_ITEMS.map((item, idx) => {
          if (item.divider) {
            return !collapsed ? (
              <div
                key={idx}
                className="pt-4 pb-1.5 px-3 text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400"
              >
                {item.label}
              </div>
            ) : (
              <div key={idx} className="my-2 border-t border-slate-800/60" />
            )
          }

          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''} ${
                  item.accent
                    ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/20'
                    : ''
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={17}
                className={`shrink-0 ${item.accent ? 'text-indigo-400' : ''}`}
              />
              {!collapsed && (
                <span className="truncate flex-1 text-xs">{item.label}</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Safety Policy Status Tag & Collapse Toggle */}
      <div className="p-2 border-t border-slate-800/80 bg-slate-950/40">
        {!collapsed && (
          <div className="mb-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="text-emerald-400 font-semibold block text-[10px]">Zero Blind Injection</span>
              Human approval required
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-mono"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <div className="flex items-center gap-2">
              <ChevronLeft size={16} />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
