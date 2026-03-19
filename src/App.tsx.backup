import React, { useState, useMemo, useRef } from 'react'
import type { ActiveFilters, Debate } from './types'
import { useDebates, useVotes } from './hooks/useData'
import DebateCard from './components/DebateCard'
import DebateDetail from './components/DebateDetail'
import VoteCard from './components/VoteCard'
import SkeletonCard from './components/SkeletonCard'
import AdminPage from './components/AdminPage'

type Tab = 'debatter' | 'omrostningar'

const CATEGORIES = ['Alla', 'Migration', 'Ekonomi', 'Klimat', 'Vård', 'Försvar', 'Utbildning', 'Utrikespolitik']

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

  // Triple-click on logo to open admin
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

  const filteredVotes = useMemo(() => {
    if (!filters.parties.length) return votes
    return votes.filter(v =>
      filters.parties.some(fp => v.partyVotes.some(pv => pv.party.toUpperCase() === fp))
    )
  }, [votes, filters])

  const selectedDebate = selectedDebateId ? debates.find(d => d.id === selectedDebateId) : null
  const showDetail = !!selectedDebate

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '')
  }

  const latestDebate = debates[0]

  // Admin fullscreen
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
    <div style={{ paddingBottom: showDetail ? 0 : 0 }}>

      {/* Top navbar */}
      <div style={{
        background: 'var(--top-bg)',
        borderBottom: theme === 'dark' ? '1px solid rgba(124,92,252,0.4)' : 'none',
        padding: '0 16px',
        height: 44,
        display: 'flex',
        alignItems: 'center',
      }}>
        <div
          onClick={handleLogoClick}
          style={{ fontSize: 18, fontWeight: 500, color: '#fff', letterSpacing: '-0.02em', cursor: 'default', userSelect: 'none' }}
        >
          Civi<span style={{ color: 'var(--logo-accent)' }}>ca</span>
        </div>
        <div style={{ display: 'flex', marginLeft: 'auto', alignItems: 'center', gap: 0 }}>
          {showDetail ? (
            <button
              onClick={() => setSelectedDebateId(null)}
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--logo-accent)', background: 'none', border: 'none' }}
            >
              ← Tillbaka
            </button>
          ) : (
            <>
              {(['debatter', 'omrostningar'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    fontSize: 11,
                    color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
                    padding: '0 12px',
                    background: 'none',
                    border: 'none',
                    borderLeft: '0.5px solid rgba(255,255,255,0.08)',
                    height: 44,
                  }}
                >
                  {t === 'debatter' ? 'Debatter' : 'Omröstningar'}
                </button>
              ))}
              <button
                onClick={toggleTheme}
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.4)',
                  padding: '0 12px',
                  borderLeft: '0.5px solid rgba(255,255,255,0.08)',
                  background: 'none',
                  border: 'none',
                  height: 44,
                }}
              >
                {theme === 'dark' ? '☀' : '◐'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Ticker */}
      {!showDetail && latestDebate && (
        <div style={{
          background: 'var(--ticker-bg)',
          borderBottom: '0.5px solid var(--ticker-border)',
          padding: '6px 16px',
          fontSize: 10,
          color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.45)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            color: 'var(--ticker-label)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>Senaste</span>
          {latestDebate.topic} · {formatDate(latestDebate.date)}
        </div>
      )}

      {/* Category tabs */}
      {!showDetail && tab === 'debatter' && (
        <div style={{
          background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#fff',
          borderBottom: theme === 'dark' ? '0.5px solid rgba(255,255,255,0.06)' : '0.5px solid #ddd',
          padding: '0 16px',
          display: 'flex',
          overflowX: 'auto',
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                fontSize: 10,
                color: activeCategory === cat ? 'var(--cat-active)' : 'var(--text3)',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                borderBottom: activeCategory === cat ? `2px solid var(--cat-active-border)` : '2px solid transparent',
                whiteSpace: 'nowrap',
                fontWeight: activeCategory === cat ? 500 : 400,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: showDetail ? 0 : '14px 16px 24px' }}>
        {showDetail ? (
          <DebateDetail
            debate={selectedDebate!}
            onUpdate={(updated: Debate) => updateDebate(updated)}
          />
        ) : tab === 'debatter' ? (
          <>
            {debatesLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : debatesError
              ? <ErrorMessage message={debatesError} />
              : filteredDebates.length === 0
              ? <EmptyState message="Inga debatter matchar." />
              : filteredDebates.map(debate => (
                  <DebateCard
                    key={debate.id}
                    debate={debate}
                    onClick={() => setSelectedDebateId(debate.id)}
                  />
                ))
            }
          </>
        ) : (
          <>
            {votesLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : votesError
              ? <ErrorMessage message={votesError} />
              : filteredVotes.length === 0
              ? <EmptyState message="Inga omröstningar." />
              : filteredVotes.map(vote => <VoteCard key={vote.id} vote={vote} />)
            }
          </>
        )}
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
