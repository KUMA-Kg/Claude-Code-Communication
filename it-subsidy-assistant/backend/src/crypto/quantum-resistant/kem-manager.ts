/**
 * Key Encapsulation Mechanism (KEM) Manager
 * Provides advanced KEM functionality for quantum-resistant key exchange
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import { 
  PQCAlgorithm, 
  SecurityLevel,
  Kyber,
  ClassicMcEliece,
  PQCFactory
} from './algorithms';

/**
 * KEM session states
 */
export enum KEMSessionState {
  INITIALIZED = 'INITIALIZED',
  PUBLIC_KEY_GENERATED = 'PUBLIC_KEY_GENERATED',
  ENCAPSULATED = 'ENCAPSULATED',
  DECAPSULATED = 'DECAPSULATED',
  EXPIRED = 'EXPIRED'
}

/**
 * KEM session configuration
 */
export interface KEMSessionConfig {
  algorithm: PQCAlgorithm;
  securityLevel: SecurityLevel;
  sessionTimeout?: number; // milliseconds
  keyRotationInterval?: number; // milliseconds
  enableKeyEscrow?: boolean;
}

/**
 * KEM session data
 */
export interface KEMSession {
  id: string;
  algorithm: PQCAlgorithm;
  state: KEMSessionState;
  publicKey: Buffer;
  privateKey?: Buffer;
  sharedSecret?: Buffer;
  ciphertext?: Buffer;
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Key derivation configuration
 */
export interface KeyDerivationConfig {
  algorithm: 'HKDF' | 'PBKDF2' | 'ARGON2';
  hash: 'sha256' | 'sha384' | 'sha512';
  saltLength: number;
  iterations?: number;
  outputLength: number;
}

/**
 * Advanced KEM Manager with session management
 */
export class KEMManager extends EventEmitter {
  private sessions: Map<string, KEMSession> = new Map();
  private config: KEMSessionConfig;
  private cleanupInterval?: NodeJS.Timer;
  private keyEscrow: Map<string, Buffer> = new Map();

  constructor(config: KEMSessionConfig) {
    super();
    this.config = {
      sessionTimeout: 3600000, // 1 hour default
      keyRotationInterval: 86400000, // 24 hours default
      enableKeyEscrow: false,
      ...config
    };

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Create a new KEM session
   */
  async createSession(metadata?: Record<string, any>): Promise<KEMSession> {
    const sessionId = this.generateSessionId();
    const kem = this.createKEMInstance();
    
    // Generate keypair
    const { publicKey, privateKey } = kem.generateKeyPair();
    
    const session: KEMSession = {
      id: sessionId,
      algorithm: this.config.algorithm,
      state: KEMSessionState.PUBLIC_KEY_GENERATED,
      publicKey,
      privateKey,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.sessionTimeout!),
      metadata
    };

    // Store in escrow if enabled
    if (this.config.enableKeyEscrow && privateKey) {
      this.keyEscrow.set(sessionId, privateKey);
    }

    this.sessions.set(sessionId, session);
    this.emit('session:created', session);

    return {
      ...session,
      privateKey: undefined // Don't expose private key
    };
  }

  /**
   * Encapsulate - generate shared secret and ciphertext
   */
  async encapsulate(
    sessionId: string,
    recipientPublicKey: Buffer
  ): Promise<{
    sharedSecret: Buffer;
    ciphertext: Buffer;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.state === KEMSessionState.EXPIRED) {
      throw new Error('Session expired');
    }

    const kem = this.createKEMInstance();
    const { sharedSecret, ciphertext } = kem.encapsulate(recipientPublicKey);

    // Update session
    session.state = KEMSessionState.ENCAPSULATED;
    session.sharedSecret = sharedSecret;
    session.ciphertext = ciphertext;

    this.emit('session:encapsulated', session);

    return { sharedSecret, ciphertext };
  }

  /**
   * Decapsulate - recover shared secret from ciphertext
   */
  async decapsulate(
    sessionId: string,
    ciphertext: Buffer
  ): Promise<Buffer> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.privateKey) {
      // Try to recover from escrow
      if (this.config.enableKeyEscrow) {
        session.privateKey = this.keyEscrow.get(sessionId);
      }
      
      if (!session.privateKey) {
        throw new Error('Private key not available');
      }
    }

    const kem = this.createKEMInstance();
    const sharedSecret = kem.decapsulate(ciphertext, session.privateKey);

    // Update session
    session.state = KEMSessionState.DECAPSULATED;
    session.sharedSecret = sharedSecret;
    session.ciphertext = ciphertext;

    this.emit('session:decapsulated', session);

    return sharedSecret;
  }

  /**
   * Derive keys from shared secret
   */
  async deriveKeys(
    sharedSecret: Buffer,
    info: string,
    config?: Partial<KeyDerivationConfig>
  ): Promise<{
    encryptionKey: Buffer;
    authenticationKey: Buffer;
    additionalKeys?: Buffer[];
  }> {
    const derivationConfig: KeyDerivationConfig = {
      algorithm: 'HKDF',
      hash: 'sha256',
      saltLength: 32,
      outputLength: 64,
      ...config
    };

    const salt = crypto.randomBytes(derivationConfig.saltLength);
    
    switch (derivationConfig.algorithm) {
      case 'HKDF':
        return this.deriveKeysHKDF(sharedSecret, salt, info, derivationConfig);
      
      case 'PBKDF2':
        return this.deriveKeysPBKDF2(sharedSecret, salt, info, derivationConfig);
      
      case 'ARGON2':
        // Argon2 would require additional library
        throw new Error('Argon2 not implemented in this example');
      
      default:
        throw new Error(`Unknown KDF algorithm: ${derivationConfig.algorithm}`);
    }
  }

  /**
   * Perform authenticated key exchange
   */
  async authenticatedKeyExchange(
    sessionId: string,
    recipientPublicKey: Buffer,
    signingKey: Buffer,
    recipientVerifyKey: Buffer
  ): Promise<{
    sharedSecret: Buffer;
    ciphertext: Buffer;
    signature: Buffer;
  }> {
    // Encapsulate
    const { sharedSecret, ciphertext } = await this.encapsulate(
      sessionId,
      recipientPublicKey
    );

    // Sign the ciphertext and recipient's public key
    const dataToSign = Buffer.concat([ciphertext, recipientPublicKey]);
    const signature = this.signData(dataToSign, signingKey);

    // Verify recipient's identity (in real implementation)
    // This would involve checking a certificate or previous signature

    return { sharedSecret, ciphertext, signature };
  }

  /**
   * Multi-party key agreement
   */
  async multiPartyKeyAgreement(
    participants: Array<{
      id: string;
      publicKey: Buffer;
    }>
  ): Promise<{
    groupSecret: Buffer;
    individualSecrets: Map<string, Buffer>;
  }> {
    const individualSecrets = new Map<string, Buffer>();
    const secretComponents: Buffer[] = [];

    // Create pairwise shared secrets
    for (const participant of participants) {
      const session = await this.createSession();
      const { sharedSecret } = await this.encapsulate(
        session.id,
        participant.publicKey
      );
      
      individualSecrets.set(participant.id, sharedSecret);
      secretComponents.push(sharedSecret);
    }

    // Combine all secrets into group secret
    const groupSecret = this.combineSecrets(secretComponents);

    return { groupSecret, individualSecrets };
  }

  /**
   * Key rotation for long-lived sessions
   */
  async rotateKeys(sessionId: string): Promise<KEMSession> {
    const oldSession = this.sessions.get(sessionId);
    if (!oldSession) {
      throw new Error('Session not found');
    }

    // Create new session with same metadata
    const newSession = await this.createSession(oldSession.metadata);

    // Derive transition key from old and new
    if (oldSession.sharedSecret) {
      const transitionKey = this.combineSecrets([
        oldSession.sharedSecret,
        crypto.randomBytes(32)
      ]);
      
      newSession.metadata = {
        ...newSession.metadata,
        previousSessionId: oldSession.id,
        transitionKey: transitionKey.toString('base64')
      };
    }

    // Expire old session
    oldSession.state = KEMSessionState.EXPIRED;
    this.emit('session:rotated', { old: oldSession, new: newSession });

    return newSession;
  }

  /**
   * Batch encapsulation for multiple recipients
   */
  async batchEncapsulate(
    sessionId: string,
    recipients: Array<{
      id: string;
      publicKey: Buffer;
    }>
  ): Promise<Map<string, { sharedSecret: Buffer; ciphertext: Buffer }>> {
    const results = new Map<string, { sharedSecret: Buffer; ciphertext: Buffer }>();

    for (const recipient of recipients) {
      const result = await this.encapsulate(sessionId, recipient.publicKey);
      results.set(recipient.id, result);
    }

    return results;
  }

  /**
   * Get session information (without sensitive data)
   */
  getSession(sessionId: string): Omit<KEMSession, 'privateKey' | 'sharedSecret'> | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const { privateKey, sharedSecret, ...safeSession } = session;
    return safeSession;
  }

  /**
   * Clean up expired sessions
   */
  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = new Date();
      const expiredSessions: string[] = [];

      for (const [id, session] of this.sessions) {
        if (session.expiresAt < now) {
          expiredSessions.push(id);
        }
      }

      for (const id of expiredSessions) {
        this.sessions.delete(id);
        this.keyEscrow.delete(id);
        this.emit('session:expired', id);
      }
    }, 60000); // Check every minute
  }

  /**
   * Create KEM instance based on configuration
   */
  private createKEMInstance(): Kyber | ClassicMcEliece {
    switch (this.config.algorithm) {
      case PQCAlgorithm.KYBER:
        return new Kyber(this.config.securityLevel);
      case PQCAlgorithm.CLASSIC_MCELIECE:
        return new ClassicMcEliece(this.config.securityLevel);
      default:
        throw new Error(`Unsupported KEM algorithm: ${this.config.algorithm}`);
    }
  }

  /**
   * HKDF key derivation
   */
  private deriveKeysHKDF(
    sharedSecret: Buffer,
    salt: Buffer,
    info: string,
    config: KeyDerivationConfig
  ) {
    const prk = crypto.createHmac(config.hash, salt)
      .update(sharedSecret)
      .digest();

    const infoBuffer = Buffer.from(info, 'utf8');
    const outputLength = config.outputLength;
    const okm = Buffer.alloc(outputLength);

    let t = Buffer.alloc(0);
    for (let i = 0; i < Math.ceil(outputLength / 32); i++) {
      t = crypto.createHmac(config.hash, prk)
        .update(t)
        .update(infoBuffer)
        .update(Buffer.from([i + 1]))
        .digest();
      
      t.copy(okm, i * 32);
    }

    return {
      encryptionKey: okm.slice(0, 32),
      authenticationKey: okm.slice(32, 64),
      additionalKeys: outputLength > 64 ? [okm.slice(64)] : undefined
    };
  }

  /**
   * PBKDF2 key derivation
   */
  private deriveKeysPBKDF2(
    sharedSecret: Buffer,
    salt: Buffer,
    info: string,
    config: KeyDerivationConfig
  ) {
    const iterations = config.iterations || 100000;
    const derived = crypto.pbkdf2Sync(
      Buffer.concat([sharedSecret, Buffer.from(info, 'utf8')]),
      salt,
      iterations,
      config.outputLength,
      config.hash
    );

    return {
      encryptionKey: derived.slice(0, 32),
      authenticationKey: derived.slice(32, 64),
      additionalKeys: config.outputLength > 64 ? [derived.slice(64)] : undefined
    };
  }

  /**
   * Combine multiple secrets
   */
  private combineSecrets(secrets: Buffer[]): Buffer {
    const combined = crypto.createHash('sha512');
    
    for (const secret of secrets) {
      combined.update(secret);
    }
    
    return combined.digest().slice(0, 32);
  }

  /**
   * Sign data (simplified)
   */
  private signData(data: Buffer, signingKey: Buffer): Buffer {
    return crypto.createHmac('sha256', signingKey)
      .update(data)
      .digest();
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
    this.keyEscrow.clear();
    this.removeAllListeners();
  }
}

/**
 * Simplified KEM interface for common use cases
 */
export class SimpleKEM {
  private manager: KEMManager;

  constructor(
    algorithm: PQCAlgorithm = PQCAlgorithm.KYBER,
    securityLevel: SecurityLevel = SecurityLevel.LEVEL3
  ) {
    this.manager = new KEMManager({
      algorithm,
      securityLevel,
      sessionTimeout: 3600000 // 1 hour
    });
  }

  /**
   * Generate a new KEM keypair
   */
  async generateKeyPair(): Promise<{
    publicKey: Buffer;
    sessionId: string;
  }> {
    const session = await this.manager.createSession();
    return {
      publicKey: session.publicKey,
      sessionId: session.id
    };
  }

  /**
   * Create shared secret (sender)
   */
  async createSharedSecret(recipientPublicKey: Buffer): Promise<{
    sharedSecret: Buffer;
    ciphertext: Buffer;
  }> {
    const session = await this.manager.createSession();
    return this.manager.encapsulate(session.id, recipientPublicKey);
  }

  /**
   * Recover shared secret (recipient)
   */
  async recoverSharedSecret(
    sessionId: string,
    ciphertext: Buffer
  ): Promise<Buffer> {
    return this.manager.decapsulate(sessionId, ciphertext);
  }

  /**
   * Destroy the KEM manager
   */
  destroy() {
    this.manager.destroy();
  }
}