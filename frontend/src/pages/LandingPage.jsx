import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, ArrowRight, CheckCircle, AlertTriangle, GitMerge,
  Search, FileCode, Brain, Lock, Package, Eye, ChevronRight,
  Zap, AlertCircle, FileText, Activity, Key, Terminal, ExternalLink,
  ShieldCheck, Check, Sparkles, Cpu
} from 'lucide-react'

// ── Interactive Scenario Simulator ───────────────────────────────────────────

const SCENARIOS = [
  {
    id: 'sqli',
    title: 'SQL Injection',
    cwe: 'CWE-89',
    severity: 'high',
    file: 'app/auth.py:42',
    tool: 'Bandit & Semgrep',
    codeVulnerable: `query = f"SELECT * FROM users WHERE user = '{username}'"\nresult = db.execute(query)`,
    codePatched: `stmt = select(User).where(User.username == username)\nresult = await db.execute(stmt)`,
    explanation: 'Unsanitized string interpolation in SQL statement enables complete authentication bypass.',
    verification: 'Syntax validation passed. Semgrep rule AST re-scan: 0 violations.',
  },
  {
    id: 'secret',
    title: 'Hardcoded Secret',
    cwe: 'CWE-798',
    severity: 'critical',
    file: 'app/core/config.py:12',
    tool: 'Gitleaks',
    codeVulnerable: `AWS_SECRET_KEY = "AKIAIOSFODNN7EXAMPLE_SECRET"\nJWT_SECRET = "super_secret_jwt_token_123"`,
    codePatched: `AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")\nJWT_SECRET = os.getenv("JWT_SECRET")`,
    explanation: 'Embedded credentials committed to source code. Redacted immediately in all logs.',
    verification: 'Entropy inspection: 0 secrets detected. Redaction audit passed.',
  },
  {
    id: 'pickle',
    title: 'Insecure Deserialization',
    cwe: 'CWE-502',
    severity: 'critical',
    file: 'app/session.py:88',
    tool: 'Bandit',
    codeVulnerable: `session_obj = pickle.loads(client_cookie_payload)`,
    codePatched: `session_obj = json.loads(base64.b64decode(payload))`,
    explanation: 'Arbitrary code execution flaw through unvalidated Python pickle deserialization.',
    verification: 'Bandit B301 check re-run: passed without regression.',
  },
  {
    id: 'cve',
    title: 'Vulnerable Package',
    cwe: 'CVE-2018-18074',
    severity: 'medium',
    file: 'requirements.txt:4',
    tool: 'pip-audit / Trivy',
    codeVulnerable: `requests==2.20.0\nurllib3==1.24.1`,
    codePatched: `requests>=2.31.0\nurllib3>=1.26.18`,
    explanation: 'Known CVSS 7.5 vulnerability in HTTP redirect credential leak.',
    verification: 'Advisory database check against OSV: 0 known CVEs remaining.',
  },
]

export default function LandingPage() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0])
  const [simulatorTab, setSimulatorTab] = useState('diff')
  const [terminalStep, setTerminalStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTerminalStep((prev) => (prev + 1) % 4)
    }, 4000)
    return () => clearInterval(timer)
  }, [selectedScenario])

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <nav className="h-16 border-b border-slate-800/80 bg-[#070B16]/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield size={18} className="text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            Vibe Shield <span className="text-cyan-400 font-mono text-xs">AI</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-mono">
          <a href="#pipeline" className="hover:text-white transition-colors">Verification Pipeline</a>
          <a href="#simulator" className="hover:text-white transition-colors">Interactive Sandbox</a>
          <a href="#scanners" className="hover:text-white transition-colors">Supported Scanners</a>
          <a href="#trust" className="hover:text-white transition-colors">Trust & Safety</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="btn-secondary btn-sm text-xs font-mono"
          >
            Dashboard
          </Link>
          <Link
            to="/new-analysis"
            className="btn-primary btn-sm text-xs inline-flex items-center gap-1.5 font-semibold"
          >
            Launch Scanner <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
        {/* Subtle Ambient Background Mesh */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-indigo-500/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

        {/* Security Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-cyan-300 mb-6 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Autonomous Security & Human-in-the-Loop Verification
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15]">
          Securing Software Built in the{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
            Age of AI Generation
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
          AI code generators build features fast, but introduce subtle injection flaws, exposed secrets, and hallucinated packages. Vibe Shield AI runs deterministic multi-scanner static analysis with <strong className="text-slate-200">zero blind code modification</strong>.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link to="/new-analysis" className="btn-primary btn-lg text-sm inline-flex items-center gap-2">
            <Zap size={16} /> Start Security Analysis
          </Link>
          <a href="#simulator" className="btn-secondary btn-lg text-sm inline-flex items-center gap-2">
            <Terminal size={16} /> Explore Live Simulator
          </a>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl pt-8 border-t border-slate-800/80 text-xs font-mono text-slate-400">
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-white">OWASP Top 10</span>
            <span className="text-[11px] text-slate-400">AST Pattern Coverage</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-emerald-400">Zero Blind Fixes</span>
            <span className="text-[11px] text-slate-400">Human Approval Signoff</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-cyan-400">Multi-Engine</span>
            <span className="text-[11px] text-slate-400">Semgrep, Bandit, Gitleaks</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-indigo-400">100% Offline</span>
            <span className="text-[11px] text-slate-400">SQLite & Local Runners</span>
          </div>
        </div>
      </section>

      {/* Interactive Vulnerability & Patch Simulator */}
      <section id="simulator" className="py-16 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-10">
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold block mb-1">
            Interactive Workbench
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">How Vibe Shield AI Detects & Verifies</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Select a vulnerability type below to see the exact static scanner detection, AST evidence, and human-verified remediation diff.
          </p>
        </div>

        {/* Scenario Selectors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setSelectedScenario(sc)}
              className={`p-3 rounded-xl text-left border transition-all ${
                selectedScenario.id === sc.id
                  ? 'bg-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`badge uppercase text-[10px] ${
                  sc.severity === 'critical' ? 'badge-critical' :
                  sc.severity === 'high' ? 'badge-high' : 'badge-medium'
                }`}>
                  {sc.severity}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{sc.cwe}</span>
              </div>
              <div className="font-semibold text-xs text-white truncate">{sc.title}</div>
            </button>
          ))}
        </div>

        {/* Interactive Terminal Window */}
        <div className="code-terminal shadow-2xl border-slate-800">
          {/* Header */}
          <div className="terminal-header">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">
                vibeshield-sandbox ~ {selectedScenario.file}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setSimulatorTab('diff')}
                className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors ${
                  simulatorTab === 'diff' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Side-by-Side Diff
              </button>
              <button
                onClick={() => setSimulatorTab('evidence')}
                className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors ${
                  simulatorTab === 'evidence' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Scanner Evidence
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {simulatorTab === 'diff' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {/* Vulnerable */}
                <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-4">
                  <div className="text-rose-400 font-semibold mb-2 flex items-center justify-between text-[11px]">
                    <span>- VULNERABLE CODE (FLAGGED BY {selectedScenario.tool.toUpperCase()})</span>
                    <span className="badge badge-critical text-[9px]">{selectedScenario.severity}</span>
                  </div>
                  <pre className="text-rose-200/90 whitespace-pre-wrap leading-relaxed">
                    {selectedScenario.codeVulnerable}
                  </pre>
                </div>

                {/* Patched */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-4">
                  <div className="text-emerald-400 font-semibold mb-2 flex items-center justify-between text-[11px]">
                    <span>+ PROPOSED REMEDIATION (HUMAN REVIEW REQUIRED)</span>
                    <span className="badge badge-verified text-[9px]">READY FOR SIGNATURE</span>
                  </div>
                  <pre className="text-emerald-200/90 whitespace-pre-wrap leading-relaxed">
                    {selectedScenario.codePatched}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-slate-900 rounded border border-slate-800">
                  <span className="text-indigo-400 block mb-1">Scanner Engine:</span>
                  <p className="text-slate-200">{selectedScenario.tool}</p>
                </div>
                <div className="p-3 bg-slate-900 rounded border border-slate-800">
                  <span className="text-indigo-400 block mb-1">Root Cause Explanation:</span>
                  <p className="text-slate-300">{selectedScenario.explanation}</p>
                </div>
                <div className="p-3 bg-emerald-950/30 rounded border border-emerald-500/30">
                  <span className="text-emerald-400 block mb-1">Post-Fix Sandbox Verification:</span>
                  <p className="text-emerald-200">{selectedScenario.verification}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3 bg-[#0B101E] border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">
              Target Rule: <span className="text-white">{selectedScenario.cwe}</span> | Scanner: <span className="text-indigo-400">{selectedScenario.tool}</span>
            </span>
            <Link
              to="/patches"
              className="text-cyan-400 hover:text-cyan-300 font-mono font-medium flex items-center gap-1"
            >
              Open Patch Center <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* Verification Pipeline Steps */}
      <section id="pipeline" className="py-16 px-6 md:px-12 max-w-7xl mx-auto w-full border-t border-slate-800/60">
        <div className="text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold block mb-1">
            Deterministic Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">The 5-Stage Verification Pipeline</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: '01', title: 'Upload Sandbox', desc: 'Protected ZIP extraction with Zip-Slip path traversal defense.' },
            { step: '02', title: 'Static Analysis', desc: 'AST inspection across Semgrep, Bandit, and Gitleaks engines.' },
            { step: '03', title: 'AI Investigation', desc: 'Assistive contextual breakdown clearly separated from tool evidence.' },
            { step: '04', title: 'Human Approval', desc: 'Zero automatic injection: developer signs off on unified diffs.' },
            { step: '05', title: 'Sandbox Verify', desc: 'Re-runs scanners against patched code to confirm resolution.' },
          ].map((item) => (
            <div key={item.step} className="card p-5 border-slate-800 relative group hover:border-indigo-500/40 transition-colors">
              <span className="font-mono text-2xl font-bold text-slate-700 block mb-2">{item.step}</span>
              <h3 className="font-bold text-sm text-white mb-1.5">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported Scanners Section */}
      <section id="scanners" className="py-16 px-6 md:px-12 max-w-7xl mx-auto w-full border-t border-slate-800/60">
        <div className="text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold block mb-1">
            Engine Registry
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Built-in Security Scanners</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { name: 'Semgrep', cat: 'SAST (Multi-Language)', desc: 'Fast syntax & semantic pattern analyzer for JS, Python, Go, and Java.' },
            { name: 'Bandit', cat: 'Python Security', desc: 'Specialized Python AST linter identifying SQLi, unsafe exec, and weak cryptography.' },
            { name: 'Gitleaks', cat: 'Secret Detection', desc: 'High-speed audit of git repos and source files for API keys and certificates.' },
            { name: 'pip-audit', cat: 'Python SCA', desc: 'Scans requirements.txt against the PyPI and OSV vulnerability advisories.' },
            { name: 'npm audit', cat: 'Node.js SCA', desc: 'Inspects package-lock.json for supply-chain advisories and known CVEs.' },
            { name: 'Trivy', cat: 'Container & SCA', desc: 'Comprehensive scanner for package lockfiles and containerized environments.' },
          ].map((sc) => (
            <div key={sc.name} className="card p-5 border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white text-sm">{sc.name}</h4>
                <span className="badge badge-neutral text-[10px] font-mono">{sc.cat}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{sc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Competition Integrity Statement */}
      <section id="trust" className="py-16 px-6 md:px-12 max-w-4xl mx-auto w-full text-center border-t border-slate-800/60">
        <ShieldCheck size={40} className="text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Academic & Competition Integrity</h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto mb-6">
          Vibe Shield AI adheres to strict academic honesty principles: findings are generated exclusively by real tool execution, AI annotations are explicitly demarcated, and clean scans are never presented as complete proof of security.
        </p>
        <Link to="/new-analysis" className="btn-primary btn-md inline-flex items-center gap-2">
          Start Analysis Now <ArrowRight size={14} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#070B16] py-6 px-6 text-center text-xs font-mono text-slate-400">
        <p>Vibe Shield AI © 2026 — Built for Fundamentals of AI Project Demonstration</p>
      </footer>
    </div>
  )
}
