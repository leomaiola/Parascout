import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  Trophy, Shield, AlertTriangle, Clock, Download,
  ChevronDown, ChevronUp, Zap, RotateCw, Minus,
  GitBranch, TrendingUp, Plus, X, Bot, Play, Pause,
  RefreshCw, ArrowUp, ArrowRight, Eye, Volume2
} from 'lucide-react'
import { useMatch, useMatchAthletes, useScoutEvents, useCreateScoutEvent } from '../hooks/useData'
import { useRealtimeMatch, useMatchTimer, formatTime } from '../hooks/useRealtime'
import { useLiveScoutStore } from '../lib/store'
import { MODALITY_METRICS } from '../constants/modalities'
import GoalballCourt from '../components/scout/GoalballCourt'
import CourtPlayers from '../components/scout/CourtPlayers'
import GenericCourtZones from '../components/scout/GenericCourtZones'
import LaneAthletes from '../components/scout/LaneAthletes'
import AIPanel from '../components/scout/AIPanel'
import EventTimeline from '../components/scout/EventTimeline'
import type { NewScoutEvent } from '../lib/database.types'

const ICON_MAP: Record<string, React.ElementType> = {
  Minus, ArrowDownUp: RotateCw, RotateCw, GitBranch, TrendingUp,
  Shield, Trophy, AlertTriangle, Clock, Zap, ArrowUp, ArrowRight, Eye, Volume2, X,
  MoveDown: ChevronDown, XCircle: X, Star: Trophy, RefreshCw,
}

const LANE_MODALITIES = ['natacao', 'remo', 'paracanoagem', 'atletismo']

function ActionIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name] || Zap
  return <Icon size={size} />
}

export default function LiveScout() {
  const { matchId } = useParams<{ matchId: string }>()
  const { data: match } = useMatch(matchId!)
  const { data: matchAthletesRaw } = useMatchAthletes(matchId!)
  const { data: events = [] } = useScoutEvents(matchId!)
  const createEvent = useCreateScoutEvent()

  useRealtimeMatch(matchId!)
  useMatchTimer()

  const {
    selectedAthlete, selectAthlete, selectedTeam, setSelectedTeam,
    timerRunning, timerSeconds, startTimer, stopTimer, resetTimer,
    currentPeriod, setPeriod, updateScore,
    match: liveMatch, setMatch,
  } = useLiveScoutStore()

  // Sync match into store
  useEffect(() => {
    if (match) setMatch(match)
  }, [match])

  const [selectedQuadrant, setSelectedQuadrant] = useState<number | null>(null)
  const [selectedThrowType, setSelectedThrowType] = useState<string | null>(null)
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null)
  const [pendingCategory, setPendingCategory] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [showAI, setShowAI] = useState(false)
  const [activeTab, setActiveTab] = useState<'actions' | 'timeline' | 'stats'>('actions')

  const currentMatch = liveMatch || match
  const modality = currentMatch?.modality || 'goalball'
  const metrics = MODALITY_METRICS[modality]

  const homeAthletes = matchAthletesRaw?.filter((ma) => ma.team === 'home').map((ma) => ({ ...(ma as any).athletes, jersey_number: (ma as any).jersey_number })) || []
  const awayAthletes = matchAthletesRaw?.filter((ma) => ma.team === 'away').map((ma) => ({ ...(ma as any).athletes, jersey_number: (ma as any).jersey_number })) || []

  // Which 3 athletes occupy court slots per team — starts with the first 3 rostered,
  // editable live via the swap control on each token (client-side only; doesn't rewrite the roster).
  const [homeOnCourt, setHomeOnCourt] = useState<any[]>([])
  const [awayOnCourt, setAwayOnCourt] = useState<any[]>([])
  // Nº de atletas simultâneos em quadra por modalidade (usado para preencher os slots iniciais)
  const SLOT_COUNT: Record<string, number> = { goalball: 3, rugby: 3, volei: 3, tenis: 1, beach_tennis: 2 }
  const slotCount = SLOT_COUNT[modality] ?? 3

  useEffect(() => {
    if (homeAthletes.length && homeOnCourt.length === 0) setHomeOnCourt(homeAthletes.slice(0, slotCount))
  }, [matchAthletesRaw, modality])
  useEffect(() => {
    if (awayAthletes.length && awayOnCourt.length === 0) setAwayOnCourt(awayAthletes.slice(0, slotCount))
  }, [matchAthletesRaw, modality])

  function swapSlot(team: 'home' | 'away', index: number, athlete: any) {
    const setter = team === 'home' ? setHomeOnCourt : setAwayOnCourt
    setter((prev) => {
      const next = [...prev]
      next[index] = athlete
      return next
    })
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === ' ') {
        e.preventDefault()
        timerRunning ? stopTimer() : startTimer()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [timerRunning])

  const logEvent = useCallback(async (eventType: string, category: string, outcome: string = 'success') => {
    if (!matchId) return
    const teamAthletes = selectedTeam === 'home' ? homeAthletes : awayAthletes

    const event: NewScoutEvent = {
      match_id: matchId,
      athlete_id: selectedAthlete?.id || null,
      modality: modality as any,
      match_time_sec: timerSeconds,
      period: currentPeriod,
      event_category: category,
      event_type: eventType,
      outcome,
      goal_quadrant: selectedQuadrant,
      throw_type: selectedThrowType,
      throw_direction: selectedDirection,
      notes: noteText || null,
      points_scored: category === 'goal' ? 1 : 0,
    }

    if (category === 'goal') {
      updateScore(selectedTeam, 1)
    }

    await createEvent.mutateAsync(event)
    setNoteText('')
    // Keep quadrant/throw type for quick consecutive entries
  }, [matchId, selectedAthlete, modality, timerSeconds, currentPeriod, selectedQuadrant, selectedThrowType, selectedDirection, noteText, selectedTeam])

  if (!currentMatch || !metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Carregando partida...
      </div>
    )
  }

  // Stats aggregation
  const totalAttacks = events.filter((e) => e.event_category === 'attack').length
  const successAttacks = events.filter((e) => e.event_category === 'attack' && e.outcome === 'success').length
  const totalBlocks = events.filter((e) => e.event_category === 'defense').length
  const totalGoals = events.filter((e) => e.event_category === 'goal').length
  const totalPenalties = events.filter((e) => e.event_category === 'penalty').length
  const efficiency = totalAttacks > 0 ? Math.round((successAttacks / totalAttacks) * 100) : 0

  return (
    <div style={{ fontFamily: 'Barlow, sans-serif' }}>
      {/* Match header */}
      <div style={{
        background: '#0D1F2D', color: '#fff', padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        borderRadius: '12px', marginBottom: 14
      }}>
        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontFamily: 'Barlow Condensed', fontWeight: 700, color: '#00B894', lineHeight: 1 }}>
              {currentMatch.home_score}
            </div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{currentMatch.home_team}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontFamily: 'Barlow Condensed', opacity: 0.4, lineHeight: 1 }}>×</div>
            {/* Timer */}
            <div style={{
              fontSize: 36, fontFamily: 'Barlow Condensed', fontWeight: 700,
              color: timerRunning ? '#00B894' : '#fff', letterSpacing: 2
            }}>
              {formatTime(timerSeconds)}
            </div>
            <div style={{ fontSize: 11, opacity: 0.5 }}>Período {currentPeriod}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontFamily: 'Barlow Condensed', fontWeight: 700, opacity: 0.5, lineHeight: 1 }}>
              {currentMatch.away_score}
            </div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{currentMatch.away_team}</div>
          </div>
        </div>

        {/* Timer controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {currentMatch.status === 'live' && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#E17055', animation: 'pulse 1.2s infinite' }}>
              ● AO VIVO
            </span>
          )}
          <button
            onClick={timerRunning ? stopTimer : startTimer}
            style={{
              background: timerRunning ? '#E17055' : '#00B894',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'Barlow', fontSize: 13, fontWeight: 600
            }}
          >
            {timerRunning ? <><Pause size={14} /> Pausar</> : <><Play size={14} /> Iniciar</>}
          </button>
          <button
            onClick={resetTimer}
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
          >
            <RefreshCw size={14} />
          </button>
          <select
            value={currentPeriod}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 7, padding: '6px 8px', fontSize: 12 }}
          >
            {['1', '2', '3', 'OT'].map((p) => (
              <option key={p} value={p} style={{ background: '#0D1F2D' }}>
                {p === 'OT' ? 'Prorrogação' : `${p}º Tempo`}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAI(!showAI)}
            style={{
              background: showAI ? 'rgba(108,92,231,0.3)' : 'rgba(255,255,255,0.1)',
              color: showAI ? '#a29bfe' : '#fff', border: 'none', borderRadius: 8,
              padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12
            }}
          >
            <Bot size={14} /> IA
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showAI ? '1fr 320px' : '1fr 300px', gap: 14 }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Court */}
          {modality === 'goalball' && (
            <div style={{ position: 'relative' }}>
              <GoalballCourt
                onZoneClick={({ quadrant, posX, posY }) => setSelectedQuadrant(quadrant)}
                events={events}
                homeTeam={currentMatch.home_team}
                awayTeam={currentMatch.away_team}
                selectedQuadrant={selectedQuadrant}
              />
              <CourtPlayers
                side="left"
                color="#00B894"
                onCourt={homeOnCourt}
                roster={homeAthletes}
                selectedAthleteId={selectedTeam === 'home' ? selectedAthlete?.id : null}
                onSelect={(a) => { setSelectedTeam("home"); selectAthlete(a as any) }}
                onSwap={(i, a) => swapSlot('home', i, a)}
              />
              <CourtPlayers
                side="right"
                color="#E17055"
                onCourt={awayOnCourt}
                roster={awayAthletes}
                selectedAthleteId={selectedTeam === 'away' ? selectedAthlete?.id : null}
                onSelect={(a) => { setSelectedTeam("away"); selectAthlete(a as any) }}
                onSwap={(i, a) => swapSlot('away', i, a)}
              />
            </div>
          )}

          {/* Team-court modalities (rugby em cadeira, vôlei sentado): mesmo padrão de
              atletas clicáveis, usando a configuração genérica de quadra da modalidade */}
          {(modality === 'rugby' || modality === 'volei' || modality === 'tenis' || modality === 'beach_tennis') && metrics && (
            <div style={{ position: 'relative' }}>
              <GenericCourtZones zones={metrics.court.zones} />
              <CourtPlayers
                side="left"
                color="#00B894"
                onCourt={homeOnCourt}
                roster={homeAthletes}
                selectedAthleteId={selectedTeam === 'home' ? selectedAthlete?.id : null}
                onSelect={(a) => { setSelectedTeam("home"); selectAthlete(a as any) }}
                onSwap={(i, a) => swapSlot('home', i, a)}
              />
              <CourtPlayers
                side="right"
                color="#E17055"
                onCourt={awayOnCourt}
                roster={awayAthletes}
                selectedAthleteId={selectedTeam === 'away' ? selectedAthlete?.id : null}
                onSelect={(a) => { setSelectedTeam("away"); selectAthlete(a as any) }}
                onSwap={(i, a) => swapSlot('away', i, a)}
              />
            </div>
          )}

          {/* Modalidades de raia/percurso (natação, remo, paracanoagem, atletismo):
              um atleta por raia, sem times — clicar seleciona para registrar a ação */}
          {LANE_MODALITIES.includes(modality) && metrics && (
            <div>
              <GenericCourtZones zones={metrics.court.zones} />
              <LaneAthletes
                athletes={homeAthletes.length ? homeAthletes : awayAthletes}
                selectedAthleteId={selectedAthlete?.id}
                onSelect={(a) => { setSelectedTeam("home"); selectAthlete(a as any) }}
              />
            </div>
          )}

          {/* Athlete selector */}
          <div style={{ background: '#fff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setSelectedTeam('home')}
                  style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: selectedTeam === 'home' ? '#00B894' : '#f1f3f5',
                    color: selectedTeam === 'home' ? '#fff' : '#666'
                  }}
                >
                  {currentMatch.home_team}
                </button>
                <button
                  onClick={() => setSelectedTeam('away')}
                  style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: selectedTeam === 'away' ? '#E17055' : '#f1f3f5',
                    color: selectedTeam === 'away' ? '#fff' : '#666'
                  }}
                >
                  {currentMatch.away_team}
                </button>
              </div>

              <div style={{ flex: 1, minWidth: 160 }}>
                <select
                  style={{ width: '100%', fontSize: 13, padding: '6px 8px', borderRadius: 7, border: '0.5px solid #ddd' }}
                  onChange={(e) => {
                    const athletes = selectedTeam === 'home' ? homeAthletes : awayAthletes
                    const athlete = athletes.find((a: any) => a?.id === e.target.value)
                    selectAthlete(athlete || null)
                  }}
                  value={selectedAthlete?.id || ''}
                >
                  <option value="">— Selecionar atleta —</option>
                  {(selectedTeam === 'home' ? homeAthletes : awayAthletes).map((a: any) => (
                    <option key={a?.id} value={a?.id}>
                      {a?.full_name} ({a?.functional_class})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick stats */}
              <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#666' }}>
                <span style={{ color: '#00B894', fontWeight: 700 }}>{totalGoals} gols</span>
                <span>{totalAttacks} ataques</span>
                <span style={{ color: '#0984E3' }}>{totalBlocks} bloq.</span>
                <span style={{ color: efficiency >= 70 ? '#00B894' : efficiency >= 50 ? '#FDCB6E' : '#E17055', fontWeight: 600 }}>
                  {efficiency}% ef.
                </span>
              </div>
            </div>
          </div>

          {/* Throw type selector (goalball) */}
          {modality === 'goalball' && (
            <div style={{ background: '#fff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 8, letterSpacing: 1 }}>TIPO DE ARREMESSO</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {metrics.throwTypes?.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setSelectedThrowType(selectedThrowType === t.value ? null : t.value)}
                    title={t.description}
                    style={{
                      padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${selectedThrowType === t.value ? '#00B894' : '#e0e0e0'}`,
                      background: selectedThrowType === t.value ? '#ecfdf5' : '#fafafa',
                      color: selectedThrowType === t.value ? '#065f46' : '#555',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s'
                    }}
                  >
                    <ActionIcon name={t.icon} size={14} />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Direction */}
              <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6, marginTop: 10, letterSpacing: 1 }}>DIREÇÃO</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['left', 'center_left', 'center', 'center_right', 'right'].map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setSelectedDirection(selectedDirection === dir ? null : dir)}
                    style={{
                      flex: 1, padding: '5px 0', borderRadius: 7, fontSize: 11, fontWeight: 600,
                      border: `1.5px solid ${selectedDirection === dir ? '#0984E3' : '#e0e0e0'}`,
                      background: selectedDirection === dir ? '#eff6ff' : '#fafafa',
                      color: selectedDirection === dir ? '#1d4ed8' : '#666',
                      cursor: 'pointer'
                    }}
                  >
                    {{ left: '← Esq', center_left: '↙ C.Esq', center: '↓ Centro', center_right: '↘ C.Dir', right: 'Dir →' }[dir]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ background: '#fff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
            {metrics.categories.map((cat) => (
              <div key={cat.id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 6, letterSpacing: 1 }}>
                  {cat.label.toUpperCase()}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 }}>
                  {cat.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => logEvent(opt.value, cat.id)}
                      disabled={createEvent.isPending}
                      style={{
                        padding: '8px 6px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: `1.5px solid`,
                        borderColor: opt.textColor.replace('text-', '').replace('-700', '-400').replace('-800', '-500'),
                        background: opt.color,
                        color: opt.textColor.replace('text-', '#').replace('-700', '').replace('-800', ''),
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        opacity: createEvent.isPending ? 0.5 : 1, transition: 'all .15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <ActionIcon name={opt.icon} size={18} />
                      {opt.label}
                      {opt.shortcut && (
                        <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 400 }}>
                          [{opt.shortcut.toUpperCase()}]
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Note field */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Observação livre... (Enter para registrar)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && noteText) {
                    logEvent('note', 'technical', 'info')
                  }
                }}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 7, border: '0.5px solid #ddd', fontSize: 13 }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {showAI ? (
            <AIPanel matchId={matchId!} events={events} match={currentMatch} metrics={metrics} />
          ) : (
            <>
              {/* Quadrant indicator */}
              {modality === 'goalball' && (
                <div style={{ background: '#fff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 8, letterSpacing: 1 }}>QUADRANTE SELECIONADO</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4, 5, 6, 7].map((q) => (
                      <button
                        key={q}
                        onClick={() => setSelectedQuadrant(selectedQuadrant === q ? null : q)}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 12, fontWeight: 700,
                          border: `1.5px solid ${selectedQuadrant === q ? '#00B894' : '#e0e0e0'}`,
                          background: selectedQuadrant === q ? '#00B894' : '#fafafa',
                          color: selectedQuadrant === q ? '#fff' : '#666', cursor: 'pointer'
                        }}
                      >
                        Q{q}
                      </button>
                    ))}
                  </div>
                  {selectedQuadrant && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#00B894', fontWeight: 600, textAlign: 'center' }}>
                      ✓ Quadrante {selectedQuadrant} selecionado
                    </div>
                  )}
                </div>
              )}

              {/* Mini stats */}
              <div style={{ background: '#fff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Stats da partida</div>
                {[
                  { label: 'Ataques', val: totalAttacks, max: 30, color: '#E17055' },
                  { label: 'Sucesso ataques', val: successAttacks, max: 30, color: '#00B894' },
                  { label: 'Bloqueios', val: totalBlocks, max: 30, color: '#0984E3' },
                  { label: 'Gols', val: totalGoals, max: 15, color: '#00B894' },
                  { label: 'Penalidades', val: totalPenalties, max: 10, color: '#FDCB6E' },
                ].map(({ label, val, max, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: '#888', width: 110, flexShrink: 0 }}>{label}</div>
                    <div style={{ flex: 1, background: '#f1f3f5', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (val / max) * 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .4s' }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, width: 24, textAlign: 'right' }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div style={{ background: '#fff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px', flex: 1, overflow: 'hidden' }}>
                <EventTimeline events={events} limit={20} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
