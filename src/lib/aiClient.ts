import type { Debate, Vote } from '../types'

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY ?? ''
const BACKEND = import.meta.env.DEV
  ? 'http://localhost:3001'
  : 'https://web-production-1e2f2.up.railway.app'

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

// Fetch all speeches for a debate from riksdagen's anforandelista API
async function fetchSpeeches(dokId: string): Promise<string> {
  try {
    const res = await fetch(`${BACKEND}/api/anforandelista/?dok_id=${dokId}&utformat=json`)
    if (!res.ok) throw new Error()
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
          .slice(0, 1000)
        return `${a.talare ?? 'Talare'} (${a.partibet ?? ''}): ${body}`
      })
      .join('\n\n')
    if (text.length > 100) return text.slice(0, 8000)
  } catch {}
  return ''
}

// ── Debate summaries ──────────────────────────────────────────────────────────

export async function generateDebateSummary(
  debate: Debate,
  _protocol: string
): Promise<{ ingress: string; leftBloc: Debate['leftBloc']; rightBloc: Debate['rightBloc'] }> {

  // Fetch actual speech texts from anforandelista (most reliable source)
  const speechText = await fetchSpeeches(debate.dokId ?? '')

  if (speechText) {
    const participants = debate.participants
      .map(p => `${p.person.name} (${p.person.party})`)
      .join(', ')

    const prompt = `Du är en politisk journalist. Sammanfatta denna riksdagsdebatt på svenska, baserat på de faktiska anförandena nedan.

Debatt: ${debate.title}
Datum: ${debate.date}
Talare: ${participants}

Anföranden:
${speechText}

Svara ENDAST med ett JSON-objekt utan kommentarer:
{
  "ingress": "[2-3 meningar som neutralt och konkret sammanfattar vad debatten handlade om och vad som sades]",
  "vansterblocket": {
    "parties": ["S", "V", "MP"],
    "summary": "[Vänsterblockets ståndpunkt i debatten, 1-2 meningar]",
    "keyArg": "[Deras starkaste argument, 1 mening]"
  },
  "hogerblocket": {
    "parties": ["M", "SD", "KD", "C", "L"],
    "summary": "[Högerblockets ståndpunkt i debatten, 1-2 meningar]",
    "keyArg": "[Deras starkaste argument, 1 mening]"
  }
}`

    const raw = await callClaude(prompt)
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return {
      ingress: parsed.ingress ?? '',
      leftBloc: {
        parties: parsed.vansterblocket?.parties ?? [],
        summary: parsed.vansterblocket?.summary ?? '',
        keyArg: parsed.vansterblocket?.keyArg ?? '',
      },
      rightBloc: {
        parties: parsed.hogerblocket?.parties ?? [],
        summary: parsed.hogerblocket?.summary ?? '',
        keyArg: parsed.hogerblocket?.keyArg ?? '',
      },
    }
  }

  // Fallback: use cached backend /summary endpoint
  const titleParam = encodeURIComponent(debate.title ?? '')
  const dateParam = encodeURIComponent(debate.date ?? '')
  const res = await fetch(
    `${BACKEND}/summary/${debate.dokId}?title=${titleParam}&date=${dateParam}`,
    { headers: { 'x-api-key': ANTHROPIC_KEY } }
  )
  if (!res.ok) throw new Error(`Summary fetch failed: ${res.status}`)
  const data = await res.json()
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
- "humanTitle": Skriv en kort fråga (max 8 ord) som vanliga människor förstår. INTE det tekniska dokumentnamnet.
- "jaMeaning"/"nejMeaning": Förklara KONKRET vad som händer i verkligheten.

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
