import { useEffect } from 'react'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  [11, 12],
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
]

interface Props {
  landmarks: NormalizedLandmark[] | null
  canvasEl: HTMLCanvasElement | null
}

export default function SkeletonOverlay({ landmarks, canvasEl }: Props) {
  useEffect(() => {
    if (!canvasEl) return
    const ctx = canvasEl.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
    if (!landmarks || landmarks.length === 0) return

    const w = canvasEl.width
    const h = canvasEl.height

    // Connections
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.85)'
    ctx.lineWidth = 2
    for (const [a, b] of CONNECTIONS) {
      const la = landmarks[a]
      const lb = landmarks[b]
      if (!la || !lb) continue
      if ((la.visibility ?? 0) < 0.3 || (lb.visibility ?? 0) < 0.3) continue
      ctx.beginPath()
      ctx.moveTo(la.x * w, la.y * h)
      ctx.lineTo(lb.x * w, lb.y * h)
      ctx.stroke()
    }

    // Landmark dots
    for (const lm of landmarks) {
      if ((lm.visibility ?? 0) < 0.3) continue
      ctx.beginPath()
      ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#7c3aed'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }, [landmarks, canvasEl])

  return null
}