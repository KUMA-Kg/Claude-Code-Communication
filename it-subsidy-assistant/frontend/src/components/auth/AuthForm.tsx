import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, User, Building } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onToggleMode: () => void;
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onToggleMode, onSuccess }) => {
  const { signIn, signUp, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('メールアドレスとパスワードは必須です');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('有効なメールアドレスを入力してください');
      return false;
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return false;
    }

    if (mode === 'signup') {
      if (formData.password !== formData.confirmPassword) {
        setError('パスワードが一致しません');
        return false;
      }

      if (!formData.fullName.trim()) {
        setError('お名前を入力してください');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    try {
      if (mode === 'login') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          setError(error.message === 'Invalid login credentials' 
            ? 'メールアドレスまたはパスワードが正しくありません' 
            : error.message);
        } else {
          setSuccess('ログインしました');
          onSuccess?.();
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, {
          full_name: formData.fullName,
          company_name: formData.companyName
        });
        if (error) {
          setError(error.message === 'User already registered' 
            ? 'このメールアドレスは既に登録されています' 
            : error.message);
        } else {
          setSuccess('アカウントを作成しました。確認メールをご確認ください。');
        }
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error('認証エラー:', err);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="auth-form-container">
      <div className="auth-form-card">
        <div className="auth-form-header">
          <h1 className="auth-form-title">
            {isLogin ? 'ログイン' : 'アカウント作成'}
          </h1>
          <p className="auth-form-subtitle">
            {isLogin 
              ? 'IT補助金アシストツールにログインしてください' 
              : '新しいアカウントを作成してIT補助金申請を始めましょう'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  <User className="form-icon" />
                  お名前
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required={!isLogin}
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="山田太郎"
                />
              </div>

              <div className="form-group">
                <label htmlFor="companyName" className="form-label">
                  <Building className="form-icon" />
                  会社名（任意）
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="株式会社サンプル"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <Mail className="form-icon" />
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              placeholder="example@company.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <Lock className="form-icon" />
              パスワード
            </label>
            <div className="password-input-container">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="form-input password-input"
                placeholder="••••••••"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                <Lock className="form-icon" />
                パスワード（確認）
              </label>
              <div className="password-input-container">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required={!isLogin}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input password-input"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle"
                  aria-label={showConfirmPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-button"
          >
            {loading ? (
              <span className="loading-spinner" />
            ) : isLogin ? (
              'ログイン'
            ) : (
              'アカウント作成'
            )}
          </button>
        </form>

        <div className="auth-form-footer">
          <p className="auth-toggle-text">
            {isLogin ? 'アカウントをお持ちでない方は' : '既にアカウントをお持ちの方は'}
            <button
              type="button"
              onClick={onToggleMode}
              className="auth-toggle-button"
            >
              {isLogin ? 'アカウント作成' : 'ログイン'}
            </button>
          </p>

          {isLogin && (
            <button
              type="button"
              className="forgot-password-button"
              onClick={() => {
                // パスワードリセット機能の実装
                console.log('パスワードリセット機能は今後実装予定です');
              }}
            >
              パスワードをお忘れの方
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .auth-form-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem;
        }

        .auth-form-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          width: 100%;
          max-width: 400px;
        }

        .auth-form-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-form-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .auth-form-subtitle {
          color: #6b7280;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }

        .form-icon {
          width: 16px;
          height: 16px;
          color: #6b7280;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .password-input-container {
          position: relative;
        }

        .password-input {
          padding-right: 3rem;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
        }

        .password-toggle:hover {
          color: #374151;
          background-color: #f3f4f6;
        }

        .alert {
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.875rem;
        }

        .alert-error {
          background-color: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .alert-success {
          background-color: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .auth-submit-button {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.875rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .auth-submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .auth-submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .auth-form-footer {
          margin-top: 1.5rem;
          text-align: center;
        }

        .auth-toggle-text {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .auth-toggle-button {
          background: none;
          border: none;
          color: #3b82f6;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
          margin-left: 0.25rem;
        }

        .auth-toggle-button:hover {
          color: #1d4ed8;
        }

        .forgot-password-button {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 0.875rem;
          cursor: pointer;
          text-decoration: underline;
        }

        .forgot-password-button:hover {
          color: #374151;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 480px) {
          .auth-form-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};