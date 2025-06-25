import React, { useEffect, useRef, useState, useCallback } from 'react'
import { BiometricAuthService } from '../../services/BiometricAuthService'

interface BehavioralTrackerProps {
  sessionId: string
  onMetricsReady: (metrics: any) => void
}

interface KeystrokeBuffer {
  key: string
  keyCode: number
  timestamp: number
  eventType: 'keydown' | 'keyup'
}

interface MouseBuffer {
  x: number
  y: number
  timestamp: number
  eventType: 'move' | 'click' | 'scroll'
  button?: number
  deltaX?: number
  deltaY?: number
}

const BehavioralTracker: React.FC<BehavioralTrackerProps> = ({
  sessionId,
  onMetricsReady
}) => {
  const [isTracking, setIsTracking] = useState(false)
  const [typedText, setTypedText] = useState('')
  const [mousePattern, setMousePattern] = useState<{ x: number; y: number }[]>([])
  const [progress, setProgress] = useState(0)

  const keystrokeBuffer = useRef<KeystrokeBuffer[]>([])
  const mouseBuffer = useRef<MouseBuffer[]>([])
  const lastMouseEvent = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const testPhrase = "The quick brown fox jumps over the lazy dog"

  useEffect(() => {
    if (sessionId) {
      startTracking()
    }

    return () => {
      stopTracking()
    }
  }, [sessionId])

  const startTracking = () => {
    setIsTracking(true)
    // Add global event listeners
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove)
      containerRef.current.addEventListener('click', handleMouseClick)
      containerRef.current.addEventListener('wheel', handleMouseScroll)
    }
  }

  const stopTracking = () => {
    setIsTracking(false)
    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
    
    if (containerRef.current) {
      containerRef.current.removeEventListener('mousemove', handleMouseMove)
      containerRef.current.removeEventListener('click', handleMouseClick)
      containerRef.current.removeEventListener('wheel', handleMouseScroll)
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const event: KeystrokeBuffer = {
      key: e.key,
      keyCode: e.keyCode,
      timestamp: Date.now(),
      eventType: 'keydown'
    }
    
    keystrokeBuffer.current.push(event)
    sendKeystrokeData(event)
  }, [sessionId])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const event: KeystrokeBuffer = {
      key: e.key,
      keyCode: e.keyCode,
      timestamp: Date.now(),
      eventType: 'keyup'
    }
    
    keystrokeBuffer.current.push(event)
    sendKeystrokeData(event)

    // Update progress based on typing
    if (typedText.length < testPhrase.length) {
      const newProgress = Math.min((typedText.length / testPhrase.length) * 50, 50)
      setProgress(newProgress)
    }
  }, [sessionId, typedText])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now()
    if (now - lastMouseEvent.current < 10) return // Throttle to 100Hz
    
    lastMouseEvent.current = now
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const event: MouseBuffer = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      timestamp: now,
      eventType: 'move'
    }
    
    mouseBuffer.current.push(event)
    sendMouseData(event)
    
    // Update mouse pattern visualization
    setMousePattern(prev => {
      const newPattern = [...prev, { x: event.x, y: event.y }]
      if (newPattern.length > 200) newPattern.shift()
      return newPattern
    })
    
    // Draw on canvas
    drawMousePath(event.x, event.y)
  }, [sessionId])

  const handleMouseClick = useCallback((e: MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const event: MouseBuffer = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      timestamp: Date.now(),
      eventType: 'click',
      button: e.button
    }
    
    mouseBuffer.current.push(event)
    sendMouseData(event)
  }, [sessionId])

  const handleMouseScroll = useCallback((e: WheelEvent) => {
    const event: MouseBuffer = {
      x: 0,
      y: 0,
      timestamp: Date.now(),
      eventType: 'scroll',
      deltaX: e.deltaX,
      deltaY: e.deltaY
    }
    
    mouseBuffer.current.push(event)
    sendMouseData(event)
  }, [sessionId])

  const sendKeystrokeData = async (event: KeystrokeBuffer) => {
    try {
      await BiometricAuthService.recordBehavioralEvent(sessionId, 'keystroke', event)
    } catch (error) {
      console.error('Failed to send keystroke data:', error)
    }
  }

  const sendMouseData = async (event: MouseBuffer) => {
    try {
      await BiometricAuthService.recordBehavioralEvent(sessionId, 'mouse', event)
    } catch (error) {
      console.error('Failed to send mouse data:', error)
    }
  }

  const drawMousePath = (x: number, y: number) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    
    // Set canvas size if not set
    if (canvas.width === 0) {
      canvas.width = containerRef.current?.clientWidth || 0
      canvas.height = 200
    }
    
    // Draw line from last position
    if (mousePattern.length > 0) {
      const lastPoint = mousePattern[mousePattern.length - 1]
      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y % 200)
      ctx.lineTo(x, y % 200)
      ctx.strokeStyle = 'rgba(74, 144, 226, 0.3)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
    
    // Fade out old paths
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    
    // Only allow typing if it matches the test phrase
    if (testPhrase.startsWith(newText)) {
      setTypedText(newText)
      
      // Check if typing is complete
      if (newText === testPhrase) {
        completeTypingTest()
      }
    }
  }

  const completeTypingTest = async () => {
    // Update progress
    setProgress(50)
    
    // Get current metrics
    try {
      const metrics = await BiometricAuthService.getBehavioralMetrics(sessionId)
      
      // Simulate mouse test completion after typing
      setTimeout(() => {
        setProgress(100)
        onMetricsReady({
          ...metrics,
          confidence: 0.85 // Simulated confidence score
        })
      }, 2000)
    } catch (error) {
      console.error('Failed to get behavioral metrics:', error)
    }
  }

  const getTypingHint = () => {
    if (typedText.length === 0) return testPhrase
    
    const typed = typedText
    const remaining = testPhrase.substring(typedText.length)
    
    return (
      <>
        <span style={{ color: '#4a90e2' }}>{typed}</span>
        <span style={{ color: '#999' }}>{remaining}</span>
      </>
    )
  }

  return (
    <div className="behavioral-tracker" ref={containerRef}>
      <h3>Behavioral Biometrics</h3>
      <p>Complete the typing test and move your mouse naturally</p>
      
      <div className="tracker-content">
        <div className="typing-test">
          <div className="test-phrase">
            {getTypingHint()}
          </div>
          
          <textarea
            value={typedText}
            onChange={handleTextChange}
            placeholder="Type the phrase above..."
            className="typing-input"
            autoFocus
            spellCheck={false}
          />
          
          <div className="typing-stats">
            <span>Characters typed: {typedText.length}/{testPhrase.length}</span>
          </div>
        </div>
        
        <div className="mouse-tracking">
          <h4>Mouse Pattern Analysis</h4>
          <canvas 
            ref={canvasRef}
            className="mouse-canvas"
            style={{ border: '1px solid #ddd', borderRadius: '8px' }}
          />
          <p className="tracking-hint">
            Move your mouse naturally within this area
          </p>
        </div>
        
        <div className="tracker-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>{Math.round(progress)}% Complete</span>
        </div>
      </div>
      
      {isTracking && (
        <div className="tracking-indicator">
          <i className="fas fa-circle recording"></i>
          Recording behavioral patterns...
        </div>
      )}
    </div>
  )
}

export default BehavioralTracker