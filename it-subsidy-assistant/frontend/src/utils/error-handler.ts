/**
 * Phase 1 エラーハンドリングユーティリティ
 * API通信エラーとアプリケーションエラーの統一的な処理
 */

// エラータイプの定義
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

// エラーレベルの定義
export enum ErrorLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// カスタムエラークラス
export class AppError extends Error {
  type: ErrorType;
  level: ErrorLevel;
  statusCode?: number;
  details?: any;
  timestamp: Date;
  id: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    level: ErrorLevel = ErrorLevel.ERROR,
    statusCode?: number,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.level = level;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    this.id = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// APIエラーレスポンスの型定義
interface ApiErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
  details?: any;
}

/**
 * APIエラーをAppErrorに変換
 */
export const parseApiError = (error: any): AppError => {
  // ネットワークエラー
  if (!error.response) {
    return new AppError(
      'ネットワークエラーが発生しました。インターネット接続を確認してください。',
      ErrorType.NETWORK,
      ErrorLevel.ERROR
    );
  }

  const status = error.response.status;
  const data: ApiErrorResponse = error.response.data || {};

  // ステータスコードに基づくエラー分類
  switch (status) {
    case 400:
      return new AppError(
        data.error || '入力内容に誤りがあります。',
        ErrorType.VALIDATION,
        ErrorLevel.WARNING,
        status,
        data.details
      );
    
    case 401:
      return new AppError(
        'ログインが必要です。',
        ErrorType.AUTHENTICATION,
        ErrorLevel.WARNING,
        status
      );
    
    case 403:
      return new AppError(
        'このリソースへのアクセス権限がありません。',
        ErrorType.AUTHENTICATION,
        ErrorLevel.WARNING,
        status
      );
    
    case 404:
      return new AppError(
        'リクエストされたリソースが見つかりません。',
        ErrorType.SERVER,
        ErrorLevel.WARNING,
        status
      );
    
    case 429:
      return new AppError(
        'リクエスト数が多すぎます。しばらくしてから再試行してください。',
        ErrorType.SERVER,
        ErrorLevel.WARNING,
        status,
        { retryAfter: error.response.headers['retry-after'] }
      );
    
    case 500:
    case 502:
    case 503:
    case 504:
      return new AppError(
        'サーバーエラーが発生しました。しばらくしてから再試行してください。',
        ErrorType.SERVER,
        ErrorLevel.ERROR,
        status
      );
    
    default:
      return new AppError(
        data.error || `予期しないエラーが発生しました。(${status})`,
        ErrorType.UNKNOWN,
        ErrorLevel.ERROR,
        status
      );
  }
};

/**
 * エラーメッセージの表示用フォーマット
 */
export const formatErrorMessage = (error: AppError): string => {
  switch (error.type) {
    case ErrorType.NETWORK:
      return '通信エラー: ' + error.message;
    case ErrorType.AUTHENTICATION:
      return '認証エラー: ' + error.message;
    case ErrorType.VALIDATION:
      return '入力エラー: ' + error.message;
    case ErrorType.SERVER:
      return 'サーバーエラー: ' + error.message;
    default:
      return error.message;
  }
};

/**
 * エラーの重要度に基づく通知方法の決定
 */
export const getNotificationMethod = (error: AppError): 'toast' | 'modal' | 'inline' => {
  switch (error.level) {
    case ErrorLevel.INFO:
      return 'toast';
    case ErrorLevel.WARNING:
      return 'inline';
    case ErrorLevel.ERROR:
      return 'toast';
    case ErrorLevel.CRITICAL:
      return 'modal';
    default:
      return 'toast';
  }
};

/**
 * エラーログの保存
 */
export const logError = (error: AppError): void => {
  const errorLog = {
    id: error.id,
    type: error.type,
    level: error.level,
    message: error.message,
    statusCode: error.statusCode,
    details: error.details,
    timestamp: error.timestamp.toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // コンソールに出力
  if (error.level === ErrorLevel.CRITICAL || error.level === ErrorLevel.ERROR) {
    console.error('AppError:', errorLog);
  } else {
    console.warn('AppError:', errorLog);
  }

  // ローカルストレージに保存（最新20件）
  try {
    const errors = JSON.parse(localStorage.getItem('error_logs') || '[]');
    errors.unshift(errorLog);
    if (errors.length > 20) {
      errors.pop();
    }
    localStorage.setItem('error_logs', JSON.stringify(errors));
  } catch (e) {
    console.error('Failed to save error log:', e);
  }

  // 本番環境では外部サービスに送信
  if (process.env.NODE_ENV === 'production' && error.level !== ErrorLevel.INFO) {
    // TODO: Sentry等への送信
  }
};

/**
 * エラーハンドリングフック用のヘルパー
 */
export const handleError = (error: any): AppError => {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error.response) {
    // Axiosエラー
    appError = parseApiError(error);
  } else if (error instanceof Error) {
    // 一般的なJavaScriptエラー
    appError = new AppError(
      error.message,
      ErrorType.UNKNOWN,
      ErrorLevel.ERROR
    );
  } else {
    // その他のエラー
    appError = new AppError(
      '予期しないエラーが発生しました。',
      ErrorType.UNKNOWN,
      ErrorLevel.ERROR
    );
  }

  // エラーログを記録
  logError(appError);

  return appError;
};

/**
 * リトライ可能なエラーかどうかを判定
 */
export const isRetryableError = (error: AppError): boolean => {
  return (
    error.type === ErrorType.NETWORK ||
    (error.type === ErrorType.SERVER && error.statusCode !== 500) ||
    error.statusCode === 429
  );
};

/**
 * エラーからのリトライ待機時間を計算
 */
export const getRetryDelay = (error: AppError, attempt: number): number => {
  // 429エラーの場合、Retry-Afterヘッダーを優先
  if (error.statusCode === 429 && error.details?.retryAfter) {
    return parseInt(error.details.retryAfter) * 1000;
  }

  // 指数バックオフ
  const baseDelay = 1000; // 1秒
  const maxDelay = 30000; // 30秒
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);

  // ジッターを追加（±20%）
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return Math.round(delay + jitter);
};

/**
 * エラーメッセージのローカライズ（将来の拡張用）
 */
export const localizeError = (error: AppError, locale: string = 'ja'): string => {
  // 現在は日本語のみサポート
  return formatErrorMessage(error);
};

// エラーコンテキスト用の型定義
export interface ErrorContext {
  error: AppError | null;
  setError: (error: AppError | null) => void;
  clearError: () => void;
}