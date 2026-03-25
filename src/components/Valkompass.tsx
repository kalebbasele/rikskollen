import React, { useState } from 'react'
import { QUESTIONS, PARTY_NAMES, PARTY_IDS, computeResults, type VPartyId } from '../data/valkompassen'
import { getParty } from '../types'
import { useIsMobile } from '../hooks/useIsMobile'

const OPTIONS = [
  { label: 'Instämmer helt',    value:  2 },
  { label: 'Instämmer',         value:  1 },
  { label: 'Neutral',           value:  0 },
  { label: 'Instämmer inte',    value: -1 },
  { label: 'Instämmer inte alls', value: -2 },
]

export default function Valkompass() {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [current, setCurrent] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'results'>('intro')
  const isMobile = useIsMobile()

  const q = QUESTIONS[current]
  const answered = answers[q?.id] !== undefined
  const isLast = current === QUESTIONS.length - 1
  const progress = current / QUESTIONS.length

  function answer(value: number) {
    setAnswers(prev => ({ ...prev, [q.id]: value }))
  }

  function next() {
    if (!answered) setAnswers(prev => ({ ...prev, [q.id]: 0 }))
    if (isLast) { setPhase('results'); return }
    setCurrent(i => i + 1)
  }

  function prev() {
    if (current > 0) setCurrent(i => i - 1)
  }

  function reset() {
    setAnswers({})
    setCurrent(0)
    setPhase('intro')
  }

  if (phase === 'intro') return <Intro onStart={() => setPhase('quiz')} isMobile={isMobile} />
  if (phase === 'results') return <Results answers={answers} onReset={reset} isMobile={isMobile} />

  return (
    <div style={{ padding: isMobile ? '0 4px' : 0 }}>
      {/* Progress */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
          <span>Fråga {current + 1} av {QUESTIONS.length}</span>
          <span style={{ color: 'var(--accent2)', fontWeight: 600 }}>{q.area}</span>
        </div>
        <div style={{ height: 3, borderRadius: 2, background: 'var(--surface3)' }}>
          <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #7c5cfc, #9b7dff)', width: `${progress * 100}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Question card */}
      <div style={{
        background: 'var(--glass-bg)',
        border: '0.5px solid var(--glass-border)',
        borderRadius: 16,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: isMobile ? '24px 18px' : '36px 32px',
        marginBottom: 16,
      }}>
        <p style={{ fontSize: isMobile ? 18 : 22, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 28 }}>
          {q.text}
        </p>

        {/* Answer buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map(opt => {
            const selected = answers[q.id] === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => answer(opt.value)}
                style={{
                  padding: isMobile ? '13px 16px' : '13px 20px',
                  borderRadius: 10,
                  border: selected ? '1.5px solid var(--accent)' : '0.5px solid var(--border)',
                  background: selected ? 'rgba(124,92,252,0.18)' : 'var(--surface2)',
                  color: selected ? 'var(--accent2)' : 'var(--text2)',
                  fontWeight: selected ? 700 : 400,
                  fontSize: isMobile ? 14 : 15,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  border: selected ? '5px solid var(--accent)' : '1.5px solid var(--text3)',
                  background: 'transparent',
                  display: 'inline-block',
                  transition: 'border 0.15s',
                }} />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={prev}
          disabled={current === 0}
          style={{
            fontSize: 14, color: current === 0 ? 'var(--text3)' : 'var(--text2)',
            background: 'none', border: 'none', cursor: current === 0 ? 'default' : 'pointer', padding: '8px 4px',
          }}
        >
          ← Föregående
        </button>
        <button
          onClick={next}
          style={{
            padding: '11px 28px', borderRadius: 10,
            background: answered ? 'var(--accent)' : 'var(--surface3)',
            color: answered ? '#fff' : 'var(--text3)',
            border: 'none', fontWeight: 700, fontSize: 15,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {isLast ? 'Se resultat →' : 'Nästa →'}
        </button>
      </div>

      {!answered && (
        <p
          onClick={() => next()}
          style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text3)', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Hoppa över (räknas som neutral)
        </p>
      )}
    </div>
  )
}

// ── Intro screen ───────────────────────────────────────────────────────────────

function Intro({ onStart, isMobile }: { onStart: () => void; isMobile: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: isMobile ? '24px 8px' : '40px 0' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🗳️</div>
      <h1 style={{ fontSize: isMobile ? 26 : 32, fontWeight: 700, color: 'var(--text)', marginBottom: 12, lineHeight: 1.2 }}>
        Vilken politik<br />passar dig?
      </h1>
      <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7 }}>
        Svara på 20 korta frågor om aktuella politiska frågor. Du får sedan se vilket parti som ligger närmast dina åsikter.
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12,
        maxWidth: 560, margin: '0 auto 32px', textAlign: 'left',
      }}>
        {[
          { icon: '🔒', text: 'Inga svar sparas – allt sker lokalt i din webbläsare' },
          { icon: '⚖️', text: 'Helt opartisk – baserad på partiernas faktiska politik' },
          { icon: '⏱️', text: 'Tar ca 3 minuter att genomföra' },
        ].map(item => (
          <div key={item.icon} style={{
            background: 'var(--glass-bg)', border: '0.5px solid var(--glass-border)',
            borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{item.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        style={{
          padding: '14px 40px', borderRadius: 12,
          background: 'linear-gradient(135deg, #7c5cfc, #9b7dff)',
          color: '#fff', border: 'none', fontWeight: 700, fontSize: 17, cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(124,92,252,0.4)',
        }}
      >
        Starta valkompassen
      </button>
    </div>
  )
}

// ── Results screen ─────────────────────────────────────────────────────────────

function Results({ answers, onReset, isMobile }: { answers: Record<number, number>; onReset: () => void; isMobile: boolean }) {
  const results = computeResults(answers)
  const top = results[0]
  const topParty = getParty(top.partyId)

  return (
    <div style={{ padding: isMobile ? '0 4px' : 0 }}>
      {/* Top match */}
      <div style={{
        borderRadius: 16, padding: isMobile ? '24px 20px' : '32px 28px', marginBottom: 20,
        background: `linear-gradient(135deg, ${topParty?.color ?? '#7c5cfc'}22 0%, rgba(13,21,36,0.95) 100%)`,
        border: `1px solid ${topParty?.color ?? '#7c5cfc'}55`,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 16 }}>
          Ditt resultat
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 12 }}>
          <PartyChip partyId={top.partyId} size={44} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: 'var(--text)' }}>
              {PARTY_NAMES[top.partyId]}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>
              {top.similarity}% överensstämmelse
            </div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text3)', maxWidth: 380, margin: '0 auto' }}>
          Dina svar liknar mest {PARTY_NAMES[top.partyId]}s politik baserat på dina svar.
        </p>
      </div>

      {/* All parties ranked */}
      <div style={{
        background: 'var(--glass-bg)', border: '0.5px solid var(--glass-border)',
        borderRadius: 16, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        padding: isMobile ? '16px 16px' : '20px 24px', marginBottom: 16,
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 16 }}>
          Alla partier
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {results.map((r, i) => {
            const party = getParty(r.partyId)
            return (
              <div key={r.partyId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text3)', width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                <PartyChip partyId={r.partyId} size={28} />
                <span style={{ fontSize: 13, color: 'var(--text2)', width: isMobile ? 80 : 140, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isMobile ? r.partyId : PARTY_NAMES[r.partyId]}
                </span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--surface3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: party?.color ?? '#7c5cfc', width: `${r.similarity}%`, transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', width: 36, textAlign: 'right', flexShrink: 0 }}>
                  {r.similarity}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 20, padding: '0 4px' }}>
        Valkompassen baseras på ett urval av frågor och förenklade partipositioner. Den ger en indikation, inte ett facit. Läs partiernas valmanifest för en fullständig bild.
      </p>

      <button
        onClick={onReset}
        style={{
          width: '100%', padding: '13px', borderRadius: 10,
          background: 'var(--surface2)', border: '0.5px solid var(--border)',
          color: 'var(--text2)', fontWeight: 600, fontSize: 15, cursor: 'pointer',
        }}
      >
        Gör om valkompassen
      </button>
    </div>
  )
}

// ── Small reusable chip ────────────────────────────────────────────────────────

function PartyChip({ partyId, size }: { partyId: VPartyId; size: number }) {
  const party = getParty(partyId)
  const fs = Math.round(size * 0.38)
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.25),
      background: party?.color ?? '#555',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: fs, fontWeight: 800, color: party?.textColor ?? '#fff',
      flexShrink: 0,
    }}>
      {partyId.slice(0, 2)}
    </div>
  )
}
