import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, ApiError } from '../../api/client'
import Logo from '../../components/Logo'

const QUESTIONS = [
  { id: 'bowel_bladder',         text: 'Have you noticed any loss of control of your bladder or bowels recently?' },
  { id: 'saddle_numbness',       text: 'Do you have numbness or tingling in your groin or inner thighs (saddle area)?' },
  { id: 'progressive_weakness',  text: 'Have you noticed progressive weakness in one or both legs in the last few days?' },
  { id: 'unexplained_weight_loss', text: 'Have you had unexplained weight loss of more than 5 kg in the past 3 months?' },
  { id: 'night_pain',            text: 'Is your back pain worse at night and does it wake you from sleep?' },
  { id: 'fever',                 text: 'Have you had a fever, chills, or felt generally unwell along with your back pain?' },
] as const

type QuestionId = (typeof QUESTIONS)[number]['id']
type RedFlagResult = { result: 'safe' | 'warn' | 'block' }

export default function RedFlag() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Record<QuestionId, boolean>>({
    bowel_bladder: false, saddle_numbness: false, progressive_weakness: false,
    unexplained_weight_loss: false, night_pain: false, fever: false,
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
      navigate(result === 'block' ? '/blocked' : '/onboarding/intake')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="page-onboarding">
      <div style={{ marginBottom: 40 }}>
        <Logo />
      </div>

      {/* Stepper */}
      <div className="stepper">
        <div className="stepper-step active">
          <span className="stepper-num">1</span>
          <span className="stepper-label">Safety check</span>
        </div>
        <div className="stepper-line" />
        <div className="stepper-step pending">
          <span className="stepper-num">2</span>
          <span className="stepper-label">Your profile</span>
        </div>
      </div>

      <div className="card card-wide">
        <h1 style={{ marginBottom: 8 }}>Safety screening</h1>
        <p style={{ marginBottom: 28, color: 'var(--text-muted)' }}>
          Please answer honestly — these help us make sure this programme is safe for you.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-stack" style={{ marginBottom: 24 }}>
            {QUESTIONS.map(q => (
              <label key={q.id} className="check-card">
                <input type="checkbox" checked={answers[q.id]} onChange={() => toggle(q.id)} />
                <span className="check-card-text">{q.text}</span>
              </label>
            ))}
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Checking…' : 'Continue →'}
          </button>
        </form>
      </div>
    </div>
  )
}