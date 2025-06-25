/**
 * Quantum Data Protection Service
 * Provides quantum-resistant encryption for data at rest and in transit
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import { HybridCrypto, HybridMode } from '../crypto/quantum-resistant/hybrid-encryption';
import { SecurityLevel, PQCAlgorithm } from '../crypto/quantum-resistant/algorithms';
import { KEMManager } from '../crypto/quantum-resistant/kem-manager';
import { 
  QuantumMigrationManager, 
  MigrationStrategy,
  MigrationPhase,
  EncryptionType 
} from '../crypto/quantum-resistant/migration';

/**
 * Data classification levels
 */
export enum DataClassification {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  SECRET = 'SECRET',
  TOP_SECRET = 'TOP_SECRET'
}

/**
 * Encryption metadata
 */
export interface EncryptionMetadata {
  version: number;
  algorithm: string;
  keyId: string;
  timestamp: number;
  classification: DataClassification;
  kemSessionId?: string;
  additionalData?: Record<string, any>;
}

/**
 * Protected data envelope
 */
export interface ProtectedDataEnvelope {
  metadata: EncryptionMetadata;
  encryptedData: Buffer;
  authenticationTag: Buffer;
  keyMaterial?: {
    ephemeralPublicKey: Buffer;
    kemCiphertext: Buffer;
  };
}

/**
 * Data protection configuration
 */
export interface DataProtectionConfig {
  defaultClassification: DataClassification;
  securityLevel: SecurityLevel;
  enableCompression: boolean;
  enableIntegrityCheck: boolean;
  rotationPolicy: {
    enabled: boolean;
    intervalDays: number;
    automaticReEncryption: boolean;
  };
  migrationStrategy?: MigrationStrategy;
}

/**
 * Main quantum data protection service
 */
export class QuantumDataProtectionService extends EventEmitter {
  private hybridCrypto: HybridCrypto;
  private kemManager: KEMManager;
  private migrationManager?: QuantumMigrationManager;
  private config: DataProtectionConfig;
  private keyStore: Map<string, any> = new Map();
  private rotationTimer?: NodeJS.Timer;

  constructor(config: Partial<DataProtectionConfig> = {}) {
    super();
    
    this.config = {
      defaultClassification: DataClassification.CONFIDENTIAL,
      securityLevel: SecurityLevel.LEVEL3,
      enableCompression: true,
      enableIntegrityCheck: true,
      rotationPolicy: {
        enabled: true,
        intervalDays: 90,
        automaticReEncryption: true
      },
      ...config
    };

    this.hybridCrypto = new HybridCrypto(
      this.config.securityLevel,
      HybridMode.KDF_COMBINED
    );

    this.kemManager = new KEMManager({
      algorithm: PQCAlgorithm.KYBER,
      securityLevel: this.config.securityLevel,
      sessionTimeout: 3600000 * 24 // 24 hours
    });

    // Initialize migration manager if strategy provided
    if (this.config.migrationStrategy) {
      this.initializeMigration();
    }

    // Start rotation timer if enabled
    if (this.config.rotationPolicy.enabled) {
      this.startRotationTimer();
    }
  }

  /**
   * Protect data with quantum-resistant encryption
   */
  async protectData(
    data: Buffer | string,
    classification: DataClassification = this.config.defaultClassification,
    additionalData?: Record<string, any>
  ): Promise<ProtectedDataEnvelope> {
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    
    // Compress if enabled and beneficial
    const processedData = this.config.enableCompression ? 
      await this.compressData(dataBuffer) : dataBuffer;

    // Generate or retrieve encryption keys based on classification
    const keyMaterial = await this.getKeyMaterial(classification);

    // Create KEM session for ephemeral key exchange
    const kemSession = await this.kemManager.createSession({
      classification,
      timestamp: Date.now()
    });

    // Encrypt data
    const encrypted = await this.hybridCrypto.encrypt(processedData, {
      classical: keyMaterial.publicKeys.classical,
      pqc: keyMaterial.publicKeys.pqc
    });

    // Create metadata
    const metadata: EncryptionMetadata = {
      version: 1,
      algorithm: `Hybrid-${PQCAlgorithm.KYBER}-ECDH`,
      keyId: keyMaterial.keyId,
      timestamp: Date.now(),
      classification,
      kemSessionId: kemSession.id,
      additionalData: {
        ...additionalData,
        compressed: this.config.enableCompression,
        originalSize: dataBuffer.length,
        processedSize: processedData.length
      }
    };

    // Create authentication tag if integrity check enabled
    const authTag = this.config.enableIntegrityCheck ?
      await this.createAuthenticationTag(encrypted.encrypted, metadata) :
      Buffer.alloc(0);

    const envelope: ProtectedDataEnvelope = {
      metadata,
      encryptedData: encrypted.encrypted,
      authenticationTag: authTag,
      keyMaterial: {
        ephemeralPublicKey: encrypted.ephemeralClassicalKey,
        kemCiphertext: encrypted.pqcCiphertext
      }
    };

    this.emit('data:protected', {
      classification,
      size: dataBuffer.length,
      timestamp: metadata.timestamp
    });

    return envelope;
  }

  /**
   * Unprotect data with quantum-resistant decryption
   */
  async unprotectData(envelope: ProtectedDataEnvelope): Promise<Buffer> {
    // Verify metadata version
    if (envelope.metadata.version !== 1) {
      throw new Error(`Unsupported envelope version: ${envelope.metadata.version}`);
    }

    // Verify authentication tag if integrity check enabled
    if (this.config.enableIntegrityCheck) {
      const valid = await this.verifyAuthenticationTag(
        envelope.encryptedData,
        envelope.metadata,
        envelope.authenticationTag
      );

      if (!valid) {
        throw new Error('Authentication tag verification failed');
      }
    }

    // Retrieve decryption keys
    const keyMaterial = await this.getKeyMaterial(
      envelope.metadata.classification,
      envelope.metadata.keyId
    );

    if (!keyMaterial.privateKeys) {
      throw new Error('Private keys not available for decryption');
    }

    // Decrypt data
    const decrypted = await this.hybridCrypto.decrypt(
      {
        encrypted: envelope.encryptedData,
        ephemeralClassicalKey: envelope.keyMaterial!.ephemeralPublicKey,
        pqcCiphertext: envelope.keyMaterial!.kemCiphertext,
        iv: envelope.encryptedData.slice(0, 16), // Extract IV from encrypted data
        authTag: envelope.encryptedData.slice(16, 32) // Extract auth tag
      },
      {
        classical: keyMaterial.privateKeys.classical,
        pqc: keyMaterial.privateKeys.pqc
      }
    );

    // Decompress if needed
    const decompressed = envelope.metadata.additionalData?.compressed ?
      await this.decompressData(decrypted) : decrypted;

    this.emit('data:unprotected', {
      classification: envelope.metadata.classification,
      timestamp: Date.now()
    });

    return decompressed;
  }

  /**
   * Protect data stream with quantum-resistant encryption
   */
  async *protectStream(
    dataStream: AsyncIterable<Buffer>,
    classification: DataClassification = this.config.defaultClassification,
    chunkSize: number = 65536 // 64KB chunks
  ): AsyncGenerator<ProtectedDataEnvelope> {
    const streamKeyMaterial = await this.getKeyMaterial(classification);
    let chunkIndex = 0;

    for await (const chunk of dataStream) {
      // Process chunk
      const envelope = await this.protectData(chunk, classification, {
        streamChunk: true,
        chunkIndex: chunkIndex++,
        streamId: streamKeyMaterial.keyId
      });

      yield envelope;
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(classification?: DataClassification): Promise<void> {
    const classificationsToRotate = classification ? 
      [classification] : 
      Object.values(DataClassification);

    for (const cls of classificationsToRotate) {
      const oldKeyId = this.getKeyIdForClassification(cls);
      
      // Generate new keys
      const newIdentity = await this.hybridCrypto.generateIdentity();
      const newKeyId = this.generateKeyId();

      // Store new keys
      this.keyStore.set(newKeyId, {
        keyId: newKeyId,
        classification: cls,
        identity: newIdentity,
        createdAt: Date.now(),
        previousKeyId: oldKeyId
      });

      // Update classification mapping
      this.updateClassificationKeyMapping(cls, newKeyId);

      this.emit('keys:rotated', {
        classification: cls,
        oldKeyId,
        newKeyId,
        timestamp: Date.now()
      });
    }

    // Re-encrypt data if automatic re-encryption enabled
    if (this.config.rotationPolicy.automaticReEncryption) {
      await this.reEncryptData(classificationsToRotate);
    }
  }

  /**
   * Migrate to quantum-resistant encryption
   */
  async startMigration(assetPaths: string[]): Promise<void> {
    if (!this.migrationManager) {
      throw new Error('Migration manager not initialized');
    }

    // Phase 1: Assessment
    const assets = await this.migrationManager.assessCurrentState(assetPaths);
    
    this.emit('migration:assessment-complete', {
      totalAssets: assets.length,
      classicalAssets: assets.filter(a => 
        a.type === EncryptionType.CLASSICAL_ASYMMETRIC ||
        a.type === EncryptionType.CLASSICAL_SYMMETRIC
      ).length
    });

    // Phase 2: Preparation
    await this.migrationManager.prepareMigration();

    // Phase 3: Hybrid deployment
    await this.migrationManager.deployHybrid();

    // Phase 4: Testing
    const testResults = await this.migrationManager.testHybridSystem();
    
    if (!testResults.success) {
      this.emit('migration:test-failed', testResults);
      throw new Error('Migration testing failed');
    }

    // Phase 5: Full migration
    await this.migrationManager.completeMigration();

    this.emit('migration:complete');
  }

  /**
   * Create secure backup
   */
  async createSecureBackup(
    data: Buffer,
    backupClassification: DataClassification = DataClassification.TOP_SECRET
  ): Promise<{
    backupId: string;
    envelope: ProtectedDataEnvelope;
    recoveryKey: string;
  }> {
    // Generate unique backup ID
    const backupId = crypto.randomBytes(16).toString('hex');

    // Create recovery key
    const recoveryKey = crypto.randomBytes(32).toString('base64');

    // Protect data with highest security
    const envelope = await this.protectData(data, backupClassification, {
      backupId,
      backupTimestamp: Date.now(),
      recoveryKeyHash: crypto.createHash('sha256').update(recoveryKey).digest('hex')
    });

    // Store backup metadata
    this.emit('backup:created', {
      backupId,
      classification: backupClassification,
      size: data.length,
      timestamp: Date.now()
    });

    return { backupId, envelope, recoveryKey };
  }

  /**
   * Get key material for classification
   */
  private async getKeyMaterial(
    classification: DataClassification,
    keyId?: string
  ): Promise<any> {
    // If keyId provided, retrieve specific key
    if (keyId) {
      const keyMaterial = this.keyStore.get(keyId);
      if (!keyMaterial) {
        throw new Error(`Key not found: ${keyId}`);
      }
      return {
        keyId,
        publicKeys: {
          classical: keyMaterial.identity.classical.publicKey,
          pqc: keyMaterial.identity.pqc.kem.publicKey
        },
        privateKeys: {
          classical: keyMaterial.identity.classical.privateKey,
          pqc: keyMaterial.identity.pqc.kem.privateKey
        }
      };
    }

    // Get or create key for classification
    const existingKeyId = this.getKeyIdForClassification(classification);
    
    if (existingKeyId) {
      return this.getKeyMaterial(classification, existingKeyId);
    }

    // Generate new key material
    const identity = await this.hybridCrypto.generateIdentity();
    const newKeyId = this.generateKeyId();

    this.keyStore.set(newKeyId, {
      keyId: newKeyId,
      classification,
      identity,
      createdAt: Date.now()
    });

    this.updateClassificationKeyMapping(classification, newKeyId);

    return {
      keyId: newKeyId,
      publicKeys: {
        classical: identity.classical.publicKey,
        pqc: identity.pqc.kem.publicKey
      },
      privateKeys: {
        classical: identity.classical.privateKey,
        pqc: identity.pqc.kem.privateKey
      }
    };
  }

  /**
   * Compress data
   */
  private async compressData(data: Buffer): Promise<Buffer> {
    // Simple compression check - don't compress if already small
    if (data.length < 1024) {
      return data;
    }

    // In production, use proper compression library
    // This is a placeholder
    return data;
  }

  /**
   * Decompress data
   */
  private async decompressData(data: Buffer): Promise<Buffer> {
    // In production, use proper decompression
    // This is a placeholder
    return data;
  }

  /**
   * Create authentication tag
   */
  private async createAuthenticationTag(
    data: Buffer,
    metadata: EncryptionMetadata
  ): Promise<Buffer> {
    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    
    return crypto.createHmac('sha256', 'quantum-auth-key') // Use proper key in production
      .update(data)
      .update(metadataBuffer)
      .digest();
  }

  /**
   * Verify authentication tag
   */
  private async verifyAuthenticationTag(
    data: Buffer,
    metadata: EncryptionMetadata,
    tag: Buffer
  ): Promise<boolean> {
    const expectedTag = await this.createAuthenticationTag(data, metadata);
    return crypto.timingSafeEqual(tag, expectedTag);
  }

  /**
   * Re-encrypt data after key rotation
   */
  private async reEncryptData(classifications: DataClassification[]): Promise<void> {
    // In production, this would scan and re-encrypt all data
    // with the specified classifications
    this.emit('reencryption:started', { classifications });
    
    // Placeholder for re-encryption logic
    
    this.emit('reencryption:completed', { classifications });
  }

  /**
   * Initialize migration manager
   */
  private initializeMigration(): void {
    this.migrationManager = new QuantumMigrationManager({
      strategy: this.config.migrationStrategy!,
      targetAlgorithm: PQCAlgorithm.KYBER,
      securityLevel: this.config.securityLevel,
      hybridMode: HybridMode.KDF_COMBINED,
      batchSize: 100,
      backupEnabled: true,
      rollbackEnabled: true,
      verificationSamples: 100
    });

    this.migrationManager.on('migration:asset-complete', (asset) => {
      this.emit('migration:progress', asset);
    });
  }

  /**
   * Start key rotation timer
   */
  private startRotationTimer(): void {
    const intervalMs = this.config.rotationPolicy.intervalDays * 24 * 60 * 60 * 1000;
    
    this.rotationTimer = setInterval(async () => {
      await this.rotateKeys();
    }, intervalMs);
  }

  /**
   * Get key ID for classification
   */
  private getKeyIdForClassification(classification: DataClassification): string | null {
    // In production, this would use a persistent mapping
    for (const [keyId, keyData] of this.keyStore) {
      if (keyData.classification === classification) {
        return keyId;
      }
    }
    return null;
  }

  /**
   * Update classification key mapping
   */
  private updateClassificationKeyMapping(
    classification: DataClassification,
    keyId: string
  ): void {
    // In production, persist this mapping
    this.emit('mapping:updated', { classification, keyId });
  }

  /**
   * Generate unique key ID
   */
  private generateKeyId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
    
    this.keyStore.clear();
    this.kemManager.destroy();
    
    if (this.migrationManager) {
      this.migrationManager.removeAllListeners();
    }
    
    this.removeAllListeners();
  }
}