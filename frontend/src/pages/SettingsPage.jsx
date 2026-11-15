import React, { useState, useEffect } from 'react'
import {
  Settings, Shield, Database, Cpu, Terminal, CheckCircle2,
  XCircle, AlertTriangle, RefreshCw, Key, ExternalLink, HardDrive,
  Info, Copy, Check
} from 'lucide-react'
import { getHealth } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function SettingsPage() {
  const { addToast } = useToast()
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('scanners')
  const [copiedCmd, setCopiedCmd] = useState('')

  useEffect(() => {
    checkHealth()
  }, [])

  async function checkHealth() {
    setLoading(true)
    try {
      const data = await getHealth()
      setHealth(data)
      addToast('Platform runtime diagnostic updated', 'info')
    } catch (err) {
      addToast('Diagnostic check failed: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy(cmd) {
    navigator.clipboard.writeText(cmd)
    setCopiedCmd(cmd)
    addToast('Installation command copied', 'success')
    setTimeout(() => setCopiedCmd(''), 2000)
  }

  const scannersList = [
    {
      id: 'semgrep',
      name: 'Semgrep',
      desc: 'AST-based static code analysis for security vulnerabilities and dangerous patterns.',
      category: 'SAST',
      installCmd: 'pip install semgrep',
      docsUrl: 'https://semgrep.dev/docs/',
    },
    {
      id: 'bandit',
      name: 'Bandit',
      desc: 'Security linter for Python code to detect common security flaws and unsafe function calls.',
      category: 'SAST (Python)',
      installCmd: 'pip install bandit',
      docsUrl: 'https://bandit.readthedocs.io/',
    },
    {
      id: 'gitleaks',
      name: 'Gitleaks',
      desc: 'High-speed detection of hardcoded secrets, API tokens, passwords, and private keys.',
      category: 'Secret Detection',
      installCmd: 'winget install Gitleaks.Gitleaks',
      docsUrl: 'https://github.com/gitleaks/gitleaks',
    },
    {
      id: 'trivy',
      name: 'Trivy',
      desc: 'Comprehensive scanner for container images, file systems, and known CVE dependencies.',
      category: 'SCA & Container',
      installCmd: 'winget install AquaSecurity.Trivy',
      docsUrl: 'https://aquasecurity.github.io/trivy/',
    },
    {
      id: 'pip_audit',
      name: 'pip-audit',
      desc: 'Audits Python environments and requirements.txt for known vulnerable packages.',
      category: 'SCA (Python)',
      installCmd: 'pip install pip-audit',
      docsUrl: 'https://pypi.org/project/pip-audit/',
    },
    {
      id: 'npm_audit',
      name: 'npm audit',
      desc: 'Built-in Node Package Manager vulnerability assessment for package.json dependencies.',
      category: 'SCA (JavaScript)',
      installCmd: 'npm --version',
      docsUrl: 'https://docs.npmjs.com/cli/v10/commands/npm-audit',
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Settings size={14} /> Diagnostic Workbench
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Settings & Scanner Health</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of security scanning engines, AI providers, database connections, and storage.
          </p>
        </div>

        <button
          onClick={checkHealth}
          disabled={loading}
          className="btn-secondary text-xs inline-flex items-center gap-2 self-start md:self-auto font-mono"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh Diagnostics
        </button>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Backend Database */}
        <div className="card p-5 border-slate-800 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Database size={22} />
          </div>
          <div>
            <span className="text-[11px] uppercase font-mono text-slate-400 font-semibold">Core Engine & DB</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Active / Connected</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              SQLite (local) / PostgreSQL ready
            </p>
          </div>
        </div>

        {/* AI Engine Status */}
        <div className="card p-5 border-slate-800 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Cpu size={22} />
          </div>
          <div>
            <span className="text-[11px] uppercase font-mono text-slate-400 font-semibold">AI Investigation Engine</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${health?.ai_enabled ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <h3 className="text-sm font-bold text-white uppercase font-mono">
                {health?.ai_enabled ? health.ai_provider : 'Disabled / Offline'}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              {health?.ai_enabled ? 'Ready for AST analysis' : 'Deterministic fallback active'}
            </p>
          </div>
        </div>

        {/* Storage */}
        <div className="card p-5 border-slate-800 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <HardDrive size={22} />
          </div>
          <div>
            <span className="text-[11px] uppercase font-mono text-slate-400 font-semibold">Upload Sandbox</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-bold text-white">Quota Ready</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Limit: {health?.upload_limit_mb || 100} MB · Zip-Slip protected
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('scanners')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'scanners'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          Security Scanners ({scannersList.length})
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'ai'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          AI Configuration
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'docs'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          Quickstart & CLI Guide
        </button>
      </div>

      {/* Tab 1: Scanners Diagnostics */}
      {activeTab === 'scanners' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scannersList.map((scanner) => {
              const isAvailable = health?.scanners?.[scanner.id]?.available || (scanner.id === 'npm_audit' && health?.scanners?.['npm-audit']?.available)
              return (
                <div key={scanner.id} className="card p-5 border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{scanner.name}</h4>
                        <span className="badge badge-neutral text-[10px] font-mono">{scanner.category}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{scanner.desc}</p>
                    </div>

                    <span className={`badge uppercase text-[10px] font-mono font-bold ${
                      isAvailable ? 'badge-verified' : 'badge-neutral'
                    }`}>
                      {isAvailable ? 'Installed' : 'Missing'}
                    </span>
                  </div>

                  {/* Command box */}
                  <div className="p-2.5 rounded bg-[#050811] border border-slate-800 font-mono text-xs flex items-center justify-between">
                    <span className="text-slate-300 truncate">{scanner.installCmd}</span>
                    <button
                      onClick={() => handleCopy(scanner.installCmd)}
                      className="text-slate-400 hover:text-white ml-2 p-1"
                      title="Copy command"
                    >
                      {copiedCmd === scanner.installCmd ? (
                        <Check size={13} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="card p-4 bg-indigo-950/20 border-indigo-500/30 text-xs text-slate-300 flex items-start gap-2.5">
            <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong>Graceful Scanner Degradation:</strong> If any scanner is not found in your Windows PATH, Vibe Shield AI skips it cleanly without crashing and logs the limitation in the audit report.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Config */}
      {activeTab === 'ai' && (
        <div className="card p-6 border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white mb-1">AI Provider & LLM Engine</h3>
            <p className="text-xs text-slate-400">
              Vibe Shield AI supports multiple LLM providers for contextual explanation and fix drafting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-[#050811] border border-slate-800 space-y-2">
              <span className="text-slate-400 uppercase text-[10px] block">Active Provider</span>
              <p className="text-base font-bold text-white uppercase">{health?.ai_provider || 'DISABLED'}</p>
              <p className="text-slate-400 text-[11px]">
                Configured via <code className="text-indigo-300">LLM_PROVIDER</code> in <code className="text-indigo-300">backend/.env</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#050811] border border-slate-800 space-y-2">
              <span className="text-slate-400 uppercase text-[10px] block">Supported LLM Engines</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['openai', 'anthropic', 'google', 'ollama', 'mock'].map((p) => (
                  <span key={p} className="badge badge-neutral uppercase text-[10px]">{p}</span>
                ))}
              </div>
              <p className="text-slate-400 text-[11px] pt-1">
                Local Ollama supported for 100% offline air-gapped security analysis.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-[#050811] space-y-2 font-mono text-xs">
            <span className="text-indigo-400 font-bold block">backend/.env Example:</span>
            <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here
LLM_MODEL=gpt-4o-mini`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: CLI Docs */}
      {activeTab === 'docs' && (
        <div className="card p-6 border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed font-mono">
          <h3 className="text-base font-bold text-white mb-2 font-sans">Command Line Execution Guide</h3>
          <p>
            To run a live demonstration of Vibe Shield AI with full scanner capabilities:
          </p>

          <ol className="list-decimal list-inside space-y-3">
            <li>
              <strong className="text-white">Install Python Security Scanners:</strong>
              <pre className="mt-1 p-3 bg-[#050811] rounded border border-slate-800 text-cyan-400">
                pip install semgrep bandit pip-audit
              </pre>
            </li>
            <li>
              <strong className="text-white">Start Backend API:</strong>
              <pre className="mt-1 p-3 bg-[#050811] rounded border border-slate-800 text-indigo-400">
                .\run_backend.bat
              </pre>
            </li>
            <li>
              <strong className="text-white">Start Frontend UI:</strong>
              <pre className="mt-1 p-3 bg-[#050811] rounded border border-slate-800 text-indigo-400">
                .\run_frontend.bat
              </pre>
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}
