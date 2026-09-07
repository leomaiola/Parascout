import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ScoutEvent, AthleteMatchStats, Match, Athlete } from './database.types'

// ─── Helpers ──────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return ''
  return format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

function fmtSec(sec: number | null): string {
  if (sec == null) return ''
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}

function styleHeader(ws: ExcelJS.Worksheet, row: number, cols: number) {
  const r = ws.getRow(row)
  r.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D1F2D' } }
  r.alignment = { vertical: 'middle', horizontal: 'center' }
  r.height = 22
  for (let c = 1; c <= cols; c++) {
    ws.getCell(row, c).border = {
      bottom: { style: 'thin', color: { argb: 'FF00B894' } }
    }
  }
}

async function saveWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Export match events ───────────────────────────────────

export async function exportMatchEvents(
  events: ScoutEvent[],
  match: Match,
  athleteMap: Record<string, string>
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'ParaScout'
  wb.created = new Date()

  // Sheet 1 — All events
  const ws1 = wb.addWorksheet('Ações da Partida')
  ws1.columns = [
    { header: 'Tempo',            key: 'time',      width: 10 },
    { header: 'Período',          key: 'period',    width: 10 },
    { header: 'Atleta',           key: 'athlete',   width: 22 },
    { header: 'Categoria',        key: 'category',  width: 14 },
    { header: 'Tipo de ação',     key: 'type',      width: 20 },
    { header: 'Arremesso',        key: 'throw',     width: 14 },
    { header: 'Direção',          key: 'direction', width: 14 },
    { header: 'Quadrante',        key: 'quadrant',  width: 12 },
    { header: 'Penalidade',       key: 'penalty',   width: 16 },
    { header: 'Resultado',        key: 'outcome',   width: 12 },
    { header: 'Pontos',           key: 'points',    width: 9  },
    { header: 'Observação',       key: 'notes',     width: 30 },
    { header: 'Registrado em',    key: 'created',   width: 18 },
  ]
  styleHeader(ws1, 1, ws1.columns.length)

  events.forEach((e, i) => {
    const row = ws1.addRow({
      time:      fmtSec(e.match_time_sec),
      period:    e.period ?? '',
      athlete:   athleteMap[e.athlete_id ?? ''] ?? 'Equipe',
      category:  e.event_category,
      type:      e.event_type,
      throw:     e.throw_type ?? '',
      direction: e.throw_direction ?? '',
      quadrant:  e.goal_quadrant ? `Q${e.goal_quadrant}` : '',
      penalty:   e.penalty_type ?? '',
      outcome:   e.outcome ?? '',
      points:    e.points_scored,
      notes:     e.notes ?? '',
      created:   fmtDate(e.created_at),
    })
    row.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: i % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFB' }
    }
  })

  // Sheet 2 — Summary by athlete
  const ws2 = wb.addWorksheet('Resumo por Atleta')
  ws2.columns = [
    { header: 'Atleta',                  key: 'name',    width: 22 },
    { header: 'Total ações',             key: 'total',   width: 13 },
    { header: 'Ataques',                 key: 'atk',     width: 10 },
    { header: 'Sucesso',                 key: 'suc',     width: 10 },
    { header: 'Eficiência (%)',          key: 'eff',     width: 14 },
    { header: 'Bloqueios',               key: 'blk',     width: 11 },
    { header: 'Gols',                    key: 'goals',   width: 8  },
    { header: 'Penalidades',             key: 'pen',     width: 13 },
    { header: 'Rasteiro',                key: 'flat',    width: 11 },
    { header: 'Quicado',                 key: 'bounce',  width: 10 },
    { header: 'Efeito',                  key: 'spin',    width: 9  },
    { header: 'Gancho',                  key: 'hook',    width: 9  },
  ]
  styleHeader(ws2, 1, ws2.columns.length)

  const byAthlete: Record<string, ScoutEvent[]> = {}
  events.forEach((e) => {
    const name = athleteMap[e.athlete_id ?? ''] ?? 'Equipe'
    if (!byAthlete[name]) byAthlete[name] = []
    byAthlete[name].push(e)
  })

  Object.entries(byAthlete).forEach(([name, evts], i) => {
    const atk = evts.filter(e => e.event_category === 'attack')
    const suc = atk.filter(e => e.outcome === 'success').length
    ws2.addRow({
      name,
      total:  evts.length,
      atk:    atk.length,
      suc,
      eff:    atk.length ? Math.round((suc / atk.length) * 100) : 0,
      blk:    evts.filter(e => e.event_category === 'defense').length,
      goals:  evts.filter(e => e.event_category === 'goal').length,
      pen:    evts.filter(e => e.event_category === 'penalty').length,
      flat:   atk.filter(e => e.throw_type === 'flat').length,
      bounce: atk.filter(e => e.throw_type === 'bounce').length,
      spin:   atk.filter(e => e.throw_type === 'spin').length,
      hook:   atk.filter(e => e.throw_type === 'hook').length,
    }).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFB' } }
  })

  // Sheet 3 — Quadrant distribution
  const ws3 = wb.addWorksheet('Quadrantes (Goalball)')
  ws3.columns = [
    { header: 'Quadrante', key: 'q',    width: 12 },
    { header: 'Ataques',   key: 'atk',  width: 10 },
    { header: 'Gols',      key: 'goal', width: 8  },
    { header: 'Bloqueios', key: 'blk',  width: 11 },
  ]
  styleHeader(ws3, 1, ws3.columns.length);
  [1,2,3,4,5,6,7].forEach((q, i) => {
    ws3.addRow({
      q:    `Q${q}`,
      atk:  events.filter(e => e.event_category === 'attack'  && e.goal_quadrant === q).length,
      goal: events.filter(e => e.event_category === 'goal'    && e.goal_quadrant === q).length,
      blk:  events.filter(e => e.event_category === 'defense' && e.goal_quadrant === q).length,
    }).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFB' } }
  })

  const filename = `ParaScout_${match.modality}_${match.home_team}vs${match.away_team}_${format(new Date(), 'yyyyMMdd')}.xlsx`
  await saveWorkbook(wb, filename)
}

// ─── Export athlete season ─────────────────────────────────

export async function exportAthleteSeasonStats(
  stats: AthleteMatchStats[],
  athlete: Athlete
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'ParaScout'

  const ws = wb.addWorksheet('Temporada')
  ws.columns = [
    { header: 'Data',              key: 'date',   width: 16 },
    { header: 'Partida',           key: 'match',  width: 26 },
    { header: 'Modalidade',        key: 'mod',    width: 16 },
    { header: 'Total ações',       key: 'total',  width: 13 },
    { header: 'Ataques',           key: 'atk',    width: 10 },
    { header: 'Sucesso',           key: 'suc',    width: 10 },
    { header: 'Eficiência (%)',    key: 'eff',    width: 14 },
    { header: 'Bloqueios',         key: 'blk',    width: 11 },
    { header: 'Bloq. sucesso',     key: 'blks',   width: 13 },
    { header: 'Gols',              key: 'goals',  width: 8  },
    { header: 'Gols sofridos',     key: 'gc',     width: 13 },
    { header: 'Penalidades',       key: 'pen',    width: 13 },
    { header: 'Avaliação (0-10)',  key: 'rating', width: 15 },
    { header: 'Observações',       key: 'notes',  width: 30 },
  ]
  styleHeader(ws, 1, ws.columns.length)

  stats.forEach((s: any, i) => {
    ws.addRow({
      date:   fmtDate(s.matches?.match_date),
      match:  `${s.matches?.home_team ?? ''} × ${s.matches?.away_team ?? ''}`,
      mod:    s.modality,
      total:  s.total_events,
      atk:    s.total_attacks,
      suc:    s.attacks_success,
      eff:    s.efficiency_pct ?? 0,
      blk:    s.total_blocks,
      blks:   s.blocks_success,
      goals:  s.goals_scored,
      gc:     s.goals_conceded,
      pen:    s.penalties_committed,
      rating: s.rating ?? '',
      notes:  s.notes ?? '',
    }).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFB' } }
  })

  await saveWorkbook(wb, `ParaScout_${athlete.full_name.replace(/ /g, '_')}_${new Date().getFullYear()}.xlsx`)
}

// ─── Export team report ────────────────────────────────────

export async function exportTeamReport(
  allStats: AthleteMatchStats[],
  athletes: Athlete[]
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'ParaScout'

  const ws = wb.addWorksheet('Equipe — Temporada')
  ws.columns = [
    { header: 'Atleta',            key: 'name',   width: 22 },
    { header: 'Partidas',          key: 'games',  width: 10 },
    { header: 'Total ataques',     key: 'atk',    width: 14 },
    { header: 'Eficiência méd. %', key: 'eff',    width: 16 },
    { header: 'Total bloqueios',   key: 'blk',    width: 15 },
    { header: 'Gols marcados',     key: 'goals',  width: 14 },
    { header: 'Gols sofridos',     key: 'gc',     width: 13 },
    { header: 'Penalidades',       key: 'pen',    width: 13 },
  ]
  styleHeader(ws, 1, ws.columns.length)

  const athleteMap = Object.fromEntries(athletes.map(a => [a.id, a.full_name]))
  const grouped: Record<string, AthleteMatchStats[]> = {}
  allStats.forEach(s => {
    const name = athleteMap[s.athlete_id] ?? s.athlete_id
    if (!grouped[name]) grouped[name] = []
    grouped[name].push(s)
  })

  Object.entries(grouped).forEach(([name, stats], i) => {
    const sum = (k: keyof AthleteMatchStats) => stats.reduce((a, s) => a + ((s[k] as number) || 0), 0)
    ws.addRow({
      name,
      games: stats.length,
      atk:   sum('total_attacks'),
      eff:   stats.length ? Math.round(sum('efficiency_pct') / stats.length) : 0,
      blk:   sum('total_blocks'),
      goals: sum('goals_scored'),
      gc:    sum('goals_conceded'),
      pen:   sum('penalties_committed'),
    }).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFB' } }
  })

  await saveWorkbook(wb, `ParaScout_Equipe_${format(new Date(), 'yyyyMM')}.xlsx`)
}

// ─── PDF export (relatório da partida) ─────────────────────

function pdfHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(13, 31, 45)
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(15)
  doc.text('ParaScout', 12, 12)
  doc.setFontSize(10)
  doc.setTextColor(0, 184, 148)
  doc.text(title, 12, 19)
  doc.setTextColor(200, 200, 200)
  doc.setFontSize(8)
  doc.text(subtitle, 12, 24)
  doc.setTextColor(0, 0, 0)
}

export function exportMatchEventsPDF(
  events: ScoutEvent[],
  match: Match,
  athleteMap: Record<string, string>
) {
  const doc = new jsPDF()
  pdfHeader(
    doc,
    `${match.home_team} ${match.home_score ?? 0} × ${match.away_score ?? 0} ${match.away_team}`,
    `Modalidade: ${match.modality} · Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`
  )

  const rows = events.map((e) => [
    fmtSec(e.match_time_sec),
    e.period ?? '',
    athleteMap[e.athlete_id ?? ''] ?? 'Equipe',
    e.event_category,
    e.event_type,
    e.outcome ?? '',
    e.goal_quadrant ? `Q${e.goal_quadrant}` : '',
    e.notes ?? '',
  ])

  autoTable(doc, {
    startY: 32,
    head: [['Tempo', 'Per.', 'Atleta', 'Categoria', 'Tipo', 'Resultado', 'Quad.', 'Obs.']],
    body: rows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [13, 31, 45], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 251] },
    columnStyles: { 7: { cellWidth: 45 } },
  })

  doc.save(`ParaScout_Partida_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`)
}

export function exportAthleteSeasonStatsPDF(stats: AthleteMatchStats[], athlete: Athlete) {
  const doc = new jsPDF()
  pdfHeader(doc, athlete.full_name, `Relatório de temporada · Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`)

  const rows = (stats as any[]).map((s) => [
    fmtDate(s.created_at ?? s.match_date ?? null),
    s.match_label ?? s.match_id ?? '',
    s.total_attacks ?? 0,
    s.goals_scored ?? 0,
    s.efficiency_pct != null ? `${s.efficiency_pct}%` : '',
  ])

  autoTable(doc, {
    startY: 32,
    head: [['Data', 'Partida', 'Ataques', 'Gols', 'Eficiência']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [13, 31, 45], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 251] },
  })

  doc.save(`ParaScout_${athlete.full_name.replace(/\s+/g, '_')}_Temporada.pdf`)
}
