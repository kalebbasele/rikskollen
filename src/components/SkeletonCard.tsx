import React from 'react'

export default function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      <div style={{ height: 152, display: 'flex', background: '#1a2d44' }}>
        <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="skeleton" style={{ height: 10, width: '60%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 16, width: '70%' }} />
          </div>
          <div className="skeleton" style={{ height: 10, width: '40%' }} />
        </div>
        <div style={{ display: 'flex' }}>
          {[0, 1].map(i => (
            <div key={i} style={{ width: 74, height: 152, background: '#ffffff08', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none' }} />
          ))}
        </div>
      </div>
      <div style={{ padding: '9px 13px 11px', display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: 10, width: 120 }} />
        <div className="skeleton" style={{ height: 10, width: 80 }} />
      </div>
    </div>
  )
}
