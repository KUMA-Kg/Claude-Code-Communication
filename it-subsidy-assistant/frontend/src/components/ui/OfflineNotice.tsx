import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { checkApiHealth } from '../../lib/api';

export const OfflineNotice: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiConnected, setApiConnected] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // ブラウザのオンライン/オフライン状態を監視
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // API接続状態を定期的にチェック
    const checkConnection = async () => {
      const connected = await checkApiHealth();
      setApiConnected(connected);
    };

    // 初回チェック
    checkConnection();

    // 30秒ごとにチェック
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    const connected = await checkApiHealth();
    setApiConnected(connected);
    setIsRetrying(false);
  };

  if (isOnline && apiConnected) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'var(--spacing-lg)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9998,
      maxWidth: '90vw',
    }}>
      <div className="alert alert-warning" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md) var(--spacing-lg)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flex: 1 }}>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0 }}
          >
            <path 
              d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM10 5C10.5523 5 11 5.44772 11 6V10C11 10.5523 10.5523 11 10 11C9.44772 11 9 10.5523 9 10V6C9 5.44772 9.44772 5 10 5ZM10 15C9.44772 15 9 14.5523 9 14C9 13.4477 9.44772 13 10 13C10.5523 13 11 13.4477 11 14C11 14.5523 10.5523 15 10 15Z" 
              fill="currentColor"
            />
          </svg>
          <span className="body-medium">
            {!isOnline ? 'インターネット接続がありません' : 'サーバーに接続できません'}
          </span>
        </div>
        {isOnline && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRetry}
            isLoading={isRetrying}
            style={{ flexShrink: 0 }}
          >
            再接続
          </Button>
        )}
      </div>
    </div>
  );
};