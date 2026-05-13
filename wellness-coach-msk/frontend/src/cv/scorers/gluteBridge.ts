import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { angleDeg, isVisible } from '../geometry'
import type { CoachingHint, ExerciseScorer, RepScore, ScorerOutput, SetupCheck } from './base'

const L_SHOULDER = 11
const R_SHOULDER = 12
const L_HIP = 23
const R_HIP = 24
const L_KNEE = 25
const R_KNEE = 26

// Shoulder-hip-knee angle thresholds (side view, lying on back)
// Neutral/down: ~120-130°  Bridge raised: ~95-110°
const RAISE_THRESHOLD = 112   // below this → hips raised
const LOWER_THRESHOLD = 118   // above this (after raise) → rep counted

type Phase = 'DOWN' | 'RAISING' | 'HOLD' | 'LOWERING'

export class GluteBridgeScorer implements ExerciseScorer {
  readonly exerciseId = 'glute_bridge'

  private targetReps = 10
  private targetSets = 2
  private repsDone = 0
  private phase: Phase = 'DOWN'
  private repScores: RepScore[] = []
  private peakAngle = 180
  private holdFrames = 0
  private readonly HOLD_REQUIRED = 6

  setup(targetReps: number, targetSets: number): void {
    this.targetReps = targetReps
    this.targetSets = targetSets
  }

  reset(): void {
    this.repsDone = 0
    this.phase = 'DOWN'
    this.repScores = []
    this.peakAngle = 180
    this.holdFrames = 0
  }

  processFrame(lms: NormalizedLandmark[], _ts: number): ScorerOutput {
    const checks = this._setupChecks(lms)
    if (!checks.every(c => c.pass) || this.repsDone >= this.targetReps * this.targetSets) {
      return this._out(checks, null)
    }

    const shoulderMid = { x: (lms[L_SHOULDER].x + lms[R_SHOULDER].x) / 2, y: (lms[L_SHOULDER].y + lms[R_SHOULDER].y) / 2 }
    const hipMid = { x: (lms[L_HIP].x + lms[R_HIP].x) / 2, y: (lms[L_HIP].y + lms[R_HIP].y) / 2 }
    const kneeMid = { x: (lms[L_KNEE].x + lms[R_KNEE].x) / 2, y: (lms[L_KNEE].y + lms[R_KNEE].y) / 2 }
    const angle = angleDeg(shoulderMid, hipMid, kneeMid)

    let hint: CoachingHint | null = null

    switch (this.phase) {
      case 'DOWN':
        hint = { id: 'push', text: 'Drive hips up, squeeze glutes', priority: 'info' }
        if (angle < RAISE_THRESHOLD) {
          this.phase = 'RAISING'
          this.peakAngle = angle
          this.holdFrames = 0
        }
        break

      case 'RAISING':
        if (angle < this.peakAngle) this.peakAngle = angle
        this.holdFrames++
        if (this.holdFrames >= this.HOLD_REQUIRED) this.phase = 'HOLD'
        hint = { id: 'hold', text: 'Hold at the top — squeeze glutes', priority: 'info' }
        break

      case 'HOLD':
        hint = { id: 'hold', text: 'Hold at the top — squeeze glutes', priority: 'info' }
        if (angle > RAISE_THRESHOLD + 2) this.phase = 'LOWERING'
        break

      case 'LOWERING':
        hint = { id: 'lower', text: 'Slowly lower back down', priority: 'info' }
        if (angle > LOWER_THRESHOLD) {
          const score = this._score()
          this.repScores.push({ repNumber: this.repsDone + 1, formScore: score, hints: [] })
          this.repsDone++
          this.phase = 'DOWN'
          this.peakAngle = 180
          this.holdFrames = 0
        }
        break
    }

    return this._out(checks, hint)
  }

  private _score(): number {
    // Lower peak angle = hips raised higher = better form
    const angleScore = Math.min(100, Math.max(0, ((RAISE_THRESHOLD - this.peakAngle) / 20) * 100 + 50))
    const holdScore = Math.min(100, (this.holdFrames / (this.HOLD_REQUIRED * 2)) * 100)
    return Math.round(angleScore * 0.6 + holdScore * 0.4)
  }

  private _setupChecks(lms: NormalizedLandmark[]): SetupCheck[] {
    return [
      {
        id: 'full_body',
        label: 'Full body visible',
        pass: [L_SHOULDER, R_SHOULDER, L_HIP, R_HIP, L_KNEE, R_KNEE].every(i => isVisible(lms[i])),
      },
      {
        id: 'lying_down',
        label: 'Lying on back detected',
        pass: lms[L_HIP].y > lms[L_SHOULDER].y,
      },
    ]
  }

  private _out(checks: SetupCheck[], hint: CoachingHint | null): ScorerOutput {
    const last = this.repScores[this.repScores.length - 1]
    return {
      repsDone: this.repsDone,
      targetReps: this.targetReps * this.targetSets,
      currentPhase: this.phase,
      formScoreThisRep: last?.formScore ?? 0,
      repScores: this.repScores,
      setupChecks: checks,
      activeHint: hint,
      isComplete: this.repsDone >= this.targetReps * this.targetSets,
    }
  }
}