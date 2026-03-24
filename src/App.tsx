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

function PartyBadge({ party, size = 20 }: { party: string; size?: number }) {
  const p = getParty(party)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: p?.color ?? '#333',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.36), fontWeight: 800,
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
      <div style={{ background: '#0b0b18', borderBottom: '0.5px solid rgba(255,255,255,0.07)', height: 48 }}>
        <div className="page-inner" style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
          <div onClick={handleLogoClick} style={{ fontSize: 20, fontWeight: 500, color: '#fff', letterSpacing: '-0.02em', cursor: 'default', userSelect: 'none' }}>
            Civi<span style={{ color: '#9b7dff' }}>ca</span>
          </div>
          <div style={{ display: 'flex', marginLeft: 'auto', alignItems: 'center' }}>
            {showDetail ? (
              <button onClick={() => setSelectedDebateId(null)} style={{ fontSize: 14, fontWeight: 600, color: '#9b7dff', background: 'none', border: 'none' }}>
                Tillbaka
              </button>
            ) : (
              <>
                {(['debatter', 'omrostningar'] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    fontSize: 13, color: tab === t ? '#fff' : 'rgba(255,255,255,0.35)',
                    padding: '0 14px', background: 'none', border: 'none',
                    borderLeft: '0.5px solid rgba(255,255,255,0.07)', height: 48,
                    fontWeight: tab === t ? 500 : 400,
                  }}>
                    {t === 'debatter' ? 'Debatter' : 'Omröstningar'}
                  </button>
                ))}
                <button onClick={toggleTheme} style={{
                  fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: '0 14px',
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
          <div className="page-inner" style={{ padding: '7px 24px', fontSize: 13, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#9b7dff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Senaste</span>
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
                fontSize: 14,
                color: activeCategory === cat ? '#fff' : 'rgba(255,255,255,0.3)',
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
        <div className="page-inner" style={{ padding: '20px 20px 60px' }}>
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
              <HeroCard debate={filteredDebates[0]} onClick={() => setSelectedDebateId(filteredDebates[0].id)} />

              {/* Subgrid — debates 2–4 */}
              {filteredDebates.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                  {filteredDebates.slice(1, 4).map((d, i, arr) => (
                    <SubgridCard
                      key={d.id}
                      debate={d}
                      onClick={() => setSelectedDebateId(d.id)}
                      isLast={i === arr.length - 1}
                    />
                  ))}
                </div>
              )}

              {/* Feed — debates 5+ grouped by date */}
              {filteredDebates.length > 4 && (
                <FeedSection debates={filteredDebates.slice(4)} onSelect={(id) => setSelectedDebateId(id)} />
              )}
            </>
          )}
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

function HeroCard({ debate, onClick }: { debate: Debate; onClick: () => void }) {
  const cat = getCategory(debate.topic + debate.title)
  const participants = debate.participants.slice(0, 2)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 240px',
        minHeight: 258,
        cursor: 'pointer',
        borderBottom: '0.5px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Left — text */}
      <div style={{
        padding: '32px 28px',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        background: 'rgba(124,92,252,0.06)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9b7dff', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
          Senaste · {cat.label}
        </div>
        <div style={{ fontSize: 30, fontWeight: 500, color: '#f0f0fa', lineHeight: 1.2, marginBottom: 12 }}>
          {debate.title}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
          {formatDate(debate.date)} · {debate.venue} · Interpellationsdebatt
        </div>
      </div>

      {/* Right — portraits side by side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: participants.length > 1 ? '1fr 1fr' : '1fr',
        borderLeft: '0.5px solid rgba(255,255,255,0.06)',
        height: '100%',
      }}>
        {participants.map((p, i) => (
          <div key={p.person.id || i} style={{
            position: 'relative', overflow: 'hidden',
            borderRight: i === 0 && participants.length > 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            <img
              src={p.person.photoUrl} alt={p.person.name} loading="lazy"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', borderRadius: 6 }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
              padding: '6px 6px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {p.person.name}
              </div>
              <div style={{ marginTop: 3 }}>
                <PartyBadge party={p.person.party} size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Subgrid card (debates 2–4) ────────────────────────────────────────────────

function SubgridCard({ debate, onClick, isLast }: { debate: Debate; onClick: () => void; isLast: boolean }) {
  const cat = getCategory(debate.topic + debate.title)
  const participants = debate.participants.slice(0, 2)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column',
        cursor: 'pointer',
        borderRight: isLast ? 'none' : '0.5px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Text */}
      <div style={{ flex: 1, padding: '18px 18px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: cat.color, marginBottom: 8 }}>
          {cat.label}
        </div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.82)', fontWeight: 500, lineHeight: 1.4, marginBottom: 0 }}>
          {debate.title.length > 80 ? debate.title.slice(0, 80) + '…' : debate.title}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
          {formatDate(debate.date)}
        </div>
      </div>

      {/* Portraits */}
      <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.04)', padding: '10px 18px 14px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        {participants.map((p, i) => (
          <div key={p.person.id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <div style={{ width: 68, height: 68, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }}>
              <img
                src={p.person.photoUrl} alt={p.person.name} loading="lazy"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
              />
            </div>
            <PartyBadge party={p.person.party} size={16} />
          </div>
        ))}
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
            padding: '10px 24px 6px',
            fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            borderTop: '0.5px solid rgba(255,255,255,0.05)',
          }}>
            {formatDateLabel(group.date)}
          </div>
          {group.debates.map(d => (
            <FeedCard key={d.id} debate={d} onClick={() => onSelect(d.id)} />
          ))}
        </div>
      ))}
    </>
  )
}

function FeedCard({ debate, onClick }: { debate: Debate; onClick: () => void }) {
  const cat = getCategory(debate.topic + debate.title)
  const participants = debate.participants.slice(0, 2)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 190px',
        minHeight: 158,
        borderBottom: '0.5px solid rgba(255,255,255,0.05)',
        cursor: 'pointer',
      }}
    >
      {/* Left — text */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: cat.color, marginBottom: 6 }}>
          {cat.label}
        </div>
        <div style={{ fontSize: 16, color: '#e8e8f8', fontWeight: 500, lineHeight: 1.4, marginBottom: 0 }}>
          {debate.title.length > 90 ? debate.title.slice(0, 90) + '…' : debate.title}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
          {formatDate(debate.date)} · {debate.venue}
        </div>
      </div>

      {/* Right — portraits */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: participants.length > 1 ? '1fr 1fr' : '1fr',
        borderLeft: '0.5px solid rgba(255,255,255,0.05)',
        height: '100%',
        minHeight: 158,
      }}>
        {participants.map((p, i) => (
          <div key={p.person.id || i} style={{
            position: 'relative', overflow: 'hidden',
            borderRight: i === 0 && participants.length > 1 ? '0.5px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            <img
              src={p.person.photoUrl} alt={p.person.name} loading="lazy"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', borderRadius: 6 }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
              padding: '4px 4px 5px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {p.person.name}
              </div>
              <div style={{ marginTop: 2 }}>
                <PartyBadge party={p.person.party} size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return dateStr }
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' }).toUpperCase()
  } catch { return dateStr }
}

function StatusMessage({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.25)' }}>
      <p style={{ fontSize: 15 }}>{message}</p>
    </div>
  )
}
