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
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      {/* Title */}
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, lineHeight: 1.3, color: 'var(--text)' }}>
          {vote.humanTitle ?? (vote.title.length > 80 ? vote.title.slice(0, 80) + '…' : vote.title)}
        </div>
      </div>

      {/* JA / NEJ explanation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 20px 16px' }}>
        <div style={{ background: 'rgba(34,139,74,0.08)', border: '1px solid rgba(34,139,74,0.2)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#228b4a', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            JA innebar
          </div>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>
            {vote.jaMeaning ?? <span className="skeleton" style={{ display: 'block', height: 36 }} />}
          </p>
        </div>
        <div style={{ background: 'rgba(185,28,28,0.07)', border: '1px solid rgba(185,28,28,0.18)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            NEJ innebar
          </div>
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>
            {vote.nejMeaning ?? <span className="skeleton" style={{ display: 'block', height: 36 }} />}
          </p>
        </div>
      </div>

      {/* Result bar */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          <span style={{ color: '#228b4a' }}>JA — {vote.totalJa} röster ({jaPct}%)</span>
          <span style={{ color: '#b91c1c' }}>NEJ — {vote.totalNej} ({nejPct}%)</span>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: 'var(--surface2)', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${jaPct}%`, background: '#228b4a', transition: 'width 0.6s ease' }} />
          <div style={{ width: `${nejPct}%`, background: '#b91c1c', transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* Vad händer nu */}
      <div style={{ margin: '0 20px 16px', background: 'var(--surface2)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
          Vad händer nu?
        </div>
        <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.6 }}>
          {vote.consequence ?? 'Laddar…'}
        </p>
      </div>

      {/* Så röstade partierna — collapsible */}
      <div style={{ margin: '0 20px 16px', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <button
          onClick={() => setPvOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', background: 'none', border: 'none', padding: 0,
            color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <span>Så röstade partierna</span>
          <span style={{ fontSize: 10, transition: 'transform .2s', transform: pvOpen ? 'rotate(180deg)' : 'none', color: 'var(--text3)' }}>▼</span>
        </button>

        {pvOpen && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {vote.partyVotes
              .filter(pv => pv.party && pv.party !== '-')
              .map(pv => {
                const party = getParty(pv.party)
                const pvTotal = pv.ja + pv.nej
                const jaW = pvTotal > 0 ? (pv.ja / pvTotal) * 100 : 0

                return (
                  <div key={pv.party} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800,
                      minWidth: 30, padding: '3px 6px', borderRadius: 5, textAlign: 'center',
                      background: party?.color ?? '#888',
                      color: party?.textColor ?? '#fff',
                    }}>
                      {pv.party}
                    </span>
                    <div style={{ flex: 1, height: 7, borderRadius: 4, background: 'var(--surface2)', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${jaW}%`, background: '#228b4a' }} />
                      <div style={{ width: `${100 - jaW}%`, background: '#b91c1c' }} />
                    </div>
                    <span style={{ fontSize: 12, color: pv.ja >= pv.nej ? '#228b4a' : '#b91c1c', minWidth: 70, textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {pv.ja} ja · {pv.nej} nej
                    </span>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>
          Röstdata från riksdagens officiella API
        </p>
        {vote.voterId && (
          <a
            href={`https://data.riksdagen.se/votering/${vote.voterId}/json`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
          >
            Verifiera källdata →
          </a>
        )}
      </div>

    </div>
  )
}
