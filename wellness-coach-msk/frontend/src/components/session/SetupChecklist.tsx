import type { SetupCheck } from '../../cv/scorers/base'

interface Props {
  checks: SetupCheck[]
  countdown: number
}

export default function SetupChecklist({ checks, countdown }: Props) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,0,0,0.72)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      borderRadius: 12,
      padding: 24,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
        Get into position
      </div>

      {checks.map(c => (
        <div key={c.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: c.pass ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)',
          border: `1px solid ${c.pass ? '#16a34a80' : '#dc262680'}`,
          borderRadius: 10, padding: '8px 14px', width: '100%', maxWidth: 280,
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            background: c.pass ? '#16a34a' : '#dc2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 900, color: '#fff',
          }}>
            {c.pass ? '✓' : '✕'}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{c.label}</span>
        </div>
      ))}

      {countdown > 0 && (
        <div style={{ marginTop: 8, fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
          {countdown}
        </div>
      )}
    </div>
  )
}