import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ user: User | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: { full_name?: string; company_name?: string }) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初期セッションの取得
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('セッション取得エラー:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('初期セッション取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('認証状態変更:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // ログイン時にユーザープロファイルを更新
        if (event === 'SIGNED_IN' && session?.user) {
          await updateLastLogin(session.user.id);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateLastLogin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) {
        console.error('最終ログイン時刻更新エラー:', error);
      }
    } catch (err) {
      console.error('最終ログイン時刻更新エラー:', err);
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      });

      if (!error && data.user) {
        // ユーザープロファイルの作成
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: metadata?.full_name || null,
            company_name: metadata?.company_name || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          });

        if (profileError) {
          console.error('プロファイル作成エラー:', profileError);
        }
      }

      return { user: data.user, error };
    } catch (err) {
      console.error('サインアップエラー:', err);
      return { user: null, error: err as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      return { user: data.user, error };
    } catch (err) {
      console.error('サインインエラー:', err);
      return { user: null, error: err as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        setUser(null);
        setSession(null);
      }
      
      return { error };
    } catch (err) {
      console.error('サインアウトエラー:', err);
      return { error: err as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      return { error };
    } catch (err) {
      console.error('パスワードリセットエラー:', err);
      return { error: err as AuthError };
    }
  };

  const updateProfile = async (updates: { full_name?: string; company_name?: string }) => {
    try {
      if (!user) {
        throw new Error('ユーザーがログインしていません');
      }

      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      return { error };
    } catch (err) {
      console.error('プロファイル更新エラー:', err);
      return { error: err as AuthError };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 認証が必要なページで使用するhook
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user && !redirecting) {
      setRedirecting(true);
      window.location.href = '/login';
    }
  }, [user, loading, redirecting]);

  return { user, loading: loading || redirecting };
}