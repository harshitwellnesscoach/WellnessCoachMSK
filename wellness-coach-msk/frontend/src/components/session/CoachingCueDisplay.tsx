import { useEffect, useRef } from 'react'
import type { CoachingHint } from '../../cv/scorers/base'

interface Props {
  hint: CoachingHint | null
}

export default function CoachingCueDisplay({ hint }: Props) {
  const lastIdRef = useRef('')
  const lastTimeRef = useRef(0)

  useEffect(() => {
    if (!hint) return
    const now = Date.now()
    // Don't repeat the same cue within 5 seconds
    if (hint.id === lastIdRef.current && now - lastTimeRef.current < 5000) return
    lastIdRef.current = hint.id
    lastTimeRef.current = now

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(hint.text)
      utt.rate = 0.9
      utt.pitch = 1.0
      utt.volume = 0.85
      window.speechSynthesis.speak(utt)
    }
  }, [hint])

  if (!hint) return null

  const bg = hint.priority === 'warn' ? '#fef9c3' : 'rgba(0,0,0,0.65)'
  const color = hint.priority === 'warn' ? '#92400e' : '#fff'

  return (
    <div style={{
      position: 'absolute',
      bottom: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      background: bg,
      color,
      padding: '8px 18px',
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      maxWidth: '90%',
      textAlign: 'center',
    }}>
      {hint.text}
    </div>
  )
}