import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Profile, Match, Athlete, ScoutEvent } from '../lib/database.types'

// ── Auth store ─────────────────────────────────────────────
interface AuthState {
  user: Profile | null
  loading: boolean
  setUser: (user: Profile | null) => void
  setLoading: (v: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))

// ── Active match / live scout store ────────────────────────
interface LiveScoutState {
  match: Match | null
  homeAthletes: Athlete[]
  awayAthletes: Athlete[]
  selectedAthlete: Athlete | null
  selectedTeam: 'home' | 'away'
  events: ScoutEvent[]
  timerRunning: boolean
  timerSeconds: number
  currentPeriod: string

  // Actions
  setMatch: (match: Match) => void
  setHomeAthletes: (athletes: Athlete[]) => void
  setAwayAthletes: (athletes: Athlete[]) => void
  selectAthlete: (athlete: Athlete | null) => void
  setSelectedTeam: (team: 'home' | 'away') => void
  addEvent: (event: ScoutEvent) => void
  setEvents: (events: ScoutEvent[]) => void
  startTimer: () => void
  stopTimer: () => void
  tickTimer: () => void
  resetTimer: () => void
  setPeriod: (period: string) => void
  updateScore: (team: 'home' | 'away', delta: number) => void
}

export const useLiveScoutStore = create<LiveScoutState>((set, get) => ({
  match: null,
  homeAthletes: [],
  awayAthletes: [],
  selectedAthlete: null,
  selectedTeam: 'home',
  events: [],
  timerRunning: false,
  timerSeconds: 0,
  currentPeriod: '1',

  setMatch: (match) => set({ match }),
  setHomeAthletes: (homeAthletes) => set({ homeAthletes }),
  setAwayAthletes: (awayAthletes) => set({ awayAthletes }),
  selectAthlete: (athlete) => set({ selectedAthlete: athlete }),
  setSelectedTeam: (selectedTeam) => set({ selectedTeam }),
  addEvent: (event) => set((s) => ({ events: [event, ...s.events] })),
  setEvents: (events) => set({ events }),
  startTimer: () => set({ timerRunning: true }),
  stopTimer: () => set({ timerRunning: false }),
  tickTimer: () => set((s) => ({ timerSeconds: s.timerSeconds + 1 })),
  resetTimer: () => set({ timerSeconds: 0, timerRunning: false }),
  setPeriod: (currentPeriod) => set({ currentPeriod }),
  updateScore: (team, delta) =>
    set((s) => {
      if (!s.match) return s
      const key = team === 'home' ? 'home_score' : 'away_score'
      const newScore = Math.max(0, (s.match[key] || 0) + delta)
      return { match: { ...s.match, [key]: newScore } }
    }),
}))

// ── Toast notifications ─────────────────────────────────────
export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface ToastState {
  toasts: Toast[]
  addToast: (msg: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
