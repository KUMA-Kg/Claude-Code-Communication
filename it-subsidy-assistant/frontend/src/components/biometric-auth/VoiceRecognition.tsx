import React, { useState, useRef, useEffect, useCallback } from 'react'
import { BiometricAuthService } from '../../services/BiometricAuthService'

interface VoiceRecognitionProps {
  userId: string
  mode: 'enroll' | 'verify'
  onComplete: (result: any) => void
  onError: (error: string) => void
}

interface VoiceChallenge {
  type: 'passphrase' | 'random-digits' | 'random-words'
  content: string
  language: string
  timeLimit: number
}

interface AudioVisualizerData {
  volume: number
  frequency: number[]
}

const VoiceRecognition: React.FC<VoiceRecognitionProps> = ({
  userId,
  mode,
  onComplete,
  onError
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<VoiceChallenge | null>(null)
  const [status, setStatus] = useState('Initializing microphone...')
  const [visualizerData, setVisualizerData] = useState<AudioVisualizerData>({
    volume: 0,
    frequency: new Array(32).fill(0)
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()
  const recordingTimerRef = useRef<NodeJS.Timeout>()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const MIN_RECORDING_TIME = 2000 // 2 seconds
  const MAX_RECORDING_TIME = 10000 // 10 seconds

  useEffect(() => {
    initializeMicrophone()
    if (mode === 'verify') {
      fetchVoiceChallenge()
    }

    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 100
          if (newTime >= MAX_RECORDING_TIME) {
            stopRecording()
          }
          return newTime
        })
      }, 100)
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [isRecording])

  const initializeMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      streamRef.current = stream
      setupAudioAnalyser(stream)
      setStatus('Microphone ready')

    } catch (error) {
      console.error('Microphone access error:', error)
      onError('Microphone access denied. Please enable microphone permissions.')
    }
  }

  const setupAudioAnalyser = (stream: MediaStream) => {
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    
    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.8
    
    source.connect(analyser)
    analyserRef.current = analyser
    
    visualizeAudio()
  }

  const visualizeAudio = () => {
    if (!analyserRef.current) return
    
    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)
      
      analyser.getByteFrequencyData(dataArray)
      
      // Calculate volume
      const volume = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength / 255
      
      // Get frequency data
      const frequency = Array.from(dataArray).map(val => val / 255)
      
      setVisualizerData({ volume, frequency })
      
      // Draw on canvas
      drawWaveform(frequency)
    }
    
    draw()
  }

  const drawWaveform = (frequency: number[]) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    
    const width = canvas.width
    const height = canvas.height
    const barWidth = width / frequency.length
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(0, 0, width, height)
    
    frequency.forEach((value, index) => {
      const barHeight = value * height * 0.8
      const x = index * barWidth
      const y = (height - barHeight) / 2
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight)
      gradient.addColorStop(0, 'rgba(74, 144, 226, 0.8)')
      gradient.addColorStop(1, 'rgba(74, 144, 226, 0.3)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barWidth - 1, barHeight)
    })
  }

  const fetchVoiceChallenge = async () => {
    try {
      const challenge = await BiometricAuthService.getVoiceChallenge('en')
      setChallenge(challenge)
      setStatus('Read the text below clearly')
    } catch (error) {
      // Use default passphrase if challenge fetch fails
      setChallenge({
        type: 'passphrase',
        content: 'My voice is my passport, verify me',
        language: 'en',
        timeLimit: 10000
      })
    }
  }

  const startRecording = async () => {
    if (!streamRef.current) {
      await initializeMicrophone()
    }

    audioChunksRef.current = []
    setRecordingTime(0)
    setAudioBlob(null)
    setAudioUrl(null)

    const mediaRecorder = new MediaRecorder(streamRef.current!, {
      mimeType: 'audio/webm'
    })

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      setAudioBlob(audioBlob)
      setAudioUrl(URL.createObjectURL(audioBlob))
      setStatus('Recording complete. Review your recording.')
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
    setIsRecording(true)
    setStatus('Recording... Speak clearly')
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processRecording = async () => {
    if (!audioBlob) return

    setStatus('Processing voice data...')

    try {
      // Convert to WAV format if needed (simplified for demo)
      const formData = new FormData()
      formData.append('userId', userId)
      formData.append('audio', audioBlob, 'voice.webm')
      formData.append('sampleRate', '16000')
      
      if (challenge) {
        formData.append('challenge', JSON.stringify(challenge))
      }

      let result
      if (mode === 'enroll') {
        result = await BiometricAuthService.enrollVoice(formData)
      } else {
        result = await BiometricAuthService.verifyVoice(formData)
      }

      if (result.success) {
        setStatus('Voice recognition successful!')
        onComplete(result)
      } else {
        throw new Error(result.error || 'Voice recognition failed')
      }
    } catch (error) {
      console.error('Voice processing error:', error)
      onError('Failed to process voice data. Please try again.')
    }
  }

  const retryRecording = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setStatus(mode === 'verify' ? 'Read the text below clearly' : 'Press record and speak naturally')
  }

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const decimal = Math.floor((ms % 1000) / 100)
    return `${seconds}.${decimal}s`
  }

  const getRecordingProgress = (): number => {
    return Math.min((recordingTime / MAX_RECORDING_TIME) * 100, 100)
  }

  return (
    <div className="voice-recognition">
      <h3>{mode === 'enroll' ? 'Voice Enrollment' : 'Voice Verification'}</h3>
      <p className="status-message">{status}</p>

      {challenge && mode === 'verify' && (
        <div className="voice-challenge">
          <div className="challenge-text">
            <i className="fas fa-quote-left"></i>
            <p>{challenge.content}</p>
            <i className="fas fa-quote-right"></i>
          </div>
          <p className="challenge-hint">Read this text clearly when recording</p>
        </div>
      )}

      <div className="audio-visualizer">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="waveform-canvas"
        />
        
        {isRecording && (
          <div className="volume-indicator">
            <div className="volume-bar">
              <div 
                className="volume-fill"
                style={{ width: `${visualizerData.volume * 100}%` }}
              />
            </div>
            <span className="volume-label">
              {visualizerData.volume > 0.1 ? 'Good signal' : 'Speak louder'}
            </span>
          </div>
        )}
      </div>

      {audioUrl && (
        <div className="audio-playback">
          <audio controls src={audioUrl} />
        </div>
      )}

      <div className="recording-controls">
        {!audioBlob && !isRecording && (
          <button
            className="record-button"
            onClick={startRecording}
          >
            <i className="fas fa-microphone"></i>
            Start Recording
          </button>
        )}

        {isRecording && (
          <>
            <button
              className="stop-button"
              onClick={stopRecording}
              disabled={recordingTime < MIN_RECORDING_TIME}
            >
              <i className="fas fa-stop"></i>
              Stop Recording
            </button>
            
            <div className="recording-info">
              <div className="recording-time">
                <i className="fas fa-circle recording-dot"></i>
                <span>{formatTime(recordingTime)}</span>
              </div>
              
              <div className="recording-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${getRecordingProgress()}%` }}
                  />
                </div>
                <span className="progress-label">
                  {recordingTime < MIN_RECORDING_TIME 
                    ? `Min ${MIN_RECORDING_TIME / 1000}s required` 
                    : `Max ${MAX_RECORDING_TIME / 1000}s`}
                </span>
              </div>
            </div>
          </>
        )}

        {audioBlob && !isRecording && (
          <div className="recording-actions">
            <button
              className="process-button"
              onClick={processRecording}
            >
              <i className="fas fa-check"></i>
              {mode === 'enroll' ? 'Save Voice Print' : 'Verify Voice'}
            </button>
            
            <button
              className="retry-button"
              onClick={retryRecording}
            >
              <i className="fas fa-redo"></i>
              Try Again
            </button>
          </div>
        )}
      </div>

      <div className="voice-tips">
        <h4>Tips for best results:</h4>
        <ul>
          <li>Speak in your natural voice</li>
          <li>Maintain consistent volume</li>
          <li>Minimize background noise</li>
          <li>Keep a steady pace</li>
        </ul>
      </div>

      <div className="privacy-notice">
        <i className="fas fa-shield-alt"></i>
        <span>Your voice data is encrypted and stored securely</span>
      </div>
    </div>
  )
}

export default VoiceRecognition