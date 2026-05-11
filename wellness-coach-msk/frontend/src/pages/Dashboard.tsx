import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { apiCall } from '../api/client'
import Logo from '../components/Logo'
import ProgressBlock from '../components/dashboard/ProgressBlock'
import PainTrendChart from '../components/dashboard/PainTrendChart'
import PainLogInline from '../components/dashboard/PainLogInline'

interface Stats {
  total_sessions: number
  streak_days: number
  avg_form_score: number | null
  latest_odi_score: number | null
  current_week: number
}

interface TrendPoint {
  date: string | null
  avg_nprs: number
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))

    Promise.all([
      apiCall<Stats>('/dashboard/stats'),
      apiCall<{ trend: TrendPoint[] }>('/pain/trend'),
    ])
      .then(([s, t]) => {
        setStats(s)
        setTrend(t.trend)
      })
      .catch(() => setError('Could not load dashboard data. Is the backend running?'))
      .finally(() => setLoadingStats(false))
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/signin'
  }

  const firstName = email?.split('@')[0] ?? 'there'

  return (
    <div style={{ minHeight: '100svh', background: '#fff' }}>
      {/* Navbar */}
      <nav className="navbar">
        <Logo />
        <button className="btn btn-outline" onClick={handleSignOut}>Sign out</button>
      </nav>

      <div className="dashboard-body">
        {/* Welcome banner */}
        <div className="welcome-card" style={{ marginBottom: 28 }}>
          <p className="section-label">MSK Programme</p>
          <h1 style={{ marginBottom: 8 }}>Welcome, {firstName}</h1>
          <p>Your personalised back pain programme. Complete your daily session to build strength and reduce pain.</p>
          <button
            className="btn"
            onClick={() => navigate('/session')}
            style={{
              marginTop: 20,
              background: '#fff',
              color: 'var(--purple)',
              fontWeight: 700,
              width: 'auto',
              padding: '10px 24px',
              borderRadius: 50,
            }}
          >
            Start today's session
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 24 }}>{error}</div>
        )}

        {/* Loading */}
        {loadingStats && !error && (
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Loading your stats...</p>
        )}

        {/* Stats */}
        {stats && <ProgressBlock stats={stats} />}

        {/* Pain log */}
        <PainLogInline />

        {/* Trend chart */}
        <PainTrendChart trend={trend} />

        {/* Coming soon */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px 24px',
        }}>
          <p className="section-label">Coming soon</p>
          <p style={{ fontSize: 15, color: '#1a1a1a' }}>
            Your exercise programme, ODI assessments, and AI coach check-ins will appear here in the next phases.
          </p>
        </div>
      </div>
    </div>
  )
}