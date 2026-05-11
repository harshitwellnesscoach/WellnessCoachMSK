import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/signin'
  }

  const firstName = email?.split('@')[0] ?? 'there'

  return (
    <div style={{ minHeight: '100svh', background: '#fff' }}>
      <nav className="navbar">
        <Logo />
        <button className="btn btn-outline" onClick={handleSignOut}>
          Sign out
        </button>
      </nav>

      <div className="dashboard-body">
        <div className="welcome-card">
          <p className="section-label" >MSK Programme</p>
          <h1 style={{ marginBottom: 8 }}>Welcome, {firstName}</h1>
          <p>Your personalised back pain programme is being built. Check back soon.</p>
        </div>

        <div style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '24px 28px',
        }}>
          <p className="section-label" color={"black"}>Coming soon — Phase 4</p>
          <p style={{ fontSize: 15, color:  "black"}}>
            Your exercise programme, pain tracking, session runner, and weekly check-ins will appear here.
          </p>
        </div>
      </div>
    </div>
  )
}