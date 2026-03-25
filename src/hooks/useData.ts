import { useState, useEffect, useRef } from 'react'
import type { Debate, Vote } from '../types'
import { fetchDebates, fetchVotes, fetchVoteDetail } from '../lib/riksdagenApi'
import { generateDebateSummary, generateVoteSummary } from '../lib/aiClient'

const CACHE_TTL = 5 * 60 * 1000

function getCached<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data as T
  } catch { return null }
}

function setCache<T>(key: string, data: T) {
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

// ── Debates ───────────────────────────────────────────────────────────────────

export function useDebates() {
  const [debates, setDebates] = useState<Debate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const cached = getCached<Debate[]>('civica_debates')
    if (cached) {
      setDebates(cached)
      setLoading(false)
      return
    }
    setLoading(true)
    fetchDebates()
      .then(data => {
        if (!cancelled) {
          setCache('civica_debates', data)
          setDebates(data)
          setLoading(false)
          // Pre-fetch summaries for top 3 debates in background so they're cached when user clicks
          data.slice(0, 3).forEach(debate => {
            if (!debate.ingress && debate.dokId) {
              generateDebateSummary(debate, '').then(summary => {
                if (cancelled) return
                setDebates(prev => prev.map(d => d.id === debate.id
                  ? { ...d, ingress: summary.ingress, leftBloc: summary.leftBloc, rightBloc: summary.rightBloc }
                  : d
                ))
              }).catch(() => {})
            }
          })
        }
      })
      .catch(() => { if (!cancelled) { setError('Kunde inte ladda debatter.'); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  function updateDebate(updated: Debate) {
    setDebates(prev => prev.map(d => d.id === updated.id ? updated : d))
  }

  return { debates, loading, error, updateDebate }
}

// ── Votes ─────────────────────────────────────────────────────────────────────

export function useVotes() {
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const summaryQueue = useRef<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchVotes()
      .then(async data => {
        if (cancelled) return
        setVotes(data)
        setLoading(false)

        // Enrich each vote with full detail (title, partyVotes) in background
        data.forEach(vote => {
          fetchVoteDetail(vote.id)
            .then(detail => {
              if (cancelled) return
              setVotes(prev => prev.map(v =>
                v.id === vote.id ? { ...v, title: detail.title, date: detail.date || v.date, partyVotes: detail.partyVotes, dokId: detail.dokId ?? v.dokId } : v
              ))
            })
            .catch(() => {})
        })

        // Generate AI summaries after a short delay (let details load first)
        setTimeout(() => {
          if (cancelled) return
          setVotes(current => {
            const toSummarize = current.filter(v => !v.jaMeaning && !summaryQueue.current.has(v.id))
            toSummarize.forEach(v => summaryQueue.current.add(v.id))
            Promise.allSettled(toSummarize.map(vote => generateVoteSummary(vote)))
              .then(results => {
                if (cancelled) return
                setVotes(prev => prev.map(v => {
                  const i = toSummarize.findIndex(s => s.id === v.id)
                  if (i === -1 || results[i].status !== 'fulfilled') return v
                  const s = (results[i] as PromiseFulfilledResult<Awaited<ReturnType<typeof generateVoteSummary>>>).value
                  return { ...v, humanTitle: s.humanTitle, jaMeaning: s.jaMeaning, nejMeaning: s.nejMeaning, consequence: s.consequence, topicEmoji: s.topicEmoji || v.topicEmoji }
                }))
              })
            return current
          })
        }, 3000)
      })
      .catch(() => { if (!cancelled) { setError('Kunde inte ladda omröstningar.'); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  return { votes, loading, error }
}
