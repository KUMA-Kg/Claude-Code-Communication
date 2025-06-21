import { supabase } from '@/config/supabase';
import { logger } from '@/utils/logger';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export interface ApplicationChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any;
  old: any;
  applicationId: string;
}

export interface DocumentStatusChangePayload {
  eventType: 'INSERT' | 'UPDATE';
  documentCode: string;
  applicationId: string;
  oldStatus?: string;
  newStatus: string;
  reviewerNotes?: string;
}

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map();

  /**
   * 申請ステータスの変更をリアルタイムで監視
   */
  static subscribeToApplicationChanges(
    companyId: string,
    onUpdate: (payload: ApplicationChangePayload) => void
  ): RealtimeSubscription {
    const channelName = `applications:company:${companyId}`;
    
    try {
      // 既存のチャンネルがあれば再利用
      let channel = this.channels.get(channelName);
      
      if (!channel) {
        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'applications',
              filter: `company_id=eq.${companyId}`
            },
            (payload: RealtimePostgresChangesPayload<any>) => {
              logger.info('Application change detected', {
                event: payload.eventType,
                applicationId: payload.new?.id || payload.old?.id
              });

              onUpdate({
                eventType: payload.eventType,
                new: payload.new,
                old: payload.old,
                applicationId: payload.new?.id || payload.old?.id
              });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.info(`Subscribed to application changes for company: ${companyId}`);
            }
          });

        this.channels.set(channelName, channel);
      }

      return {
        channel,
        unsubscribe: () => this.unsubscribeFromChannel(channelName)
      };
    } catch (error) {
      logger.error('Failed to subscribe to application changes:', error);
      throw error;
    }
  }

  /**
   * 書類アップロード状況をリアルタイムで監視
   */
  static subscribeToDocumentStatusChanges(
    applicationId: string,
    onUpdate: (payload: DocumentStatusChangePayload) => void
  ): RealtimeSubscription {
    const channelName = `documents:application:${applicationId}`;
    
    try {
      let channel = this.channels.get(channelName);
      
      if (!channel) {
        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'application_documents',
              filter: `application_id=eq.${applicationId}`
            },
            (payload: RealtimePostgresChangesPayload<any>) => {
              logger.info('Document status change detected', {
                event: payload.eventType,
                documentCode: payload.new?.document_code || payload.old?.document_code
              });

              if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                onUpdate({
                  eventType: payload.eventType,
                  documentCode: payload.new.document_code,
                  applicationId: payload.new.application_id,
                  oldStatus: payload.old?.status,
                  newStatus: payload.new.status,
                  reviewerNotes: payload.new.rejection_reason
                });
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.info(`Subscribed to document changes for application: ${applicationId}`);
            }
          });

        this.channels.set(channelName, channel);
      }

      return {
        channel,
        unsubscribe: () => this.unsubscribeFromChannel(channelName)
      };
    } catch (error) {
      logger.error('Failed to subscribe to document status changes:', error);
      throw error;
    }
  }

  /**
   * 複数企業の申請を一括監視（管理者用）
   */
  static subscribeToAllApplications(
    onUpdate: (payload: ApplicationChangePayload) => void
  ): RealtimeSubscription {
    const channelName = 'applications:all';
    
    try {
      let channel = this.channels.get(channelName);
      
      if (!channel) {
        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'applications'
            },
            (payload: RealtimePostgresChangesPayload<any>) => {
              logger.info('Global application change detected', {
                event: payload.eventType,
                applicationId: payload.new?.id || payload.old?.id
              });

              onUpdate({
                eventType: payload.eventType,
                new: payload.new,
                old: payload.old,
                applicationId: payload.new?.id || payload.old?.id
              });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.info('Subscribed to all application changes');
            }
          });

        this.channels.set(channelName, channel);
      }

      return {
        channel,
        unsubscribe: () => this.unsubscribeFromChannel(channelName)
      };
    } catch (error) {
      logger.error('Failed to subscribe to all applications:', error);
      throw error;
    }
  }

  /**
   * プレゼンス機能：同じ申請を編集中のユーザーを表示
   */
  static subscribeToApplicationPresence(
    applicationId: string,
    userId: string,
    userInfo: { name: string; email: string }
  ): RealtimeSubscription {
    const channelName = `presence:application:${applicationId}`;
    
    try {
      let channel = this.channels.get(channelName);
      
      if (!channel) {
        channel = supabase
          .channel(channelName)
          .on('presence', { event: 'sync' }, () => {
            const state = channel!.presenceState();
            logger.info('Presence sync:', { applicationId, users: Object.keys(state) });
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            logger.info('User joined:', { applicationId, userId: key, presences: newPresences });
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            logger.info('User left:', { applicationId, userId: key, presences: leftPresences });
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel!.track({
                userId,
                ...userInfo,
                online_at: new Date().toISOString()
              });
            }
          });

        this.channels.set(channelName, channel);
      }

      return {
        channel,
        unsubscribe: () => this.unsubscribeFromChannel(channelName)
      };
    } catch (error) {
      logger.error('Failed to subscribe to application presence:', error);
      throw error;
    }
  }

  /**
   * ブロードキャスト：申請に関するメッセージを送信
   */
  static async broadcastApplicationMessage(
    applicationId: string,
    message: {
      type: 'comment' | 'status_change' | 'document_upload';
      userId: string;
      userName: string;
      content: string;
      timestamp: string;
    }
  ): Promise<void> {
    const channelName = `broadcast:application:${applicationId}`;
    
    try {
      let channel = this.channels.get(channelName);
      
      if (!channel) {
        channel = supabase.channel(channelName);
        this.channels.set(channelName, channel);
      }

      await channel.send({
        type: 'broadcast',
        event: 'application_message',
        payload: message
      });

      logger.info('Broadcast message sent', { applicationId, messageType: message.type });
    } catch (error) {
      logger.error('Failed to broadcast message:', error);
      throw error;
    }
  }

  /**
   * チャンネルから購読解除
   */
  private static async unsubscribeFromChannel(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    
    if (channel) {
      await channel.unsubscribe();
      this.channels.delete(channelName);
      logger.info(`Unsubscribed from channel: ${channelName}`);
    }
  }

  /**
   * すべてのチャンネルから購読解除
   */
  static async unsubscribeAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.channels.keys()).map(channelName =>
      this.unsubscribeFromChannel(channelName)
    );

    await Promise.all(unsubscribePromises);
    logger.info('Unsubscribed from all channels');
  }

  /**
   * 接続状態の確認
   */
  static getConnectionStatus(): { channelName: string; state: string }[] {
    return Array.from(this.channels.entries()).map(([name, channel]) => ({
      channelName: name,
      state: channel.state
    }));
  }
}