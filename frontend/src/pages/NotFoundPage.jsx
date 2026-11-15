import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="card p-8 md:p-12 max-w-lg w-full text-center space-y-6 border-primary-500/30 bg-bg-surface/80">
        <div className="relative inline-block">
          <ShieldAlert size={64} className="text-primary-500 mx-auto" />
          <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full -z-10" />
        </div>

        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-primary-400">Error 404 — Access Boundary</span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Resource Not Found</h1>
          <p className="text-sm text-gray-400 mt-2">
            The requested security endpoint, project, or audit trail does not exist in this perimeter.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/dashboard" className="btn-primary text-xs inline-flex items-center gap-2">
            <Home size={14} /> Back to Dashboard
          </Link>
          <Link to="/" className="btn-secondary text-xs inline-flex items-center gap-2">
            <ArrowLeft size={14} /> Landing Page
          </Link>
        </div>
      </div>
    </div>
  )
}
