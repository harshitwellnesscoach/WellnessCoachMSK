import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export interface SetupCheck {
  id: string
  label: string
  pass: boolean
}

export interface CoachingHint {
  id: string
  text: string
  priority: 'info' | 'warn' | 'critical'
}

export interface RepScore {
  repNumber: number
  formScore: number          // 0-100
  hints: CoachingHint[]
}

export interface ScorerOutput {
  repsDone: number
  targetReps: number
  currentPhase: string        // e.g. "START", "HOLD", "RETURN"
  formScoreThisRep: number    // live score for the current in-progress rep
  repScores: RepScore[]       // completed reps
  setupChecks: SetupCheck[]
  activeHint: CoachingHint | null
  isComplete: boolean
}

export interface ExerciseScorer {
  readonly exerciseId: string
  setup(targetReps: number, targetSets: number): void
  processFrame(landmarks: NormalizedLandmark[], timestampMs: number): ScorerOutput
  reset(): void
}