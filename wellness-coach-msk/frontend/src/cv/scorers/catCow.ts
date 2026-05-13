import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { angleDeg, isVisible } from '../geometry'
import type { CoachingHint, ExerciseScorer, RepScore, ScorerOutput, SetupCheck } from './base'

const L_SHOULDER = 11
const R_SHOULDER = 12
const L_HIP = 23
const R_HIP = 24
const L_KNEE = 25
const R_KNEE = 26

// Shoulder-hip-knee angle on all fours (side view)
// Neutral: ~90-95°  Cat (rounded): ~80-85°  Cow (arched): ~100-105°
const CAT_THRESHOLD = 86    // below this → cat position reached
const COW_THRESHOLD = 98    // above this (after cat) → full cycle rep counted

type Phase = 'NEUTRAL' | 'CAT' | 'COW'

export class CatCowScorer implements ExerciseScorer {
  readonly exerciseId = 'cat_cow'

  private targetReps = 10
  private targetSets = 2
  private repsDone = 0
  private phase: Phase = 'NEUTRAL'
  private repScores: RepScore[] = []

  setup(targetReps: number, targetSets: number): void {
    this.targetReps = targetReps
    this.targetSets = targetSets
  }

  reset(): void {
    this.repsDone = 0
    this.phase = 'NEUTRAL'
    this.repScores = []
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
      case 'NEUTRAL':
        hint = { id: 'cat', text: 'Round your back up — tuck chin to chest', priority: 'info' }
        if (angle < CAT_THRESHOLD) this.phase = 'CAT'
        break

      case 'CAT':
        hint = { id: 'cow', text: 'Now arch your back — lift your head gently', priority: 'info' }
        if (angle > COW_THRESHOLD) this.phase = 'COW'
        break

      case 'COW':
        hint = { id: 'return', text: 'Return to neutral', priority: 'info' }
        if (angle < COW_THRESHOLD - 4) {
          this.repScores.push({ repNumber: this.repsDone + 1, formScore: 85, hints: [] })
          this.repsDone++
          this.phase = 'NEUTRAL'
        }
        break
    }

    return this._out(checks, hint)
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