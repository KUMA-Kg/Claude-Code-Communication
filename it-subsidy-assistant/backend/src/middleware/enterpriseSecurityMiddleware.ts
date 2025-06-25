/**
 * エンタープライズレベルセキュリティミドルウェア
 * ゼロトラスト・アーキテクチャの包括的実装
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { JWTManager } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import crypto from 'crypto';
import { getEnv } from '@/config/environment';

interface SecurityContext {
  sessionId: string;
  userId?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  riskScore: number;
}

interface SecurityThreat {
  type: 'BRUTE_FORCE' | 'SQL_INJECTION' | 'XSS' | 'CSRF' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  payload?: string;
  context: SecurityContext;
  blocked: boolean;
}

class EnterpriseSecurityMiddleware {
  private threats: SecurityThreat[] = [];
  private blockedIPs = new Set<string>();
  private suspiciousActivity = new Map<string, number>();
  private env = getEnv();

  // セキュリティヘッダーの設定
  getHelmetConfig() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https://api.supabase.co", "wss:", "ws:"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          upgradeInsecureRequests: []
        }
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      permissionsPolicy: {
        features: {
          geolocation: ['none'],
          microphone: ['none'],
          camera: ['none'],
          payment: ['none'],
          usb: ['none'],
          magnetometer: ['none'],
          gyroscope: ['none'],
          speaker: ['none']
        }
      }
    });
  }

  // CORS設定
  getCorsConfig() {
    return cors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          this.env.CORS_ORIGIN,
          'http://localhost:3000',
          'http://localhost:3001',
          'https://localhost:3000',
          'https://localhost:3001'
        ];

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          this.logSecurityThreat({
            type: 'SUSPICIOUS_ACTIVITY',
            severity: 'MEDIUM',
            source: `CORS_VIOLATION:${origin}`,
            context: this.createSecurityContext({} as Request),
            blocked: true
          });
          callback(new Error('CORS policy violation'));
        }
      },
      credentials: this.env.CORS_CREDENTIALS,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token',
        'X-Session-ID',
        'X-API-Key'
      ],
      exposedHeaders: ['X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset'],
      maxAge: 86400 // 24時間
    });
  }

  // 高度なレート制限
  getAdvancedRateLimit() {
    return rateLimit({
      windowMs: this.env.RATE_LIMIT_WINDOW_MS,
      max: (req) => {
        // ユーザーの役割に基づく動的制限
        const userRole = (req as any).user?.role;
        switch (userRole) {
          case 'admin': return this.env.RATE_LIMIT_MAX_REQUESTS * 3;
          case 'premium': return this.env.RATE_LIMIT_MAX_REQUESTS * 2;
          case 'user': return this.env.RATE_LIMIT_MAX_REQUESTS;
          default: return Math.floor(this.env.RATE_LIMIT_MAX_REQUESTS * 0.5);
        }
      },
      message: {
        error: 'Rate limit exceeded',
        message: 'API使用制限に達しました。時間をおいて再試行してください。',
        retryAfter: Math.ceil(this.env.RATE_LIMIT_WINDOW_MS / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // より詳細なキー生成（IP + ユーザーID + エンドポイント）
        const ip = this.getClientIP(req);
        const userId = (req as any).user?.id || 'anonymous';
        const endpoint = req.route?.path || req.path;
        return `${ip}:${userId}:${endpoint}`;
      },
      handler: (req, res) => {
        const context = this.createSecurityContext(req);
        this.logSecurityThreat({
          type: 'RATE_LIMIT',
          severity: 'MEDIUM',
          source: `${req.method} ${req.path}`,
          context,
          blocked: true
        });

        res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'API使用制限に達しました',
          retryAfter: Math.ceil(this.env.RATE_LIMIT_WINDOW_MS / 1000)
        });
      }
    });
  }

  // スローダウンミドルウェア
  getSlowDownConfig() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15分
      delayAfter: 50, // 50リクエスト後に開始
      delayMs: 500, // 500msの遅延
      maxDelayMs: 20000, // 最大20秒の遅延
      skipSuccessfulRequests: true,
      skipFailedRequests: false
    });
  }

  // JWT認証ミドルウェア（強化版）
  enhancedAuthentication = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = this.createSecurityContext(req);
      
      // IPブロックチェック
      if (this.blockedIPs.has(context.ipAddress)) {
        return res.status(403).json({
          success: false,
          error: 'IP_BLOCKED',
          message: 'このIPアドレスはセキュリティ上の理由によりブロックされています'
        });
      }

      const authHeader = req.headers.authorization;
      const token = JWTManager.extractTokenFromHeader(authHeader);

      if (!token) {
        this.incrementSuspiciousActivity(context.ipAddress);
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'アクセストークンが必要です'
        });
      }

      // トークン検証
      const decoded = JWTManager.verifyAccessToken(token);
      
      // セッション検証
      const sessionValid = await this.validateSession(decoded.sessionId);
      if (!sessionValid) {
        return res.status(401).json({
          success: false,
          error: 'SESSION_INVALID',
          message: 'セッションが無効です'
        });
      }

      // リスクスコア計算
      context.userId = decoded.userId;
      context.userRole = decoded.role;
      context.riskScore = this.calculateRiskScore(context);

      // 高リスクの場合は追加認証を要求
      if (context.riskScore > 0.8) {
        return res.status(403).json({
          success: false,
          error: 'HIGH_RISK_DETECTED',
          message: '追加認証が必要です',
          requireMFA: true
        });
      }

      (req as any).user = decoded;
      (req as any).securityContext = context;
      next();

    } catch (error) {
      const context = this.createSecurityContext(req);
      this.logSecurityThreat({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        source: 'JWT_VERIFICATION_FAILED',
        payload: error instanceof Error ? error.message : 'Unknown error',
        context,
        blocked: true
      });

      this.incrementSuspiciousActivity(context.ipAddress);

      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: '認証に失敗しました'
      });
    }
  };

  // セキュリティコンテキスト作成
  private createSecurityContext(req: Request): SecurityContext {
    return {
      sessionId: req.headers['x-session-id'] as string || crypto.randomUUID(),
      ipAddress: this.getClientIP(req),
      userAgent: req.headers['user-agent'] || 'Unknown',
      timestamp: new Date(),
      riskScore: 0
    };
  }

  // クライアントIP取得
  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           req.headers['x-real-ip'] as string ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
  }

  // リスクスコア計算
  private calculateRiskScore(context: SecurityContext): number {
    let score = 0;

    // 不審なIPからのアクセス
    if (this.suspiciousActivity.has(context.ipAddress)) {
      score += 0.3;
    }

    // 非標準的なUser-Agent
    if (!context.userAgent.includes('Mozilla') && !context.userAgent.includes('Chrome')) {
      score += 0.2;
    }

    // 地理的異常検出（簡易版）
    if (context.ipAddress.startsWith('192.168.') || context.ipAddress.startsWith('10.')) {
      score -= 0.1; // 内部ネットワークは安全
    }

    // 時間帯による調整
    const hour = context.timestamp.getHours();
    if (hour < 6 || hour > 22) {
      score += 0.1; // 深夜・早朝は若干リスク上昇
    }

    return Math.max(0, Math.min(1, score));
  }

  // セッション検証
  private async validateSession(sessionId: string): Promise<boolean> {
    // 実際の実装では、RedisやDBでセッション状態を確認
    // ここでは簡易的な実装
    return sessionId && sessionId.length > 10;
  }

  // 不審な活動の記録
  private incrementSuspiciousActivity(ip: string) {
    const count = this.suspiciousActivity.get(ip) || 0;
    this.suspiciousActivity.set(ip, count + 1);

    // 閾値を超えたらIPをブロック
    if (count + 1 > 10) {
      this.blockedIPs.add(ip);
      logger.warn(`IP ${ip} blocked due to suspicious activity`);
    }
  }

  // セキュリティ脅威のログ記録
  private logSecurityThreat(threat: SecurityThreat) {
    this.threats.push(threat);

    logger.warn('Security threat detected', {
      type: threat.type,
      severity: threat.severity,
      source: threat.source,
      userId: threat.context.userId,
      ip: threat.context.ipAddress,
      userAgent: threat.context.userAgent,
      blocked: threat.blocked
    });

    // クリティカルな脅威の場合は即座にアラート
    if (threat.severity === 'CRITICAL') {
      this.triggerSecurityAlert(threat);
    }
  }

  // セキュリティアラートのトリガー
  private triggerSecurityAlert(threat: SecurityThreat) {
    logger.error('CRITICAL SECURITY THREAT DETECTED', {
      threat,
      timestamp: new Date().toISOString(),
      serverInfo: {
        nodeEnv: this.env.NODE_ENV,
        version: process.version
      }
    });

    // 実際の実装では、ここでSlack/Teams/メール通知を送信
    // または外部セキュリティシステムに通知
  }

  // セキュリティ統計取得
  getSecurityMetrics() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const recentThreats = this.threats.filter(t => 
      t.context.timestamp.getTime() > oneHourAgo
    );

    return {
      totalThreats: this.threats.length,
      recentThreats: recentThreats.length,
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousActivity.size,
      threatsByType: this.getThreatsByType(),
      threatsBySeverity: this.getThreatsBySeverity(),
      topSources: this.getTopThreatSources(),
      riskScore: this.calculateOverallRiskScore()
    };
  }

  private getThreatsByType() {
    const types: Record<string, number> = {};
    this.threats.forEach(threat => {
      types[threat.type] = (types[threat.type] || 0) + 1;
    });
    return types;
  }

  private getThreatsBySeverity() {
    const severity: Record<string, number> = {};
    this.threats.forEach(threat => {
      severity[threat.severity] = (severity[threat.severity] || 0) + 1;
    });
    return severity;
  }

  private getTopThreatSources() {
    const sources: Record<string, number> = {};
    this.threats.forEach(threat => {
      const ip = threat.context.ipAddress;
      sources[ip] = (sources[ip] || 0) + 1;
    });
    
    return Object.entries(sources)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
  }

  private calculateOverallRiskScore(): number {
    if (this.threats.length === 0) return 0;

    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentThreats = this.threats.filter(t => 
      t.context.timestamp.getTime() > oneHourAgo
    );

    const criticalCount = recentThreats.filter(t => t.severity === 'CRITICAL').length;
    const highCount = recentThreats.filter(t => t.severity === 'HIGH').length;
    const mediumCount = recentThreats.filter(t => t.severity === 'MEDIUM').length;

    const score = (criticalCount * 1.0 + highCount * 0.7 + mediumCount * 0.4) / 10;
    return Math.max(0, Math.min(1, score));
  }

  // セキュリティヘルスチェック
  performSecurityHealthCheck() {
    const metrics = this.getSecurityMetrics();
    const health = {
      status: 'HEALTHY' as 'HEALTHY' | 'WARNING' | 'CRITICAL',
      score: 100,
      issues: [] as string[],
      recommendations: [] as string[]
    };

    // 健全性チェック
    if (metrics.riskScore > 0.8) {
      health.status = 'CRITICAL';
      health.score -= 50;
      health.issues.push('高いリスクスコアが検出されています');
    } else if (metrics.riskScore > 0.5) {
      health.status = 'WARNING';
      health.score -= 25;
      health.issues.push('中程度のセキュリティリスクがあります');
    }

    if (metrics.blockedIPs > 50) {
      health.status = 'WARNING';
      health.score -= 15;
      health.issues.push('多数のIPがブロックされています');
      health.recommendations.push('ネットワークセキュリティの見直しを推奨');
    }

    if (metrics.recentThreats > 100) {
      health.status = 'WARNING';
      health.score -= 20;
      health.issues.push('直近1時間で多数の脅威が検出されています');
      health.recommendations.push('セキュリティ監視の強化を推奨');
    }

    return { ...health, metrics, timestamp: new Date().toISOString() };
  }
}

// シングルトンインスタンス
const enterpriseSecurity = new EnterpriseSecurityMiddleware();

export {
  EnterpriseSecurityMiddleware,
  enterpriseSecurity,
  SecurityContext,
  SecurityThreat
};