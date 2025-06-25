import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
const BIOMETRIC_API = `${API_BASE_URL}/biometric`

export interface BiometricAuthResult {
  success: boolean
  token?: string
  confidence: number
  error?: string
}

export interface BiometricStatus {
  registered: boolean
  biometrics: {
    facial: { enrolled: boolean; count: number }
    voice: { enrolled: boolean; count: number }
    behavioral: boolean
  }
  trustScore: number
  lastAuthenticated?: Date
}

class BiometricAuthServiceClass {
  /**
   * Start a new biometric session
   */
  async startSession(userId: string): Promise<{ sessionId: string }> {
    const response = await axios.post(`${BIOMETRIC_API}/session/start`, { userId })
    return response.data
  }

  /**
   * Record behavioral biometric events
   */
  async recordBehavioralEvent(
    sessionId: string,
    eventType: 'keystroke' | 'mouse',
    eventData: any
  ): Promise<void> {
    await axios.post(`${BIOMETRIC_API}/behavioral/record`, {
      sessionId,
      eventType,
      eventData
    })
  }

  /**
   * Get current behavioral metrics
   */
  async getBehavioralMetrics(sessionId: string): Promise<any> {
    const response = await axios.get(`${BIOMETRIC_API}/behavioral/metrics/${sessionId}`)
    return response.data.metrics
  }

  /**
   * Enroll face for authentication
   */
  async enrollFace(formData: FormData): Promise<any> {
    const response = await axios.post(`${BIOMETRIC_API}/facial/enroll`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  /**
   * Verify face
   */
  async verifyFace(formData: FormData): Promise<any> {
    const response = await axios.post(`${BIOMETRIC_API}/facial/verify`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  /**
   * Get liveness challenge
   */
  async getLivenessChallenge(): Promise<any> {
    const response = await axios.get(`${BIOMETRIC_API}/facial/liveness-challenge`)
    return response.data.challenge
  }

  /**
   * Verify liveness challenge
   */
  async verifyLiveness(challenge: any, images: string[]): Promise<any> {
    const formData = new FormData()
    formData.append('challenge', JSON.stringify(challenge))
    
    // Convert base64 images to blobs
    for (let i = 0; i < images.length; i++) {
      const base64Response = await fetch(images[i])
      const blob = await base64Response.blob()
      formData.append('images', blob, `image${i}.jpg`)
    }
    
    const response = await axios.post(`${BIOMETRIC_API}/facial/verify-liveness`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  /**
   * Enroll voice
   */
  async enrollVoice(formData: FormData): Promise<any> {
    const response = await axios.post(`${BIOMETRIC_API}/voice/enroll`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  /**
   * Verify voice
   */
  async verifyVoice(formData: FormData): Promise<any> {
    const response = await axios.post(`${BIOMETRIC_API}/voice/verify`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  /**
   * Get voice challenge
   */
  async getVoiceChallenge(language: string = 'en'): Promise<any> {
    const response = await axios.get(`${BIOMETRIC_API}/voice/challenge`, {
      params: { language }
    })
    return response.data.challenge
  }

  /**
   * Perform multi-factor biometric authentication
   */
  async authenticate(data: {
    userId: string
    sessionId?: string
    behavioral?: boolean
    facial?: boolean
    voice?: boolean
  }): Promise<BiometricAuthResult> {
    const formData = new FormData()
    formData.append('userId', data.userId)
    
    if (data.sessionId) {
      formData.append('sessionId', data.sessionId)
    }
    
    // Add placeholders for biometric data that would be collected
    // In a real implementation, this would include actual biometric data
    
    const response = await axios.post(`${BIOMETRIC_API}/authenticate`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    return response.data
  }

  /**
   * Register user for biometric authentication
   */
  async registerUser(userId: string): Promise<boolean> {
    const response = await axios.post(`${BIOMETRIC_API}/register`, { userId })
    return response.data.success
  }

  /**
   * Get authentication status
   */
  async getAuthenticationStatus(userId: string): Promise<BiometricStatus> {
    const response = await axios.get(`${BIOMETRIC_API}/status/${userId}`)
    return response.data
  }

  /**
   * Delete user biometric data
   */
  async deleteUserData(userId: string): Promise<boolean> {
    const response = await axios.delete(`${BIOMETRIC_API}/user/${userId}`)
    return response.data.success
  }

  /**
   * Store biometric token in secure storage
   */
  storeBiometricToken(token: string): void {
    // Use secure storage in production
    localStorage.setItem('biometric_token', token)
  }

  /**
   * Get stored biometric token
   */
  getBiometricToken(): string | null {
    return localStorage.getItem('biometric_token')
  }

  /**
   * Clear biometric token
   */
  clearBiometricToken(): void {
    localStorage.removeItem('biometric_token')
  }

  /**
   * Check if biometric authentication is available
   */
  async checkBiometricAvailability(): Promise<{
    available: boolean
    features: {
      camera: boolean
      microphone: boolean
      webauthn: boolean
    }
  }> {
    const features = {
      camera: false,
      microphone: false,
      webauthn: false
    }

    // Check camera
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      features.camera = devices.some(device => device.kind === 'videoinput')
      features.microphone = devices.some(device => device.kind === 'audioinput')
    } catch (error) {
      console.error('Error checking media devices:', error)
    }

    // Check WebAuthn support
    features.webauthn = !!(
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    )

    const available = features.camera || features.microphone

    return { available, features }
  }

  /**
   * Request permissions for biometric features
   */
  async requestPermissions(): Promise<{
    camera: boolean
    microphone: boolean
  }> {
    const permissions = {
      camera: false,
      microphone: false
    }

    try {
      // Request camera permission
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true })
      permissions.camera = true
      cameraStream.getTracks().forEach(track => track.stop())
    } catch (error) {
      console.error('Camera permission denied:', error)
    }

    try {
      // Request microphone permission
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      permissions.microphone = true
      micStream.getTracks().forEach(track => track.stop())
    } catch (error) {
      console.error('Microphone permission denied:', error)
    }

    return permissions
  }

  /**
   * Calculate authentication strength based on enrolled factors
   */
  calculateAuthStrength(status: BiometricStatus): {
    score: number
    level: 'weak' | 'medium' | 'strong' | 'very-strong'
    recommendations: string[]
  } {
    let score = 0
    const recommendations: string[] = []

    // Check enrolled factors
    if (status.biometrics.behavioral) score += 25
    else recommendations.push('Enable behavioral biometrics for continuous authentication')

    if (status.biometrics.facial.enrolled) score += 35
    else recommendations.push('Enroll facial recognition for secure visual authentication')

    if (status.biometrics.voice.enrolled) score += 30
    else recommendations.push('Add voice recognition for additional security')

    // Trust score bonus
    score += status.trustScore * 10

    // Determine level
    let level: 'weak' | 'medium' | 'strong' | 'very-strong'
    if (score >= 80) level = 'very-strong'
    else if (score >= 60) level = 'strong'
    else if (score >= 40) level = 'medium'
    else level = 'weak'

    return { score, level, recommendations }
  }
}

export const BiometricAuthService = new BiometricAuthServiceClass()