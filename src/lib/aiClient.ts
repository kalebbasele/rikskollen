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

// Fetch interpellation document text — strips XML/HTML tags from the response
async function fetchDocumentText(dokId: string): Promise<string> {
  try {
    const res = await fetch(`${BACKEND}/api/dokument/${dokId}.text`)
    if (!res.ok) throw new Error()
    const raw = await res.text()
    // Strip all XML/HTML tags, collapse whitespace
    const clean = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (clean.length > 100) return clean.slice(0, 7000)
  } catch {}
  return ''
}

// ── Debate summaries ──────────────────────────────────────────────────────────

export async function generateDebateSummary(
  debate: Debate,
  _protocol: string
): Promise<{ ingress: string; leftBloc: Debate['leftBloc']; rightBloc: Debate['rightBloc'] }> {

  const docText = await fetchDocumentText(debate.dokId ?? '')

  const participants = debate.participants
    .map(p => `${p.person.name} (${p.person.party})`)
    .join(', ')

  const contentSection = docText
    ? `Interpellationstext:\n${docText}`
    : '(Interpellationstext ej tillgänglig — basera sammanfattningen på titel och deltagarlista)'

  const prompt = `Du är en politisk journalist. Sammanfatta denna riksdagsdebatt på svenska.

Debatt: ${debate.title}
Datum: ${debate.date}
Talare: ${participants}

${contentSection}

Svara ENDAST med ett JSON-objekt utan kommentarer:
{
  "ingress": "[2-3 meningar som neutralt och konkret sammanfattar vad interpellationen handlade om och de viktigaste ståndpunkterna]",
  "vansterblocket": {
    "parties": ["S", "V", "MP"],
    "summary": "[Vänsterblockets ståndpunkt, 1-2 meningar — skriv 'Ej representerat' om inget vänsterparti deltog]",
    "keyArg": "[Deras starkaste argument, 1 mening — eller '-' om ej representerat]"
  },
  "hogerblocket": {
    "parties": ["M", "SD", "KD", "C", "L"],
    "summary": "[Högerblockets ståndpunkt, 1-2 meningar — skriv 'Ej representerat' om inget högerparti deltog]",
    "keyArg": "[Deras starkaste argument, 1 mening — eller '-' om ej representerat]"
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
