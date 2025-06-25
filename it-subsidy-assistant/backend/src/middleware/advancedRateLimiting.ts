/**
 * 高度なレート制限とAPI制約システム
 * 動的制限・地理的制限・エンドポイント別制限の実装
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { logger } from '@/utils/logger';
import { getEnv } from '@/config/environment';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

interface EndpointLimits {
  [endpoint: string]: RateLimitConfig;
}

class AdvancedRateLimiting {
  private env = getEnv();
  private redisClient: any;
  private rateLimitStore: any;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      // Redis接続（本番環境用）
      if (this.env.NODE_ENV === 'production') {
        this.redisClient = createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        await this.redisClient.connect();
        this.rateLimitStore = new RedisStore({
          sendCommand: (...args: string[]) => this.redisClient.sendCommand(args),
        });
      }
    } catch (error) {
      logger.warn('Redis connection failed, falling back to memory store', error);
    }
  }

  // エンドポイント別レート制限設定
  private getEndpointLimits(): EndpointLimits {
    return {
      // 認証系 - 厳格な制限
      '/api/auth/login': {
        windowMs: 15 * 60 * 1000, // 15分
        max: 5, // 5回まで
        message: 'ログイン試行回数が上限に達しました。15分後に再試行してください。',
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      },
      '/api/auth/register': {
        windowMs: 60 * 60 * 1000, // 1時間
        max: 3, // 3回まで
        message: '新規登録の試行回数が上限に達しました。1時間後に再試行してください。'
      },
      '/api/auth/forgot-password': {
        windowMs: 60 * 60 * 1000, // 1時間
        max: 3, // 3回まで
        message: 'パスワードリセット要求の上限に達しました。1時間後に再試行してください。'
      },

      // API検索系 - 中程度の制限
      '/api/subsidies/search': {
        windowMs: 5 * 60 * 1000, // 5分
        max: 100, // 100回まで
        message: '検索APIの使用制限に達しました。5分後に再試行してください。',
        skipSuccessfulRequests: true
      },
      '/api/diagnosis': {
        windowMs: 5 * 60 * 1000, // 5分
        max: 50, // 50回まで
        message: '診断APIの使用制限に達しました。5分後に再試行してください。'
      },

      // データ投稿系 - 厳格な制限
      '/api/documents/upload': {
        windowMs: 10 * 60 * 1000, // 10分
        max: 20, // 20回まで
        message: 'ファイルアップロードの上限に達しました。10分後に再試行してください。'
      },
      '/api/forms/submit': {
        windowMs: 10 * 60 * 1000, // 10分
        max: 30, // 30回まで
        message: 'フォーム送信の上限に達しました。10分後に再試行してください。'
      },

      // エクスポート系 - 制限
      '/api/export': {
        windowMs: 10 * 60 * 1000, // 10分
        max: 10, // 10回まで
        message: 'エクスポートAPIの使用制限に達しました。10分後に再試行してください。'
      },

      // 管理者API - 緩い制限
      '/api/admin': {
        windowMs: 5 * 60 * 1000, // 5分
        max: 1000, // 1000回まで
        message: '管理者APIの使用制限に達しました。5分後に再試行してください。'
      }
    };
  }

  // 動的レート制限（ユーザー役割・時間帯・負荷に基づく）
  createDynamicRateLimit() {
    return rateLimit({
      windowMs: this.env.RATE_LIMIT_WINDOW_MS,
      max: (req) => this.calculateDynamicLimit(req),
      message: (req) => this.getDynamicMessage(req),
      standardHeaders: true,
      legacyHeaders: false,
      store: this.rateLimitStore,
      keyGenerator: (req) => this.generateAdvancedKey(req),
      skip: (req) => this.shouldSkipLimiting(req),
      handler: (req, res) => this.handleRateLimitExceeded(req, res)
    });
  }

  // エンドポイント別レート制限
  createEndpointSpecificLimits() {
    const limits = this.getEndpointLimits();
    const limiters: { [key: string]: any } = {};

    Object.entries(limits).forEach(([endpoint, config]) => {
      limiters[endpoint] = rateLimit({
        ...config,
        store: this.rateLimitStore,
        keyGenerator: (req) => `${endpoint}:${this.generateAdvancedKey(req)}`,
        handler: (req, res) => {
          logger.warn(`Rate limit exceeded for endpoint ${endpoint}`, {
            ip: this.getClientIP(req),
            userAgent: req.headers['user-agent'],
            endpoint
          });

          res.status(429).json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: config.message,
            endpoint,
            retryAfter: Math.ceil(config.windowMs / 1000)
          });
        }
      });
    });

    return limiters;
  }

  // スローダウンミドルウェア（段階的速度制限）
  createProgressiveSlowDown() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15分
      delayAfter: 50, // 50リクエスト後に開始
      delayMs: (used) => {
        // 指数関数的に遅延を増加
        return Math.min(20000, 500 * Math.pow(1.5, used - 50));
      },
      maxDelayMs: 20000, // 最大20秒
      skipSuccessfulRequests: true,
      skipFailedRequests: false,
      keyGenerator: (req) => this.generateAdvancedKey(req),
      onLimitReached: (req) => {
        logger.warn('Progressive slow down activated', {
          ip: this.getClientIP(req),
          userAgent: req.headers['user-agent'],
          path: req.path
        });
      }
    });
  }

  // 動的制限値計算
  private calculateDynamicLimit(req: Request): number {
    const baseLimit = this.env.RATE_LIMIT_MAX_REQUESTS;
    let multiplier = 1;

    // ユーザー役割による調整
    const userRole = (req as any).user?.role;
    switch (userRole) {
      case 'admin':
        multiplier *= 5;
        break;
      case 'premium':
        multiplier *= 3;
        break;
      case 'user':
        multiplier *= 1.5;
        break;
      case 'guest':
      default:
        multiplier *= 0.5;
        break;
    }

    // 時間帯による調整
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      // 営業時間は制限を緩和
      multiplier *= 1.5;
    } else if (hour >= 22 || hour <= 6) {
      // 深夜・早朝は制限を強化
      multiplier *= 0.7;
    }

    // サーバー負荷による調整
    const systemLoad = this.getSystemLoad();
    if (systemLoad > 0.8) {
      multiplier *= 0.5; // 高負荷時は制限を強化
    } else if (systemLoad < 0.3) {
      multiplier *= 1.2; // 低負荷時は制限を緩和
    }

    return Math.floor(baseLimit * multiplier);
  }

  // 動的メッセージ生成
  private getDynamicMessage(req: Request): any {
    const userRole = (req as any).user?.role || 'guest';
    const retryAfter = Math.ceil(this.env.RATE_LIMIT_WINDOW_MS / 1000);

    return {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: `API使用制限に達しました（${userRole}ユーザー）`,
      details: {
        userRole,
        resetTime: new Date(Date.now() + this.env.RATE_LIMIT_WINDOW_MS).toISOString(),
        retryAfter,
        upgradeInfo: userRole === 'guest' ? 'アカウント登録で制限が緩和されます' : undefined
      }
    };
  }

  // 高度なキー生成
  private generateAdvancedKey(req: Request): string {
    const ip = this.getClientIP(req);
    const userId = (req as any).user?.id || 'anonymous';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // IPとユーザーIDの組み合わせでより精密な制限
    const baseKey = userId !== 'anonymous' ? `user:${userId}` : `ip:${ip}`;
    
    // User-Agentのハッシュを追加（bot検出）
    const uaHash = require('crypto').createHash('md5').update(userAgent).digest('hex').substring(0, 8);
    
    return `${baseKey}:${uaHash}`;
  }

  // 制限スキップ判定
  private shouldSkipLimiting(req: Request): boolean {
    // 内部ヘルスチェックは除外
    if (req.path === '/health' || req.path === '/ping') {
      return true;
    }

    // 管理者からの特定操作は除外
    const userRole = (req as any).user?.role;
    if (userRole === 'admin' && req.path.startsWith('/api/admin/emergency')) {
      return true;
    }

    // 特定のAPIキーを持つリクエストは除外
    const apiKey = req.headers['x-api-key'];
    if (apiKey === process.env.BYPASS_API_KEY) {
      return true;
    }

    return false;
  }

  // レート制限超過時の処理
  private handleRateLimitExceeded(req: Request, res: Response) {
    const context = {
      ip: this.getClientIP(req),
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
      userId: (req as any).user?.id,
      timestamp: new Date().toISOString()
    };

    logger.warn('Rate limit exceeded', context);

    // 繰り返し違反者をマーク
    this.markRepeatOffender(context.ip);

    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'API使用制限に達しました',
      details: {
        path: req.path,
        method: req.method,
        retryAfter: Math.ceil(this.env.RATE_LIMIT_WINDOW_MS / 1000),
        timestamp: context.timestamp
      }
    });
  }

  // クライアントIP取得
  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           req.headers['x-real-ip'] as string ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
  }

  // システム負荷取得（簡易版）
  private getSystemLoad(): number {
    const usage = process.cpuUsage();
    const total = usage.user + usage.system;
    const load = total / (1000 * 1000); // マイクロ秒を秒に変換
    return Math.min(1, load / 100); // 正規化
  }

  // 繰り返し違反者のマーク
  private markRepeatOffender(ip: string) {
    // 実際の実装では、Redisまたはデータベースに記録
    logger.warn(`Marking repeat offender: ${ip}`);
    
    // 一定回数を超えた場合は長期ブロック
    // この情報は外部セキュリティシステムに送信することも可能
  }

  // ホワイトリスト管理
  createWhitelistMiddleware(whitelist: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = this.getClientIP(req);
      
      if (whitelist.includes(ip)) {
        // ホワイトリストのIPは制限をバイパス
        (req as any).bypassRateLimit = true;
      }
      
      next();
    };
  }

  // 地理的制限
  createGeoRestriction(allowedCountries: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = this.getClientIP(req);
      
      // 実際の実装では、MaxMindなどのGeoIPサービスを使用
      // ここでは簡易的な実装
      const country = this.getCountryFromIP(ip);
      
      if (country && !allowedCountries.includes(country)) {
        logger.warn(`Access denied from restricted country: ${country}`, {
          ip,
          country,
          path: req.path
        });
        
        return res.status(403).json({
          success: false,
          error: 'GEO_RESTRICTED',
          message: 'このサービスはお住まいの地域ではご利用いただけません'
        });
      }
      
      next();
    };
  }

  // 簡易的な国判定（実際の実装では外部サービスを使用）
  private getCountryFromIP(ip: string): string | null {
    // プライベートIPは日本として扱う
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip === 'unknown') {
      return 'JP';
    }
    
    // 実際の実装では、MaxMind GeoIP2やip-api.comなどを使用
    return null;
  }

  // 統計情報取得
  async getRateLimitStats() {
    try {
      if (!this.redisClient) {
        return { message: 'Redis not available for stats' };
      }

      // Redis keyの統計を取得
      const keys = await this.redisClient.keys('*');
      const stats = {
        totalKeys: keys.length,
        activeUsers: keys.filter((k: string) => k.startsWith('user:')).length,
        blockedIPs: keys.filter((k: string) => k.includes('blocked')).length,
        endpointStats: {} as Record<string, number>
      };

      // エンドポイント別統計
      const endpointKeys = keys.filter((k: string) => k.startsWith('/api/'));
      endpointKeys.forEach((key: string) => {
        const endpoint = key.split(':')[0];
        stats.endpointStats[endpoint] = (stats.endpointStats[endpoint] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get rate limit stats', error);
      return { error: 'Failed to get stats' };
    }
  }
}

// シングルトンインスタンス
const advancedRateLimiting = new AdvancedRateLimiting();

export { AdvancedRateLimiting, advancedRateLimiting };