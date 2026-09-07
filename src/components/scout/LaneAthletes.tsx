import React from 'react'

export interface LaneAthlete {
  id: string
  full_name: string
  jersey_number?: number | null
}

interface LaneAthletesProps {
  athletes: LaneAthlete[]
  selectedAthleteId?: string | null
  onSelect: (athlete: LaneAthlete) => void
  color?: string
}

// Renders each athlete on their own horizontal lane — fits course/lane-based modalities
// (natação, remo, paracanoagem, atletismo) where there's no two-sided team court, just
// individuals side by side.
export default function LaneAthletes({ athletes, selectedAthleteId, onSelect, color = '#00B894' }: LaneAthletesProps) {
  if (athletes.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
        Nenhum atleta escalado para esta partida/prova ainda.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
      {athletes.map((a, i) => {
        const isSelected = a.id === selectedAthleteId
        return (
          <button
            key={a.id}
            onClick={() => onSelect(a)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
              border: isSelected ? '1.5px solid #fff' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '6px 10px', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{
              width: 24, height: 24, borderRadius: '50%', background: color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif', flexShrink: 0,
            }}>
              {a.jersey_number ?? i + 1}
            </span>
            <span style={{ fontSize: 12, color: '#fff', fontFamily: 'Barlow, sans-serif' }}>
              {a.full_name}
            </span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>
              Raia/Baia {i + 1}
            </span>
          </button>
        )
      })}
    </div>
  )
}
