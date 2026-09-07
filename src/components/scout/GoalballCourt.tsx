import React, { useState } from 'react'

interface GoalballCourtProps {
  onZoneClick?: (zone: { quadrant: number; posX: number; posY: number }) => void
  events?: Array<{ pos_x: number | null; pos_y: number | null; event_category: string; outcome: string | null }>
  homeTeam?: string
  awayTeam?: string
  selectedQuadrant?: number | null
  className?: string
}

const QUADRANT_COUNT = 7
const GOAL_WIDTH = 540  // court width in viewBox units
const GOAL_Y_START = 10
const GOAL_HEIGHT = 260

// 7 equal sections across the goal mouth
const QUAD_W = GOAL_WIDTH / QUADRANT_COUNT

const QUADRANT_LABELS = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7']
const QUADRANT_NAMES = [
  'Canto Esq.',
  'Meio Esq.',
  'Centro Esq.',
  'Centro',
  'Centro Dir.',
  'Meio Dir.',
  'Canto Dir.',
]

// Colors for event dots
const EVENT_COLORS: Record<string, string> = {
  attack: '#E17055',
  defense: '#0984E3',
  goal: '#00B894',
  penalty: '#FDCB6E',
  technical: '#6C5CE7',
}

export default function GoalballCourt({
  onZoneClick,
  events = [],
  homeTeam = 'BRA',
  awayTeam = 'ADV',
  selectedQuadrant,
  className = '',
}: GoalballCourtProps) {
  const [hoveredQuadrant, setHoveredQuadrant] = useState<number | null>(null)

  const handleCourtClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onZoneClick) return
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const scaleX = 560 / rect.width
    const scaleY = 280 / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Determine quadrant from x position (10 to 550 range)
    const courtX = x - 10
    const quadrant = Math.min(QUADRANT_COUNT, Math.max(1, Math.ceil((courtX / GOAL_WIDTH) * QUADRANT_COUNT)))

    onZoneClick({
      quadrant,
      posX: Math.round((courtX / GOAL_WIDTH) * 100),
      posY: Math.round(((y - 10) / GOAL_HEIGHT) * 100),
    })
  }

  return (
    <div className={`rounded-xl overflow-hidden ${className}`} style={{ background: '#0d1b2a' }}>
      <svg
        width="100%"
        viewBox="0 0 560 280"
        style={{ display: 'block', cursor: onZoneClick ? 'crosshair' : 'default' }}
        onClick={handleCourtClick}
        role="img"
        aria-label="Quadra de Goalball com 7 quadrantes"
      >
        {/* Court background */}
        <rect x="0" y="0" width="560" height="280" fill="#0d1b2a" />

        {/* Main court boundary */}
        <rect x="10" y="10" width="540" height="260" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

        {/* Team zones */}
        {/* Home (left) attack/defense zone */}
        <rect x="10" y="10" width="180" height="260" fill="rgba(0,184,148,0.05)" />
        <rect x="10" y="10" width="180" height="260" fill="none" stroke="rgba(0,184,148,0.3)" strokeWidth="1" strokeDasharray="4 3" />

        {/* Away (right) zone */}
        <rect x="370" y="10" width="180" height="260" fill="rgba(231,112,85,0.05)" />
        <rect x="370" y="10" width="180" height="260" fill="none" stroke="rgba(231,112,85,0.3)" strokeWidth="1" strokeDasharray="4 3" />

        {/* Center line */}
        <line x1="280" y1="10" x2="280" y2="270" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 3" />

        {/* ── 7 QUADRANT LINES across goal (bottom of home side & top for away) ── */}
        {/* Home goal quadrant lines */}
        {Array.from({ length: QUADRANT_COUNT + 1 }, (_, i) => (
          <line
            key={`hq-${i}`}
            x1={10 + i * QUAD_W}
            y1={10}
            x2={10 + i * QUAD_W}
            y2={270}
            stroke="rgba(0,184,148,0.15)"
            strokeWidth="0.5"
          />
        ))}

        {/* ── QUADRANT HOVER/SELECT OVERLAYS ── */}
        {Array.from({ length: QUADRANT_COUNT }, (_, i) => {
          const qNum = i + 1
          const isHovered = hoveredQuadrant === qNum
          const isSelected = selectedQuadrant === qNum
          const x = 10 + i * QUAD_W

          return (
            <g key={`quad-${qNum}`}>
              <rect
                x={x}
                y={10}
                width={QUAD_W}
                height={260}
                fill={
                  isSelected
                    ? 'rgba(0,184,148,0.25)'
                    : isHovered
                    ? 'rgba(255,255,255,0.05)'
                    : 'transparent'
                }
                onMouseEnter={() => setHoveredQuadrant(qNum)}
                onMouseLeave={() => setHoveredQuadrant(null)}
                style={{ cursor: 'crosshair' }}
              />
              {/* Quadrant label */}
              <text
                x={x + QUAD_W / 2}
                y={268}
                textAnchor="middle"
                fill={isSelected ? '#00B894' : 'rgba(255,255,255,0.3)'}
                fontSize="9"
                fontFamily="Barlow Condensed, sans-serif"
                fontWeight={isSelected ? 700 : 400}
              >
                {QUADRANT_LABELS[i]}
              </text>
            </g>
          )
        })}

        {/* Goals */}
        <rect x="10" y="84" width="14" height="112" fill="rgba(0,184,148,0.5)" stroke="rgba(0,184,148,0.8)" strokeWidth="0.5" />
        <rect x="536" y="84" width="14" height="112" fill="rgba(231,112,85,0.5)" stroke="rgba(231,112,85,0.8)" strokeWidth="0.5" />

        {/* Goal mouth indicator lines */}
        <line x1="24" y1="84" x2="24" y2="196" stroke="rgba(0,184,148,0.5)" strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1="536" y1="84" x2="536" y2="196" stroke="rgba(231,112,85,0.5)" strokeWidth="0.5" strokeDasharray="2 2" />

        {/* Team labels */}
        <text x="100" y="148" textAnchor="middle" fill="rgba(0,184,148,0.6)" fontSize="16" fontFamily="Barlow Condensed, sans-serif" fontWeight="700" letterSpacing="2">
          {homeTeam}
        </text>
        <text x="460" y="148" textAnchor="middle" fill="rgba(231,112,85,0.6)" fontSize="16" fontFamily="Barlow Condensed, sans-serif" fontWeight="700" letterSpacing="2">
          {awayTeam}
        </text>

        {/* Quadrant name on hover */}
        {hoveredQuadrant && (
          <text
            x="280"
            y="25"
            textAnchor="middle"
            fill="rgba(255,255,255,0.7)"
            fontSize="11"
            fontFamily="Barlow Condensed, sans-serif"
          >
            {QUADRANT_NAMES[hoveredQuadrant - 1]}
          </text>
        )}

        {/* ── EVENT DOTS ── */}
        {events.map((ev, i) => {
          if (ev.pos_x === null || ev.pos_y === null) return null
          const cx = 10 + (ev.pos_x / 100) * GOAL_WIDTH
          const cy = 10 + (ev.pos_y / 100) * GOAL_HEIGHT
          const color = EVENT_COLORS[ev.event_category] || '#fff'
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={5}
              fill={color}
              opacity={0.75}
              stroke="#fff"
              strokeWidth={0.5}
            />
          )
        })}

        {/* Selected quadrant indicator at top */}
        {selectedQuadrant && (
          <rect
            x={10 + (selectedQuadrant - 1) * QUAD_W}
            y={10}
            width={QUAD_W}
            height={4}
            fill="#00B894"
          />
        )}
      </svg>

      {/* Quadrant legend */}
      <div style={{ display: 'flex', gap: 2, padding: '6px 8px', background: 'rgba(0,0,0,0.3)' }}>
        {QUADRANT_LABELS.map((label, i) => (
          <div
            key={label}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 10,
              color: selectedQuadrant === i + 1 ? '#00B894' : 'rgba(255,255,255,0.4)',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: selectedQuadrant === i + 1 ? 700 : 400,
              cursor: 'pointer',
              padding: '2px 0',
            }}
            onClick={() => onZoneClick?.({ quadrant: i + 1, posX: Math.round(((i + 0.5) / QUADRANT_COUNT) * 100), posY: 50 })}
          >
            {label}
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {QUADRANT_NAMES[i].split(' ')[0]}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { QUADRANT_NAMES, QUADRANT_LABELS }
