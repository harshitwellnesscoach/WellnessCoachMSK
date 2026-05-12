import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export type Point = { x: number; y: number; z?: number }

/** Angle in degrees at vertex B formed by A-B-C. */
export function angleDeg(a: Point, b: Point, c: Point): number {
  const ba = { x: a.x - b.x, y: a.y - b.y }
  const bc = { x: c.x - b.x, y: c.y - b.y }
  const dot = ba.x * bc.x + ba.y * bc.y
  const magBa = Math.hypot(ba.x, ba.y)
  const magBc = Math.hypot(bc.x, bc.y)
  if (magBa === 0 || magBc === 0) return 0
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBa * magBc)))
  return (Math.acos(cosAngle) * 180) / Math.PI
}

/** Midpoint of two points. */
export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z ?? 0) + (b.z ?? 0)) / 2 }
}

/**
 * Approximate spine angle relative to vertical (degrees). 0 = perfectly upright.
 * Uses shoulder midpoint -> hip midpoint vector.
 */
export function spineAngle(landmarks: NormalizedLandmark[]): number {
  // MediaPipe indices: 11=left_shoulder, 12=right_shoulder, 23=left_hip, 24=right_hip
  const shoulderMid = midpoint(landmarks[11], landmarks[12])
  const hipMid = midpoint(landmarks[23], landmarks[24])
  const dx = shoulderMid.x - hipMid.x
  const dy = shoulderMid.y - hipMid.y
  return (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI
}

/**
 * Hip symmetry delta: difference in Y-position between left and right hip.
 * 0 = level hips. Positive = right hip higher (in normalized image coords).
 */
export function hipSymmetryDelta(landmarks: NormalizedLandmark[]): number {
  return landmarks[24].y - landmarks[23].y
}

/** Returns true if a landmark's visibility score exceeds the threshold. */
export function isVisible(landmark: NormalizedLandmark, threshold = 0.5): boolean {
  return (landmark.visibility ?? 0) > threshold
}