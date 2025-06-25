import React, { useState, useEffect, useCallback } from 'react'
import { BiometricAuthService } from '../../services/BiometricAuthService'
import BehavioralTracker from './BehavioralTracker'
import FacialRecognition from './FacialRecognition'
import VoiceRecognition from './VoiceRecognition'
import BiometricEnrollment from './BiometricEnrollment'
import './BiometricAuth.css'

interface BiometricAuthProps {
  userId: string
  onAuthSuccess: (token: string, confidence: number) => void
  onAuthFailure: (error: string) => void
  mode?: 'login' | 'enroll'
}

interface AuthState {
  isAuthenticating: boolean
  currentStep: 'idle' | 'behavioral' | 'facial' | 'voice' | 'processing' | 'complete'
  progress: number
  factors: {
    behavioral: { ready: boolean; confidence?: number }
    facial: { ready: boolean; confidence?: number }
    voice: { ready: boolean; confidence?: number }
  }
  error?: string
}

const BiometricAuth: React.FC<BiometricAuthProps> = ({
  userId,
  onAuthSuccess,
  onAuthFailure,
  mode = 'login'
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticating: false,
    currentStep: 'idle',
    progress: 0,
    factors: {
      behavioral: { ready: false },
      facial: { ready: false },
      voice: { ready: false }
    }
  })

  const [sessionId, setSessionId] = useState<string>('')
  const [showEnrollment, setShowEnrollment] = useState(false)
  const [biometricStatus, setBiometricStatus] = useState<any>(null)

  useEffect(() => {
    // Check biometric enrollment status
    checkBiometricStatus()
  }, [userId])

  const checkBiometricStatus = async () => {
    try {
      const status = await BiometricAuthService.getAuthenticationStatus(userId)
      setBiometricStatus(status)
      
      // If not enrolled and in login mode, show enrollment
      if (mode === 'login' && !status.registered) {
        setShowEnrollment(true)
      }
    } catch (error) {
      console.error('Failed to check biometric status:', error)
    }
  }

  const startAuthentication = async () => {
    try {
      setAuthState(prev => ({
        ...prev,
        isAuthenticating: true,
        currentStep: 'behavioral',
        error: undefined
      }))

      // Start biometric session
      const session = await BiometricAuthService.startSession(userId)
      setSessionId(session.sessionId)

    } catch (error) {
      handleError('Failed to start authentication')
    }
  }

  const handleBehavioralReady = useCallback((metrics: any) => {
    setAuthState(prev => ({
      ...prev,
      factors: {
        ...prev.factors,
        behavioral: { ready: true, confidence: metrics.confidence }
      },
      progress: prev.progress + 20
    }))

    // Move to facial recognition
    if (authState.currentStep === 'behavioral') {
      setAuthState(prev => ({ ...prev, currentStep: 'facial' }))
    }
  }, [authState.currentStep])

  const handleFacialComplete = useCallback((result: any) => {
    setAuthState(prev => ({
      ...prev,
      factors: {
        ...prev.factors,
        facial: { ready: true, confidence: result.confidence }
      },
      progress: prev.progress + 40,
      currentStep: 'voice'
    }))
  }, [])

  const handleVoiceComplete = useCallback(async (result: any) => {
    setAuthState(prev => ({
      ...prev,
      factors: {
        ...prev.factors,
        voice: { ready: true, confidence: result.confidence }
      },
      progress: prev.progress + 40,
      currentStep: 'processing'
    }))

    // Perform multi-factor authentication
    await performAuthentication()
  }, [])

  const performAuthentication = async () => {
    try {
      const authData = {
        userId,
        sessionId,
        behavioral: authState.factors.behavioral.ready,
        facial: authState.factors.facial.ready,
        voice: authState.factors.voice.ready
      }

      const result = await BiometricAuthService.authenticate(authData)

      if (result.success) {
        setAuthState(prev => ({
          ...prev,
          currentStep: 'complete',
          progress: 100
        }))

        setTimeout(() => {
          onAuthSuccess(result.token!, result.confidence)
        }, 500)
      } else {
        throw new Error('Authentication failed')
      }
    } catch (error) {
      handleError('Authentication failed. Please try again.')
    }
  }

  const handleError = (message: string) => {
    setAuthState(prev => ({
      ...prev,
      isAuthenticating: false,
      currentStep: 'idle',
      error: message,
      progress: 0
    }))
    onAuthFailure(message)
  }

  const handleEnrollmentComplete = () => {
    setShowEnrollment(false)
    checkBiometricStatus()
  }

  const renderAuthenticationFlow = () => {
    if (!authState.isAuthenticating) {
      return (
        <div className="biometric-auth-start">
          <h2>Passwordless Authentication</h2>
          <p>Authenticate using your unique biometric signature</p>
          
          <div className="auth-factors-status">
            <div className={`factor-status ${biometricStatus?.biometrics?.behavioral ? 'enrolled' : ''}`}>
              <i className="fas fa-keyboard"></i>
              <span>Behavioral</span>
            </div>
            <div className={`factor-status ${biometricStatus?.biometrics?.facial?.enrolled ? 'enrolled' : ''}`}>
              <i className="fas fa-user-circle"></i>
              <span>Facial</span>
            </div>
            <div className={`factor-status ${biometricStatus?.biometrics?.voice?.enrolled ? 'enrolled' : ''}`}>
              <i className="fas fa-microphone"></i>
              <span>Voice</span>
            </div>
          </div>

          <button
            className="auth-start-button"
            onClick={startAuthentication}
            disabled={!biometricStatus?.registered}
          >
            <i className="fas fa-fingerprint"></i>
            Start Authentication
          </button>

          {!biometricStatus?.registered && (
            <p className="enrollment-prompt">
              You need to enroll your biometrics first.
              <button onClick={() => setShowEnrollment(true)}>Enroll Now</button>
            </p>
          )}
        </div>
      )
    }

    return (
      <div className="biometric-auth-flow">
        <div className="auth-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${authState.progress}%` }}
            />
          </div>
          <div className="progress-steps">
            <div className={`step ${authState.currentStep === 'behavioral' ? 'active' : ''} ${authState.factors.behavioral.ready ? 'complete' : ''}`}>
              <i className="fas fa-keyboard"></i>
            </div>
            <div className={`step ${authState.currentStep === 'facial' ? 'active' : ''} ${authState.factors.facial.ready ? 'complete' : ''}`}>
              <i className="fas fa-user-circle"></i>
            </div>
            <div className={`step ${authState.currentStep === 'voice' ? 'active' : ''} ${authState.factors.voice.ready ? 'complete' : ''}`}>
              <i className="fas fa-microphone"></i>
            </div>
          </div>
        </div>

        <div className="auth-content">
          {authState.currentStep === 'behavioral' && (
            <BehavioralTracker
              sessionId={sessionId}
              onMetricsReady={handleBehavioralReady}
            />
          )}

          {authState.currentStep === 'facial' && (
            <FacialRecognition
              userId={userId}
              mode="verify"
              onComplete={handleFacialComplete}
              onError={handleError}
            />
          )}

          {authState.currentStep === 'voice' && (
            <VoiceRecognition
              userId={userId}
              mode="verify"
              onComplete={handleVoiceComplete}
              onError={handleError}
            />
          )}

          {authState.currentStep === 'processing' && (
            <div className="auth-processing">
              <div className="spinner"></div>
              <h3>Processing Authentication</h3>
              <p>Analyzing biometric data...</p>
            </div>
          )}

          {authState.currentStep === 'complete' && (
            <div className="auth-complete">
              <i className="fas fa-check-circle"></i>
              <h3>Authentication Successful</h3>
              <p>Welcome back!</p>
            </div>
          )}
        </div>

        {authState.error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-triangle"></i>
            <p>{authState.error}</p>
          </div>
        )}
      </div>
    )
  }

  if (showEnrollment || mode === 'enroll') {
    return (
      <BiometricEnrollment
        userId={userId}
        onComplete={handleEnrollmentComplete}
        onCancel={() => setShowEnrollment(false)}
      />
    )
  }

  return (
    <div className="biometric-auth-container">
      {renderAuthenticationFlow()}
    </div>
  )
}

export default BiometricAuth