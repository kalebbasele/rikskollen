import React, { useEffect, useState } from 'react'
import type { Debate } from '../types'
import { getParty } from '../types'
import { generateDebateSummary } from '../lib/aiClient'
import { useIsMobile } from '../hooks/useIsMobile'

const BACKEND = 'https://web-production-1e2f2.up.railway.app'

interface ReactionCounts {
  left: { up: number; down: number }
  right: { up: number; down: number }
}

function ReactionButtons({ debateId, bloc }: { debateId: string; bloc: 'left' | 'right' }) {
  const [counts, setCounts] = useState<{ up: number; down: number } | null>(null)
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    fetch(`${BACKEND}/api/public/reactions/${debateId}`)
      .then(r => r.json())
      .then((d: ReactionCounts) => setCounts(d[bloc]))
      .catch(() => setCounts({ up: 0, down: 0 }))
  }, [debateId, bloc])

  async function react(reaction: 'up' | 'down') {
    if (voted) return
    setVoted(reaction)
    setCounts(prev => prev ? { ...prev, [reaction]: prev[reaction] + 1 } : { up: reaction === 'up' ? 1 : 0, down: reaction === 'down' ? 1 : 0 })
    try {
      await fetch(`${BACKEND}/api/public/reactions/${debateId}/${bloc}/${reaction}`, { method: 'POST' })
    } catch {}
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 4 }}>Vad tyckte du?</span>
      {(['up', 'down'] as const).map(r => (
        <button
          key={r}
          onClick={() => react(r)}
          disabled={voted !== null}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 20,
            border: `1px solid ${voted === r ? (r === 'up' ? 'rgba(34,139,74,0.5)' : 'rgba(185,28,28,0.5)') : 'var(--border)'}`,
            background: voted === r ? (r === 'up' ? 'rgba(34,139,74,0.12)' : 'rgba(185,28,28,0.12)') : 'transparent',
            color: voted === r ? (r === 'up' ? '#228b4a' : '#b91c1c') : 'var(--text3)',
            fontSize: 13, cursor: voted ? 'default' : 'pointer', transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 15 }}>{r === 'up' ? '👍' : '👎'}</span>
          {counts !== null && <span style={{ fontWeight: 600, fontSize: 12 }}>{counts[r]}</span>}
        </button>
      ))}
    </div>
  )
}

interface Props {
  debate: Debate
  onUpdate: (updated: Debate) => void
}

export default function DebateDetail({ debate, onUpdate }: Props) {
  const [loadingAI, setLoadingAI] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!debate.ingress && !debate.aiLoading && !debate.aiError && debate.dokId) {
      loadSummary()
    }
  }, [debate.id])

  async function loadSummary() {
    setLoadingAI(true)
    onUpdate({ ...debate, aiLoading: true })
    try {
      const summary = await generateDebateSummary(debate, '')
      onUpdate({
        ...debate,
        ingress: summary.ingress,
        leftBloc: summary.leftBloc,
        rightBloc: summary.rightBloc,
        aiLoading: false,
      })
    } catch (e) {
      onUpdate({
        ...debate,
        aiLoading: false,
        aiError: 'Kunde inte generera sammanfattning just nu.',
      })
    } finally {
      setLoadingAI(false)
    }
  }

  const allParticipants = debate.participants

  return (
    <div style={{ padding: isMobile ? '0 16px' : '0 20px', maxWidth: 760, margin: '0 auto' }}>

      {/* ── Hero header ─────────────────────────────────────── */}
      <div style={{ padding: isMobile ? '32px 0 28px' : '52px 0 40px', borderBottom: '1px solid var(--border)' }}>
        {/* Category badge */}
        <div style={{
          display: 'inline-block',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--accent2)',
          background: 'rgba(155,125,255,0.12)', borderRadius: 20,
          padding: '5px 14px', marginBottom: 24,
        }}>
          {debate.topic.length > 60 ? debate.topic.slice(0, 60) + '…' : debate.topic}
        </div>

        {/* Big title */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: isMobile ? 28 : 42, fontWeight: 700,
          color: 'var(--text)', lineHeight: 1.15,
          letterSpacing: '-0.01em', margin: '0 0 20px',
        }}>
          {debate.title}
        </h1>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>
            {formatDate(debate.date)}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text3)', opacity: 0.4, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>{debate.venue}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text3)', opacity: 0.4, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>Interpellationsdebatt</span>
        </div>
      </div>

      {/* ── Ingress ─────────────────────────────────────────── */}
      <div style={{ padding: isMobile ? '28px 0' : '40px 0', borderBottom: '1px solid var(--border)' }}>
        {loadingAI || debate.aiLoading ? (
          <div>
            <div className="skeleton" style={{ height: 22, marginBottom: 12, width: '100%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 22, marginBottom: 12, width: '93%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 22, marginBottom: 12, width: '85%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 22, width: '60%', borderRadius: 6 }} />
          </div>
        ) : debate.aiError ? (
          <p style={{ fontSize: 15, color: 'var(--text3)', lineHeight: 1.7 }}>{debate.aiError}</p>
        ) : debate.ingress ? (
          <p
            style={{ fontFamily: 'var(--font-body)', fontSize: isMobile ? 16 : 19, color: 'var(--text2)', lineHeight: 1.75, margin: 0, fontWeight: 400 }}
            dangerouslySetInnerHTML={{ __html: markBold(debate.ingress) }}
          />
        ) : (
          <p style={{ fontSize: 16, color: 'var(--text3)', lineHeight: 1.7 }}>Laddar sammanfattning…</p>
        )}
      </div>

      {/* ── Speakers ─────────────────────────────────────────── */}
      {allParticipants.length > 0 && (
        <div style={{ padding: isMobile ? '24px 0' : '32px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 14 }}>
            Talare i debatten
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allParticipants.map((p, i) => {
              const party = getParty(p.person.party)
              return (
                <div key={p.person.id || i} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 10px' }}>
                  <img
                    src={p.person.photoUrl} alt={p.person.name} loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover', objectPosition: 'top center', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{p.person.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: party?.color ?? '#444', color: party?.textColor ?? '#fff' }}>
                    {p.person.party}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Bloc summaries ───────────────────────────────────── */}
      {(debate.leftBloc || debate.rightBloc) && (
        <div style={{ padding: isMobile ? '28px 0' : '40px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 20 }}>
            Vad tycker blocken?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            {/* Left bloc */}
            {debate.leftBloc && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {(debate.leftBloc.parties ?? []).map(p => {
                    const party = getParty(p)
                    return <span key={p} style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 6, background: party?.color ?? '#888', color: party?.textColor ?? '#fff' }}>{p}</span>
                  })}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: '0 0 14px', flex: 1 }}>
                  {debate.leftBloc.summary}
                </p>
                {debate.leftBloc.keyArg && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', paddingTop: 14, borderTop: '1px solid var(--border)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--text3)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kärnargument · </span>
                    {debate.leftBloc.keyArg}
                  </div>
                )}
                <ReactionButtons debateId={debate.id} bloc="left" />
              </div>
            )}

            {/* Right bloc */}
            {debate.rightBloc && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {(debate.rightBloc.parties ?? []).map(p => {
                    const party = getParty(p)
                    return <span key={p} style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 6, background: party?.color ?? '#888', color: party?.textColor ?? '#fff' }}>{p}</span>
                  })}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: '0 0 14px', flex: 1 }}>
                  {debate.rightBloc.summary}
                </p>
                {debate.rightBloc.keyArg && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', paddingTop: 14, borderTop: '1px solid var(--border)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--text3)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kärnargument · </span>
                    {debate.rightBloc.keyArg}
                  </div>
                )}
                <ReactionButtons debateId={debate.id} bloc="right" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <div style={{ padding: isMobile ? '20px 0 40px' : '28px 0 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {debate.dokId && (
          <a
            href={`https://www.riksdagen.se/sv/dokument-och-lagar/dokument/${debate.dokType === 'bet' ? 'betankande' : 'interpellation'}/_${debate.dokId}/`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            Läs hela debatten på riksdagen.se →
          </a>
        )}
        <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>
          Foton © Sveriges riksdag
        </p>
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return dateStr }
}

function markBold(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text);font-weight:600">$1</strong>')
}
