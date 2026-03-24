import React, { useState } from 'react'
import type { Vote } from '../types'
import { getParty } from '../types'

interface Props {
  vote: Vote
}

export default function VoteCard({ vote }: Props) {
  const [pvOpen, setPvOpen] = useState(false)

  const total = vote.totalJa + vote.totalNej
  const jaPct = total > 0 ? Math.round((vote.totalJa / total) * 100) : 0
  const nejPct = 100 - jaPct

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '13px 13px 10px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>
          {vote.humanTitle ?? (vote.title.length > 80 ? vote.title.slice(0, 80) + '…' : vote.title)}
        </div>
      </div>

      {/* JA / NEJ explanation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 13px 11px' }}>
        <div style={{ background: 'rgba(34,197,94,0.08)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', marginBottom: 4 }}>
            JA innebar
          </div>
          <p style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>
            {vote.jaMeaning ?? <span className="skeleton" style={{ display: 'block', height: 30 }} />}
          </p>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', marginBottom: 4 }}>
            NEJ innebar
          </div>
          <p style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>
            {vote.nejMeaning ?? <span className="skeleton" style={{ display: 'block', height: 30 }} />}
          </p>
        </div>
      </div>

      {/* Result bar */}
      <div style={{ padding: '0 13px 11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 5 }}>
          <span style={{ color: '#4ade80' }}>JA — {vote.totalJa} röster ({jaPct}%)</span>
          <span style={{ color: '#f87171' }}>NEJ — {vote.totalNej} ({nejPct}%)</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--surface3)', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${jaPct}%`, background: 'rgba(74,222,128,0.7)' }} />
          <div style={{ width: `${nejPct}%`, background: 'rgba(248,113,113,0.7)' }} />
        </div>
      </div>

      {/* Vad händer nu */}
      <div style={{ margin: '0 13px 11px', background: 'var(--surface2)', borderRadius: 10, padding: '10px 11px' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--accent2)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Vad händer nu?
        </div>
        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55 }}>
          {vote.consequence ?? 'Laddar…'}
        </p>
      </div>

      {/* Så röstade partierna — collapsible */}
      <div style={{ margin: '0 13px 12px', borderTop: '1px solid var(--border)', paddingTop: 9 }}>
        <button
          onClick={() => setPvOpen(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'var(--text2)',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span>Så röstade partierna</span>
          <span style={{ fontSize: 10, transition: 'transform .2s', transform: pvOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
        </button>

        {pvOpen && (
          <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {vote.partyVotes
              .filter(pv => pv.party && pv.party !== '-')
              .map(pv => {
                const party = getParty(pv.party)
                const pvTotal = pv.ja + pv.nej
                const jaW = pvTotal > 0 ? (pv.ja / pvTotal) * 100 : 0
                const nejW = 100 - jaW
                const dominantColor = pv.ja >= pv.nej ? 'var(--green)' : 'var(--red)'

                return (
                  <div key={pv.party} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        minWidth: 26,
                        padding: '2px 5px',
                        borderRadius: 4,
                        textAlign: 'center',
                        background: `${party?.color ?? '#888'}22`,
                        color: party?.textColor ?? party?.color ?? '#888',
                      }}
                    >
                      {pv.party}
                    </span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--surface3)', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${jaW}%`, background: 'rgba(74,222,128,0.7)' }} />
                      <div style={{ width: `${nejW}%`, background: 'rgba(248,113,113,0.7)' }} />
                    </div>
                    <span style={{ fontSize: 10, color: pv.ja >= pv.nej ? '#4ade80' : '#f87171', minWidth: 62, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {pv.ja} ja · {pv.nej} nej
                    </span>
                  </div>
                )
              })}
          </div>
        )}
      </div>
      {/* Länk till full omröstning */}
      {vote.dokId && (
        <div style={{ padding: '0 13px 13px' }}>
          <a
            href={`https://www.riksdagen.se/sv/dokument-och-lagar/dokument/votering/?bet=${vote.dokId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}
          >
            Se hur alla röstade →
          </a>
        </div>
      )}
    </div>
  )
}
