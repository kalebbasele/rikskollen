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

export async function fetchVotes(): Promise<Vote[]> {
  const res = await fetch(`${BACKEND}/votes`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: any[] = await res.json()
  return data.map(v => ({ ...v, topicEmoji: guessEmoji(v.title) }))
}
