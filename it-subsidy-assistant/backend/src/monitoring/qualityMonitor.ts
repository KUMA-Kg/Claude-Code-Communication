/**
 * 自動品質監視システム
 * リアルタイム品質メトリクス収集・分析・アラート
 */

import { Request, Response } from 'express';
import { performance } from 'perf_hooks';
import os from 'os';
import { logger } from '@/utils/logger';
import { getEnv } from '@/config/environment';

interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: Date;
  endpoint: string;
  method: string;
  statusCode: number;
  userAgent?: string;
  errorDetails?: string;
}

interface QualityThresholds {
  responseTime: {
    warning: number; // ms
    critical: number; // ms
  };
  memoryUsage: {
    warning: number; // bytes
    critical: number; // bytes
  };
  errorRate: {
    warning: number; // percentage
    critical: number; // percentage
  };
  cpuUsage: {
    warning: number; // percentage
    critical: number; // percentage
  };
}

interface QualityAlert {
  id: string;
  type: 'PERFORMANCE' | 'MEMORY' | 'ERROR_RATE' | 'CPU' | 'AVAILABILITY';
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  metrics: any;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

interface SystemHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'DOWN';
  score: number; // 0-100
  metrics: {
    avgResponseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
  };
  activeAlerts: QualityAlert[];
  recommendations: string[];
}

class QualityMonitor {
  private metrics: PerformanceMetrics[] = [];
  private alerts: QualityAlert[] = [];
  private env = getEnv();
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;

  // 品質閾値設定
  private thresholds: QualityThresholds = {
    responseTime: {
      warning: 1000,   // 1秒
      critical: 3000   // 3秒
    },
    memoryUsage: {
      warning: 500 * 1024 * 1024,    // 500MB
      critical: 1024 * 1024 * 1024   // 1GB
    },
    errorRate: {
      warning: 5,      // 5%
      critical: 10     // 10%
    },
    cpuUsage: {
      warning: 70,     // 70%
      critical: 90     // 90%
    }
  };

  // パフォーマンス監視ミドルウェア
  performanceMiddleware = (req: Request, res: Response, next: Function): void => {
    const startTime = performance.now();
    const startCpu = process.cpuUsage();

    // レスポンス完了時の処理
    res.on('finish', () => {
      const endTime = performance.now();
      const endCpu = process.cpuUsage(startCpu);
      const responseTime = endTime - startTime;

      const metrics: PerformanceMetrics = {
        responseTime,
        memoryUsage: process.memoryUsage(),
        cpuUsage: endCpu,
        timestamp: new Date(),
        endpoint: req.route?.path || req.path,
        method: req.method,
        statusCode: res.statusCode,
        userAgent: req.headers['user-agent']
      };

      // エラーの場合は詳細を記録
      if (res.statusCode >= 400) {
        this.errorCount++;
        metrics.errorDetails = `${res.statusCode} - ${res.statusMessage}`;
      }

      this.requestCount++;
      this.recordMetrics(metrics);
      this.checkThresholds(metrics);
    });

    next();
  };

  // メトリクス記録
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);

    // 古いメトリクスを削除（過去1時間分のみ保持）
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);

    // 詳細ログ記録
    logger.info('Performance metrics recorded', {
      endpoint: metrics.endpoint,
      method: metrics.method,
      responseTime: metrics.responseTime,
      statusCode: metrics.statusCode,
      memoryUsage: metrics.memoryUsage.heapUsed,
      timestamp: metrics.timestamp.toISOString()
    });
  }

  // 閾値チェックとアラート生成
  private checkThresholds(metrics: PerformanceMetrics): void {
    // レスポンス時間チェック
    if (metrics.responseTime > this.thresholds.responseTime.critical) {
      this.createAlert('PERFORMANCE', 'CRITICAL', 
        `Critical response time: ${metrics.responseTime.toFixed(2)}ms for ${metrics.endpoint}`,
        { responseTime: metrics.responseTime, endpoint: metrics.endpoint }
      );
    } else if (metrics.responseTime > this.thresholds.responseTime.warning) {
      this.createAlert('PERFORMANCE', 'WARNING',
        `Slow response time: ${metrics.responseTime.toFixed(2)}ms for ${metrics.endpoint}`,
        { responseTime: metrics.responseTime, endpoint: metrics.endpoint }
      );
    }

    // メモリ使用量チェック
    if (metrics.memoryUsage.heapUsed > this.thresholds.memoryUsage.critical) {
      this.createAlert('MEMORY', 'CRITICAL',
        `Critical memory usage: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        { memoryUsage: metrics.memoryUsage }
      );
    } else if (metrics.memoryUsage.heapUsed > this.thresholds.memoryUsage.warning) {
      this.createAlert('MEMORY', 'WARNING',
        `High memory usage: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        { memoryUsage: metrics.memoryUsage }
      );
    }

    // エラー率チェック
    const errorRate = (this.errorCount / this.requestCount) * 100;
    if (errorRate > this.thresholds.errorRate.critical) {
      this.createAlert('ERROR_RATE', 'CRITICAL',
        `Critical error rate: ${errorRate.toFixed(2)}%`,
        { errorRate, errorCount: this.errorCount, requestCount: this.requestCount }
      );
    } else if (errorRate > this.thresholds.errorRate.warning) {
      this.createAlert('ERROR_RATE', 'WARNING',
        `High error rate: ${errorRate.toFixed(2)}%`,
        { errorRate, errorCount: this.errorCount, requestCount: this.requestCount }
      );
    }
  }

  // アラート作成
  private createAlert(
    type: QualityAlert['type'], 
    severity: QualityAlert['severity'], 
    message: string, 
    metrics: any
  ): void {
    const alert: QualityAlert = {
      id: `${type}_${severity}_${Date.now()}`,
      type,
      severity,
      message,
      metrics,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);

    // ログ記録
    logger.warn('Quality alert created', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      metrics: alert.metrics
    });

    // クリティカルアラートの場合は即座に通知
    if (severity === 'CRITICAL') {
      this.triggerEmergencyNotification(alert);
    }

    // アラート履歴管理（過去24時間分のみ保持）
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => a.timestamp.getTime() > twentyFourHoursAgo);
  }

  // 緊急通知
  private triggerEmergencyNotification(alert: QualityAlert): void {
    logger.error('CRITICAL QUALITY ALERT', {
      alert,
      systemInfo: this.getSystemInfo()
    });

    // 実際の実装では、ここでSlack/Teams/PagerDuty等に通知
    // SMS/電話による緊急連絡も可能
  }

  // システム情報取得
  private getSystemInfo(): any {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      loadAverage: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      cpuInfo: os.cpus()[0]?.model || 'Unknown'
    };
  }

  // システムヘルス評価
  getSystemHealth(): SystemHealth {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);

    if (recentMetrics.length === 0) {
      return {
        status: 'DOWN',
        score: 0,
        metrics: {
          avgResponseTime: 0,
          errorRate: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          uptime: process.uptime()
        },
        activeAlerts: this.getActiveAlerts(),
        recommendations: ['システムが応答していません']
      };
    }

    // メトリクス計算
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const errorRate = (this.errorCount / this.requestCount) * 100;
    const latestMemoryUsage = (recentMetrics[recentMetrics.length - 1]?.memoryUsage.heapUsed || 0) / 1024 / 1024;
    const avgCpuUsage = this.calculateCpuUsagePercentage();

    // スコア計算（0-100）
    let score = 100;
    
    // レスポンス時間による減点
    if (avgResponseTime > this.thresholds.responseTime.critical) score -= 30;
    else if (avgResponseTime > this.thresholds.responseTime.warning) score -= 15;

    // エラー率による減点
    if (errorRate > this.thresholds.errorRate.critical) score -= 25;
    else if (errorRate > this.thresholds.errorRate.warning) score -= 10;

    // メモリ使用量による減点
    if (latestMemoryUsage > this.thresholds.memoryUsage.critical / 1024 / 1024) score -= 20;
    else if (latestMemoryUsage > this.thresholds.memoryUsage.warning / 1024 / 1024) score -= 10;

    // CPU使用量による減点
    if (avgCpuUsage > this.thresholds.cpuUsage.critical) score -= 15;
    else if (avgCpuUsage > this.thresholds.cpuUsage.warning) score -= 5;

    // ステータス決定
    let status: SystemHealth['status'];
    if (score >= 80) status = 'HEALTHY';
    else if (score >= 60) status = 'WARNING';
    else if (score >= 30) status = 'CRITICAL';
    else status = 'DOWN';

    return {
      status,
      score: Math.max(0, score),
      metrics: {
        avgResponseTime,
        errorRate,
        memoryUsage: latestMemoryUsage,
        cpuUsage: avgCpuUsage,
        uptime: process.uptime()
      },
      activeAlerts: this.getActiveAlerts(),
      recommendations: this.generateRecommendations(status, {
        avgResponseTime,
        errorRate,
        memoryUsage: latestMemoryUsage,
        cpuUsage: avgCpuUsage
      })
    };
  }

  // アクティブアラート取得
  private getActiveAlerts(): QualityAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  // CPU使用率計算
  private calculateCpuUsagePercentage(): number {
    const usage = process.cpuUsage();
    const total = usage.user + usage.system;
    return (total / 1000000) / process.uptime() * 100; // マイクロ秒を秒に変換し、アップタイムで割る
  }

  // 推奨事項生成
  private generateRecommendations(status: SystemHealth['status'], metrics: any): string[] {
    const recommendations: string[] = [];

    if (status === 'CRITICAL' || status === 'DOWN') {
      recommendations.push('緊急: システムの即座の調査が必要です');
    }

    if (metrics.avgResponseTime > this.thresholds.responseTime.warning) {
      recommendations.push('レスポンス時間の最適化を検討してください');
      recommendations.push('データベースクエリの最適化');
      recommendations.push('キャッシュ戦略の見直し');
    }

    if (metrics.errorRate > this.thresholds.errorRate.warning) {
      recommendations.push('エラー率が高いです。ログを確認してください');
      recommendations.push('入力バリデーションの強化');
    }

    if (metrics.memoryUsage > this.thresholds.memoryUsage.warning / 1024 / 1024) {
      recommendations.push('メモリ使用量の最適化が必要です');
      recommendations.push('メモリリークの調査');
      recommendations.push('ガベージコレクションの最適化');
    }

    if (metrics.cpuUsage > this.thresholds.cpuUsage.warning) {
      recommendations.push('CPU使用率が高いです');
      recommendations.push('処理の非同期化を検討');
      recommendations.push('スケールアウトの検討');
    }

    return recommendations;
  }

  // エンドポイント別統計
  getEndpointStats(): any {
    const stats: Record<string, any> = {};
    
    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!stats[key]) {
        stats[key] = {
          count: 0,
          totalResponseTime: 0,
          errors: 0,
          avgResponseTime: 0,
          errorRate: 0
        };
      }
      
      stats[key].count++;
      stats[key].totalResponseTime += metric.responseTime;
      if (metric.statusCode >= 400) {
        stats[key].errors++;
      }
    });

    // 平均値とエラー率を計算
    Object.keys(stats).forEach(key => {
      stats[key].avgResponseTime = stats[key].totalResponseTime / stats[key].count;
      stats[key].errorRate = (stats[key].errors / stats[key].count) * 100;
    });

    return stats;
  }

  // アラート解決
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      
      logger.info('Alert resolved', {
        alertId: alert.id,
        type: alert.type,
        resolvedAt: alert.resolvedAt
      });
      
      return true;
    }
    return false;
  }

  // 品質レポート生成
  generateQualityReport(): any {
    const health = this.getSystemHealth();
    const endpointStats = this.getEndpointStats();
    const systemInfo = this.getSystemInfo();

    return {
      timestamp: new Date().toISOString(),
      health,
      endpointStats,
      systemInfo,
      thresholds: this.thresholds,
      summary: {
        totalRequests: this.requestCount,
        totalErrors: this.errorCount,
        uptime: process.uptime(),
        alertCount: this.alerts.length,
        activeAlertCount: this.getActiveAlerts().length
      }
    };
  }

  // 閾値更新
  updateThresholds(newThresholds: Partial<QualityThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Quality thresholds updated', { thresholds: this.thresholds });
  }

  // メトリクスクリア
  clearMetrics(): void {
    this.metrics = [];
    this.alerts = [];
    this.requestCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
    logger.info('Quality metrics cleared');
  }
}

// シングルトンインスタンス
const qualityMonitor = new QualityMonitor();

export { QualityMonitor, qualityMonitor, PerformanceMetrics, QualityAlert, SystemHealth };