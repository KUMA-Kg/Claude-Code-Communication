import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ApiError } from '../../lib/api';

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, apiConnected, checkApiConnection } = useAuth();
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<SignupFormData>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // フィールドエラーをクリア
    if (errors[name as keyof SignupFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SignupFormData> = {};

    if (!formData.name) {
      newErrors.name = '名前は必須です';
    } else if (formData.name.length < 2) {
      newErrors.name = '名前は2文字以上で入力してください';
    }

    if (!formData.email) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードは必須です';
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'パスワードは小文字、大文字、数字、特殊文字を含む必要があります';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワード確認は必須です';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
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
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
        
        // ネットワークエラーの場合、接続状態を再確認
        if (error.code === 'NETWORK_ERROR') {
          checkApiConnection();
        }
      } else {
        setSubmitError(
          error instanceof Error ? error.message : '新規登録に失敗しました'
        );
      }
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      <div className="card">
        <div className="card-body">
          <h2 className="heading-3 text-center mb-lg">新規登録</h2>
        
          <form onSubmit={handleSubmit}>
            <Input
              type="text"
              name="name"
              label="名前"
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
              placeholder="山田 太郎"
              autoComplete="name"
              required
            />

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
              placeholder="8文字以上（大小文字・数字・特殊文字含む）"
              autoComplete="new-password"
              required
            />

            <Input
              type="password"
              name="confirmPassword"
              label="パスワード確認"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              placeholder="パスワードを再入力"
              autoComplete="new-password"
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
              {apiConnected ? '新規登録' : 'サーバーに接続できません'}
            </Button>
          </form>

          <div className="text-center mt-lg">
            <p className="body-small">
              既にアカウントをお持ちの方は{' '}
              <a href="/login" style={{ 
                color: 'var(--color-primary-600)', 
                fontWeight: 'var(--font-weight-medium)',
                textDecoration: 'none'
              }} 
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                ログイン
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};