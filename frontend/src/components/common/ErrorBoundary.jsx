import React, { Component } from 'react'
import { ShieldAlert, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
          padding: '24px',
        }}>
          <div className="card p-8 max-w-md w-full text-center space-y-4 border-critical/40">
            <ShieldAlert size={48} className="text-critical mx-auto" />
            <h2 className="text-xl font-bold text-white">Something Went Wrong</h2>
            <p className="text-xs text-gray-400">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="btn-primary text-xs inline-flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={14} /> Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
