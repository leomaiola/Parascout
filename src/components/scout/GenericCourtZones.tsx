import React from 'react'
import type { CourtZone } from '../../constants/modalities'

interface GenericCourtZonesProps {
  zones: CourtZone[]
  homeTeam?: string
  awayTeam?: string
  onZoneClick?: (zoneId: string) => void
  selectedZoneId?: string | null
}

const TEAM_FILL: Record<string, string> = {
  home: 'rgba(0,184,148,0.10)',
  away: 'rgba(231,112,85,0.10)',
  neutral: 'rgba(255,255,255,0.04)',
}
const TEAM_STROKE: Record<string, string> = {
  home: 'rgba(0,184,148,0.4)',
  away: 'rgba(231,112,85,0.4)',
  neutral: 'rgba(255,255,255,0.15)',
}

// Generic renderer: takes any modality's court.zones (already 0-100 normalized) and
// draws them as labeled rectangles. Works for team courts (rugby, vôlei) and
// lane/course layouts (natação, remo, paracanoagem, atletismo).
export default function GenericCourtZones({
  zones, onZoneClick, selectedZoneId,
}: GenericCourtZonesProps) {
  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#0d1b2a' }}>
      <svg viewBox="0 0 400 200" style={{ display: 'block', width: '100%' }} role="img" aria-label="Quadra/percurso da modalidade">
        <rect x="0" y="0" width="400" height="200" fill="#0d1b2a" />
        {zones.map((z) => {
          const team = z.team || 'neutral'
          const isSelected = selectedZoneId === z.id
          return (
            <g key={z.id} onClick={() => onZoneClick?.(z.id)} style={{ cursor: onZoneClick ? 'pointer' : 'default' }}>
              <rect
                x={(z.x / 100) * 400}
                y={(z.y / 100) * 200}
                width={(z.w / 100) * 400}
                height={(z.h / 100) * 200}
                fill={isSelected ? 'rgba(255,255,255,0.18)' : TEAM_FILL[team]}
                stroke={TEAM_STROKE[team]}
                strokeWidth={1}
              />
              <text
                x={(z.x / 100) * 400 + ((z.w / 100) * 400) / 2}
                y={(z.y / 100) * 200 + ((z.h / 100) * 200) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.55)"
                fontSize="10"
                fontFamily="Barlow Condensed, sans-serif"
              >
                {z.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
