import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { angleDeg, isVisible } from '../geometry'
import type { CoachingHint, ExerciseScorer, RepScore, ScorerOutput, SetupCheck } from './base'

const L_SHOULDER = 11
const R_SHOULDER = 12
const L_HIP = 23
const R_HIP = 24
const L_KNEE = 25
const R_KNEE = 26

// Shoulder-hip-knee angle for the lowering leg (lying on back)
// Legs raised (start): ~85-95°   Lowered toward floor: ~140-160°
const LOWER_THRESHOLD = 132  // above this → leg sufficiently lowered
const RAISE_THRESHOLD = 105  // below this (after lower) → rep counted

type Phase = 'RAISED' | 'LOWERING' | 'HOLD' | 'RAISING'

export class DeadBugScorer implements ExerciseScorer {
  readonly exerciseId = 'dead_bug'

  private targetReps = 10
  private targetSets = 2
  private repsDone = 0
  private phase: Phase = 'RAISED'
  private repScores: RepScore[] = []
  private peakAngle = 0
  private holdFrames = 0
  private readonly HOLD_REQUIRED = 6

  setup(targetReps: number, targetSets: number): void {
    this.targetReps = targetReps
    this.targetSets = targetSets
  }

  reset(): void {
    this.repsDone = 0
    this.phase = 'RAISED'
    this.repScores = []
    this.peakAngle = 0
    this.holdFrames = 0
  }

  processFrame(lms: NormalizedLandmark[], _ts: number): ScorerOutput {
    const checks = this._setupChecks(lms)
    if (!checks.every(c => c.pass) || this.repsDone >= this.targetReps * this.targetSets) {
      return this._out(checks, null)
    }

    // Use whichever side is more visible
    const leftVis = Math.min(lms[L_SHOULDER].visibility ?? 0, lms[L_HIP].visibility ?? 0, lms[L_KNEE].visibility ?? 0)
    const rightVis = Math.min(lms[R_SHOULDER].visibility ?? 0, lms[R_HIP].visibility ?? 0, lms[R_KNEE].visibility ?? 0)
    const [sh, hi, kn] = leftVis >= rightVis
      ? [lms[L_SHOULDER], lms[L_HIP], lms[L_KNEE]]
      : [lms[R_SHOULDER], lms[R_HIP], lms[R_KNEE]]
    const angle = angleDeg(sh, hi, kn)

    let hint: CoachingHint | null = null

    switch (this.phase) {
      case 'RAISED':
        hint = { id: 'lower', text: 'Slowly lower one leg toward the floor', priority: 'info' }
        if (angle > LOWER_THRESHOLD) {
          this.phase = 'LOWERING'
          this.peakAngle = angle
          this.holdFrames = 0
        }
        break

      case 'LOWERING':
        if (angle > this.peakAngle) this.peakAngle = angle
        this.holdFrames++
        if (this.holdFrames >= this.HOLD_REQUIRED) this.phase = 'HOLD'
        hint = { id: 'hold', text: 'Hold — keep lower back flat', priority: 'info' }
        break

      case 'HOLD':
        hint = { id: 'hold', text: 'Hold — keep lower back flat', priority: 'info' }
        if (angle < LOWER_THRESHOLD - 5) this.phase = 'RAISING'
        break

      case 'RAISING':
        hint = { id: 'raise', text: 'Bring leg back up slowly', priority: 'info' }
        if (angle < RAISE_THRESHOLD) {
          const score = this._score()
          this.repScores.push({ repNumber: this.repsDone + 1, formScore: score, hints: [] })
          this.repsDone++
          this.phase = 'RAISED'
          this.peakAngle = 0
          this.holdFrames = 0
        }
        break
    }

    return this._out(checks, hint)
  }

  private _score(): number {
    // Higher peak angle = leg lowered further = better range
    const rangeScore = Math.min(100, Math.max(0, ((this.peakAngle - LOWER_THRESHOLD) / 20) * 100 + 55))
    const holdScore = Math.min(100, (this.holdFrames / (this.HOLD_REQUIRED * 2)) * 100)
    return Math.round(rangeScore * 0.6 + holdScore * 0.4)
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