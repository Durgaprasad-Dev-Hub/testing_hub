import React, { useState, useEffect } from 'react'
import {
  FileText, Download, Shield, AlertTriangle, CheckCircle,
  XCircle, Filter, RefreshCw, Printer, Info, ExternalLink,
  ShieldCheck, FileSpreadsheet, FileJson
} from 'lucide-react'
import { listProjects, getProjectReport } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function ReportsPage() {
  const { addToast } = useToast()
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      loadReport(selectedProjectId)
    }
  }, [selectedProjectId])

  async function loadProjects() {
    try {
      const data = await listProjects({ page_size: 50 })
      const items = data.items || []
      setProjects(items)
      if (items.length > 0) {
        setSelectedProjectId(items[0].id)
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }

  async function loadReport(projectId) {
    setLoading(true)
    setError(null)
    try {
      const data = await getProjectReport(projectId, 'json')
      setReport(data)
    } catch (err) {
      setError(err.message || 'Failed to load report for the selected project.')
    } finally {
      setLoading(false)
    }
  }

  async function downloadCsv() {
    if (!selectedProjectId) return
    setDownloading(true)
    try {
      const url = `/api/v1/projects/${selectedProjectId}/report?format=csv`
      const a = document.createElement('a')
      a.href = url
      a.download = `vibe_shield_report_${selectedProjectId}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      addToast('CSV audit report downloaded successfully', 'success')
    } catch (err) {
      addToast('Download error: ' + err.message, 'error')
    } finally {
      setDownloading(false)
    }
  }

  function downloadJson() {
    if (!report) return
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2))
    const dlAnchor = document.createElement('a')
    dlAnchor.setAttribute('href', dataStr)
    dlAnchor.setAttribute('download', `vibe_shield_audit_${report.project?.name || 'project'}.json`)
    dlAnchor.click()
    addToast('JSON audit report exported', 'success')
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider mb-1">
            <FileText size={14} /> Audit & Governance
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Posture Audit Reports</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable records of static AST findings, secret audits, and post-remediation verification logs.
          </p>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="input-field text-xs bg-slate-900 border-slate-700 py-2 px-3 font-mono"
          >
            {projects.length === 0 ? (
              <option value="">No projects available</option>
            ) : (
              projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))
            )}
          </select>

          <button
            onClick={downloadJson}
            disabled={!report || loading}
            className="btn-secondary text-xs inline-flex items-center gap-1.5"
            title="Download formatted JSON report"
          >
            <FileJson size={14} /> Export JSON
          </button>

          <button
            onClick={downloadCsv}
            disabled={!selectedProjectId || loading || downloading}
            className="btn-primary text-xs inline-flex items-center gap-1.5"
            title="Download CSV spreadsheet"
          >
            <FileSpreadsheet size={14} /> Export CSV
          </button>

          <button
            onClick={() => window.print()}
            disabled={!report || loading}
            className="btn-secondary text-xs inline-flex items-center gap-1.5"
            title="Print or Save as PDF"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-16 text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-mono">Compiling compliance audit report from backend...</p>
        </div>
      )}

      {error && !loading && (
        <div className="card p-6 border-rose-500/30 text-center space-y-3">
          <AlertTriangle className="text-rose-400 mx-auto" size={32} />
          <h3 className="text-base font-bold text-white">Report Generation Error</h3>
          <p className="text-xs text-slate-400 font-mono">{error}</p>
          <button
            onClick={() => loadReport(selectedProjectId)}
            className="btn-secondary text-xs inline-flex items-center gap-2"
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {report && !loading && (
        <div className="space-y-6">
          {/* Executive Scorecard */}
          <div className="card p-6 border-slate-800 bg-gradient-to-r from-[#0C1222] to-slate-900/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="badge badge-verified text-[10px] uppercase font-mono mb-2">
                  Audit Validated
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">{report.project?.name}</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  {report.project?.description || 'Repository security report generated from isolated scanner sandboxes.'}
                </p>
              </div>

              {/* Severity Counts */}
              <div className="flex items-center gap-3 font-mono">
                <div className="text-center p-3 rounded-xl bg-slate-950/80 border border-rose-500/30 min-w-[70px]">
                  <span className="text-xl font-bold text-rose-400 block">{report.summary?.critical || 0}</span>
                  <span className="text-[10px] uppercase text-slate-400">Critical</span>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 min-w-[70px]">
                  <span className="text-xl font-bold text-amber-400 block">{report.summary?.high || 0}</span>
                  <span className="text-[10px] uppercase text-slate-400">High</span>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-950/80 border border-yellow-500/30 min-w-[70px]">
                  <span className="text-xl font-bold text-yellow-400 block">{report.summary?.medium || 0}</span>
                  <span className="text-[10px] uppercase text-slate-400">Medium</span>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-950/80 border border-blue-500/30 min-w-[70px]">
                  <span className="text-xl font-bold text-blue-400 block">{report.summary?.low || 0}</span>
                  <span className="text-[10px] uppercase text-slate-400">Low</span>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-start gap-2 text-xs text-slate-400 font-mono">
              <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
              <span>{report.disclaimer}</span>
            </div>
          </div>

          {/* Scans Execution Log */}
          <div className="card p-6 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">
              Recorded Execution Runs ({report.scans?.length || 0})
            </h3>
            {report.scans && report.scans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Scan ID</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Engines Executed</th>
                      <th className="p-3">Skipped / Missing</th>
                      <th className="p-3">Findings</th>
                      <th className="p-3">Completed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {report.scans.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/40">
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
                        <td className="p-3 text-slate-500">
                          {s.scanners_failed?.join(', ') || 'None'}
                        </td>
                        <td className="p-3 font-bold text-white">{s.total_findings}</td>
                        <td className="p-3 text-slate-400">
                          {s.completed_at ? new Date(s.completed_at).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-xs italic">No execution runs recorded for this project.</p>
            )}
          </div>

          {/* Vulnerability Evidence Register */}
          <div className="card p-6 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">
              Vulnerability Evidence Register ({report.findings?.length || 0})
            </h3>
            {report.findings && report.findings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Title & Rule</th>
                      <th className="p-3">File Location</th>
                      <th className="p-3">Scanner</th>
                      <th className="p-3">Classification</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {report.findings.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-900/40">
                        <td className="p-3">
                          <span className={`badge uppercase text-[10px] font-bold ${
                            f.severity === 'critical' ? 'badge-critical' :
                            f.severity === 'high' ? 'badge-high' :
                            f.severity === 'medium' ? 'badge-medium' : 'badge-low'
                          }`}>
                            {f.severity}
                          </span>
                        </td>
                        <td className="p-3 font-sans">
                          <div className="font-semibold text-white">{f.title}</div>
                          <div className="text-[10px] font-mono text-slate-500">{f.rule_id}</div>
                        </td>
                        <td className="p-3 text-slate-300">
                          <div className="truncate max-w-[200px]" title={f.file_path}>
                            {f.file_path || 'Repository root'}
                          </div>
                          {f.line_start && (
                            <span className="text-[10px] text-slate-500">Line: {f.line_start}</span>
                          )}
                        </td>
                        <td className="p-3 text-cyan-400 font-semibold">{f.scanner}</td>
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5">
                            {f.cwe_ids?.slice(0, 1).map((cwe) => (
                              <span key={cwe} className="text-[10px] text-slate-300">{cwe}</span>
                            ))}
                            {f.cve_ids?.slice(0, 1).map((cve) => (
                              <span key={cve} className="text-[10px] text-rose-400">{cve}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 capitalize text-slate-300 font-sans">{f.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs">No vulnerabilities recorded or scan has not run yet.</p>
              </div>
            )}
          </div>

          {/* Academic Transparency Statement */}
          <div className="card p-6 border-slate-800 bg-slate-950/40 space-y-3 font-mono text-xs">
            <h3 className="uppercase tracking-wider text-slate-400 font-bold text-[11px] flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" /> Platform Limitations & Transparency Notice
            </h3>
            <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
              {report.known_limitations?.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
