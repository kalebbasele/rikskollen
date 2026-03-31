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
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(['Alla']))
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [showCatDropdown, setShowCatDropdown] = useState(false)
  const [showOmDropdown, setShowOmDropdown] = useState(false)
  const [infoPage, setInfoPage] = useState<InfoPageKey | null>(null)
  const isMobile = useIsMobile()

  const { debates, loading: debatesLoading, error: debatesError, updateDebate } = useDebates()
  const { votes, loading: votesLoading, error: votesError } = useVotes()

  function toggleCategory(cat: string) {
    if (cat === 'Alla') { setActiveCategories(new Set(['Alla'])); return }
    setActiveCategories(prev => {
      const next = new Set(prev)
      next.delete('Alla')
      if (next.has(cat)) { next.delete(cat); if (next.size === 0) next.add('Alla') }
      else next.add(cat)
      return next
    })
  }

  const filteredDebates = useMemo(() =>
    activeCategories.has('Alla')
      ? debates
      : debates.filter(d => [...activeCategories].some(cat => matchesCategory(d, cat))),
    [debates, activeCategories]
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
      <>
      <div style={{ background: '#f0ede8', minHeight: '100vh' }}>
        {/* Navbar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#f8f6f2', borderBottom: '1px solid #e0dbd3', height: 56 }}>
          <div className="page-inner" style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
          <div onClick={goHome} style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#111', letterSpacing: '-0.01em', cursor: 'pointer', userSelect: 'none' }}>
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
                    <div style={{ position: 'absolute', top: '100%', right: 0, paddingTop: 6, zIndex: 100 }}>
                      <div style={{
                        background: '#f8f6f2', borderRadius: 14,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.10)', border: '1px solid #e0dbd3',
                        padding: '8px', display: 'flex', flexDirection: 'column', gap: 1,
                        minWidth: 190,
                      }}>
                        {CATEGORIES.map(cat => {
                          const checked = activeCategories.has(cat)
                          return (
                            <button key={cat} onClick={() => { toggleCategory(cat); setTab('debatter') }} style={{
                              fontSize: 13, textAlign: 'left',
                              color: checked ? '#5b3fd4' : '#555',
                              padding: '7px 12px', borderRadius: 8,
                              background: checked ? '#f0eeff' : 'none',
                              border: 'none', cursor: 'pointer',
                              fontWeight: checked ? 600 : 400,
                              display: 'flex', alignItems: 'center', gap: 9, justifyContent: 'space-between',
                            }}>
                              {cat}
                              <span style={{
                                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                                border: checked ? 'none' : '1.5px solid #ddd',
                                background: checked ? '#5b3fd4' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, color: '#fff',
                              }}>
                                {checked ? '✓' : ''}
                              </span>
                            </button>
                          )
                        })}
                      </div>
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
                {/* Om Civica dropdown */}
                <div style={{ position: 'relative' }} onMouseEnter={() => setShowOmDropdown(true)} onMouseLeave={() => setShowOmDropdown(false)}>
                  <button style={{ fontSize: 14, color: '#aaa', padding: '7px 16px', background: 'none', border: 'none', borderRadius: 24, cursor: 'pointer' }}>
                    Om Civica
                  </button>
                  {showOmDropdown && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, paddingTop: 6, zIndex: 100 }}>
                      <div style={{ background: '#f8f6f2', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.10)', border: '1px solid #e0dbd3', padding: '8px', display: 'flex', flexDirection: 'column', gap: 1, minWidth: 230 }}>
                        {OM_LINKS.map(l => (
                          <button key={l.key} onClick={() => setInfoPage(l.key)} style={{ fontSize: 13, textAlign: 'left', color: '#555', padding: '8px 14px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
          <div className="page-inner" style={{ background: '#f0ede8' }}>
            {debatesLoading ? (
              <div style={{ padding: 20 }}>{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : debatesError ? (
              <LightStatusMessage message={debatesError} />
            ) : filteredDebates.length === 0 ? (
              <LightStatusMessage message="Inga debatter matchar." />
            ) : (
              <>
                <IntroSection isMobile={isMobile} dark={false} onNavigate={(t) => setTab(t as Tab)} />

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
        <SiteFooter dark={false} onOpen={setInfoPage} />
      </div>
      {infoPage && <InfoOverlay page={infoPage} dark={false} onClose={() => setInfoPage(null)} />}
      </>
    )
  }

  // ── Dark theme ─────────────────────────────────────────────────────────────
  return (
    <>
    <div style={{ background: '#0d0a2e', minHeight: '100vh' }}>
      {/* Navbar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#0b0b18', borderBottom: '1px solid rgba(255,255,255,0.07)', height: 56 }}>
        <div className="page-inner" style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
          <div onClick={goHome} style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', cursor: 'pointer', userSelect: 'none' }}>
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
                    <div style={{ position: 'absolute', top: '100%', right: 0, paddingTop: 6, zIndex: 100 }}>
                      <div style={{
                        background: '#1a1535', borderRadius: 14,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid rgba(155,125,255,0.15)',
                        padding: '8px', display: 'flex', flexDirection: 'column', gap: 1,
                        minWidth: 190,
                      }}>
                        {CATEGORIES.map(cat => {
                          const checked = activeCategories.has(cat)
                          return (
                            <button key={cat} onClick={() => { toggleCategory(cat); setTab('debatter') }} style={{
                              fontSize: 13, textAlign: 'left',
                              color: checked ? '#9b7dff' : 'rgba(255,255,255,0.55)',
                              padding: '7px 12px', borderRadius: 8,
                              background: checked ? 'rgba(155,125,255,0.15)' : 'none',
                              border: 'none', cursor: 'pointer',
                              fontWeight: checked ? 600 : 400,
                              display: 'flex', alignItems: 'center', gap: 9, justifyContent: 'space-between',
                            }}>
                              {cat}
                              <span style={{
                                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                                border: checked ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                                background: checked ? '#9b7dff' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, color: '#fff',
                              }}>
                                {checked ? '✓' : ''}
                              </span>
                            </button>
                          )
                        })}
                      </div>
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
                {/* Om Civica dropdown */}
                <div style={{ position: 'relative' }} onMouseEnter={() => setShowOmDropdown(true)} onMouseLeave={() => setShowOmDropdown(false)}>
                  <button style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', padding: '7px 16px', background: 'none', border: 'none', borderRadius: 24, cursor: 'pointer' }}>
                    Om Civica
                  </button>
                  {showOmDropdown && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, paddingTop: 6, zIndex: 100 }}>
                      <div style={{ background: '#1a1535', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid rgba(155,125,255,0.15)', padding: '8px', display: 'flex', flexDirection: 'column', gap: 1, minWidth: 230 }}>
                        {OM_LINKS.map(l => (
                          <button key={l.key} onClick={() => setInfoPage(l.key)} style={{ fontSize: 13, textAlign: 'left', color: 'rgba(255,255,255,0.6)', padding: '8px 14px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
              <IntroSection isMobile={isMobile} dark={true} onNavigate={(t) => setTab(t as Tab)} />

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
      <SiteFooter dark={true} onOpen={setInfoPage} />
    </div>
    {infoPage && <InfoOverlay page={infoPage} dark={true} onClose={() => setInfoPage(null)} />}
    </>
  )
}

// ── Footer & info pages ───────────────────────────────────────────────────────

type InfoPageKey = 'om' | 'kontakt' | 'gdpr' | 'cookies'

const OM_LINKS: { key: InfoPageKey; label: string }[] = [
  { key: 'om',      label: 'Om Civica' },
  { key: 'kontakt', label: 'Kontakt' },
  { key: 'gdpr',    label: 'Hur vi behandlar dina personuppgifter' },
  { key: 'cookies', label: 'Hantera Cookies' },
]

const INFO_CONTENT: Record<InfoPageKey, { title: string; body: React.ReactNode }> = {
  om: {
    title: 'Om Civica',
    body: (
      <>
        <p>Civica är en oberoende plattform som gör riksdagens arbete tillgängligt för alla. Vi samlar debatter, omröstningar och politiska beslut på ett ställe — utan partipolitisk vinkling.</p>
        <p>Vår mission är att stärka den demokratiska delaktigheten genom att göra information om Sveriges folkvalda lättillgänglig, begriplig och engagerande.</p>
        <p>All data hämtas direkt från <strong>Riksdagens öppna API</strong> och presenteras i realtid. Vi lägger inte till egna åsikter — vi lyfter fram vad som faktiskt sägs och beslutas i riksdagen.</p>
        <p>Civica är byggt för dig som vill hålla koll på svensk politik utan att behöva sålla genom långa protokoll och pressmeddelanden.</p>
      </>
    ),
  },
  kontakt: {
    title: 'Kontakt',
    body: (
      <>
        <p>Har du frågor, feedback eller vill samarbeta? Hör gärna av dig!</p>
        <p><strong>E-post:</strong> hej@civica.se</p>
        <p>Vi svarar normalt inom 1–3 vardagar.</p>
        <p>Hittar du ett fel eller saknar du en funktion? Vi tar gärna emot konstruktiv feedback och försöker kontinuerligt förbättra tjänsten.</p>
      </>
    ),
  },
  gdpr: {
    title: 'Hur vi behandlar dina personuppgifter',
    body: (
      <>
        <p>Civica värnar om din integritet. Vi strävar efter att samla in så lite personuppgifter som möjligt.</p>
        <h4>Vad vi lagrar</h4>
        <p>Vi lagrar <strong>inga personuppgifter</strong> om vanliga besökare. Sajten kräver inte inloggning och vi spårar inte enskilda användare.</p>
        <p>Debatter och omröstningar hämtas från Riksdagens öppna API och lagras tillfälligt i vår databas för snabbare åtkomst.</p>
        <h4>Om du kontaktar oss</h4>
        <p>Om du skickar e-post till oss behandlar vi de uppgifter du lämnar (namn, e-postadress och ditt ärende) för att kunna svara dig. Dessa raderas när ärendet är avslutat.</p>
        <h4>Dina rättigheter</h4>
        <p>Enligt GDPR har du rätt att begära information om, rättelse av eller radering av personuppgifter som rör dig. Kontakta oss på hej@civica.se.</p>
        <p>Personuppgiftsansvarig: Civica · hej@civica.se</p>
      </>
    ),
  },
  cookies: {
    title: 'Hantera Cookies',
    body: (
      <>
        <p>Civica använder minimalt med cookies och inga spårningscookies för marknadsföring.</p>
        <h4>Cookies vi använder</h4>
        <p><strong>Nödvändiga cookies:</strong> Vi lagrar ditt temval (ljust/mörkt) lokalt i din webbläsare. Ingen data skickas till externa parter.</p>
        <p><strong>Inga analyticscookies:</strong> Vi använder inte Google Analytics eller liknande tjänster.</p>
        <p><strong>Inga tredjepartscookies:</strong> Vi delar inte din data med annonsörer.</p>
        <h4>Hur du hanterar cookies</h4>
        <p>Du kan när som helst rensa cookies i din webbläsares inställningar. Sajten fungerar fullt ut även utan cookies — du förlorar bara ditt sparade temval.</p>
        <p>För mer information, se din webbläsares hjälpsida om cookiehantering.</p>
      </>
    ),
  },
}

function SiteFooter({ dark, onOpen }: { dark: boolean; onOpen: (p: InfoPageKey) => void }) {
  const border = dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f0f0f0'
  const bg = dark ? '#08061e' : '#f3f3fa'
  const logoColor = dark ? '#fff' : '#111'
  const accent = dark ? '#9b7dff' : '#5b3fd4'
  const textColor = dark ? 'rgba(255,255,255,0.35)' : '#aaa'
  const linkColor = dark ? 'rgba(255,255,255,0.5)' : '#888'
  return (
    <div style={{ borderTop: border, background: bg, padding: '32px 24px 28px' }}>
      <div className="page-inner" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: logoColor, letterSpacing: '-0.03em' }}>
            Civi<span style={{ color: accent }}>ca</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {OM_LINKS.map(l => (
              <button key={l.key} onClick={() => onOpen(l.key)} style={{
                fontSize: 13, color: linkColor, background: 'none', border: 'none',
                cursor: 'pointer', padding: '4px 10px', borderRadius: 6,
              }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: textColor }}>
          © {new Date().getFullYear()} Civica. Data från Riksdagens öppna API.
        </div>
      </div>
    </div>
  )
}

function InfoOverlay({ page, dark, onClose }: { page: InfoPageKey; dark: boolean; onClose: () => void }) {
  const { title, body } = INFO_CONTENT[page]
  const bg = dark ? '#0d0a2e' : '#fff'
  const border = dark ? '1px solid rgba(155,125,255,0.12)' : '1px solid #f0f0f8'
  const headingColor = dark ? '#fff' : '#111'
  const textColor = dark ? 'rgba(255,255,255,0.65)' : '#444'
  const h4Color = dark ? '#fff' : '#111'
  const accent = dark ? '#9b7dff' : '#5b3fd4'
  const overlayBg = dark ? 'rgba(5,3,20,0.85)' : 'rgba(0,0,0,0.35)'

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: overlayBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: bg, border, borderRadius: 20,
        maxWidth: 620, width: '100%', maxHeight: '80vh',
        overflowY: 'auto', padding: '36px 36px 40px',
        boxShadow: dark ? '0 24px 80px rgba(0,0,0,0.7)' : '0 24px 80px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: headingColor, letterSpacing: '-0.02em' }}>{title}</div>
          <button onClick={onClose} style={{ fontSize: 20, color: textColor, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>✕</button>
        </div>
        <div style={{ fontSize: 15, color: textColor, lineHeight: 1.75 }}>
          <style>{`
            .info-body p { margin: 0 0 14px; }
            .info-body h4 { font-size: 14px; font-weight: 700; color: ${h4Color}; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.05em; }
            .info-body strong { color: ${accent}; font-weight: 600; }
          `}</style>
          <div className="info-body">{body}</div>
        </div>
      </div>
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
      margin: '0 16px',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      paddingBottom: isMobile ? 24 : 32,
      paddingTop: isMobile ? 24 : 32,
    }}>
      {/* Left text */}
      <div style={{ paddingRight: isMobile ? 0 : 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'inline-flex', alignSelf: 'flex-start', background: 'rgba(155,125,255,0.18)', color: '#9b7dff', fontSize: 11, fontWeight: 700, borderRadius: 24, padding: '5px 12px', marginBottom: 16 }}>
          Senaste · {cat.label}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 22 : 30, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.15, marginBottom: 12 }}>
          {debate.title}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
          {formatDate(debate.date)} · {debate.venue} · Interpellationsdebatt
        </div>
      </div>

      {/* Right portraits */}
      {!isMobile && (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {participants.slice(0, 2).map((p, i) => {
            const party = getParty(p.person.party)
            const glow = party?.color ?? '#5b3fd4'
            const shortName = abbrevName(p.person)
            return (
              <div key={p.person.id || i} style={{
                position: 'relative', flex: 1,
                borderRadius: 10, overflow: 'hidden',
                background: '#1e1a40', minHeight: 160,
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
      )}
    </div>
  )
}

function DarkSubgrid({ debates, onSelect, isMobile }: { debates: Debate[]; onSelect: (id: string) => void; isMobile: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: 0,
      padding: '0 16px',
    }}>
      {debates.map((debate) => {
        const cat = getCategory(debate.topic + debate.title)
        const participants = debate.participants
        return (
          <div key={debate.id} onClick={() => onSelect(debate.id)} style={{
            padding: '20px 16px 20px 0',
            display: 'flex', flexDirection: 'column', cursor: 'pointer',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cat.color, marginBottom: 8 }}>
              {cat.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.4, flex: 1 }}>
              {debate.title.length > 80 ? debate.title.slice(0, 80) + '…' : debate.title}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6, marginBottom: 12 }}>
              {formatDateShort(debate.date)}
            </div>
            {/* Portraits */}
            <div style={{ display: 'flex', gap: 6 }}>
              {participants.slice(0, 3).map((p, pi) => {
                const sz = 44
                return (
                  <div key={p.person.id || pi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: sz, height: sz, borderRadius: 8, overflow: 'hidden', background: '#1e1a40', position: 'relative' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
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
      cursor: 'pointer',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '16px 0',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cat.color, marginBottom: 5 }}>
        {cat.label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#fff', fontWeight: 500, lineHeight: 1.4 }}>
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

const CHIP_TABS: Record<string, string> = {
  'Debatter': 'debatter',
  'Omröstningar': 'omrostningar',
  'Valkompassen': 'valkompass',
}

function IntroSection({ isMobile, dark, onNavigate }: { isMobile: boolean; dark: boolean; onNavigate: (tab: string) => void }) {
  const [visible, setVisible] = React.useState(false)
  const [wordIdx, setWordIdx] = React.useState(0)
  const [intro, setIntro] = React.useState(introSettingsCache ?? DEFAULT_INTRO)
  const [wordWidth, setWordWidth] = React.useState<number | null>(null)
  const ghostRef = React.useRef<HTMLSpanElement>(null)

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
  React.useLayoutEffect(() => { if (ghostRef.current) setWordWidth(ghostRef.current.offsetWidth) }, [wordIdx, isMobile])

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
            fontFamily: 'var(--font-display)',
            fontSize: isMobile ? 28 : 38, fontWeight: 700,
            color: p.textMain, lineHeight: 1.15,
            letterSpacing: '-0.01em', marginBottom: 16,
          }}>
            <span>{intro.headingPre} </span>
            <span style={{
              display: 'inline-block', color: p.accent,
              position: 'relative', overflow: 'hidden',
              height: isMobile ? 36 : 46, verticalAlign: 'bottom',
              width: wordWidth ?? 'auto',
              transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
            }}>
              {/* Ghost — absolutely positioned, just for measuring width */}
              <span ref={ghostRef} style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)', fontSize: isMobile ? 28 : 38, fontWeight: 700, pointerEvents: 'none' }}>
                {words[wordIdx]}
              </span>
              {/* Animated word */}
              <span key={wordIdx} style={{
                position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap',
                animation: 'wordSlide 2.2s ease forwards',
                fontFamily: 'var(--font-display)',
                fontSize: isMobile ? 28 : 38, fontWeight: 700,
              }}>
                {words[wordIdx]}
              </span>
            </span>
            <span> {intro.headingPost}</span>
          </div>

          <p style={{
            fontSize: isMobile ? 14 : 15, color: p.textSub,
            lineHeight: 1.65, maxWidth: 380, marginBottom: 0,
            animation: visible ? 'fadeUp 0.6s 0.15s ease both' : 'none',
            opacity: visible ? 1 : 0,
          }}>
            {intro.subtitle}
          </p>

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
      margin: isMobile ? '0 16px' : '0 16px',
      borderBottom: '1px solid #e0dbd3',
      paddingBottom: isMobile ? 24 : 32,
      paddingTop: isMobile ? 24 : 32,
    }}>
      {/* Left text */}
      <div style={{ paddingRight: isMobile ? 0 : 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'inline-flex', alignSelf: 'flex-start', background: '#f0eeff', color: '#5b3fd4', fontSize: 11, fontWeight: 700, borderRadius: 24, padding: '5px 12px', marginBottom: 16 }}>
          Senaste · {cat.label}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 22 : 30, fontWeight: 700, color: '#111', letterSpacing: '-0.01em', lineHeight: 1.15, marginBottom: 12 }}>
          {debate.title}
        </div>
        <div style={{ fontSize: 12, color: '#bbb', lineHeight: 1.6 }}>
          {formatDate(debate.date)} · {debate.venue} · Interpellationsdebatt
        </div>
      </div>

      {/* Right portraits */}
      {!isMobile && (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {participants.slice(0, 2).map((p, i) => {
            const party = getParty(p.person.party)
            const glow = party?.color ?? '#5b3fd4'
            const shortName = abbrevName(p.person)
            return (
              <div key={p.person.id || i} style={{
                position: 'relative', flex: 1,
                borderRadius: 10, overflow: 'hidden',
                background: '#ddd8d0', minHeight: 160,
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
      )}
    </div>
  )
}

function LightSubgrid({ debates, onSelect, isMobile }: { debates: Debate[]; onSelect: (id: string) => void; isMobile: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: 0,
      padding: isMobile ? '0 16px' : '0 16px',
    }}>
      {debates.map((debate) => {
        const cat = getCategory(debate.topic + debate.title)
        const participants = debate.participants
        return (
          <div key={debate.id} onClick={() => onSelect(debate.id)} style={{
            padding: '20px 16px 20px 0',
            display: 'flex', flexDirection: 'column', cursor: 'pointer',
            borderBottom: '1px solid #e0dbd3',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cat.lightColor, marginBottom: 8 }}>
              {cat.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: '#111', lineHeight: 1.4, flex: 1 }}>
              {debate.title.length > 80 ? debate.title.slice(0, 80) + '…' : debate.title}
            </div>
            <div style={{ fontSize: 11, color: '#ccc', marginTop: 6, marginBottom: 12 }}>
              {formatDateShort(debate.date)}
            </div>
            {/* Portraits */}
            <div style={{ display: 'flex', gap: 6 }}>
              {participants.slice(0, 3).map((p, pi) => {
                const sz = 44
                return (
                  <div key={p.person.id || pi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: sz, height: sz, borderRadius: 8, overflow: 'hidden', background: '#ddd8d0', position: 'relative' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
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
      cursor: 'pointer',
      borderBottom: '1px solid #e0dbd3',
      padding: '16px 0',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cat.lightColor, marginBottom: 5 }}>
        {cat.label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#111', fontWeight: 500, lineHeight: 1.4 }}>
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

