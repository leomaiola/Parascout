import React from 'react'
import { formatTime } from '../../hooks/useRealtime'
import type { ScoutEvent } from '../../lib/database.types'

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  attack:    { bg: '#fff3f0', text: '#c0392b', label: 'Ataque' },
  defense:   { bg: '#f0f7ff', text: '#1d4ed8', label: 'Bloqueio' },
  goal:      { bg: '#ecfdf5', text: '#065f46', label: 'Gol' },
  penalty:   { bg: '#fef3c7', text: '#92400e', label: 'Penalidade' },
  technical: { bg: '#f1f5f9', text: '#475569', label: 'Técnico' },
}

const THROW_TYPE_LABELS: Record<string, string> = {
  flat: 'Rasteiro', bounce: 'Quicado', spin: 'Efeito',
  hook: 'Gancho', lob: 'Lob', penalty: 'Penalidade'
}

const DIRECTION_LABELS: Record<string, string> = {
  left: '← Esq', center_left: '↙ C.Esq', center: '↓ Centro',
  center_right: '↘ C.Dir', right: 'Dir →'
}

interface EventTimelineProps {
  events: ScoutEvent[]
  limit?: number
  showAthletes?: boolean
}

export default function EventTimeline({ events, limit = 30, showAthletes = true }: EventTimelineProps) {
  const displayed = events.slice(0, limit)

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
        Linha do tempo
        <span style={{ fontSize: 11, fontWeight: 400, color: '#888', marginLeft: 6 }}>
          ({events.length} ações)
        </span>
      </div>

      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#aaa', fontSize: 13, padding: '24px 0' }}>
            Nenhuma ação registrada ainda.
          </div>
        ) : (
          displayed.map((ev) => {
            const style = CATEGORY_STYLES[ev.event_category] || CATEGORY_STYLES.technical
            const athleteName = (ev as any).athletes?.full_name ?? null

            return (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
                borderBottom: '0.5px solid #f1f3f5'
              }}>
                {/* Time */}
                <div style={{
                  fontFamily: 'Barlow Condensed', fontSize: 13, fontWeight: 700,
                  color: '#00B894', minWidth: 38, flexShrink: 0
                }}>
                  {ev.match_time_sec !== null ? formatTime(ev.match_time_sec) : '--:--'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                      background: style.bg, color: style.text
                    }}>
                      {style.label}
                    </span>
                    {ev.goal_quadrant && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 20,
                        background: '#f0fdf4', color: '#15803d'
                      }}>
                        Q{ev.goal_quadrant}
                      </span>
                    )}
                    {ev.throw_type && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 20,
                        background: '#fafafa', color: '#666', border: '0.5px solid #e0e0e0'
                      }}>
                        {THROW_TYPE_LABELS[ev.throw_type] || ev.throw_type}
                      </span>
                    )}
                    {ev.throw_direction && (
                      <span style={{ fontSize: 10, color: '#888' }}>
                        {DIRECTION_LABELS[ev.throw_direction] || ev.throw_direction}
                      </span>
                    )}
                  </div>

                  {showAthletes && athleteName && (
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{athleteName}</div>
                  )}

                  {ev.penalty_type && (
                    <div style={{ fontSize: 11, color: '#c2410c', marginTop: 1 }}>
                      Penalidade: {ev.penalty_type.replace(/_/g, ' ')}
                    </div>
                  )}

                  {ev.notes && (
                    <div style={{ fontSize: 11, color: '#888', fontStyle: 'italic', marginTop: 2 }}>
                      {ev.notes}
                    </div>
                  )}
                </div>

                {/* Outcome */}
                {ev.outcome && (
                  <div style={{
                    fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                    background: ev.outcome === 'success' ? '#d1fae5' : ev.outcome === 'fail' ? '#fee2e2' : '#f1f5f9',
                    color: ev.outcome === 'success' ? '#065f46' : ev.outcome === 'fail' ? '#991b1b' : '#64748b',
                    flexShrink: 0
                  }}>
                    {ev.outcome === 'success' ? '✓' : ev.outcome === 'fail' ? '✗' : ev.outcome}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
