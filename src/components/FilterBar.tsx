import React, { useState } from 'react'
import type { ActiveFilters } from '../types'
import { PARTIES, SWEDISH_REGIONS } from '../types'

interface Props {
  filters: ActiveFilters
  onChange: (filters: ActiveFilters) => void
}

export default function FilterBar({ filters, onChange }: Props) {
  const [modal, setModal] = useState<'parti' | 'region' | null>(null)

  function toggleParty(id: string) {
    const next = filters.parties.includes(id)
      ? filters.parties.filter(p => p !== id)
      : [...filters.parties, id]
    onChange({ ...filters, parties: next })
  }

  function toggleRegion(r: string) {
    const next = filters.regions.includes(r)
      ? filters.regions.filter(x => x !== r)
      : [...filters.regions, r]
    onChange({ ...filters, regions: next })
  }

  const chips = [
    ...filters.parties.map(p => ({ label: p, type: 'party' as const, id: p })),
    ...filters.regions.map(r => ({ label: r, type: 'region' as const, id: r })),
  ]

  return (
    <>
      {/* Filter buttons */}
      <div style={{ padding: '10px 16px 0' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <button
            onClick={() => setModal('parti')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 20,
              border: `1px solid ${filters.parties.length > 0 ? 'var(--accent2)' : 'var(--border)'}`,
              background: 'var(--surface2)',
              color: filters.parties.length > 0 ? 'var(--accent2)' : 'var(--text2)',
              fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            🏛️ Parti {filters.parties.length > 0 && `(${filters.parties.length})`}
          </button>
          <button
            onClick={() => setModal('region')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 20,
              border: `1px solid ${filters.regions.length > 0 ? 'var(--accent2)' : 'var(--border)'}`,
              background: 'var(--surface2)',
              color: filters.regions.length > 0 ? 'var(--accent2)' : 'var(--text2)',
              fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            📍 Region {filters.regions.length > 0 && `(${filters.regions.length})`}
          </button>
        </div>

        {/* Active chips */}
        {chips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {chips.map(chip => {
              const party = chip.type === 'party' ? PARTIES.find(p => p.id === chip.id) : null
              const color = party?.color ?? 'var(--accent)'
              return (
                <span
                  key={chip.id}
                  onClick={() =>
                    chip.type === 'party' ? toggleParty(chip.id) : toggleRegion(chip.id)
                  }
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 9px', borderRadius: 20, cursor: 'pointer',
                    background: `${color}22`,
                    color: party?.textColor ?? color,
                    fontSize: 11, fontWeight: 600,
                  }}
                >
                  {chip.label}
                  <span style={{ opacity: 0.6, fontSize: 10 }}>✕</span>
                </span>
              )
            })}
            <button
              onClick={() => onChange({ parties: [], regions: [] })}
              style={{
                background: 'none', border: 'none', color: 'var(--text3)',
                fontSize: 11, cursor: 'pointer', textDecoration: 'underline', padding: '2px 0',
              }}
            >
              Rensa filter
            </button>
          </div>
        )}
      </div>

      {/* Parti modal */}
      {modal === 'parti' && (
        <Modal onClose={() => setModal(null)} title="Välj parti">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
            {PARTIES.map(p => {
              const active = filters.parties.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => toggleParty(p.id)}
                  style={{
                    padding: '9px 4px', borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: active ? `${p.color}33` : 'var(--surface2)',
                    color: active ? (p.textColor ?? p.color) : 'var(--text2)',
                    fontSize: 12, fontWeight: 700, textAlign: 'center',
                    transition: 'all .15s',
                  }}
                >
                  {p.id}
                </button>
              )
            })}
          </div>
          <ModalActions
            onClear={() => onChange({ ...filters, parties: [] })}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Region modal */}
      {modal === 'region' && (
        <Modal onClose={() => setModal(null)} title="Välj region">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 260, overflowY: 'auto' }}>
            {SWEDISH_REGIONS.map(r => {
              const active = filters.regions.includes(r)
              return (
                <div
                  key={r}
                  onClick={() => toggleRegion(r)}
                  style={{
                    padding: '10px 11px', borderRadius: 8, cursor: 'pointer',
                    fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                    color: 'var(--text2)',
                    background: active ? 'var(--surface2)' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: '1px solid var(--border)',
                      background: active ? 'var(--accent)' : 'var(--surface3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: '#fff',
                    }}
                  >
                    {active && '✓'}
                  </div>
                  {r}
                </div>
              )
            })}
          </div>
          <ModalActions
            onClear={() => onChange({ ...filters, regions: [] })}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </>
  )
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
        zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 420, padding: '18px 16px 32px',
          border: '1px solid var(--border)', borderBottom: 'none',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--surface3)', margin: '0 auto 14px' }} />
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 13 }}>{title}</div>
        {children}
      </div>
    </div>
  )
}

function ModalActions({ onClear, onClose }: { onClear: () => void; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
      <button
        onClick={onClear}
        style={{
          flex: 1, padding: 12, borderRadius: 11, border: 'none',
          background: 'var(--surface2)', color: 'var(--text2)', fontSize: 14, fontWeight: 600,
        }}
      >
        Rensa
      </button>
      <button
        onClick={onClose}
        style={{
          flex: 1, padding: 12, borderRadius: 11, border: 'none',
          background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600,
        }}
      >
        Visa resultat
      </button>
    </div>
  )
}
