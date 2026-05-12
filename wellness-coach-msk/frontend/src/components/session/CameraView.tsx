import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

export interface CameraViewHandle {
  videoEl: HTMLVideoElement | null
  canvasEl: HTMLCanvasElement | null
}

interface Props {
  onError?: (msg: string) => void
}

const CameraView = forwardRef<CameraViewHandle, Props>(function CameraView({ onError }, ref) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useImperativeHandle(ref, () => ({
    videoEl: videoRef.current,
    canvasEl: canvasRef.current,
  }))

  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      .then((s) => {
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch(() => onError?.('Camera access denied. Please allow camera permissions and reload.'))
    return () => stream?.getTracks().forEach(t => t.stop())
  }, [onError])

  function onLoadedMetadata() {
    if (canvasRef.current && videoRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth || 640
      canvasRef.current.height = videoRef.current.videoHeight || 480
    }
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '4/3',
      background: '#000',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={onLoadedMetadata}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          transform: 'scaleX(-1)',
        }}
      />
    </div>
  )
})

export default CameraView