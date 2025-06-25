import { useState, useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface RealtimeNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    url?: string;
    callback?: () => void;
  };
}

interface UseRealtimeNotificationsReturn {
  notifications: RealtimeNotification[];
  unreadCount: number;
  isConnected: boolean;
  lastUpdated: Date | null;
  addNotification: (notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export function useRealtimeNotifications(): UseRealtimeNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // 通知を追加
  const addNotification = useCallback((notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: RealtimeNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // 最大50件
    setLastUpdated(new Date());

    // ブラウザ通知を表示（権限がある場合）
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: newNotification.id
      });
    }
  }, []);

  // 通知を既読にする
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // すべて既読にする
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // 通知を削除
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  }, []);

  // すべてクリア
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // 未読数を計算
  const unreadCount = notifications.filter(n => !n.read).length;

  // リアルタイム接続の設定
  useEffect(() => {
    if (!user) return;

    const realtimeChannel = supabase.channel(`notifications_${user.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'applications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('申請状況が更新されました:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const oldStatus = payload.old.status;
            const newStatus = payload.new.status;
            
            if (oldStatus !== newStatus) {
              let message = '';
              let type: 'info' | 'success' | 'warning' | 'error' = 'info';
              
              switch (newStatus) {
                case 'submitted':
                  message = '申請が正常に提出されました';
                  type = 'success';
                  break;
                case 'under_review':
                  message = '申請の審査が開始されました';
                  type = 'info';
                  break;
                case 'approved':
                  message = '申請が承認されました！';
                  type = 'success';
                  break;
                case 'rejected':
                  message = '申請が不承認となりました';
                  type = 'error';
                  break;
              }
              
              if (message) {
                addNotification({
                  type,
                  title: '申請状況の更新',
                  message,
                  action: {
                    label: '詳細を確認',
                    url: `/applications/${payload.new.id}`
                  }
                });
              }
            }
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matching_results',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('新しいマッチング結果:', payload);
          
          addNotification({
            type: 'success',
            title: 'AIマッチング完了',
            message: 'あなたにおすすめの補助金が見つかりました',
            action: {
              label: '結果を確認',
              url: '/matching-results'
            }
          });
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subsidies'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            // 締切が近づいた補助金の通知
            const subsidy = payload.new;
            const applicationEnd = new Date(subsidy.application_end);
            const now = new Date();
            const daysLeft = Math.ceil((applicationEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysLeft <= 7 && daysLeft > 0) {
              addNotification({
                type: 'warning',
                title: '締切間近の補助金',
                message: `${subsidy.name}の申請締切まであと${daysLeft}日です`,
                action: {
                  label: '詳細を確認',
                  url: `/subsidies/${subsidy.id}`
                }
              });
            }
          }
          
          if (payload.eventType === 'INSERT') {
            // 新しい補助金の通知
            const subsidy = payload.new;
            addNotification({
              type: 'info',
              title: '新しい補助金',
              message: `${subsidy.name}が追加されました`,
              action: {
                label: '詳細を確認',
                url: `/subsidies/${subsidy.id}`
              }
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('通知チャンネルの状態:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(realtimeChannel);

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [user, addNotification]);

  // ブラウザ通知の権限を要求
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('通知権限:', permission);
      });
    }
  }, []);

  // 定期的なヘルスチェック
  useEffect(() => {
    const healthCheck = setInterval(() => {
      if (channel && channel.state === 'joined') {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    }, 30000); // 30秒ごと

    return () => clearInterval(healthCheck);
  }, [channel]);

  // システム通知の例
  useEffect(() => {
    // アプリケーション起動時の通知
    const welcomeNotification = setTimeout(() => {
      if (user) {
        addNotification({
          type: 'info',
          title: 'ようこそ',
          message: 'IT補助金アシストツールへようこそ。リアルタイム更新が有効になりました。'
        });
      }
    }, 2000);

    return () => clearTimeout(welcomeNotification);
  }, [user, addNotification]);

  return {
    notifications,
    unreadCount,
    isConnected,
    lastUpdated,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };
}

// 特定の通知タイプ用のヘルパーフック
export function useApplicationStatusNotifications() {
  const { addNotification } = useRealtimeNotifications();

  const notifyStatusChange = useCallback((
    applicationId: string,
    oldStatus: string,
    newStatus: string,
    subsidyName: string
  ) => {
    let message = '';
    let type: 'info' | 'success' | 'warning' | 'error' = 'info';

    switch (newStatus) {
      case 'submitted':
        message = `${subsidyName}の申請が提出されました`;
        type = 'success';
        break;
      case 'under_review':
        message = `${subsidyName}の審査が開始されました`;
        type = 'info';
        break;
      case 'approved':
        message = `${subsidyName}の申請が承認されました！`;
        type = 'success';
        break;
      case 'rejected':
        message = `${subsidyName}の申請が不承認となりました`;
        type = 'error';
        break;
    }

    if (message) {
      addNotification({
        type,
        title: '申請状況の更新',
        message,
        action: {
          label: '詳細を確認',
          url: `/applications/${applicationId}`
        }
      });
    }
  }, [addNotification]);

  return { notifyStatusChange };
}

export function useDeadlineNotifications() {
  const { addNotification } = useRealtimeNotifications();

  const notifyUpcomingDeadline = useCallback((
    subsidyName: string,
    daysLeft: number,
    subsidyId: string
  ) => {
    let type: 'warning' | 'error' = 'warning';
    if (daysLeft <= 3) type = 'error';

    addNotification({
      type,
      title: '締切間近',
      message: `${subsidyName}の申請締切まであと${daysLeft}日です`,
      action: {
        label: '申請を開始',
        url: `/subsidies/${subsidyId}/apply`
      }
    });
  }, [addNotification]);

  return { notifyUpcomingDeadline };
}