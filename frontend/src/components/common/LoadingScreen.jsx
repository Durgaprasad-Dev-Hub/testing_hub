import React from 'react'
import { Shield } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    }}>
      <div style={{
        width: 56, height: 56,
        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 30px rgba(124,92,252,0.4)',
        animation: 'pulse 2s ease infinite',
      }}>
        <Shield size={28} color="white" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>Vibe Shield AI</div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 4 }}>Loading…</div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(124,92,252,0.4); }
          50% { box-shadow: 0 0 50px rgba(124,92,252,0.7); }
        }
      `}</style>
    </div>
  )
}
