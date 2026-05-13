import type { ScorerOutput } from '../../cv/scorers/base'

interface Props {
  output: ScorerOutput
}

function FormBadge({ score }: { score: number }) {
  if (score === 0) return null
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'
  const label = score >= 80 ? 'Great' : score >= 60 ? 'Good' : 'Needs work'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: color + '18', border: `1.5px solid ${color}40`,
      borderRadius: 20, padding: '3px 12px',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{score} — {label}</span>
    </div>
  )
}

export default function ExerciseHUD({ output }: Props) {
  const phase = output.currentPhase.replace(/_/g, ' ')

  return (
    <div style={{
      background: 'var(--purple-light)',
      border: '1.5px solid var(--purple-border)',
      borderRadius: 12,
      padding: '14px 16px',
    }}>
      {/* Rep counter + phase */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 2 }}>
            Reps
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--purple)', lineHeight: 1 }}>
            {output.repsDone}
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-muted)' }}>
              /{output.targetReps}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 2 }}>
            Phase
          </div>
          <div style={{
            fontSize: 15, fontWeight: 800, color: 'var(--purple)',
            background: '#fff', borderRadius: 8, padding: '4px 10px',
            border: '1px solid var(--purple-border)',
          }}>
            {phase}
          </div>
        </div>
      </div>

      {/* Form score badge */}
      {output.formScoreThisRep > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 4 }}>
            Last rep
          </div>
          <FormBadge score={output.formScoreThisRep} />
        </div>
      )}
    </div>
  )
}