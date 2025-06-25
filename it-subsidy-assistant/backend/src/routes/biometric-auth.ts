import { Router, Request, Response } from 'express'
import multer from 'multer'
import BiometricAuthCore from '../biometric-auth/BiometricAuthCore'
import BehavioralBiometrics from '../biometric-auth/BehavioralBiometrics'
import FacialRecognition from '../biometric-auth/FacialRecognition'
import VoiceRecognition from '../biometric-auth/VoiceRecognition'
import { logger } from '../utils/logger'
import { v4 as uuidv4 } from 'uuid'

const router = Router()
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})

/**
 * Start biometric session
 */
router.post('/session/start', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body
    const sessionId = uuidv4()
    
    // Start behavioral tracking
    BehavioralBiometrics.startSession(sessionId, userId)
    
    res.json({
      success: true,
      sessionId,
      message: 'Biometric session started'
    })
  } catch (error) {
    logger.error('Failed to start biometric session:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to start session'
    })
  }
})

/**
 * Record behavioral events
 */
router.post('/behavioral/record', async (req: Request, res: Response) => {
  try {
    const { sessionId, eventType, eventData } = req.body
    
    if (eventType === 'keystroke') {
      BehavioralBiometrics.recordKeystroke(sessionId, eventData)
    } else if (eventType === 'mouse') {
      BehavioralBiometrics.recordMouseEvent(sessionId, eventData)
    }
    
    res.json({ success: true })
  } catch (error) {
    logger.error('Failed to record behavioral event:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to record event'
    })
  }
})

/**
 * Get current behavioral metrics
 */
router.get('/behavioral/metrics/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    const metrics = BehavioralBiometrics.getCurrentMetrics(sessionId)
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      })
    }
    
    res.json({
      success: true,
      metrics: BehavioralBiometrics.exportSessionData(sessionId)
    })
  } catch (error) {
    logger.error('Failed to get behavioral metrics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics'
    })
  }
})

/**
 * Enroll face
 */
router.post('/facial/enroll', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.body
    const imageBuffer = req.file?.buffer
    
    if (!imageBuffer) {
      return res.status(400).json({
        success: false,
        error: 'No image provided'
      })
    }
    
    const result = await FacialRecognition.enrollFace(userId, imageBuffer)
    
    res.json(result)
  } catch (error) {
    logger.error('Failed to enroll face:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to enroll face'
    })
  }
})

/**
 * Verify face
 */
router.post('/facial/verify', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.body
    const imageBuffer = req.file?.buffer
    
    if (!imageBuffer) {
      return res.status(400).json({
        success: false,
        error: 'No image provided'
      })
    }
    
    const result = await FacialRecognition.verifyFace(userId, imageBuffer)
    
    res.json(result)
  } catch (error) {
    logger.error('Failed to verify face:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to verify face'
    })
  }
})

/**
 * Get liveness challenge
 */
router.get('/facial/liveness-challenge', async (req: Request, res: Response) => {
  try {
    const challenge = FacialRecognition.generateLivenessChallenge()
    
    res.json({
      success: true,
      challenge
    })
  } catch (error) {
    logger.error('Failed to generate liveness challenge:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate challenge'
    })
  }
})

/**
 * Verify liveness challenge
 */
router.post('/facial/verify-liveness', upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    const { challenge } = req.body
    const files = req.files as Express.Multer.File[]
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images provided'
      })
    }
    
    const imageBuffers = files.map(f => f.buffer)
    const result = await FacialRecognition.verifyLivenessChallenge(
      JSON.parse(challenge),
      imageBuffers
    )
    
    res.json(result)
  } catch (error) {
    logger.error('Failed to verify liveness:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to verify liveness'
    })
  }
})

/**
 * Enroll voice
 */
router.post('/voice/enroll', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const { userId, sampleRate } = req.body
    const audioBuffer = req.file?.buffer
    
    if (!audioBuffer) {
      return res.status(400).json({
        success: false,
        error: 'No audio provided'
      })
    }
    
    const result = await VoiceRecognition.enrollVoice(
      userId,
      audioBuffer,
      parseInt(sampleRate) || 16000
    )
    
    res.json(result)
  } catch (error) {
    logger.error('Failed to enroll voice:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to enroll voice'
    })
  }
})

/**
 * Verify voice
 */
router.post('/voice/verify', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const { userId, sampleRate } = req.body
    const audioBuffer = req.file?.buffer
    
    if (!audioBuffer) {
      return res.status(400).json({
        success: false,
        error: 'No audio provided'
      })
    }
    
    const result = await VoiceRecognition.verifyVoice(
      userId,
      audioBuffer,
      parseInt(sampleRate) || 16000
    )
    
    res.json(result)
  } catch (error) {
    logger.error('Failed to verify voice:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to verify voice'
    })
  }
})

/**
 * Get voice challenge
 */
router.get('/voice/challenge', async (req: Request, res: Response) => {
  try {
    const { language = 'en' } = req.query
    const challenge = VoiceRecognition.generateVoiceChallenge(language as string)
    
    res.json({
      success: true,
      challenge
    })
  } catch (error) {
    logger.error('Failed to generate voice challenge:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate challenge'
    })
  }
})

/**
 * Multi-factor authentication
 */
router.post('/authenticate', upload.fields([
  { name: 'faceImage', maxCount: 1 },
  { name: 'voiceAudio', maxCount: 1 }
]), async (req: Request, res: Response) => {
  try {
    const { userId, sessionId, sampleRate } = req.body
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    
    const biometricData: any = {}
    
    // Get behavioral data
    if (sessionId) {
      const behavioralMetrics = BehavioralBiometrics.getCurrentMetrics(sessionId)
      if (behavioralMetrics) {
        biometricData.keystroke = {
          dwellTimes: behavioralMetrics.keystrokeData.dwellTimes,
          flightTimes: behavioralMetrics.keystrokeData.flightTimes,
          typingSpeed: behavioralMetrics.keystrokeData.typingSpeed,
          typingRhythm: behavioralMetrics.keystrokeData.typingRhythm
        }
        
        biometricData.mouse = {
          speed: behavioralMetrics.mouseData.movementSpeed[0],
          acceleration: behavioralMetrics.mouseData.movementAcceleration,
          curveComplexity: behavioralMetrics.mouseData.curveComplexity,
          movementVectors: behavioralMetrics.mouseData.movementSpeed.map((s, i) => [i, s])
        }
        
        biometricData.behavioral = {
          interactionPatterns: behavioralMetrics.interactionData.navigationPattern,
          timeOfDay: new Date().getHours(),
          deviceFingerprint: behavioralMetrics.deviceData.userAgent
        }
      }
    }
    
    // Process facial data
    if (files.faceImage && files.faceImage[0]) {
      const faceResult = await FacialRecognition.verifyFace(userId, files.faceImage[0].buffer)
      if (faceResult.success) {
        biometricData.facial = {
          confidence: faceResult.confidence,
          quality: faceResult.quality
        }
      }
    }
    
    // Process voice data
    if (files.voiceAudio && files.voiceAudio[0]) {
      const voiceResult = await VoiceRecognition.verifyVoice(
        userId,
        files.voiceAudio[0].buffer,
        parseInt(sampleRate) || 16000
      )
      if (voiceResult.success) {
        biometricData.voice = {
          confidence: voiceResult.confidence,
          quality: voiceResult.quality
        }
      }
    }
    
    // Perform multi-factor authentication
    const authResult = await BiometricAuthCore.authenticate(userId, biometricData)
    
    // End behavioral session if authentication succeeds
    if (authResult.success && sessionId) {
      BehavioralBiometrics.endSession(sessionId)
    }
    
    res.json(authResult)
  } catch (error) {
    logger.error('Multi-factor authentication failed:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
})

/**
 * Register user for biometric authentication
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body
    
    const result = await BiometricAuthCore.registerUser(userId, {})
    
    res.json({
      success: result,
      message: result ? 'User registered for biometric authentication' : 'Registration failed'
    })
  } catch (error) {
    logger.error('Failed to register user:', error)
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    })
  }
})

/**
 * Get authentication status
 */
router.get('/status/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    
    const authStats = BiometricAuthCore.getAuthStats(userId)
    const facialStatus = FacialRecognition.getEnrollmentStatus(userId)
    const voiceStatus = VoiceRecognition.getEnrollmentStatus(userId)
    
    res.json({
      success: true,
      registered: authStats !== null,
      biometrics: {
        facial: facialStatus,
        voice: voiceStatus,
        behavioral: authStats?.factorsAvailable?.keystroke || false
      },
      trustScore: authStats?.trustScore || 0,
      lastAuthenticated: authStats?.lastUpdated
    })
  } catch (error) {
    logger.error('Failed to get authentication status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get status'
    })
  }
})

/**
 * Delete user biometric data
 */
router.delete('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    
    // Delete from all systems
    await BiometricAuthCore.deleteProfile(userId)
    FacialRecognition.deleteUserData(userId)
    VoiceRecognition.deleteUserData(userId)
    
    res.json({
      success: true,
      message: 'User biometric data deleted'
    })
  } catch (error) {
    logger.error('Failed to delete user data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete data'
    })
  }
})

export default router