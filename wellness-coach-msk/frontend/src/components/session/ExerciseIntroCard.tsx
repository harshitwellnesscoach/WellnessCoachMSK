interface Exercise {
  exercise_id: string
  name: string
  sets: number
  reps: number
  hold_seconds?: number | null
}

interface Props {
  exercise: Exercise
  onReady?: () => void
}

const INSTRUCTIONS: Record<string, { steps: string[]; camera: string }> = {
  pelvic_tilt: {
    steps: [
      'Lie on your back on a firm surface',
      'Bend both knees, feet flat on the floor hip-width apart',
      'Arms relaxed at your sides, palms down',
      'Find your natural lower back arch — small gap between back and floor',
    ],
    camera: 'Position camera to your side at floor level so your full body is in frame',
  },
  glute_bridge: {
    steps: [
      'Lie on your back with knees bent, feet flat on the floor',
      'Feet hip-width apart, about 30 cm from your hips',
      'Arms flat at your sides, palms pressing down',
    ],
    camera: 'Position camera to your side at floor level so your full body is in frame',
  },
  cat_cow: {
    steps: [
      'Get onto your hands and knees on the floor',
      'Wrists directly under shoulders, knees directly under hips',
      'Start with a flat, neutral back',
      'Keep movements slow and controlled throughout',
    ],
    camera: 'Position camera to your side at floor level so your full body is in frame',
  },
  bird_dog: {
    steps: [
      'Get onto your hands and knees on the floor',
      'Wrists directly under shoulders, knees directly under hips',
      'Keep your back flat — do not let your hips rotate or tilt',
      'Brace your core before each rep',
    ],
    camera: 'Position camera to your side at floor level so your full body is in frame',
  },
  dead_bug: {
    steps: [
      'Lie on your back on a firm surface',
      'Raise both arms straight toward the ceiling',
      'Lift both knees to 90°, shins parallel to the floor',
      'Press your lower back firmly into the floor — keep it there throughout',
    ],
    camera: 'Position camera to your side at floor level so your full body is in frame',
  },
}

import { useEffect } from 'react'

function speak(sentences: string[]) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  sentences.forEach(text => {
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.88
    utt.pitch = 1.0
    utt.volume = 1.0
    window.speechSynthesis.speak(utt)
  })
}

export default function ExerciseIntroCard({ exercise, onReady }: Props) {
  const info = INSTRUCTIONS[exercise.exercise_id]

  // Read instructions aloud when the card first appears (onReady present = pre-start state)
  useEffect(() => {
    if (!onReady) return
    const lines: string[] = [
      `${exercise.name}.`,
      ...(info?.steps ?? [`Get into the starting position for ${exercise.name}.`]),
      ...(info ? [`Camera tip. ${info.camera}.`] : []),
      `Press I'm ready when you're in position.`,
    ]
    speak(lines)
    return () => { window.speechSynthesis?.cancel() }
  }, [exercise.exercise_id])

  function handleReady() {
    window.speechSynthesis?.cancel()
    onReady?.()
  }

  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid var(--purple-border)',
      borderRadius: 12,
      padding: '16px 16px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--purple)', margin: '0 0 3px' }}>
          How to do it
        </p>
        <h3 style={{ margin: '0 0 2px', fontSize: 16 }}>{exercise.name}</h3>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          {exercise.sets} sets · {exercise.reps} reps{exercise.hold_seconds ? ` · ${exercise.hold_seconds}s hold` : ''}
        </p>
      </div>

      {/* Steps */}
      {info ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {info.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--purple)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, marginTop: 1,
                }}>
                  {i + 1}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#1a1a1a', lineHeight: 1.45 }}>{step}</p>
              </div>
            ))}
          </div>

          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>📷</span>
            <p style={{ margin: 0, fontSize: 12, color: '#92400e', lineHeight: 1.4 }}>{info.camera}</p>
          </div>
        </>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Get into the starting position for {exercise.name}.
        </p>
      )}

      {/* Ready button — only shown before exercise starts */}
      {onReady && (
        <button
          className="btn btn-primary"
          style={{ padding: '11px 28px', fontSize: 14 }}
          onClick={handleReady}
        >
          I'm ready - start
        </button>
      )}
    </div>
  )
}