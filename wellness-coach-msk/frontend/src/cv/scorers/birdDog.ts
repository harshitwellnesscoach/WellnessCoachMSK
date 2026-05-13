import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { angleDeg, isVisible } from '../geometry'
import type { CoachingHint, ExerciseScorer, RepScore, ScorerOutput, SetupCheck } from './base'

const L_HIP = 23
const R_HIP = 24
const L_KNEE = 25
const R_KNEE = 26
const L_ANKLE = 27
const R_ANKLE = 28
const L_SHOULDER = 11
const R_SHOULDER = 12

// Hip-knee-ankle angle for the extending leg (side view, on all fours)
// Bent (start): ~85-100°   Extended: ~150-165°
const EXTEND_THRESHOLD = 148  // above this → leg extended
const RETURN_THRESHOLD = 115  // below this (after extend) → rep counted

type Phase = 'BENT' | 'EXTENDING' | 'HOLD' | 'RETURNING'

export class BirdDogScorer implements ExerciseScorer {
  readonly exerciseId = 'bird_dog'

  private targetReps = 10
  private targetSets = 2
  private repsDone = 0
  private phase: Phase = 'BENT'
  private repScores: RepScore[] = []
  private peakAngle = 0
  private holdFrames = 0
  private readonly HOLD_REQUIRED = 8

  setup(targetReps: number, targetSets: number): void {
    this.targetReps = targetReps
    this.targetSets = targetSets
  }

  reset(): void {
    this.repsDone = 0
    this.phase = 'BENT'
    this.repScores = []
    this.peakAngle = 0
    this.holdFrames = 0
  }

  processFrame(lms: NormalizedLandmark[], _ts: number): ScorerOutput {
    const checks = this._setupChecks(lms)
    if (!checks.every(c => c.pass) || this.repsDone >= this.targetReps * this.targetSets) {
      return this._out(checks, null)
    }

    // Use whichever leg is more visible
    const leftVis = Math.min(lms[L_HIP].visibility ?? 0, lms[L_KNEE].visibility ?? 0, lms[L_ANKLE].visibility ?? 0)
    const rightVis = Math.min(lms[R_HIP].visibility ?? 0, lms[R_KNEE].visibility ?? 0, lms[R_ANKLE].visibility ?? 0)
    const [hip, knee, ankle] = leftVis >= rightVis
      ? [lms[L_HIP], lms[L_KNEE], lms[L_ANKLE]]
      : [lms[R_HIP], lms[R_KNEE], lms[R_ANKLE]]
    const angle = angleDeg(hip, knee, ankle)

    let hint: CoachingHint | null = null

    switch (this.phase) {
      case 'BENT':
        hint = { id: 'extend', text: 'Extend your leg back — keep hips level', priority: 'info' }
        if (angle > EXTEND_THRESHOLD) {
          this.phase = 'EXTENDING'
          this.peakAngle = angle
          this.holdFrames = 0
        }
        break

      case 'EXTENDING':
        if (angle > this.peakAngle) this.peakAngle = angle
        this.holdFrames++
        if (this.holdFrames >= this.HOLD_REQUIRED) this.phase = 'HOLD'
        hint = { id: 'hold', text: 'Hold — keep your core tight', priority: 'info' }
        break

      case 'HOLD':
        hint = { id: 'hold', text: 'Hold — keep your core tight', priority: 'info' }
        if (angle < EXTEND_THRESHOLD - 5) this.phase = 'RETURNING'
        break

      case 'RETURNING':
        hint = { id: 'return', text: 'Bring leg back in slowly', priority: 'info' }
        if (angle < RETURN_THRESHOLD) {
          const score = this._score()
          this.repScores.push({ repNumber: this.repsDone + 1, formScore: score, hints: [] })
          this.repsDone++
          this.phase = 'BENT'
          this.peakAngle = 0
          this.holdFrames = 0
        }
        break
    }

    return this._out(checks, hint)
  }

  private _score(): number {
    const extScore = Math.min(100, Math.max(0, ((this.peakAngle - EXTEND_THRESHOLD) / 15) * 100 + 60))
    const holdScore = Math.min(100, (this.holdFrames / (this.HOLD_REQUIRED * 2)) * 100)
    return Math.round(extScore * 0.6 + holdScore * 0.4)
  }

  private _setupChecks(lms: NormalizedLandmark[]): SetupCheck[] {
    return [
      {
        id: 'full_body',
        label: 'Full body visible',
        pass: [L_SHOULDER, R_SHOULDER, L_HIP, R_HIP, L_KNEE, R_KNEE].every(i => isVisible(lms[i])),
      },
      {
        id: 'on_all_fours',
        label: 'On all fours position detected',
        pass: Math.abs(lms[L_HIP].y - lms[L_SHOULDER].y) < 0.15,
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