import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall } from '../api/client'
import Logo from '../components/Logo'
import SessionRunner from '../components/session/SessionRunner'

interface Exercise {
  exercise_id: string
  name: string
  type: 'cv' | 'self_paced'
  sets: number
  reps: number
  hold_seconds?: number | null
  rest_seconds: number
  rationale?: string | null
}

interface Program {
  week_number: number
  exercises: Exercise[]
}

export default function Session() {
  const navigate = useNavigate()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const program = await apiCall<Program>('/program/current')
        const { session_id } = await apiCall<{ session_id: string }>(
          `/session/start?week_number=${program.week_number}`,
          { method: 'POST' },
        )
        setExercises(program.exercises)
        setSessionId(session_id)
      } catch {
        setError("Couldn't start session. Make sure you have a programme and the backend is running.")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  return (
    <div style={{ minHeight: '100svh', background: '#fff' }}>
      <nav className="navbar">
        <Logo />
        <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
          Back
        </button>
      </nav>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
        {loading && (
          <p style={{ color: 'var(--text-muted)' }}>Starting your session...</p>
        )}
        {error && (
          <div className="alert alert-error">{error}</div>
        )}
        {sessionId && (
          <SessionRunner sessionId={sessionId} exercises={exercises} />
        )}
      </div>
    </div>
  )
}