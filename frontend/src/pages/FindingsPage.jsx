import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, Search, Filter, ChevronDown, Bug,
  FileCode, ArrowRight, RefreshCw, FolderOpen, Shield,
  Layers, ExternalLink
} from 'lucide-react'
import { listFindings, listProjects } from '../services/api'

export default function FindingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const projectParam = searchParams.get('project')

  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(projectParam || '')
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [scannerFilter, setScannerFilter] = useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const data = await listProjects({ page_size: 50 })
      const items = data.items || []
      setProjects(items)
      if (!selectedProjectId && items.length > 0) {
        setSelectedProjectId(items[0].id)
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }

  useEffect(() => {
    if (selectedProjectId) {
      loadFindings()
    } else {
      setLoading(false)
    }
  }, [selectedProjectId, severityFilter, scannerFilter, searchQuery])

  async function loadFindings() {
    if (!selectedProjectId) return
    setLoading(true)
    setError(null)
    try {
      const params = { page: 1, page_size: 50 }
      if (severityFilter) params.severity = severityFilter
      if (scannerFilter) params.scanner = scannerFilter
      if (searchQuery.trim()) params.search = searchQuery.trim()

      const data = await listFindings(selectedProjectId, params)
      setFindings(data.items || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to fetch findings.')
    } finally {
      setLoading(false)
    }
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Bug size={14} /> Vulnerability Register
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Findings Explorer</h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic detections from static AST rules, secret entropy analysis, and CVE databases.
          </p>
        </div>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-slate-400 hidden sm:inline">Scope:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value)
              setSearchParams({ project: e.target.value })
            }}
            className="input-field text-xs bg-slate-900 border-slate-700 py-2 px-3 font-mono"
          >
            {projects.length === 0 ? (
              <option value="">No projects available</option>
            ) : (
              projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.total_findings || 0} issues)
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, rule ID, or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 text-xs font-mono w-full"
            />
          </div>

          {/* Scanner Filter */}
          <select
            value={scannerFilter}
            onChange={(e) => setScannerFilter(e.target.value)}
            className="input-field md:w-48 text-xs bg-slate-900 border-slate-700 font-mono"
          >
            <option value="">All Scanners</option>
            <option value="semgrep">Semgrep</option>
            <option value="bandit">Bandit</option>
            <option value="gitleaks">Gitleaks</option>
            <option value="pip-audit">pip-audit</option>
            <option value="npm-audit">npm audit</option>
          </select>
        </div>

        {/* Severity Quick Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80 text-xs font-mono">
          <span className="text-slate-500 text-[11px] mr-1">Severity:</span>
          {[
            { id: '', label: 'All', count: total },
            { id: 'critical', label: 'Critical', color: 'badge-critical' },
            { id: 'high', label: 'High', color: 'badge-high' },
            { id: 'medium', label: 'Medium', color: 'badge-medium' },
            { id: 'low', label: 'Low', color: 'badge-low' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setSeverityFilter(btn.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                severityFilter === btn.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Table */}
      <div className="card border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-mono">Loading vulnerability register...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 font-mono text-xs">
            {error}
          </div>
        ) : findings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Bug size={36} className="text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Findings Detected</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No matching vulnerability findings found for this project and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Title & Rule</th>
                  <th className="p-3.5">File Location</th>
                  <th className="p-3.5">Scanner</th>
                  <th className="p-3.5">Classification</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {findings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5">
                      <span className={`badge uppercase text-[10px] font-bold ${
                        f.severity === 'critical' ? 'badge-critical' :
                        f.severity === 'high' ? 'badge-high' :
                        f.severity === 'medium' ? 'badge-medium' : 'badge-low'
                      }`}>
                        {f.severity}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans">
                      <Link
                        to={`/findings/${f.id}`}
                        className="font-semibold text-white hover:text-indigo-400 transition-colors block text-xs"
                      >
                        {f.title}
                      </Link>
                      {f.rule_id && (
                        <span className="text-[10px] font-mono text-slate-500">{f.rule_id}</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <div className="truncate max-w-[220px]" title={f.file_path}>
                        {f.file_path || 'Repository root'}
                      </div>
                      {f.line_start && (
                        <span className="text-[10px] text-slate-500">Line: {f.line_start}</span>
                      )}
                    </td>
                    <td className="p-3.5 text-cyan-400 font-semibold">{f.scanner}</td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {f.cwe_ids?.slice(0, 1).map((cwe) => (
                          <span key={cwe} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {cwe}
                          </span>
                        ))}
                        {f.cve_ids?.slice(0, 1).map((cve) => (
                          <span key={cve} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-500/30">
                            {cve}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-sans">
                      <Link
                        to={`/findings/${f.id}`}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        Inspect <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
