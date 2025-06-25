import React, { useState } from 'react'
import { BiometricAuthService } from '../../services/BiometricAuthService'
import BehavioralTracker from './BehavioralTracker'
import FacialRecognition from './FacialRecognition'
import VoiceRecognition from './VoiceRecognition'
import './BiometricAuth.css'

interface BiometricEnrollmentProps {
  userId: string
  onComplete: () => void
  onCancel: () => void
}

interface EnrollmentStep {
  id: string
  name: string
  description: string
  icon: string
  status: 'pending' | 'active' | 'completed' | 'skipped'
}

const BiometricEnrollment: React.FC<BiometricEnrollmentProps> = ({
  userId,
  onComplete,
  onCancel
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [sessionId, setSessionId] = useState('')
  const [steps, setSteps] = useState<EnrollmentStep[]>([
    {
      id: 'intro',
      name: 'Introduction',
      description: 'Learn about biometric authentication',
      icon: 'fa-info-circle',
      status: 'active'
    },
    {
      id: 'behavioral',
      name: 'Behavioral Patterns',
      description: 'Capture your typing and mouse patterns',
      icon: 'fa-keyboard',
      status: 'pending'
    },
    {
      id: 'facial',
      name: 'Facial Recognition',
      description: 'Enroll your face for secure authentication',
      icon: 'fa-user-circle',
      status: 'pending'
    },
    {
      id: 'voice',
      name: 'Voice Recognition',
      description: 'Record your unique voice print',
      icon: 'fa-microphone',
      status: 'pending'
    },
    {
      id: 'complete',
      name: 'Complete',
      description: 'Review and finish enrollment',
      icon: 'fa-check-circle',
      status: 'pending'
    }
  ])

  const updateStepStatus = (stepId: string, status: EnrollmentStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ))
  }

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      updateStepStatus(steps[currentStepIndex].id, 'completed')
      setCurrentStepIndex(prev => prev + 1)
      updateStepStatus(steps[currentStepIndex + 1].id, 'active')
    }
  }

  const skipStep = () => {
    if (currentStepIndex < steps.length - 1) {
      updateStepStatus(steps[currentStepIndex].id, 'skipped')
      setCurrentStepIndex(prev => prev + 1)
      updateStepStatus(steps[currentStepIndex + 1].id, 'active')
    }
  }

  const handleBehavioralComplete = async () => {
    // Register user for biometric auth
    await BiometricAuthService.registerUser(userId)
    nextStep()
  }

  const handleFacialComplete = () => {
    nextStep()
  }

  const handleVoiceComplete = () => {
    nextStep()
  }

  const handleError = (error: string) => {
    console.error('Enrollment error:', error)
    // Optionally show error message
  }

  const completeEnrollment = () => {
    onComplete()
  }

  const renderStepContent = () => {
    const currentStep = steps[currentStepIndex]

    switch (currentStep.id) {
      case 'intro':
        return (
          <div className="enrollment-intro">
            <h2>Welcome to Passwordless Authentication</h2>
            <p>Enhance your security with biometric authentication that recognizes you by:</p>
            
            <div className="biometric-features">
              <div className="feature">
                <i className="fas fa-keyboard"></i>
                <h3>Behavioral Patterns</h3>
                <p>Your unique typing rhythm and mouse movements</p>
              </div>
              <div className="feature">
                <i className="fas fa-user-circle"></i>
                <h3>Facial Recognition</h3>
                <p>Advanced AI-powered face verification with liveness detection</p>
              </div>
              <div className="feature">
                <i className="fas fa-microphone"></i>
                <h3>Voice Recognition</h3>
                <p>Your unique voice characteristics and speech patterns</p>
              </div>
            </div>

            <div className="privacy-info">
              <i className="fas fa-lock"></i>
              <div>
                <h4>Your Privacy is Protected</h4>
                <ul>
                  <li>All biometric data is encrypted end-to-end</li>
                  <li>Data is stored securely and never shared</li>
                  <li>You can delete your data at any time</li>
                  <li>Compliant with GDPR and privacy regulations</li>
                </ul>
              </div>
            </div>

            <div className="enrollment-actions">
              <button className="primary-button" onClick={nextStep}>
                <i className="fas fa-arrow-right"></i>
                Start Enrollment
              </button>
              <button className="secondary-button" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </div>
        )

      case 'behavioral':
        return (
          <div className="enrollment-step">
            <h2>Behavioral Pattern Enrollment</h2>
            <p>We'll capture your unique typing and mouse patterns for authentication</p>
            
            <BehavioralTracker
              sessionId={sessionId}
              onMetricsReady={handleBehavioralComplete}
            />
            
            <div className="enrollment-actions">
              <button className="skip-button" onClick={skipStep}>
                Skip this step
              </button>
            </div>
          </div>
        )

      case 'facial':
        return (
          <div className="enrollment-step">
            <h2>Facial Recognition Enrollment</h2>
            <p>Enroll your face for secure, convenient authentication</p>
            
            <FacialRecognition
              userId={userId}
              mode="enroll"
              onComplete={handleFacialComplete}
              onError={handleError}
            />
            
            <div className="enrollment-actions">
              <button className="skip-button" onClick={skipStep}>
                Skip this step
              </button>
            </div>
          </div>
        )

      case 'voice':
        return (
          <div className="enrollment-step">
            <h2>Voice Recognition Enrollment</h2>
            <p>Record your voice for an additional layer of security</p>
            
            <VoiceRecognition
              userId={userId}
              mode="enroll"
              onComplete={handleVoiceComplete}
              onError={handleError}
            />
            
            <div className="enrollment-actions">
              <button className="skip-button" onClick={skipStep}>
                Skip this step
              </button>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="enrollment-complete">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            
            <h2>Enrollment Complete!</h2>
            <p>Your biometric authentication is now set up</p>
            
            <div className="enrollment-summary">
              <h3>Enrolled Biometrics:</h3>
              <div className="summary-items">
                {steps.slice(1, -1).map(step => (
                  <div 
                    key={step.id}
                    className={`summary-item ${step.status}`}
                  >
                    <i className={`fas ${step.icon}`}></i>
                    <span>{step.name}</span>
                    {step.status === 'completed' && (
                      <i className="fas fa-check status-icon"></i>
                    )}
                    {step.status === 'skipped' && (
                      <i className="fas fa-minus status-icon"></i>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="next-steps">
              <h3>What's Next?</h3>
              <ul>
                <li>Use biometric authentication for passwordless login</li>
                <li>Your security adapts and improves over time</li>
                <li>Add more biometric factors anytime in settings</li>
              </ul>
            </div>
            
            <div className="enrollment-actions">
              <button className="primary-button" onClick={completeEnrollment}>
                <i className="fas fa-sign-in-alt"></i>
                Start Using Biometric Auth
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="biometric-enrollment">
      <div className="enrollment-header">
        <h1>Biometric Authentication Setup</h1>
        <div className="progress-indicator">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`progress-step ${step.status}`}
            >
              <div className="step-icon">
                <i className={`fas ${step.icon}`}></i>
              </div>
              <span className="step-name">{step.name}</span>
              {index < steps.length - 1 && (
                <div className="step-connector" />
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="enrollment-content">
        {renderStepContent()}
      </div>
    </div>
  )
}

export default BiometricEnrollment