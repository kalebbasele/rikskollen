import type { Debate, Vote } from '../types'

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY ?? ''
const BACKEND = import.meta.env.DEV
  ? 'http://localhost:3001'
  : 'https://web-production-1e2f2.up.railway.app'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch(`${BACKEND}/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`AI error: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

async function fetchProtocolText(dokId: string): Promise<string> {
  // 1. Try the document text endpoint
  try {
    const res = await fetch(`${BACKEND}/api/dokument/${dokId}.text`)
    if (res.ok) {
      const text = await res.text()
      if (text.length > 200) return text.slice(0, 7000)
    }
  } catch {}

  // 2. Fallback: fetch anforande list and extract speech texts
  try {
    const res = await fetch(`${BACKEND}/api/anforandelista/?dok_id=${dokId}&utformat=json`)
    if (res.ok) {
      const data = await res.json()
      const raw = data?.anforandelista?.anforande ?? []
      const arr: any[] = Array.isArray(raw) ? raw : [raw]
      const text = arr
        .filter((a: any) => a.anf_text || a.anf_ffstycke)
        .map((a: any) => {
          const body = (a.anf_text ?? a.anf_ffstycke ?? '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 800)
          return `${a.talare ?? ''}: ${body}`
        })
        .join('\n\n')
      if (text.length > 200) return text.slice(0, 7000)
    }
  } catch {}

  return ''
}

// ── Debate summaries ──────────────────────────────────────────────────────────

export async function generateDebateSummary(
  debate: Debate,
  _protocol: string
): Promise<{ ingress: string; leftBloc: Debate['leftBloc']; rightBloc: Debate['rightBloc'] }> {

  // 1. Try the cached backend /summary endpoint first
  try {
    const titleParam = encodeURIComponent(debate.title ?? '')
    const dateParam = encodeURIComponent(debate.date ?? '')
    const res = await fetch(
      `${BACKEND}/summary/${debate.dokId}?title=${titleParam}&date=${dateParam}`,
      { headers: { 'x-api-key': ANTHROPIC_KEY } }
    )
    if (res.ok) {
      const data = await res.json()
      const ingress: string = data.ingress ?? ''
      // Only use if it contains real content
      if (ingress.length > 50 && !ingress.toLowerCase().includes('ingen information')) {
        return {
          ingress,
          leftBloc: {
            parties: data.vansterblocket?.parties ?? [],
            summary: data.vansterblocket?.summary ?? '',
            keyArg: data.vansterblocket?.keyArg ?? '',
          },
          rightBloc: {
            parties: data.hogerblocket?.parties ?? [],
            summary: data.hogerblocket?.summary ?? '',
            keyArg: data.hogerblocket?.keyArg ?? '',
          },
        }
      }
    }
  } catch {}

  // 2. Fetch protocol text and generate directly with Claude
  const protocolText = await fetchProtocolText(debate.dokId ?? '')
  if (!protocolText) throw new Error('Ingen debatttext hittades')

  const participants = debate.participants
    .map(p => `${p.person.name} (${p.person.party})`)
    .join(', ')

  const prompt = `Du är en politisk journalist. Sammanfatta denna riksdagsdebatt på svenska.

Debatt: ${debate.title}
Datum: ${debate.date}
Deltagare: ${participants}

Debattprotokoll:
${protocolText}

Svara ENDAST med ett JSON-objekt:
{
  "ingress": "[2-3 meningar som sammanfattar debatten neutralt och konkret]",
  "vansterblocket": {
    "parties": ["S", "V", "MP"],
    "summary": "[Vänsterblockets ståndpunkt, 1-2 meningar]",
    "keyArg": "[Deras starkaste argument, 1 mening]"
  },
  "hogerblocket": {
    "parties": ["M", "SD", "KD", "C", "L"],
    "summary": "[Högerblockets ståndpunkt, 1-2 meningar]",
    "keyArg": "[Deras starkaste argument, 1 mening]"
  }
}`

  const raw = await callClaude(prompt)
  const clean = raw.replace(/```json|```/g, '').trim()
  const data = JSON.parse(clean)

  return {
    ingress: data.ingress ?? '',
    leftBloc: {
      parties: data.vansterblocket?.parties ?? [],
      summary: data.vansterblocket?.summary ?? '',
      keyArg: data.vansterblocket?.keyArg ?? '',
    },
    rightBloc: {
      parties: data.hogerblocket?.parties ?? [],
      summary: data.hogerblocket?.summary ?? '',
      keyArg: data.hogerblocket?.keyArg ?? '',
    },
  }
}

// ── Vote summaries ────────────────────────────────────────────────────────────

export async function generateVoteSummary(
  vote: Vote
): Promise<{ humanTitle: string; jaMeaning: string; nejMeaning: string; consequence: string; topicEmoji: string }> {
  const partyBreakdown = vote.partyVotes
    .map(pv => `${pv.party}: ${pv.ja} ja, ${pv.nej} nej`)
    .join('\n')

  const prompt = `Du är en politisk journalist som förklarar riksdagsbeslut konkret för unga svenska väljare.

Omröstning: ${vote.title}
Datum: ${vote.date}
Resultat: ${vote.totalJa} ja, ${vote.totalNej} nej → ${vote.outcome === 'ja' ? 'BIFALLEN' : 'AVSLAGEN'}

Partier:
${partyBreakdown}

VIKTIGT:
- "humanTitle": Skriv en kort fråga (max 8 ord) som vanliga människor förstår, t.ex. "Ska straffen för minderåriga höjas?" eller "Får arbetsgivare säga upp utan skäl?". INTE det tekniska dokumentnamnet.
- "jaMeaning"/"nejMeaning": Förklara KONKRET vad som händer i verkligheten — INTE "att rösta ja innebär att man stödjer förslaget". T.ex. "Arbetsgivare får säga upp utan skäl under 24 månader" eller "Nuvarande sjukpenningregler behålls".

Svara ENDAST med ett JSON-objekt (ingen annan text):
{
  "humanTitle": "[Kort fråga, max 8 ord, begriplig för alla]",
  "jaMeaning": "[Konkret vad JA innebär i praktiken, en mening]",
  "nejMeaning": "[Konkret vad NEJ innebär i praktiken, en mening]",
  "consequence": "[Vad utfallet betyder för vanliga människor, 1-2 meningar]",
  "topicEmoji": "[ett emoji som passar ämnet]"
}`

  const raw = await callClaude(prompt)
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
