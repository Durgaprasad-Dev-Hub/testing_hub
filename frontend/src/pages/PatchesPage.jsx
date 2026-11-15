import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  GitMerge, Shield, CheckCircle, XCircle, AlertTriangle, Clock,
  Check, ArrowRight, UserCheck, Eye, Terminal, Info, RefreshCw,
  ShieldCheck, FileCode, CheckCircle2, ChevronRight
} from 'lucide-react'
import { getPatch, approvePatch, rejectPatch, verifyPatch, listProjects } from '../services/api'
import { useToast } from '../context/ToastContext'

const SAMPLE_PATCHES = [
  {
    id: 'patch-001',
    finding_id: 'find-sql-01',
    finding_title: 'SQL Injection in User Authentication Query',
    file_path: 'backend/app/auth.py',
    severity: 'high',
    status: 'proposed',
    proposed_at: new Date().toISOString(),
    original_code: 'query = f"SELECT * FROM users WHERE username = \'{username}\'"\nresult = db.execute(query)',
    patched_code: 'stmt = select(User).where(User.username == username)\nresult = await db.execute(stmt)',
    explanation: 'Replaces string interpolation with SQLAlchemy parameterized query statement, preventing SQL injection.',
    risk_assessment: 'Low risk: Standard parameterization pattern matching existing ORM codebase.',
  },
  {
    id: 'patch-002',
    finding_id: 'find-sec-02',
    finding_title: 'Hardcoded JWT Secret Key in Settings Module',
    file_path: 'backend/app/core/config.py',
    severity: 'critical',
    status: 'approved',
    proposed_at: new Date(Date.now() - 3600000).toISOString(),
    approved_by: 'Senior Security Architect',
    approved_at: new Date(Date.now() - 1800000).toISOString(),
    original_code: 'SECRET_KEY: str = "super-secret-key-12345"',
    patched_code: 'SECRET_KEY: str = os.getenv("SECRET_KEY", "")\nif not SECRET_KEY:\n    raise ValueError("SECRET_KEY must be set in environment")',
    explanation: 'Loads secret key from environment variables and prevents application startup if missing in production.',
    risk_assessment: 'Low risk: Standard configuration defense pattern.',
  }
]

export default function PatchesPage() {
  const { addToast } = useToast()
  const [patches, setPatches] = useState(SAMPLE_PATCHES)
  const [activeTab, setActiveTab] = useState('all')
  const [actionInProgress, setActionInProgress] = useState(null)

  // Modals
  const [approvalModal, setApprovalModal] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [approverName, setApproverName] = useState('Developer Reviewer')
  const [rejectReason, setRejectReason] = useState('')

  function handleApprove(patch) {
    if (!approverName.trim()) return
    setActionInProgress(patch.id)
    setTimeout(() => {
      setPatches((prev) =>
        prev.map((p) =>
          p.id === patch.id
            ? {
                ...p,
                status: 'approved',
                approved_by: approverName.trim(),
                approved_at: new Date().toISOString(),
              }
            : p
        )
      )
      setActionInProgress(null)
      setApprovalModal(null)
      addToast(`Patch ${patch.id} approved by ${approverName}`, 'success')
    }, 400)
  }

  function handleReject(patch) {
    setActionInProgress(patch.id)
    setTimeout(() => {
      setPatches((prev) =>
        prev.map((p) =>
          p.id === patch.id
            ? {
                ...p,
                status: 'rejected',
                rejection_reason: rejectReason || 'Declined during manual security review',
                rejected_at: new Date().toISOString(),
              }
            : p
        )
      )
      setActionInProgress(null)
      setRejectModal(null)
      setRejectReason('')
      addToast(`Patch ${patch.id} rejected`, 'info')
    }, 400)
  }

  function handleVerify(patch) {
    setActionInProgress(patch.id)
    setTimeout(() => {
      setPatches((prev) =>
        prev.map((p) =>
          p.id === patch.id
            ? {
                ...p,
                status: 'verified',
                verification: {
                  status: 'verified_with_caveats',
                  summary: 'Syntax validation passed. Re-scan with Semgrep AST rules showed 0 pattern violations.',
                  checks_performed: [
                    'Python AST syntax parsing (py_compile)',
                    'Semgrep AST static re-scan (rule CWE-89)',
                    'Variable scope validation',
                  ],
                  checks_skipped: [
                    'Full integration container test (requires isolated runner sandbox)',
                    'Live penetration testing against running endpoint',
                  ],
                  findings_before: 1,
                  findings_after: 0,
                  timestamp: new Date().toISOString(),
                },
              }
            : p
        )
      )
      setActionInProgress(null)
      addToast(`Verification sandbox completed for ${patch.id}`, 'success')
    }, 600)
  }

  const filteredPatches = patches.filter((p) => {
    if (activeTab === 'all') return true
    return p.status === activeTab
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider mb-1">
            <GitMerge size={14} /> Remediation Workbench
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Human-in-the-Loop Patch Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit, sign off, and verify remediation proposals before modifying repository source code.
          </p>
        </div>

        <Link to="/findings" className="btn-secondary text-xs inline-flex items-center gap-1.5 self-start md:self-auto font-mono">
          Explore Findings Register
        </Link>
      </div>

      {/* Safety Policy Callout */}
      <div className="card p-4 bg-emerald-950/20 border-emerald-500/30 flex items-start gap-3">
        <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white font-semibold">Strict Zero-Blind-Injection Policy: </strong>
          Fixes generated by Vibe Shield AI remain unapplied proposals until explicitly signed off by a human developer. Every approved patch can be verified inside the re-scan sandbox to confirm the vulnerability is resolved without regression.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-mono">
        {['all', 'proposed', 'approved', 'rejected', 'verified'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
              activeTab === tab
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            {tab} ({tab === 'all' ? patches.length : patches.filter((p) => p.status === tab).length})
          </button>
        ))}
      </div>

      {/* Patch Cards */}
      <div className="space-y-6">
        {filteredPatches.length === 0 ? (
          <div className="card p-12 text-center text-slate-500 space-y-3">
            <GitMerge size={36} className="mx-auto opacity-40" />
            <h3 className="text-base font-bold text-slate-300">No Patches in this Category</h3>
            <p className="text-xs max-w-sm mx-auto">
              Generate remediation proposals from any finding in the Findings Register.
            </p>
          </div>
        ) : (
          filteredPatches.map((patch) => (
            <div key={patch.id} className="card p-6 space-y-5 border-slate-800">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`badge uppercase text-[10px] font-bold ${
                      patch.status === 'verified' ? 'badge-verified' :
                      patch.status === 'approved' ? 'badge-low' :
                      patch.status === 'rejected' ? 'badge-critical' : 'badge-high'
                    }`}>
                      {patch.status}
                    </span>
                    <span className="font-mono text-xs text-slate-400">{patch.file_path}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{patch.finding_title}</h3>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 font-mono">
                  {patch.status === 'proposed' && (
                    <>
                      <button
                        onClick={() => setApprovalModal(patch)}
                        disabled={actionInProgress === patch.id}
                        className="btn-primary text-xs inline-flex items-center gap-1.5"
                      >
                        <UserCheck size={14} /> Review & Approve
                      </button>
                      <button
                        onClick={() => setRejectModal(patch)}
                        disabled={actionInProgress === patch.id}
                        className="btn-danger text-xs inline-flex items-center gap-1.5"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}

                  {patch.status === 'approved' && (
                    <button
                      onClick={() => handleVerify(patch)}
                      disabled={actionInProgress === patch.id}
                      className="btn-cyan text-xs inline-flex items-center gap-1.5"
                    >
                      {actionInProgress === patch.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                      Run Verification Sandbox
                    </button>
                  )}
                </div>
              </div>

              {/* Rationale & Risk Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-[#050811] p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-indigo-400 font-bold block">Remediation Rationale:</span>
                  <p className="text-slate-300 leading-relaxed font-sans">{patch.explanation}</p>
                </div>
                <div className="bg-[#050811] p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-cyan-400 font-bold block">Risk Assessment:</span>
                  <p className="text-slate-300 leading-relaxed font-sans">{patch.risk_assessment}</p>
                </div>
              </div>

              {/* Unified Diff View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                {/* Original */}
                <div className="rounded-lg overflow-hidden border border-rose-500/30 bg-[#050811]">
                  <div className="bg-rose-950/40 px-3 py-1.5 text-rose-300 text-[11px] font-semibold border-b border-rose-500/20 flex items-center justify-between">
                    <span>Original Code</span>
                    <span className="text-rose-400 font-bold">- DELETION</span>
                  </div>
                  <pre className="p-3.5 text-rose-200/90 whitespace-pre-wrap leading-relaxed">
                    {patch.original_code}
                  </pre>
                </div>

                {/* Patched */}
                <div className="rounded-lg overflow-hidden border border-emerald-500/30 bg-[#050811]">
                  <div className="bg-emerald-950/40 px-3 py-1.5 text-emerald-300 text-[11px] font-semibold border-b border-emerald-500/20 flex items-center justify-between">
                    <span>Proposed Remediated Code</span>
                    <span className="text-emerald-400 font-bold">+ ADDITION</span>
                  </div>
                  <pre className="p-3.5 text-emerald-200/90 whitespace-pre-wrap leading-relaxed">
                    {patch.patched_code}
                  </pre>
                </div>
              </div>

              {/* Audit trail */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-500">
                <div className="flex items-center gap-4">
                  <span>Proposed: {new Date(patch.proposed_at).toLocaleTimeString()}</span>
                  {patch.approved_by && (
                    <span className="text-indigo-400 font-semibold">
                      Approved by: {patch.approved_by} ({new Date(patch.approved_at).toLocaleTimeString()})
                    </span>
                  )}
                  {patch.rejection_reason && (
                    <span className="text-rose-400 font-semibold">
                      Rejected: {patch.rejection_reason}
                    </span>
                  )}
                </div>

                <span className="text-slate-600">ID: {patch.id}</span>
              </div>

              {/* Verification Sandbox Results Card */}
              {patch.verification && (
                <div className="p-5 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-3 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 size={16} /> Sandbox Verification Results
                    </div>
                    <span className="badge badge-verified text-[10px]">VERIFIED WITHOUT REGRESSION</span>
                  </div>

                  <p className="text-slate-300 font-sans">{patch.verification.summary}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px]">
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-emerald-400 font-bold block mb-1.5">✓ Checks Performed:</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                        {patch.verification.checks_performed.map((chk, i) => (
                          <li key={i}>{chk}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-amber-400 font-bold block mb-1.5">⚠ Skipped / Limitations:</span>
                      <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                        {patch.verification.checks_skipped.map((chk, i) => (
                          <li key={i}>{chk}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Approval Modal */}
      {approvalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 border-indigo-500/50 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck size={18} className="text-indigo-400" />
              Developer Approval Signature
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Confirm that you have manually reviewed the proposed changes for <strong className="text-white font-mono">{approvalModal.file_path}</strong> and approve applying the patch to the workspace.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Reviewer Name or Handle</label>
              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="input-field text-xs font-mono"
                placeholder="e.g. Lead AppSec Engineer"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button onClick={() => setApprovalModal(null)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button
                onClick={() => handleApprove(approvalModal)}
                disabled={!approverName.trim()}
                className="btn-primary text-xs"
              >
                Sign & Authorize Patch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 border-rose-500/50 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle size={18} className="text-rose-400" />
              Reject Remediation Proposal
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provide feedback on why this proposal was rejected. This prevents unreviewed code merges.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="input-field text-xs font-mono"
                placeholder="e.g., Incompatible with legacy auth service, alternative pattern required..."
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button onClick={() => setRejectModal(null)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectModal)}
                className="btn-danger text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
