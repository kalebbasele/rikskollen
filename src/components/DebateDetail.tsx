import React, { useEffect, useState } from 'react'
import type { Debate } from '../types'
import { getParty } from '../types'
import { generateDebateSummary } from '../lib/aiClient'
import { useIsMobile } from '../hooks/useIsMobile'

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
  const n = allParticipants.length || 1

  return (
    <div style={{ padding: '0 16px' }}>
      {/* Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : `1fr ${n * 120 + 8}px`,
          minHeight: isMobile ? 'auto' : 200,
          borderRadius: 16,
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'linear-gradient(135deg, rgba(124,92,252,0.12) 0%, rgba(13,27,42,0.9) 100%)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.35)',
          marginBottom: 15,
        }}
      >
        {/* Text */}
        <div style={{
          padding: isMobile ? '18px 16px 14px' : '28px 22px',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent2)', marginBottom: 8 }}>
            {debate.topic.length > 45 ? debate.topic.slice(0, 45) + '…' : debate.topic}
          </div>
          <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, lineHeight: 1.25, color: '#fff', marginBottom: 8 }}>
            {debate.title}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            Interpellationsdebatt · {formatDate(debate.date)} · {debate.venue}
          </div>
        </div>

        {/* Right — portrait boxes with gaps */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: isMobile ? 6 : 8, padding: isMobile ? '0 10px 10px' : 8, alignItems: 'stretch', overflowX: isMobile ? 'auto' : 'visible', minHeight: isMobile ? 120 : 'auto' }}>
          {allParticipants.map((p, i) => {
            const party = getParty(p.person.party)
            const glow = party?.color ?? '#334466'
            const first = p.person.firstName?.[0] ?? p.person.name[0] ?? ''
            const last = p.person.lastName || p.person.name.split(' ').slice(-1)[0]
            const name = first ? `${first}.${last}` : last
            return (
              <div key={p.person.id || i} style={{
                position: 'relative',
                flex: isMobile ? '0 0 90px' : 1,
                width: isMobile ? 90 : undefined,
                minHeight: isMobile ? 110 : 0,
                borderRadius: 10, overflow: 'hidden',
                background: `linear-gradient(180deg, #0d1520 0%, ${glow}33 100%)`,
              }}>
                <img
                  src={p.person.photoUrl} alt={p.person.name} loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: '18%',
                  background: `linear-gradient(to top, ${glow}ee 0%, transparent 100%)`,
                }} />
                {/* Name + badge — bottom row */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '4px 6px 6px',
                  display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
                    {name}
                  </span>
                  <div style={{
                    width: isMobile ? 15 : 18, height: isMobile ? 15 : 18, borderRadius: 4,
                    background: party?.color ?? '#444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isMobile ? 8 : 10, fontWeight: 800, color: '#fff', flexShrink: 0,
                  }}>
                    {p.person.party.slice(0, 2)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ingress */}
      {loadingAI || debate.aiLoading ? (
        <div style={{ marginBottom: 15 }}>
          <div className="skeleton" style={{ height: 16, marginBottom: 8, width: '100%' }} />
          <div className="skeleton" style={{ height: 16, marginBottom: 8, width: '90%' }} />
          <div className="skeleton" style={{ height: 16, width: '75%' }} />
        </div>
      ) : debate.aiError ? (
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 15 }}>{debate.aiError}</p>
      ) : debate.ingress ? (
        <p
          style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 15 }}
          dangerouslySetInnerHTML={{ __html: markBold(debate.ingress) }}
        />
      ) : (
        <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 15 }}>
          Laddar sammanfattning…
        </p>
      )}

      {/* Alla talare */}
      {allParticipants.length > 0 && (
        <div style={{ marginBottom: 15 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8 }}>
            Talare i debatten
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allParticipants.map((p, i) => {
              const party = getParty(p.person.party)
              return (
                <div key={p.person.id || i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 8, padding: '5px 8px' }}>
                  <img
                    src={p.person.photoUrl}
                    alt={p.person.name}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover', objectPosition: 'top center' }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{p.person.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: party?.color ?? '#444', color: party?.textColor ?? '#fff' }}>
                    {p.person.party}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bloc summaries */}
      {(debate.leftBloc || debate.rightBloc) && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text3)',
              marginBottom: 10,
            }}
          >
            Vad tycker blocken?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 15 }}>
            {/* Left bloc */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '12px 11px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--red)',
                  marginBottom: 5,
                }}
              >
                Vänsterblocket
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                {(debate.leftBloc?.parties ?? []).map(p => {
                  const party = getParty(p)
                  return (
                    <span
                      key={p}
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: '2px 5px',
                        borderRadius: 4,
                        background: party?.color ?? '#888',
                        color: '#fff',
                      }}
                    >
                      {p}
                    </span>
                  )
                })}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 8 }}>
                {debate.leftBloc?.summary}
              </p>
              {debate.leftBloc?.keyArg && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text)',
                    paddingTop: 8,
                    borderTop: '1px solid var(--border)',
                    lineHeight: 1.45,
                  }}
                >
                  <span style={{ color: 'var(--text3)', fontWeight: 700 }}>Kärnargument: </span>
                  {debate.leftBloc.keyArg}
                </div>
              )}
            </div>

            {/* Right bloc */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '12px 11px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--accent2)',
                  marginBottom: 5,
                }}
              >
                Högerblocket
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                {(debate.rightBloc?.parties ?? []).map(p => {
                  const party = getParty(p)
                  return (
                    <span
                      key={p}
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: '2px 5px',
                        borderRadius: 4,
                        background: party?.color ?? '#888',
                        color: '#fff',
                      }}
                    >
                      {p}
                    </span>
                  )
                })}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 8 }}>
                {debate.rightBloc?.summary}
              </p>
              {debate.rightBloc?.keyArg && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text)',
                    paddingTop: 8,
                    borderTop: '1px solid var(--border)',
                    lineHeight: 1.45,
                  }}
                >
                  <span style={{ color: 'var(--text3)', fontWeight: 700 }}>Kärnargument: </span>
                  {debate.rightBloc.keyArg}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Länk till hela debatten */}
      {debate.dokId && (
        <a
          href={`https://www.riksdagen.se/sv/dokument-och-lagar/dokument/interpellation/_${debate.dokId}/`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            fontSize: 12,
            color: 'var(--accent2)',
            marginBottom: 15,
            textDecoration: 'none',
            borderBottom: '1px solid var(--accent2)',
            paddingBottom: 1,
          }}
        >
          Läs hela debatten →
        </a>
      )}

      {/* Photo attribution */}
      {allParticipants.length > 0 && (
        <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 16 }}>
          Foton © Sveriges riksdag · riksdagen.se
        </p>
      )}
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
