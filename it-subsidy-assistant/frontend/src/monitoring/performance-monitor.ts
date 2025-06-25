/**
 * パフォーマンス監視システム
 * 補助金選択システムのリアルタイムパフォーマンス監視
 */

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null;  // Largest Contentful Paint
  fid: number | null;  // First Input Delay
  cls: number | null;  // Cumulative Layout Shift
  fcp: number | null;  // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  
  // カスタムメトリクス
  subsidyLoadTime: number | null;
  formInteractionTime: number | null;
  apiResponseTime: Map<string, number[]>;
  memoryUsage: number | null;
  errorRate: number;
}

interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private observers: Map<string, PerformanceObserver> = new Map();
  private thresholds: PerformanceThresholds;
  private reportingEndpoint: string;
  private reportingInterval: number;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config?: {
    reportingEndpoint?: string;
    reportingInterval?: number;
  }) {
    this.reportingEndpoint = config?.reportingEndpoint || '/api/performance-metrics';
    this.reportingInterval = config?.reportingInterval || 30000; // 30秒ごと

    this.metrics = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      subsidyLoadTime: null,
      formInteractionTime: null,
      apiResponseTime: new Map(),
      memoryUsage: null,
      errorRate: 0
    };

    this.thresholds = {
      lcp: { good: 2500, needsImprovement: 4000 },
      fid: { good: 100, needsImprovement: 300 },
      cls: { good: 0.1, needsImprovement: 0.25 },
      fcp: { good: 1800, needsImprovement: 3000 },
      ttfb: { good: 800, needsImprovement: 1800 }
    };

    this.initialize();
  }

  /**
   * パフォーマンス監視の初期化
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Core Web Vitalsの監視
    this.observeWebVitals();
    
    // API呼び出しの監視
    this.interceptFetch();
    
    // メモリ使用量の監視
    this.monitorMemory();
    
    // エラー率の監視
    this.monitorErrors();
    
    // カスタムイベントの監視
    this.setupCustomMetrics();
    
    // 定期レポート送信
    this.startReporting();
  }

  /**
   * Core Web Vitalsの監視
   */
  private observeWebVitals(): void {
    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
      this.checkThreshold('lcp', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('lcp', lcpObserver);

    // FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.processingStart && entry.startTime) {
          this.metrics.fid = entry.processingStart - entry.startTime;
          this.checkThreshold('fid', this.metrics.fid);
        }
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    this.observers.set('fid', fidObserver);

    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.cls = clsValue;
      this.checkThreshold('cls', clsValue);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('cls', clsObserver);

    // FCP (First Contentful Paint)
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
          this.checkThreshold('fcp', entry.startTime);
        }
      });
    });
    fcpObserver.observe({ entryTypes: ['paint'] });
    this.observers.set('fcp', fcpObserver);

    // TTFB (Time to First Byte)
    const navigationObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.responseStart) {
          this.metrics.ttfb = entry.responseStart;
          this.checkThreshold('ttfb', entry.responseStart);
        }
      });
    });
    navigationObserver.observe({ entryTypes: ['navigation'] });
    this.observers.set('navigation', navigationObserver);
  }

  /**
   * Fetch APIのインターセプトでAPI呼び出しを監視
   */
  private interceptFetch(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] instanceof Request ? args[0].url : args[0].toString();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // APIレスポンスタイムを記録
        if (!this.metrics.apiResponseTime.has(url)) {
          this.metrics.apiResponseTime.set(url, []);
        }
        this.metrics.apiResponseTime.get(url)!.push(duration);
        
        // 遅いAPIの警告
        if (duration > 3000) {
          console.warn(`Slow API response: ${url} took ${duration}ms`);
          this.reportSlowAPI(url, duration);
        }
        
        return response;
      } catch (error) {
        // APIエラーを記録
        this.metrics.errorRate++;
        throw error;
      }
    };
  }

  /**
   * メモリ使用量の監視
   */
  private monitorMemory(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1048576; // MB単位
        
        // メモリリーク警告（500MB以上）
        if (this.metrics.memoryUsage > 500) {
          console.warn(`High memory usage: ${this.metrics.memoryUsage.toFixed(2)}MB`);
          this.reportMemoryIssue(this.metrics.memoryUsage);
        }
      }, 10000); // 10秒ごと
    }
  }

  /**
   * エラー率の監視
   */
  private monitorErrors(): void {
    window.addEventListener('error', () => {
      this.metrics.errorRate++;
    });

    window.addEventListener('unhandledrejection', () => {
      this.metrics.errorRate++;
    });
  }

  /**
   * カスタムメトリクスの設定
   */
  private setupCustomMetrics(): void {
    // 補助金選択画面の読み込み時間
    window.addEventListener('subsidy-selection-loaded', (event: any) => {
      this.metrics.subsidyLoadTime = event.detail.loadTime;
    });

    // フォーム操作時間
    window.addEventListener('form-interaction-complete', (event: any) => {
      this.metrics.formInteractionTime = event.detail.duration;
    });
  }

  /**
   * しきい値チェック
   */
  private checkThreshold(metric: keyof PerformanceThresholds, value: number): void {
    const threshold = this.thresholds[metric];
    let status: 'good' | 'needs-improvement' | 'poor';

    if (value <= threshold.good) {
      status = 'good';
    } else if (value <= threshold.needsImprovement) {
      status = 'needs-improvement';
    } else {
      status = 'poor';
    }

    // パフォーマンス低下の警告
    if (status === 'poor') {
      console.warn(`Performance warning: ${metric} is ${value} (threshold: ${threshold.needsImprovement})`);
      this.emitPerformanceWarning(metric, value, status);
    }
  }

  /**
   * パフォーマンスレポートの送信
   */
  private startReporting(): void {
    this.intervalId = setInterval(() => {
      this.sendReport();
    }, this.reportingInterval);
  }

  /**
   * レポート送信
   */
  private async sendReport(): Promise<void> {
    const report = this.generateReport();
    
    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.error('Failed to send performance report:', error);
    }
  }

  /**
   * レポート生成
   */
  public generateReport(): PerformanceReport {
    const avgApiTimes: Record<string, number> = {};
    this.metrics.apiResponseTime.forEach((times, url) => {
      avgApiTimes[url] = times.reduce((a, b) => a + b, 0) / times.length;
    });

    return {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: {
        ...this.metrics,
        apiResponseTime: avgApiTimes
      },
      score: this.calculatePerformanceScore()
    };
  }

  /**
   * パフォーマンススコアの計算
   */
  private calculatePerformanceScore(): number {
    let score = 100;
    
    // LCPスコア
    if (this.metrics.lcp !== null) {
      if (this.metrics.lcp > this.thresholds.lcp.needsImprovement) {
        score -= 25;
      } else if (this.metrics.lcp > this.thresholds.lcp.good) {
        score -= 10;
      }
    }
    
    // FIDスコア
    if (this.metrics.fid !== null) {
      if (this.metrics.fid > this.thresholds.fid.needsImprovement) {
        score -= 25;
      } else if (this.metrics.fid > this.thresholds.fid.good) {
        score -= 10;
      }
    }
    
    // CLSスコア
    if (this.metrics.cls !== null) {
      if (this.metrics.cls > this.thresholds.cls.needsImprovement) {
        score -= 25;
      } else if (this.metrics.cls > this.thresholds.cls.good) {
        score -= 10;
      }
    }
    
    // エラー率の影響
    if (this.metrics.errorRate > 10) {
      score -= 15;
    } else if (this.metrics.errorRate > 5) {
      score -= 5;
    }
    
    return Math.max(0, score);
  }

  /**
   * カスタムイベントの発行
   */
  private emitPerformanceWarning(metric: string, value: number, status: string): void {
    window.dispatchEvent(new CustomEvent('performance-warning', {
      detail: { metric, value, status }
    }));
  }

  private reportSlowAPI(url: string, duration: number): void {
    window.dispatchEvent(new CustomEvent('slow-api', {
      detail: { url, duration }
    }));
  }

  private reportMemoryIssue(usage: number): void {
    window.dispatchEvent(new CustomEvent('memory-issue', {
      detail: { usage }
    }));
  }

  /**
   * 手動メトリクス記録
   */
  public recordCustomMetric(name: string, value: number): void {
    window.dispatchEvent(new CustomEvent(`custom-metric-${name}`, {
      detail: { value }
    }));
  }

  /**
   * クリーンアップ
   */
  public destroy(): void {
    // オブザーバーの停止
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // レポート送信の停止
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// 型定義
export interface PerformanceReport {
  timestamp: number;
  url: string;
  userAgent: string;
  metrics: {
    lcp: number | null;
    fid: number | null;
    cls: number | null;
    fcp: number | null;
    ttfb: number | null;
    subsidyLoadTime: number | null;
    formInteractionTime: number | null;
    apiResponseTime: Record<string, number>;
    memoryUsage: number | null;
    errorRate: number;
  };
  score: number;
}

// シングルトンインスタンス
let performanceMonitor: PerformanceMonitor | null = null;

export function initializePerformanceMonitoring(config?: {
  reportingEndpoint?: string;
  reportingInterval?: number;
}): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor(config);
  }
  return performanceMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}

// デフォルトエクスポート
export default PerformanceMonitor;