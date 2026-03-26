import React from 'react'
import type { Debate } from '../types'
import PersonPortrait from './PersonPortrait'

interface Props {
  debate: Debate
  onClick: () => void
}

export default function DebateCard({ debate, onClick }: Props) {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light'
  const mainParticipants = debate.participants.slice(0, 2)

  if (isLight) {
    return (
      <div
        onClick={onClick}
        style={{
          display: 'grid', gridTemplateColumns: '1fr 200px',
          minHeight: 80, borderBottom: '1px solid #f5f5fa',
          background: '#fff', cursor: 'pointer', overflow: 'hidden',
          border: '1px solid #f0f0f8', borderRadius: 10,
        }}
      >
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, color: '#888' }}>
            {debate.topic}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: '#111' }}>
            {debate.title.length > 80 ? debate.title.slice(0, 80) + '…' : debate.title}
          </div>
          <div style={{ fontSize: 10, color: '#ccc', marginTop: 4 }}>{formatDate(debate.date)}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mainParticipants.length === 1 ? '1fr' : '1fr 1fr', borderLeft: '1px solid #f5f5fa' }}>
          {mainParticipants.map((p, i) => (
            <div key={p.person.id || i} style={{ borderLeft: i > 0 ? '1px solid #f5f5fa' : 'none', background: '#fafafe' }}>
              <PersonPortrait person={p.person} height={80} width={100} variant="card" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      style={{
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'var(--card-bg)',
        transition: 'border-color .2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(155,111,255,0.35)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ height: 130, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, #0d1b2a 0%, #1a2d44 60%, #0a1520 100%)' }} />
        <div style={{ flex: 1, padding: '12px 13px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 2, minWidth: 0 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, color: 'rgba(255,255,255,0.45)' }}>
              {debate.topic}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.35, color: '#fff' }}>
              {debate.title.length > 80 ? debate.title.slice(0, 80) + '…' : debate.title}
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{formatDate(debate.date)}</div>
        </div>
        <div style={{ display: 'flex', flexShrink: 0 }}>
          {mainParticipants.map((p, i) => (
            <div key={p.person.id || i} style={{ borderLeft: i > 0 ? '0.5px solid rgba(255,255,255,0.07)' : 'none' }}>
              <PersonPortrait person={p.person} height={130} width={74} variant="card" />
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '8px 13px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '0.5px solid rgba(255,255,255,0.06)', background: 'var(--footer-bg)' }}>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>{debate.venue}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--cta-color)' }}>Läs debatt →</span>
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try { return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return dateStr }
}
