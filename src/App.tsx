import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Home, Users, Radio, BarChart2, Settings, Trophy, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { supabase } from './lib/supabase'
import { useAuthStore, useToastStore } from './lib/store'

// Pages
import Dashboard from './pages/Dashboard'
import AthletesPage from './pages/Athletes'
import MatchesPage from './pages/Matches'
import LiveScout from './pages/LiveScout'
import ReportsPage from './pages/Reports'
import SettingsPage from './pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

function ToastContainer() {
  const { toasts } = useToastStore()
  const ICONS: Record<string, React.ElementType> = { success: CheckCircle, error: AlertCircle, info: Info, warning: AlertCircle }
  const COLORS: Record<string, string> = { success: '#00B894', error: '#E17055', info: '#0984E3', warning: '#FDCB6E' }

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info
        return (
          <div
            key={toast.id}
            style={{
              background: '#0D1F2D', color: '#fff', padding: '10px 16px',
              borderRadius: 10, fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              fontFamily: 'Barlow, sans-serif',
              borderLeft: `3px solid ${COLORS[toast.type]}`,
              animation: 'slideIn .25s ease',
            }}
          >
            <Icon size={15} color={COLORS[toast.type]} />
            {toast.message}
          </div>
        )
      })}
    </div>
  )
}

function AppLayout() {
  const { user, loading, setUser, setLoading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => { if (data) setUser(data) })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUser(null); navigate('/') }
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 24, color: '#00B894' }}>
        PARASCOUT
      </div>
    )
  }

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/atletas', icon: Users, label: 'Atletas' },
    { to: '/partidas', icon: Trophy, label: 'Partidas' },
    { to: '/relatorios', icon: BarChart2, label: 'Relatórios' },
    { to: '/configuracoes', icon: Settings, label: 'Config' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: 'Barlow, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: '#0D1F2D', position: 'sticky', top: 0, zIndex: 100,
        height: 52, display: 'flex', alignItems: 'center', padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 20, fontWeight: 700, color: '#00B894', letterSpacing: 1 }}>
          PARA<span style={{ color: '#fff', fontWeight: 500 }}>SCOUT</span>
        </div>

        <nav style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 10px', borderRadius: 8, textDecoration: 'none',
                fontSize: 12, fontWeight: 500, transition: 'all .15s',
                background: isActive ? 'rgba(0,184,148,0.15)' : 'transparent',
                color: isActive ? '#00B894' : 'rgba(255,255,255,0.5)',
              })}
            >
              <Icon size={15} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {user && (
          <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00B894, #0984E3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 700
            }}>
              {user.full_name.charAt(0)}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 16px' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/atletas" element={<AthletesPage />} />
          <Route path="/partidas" element={<MatchesPage />} />
          <Route path="/partidas/:matchId/scout" element={<LiveScout />} />
          <Route path="/relatorios" element={<ReportsPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
        </Routes>
      </main>

      <ToastContainer />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
