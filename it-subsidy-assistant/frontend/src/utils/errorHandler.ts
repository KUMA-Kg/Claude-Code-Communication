// エラーハンドリングユーティリティ

// エラータイプの定義
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  API = 'API',
  SUPABASE = 'SUPABASE',
  SOCKET = 'SOCKET',
  UNKNOWN = 'UNKNOWN'
}

// エラーレベルの定義
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// カスタムエラークラス
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public level: ErrorLevel,
    message: string,
    public code?: string,
    public details?: any,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// エラーメッセージの日本語化
const ERROR_MESSAGES: Record<string, string> = {
  // ネットワークエラー
  'NETWORK_ERROR': 'ネットワーク接続に問題があります',
  'TIMEOUT_ERROR': 'リクエストがタイムアウトしました',
  'OFFLINE_ERROR': 'オフライン状態です',
  
  // 認証エラー
  'AUTH_EXPIRED': 'セッションの有効期限が切れました',
  'AUTH_INVALID': '認証情報が無効です',
  'AUTH_REQUIRED': 'ログインが必要です',
  
  // 検証エラー
  'VALIDATION_REQUIRED': '必須項目が入力されていません',
  'VALIDATION_FORMAT': '入力形式が正しくありません',
  'VALIDATION_LENGTH': '文字数が制限を超えています',
  
  // APIエラー
  'API_NOT_FOUND': 'リソースが見つかりません',
  'API_CONFLICT': 'データの競合が発生しました',
  'API_RATE_LIMIT': 'リクエスト制限に達しました',
  
  // デフォルト
  'UNKNOWN_ERROR': '予期しないエラーが発生しました'
};

// エラーハンドラー
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCallbacks: Map<ErrorType, ((error: AppError) => void)[]> = new Map();

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // エラーリスナーの登録
  onError(type: ErrorType, callback: (error: AppError) => void): void {
    const callbacks = this.errorCallbacks.get(type) || [];
    callbacks.push(callback);
    this.errorCallbacks.set(type, callbacks);
  }

  // エラーリスナーの解除
  offError(type: ErrorType, callback?: (error: AppError) => void): void {
    if (!callback) {
      this.errorCallbacks.delete(type);
      return;
    }

    const callbacks = this.errorCallbacks.get(type) || [];
    const filtered = callbacks.filter(cb => cb !== callback);
    this.errorCallbacks.set(type, filtered);
  }

  // エラーの処理
  handleError(error: any): AppError {
    let appError: AppError;

    // AppErrorの場合はそのまま使用
    if (error instanceof AppError) {
      appError = error;
    } 
    // ネットワークエラー
    else if (error.code === 'ECONNABORTED' || error.message?.includes('Network')) {
      appError = new AppError(
        ErrorType.NETWORK,
        ErrorLevel.ERROR,
        ERROR_MESSAGES.NETWORK_ERROR,
        'NETWORK_ERROR',
        error
      );
    }
    // 認証エラー
    else if (error.status === 401 || error.code === 'AUTH_ERROR') {
      appError = new AppError(
        ErrorType.AUTH,
        ErrorLevel.WARNING,
        ERROR_MESSAGES.AUTH_REQUIRED,
        'AUTH_REQUIRED',
        error
      );
    }
    // バリデーションエラー
    else if (error.status === 422 || error.code === 'VALIDATION_ERROR') {
      appError = new AppError(
        ErrorType.VALIDATION,
        ErrorLevel.WARNING,
        error.message || ERROR_MESSAGES.VALIDATION_FORMAT,
        'VALIDATION_ERROR',
        error.details || error
      );
    }
    // APIエラー
    else if (error.status >= 400 && error.status < 500) {
      appError = new AppError(
        ErrorType.API,
        ErrorLevel.ERROR,
        error.message || ERROR_MESSAGES.API_NOT_FOUND,
        `API_${error.status}`,
        error
      );
    }
    // Supabaseエラー
    else if (error.message?.includes('Supabase') || error.code?.startsWith('PGRST')) {
      appError = new AppError(
        ErrorType.SUPABASE,
        ErrorLevel.ERROR,
        error.message || 'データベースエラーが発生しました',
        error.code,
        error
      );
    }
    // その他のエラー
    else {
      appError = new AppError(
        ErrorType.UNKNOWN,
        ErrorLevel.ERROR,
        error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
        'UNKNOWN',
        error
      );
    }

    // コールバックの実行
    const callbacks = this.errorCallbacks.get(appError.type) || [];
    callbacks.forEach(callback => {
      try {
        callback(appError);
      } catch (e) {
        console.error('Error in error callback:', e);
      }
    });

    // グローバルエラーコールバック
    const globalCallbacks = this.errorCallbacks.get(ErrorType.UNKNOWN) || [];
    globalCallbacks.forEach(callback => {
      try {
        callback(appError);
      } catch (e) {
        console.error('Error in global error callback:', e);
      }
    });

    return appError;
  }

  // リトライ可能なエラーかチェック
  isRetryable(error: AppError): boolean {
    if (!error.recoverable) return false;
    
    return [
      ErrorType.NETWORK,
      ErrorType.API
    ].includes(error.type) && 
    error.level !== ErrorLevel.CRITICAL;
  }

  // エラーメッセージの取得
  getErrorMessage(code: string): string {
    return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // エラーのログ出力
  logError(error: AppError): void {
    const logData = {
      timestamp: new Date().toISOString(),
      type: error.type,
      level: error.level,
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack
    };

    switch (error.level) {
      case ErrorLevel.INFO:
        console.info('[ERROR]', logData);
        break;
      case ErrorLevel.WARNING:
        console.warn('[ERROR]', logData);
        break;
      case ErrorLevel.ERROR:
      case ErrorLevel.CRITICAL:
        console.error('[ERROR]', logData);
        break;
    }

    // 本番環境では外部ログサービスに送信
    if (import.meta.env.PROD) {
      // TODO: Sentry、LogRocket等への送信
    }
  }
}

// シングルトンインスタンス
export const errorHandler = ErrorHandler.getInstance();

// 便利な関数
export const handleApiError = (error: any): AppError => {
  const appError = errorHandler.handleError(error);
  errorHandler.logError(appError);
  return appError;
};

export const isNetworkError = (error: any): boolean => {
  const appError = error instanceof AppError ? error : errorHandler.handleError(error);
  return appError.type === ErrorType.NETWORK;
};

export const isAuthError = (error: any): boolean => {
  const appError = error instanceof AppError ? error : errorHandler.handleError(error);
  return appError.type === ErrorType.AUTH;
};