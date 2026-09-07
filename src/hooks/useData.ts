import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { NewAthlete, NewMatch, NewScoutEvent } from '../lib/database.types'
import { useToastStore } from '../lib/store'

// ── ATHLETES ───────────────────────────────────────────────

export function useAthletes(modality?: string) {
  return useQuery({
    queryKey: ['athletes', modality],
    queryFn: async () => {
      let q = supabase.from('athletes').select('*').eq('is_active', true).order('full_name')
      if (modality) q = q.eq('primary_modality', modality)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useAthlete(id: string) {
  return useQuery({
    queryKey: ['athlete', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateAthlete() {
  const qc = useQueryClient()
  const { addToast } = useToastStore()
  return useMutation({
    mutationFn: async (athlete: NewAthlete) => {
      const { data, error } = await supabase.from('athletes').insert(athlete).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athletes'] })
      addToast('Atleta cadastrado com sucesso!')
    },
    onError: (e: Error) => addToast(e.message, 'error'),
  })
}

export function useUpdateAthlete() {
  const qc = useQueryClient()
  const { addToast } = useToastStore()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewAthlete> }) => {
      const { error } = await supabase.from('athletes').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athletes'] })
      addToast('Atleta atualizado!')
    },
    onError: (e: Error) => addToast(e.message, 'error'),
  })
}

// ── MATCHES ────────────────────────────────────────────────

export function useMatches(status?: string) {
  return useQuery({
    queryKey: ['matches', status],
    queryFn: async () => {
      let q = supabase.from('matches').select('*').order('match_date', { ascending: false })
      if (status) q = q.eq('status', status)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ['match', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('matches').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useMatchAthletes(matchId: string) {
  return useQuery({
    queryKey: ['match-athletes', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_athletes')
        .select('*, athletes(*)')
        .eq('match_id', matchId)
      if (error) throw error
      return data
    },
    enabled: !!matchId,
  })
}

export function useCreateMatch() {
  const qc = useQueryClient()
  const { addToast } = useToastStore()
  return useMutation({
    mutationFn: async (match: NewMatch) => {
      const { data, error } = await supabase.from('matches').insert(match).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches'] })
      addToast('Partida criada!')
    },
    onError: (e: Error) => addToast(e.message, 'error'),
  })
}

export function useUpdateMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewMatch> }) => {
      const { error } = await supabase.from('matches').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['match', vars.id] })
      qc.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}

// ── MATCH ATHLETES (vínculo de elenco por partida) ─────────

export interface NewMatchAthlete {
  match_id: string
  athlete_id: string
  team: 'home' | 'away'
  jersey_number?: number | null
  is_starting?: boolean
}

export function useAddMatchAthletes() {
  const qc = useQueryClient()
  const { addToast } = useToastStore()
  return useMutation({
    mutationFn: async (rows: NewMatchAthlete[]) => {
      if (rows.length === 0) return []
      const { data, error } = await supabase.from('match_athletes').insert(rows).select()
      if (error) throw error
      return data
    },
    onSuccess: (_, rows) => {
      if (rows[0]) qc.invalidateQueries({ queryKey: ['match_athletes', rows[0].match_id] })
    },
    onError: (e: Error) => addToast(`Erro ao vincular atletas: ${e.message}`, 'error'),
  })
}

export function useRemoveMatchAthlete() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, matchId }: { id: string; matchId: string }) => {
      const { error } = await supabase.from('match_athletes').delete().eq('id', id)
      if (error) throw error
      return matchId
    },
    onSuccess: (matchId) => {
      qc.invalidateQueries({ queryKey: ['match_athletes', matchId] })
    },
  })
}

// ── SCOUT EVENTS ───────────────────────────────────────────

export function useScoutEvents(matchId: string) {
  return useQuery({
    queryKey: ['scout-events', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_events')
        .select('*, athletes(full_name, functional_class)')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!matchId,
  })
}

export function useCreateScoutEvent() {
  const qc = useQueryClient()
  const { addToast } = useToastStore()
  return useMutation({
    mutationFn: async (event: NewScoutEvent) => {
      const { data, error } = await supabase.from('scout_events').insert(event).select().single()
      if (error) throw error
      // Recalculate stats if athlete is set
      if (event.athlete_id) {
        await supabase.rpc('recalculate_match_stats', {
          p_match_id: event.match_id,
          p_athlete_id: event.athlete_id,
        })
      }
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['scout-events', vars.match_id] })
      qc.invalidateQueries({ queryKey: ['athlete-match-stats', vars.match_id] })
      addToast('Ação registrada!', 'success')
    },
    onError: (e: Error) => addToast(e.message, 'error'),
  })
}

// ── STATS ──────────────────────────────────────────────────

export function useAthleteMatchStats(matchId: string) {
  return useQuery({
    queryKey: ['athlete-match-stats', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_match_stats')
        .select('*, athletes(full_name, functional_class, photo_url)')
        .eq('match_id', matchId)
      if (error) throw error
      return data
    },
    enabled: !!matchId,
  })
}

export function useAthleteSeasonStats(athleteId: string) {
  return useQuery({
    queryKey: ['athlete-season-stats', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_match_stats')
        .select('*, matches(match_date, home_team, away_team, modality)')
        .eq('athlete_id', athleteId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!athleteId,
  })
}

// ── AI REPORTS ─────────────────────────────────────────────

export function useAIReports(matchId?: string, athleteId?: string) {
  return useQuery({
    queryKey: ['ai-reports', matchId, athleteId],
    queryFn: async () => {
      let q = supabase.from('ai_reports').select('*').order('created_at', { ascending: false })
      if (matchId) q = q.eq('match_id', matchId)
      if (athleteId) q = q.eq('athlete_id', athleteId)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}
