import React, { useEffect, useState } from 'react'
import type { Debate } from '../types'
import { getParty } from '../types'
import { generateDebateSummary } from '../lib/aiClient'

interface Props {
  debate: Debate
  onUpdate: (updated: Debate) => void
}

export default function DebateDetail({ debate, onUpdate }: Props) {
  const [loadingAI, setLoadingAI] = useState(false)

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

  const mainParticipants = debate.participants.slice(0, 2)
  const bannerHeight = 196

  return (
    <div style={{ padding: '0 16px' }}>
      {/* Banner */}
      <div
        style={{
          height: bannerHeight,
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          display: 'flex',
          background: '#0d1b2a',
          marginBottom: 15,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(120deg, #0d1b2a 0%, #1a2d44 60%, #0a1520 100%)',
          }}
        />

        {/* Text — flex-end pushes content to bottom */}
        <div
          style={{
            flex: 1,
            padding: '18px 15px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            position: 'relative',
            zIndex: 2,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent2)',
              marginBottom: 7,
            }}
          >
            {debate.topic.length > 45 ? debate.topic.slice(0, 45) + '…' : debate.topic}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.25, color: '#fff' }}>
            {debate.title}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 5 }}>
            Interpellationsdebatt · {formatDate(debate.date)} · {debate.venue}
          </div>
        </div>

        {/* Side-by-side portraits */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: mainParticipants.length > 1 ? '1fr 1fr' : '1fr',
            flexShrink: 0,
            width: mainParticipants.length > 1 ? 172 : 86,
            height: bannerHeight,
            overflow: 'hidden',
          }}
        >
          {mainParticipants.map((p, i) => {
            const party = getParty(p.person.party)
            return (
              <div
                key={p.person.id || i}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderLeft: i > 0 ? '0.5px solid rgba(255,255,255,0.07)' : 'none',
                  background: `${party?.color ?? '#334'}18`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <img
                  src={p.person.photoUrl}
                  alt={p.person.name}
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  style={{ width: '100%', flex: 1, objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(0,0,0,0.6)',
                  padding: '3px 5px',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <span style={{
                    fontSize: 9, color: '#fff', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                  }}>
                    {p.person.firstName[0]}. {p.person.lastName}
                  </span>
                  <span style={{
                    fontSize: 7, fontWeight: 800, flexShrink: 0,
                    padding: '1px 4px', borderRadius: 3,
                    background: party?.color ?? '#444',
                    color: party?.textColor ?? '#fff',
                  }}>
                    {p.person.party}
                  </span>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
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
                        background: `${party?.color ?? '#888'}22`,
                        color: party?.textColor ?? party?.color ?? '#888',
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
                        background: `${party?.color ?? '#888'}22`,
                        color: party?.textColor ?? party?.color ?? '#888',
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
      {mainParticipants.length > 0 && (
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
