import type { Debate, Vote, Person, PartyVote } from '../types'

const BACKEND = import.meta.env.DEV 
  ? 'http://localhost:3001'
  : 'https://web-production-1e2f2.up.railway.app'

export function personPhotoUrl(id: string): string {
  return `https://data.riksdagen.se/filarkiv/bilder/ledamot/${id}_192.jpg`
}

export function guessEmoji(_title: string): string {
  return ''
}

export async function fetchDebates(): Promise<Debate[]> {
  const res = await fetch(
    `${BACKEND}/api/dokumentlista/?doktyp=ip&utformat=json&antal=30&sort=debattdag&sortorder=desc`
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const rawDok = data?.dokumentlista?.dokument ?? []
  const dokument: any[] = Array.isArray(rawDok) ? rawDok : [rawDok]
  const debates: Debate[] = []
  for (const dok of dokument) {
    if (debates.length >= 20) break
    if (!dok.debatt) continue
    const intressenter: any[] = (() => {
      const i = dok.dokintressent?.intressent
      if (!i) return []
      return Array.isArray(i) ? i : [i]
    })()
    const undertecknare = intressenter.find((i: any) => i.roll === 'undertecknare')
    const besvaradav = intressenter.find((i: any) => i.roll === 'besvaradav')
    const toParticipant = (i: any): { person: Person; role: string } => ({
      person: {
        id: i.intressent_id ?? '',
        name: i.namn ?? 'Okänd',
        firstName: (i.namn ?? '').split(' ')[0],
        lastName: (i.namn ?? '').split(' ').slice(1).join(' '),
        party: i.partibet ?? '',
        photoUrl: personPhotoUrl(i.intressent_id ?? ''),
      },
      role: i.roll ?? 'talare',
    })
    const p1 = undertecknare ?? intressenter[0]
    const p2 = besvaradav ?? intressenter.find((i: any) => i.intressent_id !== p1?.intressent_id)
    if (!p1) continue
    const anforanden: any[] = (() => {
      const a = dok.debatt?.anforande
      if (!a) return []
      return Array.isArray(a) ? a : [a]
    })()
    const debattdag = dok.debattdag || anforanden[0]?.anf_datumtid?.slice(0, 10) || dok.datum || ''
    const title = dok.titel ?? 'Debatt'
    debates.push({
      id: dok.dok_id, title,
      topic: dok.debattnamn ?? 'Interpellationsdebatt',
      topicEmoji: guessEmoji(title),
      date: debattdag, venue: 'Riksdagens kammare',
      dokId: dok.dok_id,
      participants: [p1, p2].filter(Boolean).map(toParticipant),
    })
  }
  return debates.sort((a, b) => (b.date > a.date ? 1 : -1))
}

export async function fetchDebateProtocol(dokId: string): Promise<string> {
  try {
    const res = await fetch(`${BACKEND}/api/dokument/${dokId}.text`)
    const text = await res.text()
    if (text.length > 100) return text.slice(0, 8000)
  } catch {}
  return ''
}

export async function fetchVotes(): Promise<Vote[]> {
  const res = await fetch(`${BACKEND}/votes`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: any[] = await res.json()
  return data.map(v => ({ ...v, topicEmoji: guessEmoji(v.title) }))
}
