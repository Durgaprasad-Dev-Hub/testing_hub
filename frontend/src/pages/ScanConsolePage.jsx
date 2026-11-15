import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, Clock,
  RefreshCw, Terminal, Layers, ShieldCheck, ArrowRight,
  ExternalLink, Bug, FileCode, Check
} from 'lucide-react'
import { getScan, getScanStatus } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function ScanConsolePage() {
  const { id: projectId } = useParams()
  const [searchParams] = useSearchParams()
  const scanId = searchParams.get('scanId')
  const { addToast } = useToast()

  const [scan, setScan] = useState(null)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [polling, setPolling] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const logEndRef = useRef(null)

  useEffect(() => {
    if (!scanId) return

    async function fetchStatus() {
      try {
        const s = await getScanStatus(scanId)
        setStatus(s)
        if (s.status === 'completed' || s.status === 'failed' || s.status === 'cancelled') {
          setPolling(false)
          if (s.status === 'completed') {
            addToast(`Analysis complete: ${s.total_findings || 0} findings detected`, 'success')
          } else if (s.status === 'failed') {
            addToast('Scan failed to complete cleanly', 'error')
          }
        }
      } catch (err) {
        setError(err.message)
        setPolling(false)
      }
    }

    fetchStatus()
    let interval = null
    if (polling) {
      interval = setInterval(fetchStatus, 1500)
    }
    return () => clearInterval(interval)
  }, [scanId, polling])

  // Auto-scroll
  useEffect(() => {
    if (autoScroll) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [status?.events?.length, autoScroll])

  const events = status?.events || []
  const scanStatus = status?.status || 'loading'
  const isRunning = scanStatus === 'running' || scanStatus === 'pending'
  const isDone = scanStatus === 'completed'
  const isFailed = scanStatus === 'failed'

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-indigo-400 mb-2 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Project
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Security Analysis Console</h1>
            <span className={`badge uppercase text-[10px] font-bold ${
              isDone ? 'badge-verified' : isFailed ? 'badge-critical' : 'badge-high'
            }`}>
              {scanStatus}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Scan ID: <span className="text-slate-300">{scanId || 'N/A'}</span>
          </p>
        </div>

        {isDone && (
          <div className="flex items-center gap-2">
            <Link
              to={`/projects/${projectId}`}
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              Project Overview
            </Link>
            <Link
              to={`/findings?project=${projectId}`}
              className="btn-primary text-xs inline-flex items-center gap-1.5"
            >
              <Bug size={14} /> Review Findings ({status?.total_findings || 0})
            </Link>
          </div>
        )}
      </div>

      {/* Real-time Status Card */}
      <div className={`card p-5 border ${
        isDone ? 'border-emerald-500/30 bg-emerald-950/10' :
        isFailed ? 'border-rose-500/30 bg-rose-950/10' : 'border-indigo-500/30 bg-indigo-950/10'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isRunning ? (
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                <RefreshCw size={20} className="text-indigo-400 animate-spin" />
              </div>
            ) : isDone ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-emerald-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <XCircle size={20} className="text-rose-400" />
              </div>
            )}

            <div>
              <h3 className="font-bold text-white text-base">
                {isRunning ? 'Execution in Progress...' : isDone ? 'Security Analysis Complete' : 'Analysis Terminated'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isRunning
                  ? 'Engines are inspecting workspace AST and secret entropy'
                  : isDone
                  ? `Completed execution. Findings recorded: ${status?.total_findings || 0}`
                  : 'Encountered execution failure or cancelled scan'}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          {status && (
            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center min-w-[70px]">
                <span className="text-rose-400 font-bold text-base block">{status.critical_count || 0}</span>
                <span className="text-[10px] text-slate-400 uppercase">Critical</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center min-w-[70px]">
                <span className="text-amber-400 font-bold text-base block">{status.high_count || 0}</span>
                <span className="text-[10px] text-slate-400 uppercase">High</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center min-w-[70px]">
                <span className="text-cyan-400 font-bold text-base block">{status.medium_count || 0}</span>
                <span className="text-[10px] text-slate-400 uppercase">Medium</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terminal Console */}
      <div className="code-terminal shadow-2xl border-slate-800">
        <div className="terminal-header">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-cyan-400 animate-pulse' : isDone ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="text-xs font-mono text-slate-400">
              execution_stream.log — {events.length} events logged
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                autoScroll ? 'bg-slate-800 text-slate-200 border-slate-700' : 'text-slate-500 border-transparent'
              }`}
            >
              Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-4 md:p-6 h-[420px] overflow-y-auto space-y-2 text-xs font-mono">
          {events.length === 0 ? (
            <div className="text-slate-500 italic py-12 text-center">
              Awaiting scanner initialization in sandbox...
            </div>
          ) : (
            events.map((evt, idx) => {
              let levelColor = 'text-slate-300'
              let tagBadge = 'text-slate-500'

              if (evt.level === 'warning') {
                levelColor = 'text-amber-300'
                tagBadge = 'text-amber-400 font-bold'
              } else if (evt.level === 'error') {
                levelColor = 'text-rose-400'
                tagBadge = 'text-rose-400 font-bold'
              } else if (evt.level === 'success') {
                levelColor = 'text-emerald-300'
                tagBadge = 'text-emerald-400 font-bold'
              }

              return (
                <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-slate-600 shrink-0 text-[11px]">
                    {evt.created_at ? new Date(evt.created_at).toLocaleTimeString() : `[#${idx + 1}]`}
                  </span>
                  <span className={`uppercase text-[10px] shrink-0 font-bold ${tagBadge}`}>
                    [{evt.stage || 'EXEC'}]
                  </span>
                  <span className={levelColor}>{evt.message}</span>
                </div>
              )
            })
          )}
          <div ref={logEndRef} />
        </div>

        {/* Honest Scanners Run vs Skipped Disclosure */}
        {isDone && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="text-slate-400">
              <span className="text-slate-500 block text-[10px] uppercase">Engine Execution Transparency:</span>
              <span>Engines Run: <strong className="text-emerald-400">{status?.scanners_run?.join(', ') || 'None'}</strong></span>
              {status?.scanners_failed?.length > 0 && (
                <span className="ml-3 text-slate-500">
                  Skipped / Missing: <strong className="text-slate-400">{status.scanners_failed.join(', ')}</strong>
                </span>
              )}
            </div>

            <Link
              to={`/findings?project=${projectId}`}
              className="btn-primary text-xs inline-flex items-center gap-1.5"
            >
              Explore Detected Findings <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
