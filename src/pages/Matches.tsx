import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Radio, Calendar, Trophy, X, CheckCircle2, Users } from 'lucide-react'
import { useMatches, useCreateMatch, useUpdateMatch, useAthletes, useAddMatchAthletes } from '../hooks/useData'
import { MODALITY_LIST } from '../constants/modalities'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { NewMatch } from '../lib/database.types'

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  scheduled: { label: 'Agendada', bg: '#dbeafe', text: '#1e3a8a' },
  live:       { label: '🔴 Ao Vivo', bg: '#fee2e2', text: '#991b1b' },
  finished:   { label: 'Encerrada', bg: '#d1fae5', text: '#065f46' },
  cancelled:  { label: 'Cancelada', bg: '#f1f5f9', text: '#64748b' },
}

const EMPTY_MATCH: Partial<NewMatch> = {
  modality: 'goalball',
  home_team: '',
  away_team: '',
  match_date: new Date().toISOString().slice(0, 16),
  venue: '',
  status: 'scheduled',
  period: '1',
  period_duration_min: 12,
}

export default function MatchesPage() {
  const navigate = useNavigate()
  const { data: matches = [], isLoading } = useMatches()
  const createMatch = useCreateMatch()
  const updateMatch = useUpdateMatch()
  const addMatchAthletes = useAddMatchAthletes()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<NewMatch>>(EMPTY_MATCH)

  // Escalação: { athleteId: jerseyNumber | null }
  const [homeRoster, setHomeRoster] = useState<Record<string, number | null>>({})
  const [awayRoster, setAwayRoster] = useState<Record<string, number | null>>({})

  const { data: athletes = [] } = useAthletes(form.modality)

  function toggleRoster(team: 'home' | 'away', athleteId: string) {
    const [roster, setRoster, otherRoster] = team === 'home'
      ? [homeRoster, setHomeRoster, awayRoster]
      : [awayRoster, setAwayRoster, homeRoster]

    // Um atleta não pode estar nos dois times na mesma partida — cada ID só aparece uma vez.
    if (otherRoster[athleteId] !== undefined) return

    setRoster((prev) => {
      const next = { ...prev }
      if (athleteId in next) delete next[athleteId]
      else next[athleteId] = null
      return next
    })
  }

  function setJersey(team: 'home' | 'away', athleteId: string, jersey: number | null) {
    const setRoster = team === 'home' ? setHomeRoster : setAwayRoster
    setRoster((prev) => ({ ...prev, [athleteId]: jersey }))
  }

  const handleCreate = async () => {
    if (!form.home_team || !form.away_team || !form.modality) return
    const created = await createMatch.mutateAsync(form as NewMatch)

    const rows = [
      ...Object.entries(homeRoster).map(([athlete_id, jersey_number]) => ({
        match_id: created.id, athlete_id, team: 'home' as const, jersey_number, is_starting: true,
      })),
      ...Object.entries(awayRoster).map(([athlete_id, jersey_number]) => ({
        match_id: created.id, athlete_id, team: 'away' as const, jersey_number, is_starting: true,
      })),
    ]
    if (rows.length > 0) await addMatchAthletes.mutateAsync(rows)

    setShowForm(false)
    setForm(EMPTY_MATCH)
    setHomeRoster({})
    setAwayRoster({})
  }

  const goLive = async (matchId: string, currentStatus: string) => {
    if (currentStatus !== 'live') {
      await updateMatch.mutateAsync({ id: matchId, data: { status: 'live' } })
    }
    navigate(`/partidas/${matchId}/scout`)
  }

  const finishMatch = async (matchId: string) => {
    await updateMatch.mutateAsync({ id: matchId, data: { status: 'finished' } })
  }

  return (
    <div style={{ fontFamily: 'Barlow, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 24, fontWeight: 700 }}>Partidas</div>
          <div style={{ fontSize: 13, color: '#888' }}>{matches.length} partidas registradas</div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: '#00B894', color: '#fff', border: 'none', borderRadius: 8,
            padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'Barlow', fontSize: 13, fontWeight: 600
          }}
        >
          <Plus size={15} /> Nova Partida
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1.5px solid #00B894', borderRadius: 12, padding: '18px 20px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: 700 }}>Nova Partida</div>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', display: 'block', marginBottom: 4 }}>Modalidade *</label>
              <select style={inputStyle} value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value as any })}>
                {MODALITY_LIST.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', display: 'block', marginBottom: 4 }}>Equipe casa *</label>
              <input style={inputStyle} value={form.home_team} onChange={(e) => setForm({ ...form, home_team: e.target.value })} placeholder="Ex: Brasil" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', display: 'block', marginBottom: 4 }}>Equipe visitante *</label>
              <input style={inputStyle} value={form.away_team} onChange={(e) => setForm({ ...form, away_team: e.target.value })} placeholder="Ex: Argentina" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', display: 'block', marginBottom: 4 }}>Data e hora</label>
              <input type="datetime-local" style={inputStyle} value={form.match_date?.slice(0, 16)} onChange={(e) => setForm({ ...form, match_date: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', display: 'block', marginBottom: 4 }}>Local</label>
              <input style={inputStyle} value={form.venue || ''} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Ex: Ginásio Ibirapuera" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', display: 'block', marginBottom: 4 }}>Duração por período (min)</label>
              <input type="number" style={inputStyle} value={form.period_duration_min || 12} onChange={(e) => setForm({ ...form, period_duration_min: +e.target.value })} />
            </div>
          </div>

          {/* Escalação de atletas por equipe */}
          <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} /> Escalação (necessária para usar a quadra interativa no Scout)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {(['home', 'away'] as const).map((team) => (
                <div key={team}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: team === 'home' ? '#00B894' : '#E17055', marginBottom: 6 }}>
                    {team === 'home' ? (form.home_team || 'Equipe casa') : (form.away_team || 'Equipe visitante')}
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto', border: '0.5px solid #eee', borderRadius: 8, padding: 6 }}>
                    {athletes.length === 0 && (
                      <div style={{ fontSize: 11, color: '#aaa', padding: 6 }}>Nenhum atleta cadastrado para essa modalidade.</div>
                    )}
                    {athletes.map((a) => {
                      const roster = team === 'home' ? homeRoster : awayRoster
                      const otherRoster = team === 'home' ? awayRoster : homeRoster
                      const isChecked = a.id in roster
                      const isDisabled = a.id in otherRoster
                      return (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 2px', opacity: isDisabled ? 0.35 : 1 }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => toggleRoster(team, a.id)}
                          />
                          <span style={{ fontSize: 12, flex: 1 }}>{a.full_name}</span>
                          {isChecked && (
                            <input
                              type="number"
                              placeholder="Nº"
                              value={roster[a.id] ?? ''}
                              onChange={(e) => setJersey(team, a.id, e.target.value ? +e.target.value : null)}
                              style={{ width: 46, padding: '2px 4px', fontSize: 11, borderRadius: 5, border: '0.5px solid #ccc' }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 6 }}>
              Cada atleta tem um ID único no banco — o mesmo atleta não pode ser escalado duas vezes nem em ambos os times na mesma partida.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={handleCreate} disabled={createMatch.isPending} style={{ background: '#00B894', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontFamily: 'Barlow', fontSize: 13, fontWeight: 600 }}>
              {createMatch.isPending ? 'Criando...' : 'Criar partida'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ background: '#f1f3f5', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontSize: 13 }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Matches list */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Carregando partidas...</div>
      ) : matches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa', background: '#fff', borderRadius: 12 }}>
          <Trophy size={48} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
          <p style={{ fontSize: 14 }}>Nenhuma partida criada.</p>
          <p style={{ fontSize: 12 }}>Clique em "Nova Partida" para começar.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {matches.map((match) => {
            const statusStyle = STATUS_LABELS[match.status] || STATUS_LABELS.scheduled
            const modality = MODALITY_LIST.find((m) => m.id === match.modality)
            return (
              <div key={match.id} style={{
                background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 12,
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16,
                transition: 'box-shadow .15s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,.07)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
              >
                {/* Modality icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: modality?.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: modality?.color
                }}>
                  {match.modality.slice(0, 3).toUpperCase()}
                </div>

                {/* Match info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {match.home_team} <span style={{ color: '#aaa', fontWeight: 400 }}>×</span> {match.away_team}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: 12, color: '#888', alignItems: 'center' }}>
                    <span>{modality?.label}</span>
                    {match.match_date && (
                      <>
                        <span>·</span>
                        <span><Calendar size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                          {format(new Date(match.match_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </>
                    )}
                    {match.venue && <><span>·</span><span>{match.venue}</span></>}
                  </div>
                </div>

                {/* Score */}
                {(match.status === 'live' || match.status === 'finished') && (
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 700, color: '#333' }}>
                    {match.home_score} — {match.away_score}
                  </div>
                )}

                {/* Status */}
                <span style={{
                  background: statusStyle.bg, color: statusStyle.text,
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20
                }}>
                  {statusStyle.label}
                </span>

                {/* Scout button */}
                {match.status !== 'cancelled' && (
                  <button
                    onClick={() => goLive(match.id, match.status)}
                    style={{
                      background: match.status === 'live' ? '#E17055' : '#00B894',
                      color: '#fff', border: 'none', borderRadius: 8,
                      padding: '8px 14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontFamily: 'Barlow', fontSize: 12, fontWeight: 600, flexShrink: 0
                    }}
                  >
                    <Radio size={13} />
                    {match.status === 'live' ? 'Continuar' : match.status === 'finished' ? 'Ver' : 'Iniciar Scout'}
                  </button>
                )}

                {/* Concluir partida — disponível a qualquer momento (agendada ou ao vivo) */}
                {(match.status === 'scheduled' || match.status === 'live') && (
                  <button
                    onClick={() => finishMatch(match.id)}
                    title="Concluir partida"
                    style={{
                      background: '#f1f3f5', color: '#555', border: 'none', borderRadius: 8,
                      padding: '8px 10px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontFamily: 'Barlow', fontSize: 12, fontWeight: 600, flexShrink: 0
                    }}
                  >
                    <CheckCircle2 size={13} /> Concluir
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7,
  border: '0.5px solid #ddd', fontSize: 13,
  fontFamily: 'Barlow, sans-serif', boxSizing: 'border-box'
}
