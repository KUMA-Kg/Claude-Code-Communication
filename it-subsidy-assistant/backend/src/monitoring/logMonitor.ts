/**
 * ログ監視・アラートシステム
 * 構造化ログ、リアルタイム分析、自動アラート機能
 */

import winston from 'winston';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';
import { getEnv } from '@/config/environment';

interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  meta: any;
  source: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  duration?: number;
  error?: Error;
}

interface AlertRule {
  id: string;
  name: string;
  condition: (logs: LogEntry[]) => boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  throttleMinutes: number;
  enabled: boolean;
  description: string;
}

interface Alert {
  id: string;
  ruleId: string;
  severity: string;
  message: string;
  triggeredLogs: LogEntry[];
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

interface LogMetrics {
  totalLogs: number;
  logsByLevel: Record<string, number>;
  logsBySource: Record<string, number>;
  errorsLastHour: number;
  averageResponseTime: number;
  uniqueUsers: number;
  topErrors: Array<{ message: string; count: number }>;
  alertsCount: number;
}

class LogMonitor extends EventEmitter {
  private logs: LogEntry[] = [];
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private lastAlertTimes = new Map<string, Date>();
  private env = getEnv();
  private logger: winston.Logger;
  private metricsCache: { data: LogMetrics; timestamp: number } | null = null;

  constructor() {
    super();
    this.initializeLogger();
    this.setupDefaultAlertRules();
    this.startLogCleanup();
  }

  private initializeLogger(): void {
    // カスタムフォーマット
    const customFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.metadata(),
      winston.format.json(),
      winston.format.printf(info => {
        const { timestamp, level, message, metadata, ...rest } = info;
        return JSON.stringify({
          timestamp,
          level,
          message,
          ...rest,
          metadata
        });
      })
    );

    this.logger = winston.createLogger({
      level: this.env.LOG_LEVEL || 'info',
      format: customFormat,
      defaultMeta: {
        service: 'it-subsidy-assistant',
        environment: this.env.NODE_ENV
      },
      transports: [
        // コンソール出力
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        
        // ファイル出力（全レベル）
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'application.log'),
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 10,
          tailable: true
        }),
        
        // エラーログ専用
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'error.log'),
          level: 'error',
          maxsize: 20 * 1024 * 1024, // 20MB
          maxFiles: 5
        }),
        
        // セキュリティログ専用
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'security.log'),
          level: 'warn',
          maxsize: 20 * 1024 * 1024, // 20MB
          maxFiles: 5,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      ],
      
      // 未処理例外・拒否をキャッチ
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
          maxsize: 10 * 1024 * 1024,
          maxFiles: 3
        })
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'rejections.log'),
          maxsize: 10 * 1024 * 1024,
          maxFiles: 3
        })
      ]
    });
  }

  // ログ記録
  log(level: string, message: string, meta: any = {}, context: any = {}): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      meta,
      source: context.source || 'unknown',
      userId: context.userId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      duration: context.duration,
      error: context.error
    };

    // ログをメモリに保存（最新のN件のみ）
    this.logs.push(logEntry);
    if (this.logs.length > 10000) {
      this.logs.shift(); // 古いログを削除
    }

    // Winstonでログ出力
    this.logger.log(level, message, {
      meta,
      context,
      correlationId: this.generateCorrelationId()
    });

    // アラートルールをチェック
    this.checkAlertRules();

    // メトリクスキャッシュをクリア
    this.metricsCache = null;

    // イベント発行
    this.emit('logEntry', logEntry);
  }

  // ショートカットメソッド
  info(message: string, meta?: any, context?: any): void {
    this.log('info', message, meta, context);
  }

  warn(message: string, meta?: any, context?: any): void {
    this.log('warn', message, meta, context);
  }

  error(message: string, meta?: any, context?: any): void {
    this.log('error', message, meta, context);
  }

  debug(message: string, meta?: any, context?: any): void {
    this.log('debug', message, meta, context);
  }

  // セキュリティイベント専用ログ
  security(event: string, details: any, context: any = {}): void {
    this.log('warn', `SECURITY_EVENT: ${event}`, {
      securityEvent: event,
      details,
      severity: details.severity || 'MEDIUM'
    }, {
      ...context,
      source: 'security'
    });
  }

  // 監査ログ
  audit(action: string, resource: string, user: any, details: any = {}): void {
    this.log('info', `AUDIT: ${action} on ${resource}`, {
      auditAction: action,
      resource,
      user: {
        id: user.id,
        role: user.role,
        email: user.email
      },
      details
    }, {
      userId: user.id,
      source: 'audit'
    });
  }

  // パフォーマンスログ
  performance(operation: string, duration: number, details: any = {}): void {
    const severity = duration > 5000 ? 'SLOW' : duration > 1000 ? 'MODERATE' : 'FAST';
    
    this.log('info', `PERFORMANCE: ${operation} took ${duration}ms`, {
      operation,
      duration,
      severity,
      details
    }, {
      duration,
      source: 'performance'
    });
  }

  // デフォルトアラートルール設定
  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'error-rate-high',
        name: 'High Error Rate',
        condition: (logs) => {
          const lastHour = this.getLogsLastHour(logs);
          const errors = lastHour.filter(log => log.level === 'error').length;
          const total = lastHour.length;
          return total > 10 && (errors / total) > 0.1; // 10%以上のエラー率
        },
        severity: 'HIGH',
        throttleMinutes: 30,
        enabled: true,
        description: 'Error rate exceeds 10% in the last hour'
      },
      {
        id: 'security-events-spike',
        name: 'Security Events Spike',
        condition: (logs) => {
          const lastHour = this.getLogsLastHour(logs);
          const securityEvents = lastHour.filter(log => 
            log.source === 'security' || log.message.includes('SECURITY_EVENT')
          ).length;
          return securityEvents > 20; // 1時間に20件以上のセキュリティイベント
        },
        severity: 'CRITICAL',
        throttleMinutes: 15,
        enabled: true,
        description: 'More than 20 security events in the last hour'
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        condition: (logs) => {
          const lastHour = this.getLogsLastHour(logs);
          const slowRequests = lastHour.filter(log => 
            log.duration && log.duration > 5000
          ).length;
          return slowRequests > 10; // 1時間に10件以上の遅いリクエスト
        },
        severity: 'MEDIUM',
        throttleMinutes: 60,
        enabled: true,
        description: 'More than 10 slow requests (>5s) in the last hour'
      },
      {
        id: 'authentication-failures',
        name: 'Authentication Failures',
        condition: (logs) => {
          const lastHour = this.getLogsLastHour(logs);
          const authFailures = lastHour.filter(log => 
            log.message.includes('Authentication failed') ||
            log.message.includes('Login failed') ||
            log.message.includes('UNAUTHORIZED')
          ).length;
          return authFailures > 50; // 1時間に50件以上の認証失敗
        },
        severity: 'HIGH',
        throttleMinutes: 20,
        enabled: true,
        description: 'More than 50 authentication failures in the last hour'
      },
      {
        id: 'database-errors',
        name: 'Database Errors',
        condition: (logs) => {
          const lastHour = this.getLogsLastHour(logs);
          const dbErrors = lastHour.filter(log => 
            log.message.includes('database') ||
            log.message.includes('SQL') ||
            log.message.includes('connection')
          ).length;
          return dbErrors > 5; // 1時間に5件以上のDB関連エラー
        },
        severity: 'HIGH',
        throttleMinutes: 30,
        enabled: true,
        description: 'More than 5 database errors in the last hour'
      },
      {
        id: 'memory-usage-high',
        name: 'High Memory Usage',
        condition: (logs) => {
          const lastHour = this.getLogsLastHour(logs);
          const memoryWarnings = lastHour.filter(log => 
            log.message.includes('memory') && log.level === 'warn'
          ).length;
          return memoryWarnings > 3; // 1時間に3件以上のメモリ警告
        },
        severity: 'MEDIUM',
        throttleMinutes: 45,
        enabled: true,
        description: 'Multiple memory usage warnings in the last hour'
      }
    ];
  }

  // アラートルールチェック
  private checkAlertRules(): void {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // スロットリングチェック
      const lastAlertTime = this.lastAlertTimes.get(rule.id);
      if (lastAlertTime) {
        const timeSinceLastAlert = Date.now() - lastAlertTime.getTime();
        if (timeSinceLastAlert < rule.throttleMinutes * 60 * 1000) {
          continue; // まだスロットリング期間中
        }
      }

      // 条件チェック
      if (rule.condition(this.logs)) {
        this.triggerAlert(rule);
      }
    }
  }

  // アラート発火
  private triggerAlert(rule: AlertRule): void {
    const alert: Alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      severity: rule.severity,
      message: `Alert: ${rule.name} - ${rule.description}`,
      triggeredLogs: this.getRelevantLogs(rule),
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.push(alert);
    this.lastAlertTimes.set(rule.id, new Date());

    // イベント発行
    this.emit('alert', alert);

    // ログ出力
    this.logger.error('ALERT_TRIGGERED', {
      alertId: alert.id,
      rule: rule.name,
      severity: rule.severity,
      description: rule.description
    });

    // 外部通知（実装例）
    this.sendExternalNotification(alert);
  }

  // 関連ログ取得
  private getRelevantLogs(rule: AlertRule): LogEntry[] {
    const lastHour = this.getLogsLastHour(this.logs);
    return lastHour.slice(-20); // 最新20件
  }

  // 外部通知送信
  private async sendExternalNotification(alert: Alert): Promise<void> {
    try {
      // Slack通知の例
      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackNotification(alert);
      }

      // メール通知の例
      if (process.env.EMAIL_ALERT_ENABLED === 'true') {
        await this.sendEmailNotification(alert);
      }

      // PagerDuty統合の例
      if (alert.severity === 'CRITICAL' && process.env.PAGERDUTY_API_KEY) {
        await this.sendPagerDutyAlert(alert);
      }
    } catch (error) {
      this.logger.error('Failed to send external notification', {
        alertId: alert.id,
        error: error.message
      });
    }
  }

  private async sendSlackNotification(alert: Alert): Promise<void> {
    // Slack webhook実装
    const payload = {
      text: `🚨 ${alert.severity} Alert: ${alert.message}`,
      attachments: [
        {
          color: this.getSlackColor(alert.severity),
          fields: [
            {
              title: 'Alert ID',
              value: alert.id,
              short: true
            },
            {
              title: 'Timestamp',
              value: alert.timestamp.toISOString(),
              short: true
            }
          ]
        }
      ]
    };

    // 実際の実装では、fetch等でSlack webhookに送信
    this.logger.info('Slack notification would be sent', { payload });
  }

  private async sendEmailNotification(alert: Alert): Promise<void> {
    // Email通知実装
    this.logger.info('Email notification would be sent', {
      alertId: alert.id,
      severity: alert.severity
    });
  }

  private async sendPagerDutyAlert(alert: Alert): Promise<void> {
    // PagerDuty通知実装
    this.logger.info('PagerDuty alert would be sent', {
      alertId: alert.id,
      severity: alert.severity
    });
  }

  private getSlackColor(severity: string): string {
    const colors = {
      'LOW': 'good',
      'MEDIUM': 'warning',
      'HIGH': 'danger',
      'CRITICAL': '#ff0000'
    };
    return colors[severity] || 'warning';
  }

  // 過去1時間のログ取得
  private getLogsLastHour(logs: LogEntry[]): LogEntry[] {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return logs.filter(log => log.timestamp.getTime() > oneHourAgo);
  }

  // メトリクス取得
  getMetrics(): LogMetrics {
    // キャッシュチェック（5分間有効）
    if (this.metricsCache && Date.now() - this.metricsCache.timestamp < 5 * 60 * 1000) {
      return this.metricsCache.data;
    }

    const lastHour = this.getLogsLastHour(this.logs);
    
    const metrics: LogMetrics = {
      totalLogs: this.logs.length,
      logsByLevel: this.groupByLevel(this.logs),
      logsBySource: this.groupBySource(this.logs),
      errorsLastHour: lastHour.filter(log => log.level === 'error').length,
      averageResponseTime: this.calculateAverageResponseTime(lastHour),
      uniqueUsers: new Set(lastHour.filter(log => log.userId).map(log => log.userId)).size,
      topErrors: this.getTopErrors(lastHour),
      alertsCount: this.alerts.filter(alert => !alert.acknowledged).length
    };

    // キャッシュ更新
    this.metricsCache = {
      data: metrics,
      timestamp: Date.now()
    };

    return metrics;
  }

  private groupByLevel(logs: LogEntry[]): Record<string, number> {
    return logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupBySource(logs: LogEntry[]): Record<string, number> {
    return logs.reduce((acc, log) => {
      acc[log.source] = (acc[log.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateAverageResponseTime(logs: LogEntry[]): number {
    const logsWithDuration = logs.filter(log => log.duration);
    if (logsWithDuration.length === 0) return 0;
    
    const totalDuration = logsWithDuration.reduce((sum, log) => sum + (log.duration || 0), 0);
    return totalDuration / logsWithDuration.length;
  }

  private getTopErrors(logs: LogEntry[]): Array<{ message: string; count: number }> {
    const errorLogs = logs.filter(log => log.level === 'error');
    const errorCounts = errorLogs.reduce((acc, log) => {
      const key = log.message.substring(0, 100); // メッセージの最初の100文字
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));
  }

  // アラート確認
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();
      
      this.logger.info('Alert acknowledged', {
        alertId,
        acknowledgedBy,
        acknowledgedAt: alert.acknowledgedAt
      });
      
      return true;
    }
    return false;
  }

  // ログ検索
  searchLogs(query: {
    level?: string;
    source?: string;
    userId?: string;
    timeRange?: { start: Date; end: Date };
    message?: string;
    limit?: number;
  }): LogEntry[] {
    let filtered = this.logs;

    if (query.level) {
      filtered = filtered.filter(log => log.level === query.level);
    }

    if (query.source) {
      filtered = filtered.filter(log => log.source === query.source);
    }

    if (query.userId) {
      filtered = filtered.filter(log => log.userId === query.userId);
    }

    if (query.timeRange) {
      filtered = filtered.filter(log => 
        log.timestamp >= query.timeRange!.start && 
        log.timestamp <= query.timeRange!.end
      );
    }

    if (query.message) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(query.message!.toLowerCase())
      );
    }

    // 最新順でソート
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  // ログクリーンアップ
  private startLogCleanup(): void {
    // 24時間ごとにログクリーンアップ
    setInterval(() => {
      this.cleanupLogs();
    }, 24 * 60 * 60 * 1000);
  }

  private cleanupLogs(): void {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // メモリ内ログのクリーンアップ
    this.logs = this.logs.filter(log => log.timestamp.getTime() > sevenDaysAgo);
    
    // 古いアラートのクリーンアップ
    this.alerts = this.alerts.filter(alert => alert.timestamp.getTime() > sevenDaysAgo);
    
    this.logger.info('Log cleanup completed', {
      remainingLogs: this.logs.length,
      remainingAlerts: this.alerts.length
    });
  }

  // ユーティリティメソッド
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ログストリーミング
  createLogStream() {
    return {
      on: (event: string, callback: Function) => {
        this.on(event, callback);
      },
      off: (event: string, callback: Function) => {
        this.off(event, callback);
      }
    };
  }

  // エクスポート機能
  async exportLogs(timeRange: { start: Date; end: Date }, format: 'json' | 'csv' = 'json'): Promise<string> {
    const logs = this.searchLogs({ timeRange });
    
    if (format === 'csv') {
      return this.convertToCSV(logs);
    }
    
    return JSON.stringify(logs, null, 2);
  }

  private convertToCSV(logs: LogEntry[]): string {
    const headers = ['timestamp', 'level', 'message', 'source', 'userId', 'duration'];
    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.level,
      `"${log.message.replace(/"/g, '""')}"`,
      log.source,
      log.userId || '',
      log.duration || ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

// シングルトンインスタンス
const logMonitor = new LogMonitor();

export { LogMonitor, logMonitor, LogEntry, Alert, AlertRule, LogMetrics };