import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { supabaseService } from '@/config/database';
import { logger } from '@/utils/logger';
import { authenticateSocketToken } from '@/middleware/auth';

export interface RealtimeChannel {
  name: string;
  type: 'subsidy_updates' | 'deadline_alerts' | 'system_notifications';
  subscribers: Set<string>;
}

export class RealtimeSubsidyService {
  private io: SocketIOServer;
  private channels: Map<string, RealtimeChannel> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      }
    });

    this.setupSocketHandlers();
    this.initializeSupabaseRealtimeSubscriptions();
  }

  /**
   * Socket.IOのハンドラーをセットアップ
   */
  private setupSocketHandlers(): void {
    // 認証ミドルウェア
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const user = await authenticateSocketToken(token);
        
        if (!user) {
          return next(new Error('Authentication failed'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // 接続イベント
    this.io.on('connection', (socket) => {
      const userId = socket.data.user.id;
      logger.info(`User ${userId} connected via WebSocket`);

      // ユーザーのソケットを管理
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // チャンネル購読
      socket.on('subscribe', async (channelName: string) => {
        await this.subscribeToChannel(socket, channelName);
      });

      // チャンネル購読解除
      socket.on('unsubscribe', async (channelName: string) => {
        await this.unsubscribeFromChannel(socket, channelName);
      });

      // カスタムイベントの送信
      socket.on('send_notification', async (data: any) => {
        await this.handleCustomNotification(socket, data);
      });

      // 切断処理
      socket.on('disconnect', () => {
        logger.info(`User ${userId} disconnected`);
        this.userSockets.get(userId)?.delete(socket.id);
        
        if (this.userSockets.get(userId)?.size === 0) {
          this.userSockets.delete(userId);
        }

        // すべてのチャンネルから購読解除
        this.channels.forEach((channel) => {
          channel.subscribers.delete(socket.id);
        });
      });
    });
  }

  /**
   * Supabaseのリアルタイム購読を初期化
   */
  private initializeSupabaseRealtimeSubscriptions(): void {
    // 補助金更新の監視
    supabaseService
      .channel('subsidies-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subsidies'
        },
        (payload) => {
          this.handleSubsidyChange(payload);
        }
      )
      .subscribe();

    // スケジュール更新の監視
    supabaseService
      .channel('schedules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subsidy_schedules'
        },
        (payload) => {
          this.handleScheduleChange(payload);
        }
      )
      .subscribe();

    // アラート更新の監視
    supabaseService
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deadline_alerts'
        },
        (payload) => {
          this.handleNewAlert(payload);
        }
      )
      .subscribe();
  }

  /**
   * チャンネルに購読
   */
  private async subscribeToChannel(socket: any, channelName: string): Promise<void> {
    try {
      let channel = this.channels.get(channelName);

      if (!channel) {
        // チャンネルが存在しない場合は作成
        const channelType = this.determineChannelType(channelName);
        channel = {
          name: channelName,
          type: channelType,
          subscribers: new Set()
        };
        this.channels.set(channelName, channel);
      }

      channel.subscribers.add(socket.id);
      socket.join(channelName);

      // 購読成功を通知
      socket.emit('subscribed', {
        channel: channelName,
        message: `Successfully subscribed to ${channelName}`
      });

      logger.info(`Socket ${socket.id} subscribed to channel ${channelName}`);
    } catch (error) {
      logger.error('Failed to subscribe to channel:', error);
      socket.emit('error', {
        message: 'Failed to subscribe to channel'
      });
    }
  }

  /**
   * チャンネルから購読解除
   */
  private async unsubscribeFromChannel(socket: any, channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    
    if (channel) {
      channel.subscribers.delete(socket.id);
      socket.leave(channelName);

      // 購読者がいなくなったらチャンネルを削除
      if (channel.subscribers.size === 0) {
        this.channels.delete(channelName);
      }
    }

    socket.emit('unsubscribed', {
      channel: channelName,
      message: `Successfully unsubscribed from ${channelName}`
    });
  }

  /**
   * 補助金の変更を処理
   */
  private handleSubsidyChange(payload: any): void {
    const { eventType, new: newData, old: oldData } = payload;

    const notification = {
      type: 'subsidy_update',
      event: eventType,
      subsidyId: newData?.id || oldData?.id,
      data: {
        previous: oldData,
        current: newData
      },
      timestamp: new Date().toISOString()
    };

    // 全体通知チャンネルに送信
    this.broadcastToChannel('subsidy_updates', notification);

    // 個別の補助金チャンネルに送信
    const subsidyChannel = `subsidy:${notification.subsidyId}`;
    this.broadcastToChannel(subsidyChannel, notification);
  }

  /**
   * スケジュールの変更を処理
   */
  private handleScheduleChange(payload: any): void {
    const { eventType, new: newData, old: oldData } = payload;

    const notification = {
      type: 'schedule_update',
      event: eventType,
      subsidyId: newData?.subsidy_id || oldData?.subsidy_id,
      scheduleId: newData?.id || oldData?.id,
      data: {
        previous: oldData,
        current: newData
      },
      timestamp: new Date().toISOString()
    };

    // 締切アラートチャンネルに送信
    this.broadcastToChannel('deadline_alerts', notification);

    // 個別の補助金チャンネルにも送信
    const subsidyChannel = `subsidy:${notification.subsidyId}`;
    this.broadcastToChannel(subsidyChannel, notification);
  }

  /**
   * 新しいアラートを処理
   */
  private async handleNewAlert(payload: any): Promise<void> {
    const alert = payload.new;

    // アラート対象ユーザーの詳細情報を取得
    const { data: alertDetails } = await supabaseService
      .from('deadline_alerts')
      .select(`
        *,
        subsidies (name, subsidy_type),
        subsidy_schedules (
          schedule_type,
          round_name,
          end_date
        )
      `)
      .eq('id', alert.id)
      .single();

    if (!alertDetails) return;

    const notification = {
      type: 'deadline_alert',
      userId: alert.user_id,
      alertId: alert.id,
      subsidy: {
        id: alert.subsidy_id,
        name: alertDetails.subsidies.name
      },
      schedule: alertDetails.subsidy_schedules,
      settings: {
        alertType: alert.alert_type,
        daysBefore: alert.days_before
      },
      timestamp: new Date().toISOString()
    };

    // ユーザー専用チャンネルに送信
    this.sendToUser(alert.user_id, notification);
  }

  /**
   * カスタム通知を処理
   */
  private async handleCustomNotification(socket: any, data: any): Promise<void> {
    const { targetUserId, notification } = data;
    const senderId = socket.data.user.id;

    // 権限チェック（管理者のみ他ユーザーに通知可能）
    if (targetUserId !== senderId && socket.data.user.role !== 'admin') {
      socket.emit('error', {
        message: 'Unauthorized to send notifications to other users'
      });
      return;
    }

    const customNotification = {
      ...notification,
      senderId,
      timestamp: new Date().toISOString()
    };

    if (targetUserId) {
      this.sendToUser(targetUserId, customNotification);
    } else {
      this.broadcastToChannel('system_notifications', customNotification);
    }
  }

  /**
   * チャンネルタイプを判定
   */
  private determineChannelType(channelName: string): 'subsidy_updates' | 'deadline_alerts' | 'system_notifications' {
    if (channelName.startsWith('subsidy:')) {
      return 'subsidy_updates';
    } else if (channelName === 'deadline_alerts') {
      return 'deadline_alerts';
    } else {
      return 'system_notifications';
    }
  }

  /**
   * チャンネルにブロードキャスト
   */
  public broadcastToChannel(channelName: string, data: any): void {
    this.io.to(channelName).emit('notification', data);
    logger.info(`Broadcasted to channel ${channelName}:`, data);
  }

  /**
   * 特定のユーザーに送信
   */
  public sendToUser(userId: string, data: any): void {
    const userSockets = this.userSockets.get(userId);
    
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('notification', data);
      });
      logger.info(`Sent notification to user ${userId}:`, data);
    }
  }

  /**
   * システム全体に通知
   */
  public broadcastSystemNotification(notification: any): void {
    this.io.emit('system_notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 接続中のユーザー数を取得
   */
  public getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * チャンネルの購読者数を取得
   */
  public getChannelSubscribersCount(channelName: string): number {
    const channel = this.channels.get(channelName);
    return channel ? channel.subscribers.size : 0;
  }

  /**
   * サービスのシャットダウン
   */
  public shutdown(): void {
    // すべての接続を切断
    this.io.disconnectSockets();
    
    // Supabaseのリアルタイム購読を解除
    supabaseService.removeAllChannels();
    
    logger.info('RealtimeSubsidyService shutdown complete');
  }
}