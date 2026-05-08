import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, ApiError } from '../../api/client'

const QUESTIONS = [
  { id: 'bowel_bladder', text: 'Have you noticed any loss of control of your bladder or bowels recently?' },
  { id: 'saddle_numbness', text: 'Do you have numbness or tingling in your groin or inner thighs (saddle area)?' },
  { id: 'progressive_weakness', text: 'Have you noticed progressive weakness in one or both legs in the last few days?' },
  { id: 'unexplained_weight_loss', text: 'Have you had unexplained weight loss of more than 5 kg in the past 3 months?' },
  { id: 'night_pain', text: 'Is your back pain worse at night and does it wake you from sleep?' },
  { id: 'fever', text: 'Have you had a fever, chills, or felt generally unwell along with your back pain?' },
] as const

type QuestionId = (typeof QUESTIONS)[number]['id']

type RedFlagResult = { result: 'safe' | 'warn' | 'block' }

export default function RedFlag() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Record<QuestionId, boolean>>({
    bowel_bladder: false,
    saddle_numbness: false,
    progressive_weakness: false,
    unexplained_weight_loss: false,
    night_pain: false,
    fever: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(id: QuestionId) {
    setAnswers(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { result } = await apiCall<RedFlagResult>('/intake/red-flag', {
        method: 'POST',
        body: JSON.stringify(answers),
      })
      if (result === 'block') {
        navigate('/blocked')
      } else {
        navigate('/onboarding/intake')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h1>Safety Screening</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>
        Please answer honestly. These questions help us make sure this programme is safe for you.
      </p>

      <form onSubmit={handleSubmit}>
        {QUESTIONS.map(q => (
          <label
            key={q.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              marginBottom: 20,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={answers[q.id]}
              onChange={() => toggle(q.id)}
              style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
            />
            <span>{q.text}</span>
          </label>
        ))}

        {error && (
          <p style={{ color: '#e53e3e', marginBottom: 16 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px 0', fontSize: 16, marginTop: 8 }}
        >
          {loading ? 'Checking…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}