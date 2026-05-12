import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall } from '../../api/client'

type Phase = 'PRE_PAIN' | 'EXERCISES' | 'RESTING' | 'POST_PAIN' | 'COMPLETE'

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

interface RepRecord {
  exercise_id: string
  set_number: number
  rep_number: number
  form_score: number | null
}

interface Props {
  sessionId: string
  exercises: Exercise[]
}

function NprsSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="slider-wrapper">
      <div className="slider-row">
        <span className="slider-badge">{value}/10</span>
        <input
          type="range"
          min={0}
          max={10}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
      </div>
      <div className="slider-labels">
        <span>0 — No pain</span>
        <span>10 — Worst possible</span>
      </div>
    </div>
  )
}

export default function SessionRunner({ sessionId, exercises }: Props) {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('PRE_PAIN')
  const [prePain, setPrePain] = useState(5)
  const [postPain, setPostPain] = useState(5)
  const [exIdx, setExIdx] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [currentRep, setCurrentRep] = useState(0)
  const [allReps, setAllReps] = useState<RepRecord[]>([])
  const [restLeft, setRestLeft] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const exercise = exercises[exIdx]

  // Rest countdown using setTimeout chain
  useEffect(() => {
    if (phase !== 'RESTING') return
    if (restLeft <= 0) {
      setCurrentSet(s => s + 1)
      setCurrentRep(0)
      setPhase('EXERCISES')
      return
    }
    const t = setTimeout(() => setRestLeft(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, restLeft])

  function handleRepDone() {
    const repNum = currentRep + 1
    const updated = [...allReps, {
      exercise_id: exercise.exercise_id,
      set_number: currentSet,
      rep_number: repNum,
      form_score: null,
    }]
    setAllReps(updated)

    if (repNum >= exercise.reps) {
      if (currentSet < exercise.sets) {
        setRestLeft(exercise.rest_seconds || 30)
        setPhase('RESTING')
      } else if (exIdx + 1 < exercises.length) {
        setExIdx(exIdx + 1)
        setCurrentSet(1)
        setCurrentRep(0)
      } else {
        setPhase('POST_PAIN')
      }
    } else {
      setCurrentRep(repNum)
    }
  }

  async function handleComplete() {
    setSaving(true)
    setSaveError(null)
    try {
      await apiCall(`/session/${sessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          pre_pain_nprs: prePain,
          post_pain_nprs: postPain,
          reps: allReps,
        }),
      })
      setPhase('COMPLETE')
    } catch {
      setSaveError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (phase === 'PRE_PAIN') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <p className="section-label">Before we start</p>
          <h2>How is your back pain right now?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Rate from 0 (no pain) to 10 (worst possible)</p>
        </div>
        <NprsSlider value={prePain} onChange={setPrePain} />
        <button className="btn btn-primary" onClick={() => setPhase('EXERCISES')}>
          Start Exercises
        </button>
      </div>
    )
  }

  if (phase === 'RESTING') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center' }}>
        <p className="section-label" style={{ margin: 0 }}>Rest</p>
        <h2 style={{ marginBottom: 0 }}>Set {currentSet} complete</h2>
        <div style={{
          fontSize: 80,
          fontWeight: 900,
          color: 'var(--purple)',
          lineHeight: 1,
          padding: '12px 0',
        }}>
          {restLeft}
          <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-muted)' }}>s</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
          Next: Set {currentSet + 1} of {exercise.sets}
        </p>
        <button
          className="btn btn-outline"
          style={{ width: '100%' }}
          onClick={() => {
            setRestLeft(0)
          }}
        >
          Skip Rest
        </button>
      </div>
    )
  }

  if (phase === 'EXERCISES' && exercise) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="section-label" style={{ margin: 0 }}>
            Exercise {exIdx + 1} of {exercises.length}
          </p>
          {exercise.hold_seconds ? (
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--purple)',
              background: 'var(--purple-light)',
              padding: '3px 10px',
              borderRadius: 20,
              border: '1px solid var(--purple-border)',
            }}>
              Hold {exercise.hold_seconds}s
            </span>
          ) : null}
        </div>

        <div>
          <h2 style={{ marginBottom: 4 }}>{exercise.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            {exercise.sets} sets × {exercise.reps} reps
            {exercise.rest_seconds ? ` · ${exercise.rest_seconds}s rest` : ''}
          </p>
        </div>

        <div style={{
          background: 'var(--purple-light)',
          border: '1.5px solid var(--purple-border)',
          borderRadius: 16,
          padding: '28px 16px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--purple)',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}>
            Set {currentSet} of {exercise.sets}
          </div>
          <div style={{ fontSize: 72, fontWeight: 900, color: 'var(--purple)', lineHeight: 1 }}>
            {currentRep}
            <span style={{ fontSize: 32, fontWeight: 600, color: 'var(--text-muted)' }}>
              /{exercise.reps}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>reps done this set</div>
        </div>

        <button
          className="btn btn-primary"
          style={{ fontSize: 17, padding: '16px 28px' }}
          onClick={handleRepDone}
        >
          Rep Done
        </button>

        {exercise.rationale ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            {exercise.rationale}
          </p>
        ) : null}
      </div>
    )
  }

  if (phase === 'POST_PAIN') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <p className="section-label">All done!</p>
          <h2>How is your back pain now?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Rate from 0 (no pain) to 10 (worst possible)</p>
        </div>
        <NprsSlider value={postPain} onChange={setPostPain} />
        {saveError && <div className="alert alert-error">{saveError}</div>}
        <button
          className="btn btn-primary"
          disabled={saving}
          onClick={handleComplete}
        >
          {saving ? 'Saving...' : 'Finish Session'}
        </button>
      </div>
    )
  }

  if (phase === 'COMPLETE') {
    const delta = prePain - postPain
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center' }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: '#16a34a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          fontWeight: 900,
          color: '#fff',
          margin: '0 auto',
        }}>
          ✓
        </div>
        <div>
          <h2>Session complete!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
            {allReps.length} reps across {exercises.length} exercises
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            flex: 1,
            background: 'var(--purple-light)',
            border: '1.5px solid var(--purple-border)',
            borderRadius: 12,
            padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 6 }}>
              Before
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--purple)' }}>{prePain}/10</div>
          </div>
          <div style={{
            flex: 1,
            background: delta > 0 ? '#f0fdf4' : delta < 0 ? '#fef2f2' : 'var(--purple-light)',
            border: `1.5px solid ${delta > 0 ? '#bbf7d0' : delta < 0 ? '#fecaca' : 'var(--purple-border)'}`,
            borderRadius: 12,
            padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 6 }}>
              After
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : 'var(--purple)' }}>
              {postPain}/10
            </div>
          </div>
        </div>

        {delta > 0 && (
          <p style={{ color: '#16a34a', fontWeight: 700, fontSize: 15, margin: 0 }}>
            Pain down {delta} point{delta !== 1 ? 's' : ''}. Keep it up!
          </p>
        )}
        {delta < 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            If pain worsened, rest today and flag it with your coach.
          </p>
        )}

        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    )
  }

  return null
}