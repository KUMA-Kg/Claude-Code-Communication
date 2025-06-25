import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthForm } from '../components/auth/AuthForm';
import { useAuth } from '../hooks/useAuth';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  
  // URLパラメータから初期モードを決定
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // 既にログイン済みの場合はリダイレクト
  useEffect(() => {
    if (!loading && user) {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, searchParams]);

  const handleModeToggle = () => {
    setMode(prevMode => prevMode === 'login' ? 'signup' : 'login');
  };

  const handleAuthSuccess = () => {
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    navigate(redirectTo, { replace: true });
  };

  // ローディング中の表示
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-large" />
        <p>認証状態を確認中...</p>
        
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          .loading-spinner-large {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // 既にログイン済みの場合は何も表示しない（リダイレクト処理中）
  if (user) {
    return null;
  }

  return (
    <AuthForm
      mode={mode}
      onToggleMode={handleModeToggle}
      onSuccess={handleAuthSuccess}
    />
  );
};