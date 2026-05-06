import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/signin'
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard</h1>
        <button onClick={handleSignOut}>Sign out</button>
      </div>
      <p>Logged in as: <strong>{email}</strong></p>
      <p style={{ color: '#888' }}>— Phase 4: stats and program will appear here —</p>
    </div>
  )
}