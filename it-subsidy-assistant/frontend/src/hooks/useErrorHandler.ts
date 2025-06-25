/**
 * Phase 1 エラーハンドリングカスタムフック
 * エラー状態の管理と表示を簡単にする
 */

import { useState, useCallback, useEffect } from 'react';
import { AppError, handleError, getNotificationMethod, isRetryableError, getRetryDelay } from '../utils/error-handler';

interface UseErrorHandlerOptions {
  autoRetry?: boolean;
  maxRetries?: number;
  onError?: (error: AppError) => void;
  onRetry?: (attempt: number) => void;
}

interface UseErrorHandlerReturn {
  error: AppError | null;
  isError: boolean;
  errorMessage: string;
  setError: (error: any) => void;
  clearError: () => void;
  retry: () => void;
  isRetrying: boolean;
  retryCount: number;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  const {
    autoRetry = true,
    maxRetries = 3,
    onError,
    onRetry,
  } = options;

  const [error, setErrorState] = useState<AppError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeoutId, setRetryTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // エラーをセット
  const setError = useCallback((err: any) => {
    if (!err) {
      setErrorState(null);
      return;
    }

    const appError = handleError(err);
    setErrorState(appError);
    
    // コールバック実行
    if (onError) {
      onError(appError);
    }

    // 自動リトライの設定
    if (autoRetry && isRetryableError(appError) && retryCount < maxRetries) {
      const delay = getRetryDelay(appError, retryCount + 1);
      setIsRetrying(true);

      const timeoutId = setTimeout(() => {
        retry();
      }, delay);

      setRetryTimeoutId(timeoutId);
    }
  }, [autoRetry, maxRetries, retryCount, onError]);

  // エラーをクリア
  const clearError = useCallback(() => {
    setErrorState(null);
    setRetryCount(0);
    setIsRetrying(false);
    
    if (retryTimeoutId) {
      clearTimeout(retryTimeoutId);
      setRetryTimeoutId(null);
    }
  }, [retryTimeoutId]);

  // リトライ実行
  const retry = useCallback(() => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    setIsRetrying(false);
    
    if (onRetry) {
      onRetry(newRetryCount);
    }
  }, [retryCount, onRetry]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
    };
  }, [retryTimeoutId]);

  return {
    error,
    isError: !!error,
    errorMessage: error?.message || '',
    setError,
    clearError,
    retry,
    isRetrying,
    retryCount,
  };
};

// エラー表示コンポーネントで使用するフック
export const useErrorDisplay = (error: AppError | null) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayMethod, setDisplayMethod] = useState<'toast' | 'modal' | 'inline'>('inline');

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setDisplayMethod(getNotificationMethod(error));

      // トーストの場合は自動的に非表示にする
      if (getNotificationMethod(error) === 'toast') {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 5000);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    displayMethod,
    dismiss,
  };
};

// API呼び出しのエラーハンドリングを簡単にするフック
export const useApiCall = <T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseErrorHandlerOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const errorHandler = useErrorHandler(options);

  const execute = useCallback(async (...args: any[]) => {
    setLoading(true);
    errorHandler.clearError();

    try {
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      errorHandler.setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, errorHandler]);

  // リトライ時は最後の引数で再実行
  const [lastArgs, setLastArgs] = useState<any[]>([]);

  const executeWithArgs = useCallback(async (...args: any[]) => {
    setLastArgs(args);
    return execute(...args);
  }, [execute]);

  useEffect(() => {
    if (errorHandler.retryCount > 0 && lastArgs.length > 0) {
      execute(...lastArgs);
    }
  }, [errorHandler.retryCount, execute, lastArgs]);

  return {
    data,
    loading,
    error: errorHandler.error,
    execute: executeWithArgs,
    retry: errorHandler.retry,
    clearError: errorHandler.clearError,
    isRetrying: errorHandler.isRetrying,
  };
};