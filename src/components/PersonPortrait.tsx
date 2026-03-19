import React, { useState } from 'react'
import type { Person } from '../types'
import { getParty } from '../types'

interface Props {
  person: Person
  height?: number
  width?: number
  /** 'card' = side by side in banner, 'detail' = stacked halves */
  variant?: 'card' | 'detail'
}

export default function PersonPortrait({ person, height = 152, width = 74, variant = 'card' }: Props) {
  const [imgFailed, setImgFailed] = useState(false)
  const party = getParty(person.party)
  const partyColor = party?.color ?? '#444'
  const textColor = party?.textColor ?? '#fff'

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        background: `${partyColor}18`,
      }}
    >
      {/* Photo or silhouette — fills entire container */}
      {!imgFailed ? (
        <img
          src={person.photoUrl}
          alt={person.name}
          loading="lazy"
          onError={() => setImgFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width={36}
            height={44}
            viewBox="0 0 36 44"
            fill={partyColor}
            opacity={0.5}
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="18" cy="12" rx="8" ry="9" />
            <path d="M1 42 C2 30 7 26 18 26 C29 26 34 30 35 42Z" />
          </svg>
        </div>
      )}

      {/* Name + party tag — absolutely positioned overlay at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '4px 5px 6px',
          textAlign: 'center',
          background: `linear-gradient(to bottom, transparent 0%, ${partyColor}99 100%)`,
          
        }}
      >
        <span
          style={{
            display: 'block',
            fontSize: 9,
            fontWeight: 600,
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
            marginBottom: 2,
          }}
        >
          {person.firstName[0]}. {person.lastName}
        </span>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 6px',
            borderRadius: 3,
            fontSize: 8,
            fontWeight: 800,
            background: partyColor,
            color: textColor,
          }}
        >
          {person.party}
        </span>
      </div>

      {/* Photos © Sveriges riksdag, source: riksdagen.se */}
    </div>
  )
}
