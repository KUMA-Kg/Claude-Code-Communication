/**
 * Phase 1 エラー表示コンポーネント
 * エラーの種類に応じた適切な表示方法を提供
 */

import React from 'react';
import { AppError, ErrorLevel, ErrorType, formatErrorMessage } from '../utils/error-handler';
import { useErrorDisplay } from '../hooks/useErrorHandler';

interface ErrorDisplayProps {
  error: AppError | null;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onDismiss, className = '' }) => {
  const { isVisible, displayMethod, dismiss } = useErrorDisplay(error);

  const handleDismiss = () => {
    dismiss();
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!error || !isVisible) {
    return null;
  }

  const message = formatErrorMessage(error);

  // エラーレベルに基づくスタイル
  const getErrorStyles = () => {
    switch (error.level) {
      case ErrorLevel.INFO:
        return {
          container: 'error-display-info',
          icon: 'ℹ️',
          color: '#0288d1',
          backgroundColor: '#e1f5fe',
          borderColor: '#01579b',
        };
      case ErrorLevel.WARNING:
        return {
          container: 'error-display-warning',
          icon: '⚠️',
          color: '#f57c00',
          backgroundColor: '#fff3e0',
          borderColor: '#e65100',
        };
      case ErrorLevel.ERROR:
        return {
          container: 'error-display-error',
          icon: '❌',
          color: '#d32f2f',
          backgroundColor: '#ffebee',
          borderColor: '#b71c1c',
        };
      case ErrorLevel.CRITICAL:
        return {
          container: 'error-display-critical',
          icon: '🚨',
          color: '#b71c1c',
          backgroundColor: '#ffcdd2',
          borderColor: '#880e4f',
        };
      default:
        return {
          container: 'error-display-default',
          icon: '❗',
          color: '#424242',
          backgroundColor: '#f5f5f5',
          borderColor: '#212121',
        };
    }
  };

  const styles = getErrorStyles();

  // インライン表示
  if (displayMethod === 'inline') {
    return (
      <div
        className={`error-display error-display-inline ${styles.container} ${className}`}
        style={{
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: '4px',
          border: `1px solid ${styles.borderColor}`,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          display: 'flex',
          alignItems: 'start',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '20px', lineHeight: '1' }}>{styles.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }}>{message}</div>
          {error.details && process.env.NODE_ENV === 'development' && (
            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
              詳細: {JSON.stringify(error.details)}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: styles.color,
              padding: '0 4px',
            }}
            aria-label="エラーを閉じる"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  // トースト表示
  if (displayMethod === 'toast') {
    return (
      <div
        className={`error-display error-display-toast ${styles.container} ${className}`}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          maxWidth: '400px',
          padding: '16px 20px',
          borderRadius: '8px',
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'start',
          gap: '12px',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out',
        }}
      >
        <span style={{ fontSize: '24px', lineHeight: '1' }}>{styles.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {error.type === ErrorType.NETWORK ? 'ネットワークエラー' : 'エラー'}
          </div>
          <div>{message}</div>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            color: styles.color,
            padding: '0',
          }}
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    );
  }

  // モーダル表示
  if (displayMethod === 'modal') {
    return (
      <>
        <div
          className="error-display-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998,
          }}
          onClick={handleDismiss}
        />
        <div
          className={`error-display error-display-modal ${styles.container} ${className}`}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 9999,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '48px' }}>{styles.icon}</span>
          </div>
          <h2 style={{ color: styles.color, marginBottom: '16px', textAlign: 'center' }}>
            エラーが発生しました
          </h2>
          <p style={{ marginBottom: '24px', lineHeight: '1.6' }}>{message}</p>
          
          {error.statusCode && (
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              エラーコード: {error.statusCode}
            </p>
          )}
          
          {error.id && process.env.NODE_ENV === 'production' && (
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '24px' }}>
              エラーID: {error.id}
            </p>
          )}
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleDismiss}
              style={{
                backgroundColor: styles.color,
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              閉じる
            </button>
            {error.type === ErrorType.NETWORK && (
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#fff',
                  color: styles.color,
                  border: `2px solid ${styles.color}`,
                  padding: '12px 24px',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = styles.backgroundColor;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                }}
              >
                再読み込み
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  return null;
};

// アニメーション用のスタイル
const animationStyles = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// スタイルをheadに追加
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
}

export default ErrorDisplay;