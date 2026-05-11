interface Stats {
  total_sessions: number
  streak_days: number
  avg_form_score: number | null
  latest_odi_score: number | null
  current_week: number
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px 24px',
      flex: '1 1 140px',
    }}>
      <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-muted)', marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 800, color: '#000', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

export default function ProgressBlock({ stats }: { stats: Stats }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
      <StatCard label="Week" value={`Week ${stats.current_week}`} sub="of your programme" />
      <StatCard label="Sessions" value={stats.total_sessions} sub="completed" />
      <StatCard label="Streak" value={stats.streak_days} sub="days in a row" />
      <StatCard
        label="Form Score"
        value={stats.avg_form_score != null ? `${stats.avg_form_score}%` : '—'}
        sub="average accuracy"
      />
      <StatCard
        label="Disability"
        value={stats.latest_odi_score != null ? `${stats.latest_odi_score}%` : '—'}
        sub="ODI score"
      />
    </div>
  )
}