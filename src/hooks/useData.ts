import { useState, useEffect, useRef } from 'react'
import type { Debate, Vote } from '../types'
import { fetchDebates, fetchVotes, fetchVoteDetail } from '../lib/riksdagenApi'
import { generateVoteSummary } from '../lib/aiClient'

const DEBATE_TTL   = 30 * 60 * 1000    // 30 min — refresh debate list
const SUMMARY_TTL  = 8 * 60 * 60 * 1000 // 8 h   — summaries don't change
const VOTES_TTL    = 8 * 60 * 60 * 1000 // 8 h   — votes rarely change

function getLocal<T>(key: string, ttl: number): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > ttl) return null
    return data as T
  } catch { return null }
}

function setLocal<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

// ── Summaries cache (separate long-lived store) ───────────────────────────────

type SummaryEntry = Pick<Debate, 'ingress' | 'leftBloc' | 'rightBloc'>

function getSummaryCache(): Record<string, SummaryEntry> {
  return getLocal<Record<string, SummaryEntry>>('civica_summaries', SUMMARY_TTL) ?? {}
}

export function saveSummary(dokId: string, entry: SummaryEntry) {
  const cache = getSummaryCache()
  cache[dokId] = entry
  setLocal('civica_summaries', cache)
}

// ── Debates ───────────────────────────────────────────────────────────────────

export function useDebates() {
  const [debates, setDebates] = useState<Debate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const cached = getLocal<Debate[]>('civica_debates', DEBATE_TTL)
    const summaries = getSummaryCache()

    if (cached) {
      // Merge any saved summaries into cached debates
      const merged = cached.map(d =>
        d.dokId && summaries[d.dokId]
          ? { ...d, ...summaries[d.dokId] }
          : d
      )
      setDebates(merged)
      setLoading(false)
      return
    }

    setLoading(true)
    fetchDebates()
      .then(data => {
        if (!cancelled) {
          // Merge saved summaries into freshly fetched debates
          const merged = data.map(d =>
            d.dokId && summaries[d.dokId]
              ? { ...d, ...summaries[d.dokId] }
              : d
          )
          setLocal('civica_debates', data)
          setDebates(merged)
          setLoading(false)
        }
      })
      .catch(() => { if (!cancelled) { setError('Kunde inte ladda debatter.'); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  function updateDebate(updated: Debate) {
    setDebates(prev => prev.map(d => d.id === updated.id ? updated : d))
    // Persist summary to long-lived cache
    if (updated.ingress && updated.dokId) {
      saveSummary(updated.dokId, {
        ingress: updated.ingress,
        leftBloc: updated.leftBloc,
        rightBloc: updated.rightBloc,
      })
    }
  }

  return { debates, loading, error, updateDebate }
}

// ── Votes ─────────────────────────────────────────────────────────────────────

export function useVotes() {
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const summaryQueue = useRef<Set<string>>(new Set())
  const enrichCount = useRef(0)

  useEffect(() => {
    let cancelled = false

    // Serve from localStorage instantly if fresh
    const cached = getLocal<Vote[]>('civica_votes', VOTES_TTL)
    if (cached && cached.length > 0) {
      setVotes(cached)
      setLoading(false)

      // Silently check if a new vote has arrived
      fetchVotes().then(fresh => {
        if (cancelled) return
        const cachedIds = new Set(cached.map(v => v.id))
        const hasNew = fresh.some(v => !cachedIds.has(v.id))
        if (hasNew) loadFull(cancelled)
      }).catch(() => {})
      return
    }

    setLoading(true)
    loadFull(cancelled)
    return () => { cancelled = true }

    function loadFull(isCancelled: boolean) {
      enrichCount.current = 0
      fetchVotes()
        .then(data => {
          if (isCancelled) return
          setVotes(data)
          setLoading(false)

          const total = data.length

          data.forEach(vote => {
            fetchVoteDetail(vote.id)
              .then(detail => {
                if (isCancelled) return
                setVotes(prev => {
                  const next = prev.map(v =>
                    v.id === vote.id
                      ? { ...v, title: detail.title, date: detail.date || v.date, partyVotes: detail.partyVotes, dokId: detail.dokId ?? v.dokId }
                      : v
                  )
                  enrichCount.current += 1
                  if (enrichCount.current === total) scheduleAI(next, isCancelled)
                  return next
                })
              })
              .catch(() => {
                enrichCount.current += 1
                if (enrichCount.current === total) {
                  setVotes(current => { scheduleAI(current, isCancelled); return current })
                }
              })
          })
        })
        .catch(() => { if (!isCancelled) { setError('Kunde inte ladda omröstningar.'); setLoading(false) } })
    }

    function scheduleAI(current: Vote[], isCancelled: boolean) {
      const toSummarize = current.filter(v => !v.jaMeaning && !summaryQueue.current.has(v.id))
      if (toSummarize.length === 0) return
      toSummarize.forEach(v => summaryQueue.current.add(v.id))
      Promise.allSettled(toSummarize.map(vote => generateVoteSummary(vote)))
        .then(results => {
          if (isCancelled) return
          setVotes(prev => {
            const next = prev.map(v => {
              const i = toSummarize.findIndex(s => s.id === v.id)
              if (i === -1 || results[i].status !== 'fulfilled') return v
              const s = (results[i] as PromiseFulfilledResult<Awaited<ReturnType<typeof generateVoteSummary>>>).value
              return { ...v, humanTitle: s.humanTitle, jaMeaning: s.jaMeaning, nejMeaning: s.nejMeaning, consequence: s.consequence, topicEmoji: s.topicEmoji || v.topicEmoji }
            })
            setLocal('civica_votes', next)
            return next
          })
        })
    }
  }, [])

  return { votes, loading, error }
}
