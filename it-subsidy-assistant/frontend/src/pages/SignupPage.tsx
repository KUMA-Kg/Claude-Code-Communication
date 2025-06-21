import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SignupForm } from '../components/auth/SignupForm';

export const SignupPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-neutral-50)',
      padding: 'var(--spacing-lg)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        gap: 'var(--spacing-xl)',
        alignItems: 'center',
      }}>
        <div style={{
          flex: 1,
          display: 'none',
          '@media (min-width: 768px)': {
            display: 'block',
          },
        }}>
          <h1 className="heading-1" style={{ 
            marginBottom: 'var(--spacing-lg)',
            color: 'var(--color-primary-900)',
          }}>
            IT補助金アシストツール
          </h1>
          <p className="body-large" style={{
            color: 'var(--color-primary-700)',
            marginBottom: 'var(--spacing-md)',
          }}>
            補助金申請を効率化し、あなたのビジネスの成長をサポートします
          </p>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-sm)',
          }}>
            <li className="body-medium" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              color: 'var(--color-primary-600)',
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
              </svg>
              最新の補助金情報を簡単検索
            </li>
            <li className="body-medium" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              color: 'var(--color-primary-600)',
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
              </svg>
              申請書類の自動生成
            </li>
            <li className="body-medium" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              color: 'var(--color-primary-600)',
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
              </svg>
              専門的なサポート体制
            </li>
          </ul>
        </div>
        
        <div style={{
          flex: 1,
          maxWidth: '500px',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <SignupForm />
        </div>
      </div>
    </div>
  );
};