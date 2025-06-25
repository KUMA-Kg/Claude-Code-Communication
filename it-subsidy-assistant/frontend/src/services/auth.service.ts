import { apiService, ApiResponse } from './api.service';
import { API_CONFIG } from '../config/api.config';
import { supabase } from '../lib/supabase';

// 認証関連の型定義
export interface User {
  id: string;
  email: string;
  name?: string;
  company_name?: string;
  role: 'user' | 'admin' | 'moderator';
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  email_verified: boolean;
  last_login?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  company_name?: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export interface UpdateProfileRequest {
  name?: string;
  company_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// 認証サービスクラス
export class AuthService {
  private static instance: AuthService;
  private tokenRefreshTimer?: NodeJS.Timeout;
  private currentUser: User | null = null;

  private constructor() {
    this.initializeAuth();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // 初期化処理
  private async initializeAuth(): Promise<void> {
    // Supabaseのセッションをチェック
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session && !error) {
      this.setAuthData({
        user: this.mapSupabaseUser(session.user),
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in || 3600
      });
    }

    // セッション変更の監視
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        this.setAuthData({
          user: this.mapSupabaseUser(session.user),
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in || 3600
        });
      } else {
        this.clearAuthData();
      }
    });
  }

  // Supabaseユーザーをアプリのユーザー型にマッピング
  private mapSupabaseUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: supabaseUser.user_metadata?.name,
      company_name: supabaseUser.user_metadata?.company_name,
      role: supabaseUser.user_metadata?.role || 'user',
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      phone: supabaseUser.user_metadata?.phone,
      created_at: supabaseUser.created_at,
      updated_at: supabaseUser.updated_at || supabaseUser.created_at,
      email_verified: supabaseUser.email_confirmed_at !== null,
      last_login: supabaseUser.last_sign_in_at
    };
  }

  // ログイン
  async login(request: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // Supabaseでログイン
      const { data, error } = await supabase.auth.signInWithPassword({
        email: request.email,
        password: request.password
      });

      if (error) {
        return {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: this.getAuthErrorMessage(error.message)
          }
        };
      }

      if (!data.session) {
        return {
          success: false,
          error: {
            code: 'NO_SESSION',
            message: 'セッションの作成に失敗しました'
          }
        };
      }

      const authResponse: AuthResponse = {
        user: this.mapSupabaseUser(data.user),
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in || 3600
      };

      this.setAuthData(authResponse);

      // バックエンドAPIにもログイン情報を送信（オプション）
      await apiService.post(API_CONFIG.api.endpoints.auth.login, {
        supabase_user_id: data.user.id,
        email: data.user.email
      });

      return {
        success: true,
        data: authResponse
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: 'ログインに失敗しました'
        }
      };
    }
  }

  // サインアップ
  async signup(request: SignupRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // Supabaseでサインアップ
      const { data, error } = await supabase.auth.signUp({
        email: request.email,
        password: request.password,
        options: {
          data: {
            name: request.name,
            company_name: request.company_name,
            phone: request.phone,
            role: 'user'
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: {
            code: 'SIGNUP_ERROR',
            message: this.getAuthErrorMessage(error.message)
          }
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: {
            code: 'NO_USER',
            message: 'ユーザーの作成に失敗しました'
          }
        };
      }

      // メール確認が必要な場合
      if (!data.session) {
        return {
          success: true,
          data: {
            user: this.mapSupabaseUser(data.user),
            access_token: '',
            expires_in: 0
          },
          message: '確認メールを送信しました。メールを確認してください。'
        };
      }

      const authResponse: AuthResponse = {
        user: this.mapSupabaseUser(data.user),
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in || 3600
      };

      this.setAuthData(authResponse);

      // バックエンドAPIにもユーザー情報を登録（オプション）
      await apiService.post(API_CONFIG.api.endpoints.auth.signup, {
        supabase_user_id: data.user.id,
        email: data.user.email,
        name: request.name,
        company_name: request.company_name,
        phone: request.phone
      });

      return {
        success: true,
        data: authResponse
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SIGNUP_ERROR',
          message: 'アカウントの作成に失敗しました'
        }
      };
    }
  }

  // ログアウト
  async logout(): Promise<ApiResponse<void>> {
    try {
      // Supabaseからログアウト
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error);
      }

      // バックエンドAPIにもログアウトを通知（オプション）
      await apiService.post(API_CONFIG.api.endpoints.auth.logout);

      this.clearAuthData();

      return {
        success: true
      };
    } catch (error) {
      // エラーが発生してもローカルのデータはクリア
      this.clearAuthData();
      
      return {
        success: true
      };
    }
  }

  // プロフィール更新
  async updateProfile(request: UpdateProfileRequest): Promise<ApiResponse<User>> {
    try {
      // Supabaseでユーザー情報を更新
      const { data, error } = await supabase.auth.updateUser({
        data: request
      });

      if (error) {
        return {
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: 'プロフィールの更新に失敗しました'
          }
        };
      }

      const updatedUser = this.mapSupabaseUser(data.user);
      this.currentUser = updatedUser;

      // バックエンドAPIにも更新を通知（オプション）
      await apiService.put(API_CONFIG.api.endpoints.auth.updateProfile, request);

      return {
        success: true,
        data: updatedUser
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'プロフィールの更新に失敗しました'
        }
      };
    }
  }

  // パスワードリセット
  async resetPassword(request: ResetPasswordRequest): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return {
          success: false,
          error: {
            code: 'RESET_ERROR',
            message: 'パスワードリセットメールの送信に失敗しました'
          }
        };
      }

      return {
        success: true,
        message: 'パスワードリセット用のメールを送信しました'
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RESET_ERROR',
          message: 'パスワードリセットに失敗しました'
        }
      };
    }
  }

  // パスワード変更
  async changePassword(request: ChangePasswordRequest): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: request.new_password
      });

      if (error) {
        return {
          success: false,
          error: {
            code: 'CHANGE_ERROR',
            message: 'パスワードの変更に失敗しました'
          }
        };
      }

      return {
        success: true,
        message: 'パスワードが変更されました'
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CHANGE_ERROR',
          message: 'パスワードの変更に失敗しました'
        }
      };
    }
  }

  // トークンリフレッシュ
  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return {
          success: false,
          error: {
            code: 'REFRESH_ERROR',
            message: 'セッションの更新に失敗しました'
          }
        };
      }

      if (!data.session) {
        return {
          success: false,
          error: {
            code: 'NO_SESSION',
            message: 'セッションが見つかりません'
          }
        };
      }

      const authResponse: AuthResponse = {
        user: this.mapSupabaseUser(data.user),
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in || 3600
      };

      this.setAuthData(authResponse);

      return {
        success: true,
        data: authResponse
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REFRESH_ERROR',
          message: 'トークンの更新に失敗しました'
        }
      };
    }
  }

  // 現在のユーザー取得
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // ログイン状態確認
  isAuthenticated(): boolean {
    return !!this.currentUser && !!localStorage.getItem('auth-token');
  }

  // アクセストークン取得
  getAccessToken(): string | null {
    return localStorage.getItem('auth-token');
  }

  // 権限チェック
  hasRole(role: string | string[]): boolean {
    if (!this.currentUser) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(this.currentUser.role);
  }

  // 認証データの設定
  private setAuthData(authData: AuthResponse): void {
    this.currentUser = authData.user;
    localStorage.setItem('auth-token', authData.access_token);
    
    if (authData.refresh_token) {
      localStorage.setItem('refresh-token', authData.refresh_token);
    }

    // トークン自動更新の設定
    this.setupTokenRefresh(authData.expires_in);
  }

  // 認証データのクリア
  private clearAuthData(): void {
    this.currentUser = null;
    localStorage.removeItem('auth-token');
    localStorage.removeItem('refresh-token');
    
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
  }

  // トークン自動更新の設定
  private setupTokenRefresh(expiresIn: number): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    // 有効期限の5分前に更新
    const refreshTime = (expiresIn - 300) * 1000;
    
    this.tokenRefreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshTime);
  }

  // エラーメッセージの日本語化
  private getAuthErrorMessage(errorMessage: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
      'Email not confirmed': 'メールアドレスが確認されていません',
      'User already registered': 'このメールアドレスは既に登録されています',
      'Password should be at least 6 characters': 'パスワードは6文字以上で入力してください',
      'User not found': 'ユーザーが見つかりません',
      'Invalid email': '有効なメールアドレスを入力してください'
    };

    return errorMap[errorMessage] || errorMessage;
  }
}

// シングルトンインスタンスをエクスポート
export const authService = AuthService.getInstance();