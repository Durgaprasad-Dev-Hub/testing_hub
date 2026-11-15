import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderOpen, AlertTriangle, Shield, CheckCircle, Plus,
  ArrowRight, Activity, RefreshCw, Terminal, Layers, Bug,
  FileText, ExternalLink, ShieldCheck, Download
} from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip
} from 'recharts'
import { listProjects } from '../services/api'
import { useApp } from '../context/AppContext'

const SEVERITY_COLORS = {
  critical: '#F43F5E',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#3B82F6',
}

export default function DashboardPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { health } = useApp()

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setLoading(true)
    setError(null)
    try {
      const data = await listProjects({ page_size: 50 })
      setProjects(data.items || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch security metrics.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate real metrics from stored projects
  const totalProjects = projects.length
  const totalFindings = projects.reduce((acc, p) => acc + (p.total_findings || 0), 0)
  const criticalFindings = projects.reduce((acc, p) => acc + (p.critical_findings || 0), 0)
  const highFindings = projects.reduce((acc, p) => acc + (p.high_findings || 0), 0)
  const mediumFindings = projects.reduce((acc, p) => acc + (p.medium_findings || 0), 0)
  const lowFindings = projects.reduce((acc, p) => acc + (p.low_findings || 0), 0)

  // Chart data
  const severityChartData = [
    { name: 'Critical', count: criticalFindings, fill: SEVERITY_COLORS.critical },
    { name: 'High', count: highFindings, fill: SEVERITY_COLORS.high },
    { name: 'Medium', count: mediumFindings, fill: SEVERITY_COLORS.medium },
    { name: 'Low', count: lowFindings, fill: SEVERITY_COLORS.low },
  ]

  const statusClean = projects.filter((p) => p.total_findings === 0).length
  const statusVulnerable = projects.filter((p) => p.total_findings > 0).length

  const projectStatusData = [
    { name: 'Clean', value: statusClean, fill: '#10B981' },
    { name: 'Vulnerable', value: statusVulnerable, fill: '#F43F5E' },
  ].filter((d) => d.value > 0)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Activity size={14} /> Global Security Posture
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Command Center</h1>
          <p className="text-slate-400 text-xs mt-1">
            Aggregated findings across all scanned repositories, AST linters, and secret audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="btn-secondary text-xs inline-flex items-center gap-1.5"
            title="Refresh metrics from backend"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            to="/new-analysis"
            className="btn-primary text-xs inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> New Security Scan
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="card p-5 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Monitored Repos</span>
            <FolderOpen size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {loading ? <div className="h-8 w-16 skeleton" /> : totalProjects}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {totalProjects === 1 ? '1 active workspace' : `${totalProjects} active workspaces`}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card p-5 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Total Findings</span>
            <Bug size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {loading ? <div className="h-8 w-16 skeleton" /> : totalFindings}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Across all scanners
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card p-5 border-rose-500/20 bg-rose-950/5">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Critical Blockers</span>
            <AlertTriangle size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-rose-400 tracking-tight">
            {loading ? <div className="h-8 w-16 skeleton" /> : criticalFindings}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1 font-mono">
            Immediate remediation required
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card p-5 border-amber-500/20 bg-amber-950/5">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">High Severity</span>
            <AlertTriangle size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-amber-400 tracking-tight">
            {loading ? <div className="h-8 w-16 skeleton" /> : highFindings}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1 font-mono">
            High priority triage
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown */}
      {totalProjects > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Severity Distribution Chart (2 cols) */}
          <div className="lg:col-span-2 card p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Vulnerability Severity Spectrum</h3>
                <p className="text-xs text-slate-400">Total detected issues grouped by CVSS severity category</p>
              </div>
              <Link to="/findings" className="text-xs text-indigo-400 hover:text-indigo-300 font-mono">
                View Register →
              </Link>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#F8FAFC',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project Health Status Donut */}
          <div className="card p-6 border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Repository Health Ratio</h3>
              <p className="text-xs text-slate-400">Clean vs vulnerable codebases</p>
            </div>

            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData.length > 0 ? projectStatusData : [{ name: 'None', value: 1, fill: '#334155' }]}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#F8FAFC',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-xs text-slate-400 font-mono block">Scanned</span>
                <span className="text-xl font-bold text-white">{totalProjects}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Clean Repositories
                </span>
                <span>{statusClean}</span>
              </div>
              <div className="flex items-center justify-between text-rose-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" /> Vulnerable Repositories
                </span>
                <span>{statusVulnerable}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Recent Projects Table / Onboarding Empty State */}
      {totalProjects > 0 ? (
        <div className="card p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Active Projects</h3>
              <p className="text-xs text-slate-400">Repositories analyzed in this environment</p>
            </div>
            <Link to="/projects" className="btn-secondary btn-sm text-xs font-mono">
              All Projects ({totalProjects})
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Project Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Total Findings</th>
                  <th className="p-3">Critical</th>
                  <th className="p-3">High</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {projects.slice(0, 5).map((project) => (
                  <tr key={project.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-semibold text-white font-sans">
                      <Link to={`/projects/${project.id}`} className="hover:text-indigo-400 transition-colors">
                        {project.name}
                      </Link>
                      {project.description && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xs font-normal">
                          {project.description}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`badge uppercase text-[10px] ${
                        project.status === 'scanned' ? 'badge-verified' :
                        project.status === 'scanning' ? 'badge-high' : 'badge-neutral'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-200 font-bold">{project.total_findings || 0}</td>
                    <td className="p-3 text-rose-400 font-bold">{project.critical_findings || 0}</td>
                    <td className="p-3 text-amber-400 font-bold">{project.high_findings || 0}</td>
                    <td className="p-3">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-indigo-400 hover:text-indigo-300 text-xs inline-flex items-center gap-1 font-sans"
                      >
                        Inspect <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* First-Time User Onboarding Guide */
        <div className="card p-8 md:p-12 border-slate-800 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/10">
            <Shield size={32} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Welcome to Vibe Shield AI</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              No security scans have run yet. You can launch your first analysis with any Python or JavaScript ZIP repository, or use the pre-packaged vulnerable sample project.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left font-mono text-xs">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="text-indigo-400 font-bold block">1. Demo Sample Available</span>
              <p className="text-slate-400 text-[11px]">Located in <code className="text-slate-200">samples/vulnerable-app.zip</code></p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="text-cyan-400 font-bold block">2. Multi-Engine Scans</span>
              <p className="text-slate-400 text-[11px]">Semgrep, Bandit, Gitleaks, and SCA</p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to="/new-analysis" className="btn-primary text-xs inline-flex items-center gap-2">
              <Plus size={14} /> Start First Security Analysis
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
