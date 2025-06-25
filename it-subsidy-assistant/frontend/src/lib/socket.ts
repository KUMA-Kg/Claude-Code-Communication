import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api.config';

// Socket.ioクライアントのインスタンス
let socket: Socket | null = null;

// Socket接続の設定
export const initializeSocket = (token?: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  // WebSocketエンドポイントの構築
  const wsUrl = API_CONFIG.api.baseUrl.replace(/^http/, 'ws');

  socket = io(wsUrl, {
    transports: ['websocket', 'polling'],
    auth: token ? { token } : undefined,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // 接続イベントのリスナー
  socket.on('connect', () => {
    console.log('Socket.io connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket.io disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.io connection error:', error.message);
  });

  return socket;
};

// Socket切断
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Socket取得
export const getSocket = (): Socket | null => {
  return socket;
};

// カスタムイベントリスナーの登録
export const subscribeToEvent = (eventName: string, callback: (...args: any[]) => void): void => {
  if (socket) {
    socket.on(eventName, callback);
  }
};

// カスタムイベントリスナーの解除
export const unsubscribeFromEvent = (eventName: string, callback?: (...args: any[]) => void): void => {
  if (socket) {
    if (callback) {
      socket.off(eventName, callback);
    } else {
      socket.off(eventName);
    }
  }
};

// イベントの送信
export const emitEvent = (eventName: string, data?: any): void => {
  if (socket?.connected) {
    socket.emit(eventName, data);
  }
};

// リアルタイム補助金更新のサブスクリプション
export const subscribeToSubsidyUpdates = (callback: (data: any) => void): void => {
  subscribeToEvent('subsidy:update', callback);
  subscribeToEvent('subsidy:new', callback);
  subscribeToEvent('subsidy:delete', callback);
};

// AIマッチング進捗のサブスクリプション
export const subscribeToMatchingProgress = (callback: (progress: any) => void): void => {
  subscribeToEvent('matching:progress', callback);
  subscribeToEvent('matching:complete', callback);
  subscribeToEvent('matching:error', callback);
};

// 認証状態の同期
export const syncAuthState = (userId: string | null): void => {
  if (socket?.connected) {
    if (userId) {
      emitEvent('auth:login', { userId });
    } else {
      emitEvent('auth:logout');
    }
  }
};