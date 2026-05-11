import { useState } from 'react'
import { apiCall } from '../../api/client'

const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

function levelColor(n: number): string {
  if (n <= 3) return '#16a34a'
  if (n <= 6) return '#d97706'
  return '#dc2626'
}

export default function PainLogInline() {
  const [selected, setSelected] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSelect(n: number) {
    setSelected(n)
    setLoading(true)
    try {
      await apiCall('/pain/log', {
        method: 'POST',
        body: JSON.stringify({ nprs: n, context: 'daily_log' }),
      })
      setSaved(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 28,
    }}>
      <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-muted)', marginBottom: 4 }}>
        How is your pain right now?
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        0 = no pain &nbsp;·&nbsp; 10 = worst imaginable
      </p>

      {saved ? (
        <p style={{ fontWeight: 700, color: levelColor(selected!), fontSize: 15 }}>
          Logged: {selected} / 10 — saved
        </p>
      ) : (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {LEVELS.map(n => (
            <button
              key={n}
              onClick={() => handleSelect(n)}
              disabled={loading}
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                border: selected === n ? `2px solid ${levelColor(n)}` : '1.5px solid var(--border)',
                background: selected === n ? `${levelColor(n)}15` : '#fff',
                color: levelColor(n),
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.1s',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}