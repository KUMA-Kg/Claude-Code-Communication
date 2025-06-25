import React, { useState, useRef, useEffect, useCallback } from 'react'
import { BiometricAuthService } from '../../services/BiometricAuthService'

interface FacialRecognitionProps {
  userId: string
  mode: 'enroll' | 'verify'
  onComplete: (result: any) => void
  onError: (error: string) => void
}

interface LivenessChallenge {
  type: 'blink' | 'smile' | 'turn-left' | 'turn-right' | 'nod'
  instruction: string
  timeLimit: number
}

const FacialRecognition: React.FC<FacialRecognitionProps> = ({
  userId,
  mode,
  onComplete,
  onError
}) => {
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [currentChallenge, setCurrentChallenge] = useState<LivenessChallenge | null>(null)
  const [challengeImages, setChallengeImages] = useState<string[]>([])
  const [countdown, setCountdown] = useState(3)
  const [status, setStatus] = useState<string>('Initializing camera...')
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceQuality, setFaceQuality] = useState({
    brightness: 0,
    position: 'center',
    size: 'good'
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number>()
  const countdownTimerRef = useRef<NodeJS.Timeout>()
  const livenessTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    startCamera()

    return () => {
      stopCamera()
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
      if (livenessTimerRef.current) clearTimeout(livenessTimerRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }

      setStatus('Position your face in the frame')
      
      // Start face detection
      setTimeout(() => {
        detectFace()
      }, 1000)

    } catch (error) {
      console.error('Camera access error:', error)
      onError('Camera access denied. Please enable camera permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
  }

  const detectFace = () => {
    // In production, use face-api.js or similar for actual face detection
    // For now, simulate face detection
    const simulateFaceDetection = () => {
      const detected = Math.random() > 0.3 // 70% chance of detection
      setFaceDetected(detected)
      
      if (detected) {
        // Simulate quality assessment
        setFaceQuality({
          brightness: Math.random() * 0.4 + 0.6, // 0.6-1.0
          position: Math.random() > 0.8 ? 'off-center' : 'center',
          size: Math.random() > 0.9 ? 'too-small' : 'good'
        })
      }
      
      animationFrameRef.current = requestAnimationFrame(simulateFaceDetection)
    }
    
    simulateFaceDetection()
  }

  const startCapture = async () => {
    if (mode === 'verify') {
      // Get liveness challenge
      try {
        const challenge = await BiometricAuthService.getLivenessChallenge()
        setCurrentChallenge(challenge)
        setStatus(challenge.instruction)
        startLivenessCapture(challenge)
      } catch (error) {
        captureStillImage()
      }
    } else {
      // For enrollment, just capture a still image
      startCountdown()
    }
  }

  const startCountdown = () => {
    setIsCapturing(true)
    setCountdown(3)
    
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
          captureStillImage()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const startLivenessCapture = (challenge: LivenessChallenge) => {
    setIsCapturing(true)
    setChallengeImages([])
    
    // Capture multiple images during the challenge
    let imageCount = 0
    const captureInterval = setInterval(() => {
      if (imageCount >= 5) {
        clearInterval(captureInterval)
        completeLivenessChallenge()
        return
      }
      
      captureChallengeImage()
      imageCount++
    }, 600) // Capture every 600ms

    // Set timeout for challenge
    livenessTimerRef.current = setTimeout(() => {
      clearInterval(captureInterval)
      completeLivenessChallenge()
    }, challenge.timeLimit)
  }

  const captureStillImage = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.95)
    setCapturedImage(imageData)
    
    // Process the image
    processImage(imageData)
  }

  const captureChallengeImage = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    const imageData = canvas.toDataURL('image/jpeg', 0.95)
    setChallengeImages(prev => [...prev, imageData])
  }

  const completeLivenessChallenge = async () => {
    setIsCapturing(false)
    setStatus('Processing liveness check...')
    
    try {
      if (!currentChallenge || challengeImages.length === 0) {
        throw new Error('No challenge images captured')
      }
      
      // Verify liveness
      const livenessResult = await BiometricAuthService.verifyLiveness(
        currentChallenge,
        challengeImages
      )
      
      if (livenessResult.success) {
        // Capture final image for face recognition
        captureStillImage()
      } else {
        onError('Liveness check failed. Please try again.')
      }
    } catch (error) {
      console.error('Liveness verification error:', error)
      onError('Liveness verification failed')
    }
  }

  const processImage = async (imageData: string) => {
    setStatus('Processing facial features...')
    
    try {
      // Convert base64 to blob
      const base64Response = await fetch(imageData)
      const blob = await base64Response.blob()
      
      // Create form data
      const formData = new FormData()
      formData.append('userId', userId)
      formData.append('image', blob, 'face.jpg')
      
      // Call appropriate API based on mode
      let result
      if (mode === 'enroll') {
        result = await BiometricAuthService.enrollFace(formData)
      } else {
        result = await BiometricAuthService.verifyFace(formData)
      }
      
      if (result.success) {
        setStatus('Face recognition successful!')
        onComplete(result)
      } else {
        throw new Error(result.error || 'Face recognition failed')
      }
    } catch (error) {
      console.error('Face processing error:', error)
      onError('Failed to process facial data. Please try again.')
    }
  }

  const retryCapture = () => {
    setCapturedImage(null)
    setChallengeImages([])
    setCurrentChallenge(null)
    setStatus('Position your face in the frame')
    setIsCapturing(false)
  }

  const renderQualityIndicators = () => {
    if (!faceDetected) {
      return (
        <div className="quality-indicator warning">
          <i className="fas fa-exclamation-triangle"></i>
          No face detected
        </div>
      )
    }
    
    return (
      <div className="quality-indicators">
        <div className={`quality-indicator ${faceQuality.brightness > 0.7 ? 'good' : 'warning'}`}>
          <i className="fas fa-sun"></i>
          Lighting: {faceQuality.brightness > 0.7 ? 'Good' : 'Improve lighting'}
        </div>
        <div className={`quality-indicator ${faceQuality.position === 'center' ? 'good' : 'warning'}`}>
          <i className="fas fa-crosshairs"></i>
          Position: {faceQuality.position === 'center' ? 'Centered' : 'Center your face'}
        </div>
        <div className={`quality-indicator ${faceQuality.size === 'good' ? 'good' : 'warning'}`}>
          <i className="fas fa-expand"></i>
          Distance: {faceQuality.size === 'good' ? 'Good' : 'Move closer'}
        </div>
      </div>
    )
  }

  return (
    <div className="facial-recognition">
      <h3>{mode === 'enroll' ? 'Face Enrollment' : 'Face Verification'}</h3>
      <p className="status-message">{status}</p>
      
      <div className="camera-container">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-feed"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {/* Face detection overlay */}
            <div className="face-overlay">
              <div className={`face-guide ${faceDetected ? 'detected' : ''}`}>
                <div className="face-outline"></div>
              </div>
            </div>
            
            {/* Countdown display */}
            {isCapturing && countdown > 0 && (
              <div className="countdown-overlay">
                <span className="countdown-number">{countdown}</span>
              </div>
            )}
            
            {/* Liveness challenge display */}
            {currentChallenge && isCapturing && (
              <div className="challenge-overlay">
                <div className="challenge-instruction">
                  <i className={`fas fa-${getChallengIcon(currentChallenge.type)}`}></i>
                  <span>{currentChallenge.instruction}</span>
                </div>
                <div className="challenge-progress">
                  <div className="progress-dots">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`dot ${i < challengeImages.length ? 'filled' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {renderQualityIndicators()}
          </>
        ) : (
          <div className="captured-image">
            <img src={capturedImage} alt="Captured face" />
          </div>
        )}
      </div>
      
      <div className="facial-controls">
        {!capturedImage && !isCapturing && (
          <button
            className="capture-button"
            onClick={startCapture}
            disabled={!faceDetected}
          >
            <i className="fas fa-camera"></i>
            {mode === 'enroll' ? 'Capture Face' : 'Start Verification'}
          </button>
        )}
        
        {capturedImage && (
          <button
            className="retry-button"
            onClick={retryCapture}
          >
            <i className="fas fa-redo"></i>
            Try Again
          </button>
        )}
      </div>
      
      <div className="privacy-notice">
        <i className="fas fa-shield-alt"></i>
        <span>Your facial data is encrypted and stored securely</span>
      </div>
    </div>
  )
}

const getChallengIcon = (type: string): string => {
  switch (type) {
    case 'blink': return 'eye'
    case 'smile': return 'smile'
    case 'turn-left': return 'arrow-left'
    case 'turn-right': return 'arrow-right'
    case 'nod': return 'arrows-alt-v'
    default: return 'user'
  }
}

export default FacialRecognition