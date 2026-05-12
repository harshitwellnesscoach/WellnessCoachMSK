import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, ApiError } from '../../api/client'
import Logo from '../../components/Logo'

type PainLocation =
  | 'lower_back_central' | 'lower_back_left' | 'lower_back_right'
  | 'bilateral_leg' | 'left_leg' | 'right_leg'

type Occupation = 'desk' | 'manual' | 'mixed' | 'retired_student_other'

const PAIN_LOCATIONS: { value: PainLocation; label: string }[] = [
  { value: 'lower_back_central', label: 'Lower back — centre' },
  { value: 'lower_back_left',    label: 'Lower back — left side' },
  { value: 'lower_back_right',   label: 'Lower back — right side' },
  { value: 'bilateral_leg',      label: 'Both legs' },
  { value: 'left_leg',           label: 'Left leg only' },
  { value: 'right_leg',          label: 'Right leg only' },
]

const OCCUPATIONS: { value: Occupation; label: string }[] = [
  { value: 'desk',                  label: 'Desk / office work' },
  { value: 'manual',                label: 'Manual / physical labour' },
  { value: 'mixed',                 label: 'Mixed' },
  { value: 'retired_student_other', label: 'Retired / student / other' },
]

export default function Intake() {
  const navigate = useNavigate()
  const [painLocation, setPainLocation] = useState<PainLocation | ''>('')
  const [nprs, setNprs] = useState(5)
  const [durationWeeks, setDurationWeeks] = useState('')
  const [priorCare, setPriorCare] = useState(false)
  const [occupation, setOccupation] = useState<Occupation | ''>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!painLocation) { setError('Please select your pain location.'); return }
    if (!durationWeeks || Number(durationWeeks) < 0) { setError('Please enter how many weeks.'); return }
    setLoading(true)
    setError(null)
    try {
      await apiCall('/intake/profile', {
        method: 'POST',
        body: JSON.stringify({
          pain_location: painLocation,
          nprs_baseline: nprs,
          duration_weeks: Number(durationWeeks),
          prior_care: priorCare,
          occupation: occupation || null,
          notes: notes || null,
        }),
      })
      navigate('/dashboard')
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
        <div className="stepper-step done">
          <span className="stepper-num">✓</span>
          <span className="stepper-label">Safety check</span>
        </div>
        <div className="stepper-line" />
        <div className="stepper-step active">
          <span className="stepper-num">2</span>
          <span className="stepper-label">Your profile</span>
        </div>
      </div>

      <div className="card card-wide">
        <h1 style={{ marginBottom: 8 }}>Tell us about your pain</h1>
        <p style={{ marginBottom: 32, color: "black" }}>
          This helps us build a programme tailored specifically to you.
        </p>

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-field">
            <label className="form-label">Where is your pain? *</label>
            <select
              className="form-select"
              value={painLocation}
              onChange={e => setPainLocation(e.target.value as PainLocation)}
              required
            >
              <option value="">Select location…</option>
              {PAIN_LOCATIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Pain intensity right now *</label>
            <div className="slider-wrapper">
              <div className="slider-row">
                <input
                  type="range" min={0} max={10} value={nprs}
                  onChange={e => setNprs(Number(e.target.value))}
                />
                <span className="slider-badge">{nprs} / 10</span>
              </div>
              <div className="slider-labels">
                <span>0 — No pain</span>
                <span>10 — Worst imaginable</span>
              </div>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label" color={"black"}>How many weeks have you had this pain? *</label>
            <input
              className="form-input"
              type="number" min={0}
              value={durationWeeks}
              onChange={e => setDurationWeeks(e.target.value)}
              placeholder="e.g. 6"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Previous treatment</label>
            <label className="check-card" style={{ marginTop: 4 }}>
              <input type="checkbox" checked={priorCare} onChange={e => setPriorCare(e.target.checked)} />
              <span className="check-card-text">I have already seen a GP or physiotherapist for this episode</span>
            </label>
          </div>

          <div className="form-field">
            <label className="form-label">
              Occupation{' '}
              <span style={{ fontWeight: 400, color: 'var(--text)' }}>(optional)</span>
            </label>
            <select
              className="form-select"
              value={occupation}
              onChange={e => setOccupation(e.target.value as Occupation)}
            >
              <option value="">Prefer not to say</option>
              {OCCUPATIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">
              Anything else we should know?{' '}
              <span style={{ fontWeight: 400, color: 'var(--text)' }}>(optional)</span>
            </label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={500} rows={4}
              placeholder="Other symptoms, concerns, or context…"
            />
            <span className="char-count">{notes.length} / 500</span>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Start my programme →'}
          </button>
        </form>
      </div>
    </div>
  )
}