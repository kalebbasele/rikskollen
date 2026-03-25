import type { Debate, Vote } from '../types'

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY ?? ''
const BACKEND = 'https://web-production-1e2f2.up.railway.app'

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

// ── Debate summaries ──────────────────────────────────────────────────────────

export async function generateDebateSummary(
  debate: Debate,
  _protocol: string
): Promise<{ ingress: string; leftBloc: Debate['leftBloc']; rightBloc: Debate['rightBloc'] }> {

  // Backend /summary endpoint fetches real speech text via 4 strategies and caches results
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
