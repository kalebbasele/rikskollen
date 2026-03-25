import React, { useState, useMemo } from 'react'
import type { ActiveFilters, Debate, Vote } from './types'
import { useDebates, useVotes } from './hooks/useData'
import { getParty } from './types'
import DebateDetail from './components/DebateDetail'
import VoteCard from './components/VoteCard'
import SkeletonCard from './components/SkeletonCard'
import Valkompass from './components/Valkompass'
import { useIsMobile } from './hooks/useIsMobile'

type Tab = 'debatter' | 'omrostningar' | 'valkompass'

const CATEGORIES = ['Alla', 'Migration', 'Ekonomi', 'Klimat', 'Vård', 'Försvar', 'Utbildning', 'Utrikespolitik']

function getCategory(text: string): { label: string; color: string } {
  const t = text.toLowerCase()
  if (t.match(/äldreom/)) return { label: 'Äldreomsorg', color: '#b8916a' }
  if (t.match(/ekonomi|budget|skatt|finans|moms|pension/)) return { label: 'Ekonomi', color: '#6a9e7f' }
  if (t.match(/vård|sjukvård|hälso|omsorg/)) return { label: 'Vård', color: '#9a6e9e' }
  if (t.match(/migration|asyl|gräns|utvisning|flykt/)) return { label: 'Migration', color: '#6a8aae' }
  if (t.match(/trafik|väg|järnväg|bostad|hyres/)) return { label: 'Trafik & Bostad', color: '#8a8aae' }
  if (t.match(/försvar|nato|militär|säkerhet/)) return { label: 'Försvar', color: '#8a9a6e' }
  if (t.match(/utbildning|skola|lärare|förskola|högskola/)) return { label: 'Utbildning', color: '#7a8aae' }
  if (t.match(/klimat|miljö|utsläpp|energi|kärnkraft/)) return { label: 'Klimat', color: '#6a9e8a' }
  return { label: 'Riksdag', color: 'rgba(255,255,255,0.3)' }
}

function matchesCategory(debate: Debate, cat: string): boolean {
  if (cat === 'Alla') return true
  const text = (debate.title + debate.topic).toLowerCase()
  const map: Record<string, string[]> = {
    'Migration': ['migration', 'asyl', 'gräns', 'utvisning', 'flykt'],
    'Ekonomi': ['ekonomi', 'budget', 'skatt', 'finansi', 'moms', 'arbete', 'pension'],
    'Klimat': ['klimat', 'miljö', 'utsläpp', 'energi', 'kärnkraft'],
    'Vård': ['vård', 'sjukvård', 'hälso', 'äldreomsorg', 'omsorg'],
    'Försvar': ['försvar', 'nato', 'militär', 'säkerhet'],
    'Utbildning': ['utbildning', 'skola', 'förskola', 'lärare', 'högskola'],
    'Utrikespolitik': ['utrik', 'iran', 'ukraina', 'fn ', 'eu ', 'bistånd'],
  }
  return (map[cat] ?? []).some(k => text.includes(k))
}

function PartyBadge({ party, size = 20, radius = 5 }: { party: string; size?: number; radius?: number }) {
  const p = getParty(party)
  return (
    <div style={{
      width: size, height: size,
      borderRadius: radius,
      background: p?.color ?? '#333',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.52), fontWeight: 800,
      color: p?.textColor ?? '#fff',
      flexShrink: 0,
    }}>
      {party.slice(0, 2)}
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('debatter')
  const [selectedDebateId, setSelectedDebateId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('Alla')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const isMobile = useIsMobile()

  const { debates, loading: debatesLoading, error: debatesError, updateDebate } = useDebates()
  const { votes, loading: votesLoading, error: votesError } = useVotes()

  const filteredDebates = useMemo(() =>
    debates.filter(d => matchesCategory(d, activeCategory)),
    [debates, activeCategory]
  )

  const selectedDebate = selectedDebateId ? debates.find(d => d.id === selectedDebateId) : null
  const showDetail = !!selectedDebate

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '')
  }

  const latestDebate = debates[0]

  function goHome() {
    setSelectedDebateId(null)
    setTab('debatter')
  }

  return (
    <div>
      {/* Navbar */}
      <div style={{ background: '#0b0b18', borderBottom: '0.5px solid rgba(255,255,255,0.07)', height: 48 }}>
        <div className="page-inner" style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
          <div onClick={goHome} style={{ fontSize: 22, fontWeight: 500, color: '#fff', letterSpacing: '-0.02em', cursor: 'pointer', userSelect: 'none' }}>
            Civi<span style={{ color: '#9b7dff' }}>ca</span>
          </div>
          <div style={{ display: 'flex', marginLeft: 'auto', alignItems: 'center' }}>
            {showDetail ? (
              <button onClick={() => setSelectedDebateId(null)} style={{ fontSize: 15, fontWeight: 600, color: '#9b7dff', background: 'none', border: 'none' }}>
                Tillbaka
              </button>
            ) : (
              <>
                {(['debatter', 'omrostningar', 'valkompass'] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    fontSize: 15, color: tab === t ? '#fff' : 'rgba(255,255,255,0.35)',
                    padding: '0 14px', background: 'none', border: 'none',
                    borderLeft: '0.5px solid rgba(255,255,255,0.07)', height: 48,
                    fontWeight: tab === t ? 500 : 400,
                  }}>
                    {t === 'debatter' ? 'Debatter' : t === 'omrostningar' ? 'Omröstningar' : 'Valkompass'}
                  </button>
                ))}
                <button onClick={toggleTheme} style={{
                  fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '0 14px',
                  borderLeft: '0.5px solid rgba(255,255,255,0.07)', background: 'none', border: 'none', height: 48,
                }}>
                  {theme === 'dark' ? 'Ljust' : 'Mörkt'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ticker */}
      {!showDetail && latestDebate && (
        <div style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
          <div className="page-inner" style={{ padding: '7px 24px', fontSize: 14, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9b7dff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Senaste</span>
            {latestDebate.topic} · {formatDate(latestDebate.date)}
          </div>
        </div>
      )}

      {/* Category tabs */}
      {!showDetail && tab === 'debatter' && (
        <div style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
          <div className="page-inner" style={{ padding: '0 24px', display: 'flex', overflowX: 'auto' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                fontSize: 15,
                color: activeCategory === cat ? 'var(--text)' : 'var(--text3)',
                padding: '10px 12px 10px 0', background: 'none', border: 'none',
                borderBottom: activeCategory === cat ? '2px solid rgba(155,125,255,0.7)' : '2px solid transparent',
                whiteSpace: 'nowrap',
                fontWeight: activeCategory === cat ? 500 : 400,
              }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {showDetail ? (
        <div className="page-inner" style={{ padding: isMobile ? '12px 0 60px' : '20px 20px 60px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <DebateDetail debate={selectedDebate!} onUpdate={(updated: Debate) => updateDebate(updated)} />
          </div>
        </div>
      ) : tab === 'debatter' ? (
        <div className="page-inner">
          {debatesLoading ? (
            <div style={{ padding: 20 }}>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : debatesError ? (
            <StatusMessage message={debatesError} />
          ) : filteredDebates.length === 0 ? (
            <StatusMessage message="Inga debatter matchar." />
          ) : (
            <>
              {/* Hero — first debate */}
              <HeroCard debate={filteredDebates[0]} onClick={() => setSelectedDebateId(filteredDebates[0].id)} isMobile={isMobile} />

              {/* Subgrid — debates 2–4 */}
              {filteredDebates.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 8 : 12, padding: isMobile ? '8px 12px 6px' : '16px 16px 8px' }}>
                  {filteredDebates.slice(1, isMobile ? 3 : 4).map((d, i, arr) => (
                    <SubgridCard
                      key={d.id}
                      debate={d}
                      onClick={() => setSelectedDebateId(d.id)}
                      isLast={i === arr.length - 1}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )}

              {/* Feed — debates 5+ grouped by date */}
              {filteredDebates.length > (isMobile ? 3 : 4) && (
                <FeedSection debates={filteredDebates.slice(isMobile ? 3 : 4)} onSelect={(id) => setSelectedDebateId(id)} />
              )}
            </>
          )}
        </div>
      ) : tab === 'valkompass' ? (
        <div className="page-inner" style={{ padding: isMobile ? '16px 12px 60px' : '24px 20px 60px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <Valkompass />
          </div>
        </div>
      ) : (
        <div className="page-inner" style={{ padding: '16px 20px 60px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {votesLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : votesError
              ? <StatusMessage message={votesError} />
              : votes.length === 0
              ? <StatusMessage message="Inga omröstningar." />
              : votes.map(v => <VoteCard key={v.id} vote={v} />)
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── Hero card (debate[0]) ─────────────────────────────────────────────────────

function HeroCard({ debate, onClick, isMobile }: { debate: Debate; onClick: () => void; isMobile: boolean }) {
  const cat = getCategory(debate.topic + debate.title)
  const participants = debate.participants
  const n = Math.max(participants.length, 1)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : `1fr ${n * 120 + 8}px`,
        minHeight: isMobile ? 'auto' : 240,
        cursor: 'pointer',
        margin: isMobile ? '12px 12px 8px' : '16px 16px 8px',
        borderRadius: 16,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'linear-gradient(135deg, rgba(124,92,252,0.12) 0%, rgba(13,27,42,0.9) 100%)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}
    >
      {/* Text */}
      <div style={{
        padding: isMobile ? '20px 16px 14px' : '32px 28px 28px',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}>
        <div style={{ fontSize: isMobile ? 11 : 13, fontWeight: 700, color: '#9b7dff', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
          Senaste · {cat.label}
        </div>
        <div style={{ fontSize: isMobile ? 22 : 32, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2, marginBottom: 8 }}>
          {debate.title}
        </div>
        <div style={{ fontSize: isMobile ? 12 : 14, color: 'var(--text2)' }}>
          {formatDate(debate.date)} · {debate.venue} · Interpellationsdebatt
        </div>
      </div>

      {/* Portrait boxes — horizontal scroll on mobile */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: isMobile ? 6 : 8,
        padding: isMobile ? '0 10px 10px' : 8,
        overflowX: isMobile ? 'auto' : 'visible',
        minHeight: isMobile ? 130 : 'auto',
      }}>
        {participants.map((p, i) => {
          const party = getParty(p.person.party)
          const glow = party?.color ?? '#334466'
          const shortName = abbrevName(p.person)
          return (
            <div key={p.person.id || i} style={{
              position: 'relative',
              flex: isMobile ? '0 0 90px' : 1,
              width: isMobile ? 90 : undefined,
              borderRadius: 10,
              overflow: 'hidden',
              background: `linear-gradient(180deg, #0d1520 0%, ${glow}33 100%)`,
              minHeight: isMobile ? 120 : 0,
            }}>
              <img
                src={p.person.photoUrl} alt={p.person.name} loading="lazy"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
              />
              {/* Party glow overlay at bottom */}
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
                  {shortName}
                </span>
                <PartyBadge party={p.person.party} size={isMobile ? 15 : 18} radius={4} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Subgrid card (debates 2–4) ────────────────────────────────────────────────

function SubgridCard({ debate, onClick, isLast: _isLast, isMobile }: { debate: Debate; onClick: () => void; isLast: boolean; isMobile: boolean }) {
  const cat = getCategory(debate.topic + debate.title)
  const participants = debate.participants
  const firstParty = getParty(participants[0]?.person.party)
  const accentColor = firstParty?.color ?? '#7c5cfc'

  const cardStyle: React.CSSProperties = {
    display: 'flex', flexDirection: isMobile ? 'row' : 'column',
    cursor: 'pointer',
    borderRadius: 14,
    background: `linear-gradient(160deg, ${accentColor}12 0%, rgba(13,21,36,0.92) 60%)`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '0.5px solid rgba(255,255,255,0.1)',
    boxShadow: `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)`,
    overflow: 'hidden',
  }

  return (
    <div onClick={onClick} style={cardStyle}>
      {/* Text */}
      <div style={{ flex: 1, padding: isMobile ? '14px 14px' : '18px 18px 12px', minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: cat.color, marginBottom: 6 }}>
          {cat.label}
        </div>
        <div style={{ fontSize: isMobile ? 15 : 17, color: 'var(--text)', fontWeight: 500, lineHeight: 1.4 }}>
          {debate.title.length > (isMobile ? 60 : 75) ? debate.title.slice(0, isMobile ? 60 : 75) + '…' : debate.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
          {formatDateShort(debate.date)}
        </div>
      </div>

      {/* Portraits */}
      <div style={{
        borderTop: isMobile ? 'none' : '0.5px solid rgba(255,255,255,0.07)',
        borderLeft: isMobile ? '0.5px solid rgba(255,255,255,0.07)' : 'none',
        padding: isMobile ? '10px 12px' : '10px 18px 14px',
        display: 'flex', gap: 6,
        alignItems: 'center',
        flexShrink: 0,
      }}>
        {participants.slice(0, isMobile ? 2 : participants.length).map((p, i) => {
          const party = getParty(p.person.party)
          const glow = party?.color ?? '#334466'
          const sz = isMobile ? 44 : 52
          return (
            <div key={p.person.id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: sz, height: sz, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                background: `linear-gradient(180deg, #0d1520 0%, ${glow}44 100%)`,
                boxShadow: `0 0 10px ${glow}44`,
                position: 'relative',
              }}>
                <img
                  src={p.person.photoUrl} alt={p.person.name} loading="lazy"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                />
              </div>
              <PartyBadge party={p.person.party} size={18} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Feed section (debates 5+, grouped by date) ────────────────────────────────

function FeedSection({ debates, onSelect }: { debates: Debate[]; onSelect: (id: string) => void }) {
  const groups: { date: string; debates: Debate[] }[] = []
  const seen = new Map<string, number>()
  debates.forEach(d => {
    const key = d.date.slice(0, 10)
    if (seen.has(key)) {
      groups[seen.get(key)!].debates.push(d)
    } else {
      seen.set(key, groups.length)
      groups.push({ date: key, debates: [d] })
    }
  })

  return (
    <>
      {groups.map(group => (
        <div key={group.date}>
          <div style={{
            padding: '14px 20px 6px',
            fontSize: 11, fontWeight: 700, color: 'var(--text3)',
            textTransform: 'uppercase', letterSpacing: '0.12em',
            borderTop: '0.5px solid rgba(255,255,255,0.05)',
          }}>
            {formatDateLabel(group.date)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px 8px' }}>
            {group.debates.map(d => (
              <FeedCard key={d.id} debate={d} onClick={() => onSelect(d.id)} />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

function FeedCard({ debate, onClick }: { debate: Debate; onClick: () => void }) {
  const cat = getCategory(debate.topic + debate.title)
  const firstParty = getParty(debate.participants[0]?.person.party)
  const accentColor = firstParty?.color ?? '#7c5cfc'

  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        padding: '14px 20px',
        borderRadius: 10,
        background: `linear-gradient(135deg, ${accentColor}0d 0%, rgba(13,21,36,0.88) 100%)`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '0.5px solid rgba(255,255,255,0.09)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: cat.color }}>
        {cat.label}
      </div>
      <div style={{ fontSize: 17, color: 'var(--text)', fontWeight: 500, lineHeight: 1.4 }}>
        {debate.title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text3)' }}>
        {debate.venue}
      </div>
    </div>
  )
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function abbrevName(person: { firstName?: string; lastName?: string; name: string }): string {
  const first = person.firstName?.[0] ?? person.name[0] ?? ''
  const last = person.lastName || person.name.split(' ').slice(-1)[0]
  return first ? `${first}.${last}` : last
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return dateStr }
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })
  } catch { return dateStr }
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
  } catch { return dateStr }
}

function StatusMessage({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.25)' }}>
      <p style={{ fontSize: 15, color: 'var(--text3)' }}>{message}</p>
    </div>
  )
}
