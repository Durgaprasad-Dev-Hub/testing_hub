import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, AlertTriangle, Shield, CheckCircle, XCircle,
  FileCode, Brain, Wrench, RefreshCw, Copy, Check, ExternalLink,
  Info, Sparkles, Terminal, ShieldCheck, Tag
} from 'lucide-react'
import { getFinding, explainFinding, generateFix } from '../services/api'
import { useToast } from '../context/ToastContext'

const SEVERITY_BADGE = {
  critical: 'badge-critical',
  high:     'badge-high',
  medium:   'badge-medium',
  low:      'badge-low',
  info:     'badge-info',
}

export default function FindingDetailPage() {
  const { id } = useParams()
  const { addToast } = useToast()

  const [finding, setFinding] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // AI Investigation State
  const [explaining, setExplaining] = useState(false)
  const [aiExplanation, setAiExplanation] = useState(null)
  const [explainError, setExplainError] = useState(null)

  // Fix Proposal State
  const [generatingFix, setGeneratingFix] = useState(false)
  const [fixProposal, setFixProposal] = useState(null)
  const [fixError, setFixError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadFinding()
  }, [id])

  async function loadFinding() {
    setLoading(true)
    setError(null)
    try {
      const data = await getFinding(id)
      setFinding(data)
      if (data.ai_summary) {
        setAiExplanation({
          summary: data.ai_summary,
          source: data.ai_explanation_source || 'AI Security Engine',
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to load finding details.')
    } finally {
      setLoading(false)
    }
  }

  async function handleExplain() {
    setExplaining(true)
    setExplainError(null)
    try {
      const res = await explainFinding(id)
      setAiExplanation({
        summary: res.message || res.explanation || 'AI analysis completed.',
        source: res.ai_provider ? `Provider: ${res.ai_provider}` : 'System Investigation',
        details: res,
      })
      addToast('AI investigation completed', 'success')
    } catch (err) {
      setExplainError(err.message)
      addToast('AI investigation notice: LLM key required', 'warning')
    } finally {
      setExplaining(false)
    }
  }

  async function handleGenerateFix() {
    setGeneratingFix(true)
    setFixError(null)
    try {
      const res = await generateFix(id)
      setFixProposal(res)
      addToast('Patch proposal generated — Human review required', 'info')
    } catch (err) {
      setFixError(err.message)
      addToast(err.message, 'warning')
    } finally {
      setGeneratingFix(false)
    }
  }

  function handleCopySnippet(text) {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    addToast('Snippet copied to clipboard', 'info')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-mono text-xs">Loading finding and AST evidence...</p>
      </div>
    )
  }

  if (error || !finding) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Link to="/findings" className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white">
          <ArrowLeft size={14} /> Back to Findings
        </Link>
        <div className="card p-8 text-center border-rose-500/30">
          <AlertTriangle className="text-rose-400 mx-auto mb-3" size={36} />
          <h2 className="text-lg font-bold text-white mb-1">Finding Not Found</h2>
          <p className="text-xs text-slate-400 mb-4">{error || 'This finding may belong to another project or was resolved.'}</p>
          <button onClick={loadFinding} className="btn-secondary text-xs inline-flex items-center gap-2">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <Link
            to={finding.project_id ? `/projects/${finding.project_id}` : '/findings'}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-indigo-400 mb-2 transition-colors"
          >
            <ArrowLeft size={13} /> Back to {finding.project_id ? 'Project Overview' : 'Findings Register'}
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`badge ${SEVERITY_BADGE[finding.severity] || 'badge-info'} uppercase font-bold text-xs`}>
              {finding.severity}
            </span>
            <span className="badge badge-neutral text-xs font-mono">Category: {finding.category}</span>
            <span className="badge badge-neutral text-xs font-mono">Scanner: {finding.scanner}</span>
            <span className="badge badge-neutral text-xs font-mono">Status: {finding.status}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{finding.title}</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExplain}
            disabled={explaining}
            className="btn-secondary text-xs inline-flex items-center gap-1.5"
          >
            {explaining ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Brain size={14} className="text-indigo-400" />
            )}
            Investigate with AI
          </button>
          <button
            onClick={handleGenerateFix}
            disabled={generatingFix}
            className="btn-primary text-xs inline-flex items-center gap-1.5"
          >
            {generatingFix ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Wrench size={14} />
            )}
            Generate Fix Proposal
          </button>
        </div>
      </div>

      {/* Main Grid: Code / Evidence on left, Classifications on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* File location card */}
          <div className="card p-5 border-slate-800 space-y-3">
            <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-2 font-semibold">
              <FileCode size={14} className="text-indigo-400" /> Target File Location
            </h3>
            <div className="bg-[#050811] p-3 rounded-lg border border-slate-800 flex items-center justify-between font-mono text-xs text-slate-200">
              <span className="truncate">
                {finding.file_path || 'Repository configuration / Package Manifest'}
                {finding.line_start ? ` : Line ${finding.line_start}` : ''}
              </span>
              {finding.file_path && (
                <button
                  onClick={() => handleCopySnippet(`${finding.file_path}:${finding.line_start || 1}`)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                  title="Copy reference"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              )}
            </div>

            {finding.description && (
              <div className="pt-2 text-xs text-slate-300 leading-relaxed font-sans">
                <span className="font-semibold text-slate-400 block mb-1 text-[11px] uppercase font-mono">
                  Scanner Finding Summary
                </span>
                <p>{finding.description}</p>
              </div>
            )}
          </div>

          {/* Code Evidence Terminal */}
          <div className="code-terminal shadow-xl border-slate-800">
            <div className="terminal-header">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-cyan-400" />
                <span className="text-xs font-mono text-slate-300">
                  {finding.file_path || 'code_snippet.txt'}
                </span>
              </div>
              {finding.snippet && (
                <button
                  onClick={() => handleCopySnippet(finding.snippet)}
                  className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  Copy Code
                </button>
              )}
            </div>

            <div className="p-4 md:p-6 overflow-x-auto font-mono text-xs">
              {finding.snippet ? (
                <div className="space-y-1">
                  <div className="text-[11px] text-amber-400 font-semibold mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Flagged line in AST inspection:
                  </div>
                  <pre className="p-3.5 rounded bg-amber-950/20 border border-amber-500/30 text-amber-200/90 leading-relaxed whitespace-pre-wrap">
                    {finding.snippet}
                  </pre>
                  <div className="text-[11px] text-slate-500 pt-2">
                    Triggered by rule: <span className="text-slate-300">{finding.rule_id || 'Static pattern analyzer'}</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs italic">
                  No inline snippet captured by scanner. Check raw tool evidence below.
                </div>
              )}
            </div>

            {/* Evidence items if attached */}
            {finding.evidence && finding.evidence.length > 0 && (
              <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 space-y-3">
                <span className="text-xs font-mono text-slate-400 font-semibold block uppercase">
                  Raw Scanner Records:
                </span>
                {finding.evidence.map((ev, i) => (
                  <div key={i} className="p-3 rounded bg-slate-900 border border-slate-800 font-mono text-[11px]">
                    <span className="text-indigo-400 font-bold block mb-1">[{ev.evidence_type}] {ev.title}</span>
                    <pre className="text-slate-300 whitespace-pre-wrap">{ev.content}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Explanation Result */}
          {(aiExplanation || explainError) && (
            <div className="card p-5 border-indigo-500/30 bg-indigo-950/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">AI Security Root-Cause Analysis</h3>
                </div>
                {aiExplanation?.source && (
                  <span className="badge badge-neutral text-[10px] font-mono">{aiExplanation.source}</span>
                )}
              </div>

              {explainError ? (
                <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded text-xs text-amber-300 font-mono space-y-1">
                  <div className="font-bold">LLM Provider Configuration Required</div>
                  <div>{explainError}</div>
                  <div className="text-slate-400 text-[11px] pt-1">
                    To enable live LLM investigations, set <code className="text-slate-200">LLM_PROVIDER=openai</code> and your API key in <code className="text-slate-200">backend/.env</code>.
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-200 leading-relaxed space-y-2">
                  <p>{aiExplanation.summary}</p>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-indigo-500/20 flex items-center gap-1.5">
                    <Shield size={12} className="text-indigo-400" />
                    AI output is advisory. Review and verify code changes manually before deployment.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fix Proposal Result */}
          {(fixProposal || fixError) && (
            <div className="card p-5 border-cyan-500/30 bg-cyan-950/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench size={16} className="text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">Remediation Patch Proposal</h3>
                </div>
                <span className="badge badge-high text-[10px]">Human Review Required</span>
              </div>

              {fixError ? (
                <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded text-xs text-amber-300 font-mono">
                  {fixError}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-200">{fixProposal?.message}</p>
                  <Link
                    to="/patches"
                    className="btn-cyan btn-sm text-xs inline-flex items-center gap-1.5"
                  >
                    Open Patch Center & Review Unified Diff
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Classifications & Standards */}
        <div className="space-y-6">
          <div className="card p-5 border-slate-800 space-y-4 text-xs font-mono">
            <h3 className="uppercase tracking-wider text-slate-400 font-bold text-[11px]">
              Vulnerability Metadata
            </h3>

            <div>
              <span className="text-slate-400 block mb-1 text-[11px]">Common Weakness (CWE)</span>
              <div className="flex flex-wrap gap-1.5">
                {finding.cwe_ids && finding.cwe_ids.length > 0 ? (
                  finding.cwe_ids.map((cwe) => (
                    <span key={cwe} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold">
                      {cwe}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">None assigned</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1 text-[11px]">Common Vulnerabilities (CVE)</span>
              <div className="flex flex-wrap gap-1.5">
                {finding.cve_ids && finding.cve_ids.length > 0 ? (
                  finding.cve_ids.map((cve) => (
                    <span key={cve} className="px-2 py-0.5 rounded bg-rose-950/50 border border-rose-500/40 text-rose-300 font-bold">
                      {cve}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">None assigned</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1 text-[11px]">Rule Identifier</span>
              <span className="p-2 rounded bg-slate-900 border border-slate-800 block text-slate-300 truncate">
                {finding.rule_id || 'Standard scanner rule'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex justify-between">
                <span>Verification State:</span>
                <span className="text-white capitalize">{finding.verification_status || 'not_verified'}</span>
              </div>
              <div className="flex justify-between">
                <span>Logged At:</span>
                <span className="text-white">
                  {finding.created_at ? new Date(finding.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Safety & Honesty Policy */}
          <div className="card p-5 border-slate-800 bg-slate-950/40 text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Human Approval Guarantee</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Vibe Shield AI adheres to strict <strong>Human-in-the-Loop</strong> principles. Code fixes are never injected or written to production without explicit developer approval and sandbox verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
