import type { Debate, Vote, Person, PartyVote } from '../types'

const BACKEND = 'https://web-production-1e2f2.up.railway.app'

export function personPhotoUrl(id: string): string {
  return `https://data.riksdagen.se/filarkiv/bilder/ledamot/${id}_max.jpg`
}

export function guessEmoji(_title: string): string {
  return ''
}

function cleanName(raw: string): string {
  return raw
    .replace(/\s*\([^)]+\)\s*$/, '')        // strip "(KD)" suffix
    .replace(/^.*minister\s+/i, '')           // strip "Gymnasie-, högskole- och forskningsminister " etc
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

    // Build a name+party lookup from anforanden (more accurate names than dokintressent)
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
      // Use anforande name if available (strips ministerial titles), else fall back
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

    // 1. Undertecknare (the MP who asked) — reliable ID from dokintressent
    const undertecknare = intressenter.find((i: any) => i.roll === 'undertecknare')
    if (undertecknare?.intressent_id) {
      seen.add(undertecknare.intressent_id)
      participants.push(makeParticipant(undertecknare, 'undertecknare'))
    }

    // 2. Besvaradav (the minister who answers) — add before anforanden so reliable
    //    party info from dokintressent wins over any duplicate from anforanden
    const besvaradav = intressenter.find((i: any) => i.roll === 'besvaradav')
    if (besvaradav?.intressent_id && !seen.has(besvaradav.intressent_id)) {
      seen.add(besvaradav.intressent_id)
      participants.push(makeParticipant(besvaradav, 'besvaradav'))
    }

    // 3. All unique speakers from anforanden in debate order
    //    Cross-reference with dokintressent when possible for reliable IDs
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

    // Deduplicate by name (same person can appear with multiple IDs)
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

const RIKSDAGEN = 'https://data.riksdagen.se'

export async function fetchVotes(): Promise<Vote[]> {
  const res = await fetch(`${RIKSDAGEN}/voteringlista/?sz=8&utformat=json&gruppering=votering_id`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const items = data?.voteringlista?.votering ?? []
  const arr: any[] = Array.isArray(items) ? items : [items]
  return arr.slice(0, 6).map(item => ({
    id: item.votering_id,
    title: item.beteckning || item.votering_id || 'Omröstning',
    date: item.datum || '',
    totalJa: parseInt(item.Ja) || 0,
    totalNej: parseInt(item.Nej) || 0,
    totalAvstar: parseInt(item['Avstår']) || 0,
    totalFranvarande: parseInt(item['Frånvarande']) || 0,
    partyVotes: [] as Vote['partyVotes'],
    dokId: undefined,
    outcome: (parseInt(item.Ja) || 0) >= (parseInt(item.Nej) || 0) ? 'ja' : 'nej',
    topicEmoji: '',
  }))
}

export async function fetchVoteDetail(id: string): Promise<{ title: string; date: string; partyVotes: Vote['partyVotes']; dokId: string | null }> {
  const res = await fetch(`${RIKSDAGEN}/votering/${encodeURIComponent(id)}/json`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const d = await res.json()
  const doc = d?.votering?.dokument ?? {}
  const voteRows = d?.votering?.dokvotering?.votering ?? []
  const vArr: any[] = Array.isArray(voteRows) ? voteRows : [voteRows]
  const partyMap: Record<string, PartyVote> = {}
  for (const v of vArr) {
    const party = v.parti ?? 'Okänt'
    if (!partyMap[party]) partyMap[party] = { party, ja: 0, nej: 0, avstar: 0, franvarande: 0 }
    const rost = (v.rost ?? '').toLowerCase()
    if (rost === 'ja') partyMap[party].ja++
    else if (rost === 'nej') partyMap[party].nej++
    else if (rost === 'avstår') partyMap[party].avstar++
    else partyMap[party].franvarande++
  }
  const firstVote = vArr[0] ?? {}
  const punkt = firstVote.punkt ?? ''
  return {
    title: doc.titel ? `${doc.titel}${punkt ? ` (punkt ${punkt})` : ''}` : (firstVote.beteckning || id),
    date: (doc.datum ?? firstVote.datum ?? '').slice(0, 10),
    partyVotes: (Object.values(partyMap) as PartyVote[]).filter((p: PartyVote) => p.party !== '-').sort((a, b) => b.ja - a.ja),
    dokId: doc.dok_id ?? firstVote.dok_id ?? null,
  }
}
