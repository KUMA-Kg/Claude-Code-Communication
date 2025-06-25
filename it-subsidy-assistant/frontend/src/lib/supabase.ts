import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:3001';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'it-subsidy-assistant-frontend'
    }
  }
});

// リアルタイム更新のヘルパー関数
export const createRealtimeChannel = (channelName: string) => {
  return supabase.channel(channelName);
};

// セッション管理のヘルパー関数
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('セッション取得エラー:', error);
    return null;
  }
  return session;
};

// ユーザー情報取得
export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('ユーザー取得エラー:', error);
    return null;
  }
  return user;
};

// エラーハンドリングのヘルパー
export const handleSupabaseError = (error: any, context: string) => {
  console.error(`Supabase エラー (${context}):`, error);
  
  // エラータイプに応じた処理
  if (error?.code === 'PGRST301') {
    throw new Error('データが見つかりません');
  } else if (error?.code === 'PGRST116') {
    throw new Error('アクセス権限がありません');
  } else if (error?.message?.includes('JWT')) {
    throw new Error('認証が必要です');
  } else {
    throw new Error(error?.message || '予期しないエラーが発生しました');
  }
};

export default supabase;