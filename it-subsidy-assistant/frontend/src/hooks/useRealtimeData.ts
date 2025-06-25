import { useState, useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, createRealtimeChannel } from '../lib/supabase';
import { Database } from '../types/database';

type TableName = keyof Database['public']['Tables'];
type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

interface UseRealtimeDataOptions<T> {
  table: TableName;
  filter?: string;
  select?: string;
  initialData?: T[];
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export function useRealtimeData<T = any>({
  table,
  filter,
  select = '*',
  initialData = [],
  onInsert,
  onUpdate,
  onDelete
}: UseRealtimeDataOptions<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // 初期データの取得
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(table).select(select);
      
      if (filter) {
        // フィルターの適用（例: "user_id=eq.123"）
        const [column, operator, value] = filter.split('.');
        query = query.filter(column, operator, value);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setData(result as T[]);
    } catch (err) {
      console.error('初期データ取得エラー:', err);
      setError(err instanceof Error ? err.message : '初期データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [table, select, filter]);

  // リアルタイム購読の設定
  useEffect(() => {
    fetchInitialData();

    // チャンネルの作成
    const realtimeChannel = createRealtimeChannel(`${table}_changes`);

    // テーブルの変更を監視
    realtimeChannel
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: table,
          filter: filter 
        }, 
        (payload) => {
          console.log('リアルタイム更新:', payload);

          switch (payload.eventType) {
            case 'INSERT':
              setData(prev => [...prev, payload.new as T]);
              onInsert?.(payload);
              break;

            case 'UPDATE':
              setData(prev => 
                prev.map(item => 
                  (item as any).id === payload.new.id ? payload.new as T : item
                )
              );
              onUpdate?.(payload);
              break;

            case 'DELETE':
              setData(prev => 
                prev.filter(item => (item as any).id !== payload.old.id)
              );
              onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('リアルタイム接続状態:', status);
        if (status === 'SUBSCRIBED') {
          console.log(`${table}テーブルのリアルタイム更新を開始しました`);
        }
      });

    setChannel(realtimeChannel);

    // クリーンアップ
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [table, filter, select, fetchInitialData, onInsert, onUpdate, onDelete]);

  // 手動でデータを再取得
  const refetch = useCallback(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // データの追加
  const insertData = useCallback(async (newData: Partial<T>) => {
    try {
      const { data: result, error: insertError } = await supabase
        .from(table)
        .insert(newData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return result;
    } catch (err) {
      console.error('データ挿入エラー:', err);
      throw err;
    }
  }, [table]);

  // データの更新
  const updateData = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      const { data: result, error: updateError } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return result;
    } catch (err) {
      console.error('データ更新エラー:', err);
      throw err;
    }
  }, [table]);

  // データの削除
  const deleteData = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }
    } catch (err) {
      console.error('データ削除エラー:', err);
      throw err;
    }
  }, [table]);

  return {
    data,
    loading,
    error,
    refetch,
    insertData,
    updateData,
    deleteData,
    isConnected: channel?.state === 'joined'
  };
}

// 特定のテーブル用のカスタムフック
export const useSubsidies = () => {
  return useRealtimeData({
    table: 'subsidies',
    select: '*',
    onUpdate: (payload) => {
      console.log('補助金情報が更新されました:', payload.new);
    }
  });
};

export const useUserApplications = (userId: string) => {
  return useRealtimeData({
    table: 'applications',
    filter: `user_id.eq.${userId}`,
    select: '*, subsidies(*)',
    onUpdate: (payload) => {
      // ステータス変更の通知
      if (payload.old.status !== payload.new.status) {
        console.log('申請ステータスが変更されました:', {
          from: payload.old.status,
          to: payload.new.status
        });
      }
    }
  });
};

export const useMatchingResults = (userId: string) => {
  return useRealtimeData({
    table: 'matching_results',
    filter: `user_id.eq.${userId}`,
    select: '*',
    onInsert: (payload) => {
      console.log('新しいマッチング結果が生成されました:', payload.new);
    }
  });
};