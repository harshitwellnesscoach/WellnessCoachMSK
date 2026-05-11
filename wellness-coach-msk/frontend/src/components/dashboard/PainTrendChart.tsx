interface DataPoint {
  date: string | null
  avg_nprs: number
}

export default function PainTrendChart({ trend }: { trend: DataPoint[] }) {
  const W = 560
  const H = 120
  const PAD = { top: 12, right: 16, bottom: 28, left: 28 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const points = trend.length > 0 ? trend : Array(14).fill({ date: null, avg_nprs: 0 })
  const maxNprs = 10

  const cx = (i: number) => PAD.left + (i / (points.length - 1)) * innerW
  const cy = (v: number) => PAD.top + innerH - (v / maxNprs) * innerH

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${cx(i).toFixed(1)} ${cy(p.avg_nprs).toFixed(1)}`)
    .join(' ')

  const areaD = `${pathD} L ${cx(points.length - 1).toFixed(1)} ${(PAD.top + innerH).toFixed(1)} L ${PAD.left.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} Z`

  const yTicks = [0, 5, 10]

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 28,
    }}>
      <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-muted)', marginBottom: 16 }}>
        Pain Trend (14 days)
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Y grid lines */}
        {yTicks.map(v => (
          <g key={v}>
            <line
              x1={PAD.left} y1={cy(v)}
              x2={PAD.left + innerW} y2={cy(v)}
              stroke="#f0f0f0" strokeWidth="1"
            />
            <text x={PAD.left - 6} y={cy(v) + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{v}</text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="rgba(124,58,237,0.07)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={cx(i)} cy={cy(p.avg_nprs)} r="3" fill="#7c3aed" />
        ))}

        {/* X axis labels — show day 1, 7, 14 */}
        {[0, 6, 13].map(i => (
          <text key={i} x={cx(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {points[i]?.date ?? `Day ${i + 1}`}
          </text>
        ))}
      </svg>
    </div>
  )
}