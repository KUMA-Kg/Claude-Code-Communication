import { EventEmitter } from 'events'
import { logger } from '../utils/logger'

/**
 * Behavioral Biometrics Tracker
 * Captures and analyzes user behavior patterns including typing and mouse movements
 */

export interface KeystrokeEvent {
  key: string
  keyCode: number
  timestamp: number
  eventType: 'keydown' | 'keyup'
  pressure?: number // For pressure-sensitive keyboards
}

export interface MouseEvent {
  x: number
  y: number
  timestamp: number
  eventType: 'move' | 'click' | 'scroll'
  button?: number
  deltaX?: number
  deltaY?: number
  pressure?: number // For pressure-sensitive touchpads
}

export interface BehavioralData {
  sessionId: string
  userId?: string
  keystrokeData: KeystrokeMetrics
  mouseData: MouseMetrics
  interactionData: InteractionMetrics
  deviceData: DeviceFingerprint
  timestamp: Date
}

export interface KeystrokeMetrics {
  dwellTimes: number[] // Time between keydown and keyup
  flightTimes: number[] // Time between keyup and next keydown
  interKeyTimes: number[] // Time between consecutive keydowns
  typingSpeed: number // Characters per minute
  typingRhythm: number[] // Variance in typing intervals
  keyPressure: number[] // Average pressure per key
  backspaceFrequency: number // Corrections per 100 characters
  commonBigrams: Map<string, number[]> // Common 2-char sequences with timing
  commonTrigrams: Map<string, number[]> // Common 3-char sequences with timing
}

export interface MouseMetrics {
  movementSpeed: number[]
  movementAcceleration: number[]
  movementJerk: number[] // Rate of change of acceleration
  curveComplexity: number // Measure of path curvature
  angleChanges: number[] // Direction changes
  clickDuration: number[] // Time between mousedown and mouseup
  doubleClickInterval: number[] // Time between clicks
  scrollSpeed: number[]
  scrollAcceleration: number[]
  dragPatterns: {
    distance: number[]
    duration: number[]
    speed: number[]
  }
  hoverTime: number[] // Time spent hovering over elements
  movementEfficiency: number // Direct distance / actual distance
}

export interface InteractionMetrics {
  sessionDuration: number
  activeTime: number
  idleTime: number
  focusChanges: number
  tabSwitches: number
  copyPasteFrequency: number
  formFillSpeed: number
  navigationPattern: string[] // Sequence of page/section visits
  errorCorrectionRate: number
  shortcutUsage: Map<string, number>
}

export interface DeviceFingerprint {
  screenResolution: string
  colorDepth: number
  timezone: string
  language: string
  platform: string
  userAgent: string
  touchSupport: boolean
  deviceMemory?: number
  hardwareConcurrency?: number
  gpuInfo?: string
  audioFingerprint?: string
}

export class BehavioralBiometricsTracker extends EventEmitter {
  private sessions: Map<string, BehavioralData> = new Map()
  private keystrokeBuffer: Map<string, KeystrokeEvent[]> = new Map()
  private mouseBuffer: Map<string, MouseEvent[]> = new Map()
  private readonly bufferSize = 1000 // Maximum events to buffer
  private readonly analysisInterval = 5000 // Analyze every 5 seconds

  constructor() {
    super()
    this.startAnalysisLoop()
  }

  /**
   * Start a new tracking session
   */
  startSession(sessionId: string, userId?: string): void {
    const session: BehavioralData = {
      sessionId,
      userId,
      keystrokeData: this.initializeKeystrokeMetrics(),
      mouseData: this.initializeMouseMetrics(),
      interactionData: this.initializeInteractionMetrics(),
      deviceData: this.initializeDeviceFingerprint(),
      timestamp: new Date()
    }

    this.sessions.set(sessionId, session)
    this.keystrokeBuffer.set(sessionId, [])
    this.mouseBuffer.set(sessionId, [])

    logger.info(`Started behavioral tracking session: ${sessionId}`)
  }

  /**
   * Record keystroke event
   */
  recordKeystroke(sessionId: string, event: KeystrokeEvent): void {
    const buffer = this.keystrokeBuffer.get(sessionId)
    if (!buffer) return

    buffer.push(event)
    
    // Limit buffer size
    if (buffer.length > this.bufferSize) {
      buffer.shift()
    }

    // Real-time analysis for certain patterns
    if (event.eventType === 'keyup') {
      this.analyzeKeystrokePattern(sessionId, buffer.slice(-10))
    }
  }

  /**
   * Record mouse event
   */
  recordMouseEvent(sessionId: string, event: MouseEvent): void {
    const buffer = this.mouseBuffer.get(sessionId)
    if (!buffer) return

    buffer.push(event)
    
    // Limit buffer size
    if (buffer.length > this.bufferSize) {
      buffer.shift()
    }

    // Real-time analysis for certain patterns
    if (buffer.length % 50 === 0) { // Analyze every 50 events
      this.analyzeMousePattern(sessionId, buffer.slice(-50))
    }
  }

  /**
   * Get current behavioral metrics
   */
  getCurrentMetrics(sessionId: string): BehavioralData | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    // Update metrics before returning
    this.updateKeystrokeMetrics(sessionId)
    this.updateMouseMetrics(sessionId)
    this.updateInteractionMetrics(sessionId)

    return session
  }

  /**
   * Analyze keystroke patterns
   */
  private analyzeKeystrokePattern(sessionId: string, events: KeystrokeEvent[]): void {
    if (events.length < 2) return

    const session = this.sessions.get(sessionId)
    if (!session) return

    const metrics = session.keystrokeData

    // Calculate dwell times (keydown to keyup for same key)
    const keydownEvents = new Map<string, number>()
    
    events.forEach(event => {
      if (event.eventType === 'keydown') {
        keydownEvents.set(event.key, event.timestamp)
      } else if (event.eventType === 'keyup' && keydownEvents.has(event.key)) {
        const dwellTime = event.timestamp - keydownEvents.get(event.key)!
        metrics.dwellTimes.push(dwellTime)
        keydownEvents.delete(event.key)
        
        // Keep only recent dwell times
        if (metrics.dwellTimes.length > 100) {
          metrics.dwellTimes.shift()
        }
      }
    })

    // Calculate flight times and typing speed
    const keyupEvents = events.filter(e => e.eventType === 'keyup')
    for (let i = 1; i < keyupEvents.length; i++) {
      const flightTime = keyupEvents[i].timestamp - keyupEvents[i - 1].timestamp
      metrics.flightTimes.push(flightTime)
      
      if (metrics.flightTimes.length > 100) {
        metrics.flightTimes.shift()
      }
    }

    // Update typing speed (characters per minute)
    if (keyupEvents.length > 0) {
      const timeSpan = keyupEvents[keyupEvents.length - 1].timestamp - keyupEvents[0].timestamp
      if (timeSpan > 0) {
        metrics.typingSpeed = (keyupEvents.length / timeSpan) * 60000 // Convert to CPM
      }
    }

    // Detect backspace frequency
    const backspaceCount = events.filter(e => e.key === 'Backspace').length
    const totalKeys = events.filter(e => e.eventType === 'keyup').length
    if (totalKeys > 0) {
      metrics.backspaceFrequency = (backspaceCount / totalKeys) * 100
    }

    // Analyze bigrams and trigrams
    this.analyzeBigramsAndTrigrams(sessionId, events)
  }

  /**
   * Analyze mouse patterns
   */
  private analyzeMousePattern(sessionId: string, events: MouseEvent[]): void {
    if (events.length < 2) return

    const session = this.sessions.get(sessionId)
    if (!session) return

    const metrics = session.mouseData
    const moveEvents = events.filter(e => e.eventType === 'move')

    if (moveEvents.length > 1) {
      // Calculate movement speed and acceleration
      for (let i = 1; i < moveEvents.length; i++) {
        const dx = moveEvents[i].x - moveEvents[i - 1].x
        const dy = moveEvents[i].y - moveEvents[i - 1].y
        const dt = moveEvents[i].timestamp - moveEvents[i - 1].timestamp
        
        if (dt > 0) {
          const distance = Math.sqrt(dx * dx + dy * dy)
          const speed = distance / dt
          metrics.movementSpeed.push(speed)
          
          // Calculate acceleration
          if (i > 1 && metrics.movementSpeed.length > 1) {
            const prevSpeed = metrics.movementSpeed[metrics.movementSpeed.length - 2]
            const acceleration = (speed - prevSpeed) / dt
            metrics.movementAcceleration.push(acceleration)
            
            // Calculate jerk (rate of change of acceleration)
            if (metrics.movementAcceleration.length > 1) {
              const prevAccel = metrics.movementAcceleration[metrics.movementAcceleration.length - 2]
              const jerk = (acceleration - prevAccel) / dt
              metrics.movementJerk.push(jerk)
            }
          }
          
          // Calculate angle changes
          if (i > 1) {
            const prevDx = moveEvents[i - 1].x - moveEvents[i - 2].x
            const prevDy = moveEvents[i - 1].y - moveEvents[i - 2].y
            const angle1 = Math.atan2(prevDy, prevDx)
            const angle2 = Math.atan2(dy, dx)
            let angleChange = angle2 - angle1
            
            // Normalize angle to [-π, π]
            while (angleChange > Math.PI) angleChange -= 2 * Math.PI
            while (angleChange < -Math.PI) angleChange += 2 * Math.PI
            
            metrics.angleChanges.push(Math.abs(angleChange))
          }
        }
      }
      
      // Calculate curve complexity
      metrics.curveComplexity = this.calculateCurveComplexity(moveEvents)
      
      // Calculate movement efficiency
      if (moveEvents.length > 0) {
        const startPoint = moveEvents[0]
        const endPoint = moveEvents[moveEvents.length - 1]
        const directDistance = Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) + 
          Math.pow(endPoint.y - startPoint.y, 2)
        )
        
        let actualDistance = 0
        for (let i = 1; i < moveEvents.length; i++) {
          const dx = moveEvents[i].x - moveEvents[i - 1].x
          const dy = moveEvents[i].y - moveEvents[i - 1].y
          actualDistance += Math.sqrt(dx * dx + dy * dy)
        }
        
        metrics.movementEfficiency = directDistance / (actualDistance || 1)
      }
    }

    // Analyze click patterns
    const clickEvents = events.filter(e => e.eventType === 'click')
    if (clickEvents.length > 1) {
      for (let i = 1; i < clickEvents.length; i++) {
        const interval = clickEvents[i].timestamp - clickEvents[i - 1].timestamp
        metrics.doubleClickInterval.push(interval)
      }
    }

    // Analyze scroll patterns
    const scrollEvents = events.filter(e => e.eventType === 'scroll')
    if (scrollEvents.length > 1) {
      for (let i = 1; i < scrollEvents.length; i++) {
        const dt = scrollEvents[i].timestamp - scrollEvents[i - 1].timestamp
        if (dt > 0 && scrollEvents[i].deltaY !== undefined) {
          const speed = Math.abs(scrollEvents[i].deltaY!) / dt
          metrics.scrollSpeed.push(speed)
          
          if (i > 1 && metrics.scrollSpeed.length > 1) {
            const prevSpeed = metrics.scrollSpeed[metrics.scrollSpeed.length - 2]
            const acceleration = (speed - prevSpeed) / dt
            metrics.scrollAcceleration.push(acceleration)
          }
        }
      }
    }

    // Keep metrics arrays bounded
    this.boundMetricsArrays(metrics)
  }

  /**
   * Calculate curve complexity using curvature analysis
   */
  private calculateCurveComplexity(moveEvents: MouseEvent[]): number {
    if (moveEvents.length < 3) return 0

    let totalCurvature = 0
    let count = 0

    for (let i = 1; i < moveEvents.length - 1; i++) {
      const p1 = moveEvents[i - 1]
      const p2 = moveEvents[i]
      const p3 = moveEvents[i + 1]

      // Calculate curvature using Menger curvature formula
      const area = Math.abs(
        (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)
      ) / 2

      const a = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
      const b = Math.sqrt(Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2))
      const c = Math.sqrt(Math.pow(p3.x - p1.x, 2) + Math.pow(p3.y - p1.y, 2))

      if (a > 0 && b > 0 && c > 0) {
        const curvature = (4 * area) / (a * b * c)
        totalCurvature += curvature
        count++
      }
    }

    return count > 0 ? totalCurvature / count : 0
  }

  /**
   * Analyze bigrams and trigrams in keystroke data
   */
  private analyzeBigramsAndTrigrams(sessionId: string, events: KeystrokeEvent[]): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const metrics = session.keystrokeData
    const keyupEvents = events.filter(e => e.eventType === 'keyup')

    // Analyze bigrams
    for (let i = 1; i < keyupEvents.length; i++) {
      const bigram = keyupEvents[i - 1].key + keyupEvents[i].key
      const timing = keyupEvents[i].timestamp - keyupEvents[i - 1].timestamp

      if (!metrics.commonBigrams.has(bigram)) {
        metrics.commonBigrams.set(bigram, [])
      }
      
      const timings = metrics.commonBigrams.get(bigram)!
      timings.push(timing)
      
      // Keep only recent timings
      if (timings.length > 10) {
        timings.shift()
      }
    }

    // Analyze trigrams
    for (let i = 2; i < keyupEvents.length; i++) {
      const trigram = keyupEvents[i - 2].key + keyupEvents[i - 1].key + keyupEvents[i].key
      const timing = keyupEvents[i].timestamp - keyupEvents[i - 2].timestamp

      if (!metrics.commonTrigrams.has(trigram)) {
        metrics.commonTrigrams.set(trigram, [])
      }
      
      const timings = metrics.commonTrigrams.get(trigram)!
      timings.push(timing)
      
      // Keep only recent timings
      if (timings.length > 10) {
        timings.shift()
      }
    }
  }

  /**
   * Update keystroke metrics from buffer
   */
  private updateKeystrokeMetrics(sessionId: string): void {
    const events = this.keystrokeBuffer.get(sessionId)
    if (!events || events.length === 0) return

    this.analyzeKeystrokePattern(sessionId, events)
  }

  /**
   * Update mouse metrics from buffer
   */
  private updateMouseMetrics(sessionId: string): void {
    const events = this.mouseBuffer.get(sessionId)
    if (!events || events.length === 0) return

    this.analyzeMousePattern(sessionId, events)
  }

  /**
   * Update interaction metrics
   */
  private updateInteractionMetrics(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const now = Date.now()
    const sessionStart = session.timestamp.getTime()
    session.interactionData.sessionDuration = now - sessionStart

    // Calculate active vs idle time based on event frequency
    const keystrokeEvents = this.keystrokeBuffer.get(sessionId) || []
    const mouseEvents = this.mouseBuffer.get(sessionId) || []
    
    const allEvents = [...keystrokeEvents, ...mouseEvents]
      .sort((a, b) => a.timestamp - b.timestamp)

    let activeTime = 0
    let lastEventTime = sessionStart

    for (const event of allEvents) {
      if (event.timestamp - lastEventTime < 5000) { // 5 seconds idle threshold
        activeTime += event.timestamp - lastEventTime
      }
      lastEventTime = event.timestamp
    }

    session.interactionData.activeTime = activeTime
    session.interactionData.idleTime = session.interactionData.sessionDuration - activeTime
  }

  /**
   * Bound metrics arrays to prevent memory growth
   */
  private boundMetricsArrays(metrics: MouseMetrics): void {
    const maxSize = 100

    const arrays = [
      metrics.movementSpeed,
      metrics.movementAcceleration,
      metrics.movementJerk,
      metrics.angleChanges,
      metrics.clickDuration,
      metrics.doubleClickInterval,
      metrics.scrollSpeed,
      metrics.scrollAcceleration,
      metrics.hoverTime
    ]

    arrays.forEach(arr => {
      while (arr.length > maxSize) {
        arr.shift()
      }
    })
  }

  /**
   * Initialize empty metrics
   */
  private initializeKeystrokeMetrics(): KeystrokeMetrics {
    return {
      dwellTimes: [],
      flightTimes: [],
      interKeyTimes: [],
      typingSpeed: 0,
      typingRhythm: [],
      keyPressure: [],
      backspaceFrequency: 0,
      commonBigrams: new Map(),
      commonTrigrams: new Map()
    }
  }

  private initializeMouseMetrics(): MouseMetrics {
    return {
      movementSpeed: [],
      movementAcceleration: [],
      movementJerk: [],
      curveComplexity: 0,
      angleChanges: [],
      clickDuration: [],
      doubleClickInterval: [],
      scrollSpeed: [],
      scrollAcceleration: [],
      dragPatterns: {
        distance: [],
        duration: [],
        speed: []
      },
      hoverTime: [],
      movementEfficiency: 0
    }
  }

  private initializeInteractionMetrics(): InteractionMetrics {
    return {
      sessionDuration: 0,
      activeTime: 0,
      idleTime: 0,
      focusChanges: 0,
      tabSwitches: 0,
      copyPasteFrequency: 0,
      formFillSpeed: 0,
      navigationPattern: [],
      errorCorrectionRate: 0,
      shortcutUsage: new Map()
    }
  }

  private initializeDeviceFingerprint(): DeviceFingerprint {
    // This would be populated from client-side data
    return {
      screenResolution: '',
      colorDepth: 0,
      timezone: '',
      language: '',
      platform: '',
      userAgent: '',
      touchSupport: false
    }
  }

  /**
   * Start periodic analysis loop
   */
  private startAnalysisLoop(): void {
    setInterval(() => {
      this.sessions.forEach((session, sessionId) => {
        this.updateKeystrokeMetrics(sessionId)
        this.updateMouseMetrics(sessionId)
        this.updateInteractionMetrics(sessionId)
        
        // Emit analysis complete event
        this.emit('analysis:complete', {
          sessionId,
          metrics: session
        })
      })
    }, this.analysisInterval)
  }

  /**
   * End tracking session
   */
  endSession(sessionId: string): BehavioralData | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    // Final analysis
    this.updateKeystrokeMetrics(sessionId)
    this.updateMouseMetrics(sessionId)
    this.updateInteractionMetrics(sessionId)

    // Clean up
    this.sessions.delete(sessionId)
    this.keystrokeBuffer.delete(sessionId)
    this.mouseBuffer.delete(sessionId)

    logger.info(`Ended behavioral tracking session: ${sessionId}`)
    
    return session
  }

  /**
   * Get behavioral anomaly score
   */
  getAnomalyScore(sessionId: string, referenceData: BehavioralData): number {
    const currentData = this.getCurrentMetrics(sessionId)
    if (!currentData) return 1 // Maximum anomaly

    let score = 0
    let factors = 0

    // Compare keystroke metrics
    if (currentData.keystrokeData.typingSpeed > 0 && referenceData.keystrokeData.typingSpeed > 0) {
      const speedDiff = Math.abs(
        currentData.keystrokeData.typingSpeed - referenceData.keystrokeData.typingSpeed
      ) / referenceData.keystrokeData.typingSpeed
      score += Math.min(speedDiff, 1)
      factors++
    }

    // Compare mouse movement efficiency
    if (currentData.mouseData.movementEfficiency > 0 && referenceData.mouseData.movementEfficiency > 0) {
      const effDiff = Math.abs(
        currentData.mouseData.movementEfficiency - referenceData.mouseData.movementEfficiency
      ) / referenceData.mouseData.movementEfficiency
      score += Math.min(effDiff, 1)
      factors++
    }

    // Compare curve complexity
    if (currentData.mouseData.curveComplexity > 0 && referenceData.mouseData.curveComplexity > 0) {
      const curveDiff = Math.abs(
        currentData.mouseData.curveComplexity - referenceData.mouseData.curveComplexity
      ) / referenceData.mouseData.curveComplexity
      score += Math.min(curveDiff, 1)
      factors++
    }

    return factors > 0 ? score / factors : 0.5
  }

  /**
   * Export session data for analysis
   */
  exportSessionData(sessionId: string): any {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    return {
      sessionId,
      userId: session.userId,
      timestamp: session.timestamp,
      keystrokeMetrics: {
        avgDwellTime: this.average(session.keystrokeData.dwellTimes),
        avgFlightTime: this.average(session.keystrokeData.flightTimes),
        typingSpeed: session.keystrokeData.typingSpeed,
        backspaceFrequency: session.keystrokeData.backspaceFrequency
      },
      mouseMetrics: {
        avgMovementSpeed: this.average(session.mouseData.movementSpeed),
        curveComplexity: session.mouseData.curveComplexity,
        movementEfficiency: session.mouseData.movementEfficiency
      },
      interactionMetrics: session.interactionData,
      deviceFingerprint: session.deviceData
    }
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0
    return arr.reduce((sum, val) => sum + val, 0) / arr.length
  }
}

export default new BehavioralBiometricsTracker()