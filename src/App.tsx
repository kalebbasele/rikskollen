import React, { useState, useMemo } from 'react'
import type { Debate, Vote } from './types'
import { useDebates, useVotes } from './hooks/useData'
import { getParty } from './types'
import DebateDetail from './components/DebateDetail'
import VoteCard from './components/VoteCard'
import SkeletonCard from './components/SkeletonCard'
import Valkompass from './components/Valkompass'
import { useIsMobile } from './hooks/useIsMobile'

type Tab = 'debatter' | 'omrostningar' | 'valkompass'

const CATEGORIES = ['Alla', 'Migration', 'Ekonomi', 'Klimat', 'Vård', 'Försvar', 'Utbildning', 'Utrikespolitik']

function getCategory(text: string): { label: string; color: string; lightColor: string } {
  const t = text.toLowerCase()
  if (t.match(/äldreom/)) return { label: 'Äldreomsorg', color: '#b8916a', lightColor: '#8a5a2a' }
  if (t.match(/ekonomi|budget|skatt|finans|moms|pension/)) return { label: 'Ekonomi', color: '#6a9e7f', lightColor: '#2d6a4a' }
  if (t.match(/vård|sjukvård|hälso|omsorg/)) return { label: 'Vård', color: '#9a6e9e', lightColor: '#6a3a6a' }
  if (t.match(/migration|asyl|gräns|utvisning|flykt/)) return { label: 'Migration', color: '#6a8aae', lightColor: '#2a4a7a' }
  if (t.match(/trafik|väg|järnväg|bostad|hyres/)) return { label: 'Trafik & Bostad', color: '#8a8aae', lightColor: '#4a4a7a' }
  if (t.match(/försvar|nato|militär|säkerhet/)) return { label: 'Försvar', color: '#8a9a6e', lightColor: '#4a6a3a' }
  if (t.match(/utbildning|skola|lärare|förskola|högskola/)) return { label: 'Utbildning', color: '#7a8aae', lightColor: '#3a4a7a' }
  if (t.match(/klimat|miljö|utsläpp|energi|kärnkraft/)) return { label: 'Klimat', color: '#6a9e8a', lightColor: '#2a6a5a' }
  return { label: 'Riksdag', color: 'rgba(255,255,255,0.3)', lightColor: '#888' }
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

function readUrl(): { tab: Tab; debateId: string | null } {
  const p = new URLSearchParams(window.location.search)
  const tab = (p.get('tab') as Tab) || 'debatter'
  const debateId = p.get('debate') || null
  return { tab, debateId }
}

export default function App() {
  const initial = readUrl()
  const [tab, setTabState] = useState<Tab>(initial.tab)
  const [selectedDebateId, setSelectedDebateId] = useState<string | null>(initial.debateId)
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

  // Sync URL → state when browser back/forward is pressed
  React.useEffect(() => {
    function onPop() {
      const { tab, debateId } = readUrl()
      setTabState(tab)
      setSelectedDebateId(debateId)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function setTab(t: Tab) {
    setTabState(t)
    setSelectedDebateId(null)
    const url = t === 'debatter' ? '/' : `/?tab=${t}`
    history.pushState({}, '', url)
  }

  function openDebate(id: string) {
    setSelectedDebateId(id)
    history.pushState({}, '', `/?debate=${id}`)
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '')
  }

  const latestDebate = debates[0]

  function goHome() {
    setSelectedDebateId(null)
    setTabState('debatter')
    history.pushState({}, '', '/')
  }

  // ── Light theme ────────────────────────────────────────────────────────────
  if (theme === 'light') {
    return (
      <div style={{ background: '#f7f7fb', minHeight: '100vh' }}>
        {/* Navbar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f8', height: 56 }}>
          <div className="page-inner" style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
          <div onClick={goHome} style={{ fontSize: 20, fontWeight: 700, color: '#111', letterSpacing: '-0.03em', cursor: 'pointer', userSelect: 'none' }}>
            Civi<span style={{ color: '#5b3fd4' }}>ca</span>
          </div>
          <div style={{ display: 'flex', marginLeft: 'auto', alignItems: 'center', gap: 4 }}>
            {showDetail ? (
              <button onClick={() => history.back()} style={{ fontSize: 14, fontWeight: 600, color: '#5b3fd4', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Tillbaka
              </button>
            ) : (
              <>
                {(['debatter', 'omrostningar', 'valkompass'] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    fontSize: 14,
                    color: tab === t ? '#fff' : '#aaa',
                    padding: '7px 16px',
                    background: tab === t ? '#111' : 'none',
                    border: 'none', borderRadius: 24,
                    fontWeight: tab === t ? 600 : 400,
                    cursor: 'pointer',
                  }}>
                    {t === 'debatter' ? 'Debatter' : t === 'omrostningar' ? 'Omröstningar' : 'Valkompass'}
                  </button>
                ))}
                <button onClick={toggleTheme} style={{ fontSize: 13, color: '#bbb', padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Mörkt
                </button>
              </>
            )}
          </div>
          </div>
        </div>

        {/* Content */}
        {showDetail ? (
          <div style={{ padding: isMobile ? '12px 0 60px' : '20px 20px 60px', maxWidth: 860, margin: '0 auto' }}>
            <DebateDetail debate={selectedDebate!} onUpdate={(updated: Debate) => updateDebate(updated)} />
          </div>
        ) : tab === 'debatter' ? (
          <div className="page-inner" style={{ background: '#fff' }}>
            {debatesLoading ? (
              <div style={{ padding: 20 }}>{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : debatesError ? (
              <LightStatusMessage message={debatesError} />
            ) : filteredDebates.length === 0 ? (
              <LightStatusMessage message="Inga debatter matchar." />
            ) : (
              <>
                {/* Purple filter band */}
                <div style={{ background: '#5b3fd4', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 14, overflowX: 'auto' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Filtrera debatter
                  </span>
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                      fontSize: 13,
                      color: activeCategory === cat ? '#fff' : 'rgba(255,255,255,0.55)',
                      padding: '4px 14px', borderRadius: 24,
                      background: activeCategory === cat ? 'rgba(255,255,255,0.18)' : 'transparent',
                      border: activeCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      fontWeight: activeCategory === cat ? 600 : 400,
                    }}>
                      {cat}
                    </button>
                  ))}
                </div>

                <LightHeroCard debate={filteredDebates[0]} onClick={() => openDebate(filteredDebates[0].id)} isMobile={isMobile} />

                {filteredDebates.length > 1 && (
                  <LightSubgrid debates={filteredDebates.slice(1, isMobile ? 3 : 4)} onSelect={id => openDebate(id)} isMobile={isMobile} />
                )}

                {filteredDebates.length > (isMobile ? 3 : 4) && (
                  <LightFeedSection debates={filteredDebates.slice(isMobile ? 3 : 4)} onSelect={id => openDebate(id)} />
                )}
              </>
            )}
          </div>
        ) : tab === 'valkompass' ? (
          <div className="page-inner" style={{ padding: isMobile ? '16px 12px 60px' : '24px 20px 60px' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}><Valkompass /></div>
          </div>
        ) : (
          <div className="page-inner" style={{ padding: '16px 20px 60px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {votesLoading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                : votesError ? <LightStatusMessage message={votesError} />
                : votes.length === 0 ? <LightStatusMessage message="Inga omröstningar." />
                : votes.map(v => <VoteCard key={v.id} vote={v} />)
              }
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Dark theme (unchanged) ─────────────────────────────────────────────────
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
              <button onClick={() => history.back()} style={{ fontSize: 15, fontWeight: 600, color: '#9b7dff', background: 'none', border: 'none' }}>
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
                  Ljust
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
            <div style={{ padding: 20 }}>{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : debatesError ? (
            <StatusMessage message={debatesError} />
          ) : filteredDebates.length === 0 ? (
            <StatusMessage message="Inga debatter matchar." />
          ) : (
            <>
              <HeroCard debate={filteredDebates[0]} onClick={() => openDebate(filteredDebates[0].id)} isMobile={isMobile} />
              {filteredDebates.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 8 : 12, padding: isMobile ? '8px 12px 6px' : '16px 16px 8px' }}>
                  {filteredDebates.slice(1, isMobile ? 3 : 4).map((d, i, arr) => (
                    <SubgridCard key={d.id} debate={d} onClick={() => openDebate(d.id)} isLast={i === arr.length - 1} isMobile={isMobile} />
                  ))}
                </div>
              )}
              {filteredDebates.length > (isMobile ? 3 : 4) && (
                <FeedSection debates={filteredDebates.slice(isMobile ? 3 : 4)} onSelect={id => openDebate(id)} />
              )}
            </>
          )}
        </div>
      ) : tab === 'valkompass' ? (
        <div className="page-inner" style={{ padding: isMobile ? '16px 12px 60px' : '24px 20px 60px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}><Valkompass /></div>
        </div>
      ) : (
        <div className="page-inner" style={{ padding: '16px 20px 60px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {votesLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : votesError ? <StatusMessage message={votesError} />
              : votes.length === 0 ? <StatusMessage message="Inga omröstningar." />
              : votes.map(v => <VoteCard key={v.id} vote={v} />)
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dark theme cards (unchanged) ──────────────────────────────────────────────

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
      <div style={{ padding: isMobile ? '20px 16px 14px' : '32px 28px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
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
      <div style={{
        display: 'flex', flexDirection: 'row', alignItems: 'stretch',
        gap: isMobile ? 6 : 8, padding: isMobile ? '0 10px 10px' : 8,
        overflowX: isMobile ? 'auto' : 'visible', minHeight: isMobile ? 130 : 'auto',
      }}>
        {participants.map((p, i) => {
          const party = getParty(p.person.party)
          const glow = party?.color ?? '#334466'
          const shortName = abbrevName(p.person)
          return (
            <div key={p.person.id || i} style={{
              position: 'relative', flex: isMobile ? '0 0 90px' : 1,
              width: isMobile ? 90 : undefined, borderRadius: 10, overflow: 'hidden',
              background: `linear-gradient(180deg, #0d1520 0%, ${glow}33 100%)`,
              minHeight: isMobile ? 120 : 0,
            }}>
              <img src={p.person.photoUrl} alt={p.person.name} loading="lazy"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '18%', background: `linear-gradient(to top, ${glow}ee 0%, transparent 100%)` }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 6px 6px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
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

function SubgridCard({ debate, onClick, isLast: _isLast, isMobile }: { debate: Debate; onClick: () => void; isLast: boolean; isMobile: boolean }) {
  const cat = getCategory(debate.topic + debate.title)
  const participants = debate.participants
  const firstParty = getParty(participants[0]?.person.party)
  const accentColor = firstParty?.color ?? '#7c5cfc'

  return (
    <div onClick={onClick} style={{
      display: 'flex', flexDirection: isMobile ? 'row' : 'column',
      cursor: 'pointer', borderRadius: 14,
      background: `linear-gradient(160deg, ${accentColor}12 0%, rgba(13,21,36,0.92) 60%)`,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '0.5px solid rgba(255,255,255,0.1)',
      boxShadow: `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)`,
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, padding: isMobile ? '14px 14px' : '18px 18px 12px', minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: cat.color, marginBottom: 6 }}>{cat.label}</div>
        <div style={{ fontSize: isMobile ? 15 : 17, color: 'var(--text)', fontWeight: 500, lineHeight: 1.4 }}>
          {debate.title.length > (isMobile ? 60 : 75) ? debate.title.slice(0, isMobile ? 60 : 75) + '…' : debate.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>{formatDateShort(debate.date)}</div>
      </div>
      <div style={{
        borderTop: isMobile ? 'none' : '0.5px solid rgba(255,255,255,0.07)',
        borderLeft: isMobile ? '0.5px solid rgba(255,255,255,0.07)' : 'none',
        padding: isMobile ? '10px 12px' : '10px 18px 14px',
        display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0,
      }}>
        {participants.slice(0, isMobile ? 2 : participants.length).map((p, i) => {
          const party = getParty(p.person.party)
          const glow = party?.color ?? '#334466'
          const sz = isMobile ? 44 : 52
          return (
            <div key={p.person.id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: sz, height: sz, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: `linear-gradient(180deg, #0d1520 0%, ${glow}44 100%)`, boxShadow: `0 0 10px ${glow}44`, position: 'relative' }}>
                <img src={p.person.photoUrl} alt={p.person.name} loading="lazy"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
              </div>
              <PartyBadge party={p.person.party} size={18} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeedSection({ debates, onSelect }: { debates: Debate[]; onSelect: (id: string) => void }) {
  const groups: { date: string; debates: Debate[] }[] = []
  const seen = new Map<string, number>()
  debates.forEach(d => {
    const key = d.date.slice(0, 10)
    if (seen.has(key)) { groups[seen.get(key)!].debates.push(d) }
    else { seen.set(key, groups.length); groups.push({ date: key, debates: [d] }) }
  })
  return (
    <>
      {groups.map(group => (
        <div key={group.date}>
          <div style={{ padding: '14px 20px 6px', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em', borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
            {formatDateLabel(group.date)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px 8px' }}>
            {group.debates.map(d => <FeedCard key={d.id} debate={d} onClick={() => onSelect(d.id)} />)}
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
    <div onClick={onClick} style={{
      cursor: 'pointer', padding: '14px 20px', borderRadius: 10,
      background: `linear-gradient(135deg, ${accentColor}0d 0%, rgba(13,21,36,0.88) 100%)`,
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: '0.5px solid rgba(255,255,255,0.09)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: cat.color }}>{cat.label}</div>
      <div style={{ fontSize: 17, color: 'var(--text)', fontWeight: 500, lineHeight: 1.4 }}>{debate.title}</div>
      <div style={{ fontSize: 13, color: 'var(--text3)' }}>{debate.venue}</div>
    </div>
  )
}

// ── Light theme cards ─────────────────────────────────────────────────────────

function LightHeroCard({ debate, onClick, isMobile }: { debate: Debate; onClick: () => void; isMobile: boolean }) {
  const cat = getCategory(debate.topic + debate.title)
  const participants = debate.participants

  return (
    <div onClick={onClick} style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 280px',
      minHeight: 230, cursor: 'pointer',
      margin: isMobile ? '12px 12px 8px' : '16px 16px 8px',
      borderRadius: 16, overflow: 'hidden',
      background: '#fff',
      boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
      border: '1px solid #f0f0f8',
    }}>
      {/* Left text */}
      <div style={{ padding: isMobile ? '24px 20px 20px' : '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ display: 'inline-flex', alignSelf: 'flex-start', background: '#f0eeff', color: '#5b3fd4', fontSize: 11, fontWeight: 700, borderRadius: 24, padding: '5px 12px', marginBottom: 16 }}>
          Senaste · {cat.label}
        </div>
        <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 700, color: '#111', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 12 }}>
          {debate.title}
        </div>
        <div style={{ fontSize: 12, color: '#bbb', lineHeight: 1.6 }}>
          {formatDate(debate.date)} · {debate.venue} · Interpellationsdebatt
        </div>
      </div>

      {/* Right portraits */}
      <div style={{
        display: 'flex', flexDirection: 'row', alignItems: 'stretch',
        gap: 8, padding: 8,
        borderLeft: isMobile ? 'none' : '1px solid #f0f0f8',
        borderTop: isMobile ? '1px solid #f0f0f8' : 'none',
        minHeight: isMobile ? 180 : 'auto',
      }}>
        {participants.slice(0, 2).map((p, i) => {
          const party = getParty(p.person.party)
          const glow = party?.color ?? '#5b3fd4'
          const shortName = abbrevName(p.person)
          return (
            <div key={p.person.id || i} style={{
              position: 'relative', flex: 1,
              borderRadius: 10, overflow: 'hidden',
              background: '#e8e6f0', minHeight: 180,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              <img src={p.person.photoUrl} alt={p.person.name} loading="lazy"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '18%', background: `linear-gradient(to top, ${glow}ee 0%, transparent 100%)` }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 6px 6px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{shortName}</span>
                <PartyBadge party={p.person.party} size={16} radius={4} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LightSubgrid({ debates, onSelect, isMobile }: { debates: Debate[]; onSelect: (id: string) => void; isMobile: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: isMobile ? 8 : 12,
      padding: isMobile ? '0 12px 8px' : '0 16px 8px',
    }}>
      {debates.map((debate, i) => {
        const cat = getCategory(debate.topic + debate.title)
        const participants = debate.participants
        return (
          <div key={debate.id} onClick={() => onSelect(debate.id)} style={{
            padding: '18px 18px 0',
            display: 'flex', flexDirection: 'column', cursor: 'pointer',
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #f0f0f8',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cat.lightColor, marginBottom: 8 }}>
              {cat.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111', lineHeight: 1.4, flex: 1 }}>
              {debate.title.length > 80 ? debate.title.slice(0, 80) + '…' : debate.title}
            </div>
            <div style={{ fontSize: 11, color: '#ccc', marginTop: 6, marginBottom: 14 }}>
              {formatDateShort(debate.date)}
            </div>
            {/* Portraits */}
            <div style={{ display: 'flex', gap: 6, paddingBottom: 18 }}>
              {participants.slice(0, 3).map((p, pi) => {
                const sz = 48
                return (
                  <div key={p.person.id || pi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: sz, height: sz, borderRadius: 10, overflow: 'hidden', background: '#e8e6f0', position: 'relative', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                      <img src={p.person.photoUrl} alt={p.person.name} loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                    </div>
                    <PartyBadge party={p.person.party} size={16} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LightFeedSection({ debates, onSelect }: { debates: Debate[]; onSelect: (id: string) => void }) {
  const groups: { date: string; debates: Debate[] }[] = []
  const seen = new Map<string, number>()
  debates.forEach(d => {
    const key = d.date.slice(0, 10)
    if (seen.has(key)) { groups[seen.get(key)!].debates.push(d) }
    else { seen.set(key, groups.length); groups.push({ date: key, debates: [d] }) }
  })
  return (
    <>
      {groups.map(group => (
        <div key={group.date}>
          <div style={{ padding: '14px 20px 6px', fontSize: 10, fontWeight: 700, color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {formatDateLabel(group.date)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px 8px' }}>
            {group.debates.map(d => <LightFeedRow key={d.id} debate={d} onClick={() => onSelect(d.id)} />)}
          </div>
        </div>
      ))}
    </>
  )
}

function LightFeedRow({ debate, onClick }: { debate: Debate; onClick: () => void }) {
  const cat = getCategory(debate.topic + debate.title)
  return (
    <div onClick={onClick} style={{
      minHeight: 80, background: '#fff', cursor: 'pointer',
      borderRadius: 10, overflow: 'hidden',
      border: '1px solid #f0f0f8',
      boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      padding: '16px 22px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cat.lightColor, marginBottom: 5 }}>
        {cat.label}
      </div>
      <div style={{ fontSize: 14, color: '#111', fontWeight: 500, lineHeight: 1.4 }}>
        {debate.title.length > 90 ? debate.title.slice(0, 90) + '…' : debate.title}
      </div>
      <div style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>
        {formatDateShort(debate.date)} · {debate.venue}
      </div>
    </div>
  )
}

function LightStatusMessage({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#bbb' }}>
      <p style={{ fontSize: 15 }}>{message}</p>
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
  try { return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return dateStr }
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  try { return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' }) }
  catch { return dateStr }
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return ''
  try { return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase() }
  catch { return dateStr }
}

function StatusMessage({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.25)' }}>
      <p style={{ fontSize: 15, color: 'var(--text3)' }}>{message}</p>
    </div>
  )
}
