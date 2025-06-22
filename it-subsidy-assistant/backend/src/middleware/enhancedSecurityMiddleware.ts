/**
 * 強化セキュリティミドルウェア
 * XSS、CSRF、SQLインジェクション対策の包括的実装
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import csrf from 'csurf';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';
import { logger } from '@/utils/logger';

// セキュリティ設定インターfaces
interface SecurityConfig {
  enableCSRF: boolean;
  enableRateLimit: boolean;
  enableInputSanitization: boolean;
  enableXSSProtection: boolean;
  enableSQLInjectionProtection: boolean;
}

// セキュリティ脅威ログ
interface SecurityThreat {
  type: 'XSS' | 'SQL_INJECTION' | 'CSRF' | 'SUSPICIOUS_INPUT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  payload: string;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

class SecurityMiddleware {
  private config: SecurityConfig;
  private threats: SecurityThreat[] = [];

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  // XSS攻撃検出パターン
  private xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<img[^>]+src[^>]*=.*onerror.*>/gi,
    /<svg[^>]*onload[^>]*>/gi,
    /expression\s*\(/gi,
    /vbscript:/gi
  ];

  // SQLインジェクション検出パターン
  private sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|UNION|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\'|\"|;|--|\/\*|\*\/)/g,
    /(\bUNION\b.*\bSELECT\b)/gi,
    /(\bDROP\b.*\bTABLE\b)/gi,
    /(\bEXEC\b|\bEXECUTE\b)/gi,
    /(\bxp_cmdshell\b)/gi,
    /(\bWAITFOR\b.*\bDELAY\b)/gi
  ];

  // Helmet設定
  getHelmetConfig() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
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
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    });
  }

  // CSRF保護設定
  getCSRFConfig() {
    return csrf({
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1時間
      },
      ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
      value: (req) => {
        return req.get('X-CSRF-TOKEN') || 
               req.get('x-csrf-token') || 
               req.get('X-XSRF-TOKEN') || 
               req.get('x-xsrf-token') ||
               req.body._token;
      }
    });
  }

  // レート制限設定
  getRateLimitConfig() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15分
      max: 1000, // 最大1000リクエスト
      message: {
        error: 'Too many requests',
        message: 'リクエスト制限に達しました。しばらく後に再試行してください。'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.logSecurityThreat({
          type: 'SUSPICIOUS_INPUT',
          severity: 'MEDIUM',
          source: req.path,
          payload: 'Rate limit exceeded',
          timestamp: new Date(),
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
        
        res.status(429).json({
          error: 'Too many requests',
          message: 'リクエスト制限に達しました。しばらく後に再試行してください。'
        });
      }
    });
  }

  // XSS検出・サニタイゼーション
  detectAndSanitizeXSS = (req: Request, res: Response, next: NextFunction) => {
    if (!this.config.enableXSSProtection) return next();

    const sanitizeValue = (value: any, path: string = ''): any => {
      if (typeof value === 'string') {
        // XSSパターンの検出
        for (const pattern of this.xssPatterns) {
          if (pattern.test(value)) {
            this.logSecurityThreat({
              type: 'XSS',
              severity: 'HIGH',
              source: `${req.path}.${path}`,
              payload: value,
              timestamp: new Date(),
              userAgent: req.get('User-Agent'),
              ip: req.ip
            });

            // 攻撃的なパターンの場合はリクエストを拒否
            if (value.includes('<script') || value.includes('javascript:')) {
              return res.status(400).json({
                error: 'Security violation detected',
                message: 'リクエストにセキュリティ上の問題が検出されました'
              });
            }
          }
        }

        // DOMPurifyでサニタイズ
        return DOMPurify.sanitize(value, {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
          ALLOW_DATA_ATTR: false
        });
      }

      if (Array.isArray(value)) {
        return value.map((item, index) => 
          sanitizeValue(item, `${path}[${index}]`)
        );
      }

      if (value && typeof value === 'object') {
        const sanitized: any = {};
        for (const [key, val] of Object.entries(value)) {
          sanitized[key] = sanitizeValue(val, `${path}.${key}`);
        }
        return sanitized;
      }

      return value;
    };

    if (this.config.enableInputSanitization) {
      req.body = sanitizeValue(req.body, 'body');
      req.query = sanitizeValue(req.query, 'query');
      req.params = sanitizeValue(req.params, 'params');
    }

    next();
  };

  // SQLインジェクション検出
  detectSQLInjection = (req: Request, res: Response, next: NextFunction) => {
    if (!this.config.enableSQLInjectionProtection) return next();

    const checkValue = (value: any, path: string = ''): boolean => {
      if (typeof value === 'string') {
        for (const pattern of this.sqlInjectionPatterns) {
          if (pattern.test(value)) {
            this.logSecurityThreat({
              type: 'SQL_INJECTION',
              severity: 'CRITICAL',
              source: `${req.path}.${path}`,
              payload: value,
              timestamp: new Date(),
              userAgent: req.get('User-Agent'),
              ip: req.ip
            });
            return true;
          }
        }
      }

      if (Array.isArray(value)) {
        return value.some((item, index) => 
          checkValue(item, `${path}[${index}]`)
        );
      }

      if (value && typeof value === 'object') {
        return Object.entries(value).some(([key, val]) => 
          checkValue(val, `${path}.${key}`)
        );
      }

      return false;
    };

    const hasSQLInjection = 
      checkValue(req.body, 'body') ||
      checkValue(req.query, 'query') ||
      checkValue(req.params, 'params');

    if (hasSQLInjection) {
      return res.status(400).json({
        error: 'SQL injection attempt detected',
        message: 'SQLインジェクション攻撃が検出されました'
      });
    }

    next();
  };

  // 高度な入力検証
  advancedInputValidation = (req: Request, res: Response, next: NextFunction) => {
    const validateField = (value: string, fieldName: string, fieldType: string): string | null => {
      switch (fieldType) {
        case 'email':
          return validator.isEmail(value) ? null : `無効なメールアドレス: ${fieldName}`;
        
        case 'url':
          return validator.isURL(value) ? null : `無効なURL: ${fieldName}`;
        
        case 'phone':
          return validator.isMobilePhone(value, 'ja-JP') ? null : `無効な電話番号: ${fieldName}`;
        
        case 'creditCard':
          return validator.isCreditCard(value) ? null : `無効なクレジットカード番号: ${fieldName}`;
        
        case 'postCode':
          return /^\d{3}-\d{4}$/.test(value) ? null : `無効な郵便番号: ${fieldName}`;
        
        case 'alphanumeric':
          return validator.isAlphanumeric(value) ? null : `英数字のみ許可: ${fieldName}`;
        
        case 'numeric':
          return validator.isNumeric(value) ? null : `数字のみ許可: ${fieldName}`;
        
        default:
          return null;
      }
    };

    // フィールドタイプの自動検出と検証
    const validateObject = (obj: any, prefix: string = ''): string[] => {
      const errors: string[] = [];
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          const fieldName = `${prefix}${key}`;
          
          // フィールド名からタイプを推測
          let fieldType = '';
          if (key.toLowerCase().includes('email')) fieldType = 'email';
          else if (key.toLowerCase().includes('url')) fieldType = 'url';
          else if (key.toLowerCase().includes('phone')) fieldType = 'phone';
          else if (key.toLowerCase().includes('zip') || key.toLowerCase().includes('postal')) fieldType = 'postCode';
          
          if (fieldType) {
            const error = validateField(value, fieldName, fieldType);
            if (error) errors.push(error);
          }

          // 長さの検証
          if (value.length > 10000) {
            errors.push(`フィールドが長すぎます: ${fieldName}`);
          }
        } else if (typeof value === 'object' && value !== null) {
          errors.push(...validateObject(value, `${prefix}${key}.`));
        }
      }
      
      return errors;
    };

    const validationErrors = validateObject(req.body);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    next();
  };

  // セキュリティ脅威のログ記録
  private logSecurityThreat(threat: SecurityThreat) {
    this.threats.push(threat);
    
    logger.warn('Security threat detected', {
      type: threat.type,
      severity: threat.severity,
      source: threat.source,
      payload: threat.payload.substring(0, 100), // ペイロードを制限
      userAgent: threat.userAgent,
      ip: threat.ip
    });

    // 重要度が高い場合は即座にアラート
    if (threat.severity === 'CRITICAL' || threat.severity === 'HIGH') {
      logger.error('Critical security threat detected', threat);
      // 実際の本番環境では、ここでアラートシステムに通知
    }
  }

  // セキュリティ統計の取得
  getSecurityStats() {
    const stats = {
      totalThreats: this.threats.length,
      threatsByType: {} as Record<string, number>,
      threatsBySeverity: {} as Record<string, number>,
      recentThreats: this.threats.slice(-10)
    };

    this.threats.forEach(threat => {
      stats.threatsByType[threat.type] = (stats.threatsByType[threat.type] || 0) + 1;
      stats.threatsBySeverity[threat.severity] = (stats.threatsBySeverity[threat.severity] || 0) + 1;
    });

    return stats;
  }

  // セキュリティレポートの生成
  generateSecurityReport() {
    return {
      timestamp: new Date().toISOString(),
      config: this.config,
      stats: this.getSecurityStats(),
      recommendations: this.generateSecurityRecommendations()
    };
  }

  // セキュリティ推奨事項の生成
  private generateSecurityRecommendations() {
    const recommendations = [];
    const stats = this.getSecurityStats();

    if (stats.threatsByType['XSS'] > 0) {
      recommendations.push({
        type: 'XSS_PROTECTION',
        priority: 'HIGH',
        message: 'XSS攻撃が検出されています。入力サニタイゼーションの強化を推奨します。'
      });
    }

    if (stats.threatsByType['SQL_INJECTION'] > 0) {
      recommendations.push({
        type: 'SQL_INJECTION_PROTECTION',
        priority: 'CRITICAL',
        message: 'SQLインジェクション攻撃が検出されています。パラメータ化クエリの実装を緊急で行ってください。'
      });
    }

    if (stats.totalThreats > 100) {
      recommendations.push({
        type: 'MONITORING',
        priority: 'MEDIUM',
        message: '多数のセキュリティ脅威が検出されています。監視システムの強化を検討してください。'
      });
    }

    return recommendations;
  }
}

// デフォルトセキュリティ設定
const defaultSecurityConfig: SecurityConfig = {
  enableCSRF: true,
  enableRateLimit: true,
  enableInputSanitization: true,
  enableXSSProtection: true,
  enableSQLInjectionProtection: true
};

// ミドルウェアのエクスポート
export const createSecurityMiddleware = (config: Partial<SecurityConfig> = {}) => {
  const fullConfig = { ...defaultSecurityConfig, ...config };
  const security = new SecurityMiddleware(fullConfig);

  return {
    helmet: security.getHelmetConfig(),
    csrf: security.getCSRFConfig(),
    rateLimit: security.getRateLimitConfig(),
    xssProtection: security.detectAndSanitizeXSS,
    sqlInjectionProtection: security.detectSQLInjection,
    inputValidation: security.advancedInputValidation,
    getStats: () => security.getSecurityStats(),
    generateReport: () => security.generateSecurityReport()
  };
};

export { SecurityMiddleware, SecurityConfig, SecurityThreat };