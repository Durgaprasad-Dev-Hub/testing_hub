import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, FolderOpen, Trash2, AlertTriangle, CheckCircle,
  Clock, ArrowRight, RefreshCw, Shield, Layers, X
} from 'lucide-react'
import { listProjects, createProject, deleteProject } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function ProjectsPage() {
  const { addToast } = useToast()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)
    setError(null)
    try {
      const data = await listProjects({ page_size: 50 })
      setProjects(data.items || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch projects.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newProjectName.trim()) return
    setCreating(true)
    try {
      const p = await createProject({
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
      })
      setProjects((prev) => [p, ...prev])
      setShowCreateModal(false)
      setNewProjectName('')
      setNewProjectDesc('')
      addToast(`Project "${p.name}" created`, 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(project) {
    try {
      await deleteProject(project.id)
      setProjects((prev) => prev.filter((p) => p.id !== project.id))
      setDeleteTarget(null)
      addToast(`Project "${project.name}" deleted`, 'info')
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider mb-1">
            <FolderOpen size={14} /> Workspace Management
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Project Repositories</h1>
          <p className="text-xs text-slate-400 mt-1">
            Isolated codebases with independent scan histories and compliance records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-xs inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Create Project
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-4 border-slate-800 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 text-xs font-mono w-full"
          />
        </div>
        <div className="text-xs font-mono text-slate-400">
          Total: <strong className="text-white">{filteredProjects.length}</strong>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-mono">Loading repositories...</p>
        </div>
      ) : error ? (
        <div className="card p-8 text-center text-rose-400 font-mono text-xs">
          {error}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 space-y-3">
          <FolderOpen size={36} className="mx-auto opacity-40" />
          <h3 className="text-base font-bold text-slate-300">No Projects Found</h3>
          <p className="text-xs max-w-sm mx-auto">
            {searchQuery ? 'No projects match your query.' : 'Create your first project to start scanning.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary btn-sm text-xs inline-flex items-center gap-1.5 mx-auto"
            >
              <Plus size={14} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="card p-5 border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`badge uppercase text-[10px] ${
                    project.status === 'scanned' ? 'badge-verified' :
                    project.status === 'scanning' ? 'badge-high' : 'badge-neutral'
                  }`}>
                    {project.status}
                  </span>

                  <button
                    onClick={() => setDeleteTarget(project)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                    title="Delete project"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <Link
                  to={`/projects/${project.id}`}
                  className="font-bold text-white text-base hover:text-indigo-400 transition-colors block tracking-tight"
                >
                  {project.name}
                </Link>

                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {project.description || 'No description specified for this workspace.'}
                </p>
              </div>

              {/* Severity breakdown */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400 text-[11px]">Findings:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold" title="Critical">{project.critical_findings || 0}C</span>
                    <span className="text-amber-400 font-bold" title="High">{project.high_findings || 0}H</span>
                    <span className="text-yellow-400 font-bold" title="Medium">{project.medium_findings || 0}M</span>
                    <span className="text-blue-400 font-bold" title="Low">{project.low_findings || 0}L</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 font-sans text-xs"
                  >
                    Open Workspace <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="card max-w-md w-full p-6 space-y-4 border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create New Project</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Project Name *</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="input-field text-xs font-mono"
                  placeholder="e.g. payment-service"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description (Optional)</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  rows={3}
                  className="input-field text-xs font-mono"
                  placeholder="Scope or notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !newProjectName.trim()}
                className="btn-primary text-xs"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 border-rose-500/50 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 size={18} className="text-rose-400" />
              Delete Project Workspace
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{deleteTarget.name}</strong>? All associated scan records and finding histories will be removed.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="btn-danger text-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
