-- ============================================================
-- PARASCOUT — Supabase Schema
-- Execute no SQL Editor do Supabase (supabase.com/dashboard)
-- ============================================================

-- EXTENSIONS
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type modality_type as enum (
  'goalball', 'paracanoagem', 'remo', 'volei', 'rugby',
  'natacao', 'atletismo', 'ciclismo', 'tenis_mesa', 'bocce',
  'futebol_5', 'judô'
);

create type visual_class as enum ('B1','B2','B3');

create type functional_class as enum (
  -- Goalball
  'B1','B2','B3',
  -- Rugby
  '0.5','1.0','1.5','2.0','2.5','3.0','3.5',
  -- Remo
  'PR1','PR2','PR3',
  -- Canoagem
  'KL1','KL2','KL3','VL1','VL2','VL3',
  -- Vôlei
  'SD','MD',
  -- Natação
  'S1','S2','S3','S4','S5','S6','S7','S8','S9','S10','S11','S12','S13','S14',
  -- Atletismo
  'T11','T12','T13','F11','F12','F13'
);

create type user_role as enum ('admin','analyst','coach','viewer');

create type match_status as enum ('scheduled','live','finished','cancelled');

create type hand_type as enum ('right','left','both');

-- ============================================================
-- ORGANIZATIONS / TEAMS
-- ============================================================

create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  country text not null default 'Brasil',
  state text,
  logo_url text,
  created_at timestamptz default now()
);

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'analyst',
  organization_id uuid references organizations(id),
  avatar_url text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- ATHLETES
-- ============================================================

create table athletes (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id),
  full_name text not null,
  birth_date date,
  nationality text default 'Brasil',
  state text,
  city text,
  email text,
  phone text,
  -- Disability info
  disability_type text, -- CID code or description
  disability_notes text,
  -- Sport classification
  primary_modality modality_type not null,
  secondary_modalities modality_type[],
  functional_class text, -- flexible: B1, S6, PR2, etc.
  -- Physical
  dominant_hand hand_type,
  height_cm int,
  weight_kg numeric(5,1),
  -- Media
  photo_url text,
  -- Meta
  is_active boolean default true,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- COMPETITIONS
-- ============================================================

create table competitions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  modality modality_type not null,
  location text,
  start_date date,
  end_date date,
  organization_id uuid references organizations(id),
  created_at timestamptz default now()
);

-- ============================================================
-- MATCHES
-- ============================================================

create table matches (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid references competitions(id),
  organization_id uuid references organizations(id),
  modality modality_type not null,
  home_team text not null,
  away_team text not null,
  home_score int default 0,
  away_score int default 0,
  match_date timestamptz,
  venue text,
  status match_status default 'scheduled',
  period text default '1',        -- current period/set/time
  period_duration_min int,        -- minutes per period
  notes text,
  video_url text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Roster: which athletes play in a match
create table match_athletes (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id) on delete cascade,
  athlete_id uuid references athletes(id),
  team text not null,            -- 'home' | 'away'
  jersey_number int,
  position text,
  is_starting boolean default true
);

-- ============================================================
-- SCOUT EVENTS (core table — highly flexible)
-- ============================================================

create table scout_events (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id) on delete cascade not null,
  athlete_id uuid references athletes(id),
  modality modality_type not null,

  -- Timing
  match_time_sec int,            -- seconds elapsed in match
  period text,

  -- Event classification (modality-specific via JSONB)
  event_category text not null,  -- 'attack','defense','goal','penalty','technical', etc.
  event_type text not null,      -- detailed type per modality
  event_subtype text,

  -- Goalball specifics
  throw_type text,               -- 'bounce','flat','spin','hook','penalty'
  throw_direction text,          -- 'left','center','right','diagonal_left','diagonal_right'
  goal_quadrant int,             -- 1-7 (goalball court quadrants)
  block_type text,               -- 'body','knee','feet','dive'
  penalty_type text,             -- 'high_ball','long_ball','short_ball','noise','eye_shade'

  -- Rugby specifics
  try_zone text,                 -- court zone for try
  pass_type text,                -- 'forward','lateral','behind'
  tackle_result text,            -- 'successful','missed','foul'

  -- Natação specifics
  stroke_type text,              -- 'freestyle','butterfly','backstroke','breaststroke'
  split_time_sec numeric(6,2),   -- lap split time
  reaction_time_sec numeric(5,3),

  -- Remo / Canoagem specifics
  pace_500m_sec int,
  stroke_rate int,               -- strokes per minute

  -- Vôlei specifics
  serve_type text,               -- 'jump','float','short'
  spike_zone int,                -- 1-6 court zones
  block_touch boolean,

  -- Atletismo specifics
  distance_m numeric(8,2),
  wind_speed numeric(4,1),
  flight_time_sec numeric(5,3),

  -- Outcome
  outcome text,                  -- 'success','fail','partial','out','foul'
  points_scored int default 0,

  -- Position on court (normalized 0-100)
  pos_x numeric(5,2),
  pos_y numeric(5,2),

  -- Free text + extra data
  notes text,
  extra jsonb default '{}',      -- any extra modality-specific data

  -- AI analysis
  ai_flags jsonb default '{}',   -- patterns flagged by AI

  -- Meta
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Index for performance
create index idx_scout_events_match on scout_events(match_id);
create index idx_scout_events_athlete on scout_events(athlete_id);
create index idx_scout_events_modality on scout_events(modality);
create index idx_scout_events_category on scout_events(event_category);

-- ============================================================
-- ATHLETE PERFORMANCE SUMMARIES (materialized per match)
-- ============================================================

create table athlete_match_stats (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id) on delete cascade,
  athlete_id uuid references athletes(id),
  modality modality_type not null,

  -- Goalball
  total_attacks int default 0,
  attacks_on_goal int default 0,
  attacks_success int default 0,
  total_blocks int default 0,
  blocks_success int default 0,
  goals_scored int default 0,
  goals_conceded int default 0,
  penalties_suffered int default 0,
  penalties_committed int default 0,
  throw_types jsonb default '{}',     -- {"bounce":5,"flat":3,"spin":2}
  quadrant_distribution jsonb default '{}', -- {"1":2,"2":1,...,"7":3}

  -- Rugby
  tries_scored int default 0,
  assists int default 0,
  tackles int default 0,
  turnovers int default 0,
  penalties_received int default 0,

  -- Natação
  best_time_sec numeric(8,3),
  avg_split_sec numeric(8,3),
  reaction_time_sec numeric(5,3),
  strokes_count int default 0,

  -- Remo/Canoagem
  avg_pace_500m int,
  avg_stroke_rate int,

  -- General
  total_events int default 0,
  efficiency_pct numeric(5,2),       -- calculated
  rating numeric(3,1),               -- analyst rating 0-10

  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(match_id, athlete_id)
);

-- ============================================================
-- AI ANALYSIS REPORTS
-- ============================================================

create table ai_reports (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id),
  athlete_id uuid references athletes(id),
  report_type text not null,         -- 'match','season','trend','opponent'
  modality modality_type,
  content text not null,             -- AI-generated markdown
  insights jsonb default '[]',       -- structured insights array
  generated_by text default 'claude-sonnet-4-6',
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table athletes enable row level security;
alter table competitions enable row level security;
alter table matches enable row level security;
alter table match_athletes enable row level security;
alter table scout_events enable row level security;
alter table athlete_match_stats enable row level security;
alter table ai_reports enable row level security;

-- Profiles: users see their own + same org
create policy "profiles_select" on profiles for select
  using (id = auth.uid() or organization_id = (
    select organization_id from profiles where id = auth.uid()
  ));

create policy "profiles_update" on profiles for update
  using (id = auth.uid());

-- Organizations: members of org can read
create policy "org_select" on organizations for select
  using (id = (select organization_id from profiles where id = auth.uid()));

-- Athletes: org members can CRUD
create policy "athletes_all" on athletes for all
  using (organization_id = (select organization_id from profiles where id = auth.uid()));

-- Matches: org members
create policy "matches_all" on matches for all
  using (organization_id = (select organization_id from profiles where id = auth.uid()));

-- Scout events: analysts and admins can insert; all org members can read
create policy "scout_events_select" on scout_events for select
  using (match_id in (
    select id from matches where organization_id = (
      select organization_id from profiles where id = auth.uid()
    )
  ));

create policy "scout_events_insert" on scout_events for insert
  with check (match_id in (
    select id from matches where organization_id = (
      select organization_id from profiles where id = auth.uid()
    )
  ));

-- Stats: org members
create policy "stats_all" on athlete_match_stats for all
  using (match_id in (
    select id from matches where organization_id = (
      select organization_id from profiles where id = auth.uid()
    )
  ));

-- AI Reports: org members
create policy "ai_reports_all" on ai_reports for all
  using (match_id in (
    select id from matches where organization_id = (
      select organization_id from profiles where id = auth.uid()
    )
  ));

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Recalculate athlete stats for a match
create or replace function recalculate_match_stats(p_match_id uuid, p_athlete_id uuid)
returns void as $$
declare
  v_modality modality_type;
begin
  select modality into v_modality from matches where id = p_match_id;

  insert into athlete_match_stats (match_id, athlete_id, modality,
    total_attacks, attacks_on_goal, attacks_success,
    total_blocks, blocks_success, goals_scored, penalties_committed,
    throw_types, quadrant_distribution, total_events, efficiency_pct
  )
  select
    p_match_id, p_athlete_id, v_modality,
    count(*) filter (where event_category = 'attack'),
    count(*) filter (where event_category = 'attack' and outcome != 'out'),
    count(*) filter (where event_category = 'attack' and outcome = 'success'),
    count(*) filter (where event_category = 'defense'),
    count(*) filter (where event_category = 'defense' and outcome = 'success'),
    count(*) filter (where event_category = 'goal'),
    count(*) filter (where event_category = 'penalty' and outcome = 'committed'),
    jsonb_object_agg(throw_type, cnt) filter (where throw_type is not null),
    jsonb_object_agg(goal_quadrant::text, qcnt) filter (where goal_quadrant is not null),
    count(*),
    case when count(*) filter (where event_category = 'attack') > 0
      then round(100.0 * count(*) filter (where event_category = 'attack' and outcome = 'success')
        / count(*) filter (where event_category = 'attack'), 2)
      else 0 end
  from (
    select event_category, outcome, throw_type, goal_quadrant,
      count(*) as cnt,
      count(*) over (partition by goal_quadrant) as qcnt
    from scout_events
    where match_id = p_match_id and athlete_id = p_athlete_id
    group by event_category, outcome, throw_type, goal_quadrant
  ) sub
  on conflict (match_id, athlete_id) do update set
    total_attacks = excluded.total_attacks,
    attacks_on_goal = excluded.attacks_on_goal,
    attacks_success = excluded.attacks_success,
    total_blocks = excluded.total_blocks,
    blocks_success = excluded.blocks_success,
    goals_scored = excluded.goals_scored,
    penalties_committed = excluded.penalties_committed,
    throw_types = excluded.throw_types,
    quadrant_distribution = excluded.quadrant_distribution,
    total_events = excluded.total_events,
    efficiency_pct = excluded.efficiency_pct,
    updated_at = now();
end;
$$ language plpgsql security definer;

-- ============================================================
-- REALTIME
-- ============================================================

-- Enable realtime for live scout
alter publication supabase_realtime add table scout_events;
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table athlete_match_stats;

-- ============================================================
-- SEED DATA (example org + competition)
-- ============================================================

insert into organizations (id, name, country, state) values
  ('00000000-0000-0000-0000-000000000001', 'Confederação Brasileira de Esportes Paralímpicos', 'Brasil', 'SP');
