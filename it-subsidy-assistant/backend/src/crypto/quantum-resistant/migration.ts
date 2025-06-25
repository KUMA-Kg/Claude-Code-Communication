/**
 * Quantum-Resistant Encryption Migration Utilities
 * Provides tools and strategies for migrating from classical to quantum-resistant encryption
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { 
  PQCAlgorithm, 
  SecurityLevel 
} from './algorithms';
import { 
  HybridEncryption, 
  HybridMode,
  HybridCrypto 
} from './hybrid-encryption';

/**
 * Migration phases
 */
export enum MigrationPhase {
  ASSESSMENT = 'ASSESSMENT',
  PREPARATION = 'PREPARATION',
  HYBRID_DEPLOYMENT = 'HYBRID_DEPLOYMENT',
  TESTING = 'TESTING',
  FULL_MIGRATION = 'FULL_MIGRATION',
  VERIFICATION = 'VERIFICATION',
  COMPLETED = 'COMPLETED'
}

/**
 * Encryption type classification
 */
export enum EncryptionType {
  CLASSICAL_SYMMETRIC = 'CLASSICAL_SYMMETRIC',
  CLASSICAL_ASYMMETRIC = 'CLASSICAL_ASYMMETRIC',
  HYBRID = 'HYBRID',
  QUANTUM_RESISTANT = 'QUANTUM_RESISTANT'
}

/**
 * Migration strategy options
 */
export enum MigrationStrategy {
  // Gradual migration with hybrid approach
  GRADUAL_HYBRID = 'GRADUAL_HYBRID',
  
  // Parallel systems running side by side
  PARALLEL_SYSTEMS = 'PARALLEL_SYSTEMS',
  
  // Big bang - complete replacement
  BIG_BANG = 'BIG_BANG',
  
  // Phased by data sensitivity
  RISK_BASED = 'RISK_BASED'
}

/**
 * Asset to be migrated
 */
export interface CryptoAsset {
  id: string;
  type: EncryptionType;
  algorithm: string;
  keySize: number;
  location: string;
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lastRotated?: Date;
  metadata?: Record<string, any>;
}

/**
 * Migration configuration
 */
export interface MigrationConfig {
  strategy: MigrationStrategy;
  targetAlgorithm: PQCAlgorithm;
  securityLevel: SecurityLevel;
  hybridMode: HybridMode;
  batchSize: number;
  backupEnabled: boolean;
  rollbackEnabled: boolean;
  verificationSamples: number;
}

/**
 * Migration progress tracking
 */
export interface MigrationProgress {
  phase: MigrationPhase;
  totalAssets: number;
  migratedAssets: number;
  failedAssets: number;
  startTime: Date;
  estimatedCompletion?: Date;
  errors: Array<{
    assetId: string;
    error: string;
    timestamp: Date;
  }>;
}

/**
 * Main migration manager
 */
export class QuantumMigrationManager extends EventEmitter {
  private config: MigrationConfig;
  private assets: Map<string, CryptoAsset> = new Map();
  private progress: MigrationProgress;
  private hybridCrypto: HybridCrypto;
  private backupPath?: string;

  constructor(config: MigrationConfig) {
    super();
    this.config = config;
    this.hybridCrypto = new HybridCrypto(
      config.securityLevel,
      config.hybridMode
    );
    
    this.progress = {
      phase: MigrationPhase.ASSESSMENT,
      totalAssets: 0,
      migratedAssets: 0,
      failedAssets: 0,
      startTime: new Date(),
      errors: []
    };

    if (config.backupEnabled) {
      this.backupPath = path.join(process.cwd(), 'crypto-backup', new Date().toISOString());
    }
  }

  /**
   * Phase 1: Assessment - Inventory current encryption
   */
  async assessCurrentState(assetPaths: string[]): Promise<CryptoAsset[]> {
    this.progress.phase = MigrationPhase.ASSESSMENT;
    const discoveredAssets: CryptoAsset[] = [];

    for (const assetPath of assetPaths) {
      try {
        const assets = await this.discoverCryptoAssets(assetPath);
        discoveredAssets.push(...assets);
      } catch (error) {
        this.emit('assessment:error', { path: assetPath, error });
      }
    }

    // Store discovered assets
    for (const asset of discoveredAssets) {
      this.assets.set(asset.id, asset);
    }

    this.progress.totalAssets = discoveredAssets.length;
    this.emit('assessment:complete', discoveredAssets);

    return discoveredAssets;
  }

  /**
   * Phase 2: Preparation - Generate quantum-resistant keys
   */
  async prepareMigration(): Promise<void> {
    this.progress.phase = MigrationPhase.PREPARATION;

    // Create backup directory if enabled
    if (this.config.backupEnabled && this.backupPath) {
      await fs.mkdir(this.backupPath, { recursive: true });
    }

    // Pre-generate quantum-resistant keys for all assets
    const keyGenerationTasks = [];
    
    for (const [id, asset] of this.assets) {
      if (asset.type !== EncryptionType.QUANTUM_RESISTANT) {
        keyGenerationTasks.push(this.prepareAssetMigration(asset));
      }
    }

    await Promise.all(keyGenerationTasks);
    this.emit('preparation:complete');
  }

  /**
   * Phase 3: Deploy hybrid encryption
   */
  async deployHybrid(): Promise<void> {
    this.progress.phase = MigrationPhase.HYBRID_DEPLOYMENT;

    const batches = this.createBatches(Array.from(this.assets.values()));
    
    for (const [index, batch] of batches.entries()) {
      await this.migrateBatch(batch, true); // hybrid mode
      
      this.emit('hybrid:batch-complete', {
        batchIndex: index,
        batchSize: batch.length,
        totalBatches: batches.length
      });
    }

    this.emit('hybrid:deployment-complete');
  }

  /**
   * Phase 4: Testing - Verify hybrid system
   */
  async testHybridSystem(): Promise<{
    success: boolean;
    results: Array<{
      assetId: string;
      testPassed: boolean;
      error?: string;
    }>;
  }> {
    this.progress.phase = MigrationPhase.TESTING;

    const testResults = [];
    const sampleSize = Math.min(
      this.config.verificationSamples,
      this.assets.size
    );

    // Random sampling for testing
    const assetArray = Array.from(this.assets.values());
    const testSample = this.randomSample(assetArray, sampleSize);

    for (const asset of testSample) {
      const result = await this.testAssetEncryption(asset);
      testResults.push(result);
    }

    const success = testResults.every(r => r.testPassed);
    this.emit('testing:complete', { success, results: testResults });

    return { success, results: testResults };
  }

  /**
   * Phase 5: Full migration to quantum-resistant
   */
  async completeMigration(): Promise<void> {
    this.progress.phase = MigrationPhase.FULL_MIGRATION;

    const batches = this.createBatches(
      Array.from(this.assets.values()).filter(
        a => a.type === EncryptionType.HYBRID
      )
    );

    for (const [index, batch] of batches.entries()) {
      await this.migrateBatch(batch, false); // full quantum-resistant mode
      
      this.emit('migration:batch-complete', {
        batchIndex: index,
        batchSize: batch.length,
        totalBatches: batches.length
      });
    }

    this.progress.phase = MigrationPhase.VERIFICATION;
    await this.verifyMigration();
    
    this.progress.phase = MigrationPhase.COMPLETED;
    this.emit('migration:complete', this.progress);
  }

  /**
   * Rollback mechanism
   */
  async rollback(toPhase: MigrationPhase): Promise<void> {
    if (!this.config.rollbackEnabled) {
      throw new Error('Rollback is not enabled');
    }

    if (!this.backupPath) {
      throw new Error('No backup available for rollback');
    }

    this.emit('rollback:started', { fromPhase: this.progress.phase, toPhase });

    // Restore from backup based on target phase
    switch (toPhase) {
      case MigrationPhase.ASSESSMENT:
        await this.restoreOriginalState();
        break;
      
      case MigrationPhase.HYBRID_DEPLOYMENT:
        await this.restoreHybridState();
        break;
      
      default:
        throw new Error(`Cannot rollback to phase: ${toPhase}`);
    }

    this.progress.phase = toPhase;
    this.emit('rollback:complete', toPhase);
  }

  /**
   * Generate migration report
   */
  async generateReport(): Promise<{
    summary: MigrationProgress;
    recommendations: string[];
    riskAssessment: Record<string, any>;
  }> {
    const classicalAssets = Array.from(this.assets.values()).filter(
      a => a.type === EncryptionType.CLASSICAL_ASYMMETRIC || 
           a.type === EncryptionType.CLASSICAL_SYMMETRIC
    );

    const recommendations: string[] = [];

    // Analyze and provide recommendations
    if (classicalAssets.length > 0) {
      recommendations.push(
        `${classicalAssets.length} assets still using classical encryption. ` +
        `Priority migration recommended for ${classicalAssets.filter(a => a.sensitivity === 'CRITICAL').length} critical assets.`
      );
    }

    // Risk assessment
    const riskAssessment = {
      quantumThreatLevel: this.assessQuantumThreat(),
      migrationUrgency: this.calculateMigrationUrgency(),
      estimatedTimeToQuantumThreat: '5-15 years',
      currentVulnerabilities: classicalAssets.filter(
        a => a.algorithm.includes('RSA') || a.algorithm.includes('ECC')
      ).length
    };

    return {
      summary: this.progress,
      recommendations,
      riskAssessment
    };
  }

  /**
   * Discover crypto assets in a given path
   */
  private async discoverCryptoAssets(assetPath: string): Promise<CryptoAsset[]> {
    // This is a simplified implementation
    // In reality, this would scan configuration files, key stores, etc.
    
    const assets: CryptoAsset[] = [];
    
    // Example: Scan for JWT configurations
    if (assetPath.includes('auth')) {
      assets.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: EncryptionType.CLASSICAL_ASYMMETRIC,
        algorithm: 'RS256',
        keySize: 2048,
        location: assetPath,
        sensitivity: 'HIGH'
      });
    }

    // Example: Scan for database encryption
    if (assetPath.includes('database')) {
      assets.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: EncryptionType.CLASSICAL_SYMMETRIC,
        algorithm: 'AES-256-GCM',
        keySize: 256,
        location: assetPath,
        sensitivity: 'CRITICAL'
      });
    }

    return assets;
  }

  /**
   * Prepare asset for migration
   */
  private async prepareAssetMigration(asset: CryptoAsset): Promise<void> {
    // Generate new quantum-resistant keys
    const identity = await this.hybridCrypto.generateIdentity();
    
    // Store migration metadata
    asset.metadata = {
      ...asset.metadata,
      migrationPrepared: true,
      newKeyGenerated: new Date().toISOString(),
      targetAlgorithm: this.config.targetAlgorithm
    };

    // Backup if enabled
    if (this.config.backupEnabled && this.backupPath) {
      await this.backupAsset(asset);
    }
  }

  /**
   * Migrate a batch of assets
   */
  private async migrateBatch(
    batch: CryptoAsset[],
    hybridMode: boolean
  ): Promise<void> {
    for (const asset of batch) {
      try {
        await this.migrateAsset(asset, hybridMode);
        this.progress.migratedAssets++;
      } catch (error) {
        this.progress.failedAssets++;
        this.progress.errors.push({
          assetId: asset.id,
          error: error.message,
          timestamp: new Date()
        });
        
        this.emit('migration:asset-failed', { asset, error });
      }
    }
  }

  /**
   * Migrate individual asset
   */
  private async migrateAsset(
    asset: CryptoAsset,
    hybridMode: boolean
  ): Promise<void> {
    // Update asset type
    asset.type = hybridMode ? EncryptionType.HYBRID : EncryptionType.QUANTUM_RESISTANT;
    asset.algorithm = hybridMode ? 
      `Hybrid-${this.config.targetAlgorithm}` : 
      this.config.targetAlgorithm;
    
    // In real implementation, this would:
    // 1. Re-encrypt data with new keys
    // 2. Update configuration
    // 3. Update key stores
    // 4. Verify the migration
    
    asset.lastRotated = new Date();
    this.emit('migration:asset-complete', asset);
  }

  /**
   * Test asset encryption
   */
  private async testAssetEncryption(asset: CryptoAsset): Promise<{
    assetId: string;
    testPassed: boolean;
    error?: string;
  }> {
    try {
      // Generate test data
      const testData = crypto.randomBytes(1024);
      
      // Test encryption/decryption cycle
      const identity = await this.hybridCrypto.generateIdentity();
      const encrypted = await this.hybridCrypto.encrypt(testData, {
        classical: identity.classical.publicKey,
        pqc: identity.pqc.kem.publicKey
      });
      
      const decrypted = await this.hybridCrypto.decrypt(encrypted, {
        classical: identity.classical.privateKey,
        pqc: identity.pqc.kem.privateKey
      });
      
      const testPassed = Buffer.compare(testData, decrypted) === 0;
      
      return {
        assetId: asset.id,
        testPassed,
        error: testPassed ? undefined : 'Encryption/decryption cycle failed'
      };
    } catch (error) {
      return {
        assetId: asset.id,
        testPassed: false,
        error: error.message
      };
    }
  }

  /**
   * Verify migration completion
   */
  private async verifyMigration(): Promise<void> {
    const unmigrated = Array.from(this.assets.values()).filter(
      a => a.type === EncryptionType.CLASSICAL_ASYMMETRIC ||
           a.type === EncryptionType.CLASSICAL_SYMMETRIC
    );

    if (unmigrated.length > 0) {
      this.emit('verification:warning', {
        message: `${unmigrated.length} assets not migrated`,
        assets: unmigrated
      });
    }

    // Run final verification tests
    const testResults = await this.testHybridSystem();
    
    if (!testResults.success) {
      throw new Error('Migration verification failed');
    }
  }

  /**
   * Backup asset
   */
  private async backupAsset(asset: CryptoAsset): Promise<void> {
    if (!this.backupPath) return;

    const backupData = {
      asset,
      timestamp: new Date().toISOString(),
      phase: this.progress.phase
    };

    await fs.writeFile(
      path.join(this.backupPath, `${asset.id}.json`),
      JSON.stringify(backupData, null, 2)
    );
  }

  /**
   * Restore original state
   */
  private async restoreOriginalState(): Promise<void> {
    // Implementation would restore from backups
    this.emit('restore:complete', 'original');
  }

  /**
   * Restore hybrid state
   */
  private async restoreHybridState(): Promise<void> {
    // Implementation would restore to hybrid configuration
    this.emit('restore:complete', 'hybrid');
  }

  /**
   * Create batches for processing
   */
  private createBatches<T>(items: T[]): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += this.config.batchSize) {
      batches.push(items.slice(i, i + this.config.batchSize));
    }
    
    return batches;
  }

  /**
   * Random sample from array
   */
  private randomSample<T>(array: T[], size: number): T[] {
    const sample: T[] = [];
    const indices = new Set<number>();
    
    while (indices.size < size && indices.size < array.length) {
      indices.add(Math.floor(Math.random() * array.length));
    }
    
    for (const index of indices) {
      sample.push(array[index]);
    }
    
    return sample;
  }

  /**
   * Assess quantum threat level
   */
  private assessQuantumThreat(): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalAssets = Array.from(this.assets.values()).filter(
      a => a.sensitivity === 'CRITICAL' && 
           (a.type === EncryptionType.CLASSICAL_ASYMMETRIC ||
            a.type === EncryptionType.CLASSICAL_SYMMETRIC)
    );

    if (criticalAssets.length > 10) return 'CRITICAL';
    if (criticalAssets.length > 5) return 'HIGH';
    if (criticalAssets.length > 0) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculate migration urgency
   */
  private calculateMigrationUrgency(): number {
    // Score from 0-100
    let score = 0;

    // Factor in sensitive assets
    const sensitiveAssets = Array.from(this.assets.values()).filter(
      a => a.sensitivity === 'HIGH' || a.sensitivity === 'CRITICAL'
    );
    score += (sensitiveAssets.length / this.assets.size) * 40;

    // Factor in key age
    const oldKeys = Array.from(this.assets.values()).filter(
      a => a.lastRotated && 
           (new Date().getTime() - a.lastRotated.getTime()) > 365 * 24 * 60 * 60 * 1000
    );
    score += (oldKeys.length / this.assets.size) * 30;

    // Factor in weak algorithms
    const weakAlgorithms = Array.from(this.assets.values()).filter(
      a => a.keySize < 2048 || a.algorithm.includes('SHA1')
    );
    score += (weakAlgorithms.length / this.assets.size) * 30;

    return Math.min(100, Math.round(score));
  }
}

/**
 * Migration strategy factory
 */
export class MigrationStrategyFactory {
  static createStrategy(
    strategy: MigrationStrategy,
    config: Partial<MigrationConfig> = {}
  ): MigrationConfig {
    const baseConfig: MigrationConfig = {
      targetAlgorithm: PQCAlgorithm.KYBER,
      securityLevel: SecurityLevel.LEVEL3,
      hybridMode: HybridMode.KDF_COMBINED,
      batchSize: 10,
      backupEnabled: true,
      rollbackEnabled: true,
      verificationSamples: 100,
      ...config
    };

    switch (strategy) {
      case MigrationStrategy.GRADUAL_HYBRID:
        return {
          ...baseConfig,
          strategy: MigrationStrategy.GRADUAL_HYBRID,
          batchSize: 5,
          verificationSamples: 200
        };

      case MigrationStrategy.PARALLEL_SYSTEMS:
        return {
          ...baseConfig,
          strategy: MigrationStrategy.PARALLEL_SYSTEMS,
          batchSize: 20,
          rollbackEnabled: true
        };

      case MigrationStrategy.BIG_BANG:
        return {
          ...baseConfig,
          strategy: MigrationStrategy.BIG_BANG,
          batchSize: 100,
          backupEnabled: true,
          rollbackEnabled: true
        };

      case MigrationStrategy.RISK_BASED:
        return {
          ...baseConfig,
          strategy: MigrationStrategy.RISK_BASED,
          batchSize: 10,
          verificationSamples: 500
        };

      default:
        throw new Error(`Unknown migration strategy: ${strategy}`);
    }
  }
}