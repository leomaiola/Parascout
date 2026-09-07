import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  )
}

// Nota: o generic <Database> foi removido temporariamente — o arquivo database.types.ts
// está incompleto em algumas tabelas (faltam Insert/Update), o que quebrava a inferência
// de tipos em cascata. O client funciona normalmente; os tipos ficam menos estritos até
// o database.types.ts ser regenerado (ex: via `supabase gen types typescript`).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: { eventsPerSecond: 10 }
  }
})

export type { Database }
