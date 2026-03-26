import type { Debate, Vote, Person, PartyVote } from '../types'

const BACKEND = 'https://web-production-1e2f2.up.railway.app'
const RD = 'https://data.riksdagen.se'

export function personPhotoUrl(id: string): string {
  return `https://data.riksdagen.se/filarkiv/bilder/ledamot/${id}_max.jpg`
}

export function guessEmoji(_title: string): string {
  return ''
}

function cleanName(raw: string): string {
  return raw
    .replace(/\s*\([^)]+\)\s*$/, '')
    .replace(/^.*minister\s+/i, '')
    .replace(/^Statssekreterare\s+/i, '')
    .replace(/^Talman\s+/i, '')
    .trim()
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

    const anforanden: any[] = (() => {
      const a = dok.debatt?.anforande
      if (!a) return []
      return Array.isArray(a) ? a : [a]
    })()

    const anforMap = new Map<string, { name: string; party: string }>()
    for (const a of anforanden) {
      if (a.intressent_id && !anforMap.has(a.intressent_id)) {
        anforMap.set(a.intressent_id, {
          name: cleanName(a.talare ?? ''),
          party: a.parti || a.partibet || '',
        })
      }
    }

    const makeParticipant = (i: any, role: string): { person: Person; role: string } => {
      const id = i.intressent_id ?? ''
      const fromAnf = anforMap.get(id)
      const name = fromAnf?.name || cleanName(i.namn ?? 'Okänd')
      const party = i.partibet || i.parti || fromAnf?.party || ''
      return {
        person: {
          id, name,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' '),
          party,
          photoUrl: personPhotoUrl(id),
        },
        role,
      }
    }

    const seen = new Set<string>()
    const participants: { person: Person; role: string }[] = []

    const undertecknare = intressenter.find((i: any) => i.roll === 'undertecknare')
    if (undertecknare?.intressent_id) {
      seen.add(undertecknare.intressent_id)
      participants.push(makeParticipant(undertecknare, 'undertecknare'))
    }

    const besvaradav = intressenter.find((i: any) => i.roll === 'besvaradav')
    if (besvaradav?.intressent_id && !seen.has(besvaradav.intressent_id)) {
      seen.add(besvaradav.intressent_id)
      participants.push(makeParticipant(besvaradav, 'besvaradav'))
    }

    for (const a of anforanden) {
      const id = a.intressent_id
      if (!id || seen.has(id)) continue
      seen.add(id)
      const fromDokIntressent = intressenter.find((i: any) => i.intressent_id === id)
      if (fromDokIntressent) {
        participants.push(makeParticipant(fromDokIntressent, 'talare'))
      } else {
        const name = cleanName(a.talare ?? 'Okänd')
        participants.push({
          person: {
            id, name,
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' '),
            party: a.parti || a.partibet || '',
            photoUrl: personPhotoUrl(id),
          },
          role: 'talare',
        })
      }
    }

    if (participants.length === 0) continue

    const seenNames = new Set<string>()
    const uniqueParticipants = participants.filter(p => {
      const key = p.person.name.toLowerCase().trim()
      if (seenNames.has(key)) return false
      seenNames.add(key)
      return true
    })

    const debattdag = dok.debattdag || anforanden[0]?.anf_datumtid?.slice(0, 10) || dok.datum || ''
    const title = dok.titel ?? 'Debatt'
    debates.push({
      id: dok.dok_id, title,
      topic: dok.debattnamn ?? 'Interpellationsdebatt',
      topicEmoji: guessEmoji(title),
      date: debattdag, venue: 'Riksdagens kammare',
      dokId: dok.dok_id,
      participants: uniqueParticipants,
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

// ── Votes — direct to data.riksdagen.se (no Railway) ─────────────────────────

async function parsePartyVotes(voteringId: string): Promise<{ partyVotes: PartyVote[]; title: string; date: string; dokId?: string }> {
  // Use the lightweight party-aggregated endpoint instead of the huge per-MP JSON
  const res = await fetch(
    `${RD}/voteringlista/?votering_id=${encodeURIComponent(voteringId)}&utformat=json&antal=500`
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const rows: any[] = (() => {
    const r = data?.voteringlista?.votering
    if (!r) return []
    return Array.isArray(r) ? r : [r]
  })()

  const partyMap: Record<string, PartyVote> = {}
  let title = ''
  let date = ''
  let dokId = ''

  for (const r of rows) {
    const party = r.parti ?? r.partibet ?? ''
    if (!party || party === '-') continue
    if (!partyMap[party]) partyMap[party] = { party, ja: 0, nej: 0, avstar: 0, franvarande: 0 }
    const rost = (r.rost ?? '').toLowerCase()
    if (rost === 'ja') partyMap[party].ja++
    else if (rost === 'nej') partyMap[party].nej++
    else if (rost === 'avstår') partyMap[party].avstar++
    else partyMap[party].franvarande++

    if (!title && r.rubrik) title = r.rubrik
    if (!date && r.datum) date = r.datum.slice(0, 10)
    if (!dokId && r.dok_id) dokId = r.dok_id
  }

  return {
    partyVotes: (Object.values(partyMap) as PartyVote[])
      .filter(p => p.party !== '-')
      .sort((a, b) => b.ja - a.ja),
    title,
    date,
    dokId,
  }
}

export async function fetchVotes(): Promise<Vote[]> {
  // Step 1: fetch the list (instant, ~300ms)
  const listRes = await fetch(
    `${RD}/voteringlista/?sz=6&utformat=json&gruppering=votering_id`
  )
  if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`)
  const listData = await listRes.json()
  const items: any[] = (() => {
    const r = listData?.voteringlista?.votering
    if (!r) return []
    return Array.isArray(r) ? r : [r]
  })()

  const top = items.slice(0, 4)

  // Step 2: fetch party breakdown for each vote in parallel
  const details = await Promise.allSettled(
    top.map(item => parsePartyVotes(item.votering_id))
  )

  return top.map((item, i) => {
    const det = details[i].status === 'fulfilled' ? details[i].value : null
    return {
      id: item.votering_id,
      title: det?.title || item.beteckning || item.votering_id || 'Omröstning',
      date: det?.date || item.datum || '',
      totalJa: parseInt(item.Ja) || 0,
      totalNej: parseInt(item.Nej) || 0,
      totalAvstar: parseInt(item['Avstår']) || 0,
      totalFranvarande: parseInt(item['Frånvarande']) || 0,
      partyVotes: det?.partyVotes ?? [],
      dokId: det?.dokId,
      outcome: ((parseInt(item.Ja) || 0) >= (parseInt(item.Nej) || 0) ? 'ja' : 'nej') as 'ja' | 'nej',
      topicEmoji: '',
    }
  })
}
