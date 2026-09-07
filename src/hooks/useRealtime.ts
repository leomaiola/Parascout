import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useLiveScoutStore } from '../lib/store'
import type { ScoutEvent, Match } from '../lib/database.types'

/**
 * Subscribe to real-time scout events and match updates for a given match.
 * Multiple analysts can log events simultaneously; all connected clients see updates instantly.
 */
export function useRealtimeMatch(matchId: string) {
  const qc = useQueryClient()
  const { addEvent, setMatch, match } = useLiveScoutStore()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!matchId) return

    const channel = supabase
      .channel(`match:${matchId}`)
      // New scout events
      .on<ScoutEvent>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scout_events',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          addEvent(payload.new)
          qc.invalidateQueries({ queryKey: ['scout-events', matchId] })
          qc.invalidateQueries({ queryKey: ['athlete-match-stats', matchId] })
        }
      )
      // Match score / status updates
      .on<Match>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          setMatch(payload.new)
          qc.invalidateQueries({ queryKey: ['match', matchId] })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [matchId])

  return { match }
}

/**
 * Timer hook — runs a setInterval when timerRunning is true.
 * Persists via Zustand so the timer survives tab switches within the app.
 */
export function useMatchTimer() {
  const { timerRunning, tickTimer } = useLiveScoutStore()

  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(tickTimer, 1000)
    return () => clearInterval(id)
  }, [timerRunning, tickTimer])
}

/** Format seconds to MM:SS */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
