import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Users, Radio, BarChart2, Calendar, TrendingUp, ArrowRight, Target } from 'lucide-react'
import { useMatches, useAthletes } from '../hooks/useData'
import { MODALITY_LIST } from '../constants/modalities'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e8ecef', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 700, color: '#111', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
      <div style={{ fontSize: 12, color: '#666', width: 100, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, background: '#f1f3f5', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .5s' }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, width: 30, textAlign: 'right' }}>{value}</div>
    </div>
  )
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: '#dbeafe', text: '#1e3a8a', label: 'Agendada' },
  live:       { bg: '#fee2e2', text: '#991b1b', label: '🔴 Ao Vivo' },
  finished:   { bg: '#d1fae5', text: '#065f46', label: 'Encerrada' },
  cancelled:  { bg: '#f1f5f9', text: '#64748b', label: 'Cancelada' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: matches = [] } = useMatches()
  const { data: athletes = [] } = useAthletes()

  const liveMatches = matches.filter(m => m.status === 'live')
  const recentMatches = matches.filter(m => m.status === 'finished').slice(0, 3)
  const upcoming = matches.filter(m => m.status === 'scheduled').slice(0, 3)
  const modalitiesActive = [...new Set(athletes.map(a => a.primary_modality))].length

  return (
    <div style={{ fontFamily: 'Barlow, sans-serif' }}>
      {/* Live alert */}
      {liveMatches.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #E17055, #d63031)', color: '#fff', borderRadius: 12, padding: '12px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Radio size={18} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {liveMatches.length} partida{liveMatches.length > 1 ? 's' : ''} ao vivo agora
              </div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {liveMatches.map(m => `${m.home_team} × ${m.away_team}`).join(' · ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/partidas/${liveMatches[0].id}/scout`)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '7px 14px', color: '#fff', cursor: 'pointer', fontFamily: 'Barlow', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            Acompanhar <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        <StatCard label="Atletas cadastrados" value={athletes.length} icon={Users} color="#00B894" />
        <StatCard label="Partidas registradas" value={matches.length} icon={Trophy} color="#0984E3" />
        <StatCard label="Modalidades ativas" value={modalitiesActive} icon={Target} color="#6C5CE7" />
        <StatCard label="Partidas ao vivo" value={liveMatches.length} icon={Radio} color="#E17055" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Recent matches */}
        <div style={{ background: '#fff', border: '0.5px solid #e8ecef', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Trophy size={16} color="#00B894" /> Últimas Partidas
            </div>
            <button onClick={() => navigate('/partidas')} style={{ background: 'none', border: '0.5px solid #e0e0e0', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
              Ver todas <ArrowRight size={11} />
            </button>
          </div>
          {recentMatches.length === 0 ? (
            <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '20px 0' }}>Nenhuma partida encerrada ainda.</p>
          ) : (
            recentMatches.map(match => {
              const mod = MODALITY_LIST.find(m => m.id === match.modality)
              return (
                <div key={match.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #f4f5f7' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: (mod?.color || '#888') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: mod?.color || '#888', flexShrink: 0 }}>
                    {match.modality.slice(0, 3).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {match.home_team} × {match.away_team}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {match.match_date ? format(new Date(match.match_date), "dd/MM/yy", { locale: ptBR }) : '—'} · {mod?.label}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: 20, fontWeight: 700 }}>
                    <span style={{ color: match.home_score >= match.away_score ? '#00B894' : '#ccc' }}>{match.home_score}</span>
                    <span style={{ color: '#ccc', margin: '0 4px' }}>—</span>
                    <span style={{ color: match.away_score > match.home_score ? '#00B894' : '#ccc' }}>{match.away_score}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Upcoming */}
        <div style={{ background: '#fff', border: '0.5px solid #e8ecef', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <Calendar size={16} color="#0984E3" /> Próximas Partidas
          </div>
          {upcoming.length === 0 ? (
            <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '20px 0' }}>Sem partidas agendadas.</p>
          ) : (
            upcoming.map(match => {
              const mod = MODALITY_LIST.find(m => m.id === match.modality)
              return (
                <div key={match.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #f4f5f7' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#1d4ed8', flexShrink: 0 }}>
                    {match.modality.slice(0, 3).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{match.home_team} × {match.away_team}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {match.match_date ? format(new Date(match.match_date), "dd/MM/yy 'às' HH:mm", { locale: ptBR }) : 'Data não definida'}
                      {match.venue ? ` · ${match.venue}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/partidas/${match.id}/scout`)}
                    style={{ background: '#00B894', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#fff', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Radio size={11} /> Scout
                  </button>
                </div>
              )
            })
          )}
          <button onClick={() => navigate('/partidas')} style={{ width: '100%', marginTop: 10, background: '#f8fafb', border: '0.5px dashed #ccc', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            + Nova partida
          </button>
        </div>

        {/* Modalities */}
        <div style={{ background: '#fff', border: '0.5px solid #e8ecef', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <Target size={16} color="#6C5CE7" /> Modalidades Monitoradas
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {MODALITY_LIST.map(mod => {
              const count = athletes.filter(a => a.primary_modality === mod.id).length
              return (
                <div key={mod.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  borderRadius: 20, background: count > 0 ? mod.color + '15' : '#f8fafb',
                  border: `1px solid ${count > 0 ? mod.color + '50' : '#e0e0e0'}`,
                  fontSize: 12, fontWeight: 600, color: count > 0 ? mod.color : '#aaa',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/atletas')}
                >
                  {mod.label}
                  {count > 0 && <span style={{ background: mod.color, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>{count}</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Athletes by modality */}
        <div style={{ background: '#fff', border: '0.5px solid #e8ecef', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
              <TrendingUp size={16} color="#E17055" /> Atletas por Modalidade
            </div>
            <button onClick={() => navigate('/atletas')} style={{ background: 'none', border: '0.5px solid #e0e0e0', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
              Gerenciar <ArrowRight size={11} />
            </button>
          </div>
          {athletes.length === 0 ? (
            <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '20px 0' }}>
              Nenhum atleta cadastrado.
              <button onClick={() => navigate('/atletas')} style={{ display: 'block', margin: '8px auto 0', background: '#00B894', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}>
                Cadastrar agora
              </button>
            </p>
          ) : (
            MODALITY_LIST.map(mod => {
              const count = athletes.filter(a => a.primary_modality === mod.id).length
              if (count === 0) return null
              return <Bar key={mod.id} label={mod.label} value={count} max={athletes.length} color={mod.color} />
            })
          )}
        </div>
      </div>
    </div>
  )
}
