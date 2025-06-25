import { EventEmitter } from 'events';
import * as os from 'os';
import { performance } from 'perf_hooks';

interface HealthMetrics {
  timestamp: Date;
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    percentage: number;
  };
  responseTime: {
    average: number;
    p95: number;
    p99: number;
  };
  errors: {
    count: number;
    rate: number;
  };
  dependencies: {
    database: boolean;
    redis?: boolean;
    external_apis: Map<string, boolean>;
  };
}

interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  critical: boolean;
  timeout: number;
}

export class HealthMonitor extends EventEmitter {
  private metrics: HealthMetrics[] = [];
  private healthChecks: HealthCheck[] = [];
  private checkInterval: NodeJS.Timer | null = null;
  private responseTimes: number[] = [];
  private errorCount = 0;
  private startTime = Date.now();
  private readonly MAX_METRICS_HISTORY = 1000;
  private readonly CHECK_INTERVAL = 30000; // 30秒

  constructor(private serviceName: string = 'it-subsidy-backend') {
    super();
    this.initializeHealthChecks();
  }

  /**
   * ヘルスチェックの初期化
   */
  private initializeHealthChecks(): void {
    // データベース接続チェック
    this.addHealthCheck({
      name: 'database',
      check: async () => {
        try {
          // TODO: 実際のデータベース接続チェック
          const start = performance.now();
          // await db.query('SELECT 1');
          const duration = performance.now() - start;
          return duration < 1000; // 1秒以内
        } catch {
          return false;
        }
      },
      critical: true,
      timeout: 5000
    });

    // 外部API接続チェック
    this.addHealthCheck({
      name: 'openai-api',
      check: async () => {
        try {
          // OpenAI APIのヘルスチェック
          return true; // 実際の実装では接続確認
        } catch {
          return false;
        }
      },
      critical: false,
      timeout: 3000
    });

    // ディスクスペースチェック
    this.addHealthCheck({
      name: 'disk-space',
      check: async () => {
        const freeMemory = os.freemem();
        const totalMemory = os.totalmem();
        return (freeMemory / totalMemory) > 0.1; // 10%以上の空き
      },
      critical: true,
      timeout: 1000
    });
  }

  /**
   * ヘルスチェックを追加
   */
  addHealthCheck(check: HealthCheck): void {
    this.healthChecks.push(check);
  }

  /**
   * 監視を開始
   */
  start(): void {
    if (this.checkInterval) {
      return;
    }

    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.CHECK_INTERVAL);

    // 初回チェック
    this.performHealthCheck();

    this.emit('monitoring-started', { service: this.serviceName });
  }

  /**
   * 監視を停止
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.emit('monitoring-stopped', { service: this.serviceName });
    }
  }

  /**
   * レスポンスタイムを記録
   */
  recordResponseTime(duration: number): void {
    this.responseTimes.push(duration);
    
    // 最新1000件のみ保持
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  /**
   * エラーを記録
   */
  recordError(): void {
    this.errorCount++;
    this.emit('error-recorded', { count: this.errorCount });
  }

  /**
   * ヘルスチェックを実行
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = performance.now();
    const results = new Map<string, boolean>();
    
    // 並列でヘルスチェックを実行
    const checkPromises = this.healthChecks.map(async (check) => {
      try {
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), check.timeout);
        });
        
        const result = await Promise.race([check.check(), timeoutPromise]);
        results.set(check.name, result);
        return { name: check.name, result, critical: check.critical };
      } catch (error) {
        results.set(check.name, false);
        return { name: check.name, result: false, critical: check.critical };
      }
    });

    const checkResults = await Promise.all(checkPromises);
    const duration = performance.now() - startTime;

    // 全体のステータスを判定
    const criticalFailures = checkResults.filter(r => r.critical && !r.result);
    const nonCriticalFailures = checkResults.filter(r => !r.critical && !r.result);
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (criticalFailures.length > 0) {
      status = 'unhealthy';
    } else if (nonCriticalFailures.length > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    // メトリクスを作成
    const metrics: HealthMetrics = {
      timestamp: new Date(),
      service: this.serviceName,
      status,
      uptime: Date.now() - this.startTime,
      cpu: {
        usage: this.getCPUUsage(),
        loadAverage: os.loadavg()
      },
      memory: this.getMemoryUsage(),
      responseTime: this.getResponseTimeStats(),
      errors: {
        count: this.errorCount,
        rate: this.getErrorRate()
      },
      dependencies: {
        database: results.get('database') || false,
        external_apis: new Map([
          ['openai', results.get('openai-api') || false]
        ])
      }
    };

    // メトリクスを保存
    this.metrics.push(metrics);
    if (this.metrics.length > this.MAX_METRICS_HISTORY) {
      this.metrics.shift();
    }

    // イベントを発火
    this.emit('health-check-completed', metrics);

    // ステータス変更時にアラート
    const previousMetric = this.metrics[this.metrics.length - 2];
    if (previousMetric && previousMetric.status !== status) {
      this.emit('status-changed', {
        from: previousMetric.status,
        to: status,
        metrics
      });
    }

    // 閾値チェック
    this.checkThresholds(metrics);
  }

  /**
   * CPU使用率を取得
   */
  private getCPUUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    return 100 - Math.floor(totalIdle / totalTick * 100);
  }

  /**
   * メモリ使用状況を取得
   */
  private getMemoryUsage(): { total: number; used: number; percentage: number } {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percentage = Math.round((used / total) * 100);

    return { total, used, percentage };
  }

  /**
   * レスポンスタイム統計を取得
   */
  private getResponseTimeStats(): { average: number; p95: number; p99: number } {
    if (this.responseTimes.length === 0) {
      return { average: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const average = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      average: Math.round(average),
      p95: sorted[p95Index] || 0,
      p99: sorted[p99Index] || 0
    };
  }

  /**
   * エラー率を計算
   */
  private getErrorRate(): number {
    const recentMetrics = this.metrics.slice(-10); // 直近10回
    if (recentMetrics.length === 0) return 0;

    const totalRequests = this.responseTimes.length;
    if (totalRequests === 0) return 0;

    return (this.errorCount / totalRequests) * 100;
  }

  /**
   * 閾値チェック
   */
  private checkThresholds(metrics: HealthMetrics): void {
    // CPU使用率チェック
    if (metrics.cpu.usage > 80) {
      this.emit('threshold-exceeded', {
        type: 'cpu',
        value: metrics.cpu.usage,
        threshold: 80
      });
    }

    // メモリ使用率チェック
    if (metrics.memory.percentage > 85) {
      this.emit('threshold-exceeded', {
        type: 'memory',
        value: metrics.memory.percentage,
        threshold: 85
      });
    }

    // レスポンスタイムチェック
    if (metrics.responseTime.p95 > 1000) {
      this.emit('threshold-exceeded', {
        type: 'response-time',
        value: metrics.responseTime.p95,
        threshold: 1000
      });
    }

    // エラー率チェック
    if (metrics.errors.rate > 5) {
      this.emit('threshold-exceeded', {
        type: 'error-rate',
        value: metrics.errors.rate,
        threshold: 5
      });
    }
  }

  /**
   * 現在のヘルス状態を取得
   */
  getCurrentHealth(): HealthMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  /**
   * ヘルス履歴を取得
   */
  getHealthHistory(limit: number = 100): HealthMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * サマリー情報を取得
   */
  getSummary(): {
    status: string;
    uptime: string;
    avgResponseTime: number;
    errorRate: number;
    lastCheck: Date | null;
  } {
    const current = this.getCurrentHealth();
    const uptimeSeconds = current ? Math.floor(current.uptime / 1000) : 0;
    const uptimeHours = Math.floor(uptimeSeconds / 3600);
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

    return {
      status: current?.status || 'unknown',
      uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      avgResponseTime: current?.responseTime.average || 0,
      errorRate: current?.errors.rate || 0,
      lastCheck: current?.timestamp || null
    };
  }
}

// シングルトンインスタンス
export const healthMonitor = new HealthMonitor();

// Express ミドルウェア
export function healthCheckMiddleware() {
  return async (req: any, res: any, next: any) => {
    const start = performance.now();
    
    // レスポンスの送信時に計測
    const originalSend = res.send;
    res.send = function(data: any) {
      const duration = performance.now() - start;
      healthMonitor.recordResponseTime(duration);
      
      // エラーレスポンスの記録
      if (res.statusCode >= 400) {
        healthMonitor.recordError();
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}