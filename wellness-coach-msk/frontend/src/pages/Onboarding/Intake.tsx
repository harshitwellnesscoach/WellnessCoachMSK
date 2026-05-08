import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, ApiError } from '../../api/client'

type PainLocation =
  | 'lower_back_central'
  | 'lower_back_left'
  | 'lower_back_right'
  | 'bilateral_leg'
  | 'left_leg'
  | 'right_leg'

type Occupation = 'desk' | 'manual' | 'mixed' | 'retired_student_other'

const PAIN_LOCATION_LABELS: Record<PainLocation, string> = {
  lower_back_central: 'Lower back (centre)',
  lower_back_left: 'Lower back (left side)',
  lower_back_right: 'Lower back (right side)',
  bilateral_leg: 'Both legs',
  left_leg: 'Left leg',
  right_leg: 'Right leg',
}

const OCCUPATION_LABELS: Record<Occupation, string> = {
  desk: 'Desk / office work',
  manual: 'Manual / physical labour',
  mixed: 'Mixed',
  retired_student_other: 'Retired / student / other',
}

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
    if (!painLocation) { setError('Please select a pain location.'); return }
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h1>Tell us about your pain</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>
        This helps us build a programme tailored to you.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
            Where is your pain? *
          </label>
          <select
            value={painLocation}
            onChange={e => setPainLocation(e.target.value as PainLocation)}
            style={{ width: '100%', padding: '10px 12px', fontSize: 15 }}
            required
          >
            <option value="">Select location…</option>
            {(Object.keys(PAIN_LOCATION_LABELS) as PainLocation[]).map(key => (
              <option key={key} value={key}>{PAIN_LOCATION_LABELS[key]}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
            Pain intensity right now: <strong>{nprs} / 10</strong>
          </label>
          <input
            type="range"
            min={0}
            max={10}
            value={nprs}
            onChange={e => setNprs(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888' }}>
            <span>0 — No pain</span>
            <span>10 — Worst imaginable</span>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
            How many weeks have you had this pain? *
          </label>
          <input
            type="number"
            min={0}
            value={durationWeeks}
            onChange={e => setDurationWeeks(e.target.value)}
            placeholder="e.g. 6"
            style={{ width: '100%', padding: '10px 12px', fontSize: 15 }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={priorCare}
              onChange={e => setPriorCare(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span>I have already seen a GP or physiotherapist for this episode</span>
          </label>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
            Occupation (optional)
          </label>
          <select
            value={occupation}
            onChange={e => setOccupation(e.target.value as Occupation)}
            style={{ width: '100%', padding: '10px 12px', fontSize: 15 }}
          >
            <option value="">Prefer not to say</option>
            {(Object.keys(OCCUPATION_LABELS) as Occupation[]).map(key => (
              <option key={key} value={key}>{OCCUPATION_LABELS[key]}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
            Anything else you'd like us to know? (optional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Describe any other symptoms, concerns, or context…"
            style={{ width: '100%', padding: '10px 12px', fontSize: 15, resize: 'vertical' }}
          />
          <div style={{ textAlign: 'right', fontSize: 13, color: '#888' }}>{notes.length}/500</div>
        </div>

        {error && <p style={{ color: '#e53e3e', margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px 0', fontSize: 16 }}
        >
          {loading ? 'Saving…' : 'Start my programme'}
        </button>
      </form>
    </div>
  )
}