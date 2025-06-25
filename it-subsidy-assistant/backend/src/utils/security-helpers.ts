/**
 * Phase 1 セキュリティヘルパー関数
 * 共通的なセキュリティユーティリティ
 */

import { Request } from 'express';
import crypto from 'crypto';

/**
 * IPアドレス取得
 * プロキシ経由でも正しいIPを取得
 */
export const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (forwarded as string).split(',')[0].trim();
  }
  
  return req.socket.remoteAddress || 'unknown';
};

/**
 * セキュアなランダム文字列生成
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * パスワード強度チェック
 */
export interface PasswordStrength {
  isValid: boolean;
  score: number;
  feedback: string[];
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // 長さチェック
  if (password.length < 8) {
    feedback.push('パスワードは8文字以上必要です');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // 大文字チェック
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('大文字を含めることを推奨します');
  }

  // 小文字チェック
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('小文字を含めることを推奨します');
  }

  // 数字チェック
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('数字を含めることを推奨します');
  }

  // 特殊文字チェック
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 2;
  } else {
    feedback.push('特殊文字を含めることを推奨します');
  }

  // 一般的な弱いパスワードチェック
  const weakPasswords = [
    'password', 'Password', '12345678', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
  ];
  
  if (weakPasswords.includes(password.toLowerCase())) {
    score = 0;
    feedback.push('よく使われる弱いパスワードです');
  }

  return {
    isValid: score >= 3 && password.length >= 8,
    score: Math.min(score, 5), // 最大スコア5
    feedback,
  };
};

/**
 * メールアドレス検証
 */
export const isValidEmail = (email: string): boolean => {
  // RFC 5322準拠の簡易版
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * URLパラメータのサニタイゼーション
 */
export const sanitizeUrlParam = (param: string): string => {
  if (!param) return '';
  
  // URLエンコードされた文字をデコード
  let decoded = decodeURIComponent(param);
  
  // 危険な文字を除去
  decoded = decoded
    .replace(/[<>'"]/g, '') // HTMLタグに使われる文字
    .replace(/javascript:/gi, '') // JavaScriptプロトコル
    .replace(/on\w+=/gi, '') // イベントハンドラ
    .trim();
  
  // 再エンコード
  return encodeURIComponent(decoded);
};

/**
 * ファイル名のサニタイゼーション
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename) return 'unnamed';
  
  // 危険な文字を除去
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // 英数字、ピリオド、アンダースコア、ハイフン以外を置換
    .replace(/\.{2,}/g, '.') // 連続するピリオドを単一に
    .replace(/^\.+|\.+$/g, '') // 先頭と末尾のピリオドを削除
    .substring(0, 255); // 最大長制限
};

/**
 * JSONの安全なパース
 */
export const safeJsonParse = <T = any>(json: string): T | null => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
};

/**
 * セッションID生成
 */
export const generateSessionId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(16).toString('hex');
  return `${timestamp}-${randomPart}`;
};

/**
 * タイミング攻撃対策の安全な文字列比較
 */
export const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(a),
    Buffer.from(b)
  );
};

/**
 * リクエストのフィンガープリント生成
 * ブルートフォース攻撃の検出用
 */
export const generateRequestFingerprint = (req: Request): string => {
  const components = [
    getClientIp(req),
    req.headers['user-agent'] || 'unknown',
    req.headers['accept-language'] || 'unknown',
    req.headers['accept-encoding'] || 'unknown',
  ];
  
  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
};

/**
 * セキュリティログ用のリクエスト情報抽出
 */
export interface SecurityLogInfo {
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  timestamp: string;
  fingerprint: string;
}

export const extractSecurityLogInfo = (req: Request): SecurityLogInfo => {
  return {
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'] || 'unknown',
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
    fingerprint: generateRequestFingerprint(req),
  };
};