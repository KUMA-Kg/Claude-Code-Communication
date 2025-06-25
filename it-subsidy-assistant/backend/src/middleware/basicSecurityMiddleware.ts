/**
 * Phase 1 基本セキュリティミドルウェア
 * シンプルで動作確実なセキュリティ実装
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import { createHash, randomBytes } from 'crypto';

// JWT設定
const JWT_SECRET = process.env.JWT_SECRET || 'phase1-default-secret-please-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * 基本セキュリティヘッダー設定
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "https://localhost:*"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/**
 * 基本的なJWT認証
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const generateToken = (user: { id: string; email: string; role: string }) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '認証トークンが必要です' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: '無効な認証トークンです' });
  }
};

/**
 * SQLインジェクション対策
 * 基本的な文字列サニタイゼーション
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // 危険な文字をエスケープ
  return input
    .replace(/'/g, "''")  // シングルクォートをエスケープ
    .replace(/"/g, '""')  // ダブルクォートをエスケープ
    .replace(/;/g, '')    // セミコロンを削除
    .replace(/--/g, '')   // SQLコメントを削除
    .replace(/\/\*/g, '') // マルチラインコメント開始を削除
    .replace(/\*\//g, '') // マルチラインコメント終了を削除
    .trim();
};

/**
 * リクエストボディのサニタイゼーション
 */
export const sanitizeRequestBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeInput(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(sanitize);
      } else if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[key] = sanitize(obj[key]);
          }
        }
        return sanitized;
      }
      return obj;
    };

    req.body = sanitize(req.body);
  }
  next();
};

/**
 * CSRF対策
 * シンプルなトークンベース実装
 */
const csrfTokens = new Map<string, { token: string; expires: number }>();

export const generateCSRFToken = (): string => {
  const token = randomBytes(32).toString('hex');
  const sessionId = randomBytes(16).toString('hex');
  
  // トークンを保存（1時間有効）
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + 3600000,
  });

  // 古いトークンをクリーンアップ
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expires < now) {
      csrfTokens.delete(key);
    }
  }

  return `${sessionId}.${token}`;
};

export const verifyCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  // GETリクエストはスキップ
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string;
  if (!csrfToken) {
    return res.status(403).json({ error: 'CSRFトークンが必要です' });
  }

  const [sessionId, token] = csrfToken.split('.');
  const storedToken = csrfTokens.get(sessionId);

  if (!storedToken || storedToken.token !== token || storedToken.expires < Date.now()) {
    return res.status(403).json({ error: '無効なCSRFトークンです' });
  }

  // トークンを削除（使い捨て）
  csrfTokens.delete(sessionId);
  next();
};

/**
 * XSS対策
 * HTMLエンティティのエスケープ
 */
export const escapeHtml = (str: string): string => {
  const htmlEscapes: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'\/]/g, (char) => htmlEscapes[char] || char);
};

/**
 * レスポンスのXSS対策
 */
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  res.json = function (data: any) {
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return escapeHtml(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(sanitize);
      } else if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[key] = sanitize(obj[key]);
          }
        }
        return sanitized;
      }
      return obj;
    };

    const sanitizedData = sanitize(data);
    return originalJson.call(this, sanitizedData);
  };

  next();
};

/**
 * 簡易レート制限
 * IPアドレスベースの実装
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // 1分あたり100リクエスト
const RATE_WINDOW = 60000; // 1分

export const basicRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = requestCounts.get(ip);
  
  if (!record || record.resetTime < now) {
    // 新しいウィンドウ
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + RATE_WINDOW,
    });
  } else {
    // 既存のウィンドウ
    record.count++;
    
    if (record.count > RATE_LIMIT) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({ 
        error: 'リクエスト数が多すぎます。しばらくしてから再試行してください。',
        retryAfter,
      });
    }
  }

  // 古いレコードをクリーンアップ
  if (requestCounts.size > 1000) {
    for (const [key, value] of requestCounts.entries()) {
      if (value.resetTime < now) {
        requestCounts.delete(key);
      }
    }
  }

  next();
};

/**
 * セキュリティミドルウェアの統合エクスポート
 */
export const basicSecurityMiddleware = [
  securityHeaders,
  basicRateLimit,
  sanitizeRequestBody,
  xssProtection,
];

// 認証が必要なルート用
export const authenticatedRoute = [
  verifyToken,
  verifyCSRFToken,
];