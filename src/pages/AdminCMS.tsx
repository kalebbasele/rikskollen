import React, { useState, useEffect } from 'react'
import { getParty } from '../types'

const BACKEND = 'https://web-production-1e2f2.up.railway.app'

function getAdminKey() { return localStorage.getItem('civica_admin_key') ?? '' }
function setAdminKey(k: string) { localStorage.setItem('civica_admin_key', k) }

function adminHeaders() {
  return { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() }
}

type Tab = 'debatter' | 'omrostningar' | 'fragstund' | 'intro' | 'statistik'

// ── Login ─────────────────────────────────────────────────────────────────────

function Login({ onLogin }: { onLogin: () => void }) {
  const [key, setKey] = useState('')
  const [err, setErr] = useState('')

  async function tryLogin() {
    const res = await fetch(`${BACKEND}/admin/debates`, { headers: { 'x-admin-key': key } })
    if (res.ok) { setAdminKey(key); onLogin() }
    else setErr('Fel lösenord')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a1728', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '40px 36px', width: 340, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Civi<span style={{ color: '#9b7dff' }}>ca</span> Admin</div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>CMS — logga in för att fortsätta</p>
        <input
          type="password" value={key} onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && tryLogin()}
          placeholder="Admin-nyckel"
          style={{ width: '100%', padding: '11px 14px', borderRadius: 8, background: '#0b0b18', border: '0.5px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 15, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }}
          autoFocus
        />
        {err && <p style={{ color: '#e8445a', fontSize: 13, marginBottom: 10 }}>{err}</p>}
        <button onClick={tryLogin} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#7c5cfc', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          Logga in
        </button>
      </div>
    </div>
  )
}

// ── Small portrait chip ───────────────────────────────────────────────────────

function Portrait({ person }: { person: any }) {
  const party = getParty(person.party)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#242130', flexShrink: 0 }}>
        <img src={person.photoUrl} alt={person.name} loading="lazy"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
      </div>
      <div style={{ width: 20, height: 20, borderRadius: 4, background: party?.color ?? '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: party?.textColor ?? '#fff' }}>
        {person.party?.slice(0, 2)}
      </div>
    </div>
  )
}

// ── Debate card ───────────────────────────────────────────────────────────────

function DebateAdminCard({ row, onApprove, onDelete, onSave }: {
  row: any; onApprove: () => void; onDelete: () => void; onSave: (data: any) => void
}) {
  const [title, setTitle] = useState(row.title ?? '')
  const [ingress, setIngress] = useState(row.ingress ?? '')
  const [leftSummary, setLeftSummary] = useState(row.left_bloc?.summary ?? '')
  const [leftKey, setLeftKey] = useState(row.left_bloc?.keyArg ?? '')
  const [rightSummary, setRightSummary] = useState(row.right_bloc?.summary ?? '')
  const [rightKey, setRightKey] = useState(row.right_bloc?.keyArg ?? '')
  const [saving, setSaving] = useState(false)
  const participants: any[] = row.participants ?? []

  async function save() {
    setSaving(true)
    await onSave({
      title, ingress,
      left_bloc: { ...(row.left_bloc ?? {}), summary: leftSummary, keyArg: leftKey },
      right_bloc: { ...(row.right_bloc ?? {}), summary: rightSummary, keyArg: rightKey },
    })
    setSaving(false)
  }

  return (
    <div style={{ background: '#1a1728', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
      {/* Preview */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px 10px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(155,125,255,0.7)', marginBottom: 4 }}>
            {row.topic} · {row.date}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{row.title}</div>
          {row.ingress && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 1.5 }}>{row.ingress}</p>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {participants.slice(0, 4).map((p: any, i: number) => <Portrait key={i} person={p.person} />)}
        </div>
      </div>

      {/* Edit form */}
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div style={{ paddingTop: 12, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Redigera</div>
        <Field label="Titel" value={title} onChange={setTitle} />
        <Field label="Ingress" value={ingress} onChange={setIngress} multiline />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Vänsterblocket — sammanfattning" value={leftSummary} onChange={setLeftSummary} multiline />
          <Field label="Högerblocket — sammanfattning" value={rightSummary} onChange={setRightSummary} multiline />
          <Field label="Vänsterblocket — huvudargument" value={leftKey} onChange={setLeftKey} multiline />
          <Field label="Högerblocket — huvudargument" value={rightKey} onChange={setRightKey} multiline />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Btn color="#2ec27e" onClick={onApprove}>Godkänn och publicera</Btn>
          <Btn color="#555" onClick={save} disabled={saving}>{saving ? 'Sparar…' : 'Spara ändringar'}</Btn>
          <Btn color="#e8445a" onClick={onDelete}>Radera</Btn>
        </div>
      </div>
    </div>
  )
}

// ── Vote card ─────────────────────────────────────────────────────────────────

function VoteAdminCard({ row, onApprove, onDelete, onSave }: {
  row: any; onApprove: () => void; onDelete: () => void; onSave: (data: any) => void
}) {
  const [humanTitle, setHumanTitle] = useState(row.human_title ?? '')
  const [jaMeaning, setJaMeaning] = useState(row.ja_meaning ?? '')
  const [nejMeaning, setNejMeaning] = useState(row.nej_meaning ?? '')
  const [consequence, setConsequence] = useState(row.consequence ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await onSave({ human_title: humanTitle, ja_meaning: jaMeaning, nej_meaning: nejMeaning, consequence })
    setSaving(false)
  }

  return (
    <div style={{ background: '#1a1728', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
      {/* Preview */}
      <div style={{ padding: '14px 16px 10px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: row.outcome === 'ja' ? '#2ec27e' : '#e8445a', marginBottom: 4 }}>
          {row.date} · {row.outcome === 'ja' ? 'BIFALLEN' : 'AVSLAGEN'} · {row.total_ja} ja / {row.total_nej} nej
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{row.human_title || row.title}</div>
        {row.consequence && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 1.5 }}>{row.consequence}</p>}
      </div>

      {/* Edit form */}
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div style={{ paddingTop: 12, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Redigera</div>
        <Field label="Rubrik (humanTitle)" value={humanTitle} onChange={setHumanTitle} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="JA innebär" value={jaMeaning} onChange={setJaMeaning} multiline />
          <Field label="NEJ innebär" value={nejMeaning} onChange={setNejMeaning} multiline />
        </div>
        <Field label="Vad händer nu (consequence)" value={consequence} onChange={setConsequence} multiline />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Btn color="#2ec27e" onClick={onApprove}>Godkänn och publicera</Btn>
          <Btn color="#555" onClick={save} disabled={saving}>{saving ? 'Sparar…' : 'Spara ändringar'}</Btn>
          <Btn color="#e8445a" onClick={onDelete}>Radera</Btn>
        </div>
      </div>
    </div>
  )
}

// ── Frågestund card ───────────────────────────────────────────────────────────

function FragstundAdminCard({ row, onApprove, onDelete, onSave }: {
  row: any; onApprove: () => void; onDelete: () => void; onSave: (data: any) => void
}) {
  const [title, setTitle] = useState(row.title ?? '')
  const [summary, setSummary] = useState(row.summary ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await onSave({ title, summary })
    setSaving(false)
  }

  return (
    <div style={{ background: '#1a1728', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '14px 16px 10px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(155,125,255,0.7)', marginBottom: 4 }}>
          Frågestund · {row.date} · {row.anforanden_count ?? 0} anföranden
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{row.title}</div>
        {row.summary && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 1.5 }}>{row.summary}</p>}
      </div>
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div style={{ paddingTop: 12, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Redigera</div>
        <Field label="Titel" value={title} onChange={setTitle} />
        <Field label="Sammanfattning" value={summary} onChange={setSummary} multiline />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Btn color="#2ec27e" onClick={onApprove}>Godkänn och publicera</Btn>
          <Btn color="#555" onClick={save} disabled={saving}>{saving ? 'Sparar…' : 'Spara ändringar'}</Btn>
          <Btn color="#e8445a" onClick={onDelete}>Radera</Btn>
        </div>
      </div>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const base: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 7,
    background: '#0b0b18', border: '0.5px solid rgba(255,255,255,0.12)',
    color: '#fff', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', resize: 'vertical', boxSizing: 'border-box',
  }
  return (
    <div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={base} />
        : <input value={value} onChange={e => onChange(e.target.value)} style={base} />
      }
    </div>
  )
}

function Btn({ color, onClick, children, disabled }: { color: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: '9px 18px', borderRadius: 8, background: color, color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1 }}>
      {children}
    </button>
  )
}

// ── Intro section editor ──────────────────────────────────────────────────────

const DEFAULT_INTRO = {
  badge: 'RIKSDAGEN · LIVE',
  headingPre: 'Vad händer i',
  words: ['Debatter', 'Omröstningar', 'Politik'],
  headingPost: 'just nu?',
  subtitle: 'Civica samlar riksdagens senaste debatter och omröstningar — utan krångel.',
  chips: [
    { icon: '🗣️', text: 'Debatter' },
    { icon: '🗳️', text: 'Omröstningar' },
    { icon: '⚖️', text: 'Valkompassen' },
  ],
}

function IntroEditor() {
  const [data, setData] = useState(DEFAULT_INTRO)
  const [wordsRaw, setWordsRaw] = useState(DEFAULT_INTRO.words.join(', '))
  const [chipsRaw, setChipsRaw] = useState(DEFAULT_INTRO.chips.map(c => `${c.icon} ${c.text}`).join('\n'))
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    fetch(`${BACKEND}/api/public/intro-settings`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setWordsRaw(d.words?.join(', ') ?? '')
        setChipsRaw(d.chips?.map((c: any) => `${c.icon} ${c.text}`).join('\n') ?? '')
      })
      .catch(() => {})
  }, [])

  function parseChips(raw: string) {
    return raw.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
      const match = line.match(/^(\S+)\s+(.+)$/)
      return match ? { icon: match[1], text: match[2] } : { icon: '', text: line }
    })
  }

  async function save() {
    setStatus('saving')
    const payload = {
      ...data,
      words: wordsRaw.split(',').map(w => w.trim()).filter(Boolean),
      chips: parseChips(chipsRaw),
    }
    try {
      const res = await fetch(`${BACKEND}/admin/intro-settings`, {
        method: 'PUT', headers: adminHeaders(), body: JSON.stringify(payload),
      })
      if (res.ok) setStatus('saved')
      else setStatus('error')
    } catch { setStatus('error') }
    setTimeout(() => setStatus('idle'), 2500)
  }

  return (
    <div style={{ background: '#1a1728', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '24px 24px 28px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
        Intro-sektion
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Badge-text (t.ex. RIKSDAGEN · LIVE)" value={data.badge} onChange={v => setData(d => ({ ...d, badge: v }))} />
        <Field label="Rubrik — rad 1 (t.ex. Vad händer i)" value={data.headingPre} onChange={v => setData(d => ({ ...d, headingPre: v }))} />
        <Field label="Roterande ord (kommaseparerade)" value={wordsRaw} onChange={setWordsRaw} />
        <Field label="Rubrik — rad 2 (t.ex. just nu?)" value={data.headingPost} onChange={v => setData(d => ({ ...d, headingPost: v }))} />
        <Field label="Undertitel" value={data.subtitle} onChange={v => setData(d => ({ ...d, subtitle: v }))} multiline />
        <Field label={'Chips (en per rad, format: emoji Text)\nt.ex. 🗣️ Debatter'} value={chipsRaw} onChange={setChipsRaw} multiline />
      </div>

      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={save} disabled={status === 'saving'} style={{
          padding: '10px 24px', borderRadius: 8, background: '#7c5cfc',
          color: '#fff', border: 'none', fontWeight: 700, fontSize: 14,
          cursor: status === 'saving' ? 'default' : 'pointer', opacity: status === 'saving' ? 0.7 : 1,
        }}>
          {status === 'saving' ? 'Uppdaterar…' : 'Uppdatera'}
        </button>
        {status === 'saved' && <span style={{ fontSize: 13, color: '#2ec27e', fontWeight: 600 }}>✓ Sparat och live!</span>}
        {status === 'error' && <span style={{ fontSize: 13, color: '#e8445a', fontWeight: 600 }}>Något gick fel</span>}
      </div>
    </div>
  )
}

// ── Regenerate summaries ──────────────────────────────────────────────────────

function RegenerateSummaries() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)

  async function run() {
    setStatus('loading')
    try {
      const res = await fetch(`${BACKEND}/admin/regenerate-summaries`, { method: 'POST', headers: adminHeaders() })
      const data = await res.json()
      if (res.ok) { setResult(data); setStatus('done') }
      else setStatus('error')
    } catch { setStatus('error') }
  }

  return (
    <div style={{ background: '#1a1728', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
        AI-sammanfattningar
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
        Kör AI-generering för debatter och frågestunder som saknar sammanfattning (max 20 åt gången).
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={run} disabled={status === 'loading'} style={{ padding: '9px 20px', borderRadius: 8, background: '#7c5cfc', color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: status === 'loading' ? 'default' : 'pointer', opacity: status === 'loading' ? 0.6 : 1 }}>
          {status === 'loading' ? 'Regenererar…' : 'Regenerera saknade sammanfattningar'}
        </button>
        {status === 'done' && result && (
          <span style={{ fontSize: 13, color: '#2ec27e', fontWeight: 600 }}>
            ✓ {result.updatedDebates} debatter + {result.updatedFragstund} frågestunder uppdaterade (av {result.totalChecked} utan sammanfattning)
          </span>
        )}
        {status === 'error' && <span style={{ fontSize: 13, color: '#e8445a', fontWeight: 600 }}>Något gick fel</span>}
      </div>
    </div>
  )
}

// ── Stats panel ───────────────────────────────────────────────────────────────

function StatsPanel() {
  const [reactions, setReactions] = useState<any[]>([])
  const [valkompass, setValkompass] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND}/admin/stats/reactions`, { headers: { 'x-admin-key': getAdminKey() } }).then(r => r.json()),
      fetch(`${BACKEND}/admin/stats/valkompass`, { headers: { 'x-admin-key': getAdminKey() } }).then(r => r.json()),
    ]).then(([r, v]) => {
      setReactions(Array.isArray(r) ? r : [])
      setValkompass(Array.isArray(v) ? v : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Group reactions by debate
  const byDebate: Record<string, { title: string; left: { up: number; down: number }; right: { up: number; down: number } }> = {}
  for (const row of reactions) {
    if (!byDebate[row.debate_id]) {
      byDebate[row.debate_id] = { title: row.title || row.debate_id, left: { up: 0, down: 0 }, right: { up: 0, down: 0 } }
    }
    const bloc = row.bloc as 'left' | 'right'
    const reaction = row.reaction as 'up' | 'down'
    if ((bloc === 'left' || bloc === 'right') && (reaction === 'up' || reaction === 'down')) {
      byDebate[row.debate_id][bloc][reaction] = row.count
    }
  }
  const debateList = Object.entries(byDebate)

  const totalValkompass = valkompass.reduce((s, r) => s + r.count, 0)

  if (loading) return <p style={{ color: 'rgba(255,255,255,0.3)', paddingTop: 40, textAlign: 'center' }}>Laddar statistik…</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Reactions */}
      <div style={{ background: '#1a1728', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
          Reaktioner på debatter
        </div>
        {debateList.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>Inga reaktioner än</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {debateList.map(([id, d]) => (
              <div key={id} style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)', paddingBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{d.title}</div>
                <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.35)', marginRight: 8 }}>Vänster</span>
                    <span style={{ color: '#2ec27e', marginRight: 6 }}>👍 {d.left.up}</span>
                    <span style={{ color: '#e8445a' }}>👎 {d.left.down}</span>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.35)', marginRight: 8 }}>Höger</span>
                    <span style={{ color: '#2ec27e', marginRight: 6 }}>👍 {d.right.up}</span>
                    <span style={{ color: '#e8445a' }}>👎 {d.right.down}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Valkompass */}
      <div style={{ background: '#1a1728', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Valkompassen — resultat
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>
          Totalt {totalValkompass} genomförda
        </div>
        {valkompass.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>Inga resultat än</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {valkompass.map(r => {
              const pct = totalValkompass > 0 ? Math.round((r.count / totalValkompass) * 100) : 0
              return (
                <div key={r.party_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, width: 32, color: '#fff' }}>{r.party_id}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: '#9b7dff', width: `${pct}%` }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', width: 60, textAlign: 'right' }}>{r.count} ({pct}%)</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main admin page ───────────────────────────────────────────────────────────

export default function AdminCMS() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<Tab>('debatter')
  const [debates, setDebates] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [fragstund, setFragstund] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (getAdminKey()) verify()
  }, [])

  async function verify() {
    const res = await fetch(`${BACKEND}/admin/debates`, { headers: { 'x-admin-key': getAdminKey() } })
    if (res.ok) { setAuthed(true); loadAll() }
  }

  async function loadAll() {
    setLoading(true)
    try {
      const [dRes, vRes, fsRes] = await Promise.all([
        fetch(`${BACKEND}/admin/debates`, { headers: adminHeaders() }),
        fetch(`${BACKEND}/admin/votes`, { headers: adminHeaders() }),
        fetch(`${BACKEND}/admin/fragstund`, { headers: adminHeaders() }),
      ])
      const [d, v, fs] = await Promise.all([dRes.json(), vRes.json(), fsRes.json()])
      setDebates(Array.isArray(d) ? d : [])
      setVotes(Array.isArray(v) ? v : [])
      setFragstund(Array.isArray(fs) ? fs : [])
    } catch(e) {
      console.error('loadAll failed:', e)
    } finally {
      setLoading(false)
    }
  }

  async function approveDebate(id: string) {
    await fetch(`${BACKEND}/admin/debates/${id}/approve`, { method: 'POST', headers: adminHeaders() })
    setDebates(prev => prev.map(d => d.id === id ? { ...d, status: 'approved', approved_at: new Date().toISOString() } : d))
  }

  async function deleteDebate(id: string) {
    if (!confirm('Radera debatten?')) return
    await fetch(`${BACKEND}/admin/debates/${id}`, { method: 'DELETE', headers: adminHeaders() })
    setDebates(prev => prev.filter(d => d.id !== id))
  }

  async function saveDebate(id: string, data: any) {
    const res = await fetch(`${BACKEND}/admin/debates/${id}`, { method: 'PATCH', headers: adminHeaders(), body: JSON.stringify(data) })
    const updated = await res.json()
    setDebates(prev => prev.map(d => d.id === id ? updated : d))
  }

  async function approveVote(id: string) {
    await fetch(`${BACKEND}/admin/votes/${id}/approve`, { method: 'POST', headers: adminHeaders() })
    setVotes(prev => prev.map(v => v.id === id ? { ...v, status: 'approved', approved_at: new Date().toISOString() } : v))
  }

  async function deleteVote(id: string) {
    if (!confirm('Radera omröstningen?')) return
    await fetch(`${BACKEND}/admin/votes/${id}`, { method: 'DELETE', headers: adminHeaders() })
    setVotes(prev => prev.filter(v => v.id !== id))
  }

  async function saveVote(id: string, data: any) {
    const res = await fetch(`${BACKEND}/admin/votes/${id}`, { method: 'PATCH', headers: adminHeaders(), body: JSON.stringify(data) })
    const updated = await res.json()
    setVotes(prev => prev.map(v => v.id === id ? updated : v))
  }

  async function approveFragstund(id: string) {
    await fetch(`${BACKEND}/admin/fragstund/${id}/approve`, { method: 'POST', headers: adminHeaders() })
    setFragstund(prev => prev.map(f => f.id === id ? { ...f, status: 'approved', approved_at: new Date().toISOString() } : f))
  }

  async function deleteFragstund(id: string) {
    if (!confirm('Radera frågestunden?')) return
    await fetch(`${BACKEND}/admin/fragstund/${id}`, { method: 'DELETE', headers: adminHeaders() })
    setFragstund(prev => prev.filter(f => f.id !== id))
  }

  async function saveFragstund(id: string, data: any) {
    const res = await fetch(`${BACKEND}/admin/fragstund/${id}`, { method: 'PATCH', headers: adminHeaders(), body: JSON.stringify(data) })
    const updated = await res.json()
    setFragstund(prev => prev.map(f => f.id === id ? updated : f))
  }

  if (!authed) return <Login onLogin={() => { setAuthed(true); loadAll() }} />

  const pendingDebates = debates.filter(d => d.status === 'pending')
  const approvedDebates = debates.filter(d => d.status === 'approved')
  const pendingVotes = votes.filter(v => v.status === 'pending')
  const approvedVotes = votes.filter(v => v.status === 'approved')
  const pendingFragstund = fragstund.filter(f => f.status === 'pending')
  const approvedFragstund = fragstund.filter(f => f.status === 'approved')

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b18', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Navbar */}
      <div style={{ background: '#0b0b18', borderBottom: '0.5px solid rgba(255,255,255,0.07)', height: 48, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <a href="/" style={{ fontSize: 20, fontWeight: 700, color: '#fff', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          Civi<span style={{ color: '#9b7dff' }}>ca</span>
        </a>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'rgba(155,125,255,0.15)', borderRadius: 20, padding: '3px 10px' }}>Admin CMS</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['debatter', 'omrostningar', 'fragstund', 'intro', 'statistik'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ fontSize: 14, color: tab === t ? '#fff' : 'rgba(255,255,255,0.35)', padding: '0 14px', background: 'none', border: 'none', borderLeft: '0.5px solid rgba(255,255,255,0.07)', height: 48, fontWeight: tab === t ? 500 : 400, cursor: 'pointer' }}>
              {t === 'debatter' ? `Debatter (${pendingDebates.length})` : t === 'omrostningar' ? `Omröstningar (${pendingVotes.length})` : t === 'fragstund' ? `Frågestund (${pendingFragstund.length})` : t === 'intro' ? 'Intro-sektion' : 'Statistik'}
            </button>
          ))}
          <button onClick={() => { localStorage.removeItem('civica_admin_key'); setAuthed(false) }} style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', padding: '0 14px', background: 'none', border: 'none', borderLeft: '0.5px solid rgba(255,255,255,0.07)', height: 48, cursor: 'pointer' }}>
            Logga ut
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 60px' }}>
        {loading && tab !== 'statistik' ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', paddingTop: 60 }}>Laddar…</p>
        ) : tab === 'statistik' ? (
          <>
            <RegenerateSummaries />
            <StatsPanel />
          </>
        ) : tab === 'intro' ? (
          <IntroEditor />
        ) : tab === 'fragstund' ? (
          <>
            <SectionHeader label="Väntar på godkännande" count={pendingFragstund.length} />
            {pendingFragstund.length === 0
              ? <Empty text="Inga frågestunder väntar" />
              : pendingFragstund.map(row => (
                <FragstundAdminCard key={row.id} row={row}
                  onApprove={() => approveFragstund(row.id)}
                  onDelete={() => deleteFragstund(row.id)}
                  onSave={(data) => saveFragstund(row.id, data)}
                />
              ))
            }
            {approvedFragstund.length > 0 && (
              <>
                <SectionHeader label="Publicerade" count={approvedFragstund.length} dimmed />
                {approvedFragstund.map(row => (
                  <FragstundAdminCard key={row.id} row={row}
                    onApprove={() => {}}
                    onDelete={() => deleteFragstund(row.id)}
                    onSave={(data) => saveFragstund(row.id, data)}
                  />
                ))}
              </>
            )}
          </>
        ) : tab === 'debatter' ? (
          <>
            <RegenerateSummaries />
            <SectionHeader label="Väntar på godkännande" count={pendingDebates.length} />
            {pendingDebates.length === 0
              ? <Empty text="Inga debatter väntar" />
              : pendingDebates.map(row => (
                <DebateAdminCard key={row.id} row={row}
                  onApprove={() => approveDebate(row.id)}
                  onDelete={() => deleteDebate(row.id)}
                  onSave={(data) => saveDebate(row.id, data)}
                />
              ))
            }
            {approvedDebates.length > 0 && (
              <>
                <SectionHeader label="Publicerade" count={approvedDebates.length} dimmed />
                {approvedDebates.map(row => (
                  <DebateAdminCard key={row.id} row={row}
                    onApprove={() => {}}
                    onDelete={() => deleteDebate(row.id)}
                    onSave={(data) => saveDebate(row.id, data)}
                  />
                ))}
              </>
            )}
          </>
        ) : (
          <>
            <SectionHeader label="Väntar på godkännande" count={pendingVotes.length} />
            {pendingVotes.length === 0
              ? <Empty text="Inga omröstningar väntar" />
              : pendingVotes.map(row => (
                <VoteAdminCard key={row.id} row={row}
                  onApprove={() => approveVote(row.id)}
                  onDelete={() => deleteVote(row.id)}
                  onSave={(data) => saveVote(row.id, data)}
                />
              ))
            }
            {approvedVotes.length > 0 && (
              <>
                <SectionHeader label="Publicerade" count={approvedVotes.length} dimmed />
                {approvedVotes.map(row => (
                  <VoteAdminCard key={row.id} row={row}
                    onApprove={() => {}}
                    onDelete={() => deleteVote(row.id)}
                    onSave={(data) => saveVote(row.id, data)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ label, count, dimmed }: { label: string; count: number; dimmed?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: dimmed ? 32 : 0 }}>
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: dimmed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)' }}>{label}</span>
      <span style={{ fontSize: 11, background: dimmed ? 'rgba(255,255,255,0.06)' : 'rgba(155,125,255,0.2)', color: dimmed ? 'rgba(255,255,255,0.3)' : '#9b7dff', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>{count}</span>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, paddingBottom: 20 }}>{text}</p>
}
