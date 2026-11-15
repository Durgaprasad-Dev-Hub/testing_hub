import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileArchive, X, CheckCircle, AlertCircle, Plus, Play,
  Shield, Check, ArrowRight, Sparkles, Terminal, FileCode, Info
} from 'lucide-react'
import { createProject, uploadSource, startScan } from '../services/api'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'

const SCANNER_OPTIONS = [
  { id: 'semgrep',     label: 'Semgrep',    desc: 'Polyglot AST static security rules',      category: 'SAST' },
  { id: 'bandit',      label: 'Bandit',     desc: 'Python-specific security flaw linter',    category: 'SAST' },
  { id: 'gitleaks',    label: 'Gitleaks',   desc: 'Hardcoded secret & credential audit',    category: 'Secrets' },
  { id: 'osv-scanner', label: 'OSV-Scanner', desc: 'Open-source dependency CVE analysis',    category: 'SCA' },
  { id: 'npm-audit',   label: 'npm audit',  desc: 'Node.js package supply-chain security', category: 'SCA' },
]

export default function NewAnalysisPage() {
  const navigate = useNavigate()
  const { health } = useApp()
  const { addToast } = useToast()

  const [step, setStep] = useState(1) // 1: Project Details, 2: Upload Source, 3: Engine Selection
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [project, setProject] = useState(null)

  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const [scanners, setScanners] = useState(['semgrep', 'bandit', 'gitleaks', 'osv-scanner', 'npm-audit'])
  const [aiInvestigation, setAiInvestigation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)

  // Step 1: Create Project Record
  async function handleCreateProject(e) {
    if (e) e.preventDefault()
    if (!projectName.trim()) return

    setLoading(true)
    setError(null)
    try {
      const p = await createProject({
        name: projectName.trim(),
        description: projectDesc.trim() || undefined,
      })
      setProject(p)
      addToast(`Project "${p.name}" initialized`, 'success')
      setStep(2)
    } catch (err) {
      setError(err.message)
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Handle File Drop
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      if (!dropped.name.endsWith('.zip')) {
        setError('Only .zip archives are supported for sandbox extraction.')
        return
      }
      setFile(dropped)
      setError(null)
    }
  }, [])

  // Quick Demo: Load local vulnerable demo zip
  async function loadDemoSample() {
    try {
      setLoading(true)
      const res = await fetch('/samples/vulnerable-app.zip')
      if (!res.ok) {
        // Fallback: create mock named file object
        const mockFile = new File(['mock content'], 'vulnerable-app.zip', { type: 'application/zip' })
        setFile(mockFile)
        addToast('Loaded demo sample package', 'info')
        return
      }
      const blob = await res.blob()
      const demoFile = new File([blob], 'vulnerable-app.zip', { type: 'application/zip' })
      setFile(demoFile)
      addToast('Loaded demo sample: vulnerable-app.zip', 'success')
    } catch (err) {
      addToast('Please select samples/vulnerable-app.zip from your file picker', 'info')
      document.getElementById('zip-input')?.click()
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Upload File to Backend
  async function handleUpload() {
    if (!file || !project) return
    setUploading(true)
    setError(null)
    try {
      await uploadSource(project.id, file, setProgress)
      addToast('ZIP archive verified and extracted safely', 'success')
      setStep(3)
    } catch (err) {
      setError(err.message)
      addToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  // Step 3: Trigger Scan
  async function handleStartScan() {
    if (!project) return
    setLoading(true)
    setError(null)
    try {
      const scan = await startScan(project.id, {
        scanners: scanners,
        ai_investigation: aiInvestigation,
      })
      addToast('Security analysis initiated', 'success')
      navigate(`/projects/${project.id}/scan?scanId=${scan.id}`)
    } catch (err) {
      setError(err.message)
      addToast(err.message, 'error')
      setLoading(false)
    }
  }

  const toggleScanner = (id) => {
    setScanners((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const availableScanners = health?.scanners || {}

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      {/* Wizard Header */}
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold block mb-1">
          Analysis Wizard
        </span>
        <h1 className="text-2xl font-bold text-white tracking-tight">Configure New Security Scan</h1>
        <p className="text-xs text-slate-400 mt-1">
          Extract and analyze source code in an isolated sandbox with path-traversal protection.
        </p>
      </div>

      {/* Step Indicator Bar */}
      <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-5 text-xs font-mono">
        {[
          { n: 1, label: '1. Repository Identity' },
          { n: 2, label: '2. Sandbox Archive' },
          { n: 3, label: '3. Engine Selection' },
        ].map((s) => (
          <div
            key={s.n}
            className={`flex items-center gap-2 pb-1 border-b-2 transition-colors ${
              step === s.n
                ? 'border-indigo-500 text-indigo-300 font-bold'
                : step > s.n
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400'
            }`}
          >
            {step > s.n ? <Check size={14} className="text-emerald-400" /> : <span>[{s.n}]</span>}
            <span className="truncate">{s.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-mono">{error}</div>
        </div>
      )}

      {/* STEP 1: Repository Identity */}
      {step === 1 && (
        <form onSubmit={handleCreateProject} className="card p-6 md:p-8 space-y-5 border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Repository Identity</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify a project identifier to track scan histories and compliance audit trails.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Project Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., enterprise-auth-service"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Description & Target Scope (Optional)
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="e.g., Microservice handling JWT auth and database queries, reviewed prior to release"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading || !projectName.trim()}
              className="btn-primary text-xs inline-flex items-center gap-2"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight size={14} />
              )}
              Continue to Upload
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Safe Archive Upload */}
      {step === 2 && (
        <div className="card p-6 md:p-8 space-y-6 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Upload Source Code Archive</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Project: <span className="text-indigo-400 font-mono font-semibold">{project?.name}</span>
              </p>
            </div>
            <button
              onClick={loadDemoSample}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 border border-cyan-500/30 px-2.5 py-1 rounded bg-cyan-950/20"
              title="Loads the sample vulnerable application"
            >
              <Sparkles size={12} /> Load Demo Vulnerable App
            </button>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !file && document.getElementById('zip-input')?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragging
                ? 'border-indigo-500 bg-indigo-950/20'
                : file
                ? 'border-emerald-500/60 bg-emerald-950/10'
                : 'border-slate-700 bg-slate-950/50 hover:border-slate-500'
            }`}
          >
            <input
              id="zip-input"
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={36} className="text-emerald-400 mb-1" />
                <span className="font-mono font-bold text-white text-sm">{file.name}</span>
                <span className="text-xs text-slate-400 font-mono">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-mono mt-2"
                >
                  Remove & Choose Another
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400 mb-1">
                  <FileArchive size={24} />
                </div>
                <div className="font-semibold text-white text-sm">
                  Drag and drop your project ZIP here
                </div>
                <div className="text-xs text-slate-400">
                  or click to browse filesystem · Max 100 MB
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Verifying and extracting archive...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-indigo-500 h-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary text-xs"
              disabled={uploading}
            >
              Back
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn-primary text-xs inline-flex items-center gap-2"
            >
              {uploading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              Upload & Verify Sandbox
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Engine Selection */}
      {step === 3 && (
        <div className="card p-6 md:p-8 space-y-6 border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Select Security Scanning Engines</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Engines run asynchronously inside your extracted workspace sandbox.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SCANNER_OPTIONS.map((opt) => {
              const availability = availableScanners[opt.id]
              const isAvailable = availability?.available
              const isSelected = scanners.includes(opt.id)

              return (
                <div
                  key={opt.id}
                  onClick={() => toggleScanner(opt.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/20 border-indigo-500/60 shadow-md shadow-indigo-500/5'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{opt.label}</span>
                      <span className="badge badge-neutral text-[9px] font-mono">{opt.category}</span>
                    </div>

                    <span className={`badge uppercase text-[9px] font-mono ${
                      isAvailable ? 'badge-verified' : 'badge-neutral'
                    }`}>
                      {isAvailable ? 'Ready' : 'Not Detected'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{opt.desc}</p>
                </div>
              )
            })}
          </div>

          {/* AI Investigation Option */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs">Assistive AI Root Cause Analysis</span>
                <span className="badge badge-neutral text-[9px] font-mono">Optional</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                When enabled with an LLM provider key, AI examines finding evidence to explain exploit scenarios and draft fix proposals.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAiInvestigation(!aiInvestigation)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors shrink-0 ${
                aiInvestigation
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {aiInvestigation ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="btn-secondary text-xs"
              disabled={loading}
            >
              Back
            </button>
            <button
              onClick={handleStartScan}
              disabled={loading || scanners.length === 0}
              className="btn-primary text-xs inline-flex items-center gap-2"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play size={14} />
              )}
              Start Security Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
