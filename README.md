# ParaScout 🏆

Sistema de scout esportivo para modalidades paralímpicas, construído com **React + TypeScript + Supabase**.

## Modalidades Suportadas

| Modalidade | Categorias de ação | Destaques |
|---|---|---|
| **Goalball** | Ataque, Defesa, Gol, Penalidade, Técnico | 7 quadrantes, 6 tipos de arremesso, mapa de quadra interativo |
| **Rugby Paralímpico** | Ataque, Defesa, Penalidade, Técnico | Classes 0.5–3.5, zonas de try, tipos de passe |
| **Natação Paralímpica** | Performance, Técnica, Infração | Splits por parcial, tempo de reação, braçadas/min |
| **Vôlei Sentado** | Ataque, Defesa, Levantamento, Erros | 6 zonas, tipo de saque, bloqueio simples/duplo |
| **Paracanoagem** | Performance, Técnica, Tático | Classes KL/VL, cadência, gestão de ritmo |
| **Remo Paralímpico** | Performance, Técnica, Tático | Classes PR1–PR3, pace 500m, qualidade de remada |
| **Atletismo** | Corrida, Técnica, Saltos/Lançamentos | T. reação, parciais, vento, distância |

## Stack Técnica

- **Frontend**: React 18 + TypeScript + Vite
- **Banco de dados**: Supabase (PostgreSQL) com Row Level Security
- **Realtime**: Supabase Realtime (WebSocket) — múltiplos analistas em simultâneo
- **Estado global**: Zustand
- **Queries**: TanStack Query (React Query v5)
- **Exportação**: SheetJS (xlsx)
- **IA**: Claude Sonnet 4.6 via API Anthropic

## Estrutura do Projeto

```
parascout/
├── src/
│   ├── components/
│   │   └── scout/
│   │       ├── GoalballCourt.tsx     # Quadra SVG interativa com 7 quadrantes
│   │       ├── AIPanel.tsx           # Painel de análise com Claude
│   │       └── EventTimeline.tsx     # Linha do tempo de ações
│   ├── constants/
│   │   └── modalities.ts             # Métricas detalhadas de cada modalidade
│   ├── hooks/
│   │   ├── useData.ts                # React Query hooks (CRUD)
│   │   ├── useRealtime.ts            # Supabase Realtime + timer
│   │   └── useAIAnalysis.ts          # Integração Claude API
│   ├── lib/
│   │   ├── supabase.ts               # Cliente Supabase
│   │   ├── database.types.ts         # TypeScript types do schema
│   │   ├── store.ts                  # Zustand stores
│   │   └── export.ts                 # Exportação Excel
│   └── pages/
│       ├── Dashboard.tsx
│       ├── Athletes.tsx
│       ├── Matches.tsx
│       ├── LiveScout.tsx             # ⭐ Página principal de scout
│       ├── Reports.tsx
│       └── Settings.tsx
└── supabase/
    └── migrations/
        └── 001_schema.sql            # Schema completo com RLS
```

## Setup

### 1. Supabase

1. Crie um projeto gratuito em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o conteúdo de `supabase/migrations/001_schema.sql`
3. Copie a **Project URL** e a **anon public key** em Settings → API

### 2. Variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com sua URL e anon key do Supabase
```

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

O app abrirá em `http://localhost:5173`.

## Como usar

### Scout ao vivo (Goalball)

1. Crie uma partida em **Partidas → Nova Partida**
2. Adicione atletas das duas equipes
3. Clique em **Iniciar Scout**
4. Na tela de scout:
   - **Selecione o atleta** em ação
   - **Selecione o tipo de arremesso** (Rasteiro, Quicado, Efeito, Gancho, Lob)
   - **Selecione a direção** do arremesso
   - **Clique na quadra** para marcar a posição (ou selecione o quadrante Q1–Q7 manualmente)
   - **Clique o botão de ação** (Ataque, Bloqueio, Gol, Penalidade, etc.)
   - Use `Espaço` para pausar/retomar o cronômetro
5. Use o **painel de IA** para análise tática em tempo real

### Exportação

- **Por partida**: Relatórios → selecione a partida → Exportar Excel
- **Por atleta**: Atletas → perfil do atleta → Exportar Excel
- **Por equipe**: Relatórios → Equipe Excel

## Realtime Multi-analista

Múltiplos analistas podem registrar ações na mesma partida simultaneamente. Todas as ações são sincronizadas via Supabase Realtime sem necessidade de refresh.

## Segurança

- Row Level Security (RLS) ativo em todas as tabelas
- Dados isolados por organização
- Roles: `admin`, `analyst`, `coach`, `viewer`

> ⚠️ **Nota sobre a chave da IA**: Em desenvolvimento, a chave da API da Anthropic pode ser passada diretamente. Em produção, roteie as chamadas de IA por um **Supabase Edge Function** para não expor a chave no cliente.
