import { useState, useEffect } from 'react'
import type { Debate, Vote, Fragstund } from '../types'

const BACKEND = 'https://web-production-1e2f2.up.railway.app'

// ── Debates ───────────────────────────────────────────────────────────────────

export function useDebates() {
  const [debates, setDebates] = useState<Debate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${BACKEND}/api/public/debates`)
      .then(r => r.json())
      .then((data: Debate[]) => {
        if (!cancelled) { setDebates(data); setLoading(false) }
      })
      .catch(() => {
        if (!cancelled) { setError('Kunde inte ladda debatter.'); setLoading(false) }
      })
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

  useEffect(() => {
    let cancelled = false
    fetch(`${BACKEND}/api/public/votes`)
      .then(r => r.json())
      .then((data: Vote[]) => {
        if (!cancelled) { setVotes(data); setLoading(false) }
      })
      .catch(() => {
        if (!cancelled) { setError('Kunde inte ladda omröstningar.'); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [])

  return { votes, loading, error }
}

// ── Frågestund ────────────────────────────────────────────────────────────────

export function useFragstund() {
  const [fragstund, setFragstund] = useState<Fragstund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${BACKEND}/api/public/fragstund`)
      .then(r => r.json())
      .then((data: Fragstund[]) => {
        if (!cancelled) { setFragstund(data); setLoading(false) }
      })
      .catch(() => {
        if (!cancelled) { setError('Kunde inte ladda frågestunder.'); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [])

  return { fragstund, loading, error }
}

// Kept for DebateDetail compatibility
export function saveSummary(_dokId: string, _entry: unknown) {}
