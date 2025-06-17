import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoginRequest } from '../../types/api';

export const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginRequest>>({});
  const [submitError, setSubmitError] = useState<string>('');

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
      setSubmitError(
        error instanceof Error ? error.message : 'ログインに失敗しました'
      );
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6">ログイン</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {submitError}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full"
          >
            ログイン
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでない方は{' '}
            <a href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
              新規登録
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};