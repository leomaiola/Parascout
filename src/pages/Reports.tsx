import React, { useState } from 'react'
import { Download, BarChart2, TrendingUp, Users, Trophy, Filter } from 'lucide-react'
import { useMatches, useAthletes, useAthleteSeasonStats, useAthleteMatchStats } from '../hooks/useData'
import { exportMatchEvents, exportAthleteSeasonStats, exportTeamReport } from '../lib/export'
import { MODALITY_LIST } from '../constants/modalities'
import { useScoutEvents } from '../hooks/useData'
import type { Athlete } from '../lib/database.types'

// Simple bar chart using divs
function MiniBarChart({ data, color = '#00B894' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, color: '#666', width: 110, flexShrink: 0, textAlign: 'right' }}>{label}</div>
          <div style={{ flex: 1, background: '#f1f3f5', borderRadius: 4, height: 20, overflow: 'hidden', position: 'relative' }}>
            <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .5s', display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
              {value > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{value}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Sparkline using inline SVG
function Sparkline({ values, color = '#00B894', height = 40 }: { values: number[]; color?: string; height?: number }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const w = 200
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${height - (v / max) * height * 0.85}`)
  return (
    <svg width={w} height={height} style={{ display: 'block' }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => (
        <circle key={i} cx={(i / (values.length - 1)) * w} cy={height - (v / max) * height * 0.85} r={i === values.length - 1 ? 4 : 2.5} fill={color} />
      ))}
    </svg>
  )
}

// Quadrant heatmap (Goalball)
function QuadrantHeatmap({ distribution }: { distribution: Record<string, number> }) {
  const maxVal = Math.max(...Object.values(distribution), 1)
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 8, letterSpacing: 1 }}>MAPA DE QUADRANTES (Q1–Q7)</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5, 6, 7].map(q => {
          const val = distribution[q] || distribution[String(q)] || 0
          const intensity = maxVal > 0 ? val / maxVal : 0
          return (
            <div key={q} style={{
              flex: 1, textAlign: 'center', borderRadius: 8, padding: '10px 4px',
              background: `rgba(0,184,148,${0.1 + intensity * 0.85})`,
              border: '0.5px solid rgba(0,184,148,0.3)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: intensity > 0.5 ? '#fff' : '#00836a' }}>Q{q}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: intensity > 0.5 ? '#fff' : '#065f46', marginTop: 2 }}>{val}</div>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'center' }}>
        Quanto mais escuro, maior concentração de ações no quadrante
      </div>
    </div>
  )
}

// Throw type breakdown
function ThrowBreakdown({ throwTypes }: { throwTypes: Record<string, number> }) {
  const LABELS: Record<string, string> = {
    flat: 'Rasteiro', bounce: 'Quicado', spin: 'Efeito', hook: 'Gancho', lob: 'Lob', penalty: 'Penalidade'
  }
  const COLORS: Record<string, string> = {
    flat: '#0984E3', bounce: '#00B894', spin: '#6C5CE7', hook: '#E17055', lob: '#FDCB6E', penalty: '#E84393'
  }
  const total = Object.values(throwTypes).reduce((a, b) => a + b, 0)
  if (total === 0) return <div style={{ fontSize: 12, color: '#aaa' }}>Sem dados de arremesso.</div>

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 8, letterSpacing: 1 }}>TIPOS DE ARREMESSO</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(throwTypes).map(([type, count]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[type] || '#888', flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: '#555', width: 90, flexShrink: 0 }}>{LABELS[type] || type}</div>
            <div style={{ flex: 1, background: '#f1f3f5', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${(count / total) * 100}%`, height: '100%', background: COLORS[type] || '#888', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, width: 44, textAlign: 'right', color: '#333' }}>
              {count} <span style={{ fontSize: 10, fontWeight: 400, color: '#999' }}>({Math.round((count / total) * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Athlete season card
function AthleteSeasonCard({ athlete }: { athlete: Athlete }) {
  const { data: stats = [] } = useAthleteSeasonStats(athlete.id)

  const totalGoals = stats.reduce((a, s) => a + (s.goals_scored || 0), 0)
  const avgEfficiency = stats.length
    ? Math.round(stats.reduce((a, s) => a + (s.efficiency_pct || 0), 0) / stats.length)
    : 0
  const efficiencyValues = stats.map(s => s.efficiency_pct || 0)

  // Aggregate throw types
  const throwTypes: Record<string, number> = {}
  const quadrantDist: Record<string, number> = {}
  stats.forEach(s => {
    if (s.throw_types && typeof s.throw_types === 'object') {
      Object.entries(s.throw_types as Record<string, number>).forEach(([k, v]) => {
        throwTypes[k] = (throwTypes[k] || 0) + v
      })
    }
    if (s.quadrant_distribution && typeof s.quadrant_distribution === 'object') {
      Object.entries(s.quadrant_distribution as Record<string, number>).forEach(([k, v]) => {
        quadrantDist[k] = (quadrantDist[k] || 0) + v
      })
    }
  })

  return (
    <div style={{ background: '#fff', border: '0.5px solid #e8ecef', borderRadius: 12, padding: '16px 18px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#00B894,#0984E3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
          {athlete.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{athlete.full_name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {MODALITY_LIST.find(m => m.id === athlete.primary_modality)?.label} · {athlete.functional_class}
          </div>
        </div>
        <button
          onClick={() => exportAthleteSeasonStats(stats as any, athlete)}
          disabled={stats.length === 0}
          style={{ background: '#0984E3', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, opacity: stats.length === 0 ? 0.4 : 1 }}
        >
          <Download size={12} /> Excel
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Partidas', value: stats.length, color: '#0984E3' },
          { label: 'Gols', value: totalGoals, color: '#00B894' },
          { label: 'Eficiência', value: `${avgEfficiency}%`, color: avgEfficiency >= 70 ? '#00B894' : avgEfficiency >= 50 ? '#FDCB6E' : '#E17055' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, background: '#f8fafb', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 22, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 10, color: '#888' }}>{label}</div>
          </div>
        ))}
        {efficiencyValues.length > 1 && (
          <div style={{ flex: 2, background: '#f8fafb', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Evolução eficiência</div>
            <Sparkline values={efficiencyValues} color="#00B894" height={32} />
          </div>
        )}
      </div>

      {/* Goalball specific */}
      {athlete.primary_modality === 'goalball' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Object.keys(throwTypes).length > 0 && <ThrowBreakdown throwTypes={throwTypes} />}
          {Object.keys(quadrantDist).length > 0 && <QuadrantHeatmap distribution={quadrantDist} />}
        </div>
      )}

      {stats.length === 0 && (
        <p style={{ fontSize: 12, color: '#bbb', textAlign: 'center', padding: '12px 0' }}>Sem partidas registradas ainda.</p>
      )}
    </div>
  )
}

export default function ReportsPage() {
  const { data: matches = [] } = useMatches()
  const { data: athletes = [] } = useAthletes()
  const [selectedMatchId, setSelectedMatchId] = useState<string>('')
  const [selectedModality, setSelectedModality] = useState<string>('goalball')
  const { data: matchEvents = [] } = useScoutEvents(selectedMatchId)
  const { data: matchStats = [] } = useAthleteMatchStats(selectedMatchId)

  const filteredAthletes = athletes.filter(a =>
    !selectedModality || a.primary_modality === selectedModality
  )

  const selectedMatch = matches.find(m => m.id === selectedMatchId)

  // Aggregate stats for selected match
  const totalAttacks = (matchStats as any[]).reduce((a, s) => a + (s.total_attacks || 0), 0)
  const totalGoals = (matchStats as any[]).reduce((a, s) => a + (s.goals_scored || 0), 0)
  const totalBlocks = (matchStats as any[]).reduce((a, s) => a + (s.total_blocks || 0), 0)

  // Aggregate throw types and quadrants from match events
  const throwTypeDist: Record<string, number> = {}
  const quadrantDistMatch: Record<string, number> = {}
  matchEvents.forEach(e => {
    if (e.throw_type) throwTypeDist[e.throw_type] = (throwTypeDist[e.throw_type] || 0) + 1
    if (e.goal_quadrant) quadrantDistMatch[e.goal_quadrant] = (quadrantDistMatch[e.goal_quadrant] || 0) + 1
  })

  const handleExportMatch = () => {
    if (!selectedMatch || matchEvents.length === 0) return
    const athleteMap = Object.fromEntries(
      athletes.map(a => [a.id, a.full_name])
    )
    exportMatchEvents(matchEvents as any, selectedMatch, athleteMap)
  }

  const handleExportTeam = () => {
    exportTeamReport(matchStats as any, athletes)
  }

  return (
    <div style={{ fontFamily: 'Barlow, sans-serif' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 24, fontWeight: 700 }}>Relatórios & Exportação</div>
        <div style={{ fontSize: 13, color: '#888' }}>Análise longitudinal e exportação de dados</div>
      </div>

      {/* Match analysis section */}
      <div style={{ background: '#fff', border: '0.5px solid #e8ecef', borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Trophy size={16} color="#00B894" /> Análise por Partida
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={selectedMatchId}
              onChange={e => setSelectedMatchId(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13 }}
            >
              <option value="">— Selecionar partida —</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {m.home_team} × {m.away_team} · {MODALITY_LIST.find(mod => mod.id === m.modality)?.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleExportMatch}
              disabled={!selectedMatchId || matchEvents.length === 0}
              style={{ background: '#0984E3', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, opacity: !selectedMatchId || matchEvents.length === 0 ? 0.4 : 1 }}
            >
              <Download size={14} /> Exportar Excel
            </button>
          </div>
        </div>

        {selectedMatchId && (
          <>
            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Ações totais', value: matchEvents.length, color: '#6C5CE7' },
                { label: 'Ataques', value: totalAttacks, color: '#E17055' },
                { label: 'Bloqueios', value: totalBlocks, color: '#0984E3' },
                { label: 'Gols', value: totalGoals, color: '#00B894' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#f8fafb', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: 26, fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {Object.keys(throwTypeDist).length > 0 && (
                <ThrowBreakdown throwTypes={throwTypeDist} />
              )}
              {Object.keys(quadrantDistMatch).length > 0 && (
                <QuadrantHeatmap distribution={quadrantDistMatch} />
              )}
              {matchEvents.length === 0 && (
                <p style={{ fontSize: 13, color: '#aaa', gridColumn: '1/-1', textAlign: 'center', padding: '20px 0' }}>
                  Selecione uma partida com ações registradas.
                </p>
              )}
            </div>

            {/* Per-athlete breakdown */}
            {(matchStats as any[]).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Desempenho por atleta</div>
                <MiniBarChart
                  data={(matchStats as any[]).map(s => ({
                    label: athletes.find(a => a.id === s.athlete_id)?.full_name?.split(' ')[0] || '?',
                    value: s.total_events || 0
                  }))}
                  color="#6C5CE7"
                />
              </div>
            )}
          </>
        )}
        {!selectedMatchId && (
          <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '20px 0' }}>
            Selecione uma partida para ver a análise detalhada.
          </p>
        )}
      </div>

      {/* Athlete season reports */}
      <div style={{ background: '#fff', border: '0.5px solid #e8ecef', borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
            <TrendingUp size={16} color="#E17055" /> Análise por Atleta — Temporada
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Filter size={13} color="#888" />
            <select
              value={selectedModality}
              onChange={e => setSelectedModality(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13 }}
            >
              <option value="">Todas modalidades</option>
              {MODALITY_LIST.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <button
              onClick={handleExportTeam}
              disabled={matchStats.length === 0}
              style={{ background: '#00B894', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, opacity: matchStats.length === 0 ? 0.4 : 1 }}
            >
              <Download size={13} /> Equipe Excel
            </button>
          </div>
        </div>

        {filteredAthletes.length === 0 ? (
          <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '20px 0' }}>
            Nenhum atleta cadastrado para esta modalidade.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {filteredAthletes.map(athlete => (
              <AthleteSeasonCard key={athlete.id} athlete={athlete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
