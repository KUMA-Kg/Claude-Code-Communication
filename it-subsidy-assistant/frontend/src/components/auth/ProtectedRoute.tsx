import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ローディング中の表示
  if (loading) {
    return (
      fallback || (
        <div className="protected-route-loading">
          <div className="loading-spinner" />
          <p>認証中...</p>
          
          <style jsx>{`
            .protected-route-loading {
              min-height: 50vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 1rem;
            }

            .loading-spinner {
              width: 32px;
              height: 32px;
              border: 3px solid #e5e7eb;
              border-top: 3px solid #3b82f6;
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
      )
    );
  }

  // 未認証の場合はログインページにリダイレクト
  if (!user) {
    return (
      <Navigate 
        to={`/auth?redirect=${encodeURIComponent(location.pathname)}`}
        replace 
      />
    );
  }

  // 認証済みの場合は子要素を表示
  return <>{children}</>;
};