import React, { useState, useMemo, useRef } from 'react'
import type { ActiveFilters, Debate, Vote } from './types'
import { useDebates, useVotes } from './hooks/useData'
import { getParty } from './types'
import DebateDetail from './components/DebateDetail'
import VoteCard from './components/VoteCard'
import SkeletonCard from './components/SkeletonCard'
import AdminPage from './components/AdminPage'

type Tab = 'debatter' | 'omrostningar'

const CATEGORIES = ['Alla', 'Migration', 'Ekonomi', 'Klimat', 'Vård', 'Försvar', 'Utbildning', 'Utrikespolitik']

function getCategoryColor(text: string): string {
  const t = text.toLowerCase()
  if (t.match(/äldreom/)) return '#b8916a'
  if (t.match(/ekonomi|budget|skatt|finans|moms|pension/)) return '#6a9e7f'
  if (t.match(/vård|sjukvård|hälso|omsorg/)) return '#9a6e9e'
  if (t.match(/migration|asyl|gräns|utvisning|flykt/)) return '#6a8aae'
  if (t.match(/trafik|väg|järnväg|infra/)) return '#8a8aae'
  if (t.match(/försvar|nato|militär|säkerhet/)) return '#8a9a6e'
  if (t.match(/utbildning|skola|lärare|förskola|högskola/)) return '#7a8aae'
  return '#888888'
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

export default function App() {
  const [tab, setTab] = useState<Tab>('debatter')
  const [filters] = useState<ActiveFilters>({ parties: [], regions: [] })
  const [selectedDebateId, setSelectedDebateId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('Alla')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [showAdmin, setShowAdmin] = useState(false)

  const clickCount = useRef(0)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleLogoClick() {
    clickCount.current += 1
    if (clickTimer.current) clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => {
      if (clickCount.current >= 3) setShowAdmin(true)
      clickCount.current = 0
    }, 400)
  }

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

  if (showAdmin) {
    return (
      <AdminPage
        debates={debates}
        onUpdate={(updated: Debate) => updateDebate(updated)}
        onClose={() => setShowAdmin(false)}
      />
    )
  }

  return (
    <div>
      {/* Navbar */}
      <div style={{ background: 'var(--top-bg)', borderBottom: theme === 'dark' ? '1px solid rgba(124,92,252,0.4)' : 'none', height: 44 }}>
        <div className="page-inner" style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
          <div onClick={handleLogoClick} style={{ fontSize: 18, fontWeight: 500, color: '#fff', letterSpacing: '-0.02em', cursor: 'default', userSelect: 'none' }}>
            Civi<span style={{ color: 'var(--logo-accent)' }}>ca</span>
          </div>
          <div style={{ display: 'flex', marginLeft: 'auto', alignItems: 'center' }}>
            {showDetail ? (
              <button onClick={() => setSelectedDebateId(null)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--logo-accent)', background: 'none', border: 'none' }}>
                ← Tillbaka
              </button>
            ) : (
              <>
                {(['debatter', 'omrostningar'] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    fontSize: 11,
                    color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
                    padding: '0 12px',
                    background: 'none', border: 'none',
                    borderLeft: '0.5px solid rgba(255,255,255,0.08)',
                    height: 44,
                  }}>
                    {t === 'debatter' ? 'Debatter' : 'Omröstningar'}
                  </button>
                ))}
                <button onClick={toggleTheme} style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '0 12px',
                  borderLeft: '0.5px solid rgba(255,255,255,0.08)', background: 'none', border: 'none', height: 44,
                }}>
                  {theme === 'dark' ? '☀' : '◐'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ticker */}
      {!showDetail && latestDebate && (
        <div style={{ background: 'var(--ticker-bg)', borderBottom: '0.5px solid var(--ticker-border)' }}>
          <div className="page-inner" style={{ padding: '6px 20px', fontSize: 10, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--ticker-label)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Senaste</span>
            {latestDebate.topic} · {formatDate(latestDebate.date)}
          </div>
        </div>
      )}

      {/* Category tabs */}
      {!showDetail && tab === 'debatter' && (
        <div style={{ background: 'rgba(255,255,255,0.015)', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
          <div className="page-inner" style={{ padding: '0 20px', display: 'flex', overflowX: 'auto' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                fontSize: 10,
                color: activeCategory === cat ? 'var(--cat-active)' : 'var(--text3)',
                padding: '8px 12px',
                background: 'none', border: 'none',
                borderBottom: activeCategory === cat ? '2px solid var(--cat-active-border)' : '2px solid transparent',
                whiteSpace: 'nowrap',
                fontWeight: activeCategory === cat ? 500 : 400,
              }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="page-inner" style={{ padding: '0 20px 60px' }}>
        {showDetail ? (
          <div style={{ maxWidth: 860, margin: '0 auto', paddingTop: 20 }}>
            <DebateDetail debate={selectedDebate!} onUpdate={(updated: Debate) => updateDebate(updated)} />
          </div>
        ) : tab === 'debatter' ? (
          <div className="feed-layout" style={{ paddingTop: 16 }}>
            {/* Left: debate feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 20 }}>
              {debatesLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : debatesError
                ? <ErrorMessage message={debatesError} />
                : filteredDebates.length === 0
                ? <EmptyState message="Inga debatter matchar." />
                : filteredDebates.map(d => (
                    <FeedCard key={d.id} debate={d} onClick={() => setSelectedDebateId(d.id)} />
                  ))
              }
            </div>
            {/* Right: sidebar */}
            <div style={{
              borderLeft: '0.5px solid rgba(255,255,255,0.05)',
              background: 'rgba(255,255,255,0.01)',
              paddingLeft: 16,
              position: 'sticky',
              top: 0,
              maxHeight: '100vh',
              overflowY: 'auto',
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, paddingTop: 8 }}>
                Senaste omröstningar
              </div>
              {votesLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 64, borderRadius: 6, marginBottom: 8 }} />
                  ))
                : votes.slice(0, 12).map(v => <SidebarVoteItem key={v.id} vote={v} />)
              }
            </div>
          </div>
        ) : (
          <div className="cards-grid" style={{ paddingTop: 16 }}>
            {votesLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : votesError
              ? <ErrorMessage message={votesError} />
              : votes.length === 0
              ? <EmptyState message="Inga omröstningar." />
              : votes.map(v => <VoteCard key={v.id} vote={v} />)
            }
          </div>
        )}
      </div>
    </div>
  )
}

function FeedCard({ debate, onClick }: { debate: Debate; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const color = getCategoryColor(debate.topic + debate.title)
  const participants = debate.participants.slice(0, 2)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 180px',
        background: hovered ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.03)',
        border: `0.5px solid ${hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        minHeight: 90,
      }}
    >
      {/* Text */}
      <div style={{ padding: '12px 13px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <span style={{
            display: 'inline-block',
            fontSize: 9, fontWeight: 700, color,
            textTransform: 'uppercase', letterSpacing: '0.07em',
            marginBottom: 6,
          }}>
            {debate.topic.length > 35 ? debate.topic.slice(0, 35) + '…' : debate.topic}
          </span>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#e0e0ec', lineHeight: 1.35 }}>
            {debate.title.length > 100 ? debate.title.slice(0, 100) + '…' : debate.title}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>
          {formatDate(debate.date)} · {debate.venue}
        </div>
      </div>
      {/* Portraits — side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: participants.length > 1 ? '1fr 1fr' : '1fr' }}>
        {participants.length > 0 ? participants.map((p, i) => {
          const party = getParty(p.person.party)
          return (
            <div key={p.person.id || i} style={{
              position: 'relative',
              borderRight: i === 0 && participants.length > 1 ? '0.5px solid rgba(255,255,255,0.04)' : 'none',
              background: `${party?.color ?? '#334'}18`,
              overflow: 'hidden',
            }}>
              <img
                src={p.person.photoUrl}
                alt={p.person.name}
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
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
        }) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }} />
        )}
      </div>
    </div>
  )
}

function SidebarVoteItem({ vote }: { vote: Vote }) {
  const color = getCategoryColor(vote.title)
  const total = vote.totalJa + vote.totalNej
  const jaPct = total > 0 ? (vote.totalJa / total) * 100 : 50

  return (
    <div style={{ padding: '10px 0', borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
      <span style={{
        display: 'block', fontSize: 9, fontWeight: 700, color,
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4,
      }}>
        &nbsp;
      </span>
      <div style={{ fontSize: 12, color: '#d0d0dc', lineHeight: 1.35, marginBottom: 7 }}>
        {((vote.humanTitle ?? vote.title).length > 70
          ? (vote.humanTitle ?? vote.title).slice(0, 70) + '…'
          : (vote.humanTitle ?? vote.title))}
      </div>
      <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', display: 'flex', marginBottom: 5 }}>
        <div style={{ width: `${jaPct}%`, background: '#4a7a5a' }} />
        <div style={{ width: `${100 - jaPct}%`, background: '#7a3a3a' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
        <span style={{ color: '#7aaa8a' }}>{vote.totalJa} ja</span>
        <span style={{ color: '#9e6a6a' }}>{vote.totalNej} nej</span>
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

function ErrorMessage({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
      <p style={{ fontSize: 14 }}>{message}</p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
      <p style={{ fontSize: 14 }}>{message}</p>
    </div>
  )
}
