/**
 * Performance Optimization and Benchmarking for Quantum-Resistant Cryptography
 * Provides tools to measure and optimize PQC performance
 */

import { performance } from 'perf_hooks';
import { Worker } from 'worker_threads';
import crypto from 'crypto';
import os from 'os';
import { EventEmitter } from 'events';
import {
  PQCAlgorithm,
  SecurityLevel,
  Kyber,
  Dilithium,
  SphincsPlus,
  ClassicMcEliece,
  PQCBenchmark
} from './algorithms';
import { HybridEncryption, HybridMode } from './hybrid-encryption';

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  algorithm: string;
  operation: string;
  averageTime: number; // milliseconds
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  throughput: number; // operations per second
  cpuUsage?: number; // percentage
  memoryUsage?: number; // MB
}

/**
 * Optimization strategies
 */
export enum OptimizationStrategy {
  CACHE_KEYS = 'CACHE_KEYS',
  PARALLEL_PROCESSING = 'PARALLEL_PROCESSING',
  BATCH_OPERATIONS = 'BATCH_OPERATIONS',
  PRECOMPUTATION = 'PRECOMPUTATION',
  HARDWARE_ACCELERATION = 'HARDWARE_ACCELERATION'
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize: number;
  ttl: number; // milliseconds
  algorithm: 'LRU' | 'LFU' | 'FIFO';
}

/**
 * Performance optimizer for PQC operations
 */
export class PQCPerformanceOptimizer extends EventEmitter {
  private keyCache: Map<string, { key: Buffer; expires: number }> = new Map();
  private precomputedValues: Map<string, Buffer> = new Map();
  private workerPool: Worker[] = [];
  private cacheConfig: CacheConfig;

  constructor(cacheConfig: CacheConfig = {
    maxSize: 1000,
    ttl: 3600000, // 1 hour
    algorithm: 'LRU'
  }) {
    super();
    this.cacheConfig = cacheConfig;
    this.initializeWorkerPool();
    this.startCacheCleanup();
  }

  /**
   * Benchmark all algorithms
   */
  async benchmarkAll(
    iterations: number = 100,
    dataSizes: number[] = [1024, 4096, 16384]
  ): Promise<Map<string, PerformanceMetrics[]>> {
    const results = new Map<string, PerformanceMetrics[]>();

    // Test KEM algorithms
    const kemAlgorithms = [
      { name: 'Kyber', instance: new Kyber(SecurityLevel.LEVEL3) },
      { name: 'Classic McEliece', instance: new ClassicMcEliece(SecurityLevel.LEVEL3) }
    ];

    for (const { name, instance } of kemAlgorithms) {
      const metrics = await this.benchmarkKEM(instance, iterations, dataSizes);
      results.set(name, metrics);
    }

    // Test signature algorithms
    const sigAlgorithms = [
      { name: 'Dilithium', instance: new Dilithium(SecurityLevel.LEVEL3) },
      { name: 'SPHINCS+', instance: new SphincsPlus(SecurityLevel.LEVEL3) }
    ];

    for (const { name, instance } of sigAlgorithms) {
      const metrics = await this.benchmarkSignature(instance, iterations, dataSizes);
      results.set(name, metrics);
    }

    // Test hybrid encryption
    const hybridMetrics = await this.benchmarkHybrid(iterations, dataSizes);
    results.set('Hybrid', hybridMetrics);

    return results;
  }

  /**
   * Benchmark KEM algorithm
   */
  private async benchmarkKEM(
    algorithm: Kyber | ClassicMcEliece,
    iterations: number,
    dataSizes: number[]
  ): Promise<PerformanceMetrics[]> {
    const metrics: PerformanceMetrics[] = [];

    // Key generation benchmark
    const keyGenTimes: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      algorithm.generateKeyPair();
      keyGenTimes.push(performance.now() - start);
    }
    
    metrics.push(this.calculateMetrics(
      algorithm.name,
      'Key Generation',
      keyGenTimes
    ));

    // Encapsulation benchmark
    const { publicKey, privateKey } = algorithm.generateKeyPair();
    const encapTimes: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      algorithm.encapsulate(publicKey);
      encapTimes.push(performance.now() - start);
    }
    
    metrics.push(this.calculateMetrics(
      algorithm.name,
      'Encapsulation',
      encapTimes
    ));

    // Decapsulation benchmark
    const { ciphertext } = algorithm.encapsulate(publicKey);
    const decapTimes: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      algorithm.decapsulate(ciphertext, privateKey);
      decapTimes.push(performance.now() - start);
    }
    
    metrics.push(this.calculateMetrics(
      algorithm.name,
      'Decapsulation',
      decapTimes
    ));

    return metrics;
  }

  /**
   * Benchmark signature algorithm
   */
  private async benchmarkSignature(
    algorithm: Dilithium | SphincsPlus,
    iterations: number,
    dataSizes: number[]
  ): Promise<PerformanceMetrics[]> {
    const metrics: PerformanceMetrics[] = [];

    for (const dataSize of dataSizes) {
      const message = crypto.randomBytes(dataSize);
      const { publicKey, privateKey } = algorithm.generateKeyPair();

      // Signing benchmark
      const signTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        algorithm.sign(message, privateKey);
        signTimes.push(performance.now() - start);
      }
      
      metrics.push(this.calculateMetrics(
        algorithm.name,
        `Sign ${dataSize}B`,
        signTimes
      ));

      // Verification benchmark
      const signature = algorithm.sign(message, privateKey);
      const verifyTimes: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        algorithm.verify(message, signature, publicKey);
        verifyTimes.push(performance.now() - start);
      }
      
      metrics.push(this.calculateMetrics(
        algorithm.name,
        `Verify ${dataSize}B`,
        verifyTimes
      ));
    }

    return metrics;
  }

  /**
   * Benchmark hybrid encryption
   */
  private async benchmarkHybrid(
    iterations: number,
    dataSizes: number[]
  ): Promise<PerformanceMetrics[]> {
    const metrics: PerformanceMetrics[] = [];
    
    const hybrid = new HybridEncryption({
      classicalAlgorithm: 'ECDH',
      pqcAlgorithm: PQCAlgorithm.KYBER,
      hybridMode: HybridMode.KDF_COMBINED,
      securityLevel: SecurityLevel.LEVEL3
    });

    for (const dataSize of dataSizes) {
      const data = crypto.randomBytes(dataSize);
      const identity = await hybrid.generateHybridKeyPair();

      // Encryption benchmark
      const encryptTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await hybrid.encryptHybrid(
          data,
          identity.classical.publicKey,
          identity.pqc.kem.publicKey
        );
        encryptTimes.push(performance.now() - start);
      }
      
      metrics.push(this.calculateMetrics(
        'Hybrid',
        `Encrypt ${dataSize}B`,
        encryptTimes
      ));
    }

    return metrics;
  }

  /**
   * Optimize with caching
   */
  async optimizeWithCache<T>(
    key: string,
    operation: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache
    const cached = this.keyCache.get(key);
    if (cached && cached.expires > Date.now()) {
      this.emit('cache:hit', key);
      return cached.key as any; // Type assertion for demo
    }

    // Execute operation
    const result = await operation();
    
    // Store in cache
    this.keyCache.set(key, {
      key: Buffer.from(JSON.stringify(result)),
      expires: Date.now() + (ttl || this.cacheConfig.ttl)
    });

    // Enforce cache size limit
    if (this.keyCache.size > this.cacheConfig.maxSize) {
      this.evictFromCache();
    }

    this.emit('cache:miss', key);
    return result;
  }

  /**
   * Parallel processing optimization
   */
  async parallelProcess<T>(
    tasks: Array<() => Promise<T>>,
    maxConcurrency: number = os.cpus().length
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const task of tasks) {
      const promise = task().then(result => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * Batch operations optimization
   */
  async batchOperations<T>(
    items: T[],
    operation: (batch: T[]) => Promise<any>,
    batchSize: number = 100
  ): Promise<void> {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    // Process batches in parallel
    await this.parallelProcess(
      batches.map(batch => () => operation(batch))
    );
  }

  /**
   * Precompute common values
   */
  async precompute(algorithm: PQCAlgorithm, count: number = 10): Promise<void> {
    const tasks = [];

    switch (algorithm) {
      case PQCAlgorithm.KYBER:
        const kyber = new Kyber(SecurityLevel.LEVEL3);
        for (let i = 0; i < count; i++) {
          tasks.push(async () => {
            const { publicKey, privateKey } = kyber.generateKeyPair();
            this.precomputedValues.set(
              `kyber_keypair_${i}`,
              Buffer.concat([publicKey, privateKey])
            );
          });
        }
        break;
      
      // Add other algorithms as needed
    }

    await this.parallelProcess(tasks);
    this.emit('precompute:complete', { algorithm, count });
  }

  /**
   * Memory optimization - clear unused resources
   */
  optimizeMemory(): void {
    // Clear expired cache entries
    const now = Date.now();
    for (const [key, value] of this.keyCache) {
      if (value.expires < now) {
        this.keyCache.delete(key);
      }
    }

    // Clear old precomputed values
    if (this.precomputedValues.size > 100) {
      const toDelete = this.precomputedValues.size - 100;
      let deleted = 0;
      
      for (const key of this.precomputedValues.keys()) {
        if (deleted >= toDelete) break;
        this.precomputedValues.delete(key);
        deleted++;
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    this.emit('memory:optimized');
  }

  /**
   * Compare algorithm performance
   */
  compareAlgorithms(
    metrics: Map<string, PerformanceMetrics[]>
  ): {
    fastest: { algorithm: string; operation: string; time: number };
    slowest: { algorithm: string; operation: string; time: number };
    recommendations: string[];
  } {
    let fastest = { algorithm: '', operation: '', time: Infinity };
    let slowest = { algorithm: '', operation: '', time: 0 };

    for (const [algorithm, metricsList] of metrics) {
      for (const metric of metricsList) {
        if (metric.averageTime < fastest.time) {
          fastest = {
            algorithm,
            operation: metric.operation,
            time: metric.averageTime
          };
        }
        
        if (metric.averageTime > slowest.time) {
          slowest = {
            algorithm,
            operation: metric.operation,
            time: metric.averageTime
          };
        }
      }
    }

    const recommendations: string[] = [];

    // Generate recommendations based on performance
    if (metrics.has('Kyber') && metrics.has('Classic McEliece')) {
      const kyberMetrics = metrics.get('Kyber')!;
      const mcElieceMetrics = metrics.get('Classic McEliece')!;
      
      const kyberAvg = this.calculateAverageTime(kyberMetrics);
      const mcElieceAvg = this.calculateAverageTime(mcElieceMetrics);
      
      if (kyberAvg < mcElieceAvg) {
        recommendations.push(
          'Kyber offers better performance for most operations. ' +
          'Consider using Kyber for general-purpose encryption.'
        );
      }
    }

    // Check if hybrid is significantly slower
    if (metrics.has('Hybrid')) {
      const hybridMetrics = metrics.get('Hybrid')!;
      const hybridAvg = this.calculateAverageTime(hybridMetrics);
      
      if (hybridAvg > fastest.time * 3) {
        recommendations.push(
          'Hybrid encryption has significant overhead. ' +
          'Consider using pure quantum-resistant algorithms for performance-critical paths.'
        );
      }
    }

    return { fastest, slowest, recommendations };
  }

  /**
   * Generate performance report
   */
  generateReport(metrics: Map<string, PerformanceMetrics[]>): string {
    let report = '# Quantum-Resistant Cryptography Performance Report\n\n';
    
    report += '## Executive Summary\n';
    const comparison = this.compareAlgorithms(metrics);
    report += `- Fastest Operation: ${comparison.fastest.algorithm} ${comparison.fastest.operation} (${comparison.fastest.time.toFixed(2)}ms)\n`;
    report += `- Slowest Operation: ${comparison.slowest.algorithm} ${comparison.slowest.operation} (${comparison.slowest.time.toFixed(2)}ms)\n\n`;
    
    report += '## Detailed Metrics\n\n';
    
    for (const [algorithm, metricsList] of metrics) {
      report += `### ${algorithm}\n\n`;
      report += '| Operation | Avg Time (ms) | Min (ms) | Max (ms) | Std Dev | Throughput (ops/s) |\n';
      report += '|-----------|---------------|----------|----------|---------|-------------------|\n';
      
      for (const metric of metricsList) {
        report += `| ${metric.operation} | ${metric.averageTime.toFixed(2)} | `;
        report += `${metric.minTime.toFixed(2)} | ${metric.maxTime.toFixed(2)} | `;
        report += `${metric.standardDeviation.toFixed(2)} | ${metric.throughput.toFixed(0)} |\n`;
      }
      
      report += '\n';
    }
    
    report += '## Recommendations\n\n';
    for (const recommendation of comparison.recommendations) {
      report += `- ${recommendation}\n`;
    }
    
    report += '\n## System Information\n';
    report += `- CPUs: ${os.cpus().length} x ${os.cpus()[0].model}\n`;
    report += `- Total Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB\n`;
    report += `- Platform: ${os.platform()} ${os.arch()}\n`;
    
    return report;
  }

  /**
   * Calculate metrics from timing data
   */
  private calculateMetrics(
    algorithm: string,
    operation: string,
    times: number[]
  ): PerformanceMetrics {
    const sorted = times.sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    
    // Calculate standard deviation
    const squaredDiffs = times.map(time => Math.pow(time - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / times.length;
    const stdDev = Math.sqrt(avgSquaredDiff);
    
    return {
      algorithm,
      operation,
      averageTime: avg,
      minTime: sorted[0],
      maxTime: sorted[sorted.length - 1],
      standardDeviation: stdDev,
      throughput: 1000 / avg // operations per second
    };
  }

  /**
   * Calculate average time across all operations
   */
  private calculateAverageTime(metrics: PerformanceMetrics[]): number {
    const sum = metrics.reduce((total, metric) => total + metric.averageTime, 0);
    return sum / metrics.length;
  }

  /**
   * Initialize worker pool for parallel processing
   */
  private initializeWorkerPool(): void {
    const numWorkers = Math.min(4, os.cpus().length);
    
    // In a real implementation, create actual worker threads
    // This is a placeholder for the concept
    this.emit('workers:initialized', numWorkers);
  }

  /**
   * Start cache cleanup interval
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      this.optimizeMemory();
    }, 60000); // Every minute
  }

  /**
   * Evict entries from cache based on algorithm
   */
  private evictFromCache(): void {
    if (this.cacheConfig.algorithm === 'FIFO') {
      // Remove first entry
      const firstKey = this.keyCache.keys().next().value;
      if (firstKey) {
        this.keyCache.delete(firstKey);
      }
    } else if (this.cacheConfig.algorithm === 'LRU') {
      // In real implementation, track access times
      // For now, just remove oldest
      const firstKey = this.keyCache.keys().next().value;
      if (firstKey) {
        this.keyCache.delete(firstKey);
      }
    }
    // LFU would require tracking access frequency
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.keyCache.clear();
    this.precomputedValues.clear();
    this.removeAllListeners();
  }
}