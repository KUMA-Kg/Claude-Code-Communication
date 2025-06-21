import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoginRequest } from '../../types/api';
import { ApiError } from '../../lib/api';

export const LoginForm: React.FC = () => {
  const { login, isLoading, apiConnected, checkApiConnection } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginRequest>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field error when user starts typing
    if (errors[name as keyof LoginRequest]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginRequest> = {};

    if (!formData.email) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードは必須です';
    } else if (formData.password.length < 6) {
      newErrors.password = 'パスワードは6文字以上で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
        
        // ネットワークエラーの場合、接続状態を再確認
        if (error.code === 'NETWORK_ERROR') {
          checkApiConnection();
        }
      } else {
        setSubmitError(
          error instanceof Error ? error.message : 'ログインに失敗しました'
        );
      }
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      <div className="card">
        <div className="card-body">
          <h2 className="heading-3 text-center mb-lg">ログイン</h2>
        
          <form onSubmit={handleSubmit}>
          <Input
            type="email"
            name="email"
            label="メールアドレス"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            placeholder="example@company.com"
            autoComplete="email"
            required
          />

          <Input
            type="password"
            name="password"
            label="パスワード"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            placeholder="パスワードを入力"
            autoComplete="current-password"
            required
          />

          {submitError && (
            <div className="alert alert-error">
              <div style={{ marginBottom: '8px' }}>{submitError}</div>
              {!apiConnected && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    setIsRetrying(true);
                    const connected = await checkApiConnection();
                    if (connected) {
                      setSubmitError('');
                    }
                    setIsRetrying(false);
                  }}
                  isLoading={isRetrying}
                  style={{ marginTop: '8px' }}
                >
                  接続を再試行
                </Button>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={!apiConnected}
            style={{ width: '100%' }}
          >
            {apiConnected ? 'ログイン' : 'サーバーに接続できません'}
          </Button>
          </form>

          <div className="text-center mt-lg">
            <p className="body-small">
              アカウントをお持ちでない方は{' '}
              <a href="/signup" style={{ 
                color: 'var(--color-primary-600)', 
                fontWeight: 'var(--font-weight-medium)',
                textDecoration: 'none'
              }} 
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                新規登録
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};