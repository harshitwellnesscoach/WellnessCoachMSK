import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { angleDeg, isVisible } from '../geometry'
import type {
  CoachingHint,
  ExerciseScorer,
  RepScore,
  ScorerOutput,
  SetupCheck,
} from './base'

// MediaPipe landmark indices
const L_SHOULDER = 11
const R_SHOULDER = 12
const L_HIP = 23
const R_HIP = 24
const L_KNEE = 25
const R_KNEE = 26

type Phase = 'START' | 'TILT' | 'HOLD' | 'RETURN'

export class PelvicTiltScorer implements ExerciseScorer {
  readonly exerciseId = 'pelvic_tilt'

  private targetReps = 10
  private targetSets = 2
  private repsDone = 0
  private phase: Phase = 'START'
  private repScores: RepScore[] = []
  private repAngles: number[] = []
  private holdFrames = 0

  // Angle thresholds (degrees) -- tuned for supine pelvic tilt viewed from the side
  private readonly TILT_ENTER_THRESHOLD = 12   // lumbar flattens past this -> TILT phase
  private readonly TILT_RETURN_THRESHOLD = 6    // angle recovers below this -> RETURN phase
  private readonly HOLD_FRAMES_REQUIRED = 8     // ~250ms at 30fps

  setup(targetReps: number, targetSets: number): void {
    this.targetReps = targetReps
    this.targetSets = targetSets
  }

  reset(): void {
    this.repsDone = 0
    this.phase = 'START'
    this.repScores = []
    this.repAngles = []
    this.holdFrames = 0
  }

  processFrame(landmarks: NormalizedLandmark[], _timestampMs: number): ScorerOutput {
    const setupChecks = this._runSetupChecks(landmarks)
    const allPass = setupChecks.every((c) => c.pass)

    if (!allPass || this.repsDone >= this.targetReps * this.targetSets) {
      return this._buildOutput(setupChecks, null)
    }

    const lHip = landmarks[L_HIP]
    const rHip = landmarks[R_HIP]
    const lKnee = landmarks[L_KNEE]
    const rKnee = landmarks[R_KNEE]
    const lShoulder = landmarks[L_SHOULDER]
    const rShoulder = landmarks[R_SHOULDER]

    const hipMid = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 }
    const kneeMid = { x: (lKnee.x + rKnee.x) / 2, y: (lKnee.y + rKnee.y) / 2 }
    const shoulderMid = { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 }

    const pelvisAngle = angleDeg(kneeMid, hipMid, shoulderMid)
    this.repAngles.push(pelvisAngle)

    let hint: CoachingHint | null = null

    switch (this.phase) {
      case 'START':
        if (pelvisAngle > this.TILT_ENTER_THRESHOLD) {
          this.phase = 'TILT'
          this.holdFrames = 0
        } else {
          hint = { id: 'start_cue', text: 'Flatten your lower back to the floor', priority: 'info' }
        }
        break

      case 'TILT':
        this.holdFrames++
        if (this.holdFrames >= this.HOLD_FRAMES_REQUIRED) {
          this.phase = 'HOLD'
        }
        hint = { id: 'hold_cue', text: 'Hold -- breathe out', priority: 'info' }
        break

      case 'HOLD':
        if (pelvisAngle < this.TILT_RETURN_THRESHOLD) {
          this.phase = 'RETURN'
        }
        hint = { id: 'hold_cue', text: 'Hold -- breathe out', priority: 'info' }
        break

      case 'RETURN':
        if (pelvisAngle < this.TILT_RETURN_THRESHOLD / 2) {
          const score = this._scoreRep()
          this.repScores.push({
            repNumber: this.repsDone + 1,
            formScore: score,
            hints: score < 60
              ? [{ id: 'form_low', text: 'Try to hold longer at the top', priority: 'warn' }]
              : [],
          })
          this.repsDone++
          this.phase = 'START'
          this.repAngles = []
          this.holdFrames = 0
        }
        hint = { id: 'return_cue', text: 'Slowly return to start', priority: 'info' }
        break
    }

    return this._buildOutput(setupChecks, hint)
  }

  private _scoreRep(): number {
    if (this.repAngles.length === 0) return 50
    const maxAngle = Math.max(...this.repAngles)
    const angleScore = Math.min(100, (maxAngle / 20) * 100)
    const holdScore = Math.min(100, (this.holdFrames / (this.HOLD_FRAMES_REQUIRED * 1.5)) * 100)
    return Math.round(angleScore * 0.6 + holdScore * 0.4)
  }

  private _runSetupChecks(landmarks: NormalizedLandmark[]): SetupCheck[] {
    return [
      {
        id: 'full_body',
        label: 'Full body visible',
        pass:
          isVisible(landmarks[L_SHOULDER]) &&
          isVisible(landmarks[R_SHOULDER]) &&
          isVisible(landmarks[L_HIP]) &&
          isVisible(landmarks[R_HIP]) &&
          isVisible(landmarks[L_KNEE]) &&
          isVisible(landmarks[R_KNEE]),
      },
      {
        id: 'lying_position',
        label: 'Lying on back detected',
        pass: landmarks[L_HIP].y > landmarks[L_SHOULDER].y,
      },
    ]
  }

  private _buildOutput(
    setupChecks: SetupCheck[],
    hint: CoachingHint | null,
  ): ScorerOutput {
    const lastRepScore =
      this.repScores.length > 0
        ? this.repScores[this.repScores.length - 1].formScore
        : 0

    return {
      repsDone: this.repsDone,
      targetReps: this.targetReps * this.targetSets,
      currentPhase: this.phase,
      formScoreThisRep: lastRepScore,
      repScores: this.repScores,
      setupChecks,
      activeHint: hint,
      isComplete: this.repsDone >= this.targetReps * this.targetSets,
    }
  }
}