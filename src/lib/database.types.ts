export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          country: string
          state: string | null
          logo_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'admin' | 'analyst' | 'coach' | 'viewer'
          organization_id: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      athletes: {
        Row: {
          id: string
          organization_id: string | null
          full_name: string
          birth_date: string | null
          nationality: string
          state: string | null
          city: string | null
          email: string | null
          phone: string | null
          disability_type: string | null
          disability_notes: string | null
          primary_modality: string
          secondary_modalities: string[] | null
          functional_class: string | null
          dominant_hand: 'right' | 'left' | 'both' | null
          height_cm: number | null
          weight_kg: number | null
          photo_url: string | null
          is_active: boolean
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['athletes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['athletes']['Insert']>
      }
      matches: {
        Row: {
          id: string
          competition_id: string | null
          organization_id: string | null
          modality: string
          home_team: string
          away_team: string
          home_score: number
          away_score: number
          match_date: string | null
          venue: string | null
          status: 'scheduled' | 'live' | 'finished' | 'cancelled'
          period: string
          period_duration_min: number | null
          notes: string | null
          video_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['matches']['Insert']>
      }
      match_athletes: {
        Row: {
          id: string
          match_id: string
          athlete_id: string
          team: string
          jersey_number: number | null
          position: string | null
          is_starting: boolean
        }
        Insert: Omit<Database['public']['Tables']['match_athletes']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['match_athletes']['Insert']>
      }
      scout_events: {
        Row: {
          id: string
          match_id: string
          athlete_id: string | null
          modality: string
          match_time_sec: number | null
          period: string | null
          event_category: string
          event_type: string
          event_subtype: string | null
          throw_type: string | null
          throw_direction: string | null
          goal_quadrant: number | null
          block_type: string | null
          penalty_type: string | null
          try_zone: string | null
          pass_type: string | null
          tackle_result: string | null
          stroke_type: string | null
          split_time_sec: number | null
          reaction_time_sec: number | null
          pace_500m_sec: number | null
          stroke_rate: number | null
          serve_type: string | null
          spike_zone: number | null
          block_touch: boolean | null
          distance_m: number | null
          wind_speed: number | null
          flight_time_sec: number | null
          outcome: string | null
          points_scored: number
          pos_x: number | null
          pos_y: number | null
          notes: string | null
          extra: Json
          ai_flags: Json
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['scout_events']['Row'], 'id' | 'created_at'>> &
          Pick<Database['public']['Tables']['scout_events']['Row'], 'match_id' | 'modality' | 'event_category' | 'event_type'>
        Update: Partial<Database['public']['Tables']['scout_events']['Insert']>
      }
      athlete_match_stats: {
        Row: {
          id: string
          match_id: string
          athlete_id: string
          modality: string
          total_attacks: number
          attacks_on_goal: number
          attacks_success: number
          total_blocks: number
          blocks_success: number
          goals_scored: number
          goals_conceded: number
          penalties_suffered: number
          penalties_committed: number
          throw_types: Json
          quadrant_distribution: Json
          tries_scored: number
          assists: number
          tackles: number
          turnovers: number
          penalties_received: number
          best_time_sec: number | null
          avg_split_sec: number | null
          reaction_time_sec: number | null
          strokes_count: number
          avg_pace_500m: number | null
          avg_stroke_rate: number | null
          total_events: number
          efficiency_pct: number | null
          rating: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
      ai_reports: {
        Row: {
          id: string
          match_id: string | null
          athlete_id: string | null
          report_type: string
          modality: string | null
          content: string
          insights: Json
          generated_by: string
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_reports']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['ai_reports']['Insert']>
      }
    }
    Views: {}
    Functions: {
      recalculate_match_stats: {
        Args: { p_match_id: string; p_athlete_id: string }
        Returns: void
      }
    }
  }
}

// Convenience types
export type Organization = Database['public']['Tables']['organizations']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Athlete = Database['public']['Tables']['athletes']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type MatchAthlete = Database['public']['Tables']['match_athletes']['Row']
export type ScoutEvent = Database['public']['Tables']['scout_events']['Row']
export type AthleteMatchStats = Database['public']['Tables']['athlete_match_stats']['Row']
export type AIReport = Database['public']['Tables']['ai_reports']['Row']

export type NewAthlete = Database['public']['Tables']['athletes']['Insert']
export type NewMatch = Database['public']['Tables']['matches']['Insert']
export type NewScoutEvent = Database['public']['Tables']['scout_events']['Insert']
