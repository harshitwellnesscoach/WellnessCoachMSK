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

function ExerciseCard({ ex }: { ex: Exercise }) {
  const isCV = ex.type === 'cv'
  const detail = ex.hold_seconds
    ? `${ex.sets} set${ex.sets > 1 ? 's' : ''} · hold ${ex.hold_seconds}s`
    : `${ex.sets} × ${ex.reps} reps`

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      padding: '16px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Type badge */}
      <div style={{
        flexShrink: 0,
        width: 36,
        height: 36,
        borderRadius: 8,
        background: isCV ? 'var(--purple)' : '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 800,
        color: isCV ? '#fff' : '#6b7280',
      }}>
        {isCV ? 'CV' : 'SP'}
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, color: '#000', fontSize: 15, marginBottom: 2 }}>{ex.name}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: ex.rationale ? 4 : 0 }}>{detail} · rest {ex.rest_seconds}s</p>
        {ex.rationale && (
          <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>{ex.rationale}</p>
        )}
      </div>
    </div>
  )
}

interface Props {
  exercises: Exercise[]
  weekNumber: number
  generatedBy: 'claude' | 'fallback'
  programNotes?: string | null
}

export default function ExerciseList({ exercises, weekNumber, generatedBy, programNotes }: Props) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 28,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-muted)' }}>
          Week {weekNumber} Programme
        </p>
        {generatedBy === 'claude' && (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            background: 'var(--purple-light)',
            color: 'var(--purple)',
            border: '1px solid var(--purple-border)',
            borderRadius: 20,
            padding: '2px 8px',
          }}>
            AI personalised
          </span>
        )}
      </div>

      {programNotes && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{programNotes}</p>
      )}

      <div>
        {exercises.map(ex => (
          <ExerciseCard key={ex.exercise_id} ex={ex} />
        ))}
      </div>

      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
        CV = camera-scored exercise &nbsp;·&nbsp; SP = self-paced
      </p>
    </div>
  )
}