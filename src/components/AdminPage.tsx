import React, { useState, useRef, useCallback } from 'react'
import type { Debate } from '../types'

interface Props {
  debates: Debate[]
  onUpdate: (updated: Debate) => void
  onClose: () => void
}

interface CropState {
  x: number
  y: number
  scale: number
}

export default function AdminPage({ debates, onUpdate, onClose }: Props) {
  const [selected, setSelected] = useState<Debate | null>(null)
  const [edited, setEdited] = useState<Debate | null>(null)
  const [saved, setSaved] = useState(false)
  const [cropTarget, setCropTarget] = useState<number | null>(null)
  const [crops, setCrops] = useState<CropState[]>([{ x: 0, y: 0, scale: 1 }, { x: 0, y: 0, scale: 1 }])
  const dragRef = useRef<{ startX: number; startY: number; cropX: number; cropY: number } | null>(null)

  function selectDebate(d: Debate) {
    setSelected(d)
    setEdited(JSON.parse(JSON.stringify(d)))
    setSaved(false)
    setCropTarget(null)
    setCrops([{ x: 0, y: 0, scale: 1 }, { x: 0, y: 0, scale: 1 }])
  }

  function updateField(field: string, value: string) {
    if (!edited) return
    setEdited({ ...edited, [field]: value })
    setSaved(false)
  }

  function updateParticipantName(idx: number, firstName: string, lastName: string) {
    if (!edited) return
    const participants = [...edited.participants]
    participants[idx] = {
      ...participants[idx],
      person: { ...participants[idx].person, firstName, lastName },
    }
    setEdited({ ...edited, participants })
    setSaved(false)
  }

  function publish() {
    if (!edited) return
    onUpdate(edited)
    setSaved(true)
  }

  function onImgDragStart(e: React.MouseEvent, idx: number) {
    setCropTarget(idx)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      cropX: crops[idx].x,
      cropY: crops[idx].y,
    }
  }

  function onImgDragMove(e: React.MouseEvent) {
    if (dragRef.current === null || cropTarget === null) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setCrops(prev => {
      const next = [...prev]
      next[cropTarget] = {
        ...next[cropTarget],
        x: dragRef.current!.cropX + dx,
        y: dragRef.current!.cropY + dy,
      }
      return next
    })
  }

  function onImgDragEnd() {
    dragRef.current = null
  }

  function onScaleChange(idx: number, scale: number) {
    setCrops(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], scale }
      return next
    })
  }

  const mainParticipants = edited?.participants.slice(0, 2) ?? []

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1a',
      color: '#fff',
      fontFamily: '-apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: '#0d1422',
        borderBottom: '1px solid rgba(124,92,252,0.3)',
        padding: '0 16px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          fontSize: 12, cursor: 'pointer', padding: 0,
        }}>← Tillbaka</button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#9b6fff' }}>Admin</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>Civica CMS</span>
        {edited && (
          <button
            onClick={publish}
            style={{
              marginLeft: 'auto',
              background: saved ? '#1a7a4a' : '#7c5cfc',
              border: 'none',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 18px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'background .2s',
            }}
          >
            {saved ? '✓ Publicerat' : '↑ Publicera'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>

        {/* Sidebar — debate list */}
        <div style={{
          width: 220,
          borderRight: '1px solid rgba(255,255,255,0.07)',
          overflowY: 'auto',
          flexShrink: 0,
          background: '#0b1020',
        }}>
          <div style={{ padding: '10px 12px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>
            Debatter
          </div>
          {debates.map(d => (
            <div
              key={d.id}
              onClick={() => selectDebate(d)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderLeft: selected?.id === d.id ? '2px solid #7c5cfc' : '2px solid transparent',
                background: selected?.id === d.id ? 'rgba(124,92,252,0.08)' : 'transparent',
                borderBottom: '0.5px solid rgba(255,255,255,0.04)',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 500, color: selected?.id === d.id ? '#fff' : 'rgba(255,255,255,0.6)', lineHeight: 1.4, marginBottom: 3 }}>
                {d.title.slice(0, 60)}{d.title.length > 60 ? '…' : ''}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{d.date}</div>
            </div>
          ))}
        </div>

        {/* Editor */}
        {!edited ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
            Välj en debatt att redigera
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}
            onMouseMove={onImgDragMove}
            onMouseUp={onImgDragEnd}
            onMouseLeave={onImgDragEnd}
          >

            {/* Live preview */}
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
              Förhandsvisning
            </div>
            <div style={{
              height: 160,
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              background: '#0d1b2a',
              marginBottom: 24,
              position: 'relative',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, #0d1b2a 0%, #1a2d44 60%, #0a1520 100%)' }} />
              <div style={{
                flex: 1, padding: '14px 16px',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                position: 'relative', zIndex: 2, minWidth: 0,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9b6fff', marginBottom: 5 }}>
                  {edited.topicEmoji} {edited.topic}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25, color: '#fff' }}>
                  {edited.title}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  {edited.date} · {edited.venue}
                </div>
              </div>
              {/* Portrait previews */}
              <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, width: 80 }}>
                {mainParticipants.map((p, i) => {
                  const crop = crops[i]
                  return (
                    <div key={i} style={{
                      flex: 1, overflow: 'hidden', position: 'relative',
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                      cursor: 'grab',
                    }}
                      onMouseDown={e => onImgDragStart(e, i)}
                    >
                      <img
                        src={p.person.photoUrl}
                        style={{
                          position: 'absolute',
                          width: `${100 * crop.scale}%`,
                          height: `${100 * crop.scale}%`,
                          objectFit: 'cover',
                          objectPosition: 'top center',
                          transform: `translate(${crop.x}px, ${crop.y}px)`,
                          userSelect: 'none',
                          pointerEvents: 'none',
                        }}
                      />
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        padding: '3px 4px 5px', textAlign: 'center',
                        background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))',
                      }}>
                        <div style={{ fontSize: 8, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.person.firstName[0]}. {p.person.lastName}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Text fields */}
            <Section title="Titel">
              <Textarea value={edited.title} onChange={v => updateField('title', v)} rows={2} />
            </Section>

            <Section title="Ämne">
              <Input value={edited.topic} onChange={v => updateField('topic', v)} />
            </Section>

            <Section title="Emoji">
              <Input value={edited.topicEmoji ?? ''} onChange={v => updateField('topicEmoji', v)} style={{ width: 80 }} />
            </Section>

            <Section title="Datum">
              <Input value={edited.date} onChange={v => updateField('date', v)} />
            </Section>

            <Section title="Plats">
              <Input value={edited.venue ?? ''} onChange={v => updateField('venue', v)} />
            </Section>

            {edited.ingress && (
              <Section title="Sammanfattning">
                <Textarea value={edited.ingress} onChange={v => updateField('ingress', v)} rows={5} />
              </Section>
            )}

            {/* Participants */}
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 10, marginTop: 4 }}>
              Talare
            </div>
            {mainParticipants.map((p, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 10,
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* Image crop controls */}
                  <div style={{ flexShrink: 0 }}>
                    <div style={{
                      width: 56, height: 68, overflow: 'hidden', borderRadius: 6,
                      position: 'relative', background: '#1a2d44',
                      cursor: 'grab', border: cropTarget === i ? '1px solid #7c5cfc' : '1px solid rgba(255,255,255,0.1)',
                    }}
                      onMouseDown={e => onImgDragStart(e, i)}
                    >
                      <img src={p.person.photoUrl} style={{
                        position: 'absolute',
                        width: `${100 * crops[i].scale}%`,
                        height: `${100 * crops[i].scale}%`,
                        objectFit: 'cover',
                        objectPosition: 'top center',
                        transform: `translate(${crops[i].x}px, ${crops[i].y}px)`,
                        userSelect: 'none', pointerEvents: 'none',
                      }} />
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>Zoom</div>
                      <input type="range" min="0.5" max="3" step="0.05"
                        value={crops[i].scale}
                        onChange={e => onScaleChange(i, parseFloat(e.target.value))}
                        style={{ width: 56, accentColor: '#7c5cfc' }}
                      />
                    </div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 4, textAlign: 'center' }}>
                      Dra för att flytta
                    </div>
                  </div>

                  {/* Name fields */}
                  <div style={{ flex: 1 }}>
                    <Label>Förnamn</Label>
                    <input
                      value={p.person.firstName}
                      onChange={e => updateParticipantName(i, e.target.value, p.person.lastName)}
                      style={inputStyle}
                    />
                    <Label>Efternamn</Label>
                    <input
                      value={p.person.lastName}
                      onChange={e => updateParticipantName(i, p.person.firstName, e.target.value)}
                      style={inputStyle}
                    />
                    <Label>Parti</Label>
                    <input value={p.person.party} readOnly style={{ ...inputStyle, opacity: 0.4 }} />
                  </div>
                </div>
              </div>
            ))}

            <div style={{ height: 40 }} />
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7,
  padding: '7px 10px',
  color: '#fff',
  fontSize: 12,
  marginBottom: 8,
  outline: 'none',
  boxSizing: 'border-box',
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{children}</div>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{title}</Label>
      {children}
    </div>
  )
}

function Input({ value, onChange, style }: { value: string; onChange: (v: string) => void; style?: React.CSSProperties }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, ...style }}
    />
  )
}

function Textarea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
    />
  )
}
