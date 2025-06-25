/**
 * Quantum-Secure Authentication Service
 * Implements quantum-resistant authentication mechanisms
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { HybridCrypto, HybridMode } from '../crypto/quantum-resistant/hybrid-encryption';
import { SecurityLevel, PQCAlgorithm } from '../crypto/quantum-resistant/algorithms';
import { KEMManager } from '../crypto/quantum-resistant/kem-manager';
import { PQCPerformanceOptimizer } from '../crypto/quantum-resistant/performance';

/**
 * Quantum-secure token payload
 */
export interface QuantumSecureToken {
  userId: string;
  sessionId: string;
  kemSessionId: string;
  issuedAt: number;
  expiresAt: number;
  quantumProof: string;
  metadata?: Record<string, any>;
}

/**
 * Authentication configuration
 */
export interface QuantumAuthConfig {
  securityLevel: SecurityLevel;
  tokenExpiry: number; // seconds
  enableSessionBinding: boolean;
  enableDeviceFingerprinting: boolean;
  enableQuantumProofVerification: boolean;
  rotationInterval: number; // milliseconds
}

/**
 * Main quantum-secure authentication service
 */
export class QuantumSecureAuthService {
  private hybridCrypto: HybridCrypto;
  private kemManager: KEMManager;
  private optimizer: PQCPerformanceOptimizer;
  private config: QuantumAuthConfig;
  private identityCache: Map<string, any> = new Map();
  private rotationTimer?: NodeJS.Timer;

  constructor(config: Partial<QuantumAuthConfig> = {}) {
    this.config = {
      securityLevel: SecurityLevel.LEVEL3,
      tokenExpiry: 3600, // 1 hour
      enableSessionBinding: true,
      enableDeviceFingerprinting: true,
      enableQuantumProofVerification: true,
      rotationInterval: 86400000, // 24 hours
      ...config
    };

    this.hybridCrypto = new HybridCrypto(
      this.config.securityLevel,
      HybridMode.KDF_COMBINED
    );

    this.kemManager = new KEMManager({
      algorithm: PQCAlgorithm.KYBER,
      securityLevel: this.config.securityLevel,
      sessionTimeout: this.config.tokenExpiry * 1000
    });

    this.optimizer = new PQCPerformanceOptimizer();

    // Start key rotation timer
    this.startKeyRotation();
  }

  /**
   * Initialize quantum-secure authentication for a user
   */
  async initializeUserAuth(userId: string): Promise<{
    publicKeys: {
      classical: string;
      pqc: string;
    };
    sessionId: string;
  }> {
    // Generate hybrid identity with optimization
    const identity = await this.optimizer.optimizeWithCache(
      `user_identity_${userId}`,
      () => this.hybridCrypto.generateIdentity(),
      3600000 // Cache for 1 hour
    );

    // Create KEM session
    const kemSession = await this.kemManager.createSession({
      userId,
      timestamp: Date.now()
    });

    // Store identity securely
    this.identityCache.set(userId, {
      identity,
      kemSessionId: kemSession.id,
      createdAt: Date.now()
    });

    return {
      publicKeys: {
        classical: identity.classical.publicKey.toString('base64'),
        pqc: identity.pqc.kem.publicKey.toString('base64')
      },
      sessionId: kemSession.id
    };
  }

  /**
   * Generate quantum-secure authentication token
   */
  async generateQuantumToken(
    userId: string,
    deviceFingerprint?: string
  ): Promise<{
    token: string;
    encryptedToken: Buffer;
    refreshToken: string;
    expiresAt: Date;
  }> {
    const userAuth = this.identityCache.get(userId);
    if (!userAuth) {
      throw new Error('User authentication not initialized');
    }

    // Generate session ID
    const sessionId = crypto.randomBytes(16).toString('hex');

    // Create quantum proof
    const quantumProof = await this.generateQuantumProof(
      userId,
      sessionId,
      deviceFingerprint
    );

    // Create token payload
    const payload: QuantumSecureToken = {
      userId,
      sessionId,
      kemSessionId: userAuth.kemSessionId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (this.config.tokenExpiry * 1000),
      quantumProof,
      metadata: {
        deviceFingerprint: deviceFingerprint ? 
          crypto.createHash('sha256').update(deviceFingerprint).digest('hex') : 
          undefined
      }
    };

    // Sign token with hybrid signature
    const token = await this.signToken(payload, userAuth.identity);

    // Encrypt token for additional security
    const encryptedToken = await this.hybridCrypto.encrypt(
      Buffer.from(token),
      {
        classical: userAuth.identity.classical.publicKey,
        pqc: userAuth.identity.pqc.kem.publicKey
      }
    );

    // Generate refresh token
    const refreshToken = await this.generateRefreshToken(userId, sessionId);

    return {
      token,
      encryptedToken: Buffer.concat([
        encryptedToken.encrypted,
        encryptedToken.ephemeralClassicalKey,
        encryptedToken.pqcCiphertext,
        encryptedToken.iv,
        encryptedToken.authTag
      ]),
      refreshToken,
      expiresAt: new Date(payload.expiresAt)
    };
  }

  /**
   * Verify quantum-secure token
   */
  async verifyQuantumToken(
    token: string,
    deviceFingerprint?: string
  ): Promise<{
    valid: boolean;
    payload?: QuantumSecureToken;
    error?: string;
  }> {
    try {
      // Decode token
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.userId) {
        return { valid: false, error: 'Invalid token format' };
      }

      const userAuth = this.identityCache.get(decoded.userId);
      if (!userAuth) {
        return { valid: false, error: 'User authentication not found' };
      }

      // Verify hybrid signature
      const signatureValid = await this.verifyTokenSignature(
        token,
        userAuth.identity
      );

      if (!signatureValid) {
        return { valid: false, error: 'Invalid signature' };
      }

      // Verify quantum proof if enabled
      if (this.config.enableQuantumProofVerification) {
        const proofValid = await this.verifyQuantumProof(
          decoded as QuantumSecureToken,
          deviceFingerprint
        );

        if (!proofValid) {
          return { valid: false, error: 'Quantum proof verification failed' };
        }
      }

      // Check expiration
      if (decoded.expiresAt < Date.now()) {
        return { valid: false, error: 'Token expired' };
      }

      // Verify device fingerprint if enabled
      if (this.config.enableDeviceFingerprinting && deviceFingerprint) {
        const storedFingerprint = decoded.metadata?.deviceFingerprint;
        const currentFingerprint = crypto.createHash('sha256')
          .update(deviceFingerprint)
          .digest('hex');

        if (storedFingerprint !== currentFingerprint) {
          return { valid: false, error: 'Device fingerprint mismatch' };
        }
      }

      return {
        valid: true,
        payload: decoded as QuantumSecureToken
      };
    } catch (error) {
      return {
        valid: false,
        error: `Verification error: ${error.message}`
      };
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(
    refreshToken: string,
    deviceFingerprint?: string
  ): Promise<{
    token: string;
    refreshToken: string;
    expiresAt: Date;
  }> {
    // Verify refresh token
    const refreshPayload = await this.verifyRefreshToken(refreshToken);
    if (!refreshPayload) {
      throw new Error('Invalid refresh token');
    }

    // Rotate KEM session if needed
    const kemSession = await this.kemManager.getSession(refreshPayload.kemSessionId);
    if (!kemSession || new Date(kemSession.expiresAt) < new Date(Date.now() + 3600000)) {
      await this.kemManager.rotateKeys(refreshPayload.kemSessionId);
    }

    // Generate new token
    return this.generateQuantumToken(refreshPayload.userId, deviceFingerprint);
  }

  /**
   * Middleware for quantum-secure authentication
   */
  authenticate() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const token = this.extractToken(req);
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const deviceFingerprint = this.extractDeviceFingerprint(req);
      const result = await this.verifyQuantumToken(token, deviceFingerprint);

      if (!result.valid) {
        return res.status(401).json({ error: result.error });
      }

      // Attach user info to request
      (req as any).user = {
        userId: result.payload!.userId,
        sessionId: result.payload!.sessionId,
        kemSessionId: result.payload!.kemSessionId
      };

      next();
    };
  }

  /**
   * Secure data with quantum-resistant encryption
   */
  async secureData(
    data: Buffer | string,
    userId: string
  ): Promise<{
    encrypted: Buffer;
    metadata: {
      algorithm: string;
      timestamp: number;
      userId: string;
    };
  }> {
    const userAuth = this.identityCache.get(userId);
    if (!userAuth) {
      throw new Error('User authentication not initialized');
    }

    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    
    // Encrypt with hybrid encryption
    const encrypted = await this.hybridCrypto.encrypt(dataBuffer, {
      classical: userAuth.identity.classical.publicKey,
      pqc: userAuth.identity.pqc.kem.publicKey
    });

    // Package encrypted data
    const encryptedBuffer = Buffer.concat([
      Buffer.from([1]), // Version
      Buffer.from([encrypted.ephemeralClassicalKey.length >> 8, encrypted.ephemeralClassicalKey.length & 0xff]),
      encrypted.ephemeralClassicalKey,
      Buffer.from([encrypted.pqcCiphertext.length >> 8, encrypted.pqcCiphertext.length & 0xff]),
      encrypted.pqcCiphertext,
      encrypted.iv,
      encrypted.authTag,
      encrypted.encrypted
    ]);

    return {
      encrypted: encryptedBuffer,
      metadata: {
        algorithm: 'Hybrid-Kyber-ECDH',
        timestamp: Date.now(),
        userId
      }
    };
  }

  /**
   * Decrypt quantum-secured data
   */
  async decryptData(
    encryptedData: Buffer,
    userId: string
  ): Promise<Buffer> {
    const userAuth = this.identityCache.get(userId);
    if (!userAuth) {
      throw new Error('User authentication not initialized');
    }

    // Parse encrypted data
    let offset = 0;
    const version = encryptedData[offset++];
    
    if (version !== 1) {
      throw new Error('Unsupported encryption version');
    }

    const ephemeralKeyLength = (encryptedData[offset++] << 8) | encryptedData[offset++];
    const ephemeralClassicalKey = encryptedData.slice(offset, offset + ephemeralKeyLength);
    offset += ephemeralKeyLength;

    const pqcCiphertextLength = (encryptedData[offset++] << 8) | encryptedData[offset++];
    const pqcCiphertext = encryptedData.slice(offset, offset + pqcCiphertextLength);
    offset += pqcCiphertextLength;

    const iv = encryptedData.slice(offset, offset + 16);
    offset += 16;

    const authTag = encryptedData.slice(offset, offset + 16);
    offset += 16;

    const encrypted = encryptedData.slice(offset);

    // Decrypt
    return this.hybridCrypto.decrypt(
      {
        encrypted,
        ephemeralClassicalKey,
        pqcCiphertext,
        iv,
        authTag
      },
      {
        classical: userAuth.identity.classical.privateKey,
        pqc: userAuth.identity.pqc.kem.privateKey
      }
    );
  }

  /**
   * Generate quantum proof for authentication
   */
  private async generateQuantumProof(
    userId: string,
    sessionId: string,
    deviceFingerprint?: string
  ): Promise<string> {
    const proofData = Buffer.concat([
      Buffer.from(userId),
      Buffer.from(sessionId),
      Buffer.from(deviceFingerprint || ''),
      crypto.randomBytes(32) // Nonce
    ]);

    // Use quantum-resistant signature
    const userAuth = this.identityCache.get(userId);
    if (!userAuth) {
      throw new Error('User authentication not found');
    }

    const signature = await this.hybridCrypto.sign(proofData, {
      classical: userAuth.identity.classical.privateKey,
      pqc: userAuth.identity.pqc.signature.privateKey
    });

    return Buffer.concat([
      proofData,
      signature.combinedSignature
    ]).toString('base64');
  }

  /**
   * Verify quantum proof
   */
  private async verifyQuantumProof(
    token: QuantumSecureToken,
    deviceFingerprint?: string
  ): Promise<boolean> {
    try {
      const proofBuffer = Buffer.from(token.quantumProof, 'base64');
      
      // Extract components
      const userIdLength = Buffer.from(token.userId).length;
      const sessionIdLength = Buffer.from(token.sessionId).length;
      const fingerprintLength = deviceFingerprint ? Buffer.from(deviceFingerprint).length : 0;
      
      const dataLength = userIdLength + sessionIdLength + fingerprintLength + 32; // 32 for nonce
      const proofData = proofBuffer.slice(0, dataLength);
      const signature = proofBuffer.slice(dataLength);

      const userAuth = this.identityCache.get(token.userId);
      if (!userAuth) {
        return false;
      }

      // Reconstruct expected data
      const expectedData = Buffer.concat([
        Buffer.from(token.userId),
        Buffer.from(token.sessionId),
        Buffer.from(deviceFingerprint || ''),
        proofData.slice(-32) // Extract nonce
      ]);

      return this.hybridCrypto.verify(expectedData, signature, {
        classical: userAuth.identity.classical.publicKey,
        pqc: userAuth.identity.pqc.signature.publicKey
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Sign token with hybrid signature
   */
  private async signToken(
    payload: QuantumSecureToken,
    identity: any
  ): Promise<string> {
    // Create JWT with custom signature
    const header = Buffer.from(JSON.stringify({
      alg: 'HYBRID-QUANTUM',
      typ: 'JWT'
    })).toString('base64url');

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const message = `${header}.${payloadBase64}`;

    const signature = await this.hybridCrypto.sign(message, {
      classical: identity.classical.privateKey,
      pqc: identity.pqc.signature.privateKey
    });

    const signatureBase64 = signature.combinedSignature.toString('base64url');
    return `${message}.${signatureBase64}`;
  }

  /**
   * Verify token signature
   */
  private async verifyTokenSignature(
    token: string,
    identity: any
  ): Promise<boolean> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const message = `${parts[0]}.${parts[1]}`;
      const signature = Buffer.from(parts[2], 'base64url');

      return this.hybridCrypto.verify(message, signature, {
        classical: identity.classical.publicKey,
        pqc: identity.pqc.signature.publicKey
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate refresh token
   */
  private async generateRefreshToken(
    userId: string,
    sessionId: string
  ): Promise<string> {
    const refreshData = {
      userId,
      sessionId,
      kemSessionId: this.identityCache.get(userId)?.kemSessionId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };

    return Buffer.from(JSON.stringify(refreshData)).toString('base64url');
  }

  /**
   * Verify refresh token
   */
  private async verifyRefreshToken(refreshToken: string): Promise<any> {
    try {
      const decoded = JSON.parse(
        Buffer.from(refreshToken, 'base64url').toString('utf8')
      );

      if (decoded.expiresAt < Date.now()) {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract token from request
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return req.cookies?.token || null;
  }

  /**
   * Extract device fingerprint from request
   */
  private extractDeviceFingerprint(req: Request): string | undefined {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    return crypto.createHash('sha256')
      .update(userAgent)
      .update(acceptLanguage)
      .update(acceptEncoding)
      .update(req.ip || '')
      .digest('hex');
  }

  /**
   * Start key rotation timer
   */
  private startKeyRotation(): void {
    this.rotationTimer = setInterval(async () => {
      // Rotate keys for all active users
      for (const [userId, auth] of this.identityCache) {
        if (Date.now() - auth.createdAt > this.config.rotationInterval) {
          await this.initializeUserAuth(userId);
        }
      }
    }, this.config.rotationInterval);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
    this.identityCache.clear();
    this.kemManager.destroy();
    this.optimizer.destroy();
  }
}