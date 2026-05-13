import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { apiCall } from '../../api/client'
import { initPoseTracker, detectPose, disposePoseTracker } from '../../cv/poseTracker'
import type { ExerciseScorer, ScorerOutput } from '../../cv/scorers/base'
import { PelvicTiltScorer } from '../../cv/scorers/pelvicTilt'
import { GluteBridgeScorer } from '../../cv/scorers/gluteBridge'
import { CatCowScorer } from '../../cv/scorers/catCow'
import { BirdDogScorer } from '../../cv/scorers/birdDog'
import { DeadBugScorer } from '../../cv/scorers/deadBug'
import CameraView, { type CameraViewHandle } from './CameraView'
import SkeletonOverlay from './SkeletonOverlay'
import ExerciseHUD from './ExerciseHUD'
import SetupChecklist from './SetupChecklist'
import CoachingCueDisplay from './CoachingCueDisplay'
import ExerciseIntroCard from './ExerciseIntroCard'

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

function createScorer(exerciseId: string): ExerciseScorer | null {
  switch (exerciseId) {
    case 'pelvic_tilt': return new PelvicTiltScorer()
    case 'glute_bridge': return new GluteBridgeScorer()
    case 'cat_cow': return new CatCowScorer()
    case 'bird_dog': return new BirdDogScorer()
    case 'dead_bug': return new DeadBugScorer()
    default: return null
  }
}

function NprsSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="slider-wrapper">
      <div className="slider-row">
        <span className="slider-badge">{value}/10</span>
        <input type="range" min={0} max={10} value={value} onChange={e => onChange(Number(e.target.value))} />
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
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[] | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [fps, setFps] = useState(0)
  const [scorerOutput, setScorerOutput] = useState<ScorerOutput | null>(null)
  const [setupCountdown, setSetupCountdown] = useState(0)
  const [introReady, setIntroReady] = useState(false)

  const cameraRef = useRef<CameraViewHandle>(null)
  const rafRef = useRef(0)
  const scorerRef = useRef<ExerciseScorer | null>(null)
  const completeHandledRef = useRef(false)
  const lastIntroExIdxRef = useRef(-1)
  const lastSetupExIdxRef = useRef(-1)

  // Updated every render so rAF closure always has current state/handlers
  const handleCvDoneRef = useRef<(() => void) | null>(null)
  handleCvDoneRef.current = () => {
    const ex = exercises[exIdx]
    if (!ex) return
    // Collect all scored reps from the scorer
    if (scorerRef.current && scorerOutput) {
      const scored = scorerOutput.repScores.map((rs, i) => ({
        exercise_id: ex.exercise_id,
        set_number: Math.floor(i / ex.reps) + 1,
        rep_number: (i % ex.reps) + 1,
        form_score: rs.formScore,
      }))
      setAllReps(prev => [...prev, ...scored])
    }
    if (exIdx + 1 < exercises.length) {
      setExIdx(exIdx + 1)
      setCurrentSet(1)
      setCurrentRep(0)
    } else {
      setPhase('POST_PAIN')
    }
  }

  // Rest countdown
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

  // Reset introReady when entering a new CV exercise
  useEffect(() => {
    if (phase !== 'EXERCISES') return
    const ex = exercises[exIdx]
    if (ex?.type !== 'cv') return
    if (exIdx === lastIntroExIdxRef.current) return
    lastIntroExIdxRef.current = exIdx
    setIntroReady(false)
  }, [phase, exIdx])

  // When user clicks ready, start setup countdown
  useEffect(() => {
    if (!introReady) return
    if (phase !== 'EXERCISES') return
    const ex = exercises[exIdx]
    if (ex?.type !== 'cv') return
    if (lastSetupExIdxRef.current === exIdx) return
    lastSetupExIdxRef.current = exIdx
    setSetupCountdown(3)
  }, [introReady, phase, exIdx])

  // Setup countdown tick
  useEffect(() => {
    if (setupCountdown <= 0) return
    const t = setTimeout(() => setSetupCountdown(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [setupCountdown])

  // Pose tracking rAF loop — restarts when exercise/set changes for fresh closure
  useEffect(() => {
    if (phase !== 'EXERCISES' && phase !== 'RESTING') {
      cancelAnimationFrame(rafRef.current)
      return
    }

    // Create scorer for current exercise
    const ex = exercises[exIdx]
    if (phase === 'EXERCISES' && ex?.type === 'cv') {
      const s = createScorer(ex.exercise_id)
      if (s) {
        s.setup(ex.reps, ex.sets)
        scorerRef.current = s
        completeHandledRef.current = false
        setScorerOutput(null)
      }
    }

    let running = true
    let frameCount = 0
    let lastFpsTick = performance.now()

    async function start() {
      try { await initPoseTracker() } catch { return }
      function loop() {
        if (!running) return
        const video = cameraRef.current?.videoEl
        if (video && video.readyState >= 2) {
          const lms = detectPose(video, performance.now())
          setLandmarks(lms)

          if (phase === 'EXERCISES' && ex?.type === 'cv' && scorerRef.current && lms) {
            const out = scorerRef.current.processFrame(lms, performance.now())
            setScorerOutput(out)
            if (out.isComplete && !completeHandledRef.current) {
              completeHandledRef.current = true
              handleCvDoneRef.current?.()
            }
          }

          frameCount++
          const now = performance.now()
          if (now - lastFpsTick >= 1000) {
            setFps(frameCount)
            frameCount = 0
            lastFpsTick = now
          }
        }
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    start()
    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [phase, exIdx, currentSet])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      disposePoseTracker()
    }
  }, [])

  function handleRepDone() {
    const exercise = exercises[exIdx]
    const repNum = currentRep + 1
    setAllReps(prev => [...prev, {
      exercise_id: exercise.exercise_id,
      set_number: currentSet,
      rep_number: repNum,
      form_score: null,
    }])
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
        body: JSON.stringify({ pre_pain_nprs: prePain, post_pain_nprs: postPain, reps: allReps }),
      })
      setPhase('COMPLETE')
    } catch {
      setSaveError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const exercise = exercises[exIdx]
  const delta = prePain - postPain
  const showCamera = phase === 'EXERCISES' || phase === 'RESTING'
  const isCv = exercise?.type === 'cv' && scorerRef.current !== null

  // Red label shown during active CV tracking when body isn't properly detected
  const trackingIssue: string | null = (() => {
    if (!isCv || !introReady || setupCountdown > 0) return null
    if (!landmarks) return 'No body detected — check lighting and camera position'
    const fail = scorerOutput?.setupChecks.find(c => !c.pass)
    return fail ? `${fail.label} — counting paused` : null
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Camera + overlays — kept mounted so permission isn't re-requested */}
      <div style={{ display: showCamera ? 'block' : 'none' }}>
        <div style={{ position: 'relative' }}>
          <CameraView ref={cameraRef} onError={setCameraError} />
          <SkeletonOverlay landmarks={landmarks} canvasEl={cameraRef.current?.canvasEl ?? null} />

          {/* Setup checklist overlay */}
          {phase === 'EXERCISES' && introReady && setupCountdown > 0 && scorerOutput && (
            <SetupChecklist checks={scorerOutput.setupChecks} countdown={setupCountdown} />
          )}

          {/* Coaching cue overlay */}
          {phase === 'EXERCISES' && scorerOutput?.activeHint && introReady && setupCountdown === 0 && (
            <CoachingCueDisplay hint={scorerOutput.activeHint} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {cameraError
            ? <span className="alert alert-warn" style={{ fontSize: 12, padding: '3px 10px' }}>{cameraError}</span>
            : <span />}
          {fps > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fps} fps</span>}
        </div>
      </div>

      {/* PRE_PAIN */}
      {phase === 'PRE_PAIN' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <p className="section-label">Before we start</p>
            <h2>How is your back pain right now?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Rate from 0 (no pain) to 10 (worst possible)</p>
          </div>
          <NprsSlider value={prePain} onChange={setPrePain} />
          <button className="btn btn-primary" onClick={() => setPhase('EXERCISES')}>Start Exercises</button>
        </div>
      )}

      {/* EXERCISES */}
      {phase === 'EXERCISES' && exercise && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="section-label" style={{ margin: 0 }}>Exercise {exIdx + 1} of {exercises.length}</p>
            {exercise.hold_seconds ? (
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)', background: 'var(--purple-light)', padding: '3px 10px', borderRadius: 20, border: '1px solid var(--purple-border)' }}>
                Hold {exercise.hold_seconds}s
              </span>
            ) : null}
          </div>

          <div>
            <h2 style={{ marginBottom: 4 }}>{exercise.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
              {exercise.sets} sets × {exercise.reps} reps
              {exercise.rest_seconds ? ` · ${exercise.rest_seconds}s rest` : ''}
              {exercise.type === 'cv'
                ? <span style={{ color: 'var(--purple)', fontWeight: 600 }}> · Auto-tracked</span>
                : null}
            </p>
          </div>

          {/* Tracking status — red when body not detected or check failing */}
          {trackingIssue ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '8px 12px',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>{trackingIssue}</span>
            </div>
          ) : isCv && introReady && setupCountdown === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 8, padding: '8px 12px',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>Tracking active — counting reps</span>
            </div>
          ) : null}

          {/* CV exercise: show HUD */}
          {isCv && scorerOutput ? (
            <ExerciseHUD output={scorerOutput} />
          ) : (
            /* self_paced: show manual counter */
            <div style={{ background: 'var(--purple-light)', border: '1.5px solid var(--purple-border)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>Set</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--purple)' }}>{currentSet}/{exercise.sets}</div>
              </div>
              <div style={{ width: 1, height: 40, background: 'var(--purple-border)' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>Rep</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--purple)' }}>{currentRep}/{exercise.reps}</div>
              </div>
            </div>
          )}

          {/* Only show Rep Done for self_paced or if scorer not available */}
          {!isCv && (
            <button className="btn btn-primary" style={{ fontSize: 17, padding: '16px 28px' }} onClick={handleRepDone}>
              Rep Done
            </button>
          )}

          {isCv && introReady && setupCountdown === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
              Reps counting automatically — just move
            </p>
          )}

          {exercise.rationale && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>{exercise.rationale}</p>
          )}

          {/* Instructions card — always visible for reference, button removed after ready */}
          {exercise.type === 'cv' && (
            <ExerciseIntroCard
              exercise={exercise}
              onReady={!introReady ? () => setIntroReady(true) : undefined}
            />
          )}
        </div>
      )}

      {/* RESTING */}
      {phase === 'RESTING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
          <p className="section-label" style={{ margin: 0 }}>Rest</p>
          <h2 style={{ marginBottom: 0 }}>Set {currentSet} complete</h2>
          <div style={{ fontSize: 72, fontWeight: 900, color: 'var(--purple)', lineHeight: 1, padding: '8px 0' }}>
            {restLeft}<span style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-muted)' }}>s</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Next: Set {currentSet + 1} of {exercise?.sets}</p>
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setRestLeft(0)}>Skip Rest</button>
        </div>
      )}

      {/* POST_PAIN */}
      {phase === 'POST_PAIN' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <p className="section-label">All done!</p>
            <h2>How is your back pain now?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Rate from 0 (no pain) to 10 (worst possible)</p>
          </div>
          <NprsSlider value={postPain} onChange={setPostPain} />
          {saveError && <div className="alert alert-error">{saveError}</div>}
          <button className="btn btn-primary" disabled={saving} onClick={handleComplete}>
            {saving ? 'Saving...' : 'Finish Session'}
          </button>
        </div>
      )}

      {/* COMPLETE */}
      {phase === 'COMPLETE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 auto' }}>✓</div>
          <div>
            <h2>Session complete!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>{allReps.length} reps across {exercises.length} exercises</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: 'var(--purple-light)', border: '1.5px solid var(--purple-border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 6 }}>Before</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--purple)' }}>{prePain}/10</div>
            </div>
            <div style={{ flex: 1, background: delta > 0 ? '#f0fdf4' : delta < 0 ? '#fef2f2' : 'var(--purple-light)', border: `1.5px solid ${delta > 0 ? '#bbf7d0' : delta < 0 ? '#fecaca' : 'var(--purple-border)'}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 6 }}>After</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : 'var(--purple)' }}>{postPain}/10</div>
            </div>
          </div>
          {delta > 0 && <p style={{ color: '#16a34a', fontWeight: 700, fontSize: 15, margin: 0 }}>Pain down {delta} point{delta !== 1 ? 's' : ''}. Keep it up!</p>}
          {delta < 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>If pain worsened, rest today and flag it with your coach.</p>}
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      )}

    </div>
  )
}