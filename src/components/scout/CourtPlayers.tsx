import React, { useState } from 'react'
import { Repeat } from 'lucide-react'

export interface CourtAthlete {
  id: string
  full_name: string
  jersey_number?: number | null
}

interface CourtPlayersProps {
  side: 'left' | 'right'
  onCourt: CourtAthlete[]              // exactly the athletes currently occupying slots (in order)
  roster: CourtAthlete[]               // full team roster, for swaps
  selectedAthleteId?: string | null
  color: string
  onSelect: (athlete: CourtAthlete) => void
  onSwap: (slotIndex: number, newAthlete: CourtAthlete) => void
}

// Vertical positions (percent) for up to 3 slots along the goal line — matches Goalball's
// 3-defenders-in-a-line formation. Works for the SVG viewBox 0..280 height used by GoalballCourt.
const SLOT_Y_PERCENT_BY_COUNT: Record<number, number[]> = {
  1: [50],
  2: [33, 67],
  3: [22, 50, 78],
}

export default function CourtPlayers({
  side, onCourt, roster, selectedAthleteId, color, onSelect, onSwap,
}: CourtPlayersProps) {
  const [swapOpenIndex, setSwapOpenIndex] = useState<number | null>(null)
  const xPercent = side === 'left' ? 7 : 93
  const slotYPercent = SLOT_Y_PERCENT_BY_COUNT[onCourt.length] || SLOT_Y_PERCENT_BY_COUNT[3]

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {slotYPercent.map((yPercent, i) => {
        const athlete = onCourt[i]
        if (!athlete) return null
        const isSelected = athlete.id === selectedAthleteId
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${xPercent}%`,
              top: `${yPercent}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <button
              onClick={() => onSelect(athlete)}
              title={athlete.full_name}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: isSelected ? '2.5px solid #fff' : '1.5px solid rgba(255,255,255,0.5)',
                background: color,
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                fontFamily: 'Barlow Condensed, sans-serif',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 0 0 3px rgba(255,255,255,0.35)' : '0 1px 4px rgba(0,0,0,0.4)',
              }}
            >
              {athlete.jersey_number ?? '–'}
            </button>
            <span style={{
              fontSize: 9, color: 'rgba(255,255,255,0.75)', maxWidth: 64,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontFamily: 'Barlow Condensed, sans-serif',
            }}>
              {athlete.full_name.split(' ')[0]}
            </span>
            <button
              onClick={() => setSwapOpenIndex(swapOpenIndex === i ? null : i)}
              title="Trocar atleta neste slot"
              style={{
                background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: 4,
                color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '1px 4px',
                display: 'flex', alignItems: 'center', gap: 2, fontSize: 9,
              }}
            >
              <Repeat size={9} />
            </button>
            {swapOpenIndex === i && (
              <select
                autoFocus
                style={{
                  position: 'absolute', top: '100%', marginTop: 4, fontSize: 11,
                  padding: '3px 4px', borderRadius: 4, border: '1px solid #ccc', zIndex: 20,
                  minWidth: 140,
                }}
                value=""
                onChange={(e) => {
                  const newAthlete = roster.find((r) => r.id === e.target.value)
                  if (newAthlete) onSwap(i, newAthlete)
                  setSwapOpenIndex(null)
                }}
                onBlur={() => setSwapOpenIndex(null)}
              >
                <option value="" disabled>Substituir por...</option>
                {roster
                  .filter((r) => !onCourt.some((oc) => oc?.id === r.id))
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.jersey_number ?? '–'} · {r.full_name}
                    </option>
                  ))}
              </select>
            )}
          </div>
        )
      })}
    </div>
  )
}
