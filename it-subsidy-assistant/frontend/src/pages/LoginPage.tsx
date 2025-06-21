import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../components/auth/LoginForm';

export const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-beige-50) 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 'var(--spacing-xl)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
        <div className="stat-card-icon" style={{ 
          width: '80px', 
          height: '80px', 
          margin: '0 auto var(--spacing-lg)',
          fontSize: '32px',
          fontWeight: 'bold'
        }}>
          IT
        </div>
        <h1 className="heading-2" style={{ marginBottom: 'var(--spacing-sm)' }}>
          IT補助金アシストツール
        </h1>
        <p className="body-large" style={{ color: 'var(--color-gray-600)' }}>
          補助金検索から申請資料作成まで一貫サポート
        </p>
      </div>

      <LoginForm />
      
      <div style={{ marginTop: 'var(--spacing-2xl)', textAlign: 'center' }}>
        <div className="body-small" style={{ color: 'var(--color-gray-600)' }}>
          <p>✨ 中小企業のIT導入を支援</p>
          <p>📊 最適な補助金をAIがマッチング</p>
          <p>📝 申請書類を自動生成</p>
        </div>
      </div>
    </div>
  );
};