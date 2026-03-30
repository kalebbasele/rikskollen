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
  const [showCatDropdown, setShowCatDropdown] = useState(false)
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
                {/* Debatter with hover dropdown */}
                <div
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setShowCatDropdown(true)}
                  onMouseLeave={() => setShowCatDropdown(false)}
                >
                  <button onClick={() => setTab('debatter')} style={{
                    fontSize: 14,
                    color: tab === 'debatter' ? '#fff' : '#aaa',
                    padding: '7px 16px',
                    background: tab === 'debatter' ? '#111' : 'none',
                    border: 'none', borderRadius: 24,
                    fontWeight: tab === 'debatter' ? 600 : 400,
                    cursor: 'pointer',
                  }}>
                    Debatter
                  </button>
                  {showCatDropdown && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                      background: '#fff', borderRadius: 14,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #f0f0f8',
                      padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2,
                      minWidth: 170, zIndex: 100,
                    }}>
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => { setActiveCategory(cat); setTab('debatter') }} style={{
                          fontSize: 13, textAlign: 'left',
                          color: activeCategory === cat ? '#5b3fd4' : '#555',
                          padding: '7px 12px', borderRadius: 8,
                          background: activeCategory === cat ? '#f0eeff' : 'none',
                          border: 'none', cursor: 'pointer',
                          fontWeight: activeCategory === cat ? 600 : 400,
                        }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {(['omrostningar', 'valkompass'] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    fontSize: 14,
                    color: tab === t ? '#fff' : '#aaa',
                    padding: '7px 16px',
                    background: tab === t ? '#111' : 'none',
                    border: 'none', borderRadius: 24,
                    fontWeight: tab === t ? 600 : 400,
                    cursor: 'pointer',
                  }}>
                    {t === 'omrostningar' ? 'Omröstningar' : 'Valkompass'}
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
                <IntroSection isMobile={isMobile} dark={false} />

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

  // ── Dark theme ─────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#0d0a2e', minHeight: '100vh' }}>
      {/* Navbar */}
      <div style={{ background: '#0b0b18', borderBottom: '1px solid rgba(255,255,255,0.07)', height: 56 }}>
        <div className="page-inner" style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
          <div onClick={goHome} style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', cursor: 'pointer', userSelect: 'none' }}>
            Civi<span style={{ color: '#9b7dff' }}>ca</span>
          </div>
          <div style={{ display: 'flex', marginLeft: 'auto', alignItems: 'center', gap: 4 }}>
            {showDetail ? (
              <button onClick={() => history.back()} style={{ fontSize: 14, fontWeight: 600, color: '#9b7dff', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Tillbaka
              </button>
            ) : (
              <>
                {/* Debatter with hover dropdown */}
                <div
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setShowCatDropdown(true)}
                  onMouseLeave={() => setShowCatDropdown(false)}
                >
                  <button onClick={() => setTab('debatter')} style={{
                    fontSize: 14,
                    color: tab === 'debatter' ? '#0b0b18' : 'rgba(255,255,255,0.4)',
                    padding: '7px 16px',
                    background: tab === 'debatter' ? '#fff' : 'none',
                    border: 'none', borderRadius: 24,
                    fontWeight: tab === 'debatter' ? 600 : 400,
                    cursor: 'pointer',
                  }}>
                    Debatter
                  </button>
                  {showCatDropdown && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                      background: '#1a1535', borderRadius: 14,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid rgba(155,125,255,0.15)',
                      padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2,
                      minWidth: 170, zIndex: 100,
                    }}>
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => { setActiveCategory(cat); setTab('debatter') }} style={{
                          fontSize: 13, textAlign: 'left',
                          color: activeCategory === cat ? '#9b7dff' : 'rgba(255,255,255,0.55)',
                          padding: '7px 12px', borderRadius: 8,
                          background: activeCategory === cat ? 'rgba(155,125,255,0.15)' : 'none',
                          border: 'none', cursor: 'pointer',
                          fontWeight: activeCategory === cat ? 600 : 400,
                        }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {(['omrostningar', 'valkompass'] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    fontSize: 14,
                    color: tab === t ? '#0b0b18' : 'rgba(255,255,255,0.4)',
                    padding: '7px 16px',
                    background: tab === t ? '#fff' : 'none',
                    border: 'none', borderRadius: 24,
                    fontWeight: tab === t ? 600 : 400,
                    cursor: 'pointer',
                  }}>
                    {t === 'omrostningar' ? 'Omröstningar' : 'Valkompass'}
                  </button>
                ))}
                <button onClick={toggleTheme} style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Ljust
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
        <div className="page-inner" style={{ background: '#0d0a2e' }}>
          {debatesLoading ? (
            <div style={{ padding: 20 }}>{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : debatesError ? (
            <DarkStatusMessage message={debatesError} />
          ) : filteredDebates.length === 0 ? (
            <DarkStatusMessage message="Inga debatter matchar." />
          ) : (
            <>
              <IntroSection isMobile={isMobile} dark={true} />

              <DarkHeroCard debate={filteredDebates[0]} onClick={() => openDebate(filteredDebates[0].id)} isMobile={isMobile} />

              {filteredDebates.length > 1 && (
                <DarkSubgrid debates={filteredDebates.slice(1, isMobile ? 3 : 4)} onSelect={id => openDebate(id)} isMobile={isMobile} />
              )}

              {filteredDebates.length > (isMobile ? 3 : 4) && (
                <DarkFeedSection debates={filteredDebates.slice(isMobile ? 3 : 4)} onSelect={id => openDebate(id)} />
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
              : votesError ? <DarkStatusMessage message={votesError} />
              : votes.length === 0 ? <DarkStatusMessage message="Inga omröstningar." />
              : votes.map(v => <VoteCard key={v.id} vote={v} />)
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dark theme cards (mirror light structure, dark colors) ────────────────────

function DarkHeroCard({ debate, onClick, isMobile }: { debate: Debate; onClick: () => void; isMobile: boolean }) {
  const cat = getCategory(debate.topic + debate.title)
  const participants = debate.participants

  return (
    <div onClick={onClick} style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 280px',
      minHeight: 230, cursor: 'pointer',
      margin: isMobile ? '12px 12px 8px' : '16px 16px 8px',
      borderRadius: 16, overflow: 'hidden',
      background: '#1a1535',
      boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
      border: '1px solid rgba(155,125,255,0.12)',
    }}>
      {/* Left text */}
      <div style={{ padding: isMobile ? '24px 20px 20px' : '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ display: 'inline-flex', alignSelf: 'flex-start', background: 'rgba(155,125,255,0.18)', color: '#9b7dff', fontSize: 11, fontWeight: 700, borderRadius: 24, padding: '5px 12px', marginBottom: 16 }}>
          Senaste · {cat.label}
        </div>
        <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 12 }}>
          {debate.title}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
          {formatDate(debate.date)} · {debate.venue} · Interpellationsdebatt
        </div>
      </div>

      {/* Right portraits */}
      <div style={{
        display: 'flex', flexDirection: 'row', alignItems: 'stretch',
        gap: 8, padding: 8,
        borderLeft: isMobile ? 'none' : '1px solid rgba(155,125,255,0.1)',
        borderTop: isMobile ? '1px solid rgba(155,125,255,0.1)' : 'none',
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
              background: '#1e1a40', minHeight: 180,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
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

function DarkSubgrid({ debates, onSelect, isMobile }: { debates: Debate[]; onSelect: (id: string) => void; isMobile: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: isMobile ? 8 : 12,
      padding: isMobile ? '0 12px 8px' : '0 16px 8px',
    }}>
      {debates.map((debate) => {
        const cat = getCategory(debate.topic + debate.title)
        const participants = debate.participants
        return (
          <div key={debate.id} onClick={() => onSelect(debate.id)} style={{
            padding: '18px 18px 0',
            display: 'flex', flexDirection: 'column', cursor: 'pointer',
            background: '#1a1535',
            borderRadius: 14,
            border: '1px solid rgba(155,125,255,0.12)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cat.color, marginBottom: 8 }}>
              {cat.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.4, flex: 1 }}>
              {debate.title.length > 80 ? debate.title.slice(0, 80) + '…' : debate.title}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6, marginBottom: 14 }}>
              {formatDateShort(debate.date)}
            </div>
            {/* Portraits */}
            <div style={{ display: 'flex', gap: 6, paddingBottom: 18 }}>
              {participants.slice(0, 3).map((p, pi) => {
                const sz = 48
                return (
                  <div key={p.person.id || pi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: sz, height: sz, borderRadius: 10, overflow: 'hidden', background: '#1e1a40', position: 'relative', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
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

function DarkFeedSection({ debates, onSelect }: { debates: Debate[]; onSelect: (id: string) => void }) {
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
          <div style={{ padding: '14px 20px 6px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {formatDateLabel(group.date)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px 8px' }}>
            {group.debates.map(d => <DarkFeedRow key={d.id} debate={d} onClick={() => onSelect(d.id)} />)}
          </div>
        </div>
      ))}
    </>
  )
}

function DarkFeedRow({ debate, onClick }: { debate: Debate; onClick: () => void }) {
  const cat = getCategory(debate.topic + debate.title)
  return (
    <div onClick={onClick} style={{
      minHeight: 80, background: '#1a1535', cursor: 'pointer',
      borderRadius: 10, overflow: 'hidden',
      border: '1px solid rgba(155,125,255,0.1)',
      boxShadow: '0 1px 6px rgba(0,0,0,0.2)',
      padding: '16px 22px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cat.color, marginBottom: 5 }}>
        {cat.label}
      </div>
      <div style={{ fontSize: 14, color: '#fff', fontWeight: 500, lineHeight: 1.4 }}>
        {debate.title.length > 90 ? debate.title.slice(0, 90) + '…' : debate.title}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
        {formatDateShort(debate.date)} · {debate.venue}
      </div>
    </div>
  )
}

function DarkStatusMessage({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.25)' }}>
      <p style={{ fontSize: 15 }}>{message}</p>
    </div>
  )
}

// ── Shared intro section ──────────────────────────────────────────────────────

const BACKEND = 'https://web-production-1e2f2.up.railway.app'

const DEFAULT_INTRO = {
  badge: 'RIKSDAGEN · LIVE',
  headingPre: 'Vad händer i',
  words: ['Debatter', 'Omröstningar', 'Politik'],
  headingPost: 'just nu?',
  subtitle: 'Civica samlar riksdagens senaste debatter och omröstningar — utan krångel.',
  chips: [
    { icon: '🗣️', text: 'Debatter' },
    { icon: '🗳️', text: 'Omröstningar' },
    { icon: '⚖️', text: 'Valkompassen' },
  ],
}

let introSettingsCache: typeof DEFAULT_INTRO | null = null

function IntroSection({ isMobile, dark }: { isMobile: boolean; dark: boolean }) {
  const [visible, setVisible] = React.useState(false)
  const [wordIdx, setWordIdx] = React.useState(0)
  const [intro, setIntro] = React.useState(introSettingsCache ?? DEFAULT_INTRO)

  React.useEffect(() => {
    if (!introSettingsCache) {
      fetch(`${BACKEND}/api/public/intro-settings`)
        .then(r => r.json())
        .then(d => { introSettingsCache = d; setIntro(d) })
        .catch(() => {})
    }
  }, [])

  const words = intro.words

  React.useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])
  React.useEffect(() => { const iv = setInterval(() => setWordIdx(i => (i + 1) % words.length), 2200); return () => clearInterval(iv) }, [words.length])

  // All colors — ONLY thing that differs between dark and light
  const p = dark ? {
    wrapBg:     'linear-gradient(135deg, #1e1260 0%, #0e0a30 60%)',
    wrapBorder: '1px solid rgba(155,125,255,0.2)',
    badgeBg:    'rgba(155,125,255,0.22)',
    accent:     '#9b7dff',
    textMain:   '#ffffff',
    textSub:    'rgba(255,255,255,0.55)',
    chipBg:     'rgba(255,255,255,0.09)',
    chipBorder: '1px solid rgba(155,125,255,0.28)',
    chipColor:  'rgba(255,255,255,0.85)',
    chipShadow: '0 1px 4px rgba(0,0,0,0.3)',
    rightBg:    'linear-gradient(160deg, #2a1880 0%, #1a0e55 100%)',
    rightBorder:'1px solid rgba(155,125,255,0.18)',
    blobColor:  'rgba(155,125,255,0.3)',
    c1Bg:       'rgba(255,255,255,0.12)',
    c1Border:   '1px solid rgba(155,125,255,0.25)',
    c1Shadow:   '0 8px 32px rgba(0,0,0,0.5)',
    c1Text:     '#ffffff',
    c2Bg:       'linear-gradient(135deg, #7c5cfc, #4a2fc4)',
    c2Shadow:   '0 8px 28px rgba(124,92,252,0.55)',
    c3Bg:       'rgba(255,255,255,0.12)',
    c3Border:   '1px solid rgba(155,125,255,0.25)',
    c3Shadow:   '0 4px 16px rgba(0,0,0,0.4)',
  } : {
    wrapBg:     'linear-gradient(135deg, #f0ecff 0%, #ffffff 60%)',
    wrapBorder: '1px solid #ede8ff',
    badgeBg:    '#ede8ff',
    accent:     '#5b3fd4',
    textMain:   '#0a0a14',
    textSub:    '#666666',
    chipBg:     '#ffffff',
    chipBorder: '1px solid #ede8ff',
    chipColor:  '#333333',
    chipShadow: '0 1px 4px rgba(91,63,212,0.07)',
    rightBg:    'linear-gradient(160deg, #ede8ff 0%, #f8f5ff 100%)',
    rightBorder:'1px solid #e8e2ff',
    blobColor:  'rgba(91,63,212,0.12)',
    c1Bg:       '#ffffff',
    c1Border:   '1px solid #ede8ff',
    c1Shadow:   '0 8px 32px rgba(91,63,212,0.14)',
    c1Text:     '#111111',
    c2Bg:       'linear-gradient(135deg, #8b6cf4, #5b3fd4)',
    c2Shadow:   '0 8px 28px rgba(91,63,212,0.28)',
    c3Bg:       '#ffffff',
    c3Border:   '1px solid #ede8ff',
    c3Shadow:   '0 4px 16px rgba(91,63,212,0.10)',
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wordSlide {
          0%   { opacity: 0; transform: translateY(12px); }
          15%  { opacity: 1; transform: translateY(0); }
          85%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-12px); }
        }
        @keyframes floatA { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-5px)} }
        @keyframes floatC { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-11px)} }
      `}</style>

      <div style={{
        margin: isMobile ? '12px 12px 8px' : '16px 16px 8px',
        borderRadius: 20, overflow: 'hidden',
        background: p.wrapBg, border: p.wrapBorder,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 320px',
        minHeight: isMobile ? 'auto' : 220,
      }}>
        {/* Left — text */}
        <div style={{
          padding: isMobile ? '36px 28px 28px' : '48px 44px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          opacity: visible ? 1 : 0,
          animation: visible ? 'fadeUp 0.6s ease both' : 'none',
        }}>
          <div style={{
            display: 'inline-flex', alignSelf: 'flex-start',
            background: p.badgeBg, color: p.accent,
            fontSize: 11, fontWeight: 700, borderRadius: 24,
            padding: '5px 14px', marginBottom: 18, letterSpacing: '0.06em',
          }}>
            {intro.badge}
          </div>

          <div style={{
            fontSize: isMobile ? 28 : 38, fontWeight: 800,
            color: p.textMain, lineHeight: 1.1,
            letterSpacing: '-0.03em', marginBottom: 16,
          }}>
            <span style={{ display: 'block' }}>{intro.headingPre}</span>
            <span style={{
              display: 'inline-block', color: p.accent,
              minWidth: 200, height: isMobile ? 36 : 46,
              overflow: 'hidden', verticalAlign: 'bottom', position: 'relative',
            }}>
              <span key={wordIdx} style={{
                position: 'absolute',
                animation: 'wordSlide 2.2s ease forwards',
                fontSize: isMobile ? 28 : 38, fontWeight: 800,
              }}>
                {words[wordIdx]}
              </span>
            </span>
            <span style={{ display: 'block' }}>{intro.headingPost}</span>
          </div>

          <p style={{
            fontSize: isMobile ? 14 : 15, color: p.textSub,
            lineHeight: 1.65, maxWidth: 380, marginBottom: 24,
            animation: visible ? 'fadeUp 0.6s 0.15s ease both' : 'none',
            opacity: visible ? 1 : 0,
          }}>
            {intro.subtitle}
          </p>

          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
            animation: visible ? 'fadeUp 0.6s 0.28s ease both' : 'none',
            opacity: visible ? 1 : 0,
          }}>
            {intro.chips.map(chip => (
              <div key={chip.text} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: p.chipBg, border: p.chipBorder,
                borderRadius: 24, padding: '7px 14px',
                fontSize: 13, fontWeight: 600, color: p.chipColor,
                boxShadow: p.chipShadow,
              }}>
                <span>{chip.icon}</span>
                <span>{chip.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — floating visual */}
        {!isMobile && (
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: p.rightBg, borderLeft: p.rightBorder,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 220,
          }}>
            <div style={{
              position: 'absolute', width: 260, height: 260, borderRadius: '50%',
              background: `radial-gradient(circle, ${p.blobColor} 0%, transparent 70%)`,
              top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            }} />

            <div style={{ position: 'relative', width: 240, height: 180 }}>
              {/* Card 1 */}
              <div style={{
                position: 'absolute', top: 0, left: 20, width: 180,
                background: p.c1Bg, borderRadius: 14, padding: '14px 16px',
                boxShadow: p.c1Shadow, border: p.c1Border,
                animation: 'floatA 3.5s ease-in-out infinite',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: p.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Migration</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: p.c1Text, lineHeight: 1.4 }}>Gränskontroller och asylregler</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                  {['M','SD','S'].map(party => {
                    const pt = getParty(party)
                    return <div key={party} style={{ width: 20, height: 20, borderRadius: 5, background: pt?.color ?? '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: pt?.textColor ?? '#fff' }}>{party.slice(0,2)}</div>
                  })}
                </div>
              </div>

              {/* Card 2 */}
              <div style={{
                position: 'absolute', bottom: 0, right: 0, width: 150,
                background: p.c2Bg, borderRadius: 14, padding: '14px 16px',
                boxShadow: p.c2Shadow,
                animation: 'floatB 4.2s ease-in-out infinite',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Omröstning</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>174</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>JA</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>125</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', fontWeight: 600 }}>NEJ</div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div style={{
                position: 'absolute', top: 60, right: 10,
                width: 48, height: 48, borderRadius: 12,
                background: p.c3Bg, border: p.c3Border, boxShadow: p.c3Shadow,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, animation: 'floatC 2.9s ease-in-out infinite',
              }}>
                🗳️
              </div>
            </div>
          </div>
        )}
      </div>
    </>
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

