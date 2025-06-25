/**
 * Phase 1 エラーバウンダリコンポーネント
 * Reactアプリケーション全体のエラーハンドリング
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // エラーIDを生成（タイムスタンプベース）
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーログをコンソールに出力
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // エラー情報を状態に保存
    this.setState({
      error,
      errorInfo,
    });

    // 本番環境では外部エラー追跡サービスに送信
    if (process.env.NODE_ENV === 'production') {
      // TODO: Sentry等のエラー追跡サービスに送信
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // エラー情報を構造化
    const errorData = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // ローカルストレージにも保存（デバッグ用）
    try {
      const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      existingErrors.push(errorData);
      // 最新10件のみ保持
      if (existingErrors.length > 10) {
        existingErrors.shift();
      }
      localStorage.setItem('app_errors', JSON.stringify(existingErrors));
    } catch (e) {
      console.error('Failed to save error to localStorage:', e);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });

    // ページをリロード
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックが提供されている場合
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラー画面
      return (
        <div className="error-boundary-container" style={styles.container}>
          <div style={styles.content}>
            <h1 style={styles.title}>⚠️ エラーが発生しました</h1>
            
            <div style={styles.message}>
              <p>申し訳ございません。予期しないエラーが発生しました。</p>
              <p>問題が解決しない場合は、サポートまでお問い合わせください。</p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details style={styles.details}>
                <summary style={styles.summary}>エラー詳細（開発環境のみ）</summary>
                <div style={styles.errorDetails}>
                  <p><strong>エラーID:</strong> {this.state.errorId}</p>
                  <p><strong>エラーメッセージ:</strong></p>
                  <pre style={styles.errorText}>{this.state.error?.message}</pre>
                  <p><strong>スタックトレース:</strong></p>
                  <pre style={styles.errorText}>{this.state.error?.stack}</pre>
                  <p><strong>コンポーネントスタック:</strong></p>
                  <pre style={styles.errorText}>{this.state.errorInfo?.componentStack}</pre>
                </div>
              </details>
            )}

            <div style={styles.actions}>
              <button onClick={this.handleReset} style={styles.button}>
                ページを再読み込み
              </button>
              <button onClick={() => window.location.href = '/'} style={styles.secondaryButton}>
                ホームに戻る
              </button>
            </div>

            {process.env.NODE_ENV === 'production' && (
              <p style={styles.errorId}>
                エラーID: {this.state.errorId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// インラインスタイル（CSSが読み込めない場合でも表示されるように）
const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#d32f2f',
    textAlign: 'center' as const,
  },
  message: {
    marginBottom: '30px',
    lineHeight: '1.6',
    color: '#333',
    textAlign: 'center' as const,
  },
  details: {
    marginBottom: '30px',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '4px',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#666',
  },
  errorDetails: {
    marginTop: '15px',
  },
  errorText: {
    backgroundColor: '#f0f0f0',
    padding: '10px',
    borderRadius: '4px',
    overflow: 'auto',
    fontSize: '12px',
    fontFamily: 'monospace',
    marginBottom: '10px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  button: {
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  secondaryButton: {
    backgroundColor: '#757575',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  errorId: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#999',
    textAlign: 'center' as const,
  },
};

export default ErrorBoundary;