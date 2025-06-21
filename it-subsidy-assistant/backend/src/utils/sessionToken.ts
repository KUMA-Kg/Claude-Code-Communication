import crypto from 'crypto';

/**
 * セッショントークンを生成
 * @returns 一意のセッショントークン文字列
 */
export function generateSessionToken(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `${timestamp}-${randomBytes}`;
}

/**
 * セッショントークンを検証
 * @param token 検証するトークン
 * @returns トークンが有効な形式かどうか
 */
export function validateSessionToken(token: string): boolean {
  const tokenPattern = /^[a-z0-9]+-[a-f0-9]{32}$/;
  return tokenPattern.test(token);
}

/**
 * セッショントークンから作成時刻を取得
 * @param token セッショントークン
 * @returns 作成時刻のタイムスタンプ（ミリ秒）
 */
export function getTokenTimestamp(token: string): number | null {
  if (!validateSessionToken(token)) {
    return null;
  }
  
  const [timestampPart] = token.split('-');
  const timestamp = parseInt(timestampPart, 36);
  
  return isNaN(timestamp) ? null : timestamp;
}

/**
 * セッショントークンの有効期限をチェック
 * @param token セッショントークン
 * @param maxAgeMs 有効期限（ミリ秒）デフォルト: 24時間
 * @returns トークンが有効期限内かどうか
 */
export function isTokenValid(token: string, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
  const timestamp = getTokenTimestamp(token);
  if (!timestamp) {
    return false;
  }
  
  const now = Date.now();
  return now - timestamp < maxAgeMs;
}