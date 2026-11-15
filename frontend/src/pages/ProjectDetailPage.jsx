import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Play, Upload, AlertTriangle, FileText,
  Clock, CheckCircle, XCircle, RefreshCw, FolderOpen,
  Bug, ExternalLink, ShieldCheck, ArrowRight
} from 'lucide-react'
import { getProject, listProjectScans, listFindings } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [project, setProject] = useState(null)
  const [scans, setScans] = useState([])
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadAll()
  }, [id])

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [proj, scansData, findingsData] = await Promise.all([
        getProject(id),
        listProjectScans(id),
        listFindings(id, { page_size: 20 }),
      ])
      setProject(proj)
      setScans(scansData)
      setFindings(findingsData.items || [])
    } catch (err) {
      setError(err.message)
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400 font-mono">Loading workspace details...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white">
          <ArrowLeft size={14} /> Back to Projects
        </Link>
        <div className="card p-8 text-center border-rose-500/30">
          <AlertTriangle className="text-rose-400 mx-auto mb-3" size={36} />
          <h2 className="text-lg font-bold text-white mb-1">Project Not Found</h2>
          <p className="text-xs text-slate-400 mb-4">{error || 'This project record does not exist.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-indigo-400 mb-2 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Projects
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
            <span className={`badge uppercase text-[10px] ${
              project.status === 'scanned' ? 'badge-verified' :
              project.status === 'scanning' ? 'badge-high' : 'badge-neutral'
            }`}>
              {project.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {project.description || 'Workspace created for static code analysis.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/reports?project=${project.id}`}
            className="btn-secondary text-xs inline-flex items-center gap-1.5"
          >
            <FileText size={14} /> Audit Report
          </Link>
          <Link
            to="/new-analysis"
            className="btn-primary text-xs inline-flex items-center gap-1.5"
          >
            <Play size={14} /> Run New Scan
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="card p-4 border-slate-800 space-y-1">
          <span className="text-slate-400 uppercase text-[10px]">Total Findings</span>
          <span className="text-2xl font-bold text-white block">{project.total_findings || 0}</span>
          <span className="text-slate-500 text-[11px]">Across all runs</span>
        </div>
        <div className="card p-4 border-rose-500/20 bg-rose-950/5 space-y-1">
          <span className="text-rose-400 uppercase text-[10px]">Critical</span>
          <span className="text-2xl font-bold text-rose-400 block">{project.critical_findings || 0}</span>
          <span className="text-rose-400/70 text-[11px]">CVSS 9.0+ severity</span>
        </div>
        <div className="card p-4 border-amber-500/20 bg-amber-950/5 space-y-1">
          <span className="text-amber-400 uppercase text-[10px]">High</span>
          <span className="text-2xl font-bold text-amber-400 block">{project.high_findings || 0}</span>
          <span className="text-amber-400/70 text-[11px]">High risk issues</span>
        </div>
        <div className="card p-4 border-slate-800 space-y-1">
          <span className="text-slate-400 uppercase text-[10px]">Execution Runs</span>
          <span className="text-2xl font-bold text-cyan-400 block">{scans.length}</span>
          <span className="text-slate-500 text-[11px]">Recorded scans</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          Recent Findings ({findings.length})
        </button>
        <button
          onClick={() => setActiveTab('scans')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'scans'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          Scan Execution History ({scans.length})
        </button>
      </div>

      {/* Tab 1: Findings */}
      {activeTab === 'overview' && (
        <div className="card border-slate-800 overflow-hidden">
          {findings.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Bug size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">No vulnerabilities recorded for this project.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Title & Rule</th>
                    <th className="p-3">File Location</th>
                    <th className="p-3">Scanner</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {findings.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-900/50">
                      <td className="p-3">
                        <span className={`badge uppercase text-[10px] font-bold ${
                          f.severity === 'critical' ? 'badge-critical' :
                          f.severity === 'high' ? 'badge-high' : 'badge-medium'
                        }`}>
                          {f.severity}
                        </span>
                      </td>
                      <td className="p-3 font-sans">
                        <Link to={`/findings/${f.id}`} className="font-semibold text-white hover:text-indigo-400">
                          {f.title}
                        </Link>
                        {f.rule_id && (
                          <span className="text-[10px] text-slate-500 block font-mono">{f.rule_id}</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">
                        {f.file_path || 'Repository root'}
                        {f.line_start ? ` : ${f.line_start}` : ''}
                      </td>
                      <td className="p-3 text-cyan-400">{f.scanner}</td>
                      <td className="p-3 text-right font-sans">
                        <Link
                          to={`/findings/${f.id}`}
                          className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          Inspect <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Scans History */}
      {activeTab === 'scans' && (
        <div className="card border-slate-800 overflow-hidden">
          {scans.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">No scan runs recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Scan ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Engines Run</th>
                    <th className="p-3">Findings</th>
                    <th className="p-3">Completed At</th>
                    <th className="p-3 text-right">Console</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {scans.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/50">
                      <td className="p-3 text-slate-300 truncate max-w-[120px]">{s.id}</td>
                      <td className="p-3">
                        <span className={`badge uppercase text-[10px] ${
                          s.status === 'completed' ? 'badge-verified' :
                          s.status === 'failed' ? 'badge-critical' : 'badge-high'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 text-emerald-400">
                        {s.scanners_run?.join(', ') || 'None'}
                      </td>
                      <td className="p-3 font-bold text-white">{s.total_findings}</td>
                      <td className="p-3 text-slate-400">
                        {s.completed_at ? new Date(s.completed_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-3 text-right font-sans">
                        <Link
                          to={`/projects/${project.id}/scan?scanId=${s.id}`}
                          className="btn-secondary btn-sm text-xs inline-flex items-center gap-1 font-mono"
                        >
                          View Console
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
