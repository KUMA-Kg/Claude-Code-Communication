import React, { useState } from 'react'
import BiometricAuth from '../components/biometric-auth/BiometricAuth'
import { BiometricAuthService } from '../services/BiometricAuthService'
import '../components/biometric-auth/BiometricAuth.css'

const BiometricAuthDemo: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'enroll'>('login')
  const [userId] = useState(`demo-user-${Date.now()}`)
  const [authResult, setAuthResult] = useState<any>(null)
  const [biometricStatus, setBiometricStatus] = useState<any>(null)

  const handleAuthSuccess = (token: string, confidence: number) => {
    setIsAuthenticated(true)
    setAuthResult({
      success: true,
      confidence,
      token,
      timestamp: new Date().toISOString()
    })
    BiometricAuthService.storeBiometricToken(token)
  }

  const handleAuthFailure = (error: string) => {
    setAuthResult({
      success: false,
      error,
      timestamp: new Date().toISOString()
    })
  }

  const checkBiometricSupport = async () => {
    const availability = await BiometricAuthService.checkBiometricAvailability()
    setBiometricStatus(availability)
  }

  const logout = () => {
    setIsAuthenticated(false)
    setAuthResult(null)
    BiometricAuthService.clearBiometricToken()
  }

  React.useEffect(() => {
    checkBiometricSupport()
  }, [])

  if (isAuthenticated) {
    return (
      <div className="biometric-demo authenticated">
        <div className="demo-header">
          <h1>🎉 Authentication Successful!</h1>
          <button onClick={logout} className="logout-button">
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>

        <div className="auth-result-card">
          <div className="result-header success">
            <i className="fas fa-check-circle"></i>
            <h2>Biometric Authentication Complete</h2>
          </div>
          
          <div className="result-details">
            <div className="detail-item">
              <span className="label">Confidence Score:</span>
              <span className="value">{(authResult.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="detail-item">
              <span className="label">Authentication Time:</span>
              <span className="value">{new Date(authResult.timestamp).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="label">Token:</span>
              <span className="value token">{authResult.token.substring(0, 20)}...</span>
            </div>
          </div>

          <div className="secure-notice">
            <i className="fas fa-shield-alt"></i>
            <p>Your session is secured with multi-factor biometric authentication</p>
          </div>
        </div>

        <div className="demo-content">
          <h2>Welcome to Your Secure Dashboard</h2>
          <p>You have successfully authenticated using passwordless biometric security.</p>
          
          <div className="feature-cards">
            <div className="feature-card">
              <i className="fas fa-fingerprint"></i>
              <h3>Continuous Authentication</h3>
              <p>Your behavioral patterns are continuously monitored for enhanced security</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-lock"></i>
              <h3>Zero Passwords</h3>
              <p>No passwords to remember, steal, or forget</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-robot"></i>
              <h3>AI-Powered Security</h3>
              <p>Advanced machine learning adapts to your unique biometric signature</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="biometric-demo">
      <div className="demo-header">
        <h1>AI-Driven Biometric Authentication Demo</h1>
        <p>Experience passwordless security with multi-factor biometric authentication</p>
      </div>

      {biometricStatus && (
        <div className="biometric-support-status">
          <h3>System Capabilities</h3>
          <div className="capability-list">
            <div className={`capability ${biometricStatus.features.camera ? 'available' : 'unavailable'}`}>
              <i className="fas fa-camera"></i>
              <span>Camera</span>
              {biometricStatus.features.camera ? '✓' : '✗'}
            </div>
            <div className={`capability ${biometricStatus.features.microphone ? 'available' : 'unavailable'}`}>
              <i className="fas fa-microphone"></i>
              <span>Microphone</span>
              {biometricStatus.features.microphone ? '✓' : '✗'}
            </div>
            <div className={`capability ${biometricStatus.features.webauthn ? 'available' : 'unavailable'}`}>
              <i className="fas fa-key"></i>
              <span>WebAuthn</span>
              {biometricStatus.features.webauthn ? '✓' : '✗'}
            </div>
          </div>
          {!biometricStatus.available && (
            <p className="warning-message">
              <i className="fas fa-exclamation-triangle"></i>
              Some biometric features may not be available on your device
            </p>
          )}
        </div>
      )}

      <div className="demo-mode-selector">
        <button
          className={`mode-button ${authMode === 'login' ? 'active' : ''}`}
          onClick={() => setAuthMode('login')}
        >
          <i className="fas fa-sign-in-alt"></i>
          Login
        </button>
        <button
          className={`mode-button ${authMode === 'enroll' ? 'active' : ''}`}
          onClick={() => setAuthMode('enroll')}
        >
          <i className="fas fa-user-plus"></i>
          Enroll
        </button>
      </div>

      <div className="demo-main">
        <BiometricAuth
          userId={userId}
          mode={authMode}
          onAuthSuccess={handleAuthSuccess}
          onAuthFailure={handleAuthFailure}
        />
      </div>

      {authResult && !authResult.success && (
        <div className="auth-result-card error">
          <div className="result-header error">
            <i className="fas fa-times-circle"></i>
            <h2>Authentication Failed</h2>
          </div>
          <p>{authResult.error}</p>
        </div>
      )}

      <div className="demo-info">
        <h2>How It Works</h2>
        <div className="info-grid">
          <div className="info-item">
            <div className="step-number">1</div>
            <h3>Behavioral Analysis</h3>
            <p>Capture unique typing patterns and mouse movements that identify you</p>
          </div>
          <div className="info-item">
            <div className="step-number">2</div>
            <h3>Facial Recognition</h3>
            <p>Advanced AI verifies your identity with liveness detection</p>
          </div>
          <div className="info-item">
            <div className="step-number">3</div>
            <h3>Voice Authentication</h3>
            <p>Your unique voice characteristics provide additional security</p>
          </div>
          <div className="info-item">
            <div className="step-number">4</div>
            <h3>Adaptive Security</h3>
            <p>The system learns and adapts to your patterns over time</p>
          </div>
        </div>
      </div>

      <div className="security-features">
        <h2>Enterprise-Grade Security Features</h2>
        <ul>
          <li>
            <i className="fas fa-check"></i>
            <strong>Anti-Spoofing Technology:</strong> Prevents authentication with photos, recordings, or deepfakes
          </li>
          <li>
            <i className="fas fa-check"></i>
            <strong>Continuous Authentication:</strong> Monitors user behavior throughout the session
          </li>
          <li>
            <i className="fas fa-check"></i>
            <strong>Privacy-First Design:</strong> All biometric data is encrypted and stored locally
          </li>
          <li>
            <i className="fas fa-check"></i>
            <strong>Multi-Factor Fusion:</strong> Combines multiple biometric signals for maximum security
          </li>
          <li>
            <i className="fas fa-check"></i>
            <strong>Zero-Knowledge Architecture:</strong> No passwords or secrets stored on servers
          </li>
        </ul>
      </div>

      <style jsx>{`
        .biometric-demo {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .demo-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .demo-header h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .biometric-support-status {
          background-color: #f9f9f9;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .capability-list {
          display: flex;
          gap: 2rem;
          justify-content: center;
          margin-top: 1rem;
        }

        .capability {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border-radius: 8px;
          background-color: white;
        }

        .capability.available {
          color: #4caf50;
        }

        .capability.unavailable {
          color: #f44336;
        }

        .demo-mode-selector {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .mode-button {
          padding: 0.75rem 2rem;
          border: 2px solid #4a90e2;
          background-color: transparent;
          color: #4a90e2;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .mode-button.active {
          background-color: #4a90e2;
          color: white;
        }

        .demo-main {
          background-color: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          margin-bottom: 3rem;
        }

        .auth-result-card {
          background-color: white;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .result-header.success {
          color: #4caf50;
        }

        .result-header.error {
          color: #f44336;
        }

        .result-header i {
          font-size: 2rem;
        }

        .result-details {
          display: grid;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background-color: #f9f9f9;
          border-radius: 8px;
        }

        .detail-item .label {
          font-weight: 600;
          color: #666;
        }

        .detail-item .value {
          color: #333;
        }

        .detail-item .token {
          font-family: monospace;
          font-size: 0.9rem;
        }

        .secure-notice {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background-color: #e3f2fd;
          border-radius: 8px;
          color: #1976d2;
        }

        .demo-info {
          margin-bottom: 3rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .info-item {
          text-align: center;
          padding: 2rem;
          background-color: #f9f9f9;
          border-radius: 12px;
          position: relative;
        }

        .step-number {
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 40px;
          background-color: #4a90e2;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .security-features {
          background-color: #f0f7ff;
          border-radius: 12px;
          padding: 2rem;
        }

        .security-features ul {
          list-style: none;
          padding: 0;
          margin-top: 1.5rem;
        }

        .security-features li {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background-color: white;
          border-radius: 8px;
        }

        .security-features i {
          color: #4caf50;
          flex-shrink: 0;
        }

        .feature-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .feature-card {
          background-color: #f9f9f9;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
        }

        .feature-card i {
          font-size: 3rem;
          color: #4a90e2;
          margin-bottom: 1rem;
        }

        .logout-button {
          background-color: #f44336;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logout-button:hover {
          background-color: #d32f2f;
        }

        .authenticated .demo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .demo-content {
          background-color: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .warning-message {
          background-color: #fff3cd;
          color: #856404;
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .biometric-demo {
            padding: 1rem;
          }

          .info-grid,
          .feature-cards {
            grid-template-columns: 1fr;
          }

          .capability-list {
            flex-direction: column;
          }

          .authenticated .demo-header {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  )
}

export default BiometricAuthDemo