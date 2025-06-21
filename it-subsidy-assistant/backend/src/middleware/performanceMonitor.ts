import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { logger } from '@/utils/logger';
import os from 'os';

/**
 * Performance monitoring middleware for tracking API performance
 */

// Performance metrics storage
interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: number;
  statusCode: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
}

// Circular buffer for storing recent metrics
class MetricsBuffer {
  private buffer: PerformanceMetrics[] = [];
  private maxSize: number = 1000;
  private currentIndex: number = 0;

  add(metric: PerformanceMetrics) {
    if (this.buffer.length < this.maxSize) {
      this.buffer.push(metric);
    } else {
      this.buffer[this.currentIndex] = metric;
      this.currentIndex = (this.currentIndex + 1) % this.maxSize;
    }
  }

  getAll(): PerformanceMetrics[] {
    return [...this.buffer];
  }

  getStats(endpoint?: string): any {
    let metrics = this.buffer;
    if (endpoint) {
      metrics = metrics.filter(m => m.endpoint === endpoint);
    }

    if (metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration);
    const sorted = durations.sort((a, b) => a - b);

    return {
      count: metrics.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
}

const metricsBuffer = new MetricsBuffer();

// Slow query tracking
const slowQueries: Map<string, number> = new Map();
const SLOW_QUERY_THRESHOLD = 1000; // 1 second

/**
 * Performance monitoring middleware
 */
export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  const start = performance.now();
  const startCpuUsage = process.cpuUsage();

  // Store original end function
  const originalEnd = res.end;
  const endpoint = `${req.method} ${req.route?.path || req.path}`;

  // Override end function to capture metrics
  res.end = function(...args: any[]) {
    // Restore original end function
    res.end = originalEnd;
    
    // Calculate metrics
    const duration = performance.now() - start;
    const endCpuUsage = process.cpuUsage(startCpuUsage);
    
    const metrics: PerformanceMetrics = {
      endpoint,
      method: req.method,
      duration,
      timestamp: Date.now(),
      statusCode: res.statusCode,
      memoryUsage: process.memoryUsage(),
      cpuUsage: endCpuUsage
    };

    // Add to buffer
    metricsBuffer.add(metrics);

    // Log slow requests
    if (duration > SLOW_QUERY_THRESHOLD) {
      slowQueries.set(endpoint, (slowQueries.get(endpoint) || 0) + 1);
      logger.warn('Slow request detected', {
        endpoint,
        duration: `${duration.toFixed(2)}ms`,
        threshold: `${SLOW_QUERY_THRESHOLD}ms`
      });
    }

    // Log performance metrics for monitoring
    logger.debug('Request performance', {
      endpoint,
      duration: `${duration.toFixed(2)}ms`,
      statusCode: res.statusCode,
      memoryUsed: `${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      cpuUser: `${(endCpuUsage.user / 1000).toFixed(2)}ms`,
      cpuSystem: `${(endCpuUsage.system / 1000).toFixed(2)}ms`
    });

    // Call original end function
    return originalEnd.apply(res, args);
  };

  next();
}

/**
 * Get performance metrics endpoint
 */
export function getPerformanceMetrics(req: Request, res: Response) {
  const endpoint = req.query.endpoint as string;
  const stats = metricsBuffer.getStats(endpoint);

  const systemMetrics = {
    uptime: process.uptime(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      process: process.memoryUsage()
    },
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0]?.model,
      usage: process.cpuUsage()
    },
    load: os.loadavg()
  };

  res.json({
    endpoint: endpoint || 'all',
    stats,
    slowQueries: Object.fromEntries(slowQueries),
    system: systemMetrics,
    timestamp: new Date().toISOString()
  });
}

/**
 * Database query performance tracking
 */
export function trackDatabaseQuery(queryName: string, duration: number) {
  if (duration > 100) { // Log queries taking more than 100ms
    logger.warn('Slow database query', {
      query: queryName,
      duration: `${duration.toFixed(2)}ms`
    });
  }
}

/**
 * Cache performance tracking
 */
class CacheMetrics {
  private hits: number = 0;
  private misses: number = 0;
  private sets: number = 0;
  private deletes: number = 0;

  recordHit() { this.hits++; }
  recordMiss() { this.misses++; }
  recordSet() { this.sets++; }
  recordDelete() { this.deletes++; }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      deletes: this.deletes,
      hitRate: total > 0 ? (this.hits / total) : 0,
      total
    };
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
    this.sets = 0;
    this.deletes = 0;
  }
}

export const cacheMetrics = new CacheMetrics();

/**
 * Response compression middleware configuration
 */
export const compressionOptions = {
  filter: (req: Request, res: Response) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Compress everything else
    return true;
  },
  level: 6, // Balanced compression level
  threshold: 1024 // Only compress responses larger than 1KB
};

/**
 * Memory leak detection
 */
let lastMemoryUsage = process.memoryUsage().heapUsed;
let memoryIncreaseCount = 0;
const MEMORY_LEAK_THRESHOLD = 100 * 1024 * 1024; // 100MB
const MEMORY_LEAK_COUNT_THRESHOLD = 10;

export function checkMemoryLeak() {
  const currentMemoryUsage = process.memoryUsage().heapUsed;
  const increase = currentMemoryUsage - lastMemoryUsage;

  if (increase > MEMORY_LEAK_THRESHOLD) {
    memoryIncreaseCount++;
    
    if (memoryIncreaseCount >= MEMORY_LEAK_COUNT_THRESHOLD) {
      logger.error('Potential memory leak detected', {
        currentUsage: `${(currentMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
        increase: `${(increase / 1024 / 1024).toFixed(2)}MB`,
        consecutiveIncreases: memoryIncreaseCount
      });
      
      // Reset counter after logging
      memoryIncreaseCount = 0;
    }
  } else {
    // Reset counter if memory usage decreased or increased slightly
    memoryIncreaseCount = 0;
  }

  lastMemoryUsage = currentMemoryUsage;
}

// Check for memory leaks every 5 minutes
setInterval(checkMemoryLeak, 5 * 60 * 1000);

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(server: any) {
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`${signal} received, starting graceful shutdown`);

    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Give ongoing requests 30 seconds to complete
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);

    // Log final metrics
    const finalStats = metricsBuffer.getStats();
    logger.info('Final performance metrics', finalStats);

    // Clean up resources
    // Add any cleanup code here (close DB connections, etc.)

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Health check endpoint with detailed metrics
 */
export function detailedHealthCheck(req: Request, res: Response) {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    performance: metricsBuffer.getStats(),
    cache: cacheMetrics.getStats(),
    checks: {
      database: 'ok', // Add actual DB check
      cache: 'ok',     // Add actual cache check
      external: 'ok'   // Add external service checks
    }
  };

  res.json(healthStatus);
}