import {
  PoseLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision'

let _landmarker: PoseLandmarker | null = null

export async function initPoseTracker(): Promise<void> {
  if (_landmarker) return
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
  )
  _landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/models/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  })
}

export function detectPose(
  video: HTMLVideoElement,
  timestampMs: number,
): NormalizedLandmark[] | null {
  if (!_landmarker) return null
  const result = _landmarker.detectForVideo(video, timestampMs)
  return result.landmarks[0] ?? null
}

export function disposePoseTracker(): void {
  _landmarker?.close()
  _landmarker = null
}