import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToastStore } from '../lib/store'
import type { ScoutEvent, Match, Athlete } from '../lib/database.types'
import type { ModalityMetrics } from '../constants/modalities'

interface AIAnalysisResult {
  summary: string
  insights: AIInsight[]
  recommendations: string[]
  patterns: string[]
}

interface AIInsight {
  type: 'pattern' | 'warning' | 'strength' | 'opportunity'
  title: string
  description: string
  confidence: number // 0-1
}

export function useAIAnalysis() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIAnalysisResult | null>(null)
  const { addToast } = useToastStore()

  const analyze = async ({
    events,
    match,
    athlete,
    metrics,
    reportType = 'match',
  }: {
    events: ScoutEvent[]
    match: Match
    athlete?: Athlete | null
    metrics: ModalityMetrics
    reportType?: 'match' | 'athlete' | 'opponent'
  }) => {
    setLoading(true)
    try {
      // Build context for AI
      const eventSummary = buildEventSummary(events, metrics)
      const prompt = buildPrompt({ events, match, athlete, metrics, eventSummary, reportType })

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: `Você é um analista especializado em esportes paralímpicos com foco em scout tático.
Responda APENAS em JSON válido com esta estrutura:
{
  "summary": "string — resumo geral em 2-3 frases",
  "insights": [
    { "type": "pattern|warning|strength|opportunity", "title": "string", "description": "string", "confidence": 0.0-1.0 }
  ],
  "recommendations": ["string — recomendação acionável para o treinador"],
  "patterns": ["string — padrão tático identificado"]
}
Seja preciso, use terminologia técnica do esporte e foque em dados concretos.`,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) throw new Error('Erro na API de IA')

      const data = await response.json()
      const text = data.content?.find((c: any) => c.type === 'text')?.text ?? '{}'
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed: AIAnalysisResult = JSON.parse(clean)

      setResult(parsed)

      // Persist report to Supabase
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('ai_reports').insert({
        match_id: match.id,
        athlete_id: athlete?.id ?? null,
        report_type: reportType,
        modality: match.modality as any,
        content: parsed.summary,
        insights: parsed.insights as any,
        generated_by: 'claude-sonnet-4-6',
        created_by: user?.id ?? null,
      })

      addToast('Análise IA concluída!', 'success')
      return parsed
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      addToast(`Erro na análise: ${msg}`, 'error')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { analyze, loading, result, setResult }
}

// ─── Build structured event summary for AI ────────────────

function buildEventSummary(events: ScoutEvent[], metrics: ModalityMetrics): string {
  const total = events.length
  const byCategory: Record<string, number> = {}
  const byType: Record<string, number> = {}
  const byOutcome: Record<string, number> = {}
  const throwTypes: Record<string, number> = {}
  const quadrants: Record<string, number> = {}
  const penaltyTypes: Record<string, number> = {}

  events.forEach((e) => {
    byCategory[e.event_category] = (byCategory[e.event_category] || 0) + 1
    byType[e.event_type] = (byType[e.event_type] || 0) + 1
    if (e.outcome) byOutcome[e.outcome] = (byOutcome[e.outcome] || 0) + 1
    if (e.throw_type) throwTypes[e.throw_type] = (throwTypes[e.throw_type] || 0) + 1
    if (e.goal_quadrant) quadrants[e.goal_quadrant] = (quadrants[e.goal_quadrant] || 0) + 1
    if (e.penalty_type) penaltyTypes[e.penalty_type] = (penaltyTypes[e.penalty_type] || 0) + 1
  })

  const attacks = byCategory['attack'] || 0
  const successes = events.filter((e) => e.event_category === 'attack' && e.outcome === 'success').length
  const efficiency = attacks > 0 ? Math.round((successes / attacks) * 100) : 0

  let summary = `Total de ações: ${total}\n`
  summary += `Por categoria: ${JSON.stringify(byCategory)}\n`
  summary += `Por resultado: ${JSON.stringify(byOutcome)}\n`
  summary += `Eficiência de ataque: ${efficiency}%\n`

  if (Object.keys(throwTypes).length) summary += `Tipos de arremesso: ${JSON.stringify(throwTypes)}\n`
  if (Object.keys(quadrants).length) summary += `Distribuição por quadrante (Q1-Q7): ${JSON.stringify(quadrants)}\n`
  if (Object.keys(penaltyTypes).length) summary += `Penalidades: ${JSON.stringify(penaltyTypes)}\n`

  return summary
}

function buildPrompt({
  events, match, athlete, metrics, eventSummary, reportType
}: {
  events: ScoutEvent[]
  match: Match
  athlete?: Athlete | null
  metrics: ModalityMetrics
  eventSummary: string
  reportType: string
}): string {
  const subject = athlete ? `o atleta ${athlete.full_name} (${athlete.functional_class})` : 'a equipe'

  return `Analise o desempenho de ${subject} na partida de ${metrics.label}: 
${match.home_team} vs ${match.away_team}.
Modalidade: ${metrics.label}
Período analisado: ${events.length} ações registradas

DADOS:
${eventSummary}

Tipo de análise: ${reportType === 'match' ? 'partida atual' : reportType === 'athlete' ? 'evolução do atleta' : 'análise do adversário'}.

Identifique padrões táticos, pontos fortes e pontos a melhorar. Seja específico e use os dados fornecidos.`
}
