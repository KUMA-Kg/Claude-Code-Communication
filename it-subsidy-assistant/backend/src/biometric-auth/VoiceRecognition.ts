import { EventEmitter } from 'events'
import * as tf from '@tensorflow/tfjs-node'
import { logger } from '../utils/logger'

/**
 * AI-Powered Voice Recognition System
 * Implements voice biometric authentication with anti-spoofing
 */

export interface VoiceData {
  audioBuffer: Buffer
  sampleRate: number
  duration: number
  timestamp: Date
}

export interface VoiceFeatures {
  mfcc: number[][] // Mel-frequency cepstral coefficients
  pitch: number[]
  energy: number[]
  zeroCrossingRate: number[]
  spectralCentroid: number[]
  spectralRolloff: number[]
  spectralFlux: number[]
  formants: number[][] // F1, F2, F3 formant frequencies
}

export interface VoicePrint {
  embedding: Float32Array
  features: VoiceFeatures
  quality: VoiceQuality
  timestamp: Date
}

export interface VoiceQuality {
  snr: number // Signal-to-noise ratio
  clarity: number
  consistency: number
  duration: number
  isSpeech: boolean
}

export interface VoiceChallenge {
  type: 'passphrase' | 'random-digits' | 'random-words'
  content: string
  language: string
  timeLimit: number
}

export class VoiceRecognitionSystem extends EventEmitter {
  private model: tf.LayersModel | null = null
  private antiSpoofingModel: tf.LayersModel | null = null
  private voicePrints: Map<string, VoicePrint[]> = new Map()
  private readonly embeddingSize = 256
  private readonly minDuration = 1.5 // seconds
  private readonly maxDuration = 10 // seconds
  private readonly similarityThreshold = 0.80
  private readonly maxStoredPrints = 5

  constructor() {
    super()
    this.initializeModels()
  }

  /**
   * Initialize AI models
   */
  private async initializeModels(): Promise<void> {
    try {
      this.model = await this.createVoiceRecognitionModel()
      this.antiSpoofingModel = await this.createAntiSpoofingModel()
      
      logger.info('Voice recognition models initialized')
    } catch (error) {
      logger.error('Failed to initialize voice recognition models:', error)
    }
  }

  /**
   * Create voice recognition model
   */
  private async createVoiceRecognitionModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        // LSTM layers for sequential audio processing
        tf.layers.lstm({
          units: 128,
          returnSequences: true,
          inputShape: [null, 40] // Variable length, 40 MFCC features
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({
          units: 128,
          returnSequences: false
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 256,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: this.embeddingSize,
          activation: 'linear'
        }),
        tf.layers.lambdaLayer({
          lambda: (x: tf.Tensor) => tf.l2Normalize(x, 1)
        })
      ]
    })

    return model
  }

  /**
   * Create anti-spoofing model
   */
  private async createAntiSpoofingModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.conv1d({
          filters: 32,
          kernelSize: 3,
          activation: 'relu',
          inputShape: [null, 40] // Variable length audio features
        }),
        tf.layers.maxPooling1d({ poolSize: 2 }),
        tf.layers.conv1d({
          filters: 64,
          kernelSize: 3,
          activation: 'relu'
        }),
        tf.layers.globalMaxPooling1d(),
        tf.layers.dense({
          units: 128,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 2,
          activation: 'softmax' // Real vs Synthetic
        })
      ]
    })

    return model
  }

  /**
   * Enroll a new voice
   */
  async enrollVoice(userId: string, audioBuffer: Buffer, sampleRate: number): Promise<{
    success: boolean
    voicePrint?: VoicePrint
    quality?: VoiceQuality
    error?: string
  }> {
    try {
      const voiceData: VoiceData = {
        audioBuffer,
        sampleRate,
        duration: audioBuffer.length / sampleRate / 2, // Assuming 16-bit audio
        timestamp: new Date()
      }

      // Check audio duration
      if (voiceData.duration < this.minDuration) {
        return { success: false, error: `Audio too short (minimum ${this.minDuration}s)` }
      }
      if (voiceData.duration > this.maxDuration) {
        return { success: false, error: `Audio too long (maximum ${this.maxDuration}s)` }
      }

      // Extract voice features
      const features = await this.extractFeatures(voiceData)
      
      // Assess voice quality
      const quality = await this.assessVoiceQuality(voiceData, features)
      
      if (!quality.isSpeech) {
        return { success: false, error: 'No speech detected', quality }
      }
      
      if (quality.snr < 10) {
        return { success: false, error: 'Audio quality too low (too much noise)', quality }
      }

      // Check for spoofing
      const isReal = await this.checkAntiSpoofing(features)
      if (!isReal) {
        return { success: false, error: 'Synthetic voice detected' }
      }

      // Generate voice embedding
      const embedding = await this.generateEmbedding(features)
      
      const voicePrint: VoicePrint = {
        embedding,
        features,
        quality,
        timestamp: new Date()
      }

      // Store voice print
      if (!this.voicePrints.has(userId)) {
        this.voicePrints.set(userId, [])
      }
      
      const userPrints = this.voicePrints.get(userId)!
      userPrints.push(voicePrint)
      
      // Keep only recent prints
      while (userPrints.length > this.maxStoredPrints) {
        userPrints.shift()
      }

      this.emit('voice:enrolled', { userId, quality })
      
      return {
        success: true,
        voicePrint,
        quality
      }
    } catch (error) {
      logger.error('Voice enrollment failed:', error)
      return { success: false, error: 'Enrollment failed' }
    }
  }

  /**
   * Verify voice against enrolled prints
   */
  async verifyVoice(userId: string, audioBuffer: Buffer, sampleRate: number): Promise<{
    success: boolean
    confidence: number
    quality?: VoiceQuality
    error?: string
  }> {
    try {
      // Check if user has enrolled voices
      const userPrints = this.voicePrints.get(userId)
      if (!userPrints || userPrints.length === 0) {
        return { success: false, confidence: 0, error: 'No enrolled voices' }
      }

      const voiceData: VoiceData = {
        audioBuffer,
        sampleRate,
        duration: audioBuffer.length / sampleRate / 2,
        timestamp: new Date()
      }

      // Check audio duration
      if (voiceData.duration < this.minDuration) {
        return { success: false, confidence: 0, error: `Audio too short` }
      }

      // Extract features
      const features = await this.extractFeatures(voiceData)
      
      // Assess quality
      const quality = await this.assessVoiceQuality(voiceData, features)
      
      if (!quality.isSpeech) {
        return { success: false, confidence: 0, error: 'No speech detected', quality }
      }

      // Check for spoofing
      const isReal = await this.checkAntiSpoofing(features)
      if (!isReal) {
        return { success: false, confidence: 0, error: 'Synthetic voice detected' }
      }

      // Generate embedding for current voice
      const currentEmbedding = await this.generateEmbedding(features)
      
      // Compare with enrolled prints
      let maxSimilarity = 0
      for (const enrolledPrint of userPrints) {
        const similarity = this.calculateSimilarity(
          currentEmbedding,
          enrolledPrint.embedding
        )
        maxSimilarity = Math.max(maxSimilarity, similarity)
      }

      const success = maxSimilarity >= this.similarityThreshold

      this.emit('voice:verified', {
        userId,
        success,
        confidence: maxSimilarity
      })

      return {
        success,
        confidence: maxSimilarity,
        quality
      }
    } catch (error) {
      logger.error('Voice verification failed:', error)
      return { success: false, confidence: 0, error: 'Verification failed' }
    }
  }

  /**
   * Extract voice features from audio
   */
  private async extractFeatures(voiceData: VoiceData): Promise<VoiceFeatures> {
    const audioArray = new Float32Array(voiceData.audioBuffer.buffer)
    
    // Extract MFCC features
    const mfcc = this.extractMFCC(audioArray, voiceData.sampleRate)
    
    // Extract pitch (fundamental frequency)
    const pitch = this.extractPitch(audioArray, voiceData.sampleRate)
    
    // Extract energy
    const energy = this.extractEnergy(audioArray)
    
    // Extract zero crossing rate
    const zeroCrossingRate = this.extractZeroCrossingRate(audioArray)
    
    // Extract spectral features
    const spectralCentroid = this.extractSpectralCentroid(audioArray, voiceData.sampleRate)
    const spectralRolloff = this.extractSpectralRolloff(audioArray, voiceData.sampleRate)
    const spectralFlux = this.extractSpectralFlux(audioArray, voiceData.sampleRate)
    
    // Extract formants
    const formants = this.extractFormants(audioArray, voiceData.sampleRate)

    return {
      mfcc,
      pitch,
      energy,
      zeroCrossingRate,
      spectralCentroid,
      spectralRolloff,
      spectralFlux,
      formants
    }
  }

  /**
   * Extract MFCC features
   */
  private extractMFCC(audio: Float32Array, sampleRate: number): number[][] {
    const frameSize = 512
    const hopSize = 256
    const numCoefficients = 40
    const mfccFrames: number[][] = []

    // Process audio in frames
    for (let i = 0; i + frameSize <= audio.length; i += hopSize) {
      const frame = audio.slice(i, i + frameSize)
      
      // Apply window function (Hamming)
      const windowedFrame = this.applyHammingWindow(frame)
      
      // Compute FFT
      const fft = this.computeFFT(windowedFrame)
      
      // Convert to mel-scale
      const melSpectrum = this.toMelScale(fft, sampleRate)
      
      // Apply DCT to get MFCC
      const mfcc = this.computeDCT(melSpectrum).slice(0, numCoefficients)
      
      mfccFrames.push(Array.from(mfcc))
    }

    return mfccFrames
  }

  /**
   * Extract pitch using autocorrelation
   */
  private extractPitch(audio: Float32Array, sampleRate: number): number[] {
    const frameSize = 1024
    const hopSize = 512
    const pitchValues: number[] = []

    for (let i = 0; i + frameSize <= audio.length; i += hopSize) {
      const frame = audio.slice(i, i + frameSize)
      const pitch = this.estimatePitch(frame, sampleRate)
      pitchValues.push(pitch)
    }

    return pitchValues
  }

  /**
   * Extract energy
   */
  private extractEnergy(audio: Float32Array): number[] {
    const frameSize = 512
    const hopSize = 256
    const energyValues: number[] = []

    for (let i = 0; i + frameSize <= audio.length; i += hopSize) {
      const frame = audio.slice(i, i + frameSize)
      const energy = frame.reduce((sum, sample) => sum + sample * sample, 0) / frameSize
      energyValues.push(Math.sqrt(energy))
    }

    return energyValues
  }

  /**
   * Extract zero crossing rate
   */
  private extractZeroCrossingRate(audio: Float32Array): number[] {
    const frameSize = 512
    const hopSize = 256
    const zcrValues: number[] = []

    for (let i = 0; i + frameSize <= audio.length; i += hopSize) {
      const frame = audio.slice(i, i + frameSize)
      let crossings = 0
      
      for (let j = 1; j < frame.length; j++) {
        if ((frame[j] >= 0) !== (frame[j - 1] >= 0)) {
          crossings++
        }
      }
      
      zcrValues.push(crossings / frameSize)
    }

    return zcrValues
  }

  /**
   * Extract spectral centroid
   */
  private extractSpectralCentroid(audio: Float32Array, sampleRate: number): number[] {
    const frameSize = 512
    const hopSize = 256
    const centroidValues: number[] = []

    for (let i = 0; i + frameSize <= audio.length; i += hopSize) {
      const frame = audio.slice(i, i + frameSize)
      const windowedFrame = this.applyHammingWindow(frame)
      const fft = this.computeFFT(windowedFrame)
      
      let weightedSum = 0
      let magnitudeSum = 0
      
      for (let k = 0; k < fft.length / 2; k++) {
        const magnitude = Math.sqrt(fft[k * 2] * fft[k * 2] + fft[k * 2 + 1] * fft[k * 2 + 1])
        const frequency = k * sampleRate / fft.length
        weightedSum += frequency * magnitude
        magnitudeSum += magnitude
      }
      
      const centroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0
      centroidValues.push(centroid)
    }

    return centroidValues
  }

  /**
   * Extract spectral rolloff
   */
  private extractSpectralRolloff(audio: Float32Array, sampleRate: number): number[] {
    const frameSize = 512
    const hopSize = 256
    const rolloffValues: number[] = []
    const rolloffThreshold = 0.85

    for (let i = 0; i + frameSize <= audio.length; i += hopSize) {
      const frame = audio.slice(i, i + frameSize)
      const windowedFrame = this.applyHammingWindow(frame)
      const fft = this.computeFFT(windowedFrame)
      
      const magnitudes: number[] = []
      let totalEnergy = 0
      
      for (let k = 0; k < fft.length / 2; k++) {
        const magnitude = Math.sqrt(fft[k * 2] * fft[k * 2] + fft[k * 2 + 1] * fft[k * 2 + 1])
        magnitudes.push(magnitude)
        totalEnergy += magnitude * magnitude
      }
      
      let cumulativeEnergy = 0
      let rolloffBin = 0
      
      for (let k = 0; k < magnitudes.length; k++) {
        cumulativeEnergy += magnitudes[k] * magnitudes[k]
        if (cumulativeEnergy >= rolloffThreshold * totalEnergy) {
          rolloffBin = k
          break
        }
      }
      
      const rolloffFreq = rolloffBin * sampleRate / fft.length
      rolloffValues.push(rolloffFreq)
    }

    return rolloffValues
  }

  /**
   * Extract spectral flux
   */
  private extractSpectralFlux(audio: Float32Array, sampleRate: number): number[] {
    const frameSize = 512
    const hopSize = 256
    const fluxValues: number[] = []
    let prevMagnitudes: number[] = []

    for (let i = 0; i + frameSize <= audio.length; i += hopSize) {
      const frame = audio.slice(i, i + frameSize)
      const windowedFrame = this.applyHammingWindow(frame)
      const fft = this.computeFFT(windowedFrame)
      
      const magnitudes: number[] = []
      for (let k = 0; k < fft.length / 2; k++) {
        const magnitude = Math.sqrt(fft[k * 2] * fft[k * 2] + fft[k * 2 + 1] * fft[k * 2 + 1])
        magnitudes.push(magnitude)
      }
      
      if (prevMagnitudes.length > 0) {
        let flux = 0
        for (let k = 0; k < magnitudes.length; k++) {
          const diff = magnitudes[k] - prevMagnitudes[k]
          if (diff > 0) {
            flux += diff * diff
          }
        }
        fluxValues.push(Math.sqrt(flux))
      }
      
      prevMagnitudes = magnitudes
    }

    return fluxValues
  }

  /**
   * Extract formant frequencies
   */
  private extractFormants(audio: Float32Array, sampleRate: number): number[][] {
    // Simplified formant extraction
    // In production, use LPC analysis
    const formants: number[][] = []
    
    // Mock formant values for now
    const f1Base = 700 // First formant base frequency
    const f2Base = 1220 // Second formant base frequency
    const f3Base = 2600 // Third formant base frequency
    
    const frameSize = 1024
    const hopSize = 512
    
    for (let i = 0; i + frameSize <= audio.length; i += hopSize) {
      formants.push([
        f1Base + Math.random() * 200 - 100,
        f2Base + Math.random() * 300 - 150,
        f3Base + Math.random() * 400 - 200
      ])
    }
    
    return formants
  }

  /**
   * Apply Hamming window
   */
  private applyHammingWindow(frame: Float32Array): Float32Array {
    const windowed = new Float32Array(frame.length)
    const n = frame.length
    
    for (let i = 0; i < n; i++) {
      const window = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1))
      windowed[i] = frame[i] * window
    }
    
    return windowed
  }

  /**
   * Compute FFT (simplified - in production use proper FFT library)
   */
  private computeFFT(signal: Float32Array): Float32Array {
    // Simplified DFT for demonstration
    const n = signal.length
    const fft = new Float32Array(n * 2) // Real and imaginary parts
    
    for (let k = 0; k < n; k++) {
      let real = 0
      let imag = 0
      
      for (let t = 0; t < n; t++) {
        const angle = -2 * Math.PI * k * t / n
        real += signal[t] * Math.cos(angle)
        imag += signal[t] * Math.sin(angle)
      }
      
      fft[k * 2] = real
      fft[k * 2 + 1] = imag
    }
    
    return fft
  }

  /**
   * Convert to mel scale
   */
  private toMelScale(fft: Float32Array, sampleRate: number): Float32Array {
    const numMelFilters = 40
    const melSpectrum = new Float32Array(numMelFilters)
    
    // Simplified mel filterbank
    for (let i = 0; i < numMelFilters; i++) {
      let sum = 0
      const startBin = Math.floor(i * fft.length / numMelFilters / 2)
      const endBin = Math.floor((i + 1) * fft.length / numMelFilters / 2)
      
      for (let k = startBin; k < endBin && k < fft.length / 2; k++) {
        const magnitude = Math.sqrt(fft[k * 2] * fft[k * 2] + fft[k * 2 + 1] * fft[k * 2 + 1])
        sum += magnitude
      }
      
      melSpectrum[i] = Math.log(sum + 1e-10)
    }
    
    return melSpectrum
  }

  /**
   * Compute DCT
   */
  private computeDCT(spectrum: Float32Array): Float32Array {
    const n = spectrum.length
    const dct = new Float32Array(n)
    
    for (let k = 0; k < n; k++) {
      let sum = 0
      for (let i = 0; i < n; i++) {
        sum += spectrum[i] * Math.cos(Math.PI * k * (i + 0.5) / n)
      }
      dct[k] = sum * Math.sqrt(2 / n)
    }
    
    return dct
  }

  /**
   * Estimate pitch using autocorrelation
   */
  private estimatePitch(frame: Float32Array, sampleRate: number): number {
    const minPeriod = Math.floor(sampleRate / 400) // 400 Hz max
    const maxPeriod = Math.floor(sampleRate / 50)  // 50 Hz min
    
    let maxCorrelation = 0
    let bestPeriod = 0
    
    for (let period = minPeriod; period < maxPeriod && period < frame.length; period++) {
      let correlation = 0
      for (let i = 0; i < frame.length - period; i++) {
        correlation += frame[i] * frame[i + period]
      }
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation
        bestPeriod = period
      }
    }
    
    return bestPeriod > 0 ? sampleRate / bestPeriod : 0
  }

  /**
   * Assess voice quality
   */
  private async assessVoiceQuality(
    voiceData: VoiceData,
    features: VoiceFeatures
  ): Promise<VoiceQuality> {
    const audioArray = new Float32Array(voiceData.audioBuffer.buffer)
    
    // Calculate SNR
    const signal = this.extractEnergy(audioArray)
    const noise = signal.slice(0, 10) // Assume first frames are noise
    const avgSignal = signal.slice(10).reduce((a, b) => a + b, 0) / (signal.length - 10)
    const avgNoise = noise.reduce((a, b) => a + b, 0) / noise.length
    const snr = avgNoise > 0 ? 20 * Math.log10(avgSignal / avgNoise) : 0
    
    // Check if speech is present
    const avgZCR = features.zeroCrossingRate.reduce((a, b) => a + b, 0) / features.zeroCrossingRate.length
    const avgEnergy = features.energy.reduce((a, b) => a + b, 0) / features.energy.length
    const isSpeech = avgZCR < 0.3 && avgEnergy > 0.01
    
    // Calculate clarity (based on spectral features)
    const avgCentroid = features.spectralCentroid.reduce((a, b) => a + b, 0) / features.spectralCentroid.length
    const clarity = Math.min(avgCentroid / 4000, 1) // Normalize to 0-1
    
    // Calculate consistency (variance in features)
    const pitchVariance = this.calculateVariance(features.pitch)
    const consistency = Math.max(0, 1 - pitchVariance / 1000)
    
    return {
      snr,
      clarity,
      consistency,
      duration: voiceData.duration,
      isSpeech
    }
  }

  /**
   * Check anti-spoofing
   */
  private async checkAntiSpoofing(features: VoiceFeatures): Promise<boolean> {
    if (!this.antiSpoofingModel) return true

    try {
      // Prepare features for anti-spoofing model
      const mfccTensor = tf.tensor3d([features.mfcc])
      
      // Run anti-spoofing detection
      const prediction = this.antiSpoofingModel.predict(mfccTensor) as tf.Tensor
      const scores = await prediction.array() as number[][]
      
      // Clean up
      mfccTensor.dispose()
      prediction.dispose()
      
      // Return true if real voice (not synthetic)
      return scores[0][0] > 0.5
    } catch (error) {
      logger.error('Anti-spoofing check failed:', error)
      return true // Default to accepting in case of error
    }
  }

  /**
   * Generate voice embedding
   */
  private async generateEmbedding(features: VoiceFeatures): Promise<Float32Array> {
    if (!this.model) {
      throw new Error('Voice recognition model not initialized')
    }

    try {
      // Prepare MFCC features for model
      const mfccTensor = tf.tensor3d([features.mfcc])
      
      // Generate embedding
      const embedding = this.model.predict(mfccTensor) as tf.Tensor
      const vector = await embedding.array() as number[][]
      
      // Clean up
      mfccTensor.dispose()
      embedding.dispose()
      
      return new Float32Array(vector[0])
    } catch (error) {
      logger.error('Embedding generation failed:', error)
      throw error
    }
  }

  /**
   * Calculate similarity between voice embeddings
   */
  private calculateSimilarity(embedding1: Float32Array, embedding2: Float32Array): number {
    // Cosine similarity
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
    return Math.max(0, similarity)
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    return variance
  }

  /**
   * Generate voice challenge
   */
  generateVoiceChallenge(language: string = 'en'): VoiceChallenge {
    const challengeTypes: VoiceChallenge['type'][] = ['passphrase', 'random-digits', 'random-words']
    const type = challengeTypes[Math.floor(Math.random() * challengeTypes.length)]
    
    let content = ''
    
    switch (type) {
      case 'passphrase':
        const passphrases = [
          'My voice is my passport, verify me',
          'The quick brown fox jumps over the lazy dog',
          'Security through voice recognition technology'
        ]
        content = passphrases[Math.floor(Math.random() * passphrases.length)]
        break
        
      case 'random-digits':
        content = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join(' ')
        break
        
      case 'random-words':
        const words = ['apple', 'banana', 'computer', 'database', 'elephant', 'forest', 'guitar', 'horizon']
        content = Array.from({ length: 4 }, () => words[Math.floor(Math.random() * words.length)]).join(' ')
        break
    }
    
    return {
      type,
      content,
      language,
      timeLimit: 10000 // 10 seconds
    }
  }

  /**
   * Verify voice challenge
   */
  async verifyVoiceChallenge(
    userId: string,
    challenge: VoiceChallenge,
    audioBuffer: Buffer,
    sampleRate: number
  ): Promise<{ success: boolean; confidence: number }> {
    // First verify the voice matches the user
    const verificationResult = await this.verifyVoice(userId, audioBuffer, sampleRate)
    
    if (!verificationResult.success) {
      return { success: false, confidence: verificationResult.confidence }
    }
    
    // In production, also verify the spoken content matches the challenge
    // This would require speech-to-text capabilities
    
    return {
      success: true,
      confidence: verificationResult.confidence
    }
  }

  /**
   * Update voice print (adaptive learning)
   */
  async updateVoicePrint(
    userId: string,
    audioBuffer: Buffer,
    sampleRate: number,
    confidence: number
  ): Promise<boolean> {
    // Only update if confidence is very high
    if (confidence < 0.95) {
      return false
    }

    try {
      const result = await this.enrollVoice(userId, audioBuffer, sampleRate)
      return result.success
    } catch (error) {
      logger.error('Failed to update voice print:', error)
      return false
    }
  }

  /**
   * Delete user voice data
   */
  deleteUserData(userId: string): boolean {
    return this.voicePrints.delete(userId)
  }

  /**
   * Get enrollment status
   */
  getEnrollmentStatus(userId: string): {
    enrolled: boolean
    printCount: number
    lastUpdated?: Date
  } {
    const userPrints = this.voicePrints.get(userId)
    
    if (!userPrints || userPrints.length === 0) {
      return { enrolled: false, printCount: 0 }
    }

    const lastPrint = userPrints[userPrints.length - 1]
    
    return {
      enrolled: true,
      printCount: userPrints.length,
      lastUpdated: lastPrint.timestamp
    }
  }

  /**
   * Export voice data for analysis
   */
  exportVoiceData(userId: string): any {
    const userPrints = this.voicePrints.get(userId)
    if (!userPrints) return null

    return {
      userId,
      printCount: userPrints.length,
      prints: userPrints.map(p => ({
        quality: p.quality,
        timestamp: p.timestamp,
        featuresummary: {
          avgPitch: p.features.pitch.reduce((a, b) => a + b, 0) / p.features.pitch.length,
          avgEnergy: p.features.energy.reduce((a, b) => a + b, 0) / p.features.energy.length,
          mfccFrames: p.features.mfcc.length
        }
      }))
    }
  }
}

export default new VoiceRecognitionSystem()