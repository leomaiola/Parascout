// ============================================================
// PARASCOUT — Sport Modality Metrics & Event Definitions
// ============================================================

export type EventOutcome = 'success' | 'fail' | 'partial' | 'out' | 'foul' | 'committed'

export interface EventOption {
  value: string
  label: string
  color: string        // tailwind bg color
  textColor: string    // tailwind text color
  icon: string         // lucide icon name
  shortcut?: string    // keyboard shortcut
}

export interface EventCategory {
  id: string
  label: string
  color: string
  options: EventOption[]
}

export interface ModalityMetrics {
  id: string
  label: string
  icon: string
  color: string
  description: string
  categories: EventCategory[]
  court: CourtConfig
  throwTypes?: ThrowOption[]
  quadrants?: QuadrantConfig
  penaltyTypes?: EventOption[]
  additionalFields?: AdditionalField[]
}

export interface ThrowOption {
  value: string
  label: string
  description: string
  icon: string
}

export interface QuadrantConfig {
  count: number
  layout: 'goalball' | 'volleyball' | 'rugby' | 'generic'
  labels: string[]
}

export interface CourtConfig {
  type: 'goalball' | 'pool' | 'water' | 'track' | 'volleyball' | 'rugby' | 'canoe' | 'rowing'
  aspectRatio: number   // width/height
  zones: CourtZone[]
}

export interface CourtZone {
  id: string
  label: string
  x: number    // 0-100 normalized
  y: number
  w: number
  h: number
  team?: 'home' | 'away' | 'neutral'
}

export interface AdditionalField {
  key: string
  label: string
  type: 'select' | 'number' | 'boolean' | 'text'
  options?: { value: string; label: string }[]
  unit?: string
}

// ============================================================
// GOALBALL
// ============================================================

export const GOALBALL_METRICS: ModalityMetrics = {
  id: 'goalball',
  label: 'Goalball',
  icon: 'Target',
  color: '#00B894',
  description: 'Esporte paralímpico para atletas com deficiência visual (B1/B2/B3)',
  court: {
    type: 'goalball',
    aspectRatio: 18 / 9,
    zones: [
      { id: 'home_def', label: 'Defesa BRA', x: 0, y: 0, w: 33, h: 100, team: 'home' },
      { id: 'center', label: 'Centro', x: 33, y: 0, w: 34, h: 100, team: 'neutral' },
      { id: 'away_def', label: 'Defesa ADV', x: 67, y: 0, w: 33, h: 100, team: 'away' },
    ]
  },
  // 7 quadrants across the goal line (used for attack target + block position)
  quadrants: {
    count: 7,
    layout: 'goalball',
    labels: ['Q1\nCanto Esq.', 'Q2\nMeio Esq.', 'Q3\nCentro Esq.', 'Q4\nCentro', 'Q5\nCentro Dir.', 'Q6\nMeio Dir.', 'Q7\nCanto Dir.']
  },
  throwTypes: [
    { value: 'flat', label: 'Rasteiro', description: 'Arremesso rente ao chão', icon: 'Minus' },
    { value: 'bounce', label: 'Quicado', description: 'Arremesso com quique antes da linha de equipe', icon: 'ArrowDownUp' },
    { value: 'spin', label: 'Efeito', description: 'Arremesso com rotação lateral', icon: 'RotateCw' },
    { value: 'hook', label: 'Gancho', description: 'Arremesso curvado com efeito de gancho', icon: 'GitBranch' },
    { value: 'lob', label: 'Lob', description: 'Arremesso em parábola alta', icon: 'TrendingUp' },
    { value: 'penalty', label: 'Penalidade', description: 'Arremesso de penalidade (1 atleta vs gol)', icon: 'AlertTriangle' },
  ],
  penaltyTypes: [
    { value: 'high_ball', label: 'High Ball', color: 'bg-yellow-100', textColor: 'text-yellow-800', icon: 'ArrowUp' },
    { value: 'long_ball', label: 'Long Ball', color: 'bg-orange-100', textColor: 'text-orange-800', icon: 'ArrowRight' },
    { value: 'short_ball', label: 'Short Ball', color: 'bg-amber-100', textColor: 'text-amber-800', icon: 'Minus' },
    { value: 'noise', label: 'Barulho', color: 'bg-red-100', textColor: 'text-red-800', icon: 'Volume2' },
    { value: 'eye_shade', label: 'Venda', color: 'bg-purple-100', textColor: 'text-purple-800', icon: 'Eye' },
    { value: 'ball_contact', label: 'Contato ilegal', color: 'bg-red-100', textColor: 'text-red-800', icon: 'X' },
    { value: 'delay', label: 'Demora', color: 'bg-gray-100', textColor: 'text-gray-700', icon: 'Clock' },
  ],
  categories: [
    {
      id: 'attack',
      label: 'Ataque',
      color: 'bg-red-50 border-red-400 text-red-700',
      options: [
        { value: 'attack_flat', label: 'Rasteiro', color: 'bg-red-50', textColor: 'text-red-700', icon: 'Minus', shortcut: 'q' },
        { value: 'attack_bounce', label: 'Quicado', color: 'bg-orange-50', textColor: 'text-orange-700', icon: 'ArrowDownUp', shortcut: 'w' },
        { value: 'attack_spin', label: 'Efeito', color: 'bg-rose-50', textColor: 'text-rose-700', icon: 'RotateCw', shortcut: 'e' },
        { value: 'attack_hook', label: 'Gancho', color: 'bg-pink-50', textColor: 'text-pink-700', icon: 'GitBranch', shortcut: 'r' },
        { value: 'attack_lob', label: 'Lob', color: 'bg-red-50', textColor: 'text-red-700', icon: 'TrendingUp', shortcut: 't' },
      ]
    },
    {
      id: 'defense',
      label: 'Defesa / Bloqueio',
      color: 'bg-blue-50 border-blue-400 text-blue-700',
      options: [
        { value: 'block_body', label: 'Corpo', color: 'bg-blue-50', textColor: 'text-blue-700', icon: 'Shield', shortcut: 'a' },
        { value: 'block_knee', label: 'Joelho', color: 'bg-sky-50', textColor: 'text-sky-700', icon: 'Shield', shortcut: 's' },
        { value: 'block_feet', label: 'Pé', color: 'bg-indigo-50', textColor: 'text-indigo-700', icon: 'Shield', shortcut: 'd' },
        { value: 'block_dive', label: 'Mergulho', color: 'bg-violet-50', textColor: 'text-violet-700', icon: 'MoveDown', shortcut: 'f' },
        { value: 'goal_conceded', label: 'Gol sofrido', color: 'bg-red-100', textColor: 'text-red-800', icon: 'XCircle', shortcut: 'g' },
      ]
    },
    {
      id: 'goal',
      label: 'Gol Marcado',
      color: 'bg-green-50 border-green-400 text-green-700',
      options: [
        { value: 'goal_scored', label: 'Gol!', color: 'bg-green-50', textColor: 'text-green-700', icon: 'Trophy', shortcut: 'z' },
        { value: 'penalty_goal', label: 'Gol de Penalidade', color: 'bg-emerald-50', textColor: 'text-emerald-700', icon: 'Star', shortcut: 'x' },
      ]
    },
    {
      id: 'penalty',
      label: 'Penalidade',
      color: 'bg-yellow-50 border-yellow-400 text-yellow-700',
      options: [
        { value: 'penalty_high_ball', label: 'High Ball', color: 'bg-yellow-50', textColor: 'text-yellow-700', icon: 'ArrowUp' },
        { value: 'penalty_long_ball', label: 'Long Ball', color: 'bg-amber-50', textColor: 'text-amber-700', icon: 'ArrowRight' },
        { value: 'penalty_short_ball', label: 'Short Ball', color: 'bg-orange-50', textColor: 'text-orange-700', icon: 'Minus' },
        { value: 'penalty_noise', label: 'Barulho', color: 'bg-red-50', textColor: 'text-red-700', icon: 'Volume2' },
        { value: 'penalty_eye_shade', label: 'Venda', color: 'bg-purple-50', textColor: 'text-purple-700', icon: 'Eye' },
        { value: 'penalty_delay', label: 'Demora', color: 'bg-gray-100', textColor: 'text-gray-700', icon: 'Clock' },
      ]
    },
    {
      id: 'technical',
      label: 'Técnico',
      color: 'bg-gray-50 border-gray-300 text-gray-600',
      options: [
        { value: 'ball_out', label: 'Fora', color: 'bg-gray-100', textColor: 'text-gray-600', icon: 'XSquare' },
        { value: 'timeout', label: 'Tempo', color: 'bg-gray-100', textColor: 'text-gray-600', icon: 'Clock' },
      ]
    }
  ],
  additionalFields: [
    { key: 'throw_direction', label: 'Direção', type: 'select', options: [
      { value: 'left', label: 'Esquerda' }, { value: 'center_left', label: 'Centro Esq.' },
      { value: 'center', label: 'Centro' }, { value: 'center_right', label: 'Centro Dir.' },
      { value: 'right', label: 'Direita' }
    ]},
    { key: 'goal_quadrant', label: 'Quadrante', type: 'select', options: [
      { value: '1', label: 'Q1' },{ value: '2', label: 'Q2' },{ value: '3', label: 'Q3' },
      { value: '4', label: 'Q4' },{ value: '5', label: 'Q5' },{ value: '6', label: 'Q6' },
      { value: '7', label: 'Q7' }
    ]}
  ]
}

// ============================================================
// RUGBY PARALÍMPICO (cadeira de rodas)
// ============================================================

export const RUGBY_METRICS: ModalityMetrics = {
  id: 'rugby',
  label: 'Rugby Paralímpico',
  icon: 'Swords',
  color: '#E17055',
  description: 'Rugby em cadeira de rodas (classes 0.5 a 3.5)',
  court: {
    type: 'rugby',
    aspectRatio: 28 / 15,
    zones: [
      { id: 'home_key', label: 'Área BRA', x: 0, y: 0, w: 20, h: 100, team: 'home' },
      { id: 'center', label: 'Centro', x: 20, y: 0, w: 60, h: 100, team: 'neutral' },
      { id: 'away_key', label: 'Área ADV', x: 80, y: 0, w: 20, h: 100, team: 'away' },
    ]
  },
  quadrants: {
    count: 8,
    layout: 'rugby',
    labels: ['T1','T2','T3','T4','T5','T6','T7','T8']
  },
  categories: [
    {
      id: 'offense',
      label: 'Ataque',
      color: 'bg-red-50 border-red-400 text-red-700',
      options: [
        { value: 'try', label: 'Try', color: 'bg-green-50', textColor: 'text-green-700', icon: 'Trophy', shortcut: 'q' },
        { value: 'carry', label: 'Condução', color: 'bg-red-50', textColor: 'text-red-700', icon: 'MoveRight', shortcut: 'w' },
        { value: 'pass_lateral', label: 'Passe Lateral', color: 'bg-orange-50', textColor: 'text-orange-700', icon: 'ArrowRight', shortcut: 'e' },
        { value: 'pass_back', label: 'Passe Atrás', color: 'bg-amber-50', textColor: 'text-amber-700', icon: 'ArrowLeft', shortcut: 'r' },
        { value: 'screen', label: 'Barreira', color: 'bg-rose-50', textColor: 'text-rose-700', icon: 'Shield', shortcut: 't' },
        { value: 'turnover_lost', label: 'Turnover (perd.)', color: 'bg-red-100', textColor: 'text-red-800', icon: 'RefreshCw' },
      ]
    },
    {
      id: 'defense',
      label: 'Defesa',
      color: 'bg-blue-50 border-blue-400 text-blue-700',
      options: [
        { value: 'tackle_success', label: 'Tackle Sucesso', color: 'bg-blue-50', textColor: 'text-blue-700', icon: 'Shield', shortcut: 'a' },
        { value: 'tackle_miss', label: 'Tackle Falho', color: 'bg-sky-50', textColor: 'text-sky-700', icon: 'X', shortcut: 's' },
        { value: 'turnover_won', label: 'Turnover (ganho)', color: 'bg-indigo-50', textColor: 'text-indigo-700', icon: 'RefreshCw', shortcut: 'd' },
        { value: 'try_conceded', label: 'Try sofrido', color: 'bg-red-100', textColor: 'text-red-800', icon: 'XCircle', shortcut: 'f' },
        { value: 'block_entry', label: 'Bloqueio zona', color: 'bg-violet-50', textColor: 'text-violet-700', icon: 'Lock', shortcut: 'g' },
      ]
    },
    {
      id: 'penalty',
      label: 'Penalidade',
      color: 'bg-yellow-50 border-yellow-400 text-yellow-700',
      options: [
        { value: 'foul_charging', label: 'Carga ilegal', color: 'bg-yellow-50', textColor: 'text-yellow-700', icon: 'AlertTriangle' },
        { value: 'foul_obstruction', label: 'Obstrução', color: 'bg-amber-50', textColor: 'text-amber-700', icon: 'AlertCircle' },
        { value: 'foul_spinning', label: 'Giro ilegal', color: 'bg-orange-50', textColor: 'text-orange-700', icon: 'RotateCw' },
        { value: 'yellow_card', label: 'Cartão amarelo', color: 'bg-yellow-100', textColor: 'text-yellow-800', icon: 'CreditCard' },
      ]
    },
    {
      id: 'technical',
      label: 'Técnico / Jogo',
      color: 'bg-gray-50 border-gray-300 text-gray-600',
      options: [
        { value: 'inbound', label: 'Lateral', color: 'bg-gray-100', textColor: 'text-gray-600', icon: 'ArrowDown' },
        { value: 'timeout', label: 'Tempo', color: 'bg-gray-100', textColor: 'text-gray-600', icon: 'Clock' },
        { value: 'substitution', label: 'Substituição', color: 'bg-gray-100', textColor: 'text-gray-600', icon: 'RefreshCw' },
      ]
    }
  ],
  additionalFields: [
    { key: 'try_zone', label: 'Zona do Try', type: 'select', options: [
      {value:'left',label:'Esquerda'},{value:'center',label:'Centro'},{value:'right',label:'Direita'}
    ]},
    { key: 'player_class', label: 'Classe do atleta', type: 'select', options: [
      {value:'0.5',label:'0.5'},{value:'1.0',label:'1.0'},{value:'1.5',label:'1.5'},
      {value:'2.0',label:'2.0'},{value:'2.5',label:'2.5'},{value:'3.0',label:'3.0'},{value:'3.5',label:'3.5'}
    ]}
  ]
}

// ============================================================
// NATAÇÃO PARALÍMPICA
// ============================================================

export const NATACAO_METRICS: ModalityMetrics = {
  id: 'natacao',
  label: 'Natação Paralímpica',
  icon: 'Waves',
  color: '#0984E3',
  description: 'Natação paralímpica (classes S1-S14, SB, SM)',
  court: {
    type: 'pool',
    aspectRatio: 50 / 25,
    zones: [
      { id: 'start', label: 'Largada', x: 0, y: 0, w: 5, h: 100, team: 'home' },
      { id: 'lanes', label: 'Raias', x: 5, y: 0, w: 90, h: 100, team: 'neutral' },
      { id: 'finish', label: 'Chegada', x: 95, y: 0, w: 5, h: 100, team: 'away' },
    ]
  },
  categories: [
    {
      id: 'performance',
      label: 'Performance',
      color: 'bg-blue-50 border-blue-400 text-blue-700',
      options: [
        { value: 'split_time', label: 'Split (parcial)', color: 'bg-blue-50', textColor: 'text-blue-700', icon: 'Timer', shortcut: 'q' },
        { value: 'turn', label: 'Virada', color: 'bg-sky-50', textColor: 'text-sky-700', icon: 'RefreshCw', shortcut: 'w' },
        { value: 'finish', label: 'Chegada', color: 'bg-indigo-50', textColor: 'text-indigo-700', icon: 'Flag', shortcut: 'e' },
        { value: 'reaction_time', label: 'T. Reação', color: 'bg-violet-50', textColor: 'text-violet-700', icon: 'Zap', shortcut: 'r' },
      ]
    },
    {
      id: 'technique',
      label: 'Técnica',
      color: 'bg-cyan-50 border-cyan-400 text-cyan-700',
      options: [
        { value: 'stroke_freestyle', label: 'Crawl', color: 'bg-cyan-50', textColor: 'text-cyan-700', icon: 'Waves', shortcut: 'a' },
        { value: 'stroke_butterfly', label: 'Borboleta', color: 'bg-blue-50', textColor: 'text-blue-700', icon: 'Wind', shortcut: 's' },
        { value: 'stroke_backstroke', label: 'Costas', color: 'bg-teal-50', textColor: 'text-teal-700', icon: 'ArrowLeft', shortcut: 'd' },
        { value: 'stroke_breaststroke', label: 'Peito', color: 'bg-emerald-50', textColor: 'text-emerald-700', icon: 'MoveHorizontal', shortcut: 'f' },
        { value: 'technique_error', label: 'Erro técnico', color: 'bg-red-50', textColor: 'text-red-700', icon: 'AlertTriangle', shortcut: 'g' },
      ]
    },
    {
      id: 'infraction',
      label: 'Infração',
      color: 'bg-red-50 border-red-400 text-red-700',
      options: [
        { value: 'dq_false_start', label: 'Saída falsa', color: 'bg-red-100', textColor: 'text-red-800', icon: 'AlertOctagon' },
        { value: 'dq_stroke', label: 'Irregular (nado)', color: 'bg-red-100', textColor: 'text-red-800', icon: 'X' },
        { value: 'dq_turn', label: 'Irregular (virada)', color: 'bg-red-100', textColor: 'text-red-800', icon: 'X' },
      ]
    }
  ],
  additionalFields: [
    { key: 'split_time_sec', label: 'Tempo parcial (s)', type: 'number', unit: 's' },
    { key: 'reaction_time_sec', label: 'T. Reação (s)', type: 'number', unit: 's' },
    { key: 'stroke_rate', label: 'Braçadas/min', type: 'number', unit: 'br/min' },
    { key: 'stroke_type', label: 'Estilo', type: 'select', options: [
      {value:'freestyle',label:'Crawl'},{value:'butterfly',label:'Borboleta'},
      {value:'backstroke',label:'Costas'},{value:'breaststroke',label:'Peito'},{value:'medley',label:'Medley'}
    ]},
    { key: 'lane', label: 'Raia', type: 'number' },
  ]
}

// ============================================================
// VOLEI SENTADO
// ============================================================

export const VOLEI_METRICS: ModalityMetrics = {
  id: 'volei',
  label: 'Vôlei Paralímpico',
  icon: 'Circle',
  color: '#6C5CE7',
  description: 'Vôlei sentado — atletas com amputação ou deficiência física',
  court: {
    type: 'volleyball',
    aspectRatio: 10 / 6,
    zones: [
      { id: 'z1', label: 'Zona 1', x: 66, y: 66, w: 34, h: 34, team: 'home' },
      { id: 'z2', label: 'Zona 2', x: 66, y: 33, w: 34, h: 33, team: 'home' },
      { id: 'z3', label: 'Zona 3', x: 66, y: 0, w: 34, h: 33, team: 'home' },
      { id: 'z4', label: 'Zona 4', x: 33, y: 0, w: 33, h: 33, team: 'home' },
      { id: 'z5', label: 'Zona 5', x: 33, y: 33, w: 33, h: 33, team: 'home' },
      { id: 'z6', label: 'Zona 6', x: 33, y: 66, w: 33, h: 34, team: 'home' },
      { id: 'adv', label: 'Adversário', x: 0, y: 0, w: 33, h: 100, team: 'away' },
    ]
  },
  quadrants: {
    count: 6,
    layout: 'volleyball',
    labels: ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6']
  },
  categories: [
    {
      id: 'attack',
      label: 'Ataque',
      color: 'bg-purple-50 border-purple-400 text-purple-700',
      options: [
        { value: 'spike_power', label: 'Cortada', color: 'bg-purple-50', textColor: 'text-purple-700', icon: 'Zap', shortcut: 'q' },
        { value: 'spike_tip', label: 'Ponta (toque)', color: 'bg-violet-50', textColor: 'text-violet-700', icon: 'ArrowDown', shortcut: 'w' },
        { value: 'serve_jump', label: 'Saque Jump', color: 'bg-indigo-50', textColor: 'text-indigo-700', icon: 'TrendingUp', shortcut: 'e' },
        { value: 'serve_float', label: 'Saque Float', color: 'bg-blue-50', textColor: 'text-blue-700', icon: 'Wind', shortcut: 'r' },
        { value: 'serve_short', label: 'Saque Curto', color: 'bg-sky-50', textColor: 'text-sky-700', icon: 'Minus', shortcut: 't' },
      ]
    },
    {
      id: 'defense',
      label: 'Defesa',
      color: 'bg-blue-50 border-blue-400 text-blue-700',
      options: [
        { value: 'block_single', label: 'Bloqueio (1)', color: 'bg-blue-50', textColor: 'text-blue-700', icon: 'Shield', shortcut: 'a' },
        { value: 'block_double', label: 'Bloqueio (2)', color: 'bg-indigo-50', textColor: 'text-indigo-700', icon: 'Layers', shortcut: 's' },
        { value: 'dig', label: 'Toque de Defesa', color: 'bg-sky-50', textColor: 'text-sky-700', icon: 'Hand', shortcut: 'd' },
        { value: 'reception', label: 'Recepção', color: 'bg-teal-50', textColor: 'text-teal-700', icon: 'ArrowDown', shortcut: 'f' },
      ]
    },
    {
      id: 'set',
      label: 'Levantamento',
      color: 'bg-green-50 border-green-400 text-green-700',
      options: [
        { value: 'set_high', label: 'Levantamento alto', color: 'bg-green-50', textColor: 'text-green-700', icon: 'ArrowUp', shortcut: 'z' },
        { value: 'set_quick', label: 'Bola rápida', color: 'bg-emerald-50', textColor: 'text-emerald-700', icon: 'Zap', shortcut: 'x' },
        { value: 'set_back', label: 'Bola atrás', color: 'bg-teal-50', textColor: 'text-teal-700', icon: 'ArrowLeft', shortcut: 'c' },
      ]
    },
    {
      id: 'error',
      label: 'Erros / Infração',
      color: 'bg-red-50 border-red-400 text-red-700',
      options: [
        { value: 'error_net', label: 'Na rede', color: 'bg-red-100', textColor: 'text-red-800', icon: 'XSquare' },
        { value: 'error_out', label: 'Fora', color: 'bg-red-50', textColor: 'text-red-700', icon: 'XCircle' },
        { value: 'error_lift', label: 'Condução', color: 'bg-orange-50', textColor: 'text-orange-700', icon: 'Hand' },
        { value: 'foul_hand', label: 'Levanta da rede', color: 'bg-yellow-50', textColor: 'text-yellow-700', icon: 'AlertTriangle' },
        { value: 'foul_serve', label: 'Erro saque', color: 'bg-red-50', textColor: 'text-red-700', icon: 'X' },
      ]
    }
  ],
  additionalFields: [
    { key: 'spike_zone', label: 'Zona de Ataque', type: 'select', options: [
      {value:'1',label:'Z1'},{value:'2',label:'Z2'},{value:'3',label:'Z3'},
      {value:'4',label:'Z4'},{value:'5',label:'Z5'},{value:'6',label:'Z6'}
    ]},
    { key: 'target_zone', label: 'Zona alvo', type: 'select', options: [
      {value:'1',label:'Z1'},{value:'2',label:'Z2'},{value:'3',label:'Z3'},
      {value:'4',label:'Z4'},{value:'5',label:'Z5'},{value:'6',label:'Z6'}
    ]}
  ]
}

// ============================================================
// PARACANOAGEM
// ============================================================

export const PARACANOAGEM_METRICS: ModalityMetrics = {
  id: 'paracanoagem',
  label: 'Paracanoagem',
  icon: 'Anchor',
  color: '#00CEC9',
  description: 'Canoagem paralímpica — Kayak (KL) e Va\'a (VL)',
  court: {
    type: 'canoe',
    aspectRatio: 200 / 9,
    zones: [
      { id: 'start', label: 'Largada', x: 0, y: 0, w: 5, h: 100 },
      { id: 'course', label: 'Percurso', x: 5, y: 0, w: 90, h: 100 },
      { id: 'finish', label: 'Chegada', x: 95, y: 0, w: 5, h: 100 },
    ]
  },
  categories: [
    {
      id: 'performance',
      label: 'Performance',
      color: 'bg-teal-50 border-teal-400 text-teal-700',
      options: [
        { value: 'split_200m', label: 'Parcial 200m', color: 'bg-teal-50', textColor: 'text-teal-700', icon: 'Timer', shortcut: 'q' },
        { value: 'split_500m', label: 'Parcial 500m', color: 'bg-cyan-50', textColor: 'text-cyan-700', icon: 'Timer', shortcut: 'w' },
        { value: 'start_power', label: 'Saída explosiva', color: 'bg-emerald-50', textColor: 'text-emerald-700', icon: 'Zap', shortcut: 'e' },
        { value: 'finish_sprint', label: 'Sprint final', color: 'bg-green-50', textColor: 'text-green-700', icon: 'TrendingUp', shortcut: 'r' },
      ]
    },
    {
      id: 'technique',
      label: 'Técnica',
      color: 'bg-cyan-50 border-cyan-400 text-cyan-700',
      options: [
        { value: 'stroke_efficient', label: 'Remada eficiente', color: 'bg-cyan-50', textColor: 'text-cyan-700', icon: 'CheckCircle', shortcut: 'a' },
        { value: 'stroke_weak', label: 'Remada fraca', color: 'bg-sky-50', textColor: 'text-sky-700', icon: 'ArrowDown', shortcut: 's' },
        { value: 'balance_issue', label: 'Desequilíbrio', color: 'bg-orange-50', textColor: 'text-orange-700', icon: 'AlertTriangle', shortcut: 'd' },
        { value: 'turn_technique', label: 'Técnica de curva', color: 'bg-blue-50', textColor: 'text-blue-700', icon: 'RotateCcw', shortcut: 'f' },
        { value: 'pacing', label: 'Gestão de ritmo', color: 'bg-indigo-50', textColor: 'text-indigo-700', icon: 'Activity', shortcut: 'g' },
      ]
    },
    {
      id: 'tactical',
      label: 'Tático',
      color: 'bg-blue-50 border-blue-400 text-blue-700',
      options: [
        { value: 'lane_position', label: 'Posição de raia', color: 'bg-blue-50', textColor: 'text-blue-700', icon: 'Navigation' },
        { value: 'draft_position', label: 'Sombra (draft)', color: 'bg-indigo-50', textColor: 'text-indigo-700', icon: 'Wind' },
        { value: 'pass_opponent', label: 'Ultrapassagem', color: 'bg-violet-50', textColor: 'text-violet-700', icon: 'ChevronsRight' },
      ]
    }
  ],
  additionalFields: [
    { key: 'split_time_sec', label: 'Tempo parcial (s)', type: 'number', unit: 's' },
    { key: 'stroke_rate', label: 'Remadas/min', type: 'number', unit: 'rem/min' },
    { key: 'boat_class', label: 'Classe', type: 'select', options: [
      {value:'KL1',label:'Kayak KL1'},{value:'KL2',label:'Kayak KL2'},{value:'KL3',label:'Kayak KL3'},
      {value:'VL1',label:"Va'a VL1"},{value:'VL2',label:"Va'a VL2"},{value:'VL3',label:"Va'a VL3"}
    ]},
    { key: 'distance_m', label: 'Distância', type: 'select', options: [
      {value:'200',label:'200m'},{value:'500',label:'500m'},{value:'1000',label:'1000m'}
    ]}
  ]
}

// ============================================================
// REMO PARALÍMPICO
// ============================================================

export const REMO_METRICS: ModalityMetrics = {
  id: 'remo',
  label: 'Remo Paralímpico',
  icon: 'Wind',
  color: '#2D3436',
  description: 'Remo paralímpico — classes PR1, PR2, PR3',
  court: {
    type: 'rowing',
    aspectRatio: 200 / 13.5,
    zones: [
      { id: 'start', label: 'Largada', x: 0, y: 0, w: 5, h: 100 },
      { id: 'course', label: '2000m', x: 5, y: 0, w: 90, h: 100 },
      { id: 'finish', label: 'Chegada', x: 95, y: 0, w: 5, h: 100 },
    ]
  },
  categories: [
    {
      id: 'performance',
      label: 'Performance',
      color: 'bg-slate-50 border-slate-400 text-slate-700',
      options: [
        { value: 'split_500m', label: 'Parcial 500m', color: 'bg-slate-50', textColor: 'text-slate-700', icon: 'Timer', shortcut: 'q' },
        { value: 'start_sequence', label: 'Saída', color: 'bg-gray-50', textColor: 'text-gray-700', icon: 'Play', shortcut: 'w' },
        { value: 'sprint_final', label: 'Sprint final', color: 'bg-zinc-50', textColor: 'text-zinc-700', icon: 'TrendingUp', shortcut: 'e' },
      ]
    },
    {
      id: 'technique',
      label: 'Técnica',
      color: 'bg-blue-50 border-blue-400 text-blue-700',
      options: [
        { value: 'catch_clean', label: 'Entrada limpa', color: 'bg-blue-50', textColor: 'text-blue-700', icon: 'CheckCircle', shortcut: 'a' },
        { value: 'catch_splash', label: 'Entrada com splash', color: 'bg-sky-50', textColor: 'text-sky-700', icon: 'Droplets', shortcut: 's' },
        { value: 'drive_power', label: 'Drive potente', color: 'bg-indigo-50', textColor: 'text-indigo-700', icon: 'Zap', shortcut: 'd' },
        { value: 'finish_clean', label: 'Saída de remo OK', color: 'bg-teal-50', textColor: 'text-teal-700', icon: 'CheckSquare', shortcut: 'f' },
        { value: 'rush_slide', label: 'Rush no slide', color: 'bg-orange-50', textColor: 'text-orange-700', icon: 'AlertTriangle', shortcut: 'g' },
        { value: 'wash_out', label: 'Wash out', color: 'bg-red-50', textColor: 'text-red-700', icon: 'XCircle', shortcut: 'h' },
      ]
    },
    {
      id: 'tactical',
      label: 'Tático',
      color: 'bg-green-50 border-green-400 text-green-700',
      options: [
        { value: 'rating_change', label: 'Mudança cadência', color: 'bg-green-50', textColor: 'text-green-700', icon: 'Activity' },
        { value: 'steering', label: 'Ajuste direção', color: 'bg-emerald-50', textColor: 'text-emerald-700', icon: 'Navigation' },
        { value: 'lead_position', label: 'Liderança', color: 'bg-teal-50', textColor: 'text-teal-700', icon: 'Star' },
        { value: 'crab', label: 'Caranguejo', color: 'bg-red-100', textColor: 'text-red-800', icon: 'X' },
      ]
    }
  ],
  additionalFields: [
    { key: 'split_time_sec', label: 'Pace 500m (s)', type: 'number', unit: 's' },
    { key: 'stroke_rate', label: 'Remadas/min', type: 'number', unit: 'spm' },
    { key: 'boat_class', label: 'Classe', type: 'select', options: [
      {value:'PR1M1x',label:'PR1 M1x'},{value:'PR1W1x',label:'PR1 W1x'},
      {value:'PR2Mix2x',label:'PR2 Mix 2x'},{value:'PR3Mix4+',label:'PR3 Mix 4+'}
    ]},
  ]
}

// ============================================================
// ATLETISMO PARALÍMPICO
// ============================================================

export const ATLETISMO_METRICS: ModalityMetrics = {
  id: 'atletismo',
  label: 'Atletismo Paralímpico',
  icon: 'Activity',
  color: '#FDCB6E',
  description: 'Atletismo — corridas, saltos e arremessos paralímpicos',
  court: {
    type: 'track',
    aspectRatio: 400 / 84,
    zones: [
      { id: 'start', label: 'Largada', x: 0, y: 40, w: 10, h: 20 },
      { id: 'back_straight', label: 'Reta oposta', x: 50, y: 0, w: 20, h: 100 },
      { id: 'finish', label: 'Chegada', x: 90, y: 40, w: 10, h: 20 },
    ]
  },
  categories: [
    {
      id: 'sprint',
      label: 'Corrida / Sprint',
      color: 'bg-yellow-50 border-yellow-400 text-yellow-700',
      options: [
        { value: 'reaction_time', label: 'T. Reação', color: 'bg-yellow-50', textColor: 'text-yellow-700', icon: 'Zap', shortcut: 'q' },
        { value: 'split_100m', label: 'Parcial 100m', color: 'bg-amber-50', textColor: 'text-amber-700', icon: 'Timer', shortcut: 'w' },
        { value: 'split_200m', label: 'Parcial 200m', color: 'bg-orange-50', textColor: 'text-orange-700', icon: 'Timer', shortcut: 'e' },
        { value: 'finish_time', label: 'Tempo final', color: 'bg-green-50', textColor: 'text-green-700', icon: 'Flag', shortcut: 'r' },
        { value: 'false_start', label: 'Saída falsa', color: 'bg-red-100', textColor: 'text-red-800', icon: 'AlertOctagon', shortcut: 't' },
      ]
    },
    {
      id: 'technique',
      label: 'Técnica',
      color: 'bg-orange-50 border-orange-400 text-orange-700',
      options: [
        { value: 'stride_good', label: 'Passada boa', color: 'bg-green-50', textColor: 'text-green-700', icon: 'CheckCircle', shortcut: 'a' },
        { value: 'stride_irregular', label: 'Passada irregular', color: 'bg-orange-50', textColor: 'text-orange-700', icon: 'AlertTriangle', shortcut: 's' },
        { value: 'guide_sync', label: 'Sincronia guia', color: 'bg-blue-50', textColor: 'text-blue-700', icon: 'Link', shortcut: 'd' },
        { value: 'prosthetic_issue', label: 'Problema prótese', color: 'bg-red-50', textColor: 'text-red-700', icon: 'AlertCircle', shortcut: 'f' },
      ]
    },
    {
      id: 'field',
      label: 'Saltos / Lançamentos',
      color: 'bg-amber-50 border-amber-400 text-amber-700',
      options: [
        { value: 'jump_attempt', label: 'Tentativa de salto', color: 'bg-amber-50', textColor: 'text-amber-700', icon: 'TrendingUp', shortcut: 'z' },
        { value: 'jump_foul', label: 'Nulo (salto)', color: 'bg-red-50', textColor: 'text-red-700', icon: 'X', shortcut: 'x' },
        { value: 'throw_attempt', label: 'Arremesso', color: 'bg-yellow-50', textColor: 'text-yellow-700', icon: 'Circle', shortcut: 'c' },
        { value: 'throw_foul', label: 'Nulo (arremesso)', color: 'bg-red-50', textColor: 'text-red-700', icon: 'X', shortcut: 'v' },
      ]
    }
  ],
  additionalFields: [
    { key: 'split_time_sec', label: 'Tempo (s)', type: 'number', unit: 's' },
    { key: 'distance_m', label: 'Distância (m)', type: 'number', unit: 'm' },
    { key: 'wind_speed', label: 'Vento (m/s)', type: 'number', unit: 'm/s' },
    { key: 'event_type', label: 'Prova', type: 'select', options: [
      {value:'100m',label:'100m'},{value:'200m',label:'200m'},{value:'400m',label:'400m'},
      {value:'800m',label:'800m'},{value:'1500m',label:'1500m'},{value:'5000m',label:'5000m'},
      {value:'marathon',label:'Maratona'},{value:'long_jump',label:'Salto em distância'},
      {value:'high_jump',label:'Salto em altura'},{value:'shot_put',label:'Arremesso de peso'},
      {value:'discus',label:'Lançamento de disco'},{value:'javelin',label:'Lançamento de dardo'}
    ]}
  ]
}

// ============================================================
// TÊNIS DE QUADRA
// ============================================================

export const TENIS_METRICS: ModalityMetrics = {
  id: 'tenis',
  label: 'Tênis de Quadra',
  icon: 'CircleDot',
  color: '#FDCB6E',
  description: 'Tênis de quadra (inclui tênis em cadeira de rodas)',
  court: {
    type: 'volleyball',
    aspectRatio: 24 / 11,
    zones: [
      { id: 'home_baseline', label: 'Fundo BRA', x: 0, y: 0, w: 40, h: 100, team: 'home' },
      { id: 'net', label: 'Rede', x: 40, y: 0, w: 20, h: 100, team: 'neutral' },
      { id: 'away_baseline', label: 'Fundo ADV', x: 60, y: 0, w: 40, h: 100, team: 'away' },
    ]
  },
  categories: [
    {
      id: 'serve',
      label: 'Saque',
      color: 'bg-amber-50 border-amber-400 text-amber-700',
      options: [
        { value: 'ace', label: 'Ace', color: 'bg-amber-50', textColor: 'text-amber-700', icon: 'Zap', shortcut: 'q' },
        { value: 'serve_in', label: 'Saque válido', color: 'bg-yellow-50', textColor: 'text-yellow-700', icon: 'Check', shortcut: 'w' },
        { value: 'double_fault', label: 'Dupla falta', color: 'bg-red-50', textColor: 'text-red-700', icon: 'X', shortcut: 'e' },
      ]
    },
    {
      id: 'rally',
      label: 'Troca de bola',
      color: 'bg-blue-50 border-blue-400 text-blue-700',
      options: [
        { value: 'forehand', label: 'Forehand', color: 'bg-blue-50', textColor: 'text-blue-700', icon: 'ArrowRight', shortcut: 'a' },
        { value: 'backhand', label: 'Backhand', color: 'bg-sky-50', textColor: 'text-sky-700', icon: 'ArrowLeft', shortcut: 's' },
        { value: 'volley', label: 'Voleio', color: 'bg-teal-50', textColor: 'text-teal-700', icon: 'ArrowUp', shortcut: 'd' },
        { value: 'smash', label: 'Smash', color: 'bg-indigo-50', textColor: 'text-indigo-700', icon: 'ArrowDown', shortcut: 'f' },
        { value: 'drop_shot', label: 'Deixadinha', color: 'bg-cyan-50', textColor: 'text-cyan-700', icon: 'Minus', shortcut: 'g' },
      ]
    },
    {
      id: 'point',
      label: 'Resultado do Ponto',
      color: 'bg-green-50 border-green-400 text-green-700',
      options: [
        { value: 'winner', label: 'Winner', color: 'bg-green-50', textColor: 'text-green-700', icon: 'Trophy', shortcut: 'z' },
        { value: 'unforced_error', label: 'Erro não forçado', color: 'bg-red-50', textColor: 'text-red-700', icon: 'XCircle', shortcut: 'x' },
        { value: 'forced_error', label: 'Erro forçado', color: 'bg-orange-50', textColor: 'text-orange-700', icon: 'AlertTriangle', shortcut: 'c' },
        { value: 'break_point', label: 'Break point ganho', color: 'bg-emerald-50', textColor: 'text-emerald-700', icon: 'Star', shortcut: 'v' },
      ]
    }
  ],
  additionalFields: [
    { key: 'set_number', label: 'Set', type: 'number' },
    { key: 'game_score', label: 'Placar do game', type: 'text' },
  ]
}

// ============================================================
// BEACH TENNIS
// ============================================================

export const BEACH_TENNIS_METRICS: ModalityMetrics = {
  id: 'beach_tennis',
  label: 'Beach Tennis',
  icon: 'Sun',
  color: '#00CEC9',
  description: 'Beach tennis — geralmente disputado em duplas, sem quique permitido',
  court: {
    type: 'volleyball',
    aspectRatio: 16 / 8,
    zones: [
      { id: 'home_baseline', label: 'Fundo BRA', x: 0, y: 0, w: 40, h: 100, team: 'home' },
      { id: 'net', label: 'Rede', x: 40, y: 0, w: 20, h: 100, team: 'neutral' },
      { id: 'away_baseline', label: 'Fundo ADV', x: 60, y: 0, w: 40, h: 100, team: 'away' },
    ]
  },
  categories: [
    {
      id: 'serve',
      label: 'Saque',
      color: 'bg-amber-50 border-amber-400 text-amber-700',
      options: [
        { value: 'ace', label: 'Ace', color: 'bg-amber-50', textColor: 'text-amber-700', icon: 'Zap', shortcut: 'q' },
        { value: 'serve_in', label: 'Saque válido', color: 'bg-yellow-50', textColor: 'text-yellow-700', icon: 'Check', shortcut: 'w' },
        { value: 'fault', label: 'Falta', color: 'bg-red-50', textColor: 'text-red-700', icon: 'X', shortcut: 'e' },
      ]
    },
    {
      id: 'rally',
      label: 'Troca de bola',
      color: 'bg-blue-50 border-blue-400 text-blue-700',
      options: [
        { value: 'forehand', label: 'Forehand', color: 'bg-blue-50', textColor: 'text-blue-700', icon: 'ArrowRight', shortcut: 'a' },
        { value: 'backhand', label: 'Backhand', color: 'bg-sky-50', textColor: 'text-sky-700', icon: 'ArrowLeft', shortcut: 's' },
        { value: 'smash', label: 'Smash', color: 'bg-indigo-50', textColor: 'text-indigo-700', icon: 'ArrowDown', shortcut: 'd' },
        { value: 'lob', label: 'Lob', color: 'bg-cyan-50', textColor: 'text-cyan-700', icon: 'ArrowUp', shortcut: 'f' },
      ]
    },
    {
      id: 'point',
      label: 'Resultado do Ponto',
      color: 'bg-green-50 border-green-400 text-green-700',
      options: [
        { value: 'winner', label: 'Winner', color: 'bg-green-50', textColor: 'text-green-700', icon: 'Trophy', shortcut: 'z' },
        { value: 'unforced_error', label: 'Erro não forçado', color: 'bg-red-50', textColor: 'text-red-700', icon: 'XCircle', shortcut: 'x' },
        { value: 'net_error', label: 'Erro na rede', color: 'bg-orange-50', textColor: 'text-orange-700', icon: 'AlertTriangle', shortcut: 'c' },
      ]
    }
  ],
  additionalFields: [
    { key: 'set_number', label: 'Set', type: 'number' },
    { key: 'game_score', label: 'Placar do game', type: 'text' },
  ]
}

// ============================================================
// ALL MODALITIES MAP
// ============================================================

export const MODALITY_METRICS: Record<string, ModalityMetrics> = {
  goalball: GOALBALL_METRICS,
  rugby: RUGBY_METRICS,
  natacao: NATACAO_METRICS,
  volei: VOLEI_METRICS,
  paracanoagem: PARACANOAGEM_METRICS,
  remo: REMO_METRICS,
  atletismo: ATLETISMO_METRICS,
  tenis: TENIS_METRICS,
  beach_tennis: BEACH_TENNIS_METRICS,
}

export const MODALITY_LIST = Object.values(MODALITY_METRICS)

// Event outcome colors
export const OUTCOME_COLORS: Record<string, { bg: string; text: string }> = {
  success: { bg: 'bg-green-100', text: 'text-green-800' },
  fail: { bg: 'bg-red-100', text: 'text-red-800' },
  partial: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  out: { bg: 'bg-gray-100', text: 'text-gray-700' },
  foul: { bg: 'bg-orange-100', text: 'text-orange-800' },
  committed: { bg: 'bg-red-100', text: 'text-red-800' },
}
