import React, { useState } from 'react'
import { Bot, RefreshCw, TrendingUp, AlertCircle, Star, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { useAIAnalysis } from '../../hooks/useAIAnalysis'
import { useLiveScoutStore } from '../../lib/store'
import type { ScoutEvent, Match } from '../../lib/database.types'
import type { ModalityMetrics } from '../../constants/modalities'

interface AIPanelProps {
  matchId: string
  events: ScoutEvent[]
  match: Match
  metrics: ModalityMetrics
}

const INSIGHT_ICONS: Record<string, React.ElementType> = {
  pattern: TrendingUp,
  warning: AlertCircle,
  strength: Star,
  opportunity: Lightbulb,
}

const INSIGHT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pattern: { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' },
  warning: { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' },
  strength: { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7' },
  opportunity: { bg: '#faf5ff', text: '#7e22ce', border: '#c4b5fd' },
}

const SUGGESTION_PROMPTS = [
  'Qual quadrante o adversário está explorando mais?',
  'Qual atleta está com melhor eficiência nesta partida?',
  'Como está o timing de bloqueio da equipe?',
  'Quais penalidades estão sendo mais cometidas?',
  'Analise a distribuição dos arremessos por tipo.',
]

export default function AIPanel({ matchId, events, match, metrics }: AIPanelProps) {
  const { selectedAthlete } = useLiveScoutStore()
  const { analyze, loading, result } = useAIAnalysis()
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null)

  const handleAnalyze = () => {
    analyze({ events, match, athlete: selectedAthlete, metrics })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'Barlow, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1b2a 0%, #1a1a3e 100%)',
        borderRadius: 10, padding: '14px 16px', color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Bot size={18} color="#a29bfe" />
          <span style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, letterSpacing: .5 }}>
            Análise IA
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#a29bfe' }}>
            Claude Sonnet 4.6
          </span>
        </div>
        <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 10, lineHeight: 1.5 }}>
          {events.length} ações registradas •{' '}
          {selectedAthlete ? `Foco: ${selectedAthlete.full_name}` : 'Visão geral da equipe'}
        </p>
        <button
          onClick={handleAnalyze}
          disabled={loading || events.length === 0}
          style={{
            width: '100%', padding: '9px', borderRadius: 8, border: 'none',
            background: loading ? 'rgba(162,155,254,0.2)' : '#6c5ce7',
            color: '#fff', fontFamily: 'Barlow', fontSize: 13, fontWeight: 600,
            cursor: loading || events.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            opacity: events.length === 0 ? 0.5 : 1
          }}
        >
          {loading ? (
            <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analisando...</>
          ) : (
            <><Bot size={14} /> Analisar agora</>
          )}
        </button>
      </div>

      {/* Quick prompts */}
      <div style={{ background: '#fff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 8, letterSpacing: 1 }}>PERGUNTAS RÁPIDAS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {SUGGESTION_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => {
                analyze({ events, match, athlete: selectedAthlete, metrics })
              }}
              style={{
                background: '#fafafa', border: '0.5px solid #e0e0e0', borderRadius: 7,
                padding: '7px 10px', fontSize: 12, color: '#444', cursor: 'pointer',
                textAlign: 'left', lineHeight: 1.4,
                transition: 'background .15s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f4ff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fafafa')}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Summary */}
          <div style={{ background: '#fff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 8, letterSpacing: 1 }}>RESUMO</div>
            <p style={{ fontSize: 13, color: '#333', lineHeight: 1.6 }}>{result.summary}</p>
          </div>

          {/* Insights */}
          {result.insights.length > 0 && (
            <div style={{ background: '#fff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 8, letterSpacing: 1 }}>INSIGHTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.insights.map((insight, i) => {
                  const colors = INSIGHT_COLORS[insight.type] || INSIGHT_COLORS.pattern
                  const Icon = INSIGHT_ICONS[insight.type] || Lightbulb
                  const isExpanded = expandedInsight === i
                  return (
                    <div
                      key={i}
                      style={{
                        background: colors.bg, border: `1px solid ${colors.border}`,
                        borderRadius: 8, padding: '10px 12px', cursor: 'pointer'
                      }}
                      onClick={() => setExpandedInsight(isExpanded ? null : i)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon size={14} color={colors.text} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: colors.text, flex: 1 }}>
                          {insight.title}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, color: colors.text, opacity: 0.7 }}>
                            {Math.round(insight.confidence * 100)}%
                          </span>
                          {isExpanded ? <ChevronUp size={12} color={colors.text} /> : <ChevronDown size={12} color={colors.text} />}
                        </div>
                      </div>
                      {isExpanded && (
                        <p style={{ fontSize: 12, color: colors.text, marginTop: 6, opacity: 0.85, lineHeight: 1.5 }}>
                          {insight.description}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div style={{ background: '#fff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 8, letterSpacing: 1 }}>RECOMENDAÇÕES</div>
              <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.recommendations.map((rec, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#444', lineHeight: 1.5 }}>
                    <span style={{ color: '#00B894', fontWeight: 700, flexShrink: 0 }}>→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Patterns */}
          {result.patterns.length > 0 && (
            <div style={{ background: '#fff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 8, letterSpacing: 1 }}>PADRÕES DETECTADOS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {result.patterns.map((pattern, i) => (
                  <div key={i} style={{
                    background: '#f8fafc', border: '0.5px solid #e2e8f0',
                    borderLeft: '3px solid #6c5ce7', borderRadius: '0 7px 7px 0',
                    padding: '7px 10px', fontSize: 12, color: '#333', lineHeight: 1.5
                  }}>
                    {pattern}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!result && !loading && (
        <div style={{
          background: '#fff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10,
          padding: '24px 14px', textAlign: 'center', color: '#aaa', fontSize: 13
        }}>
          <Bot size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
          <p>Clique em "Analisar agora" para gerar insights táticos com IA.</p>
        </div>
      )}
    </div>
  )
}
