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
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 14px 10px' }}>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35, color: '#e0e0ec' }}>
          {vote.humanTitle ?? (vote.title.length > 80 ? vote.title.slice(0, 80) + '…' : vote.title)}
        </div>
      </div>

      {/* JA / NEJ explanation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 14px 12px' }}>
        <div style={{ background: 'rgba(74,122,90,0.12)', borderRadius: 8, padding: '9px 10px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#7aaa8a', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            JA innebar
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
            {vote.jaMeaning ?? <span className="skeleton" style={{ display: 'block', height: 30 }} />}
          </p>
        </div>
        <div style={{ background: 'rgba(122,58,58,0.12)', borderRadius: 8, padding: '9px 10px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9e6a6a', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            NEJ innebar
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
            {vote.nejMeaning ?? <span className="skeleton" style={{ display: 'block', height: 30 }} />}
          </p>
        </div>
      </div>

      {/* Result bar */}
      <div style={{ padding: '0 14px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 5, color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ color: '#7aaa8a' }}>JA — {vote.totalJa} röster ({jaPct}%)</span>
          <span style={{ color: '#9e6a6a' }}>NEJ — {vote.totalNej} ({nejPct}%)</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${jaPct}%`, background: '#4a7a5a' }} />
          <div style={{ width: `${nejPct}%`, background: '#7a3a3a' }} />
        </div>
      </div>

      {/* Vad händer nu */}
      <div style={{ margin: '0 14px 12px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 11px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
          Vad händer nu?
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>
          {vote.consequence ?? 'Laddar…'}
        </p>
      </div>

      {/* Så röstade partierna — collapsible */}
      <div style={{ margin: '0 14px 13px', borderTop: '0.5px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
        <button
          onClick={() => setPvOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', background: 'none', border: 'none', padding: 0,
            color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <span>Så röstade partierna</span>
          <span style={{ fontSize: 10, transition: 'transform .2s', transform: pvOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
        </button>

        {pvOpen && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {vote.partyVotes
              .filter(pv => pv.party && pv.party !== '-')
              .map(pv => {
                const party = getParty(pv.party)
                const pvTotal = pv.ja + pv.nej
                const jaW = pvTotal > 0 ? (pv.ja / pvTotal) * 100 : 0

                return (
                  <div key={pv.party} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800,
                      minWidth: 26, padding: '2px 5px', borderRadius: 4, textAlign: 'center',
                      background: `${party?.color ?? '#888'}22`,
                      color: party?.textColor ?? party?.color ?? '#888',
                    }}>
                      {pv.party}
                    </span>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${jaW}%`, background: '#4a7a5a' }} />
                      <div style={{ width: `${100 - jaW}%`, background: '#7a3a3a' }} />
                    </div>
                    <span style={{ fontSize: 10, color: pv.ja >= pv.nej ? '#7aaa8a' : '#9e6a6a', minWidth: 62, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {pv.ja} ja · {pv.nej} nej
                    </span>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {vote.dokId && (
        <div style={{ padding: '0 14px 13px' }}>
          <a
            href={`https://www.riksdagen.se/sv/dokument-och-lagar/dokument/votering/?bet=${vote.dokId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}
          >
            Se hur alla röstade →
          </a>
        </div>
      )}
    </div>
  )
}
