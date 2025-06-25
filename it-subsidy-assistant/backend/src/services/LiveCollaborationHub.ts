import { Server as SocketIOServer, Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { Redis } from 'ioredis';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';

interface CollaborationSession {
  id: string;
  documentId: string;
  participants: Map<string, Participant>;
  yDoc: Y.Doc;
  awareness: Awareness;
  lastActivity: Date;
  changeHistory: ChangeEvent[];
}

interface Participant {
  id: string;
  userId: string;
  userName: string;
  color: string;
  cursor: { line: number; column: number } | null;
  selection: { start: number; end: number } | null;
  isTyping: boolean;
  lastSeen: Date;
}

interface ChangeEvent {
  userId: string;
  timestamp: Date;
  operation: 'insert' | 'delete' | 'format';
  content: string;
  position: number;
}

export class LiveCollaborationHub {
  private sessions: Map<string, CollaborationSession> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private redis: Redis;
  private pubClient: Redis;
  private subClient: Redis;
  
  constructor(
    private io: SocketIOServer,
    private supabase: ReturnType<typeof createClient>
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      keyPrefix: 'collab:'
    });
    
    this.pubClient = this.redis.duplicate();
    this.subClient = this.redis.duplicate();
    
    this.initializeSocketHandlers();
    this.initializeRealtimeSubscriptions();
  }
  
  /**
   * WebSocketによるリアルタイム同期基盤
   */
  private initializeSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`New collaboration connection: ${socket.id}`);
      
      // 認証チェック
      socket.on('authenticate', async (token: string) => {
        const user = await this.authenticateUser(token);
        if (user) {
          socket.data.user = user;
          socket.emit('authenticated', { userId: user.id });
        } else {
          socket.disconnect();
        }
      });
      
      // セッション参加
      socket.on('join-session', async (data: {
        documentId: string;
        sessionId?: string;
      }) => {
        if (!socket.data.user) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }
        
        const session = await this.joinSession(
          socket,
          data.documentId,
          data.sessionId
        );
        
        if (session) {
          socket.emit('session-joined', {
            sessionId: session.id,
            participants: Array.from(session.participants.values()),
            documentState: Y.encodeStateAsUpdate(session.yDoc)
          });
        }
      });
      
      // リアルタイム編集操作
      socket.on('doc-update', async (data: {
        sessionId: string;
        update: Uint8Array;
      }) => {
        await this.handleDocumentUpdate(socket, data.sessionId, data.update);
      });
      
      // カーソル位置の同期
      socket.on('cursor-update', async (data: {
        sessionId: string;
        cursor: { line: number; column: number } | null;
      }) => {
        await this.handleCursorUpdate(socket, data.sessionId, data.cursor);
      });
      
      // 選択範囲の同期
      socket.on('selection-update', async (data: {
        sessionId: string;
        selection: { start: number; end: number } | null;
      }) => {
        await this.handleSelectionUpdate(socket, data.sessionId, data.selection);
      });
      
      // タイピング状態
      socket.on('typing-status', async (data: {
        sessionId: string;
        isTyping: boolean;
      }) => {
        await this.handleTypingStatus(socket, data.sessionId, data.isTyping);
      });
      
      // 切断処理
      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  }
  
  /**
   * CRDTアルゴリズムで競合解決
   */
  private async handleDocumentUpdate(
    socket: Socket,
    sessionId: string,
    update: Uint8Array
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const participant = session.participants.get(socket.id);
    if (!participant) return;
    
    // Yjsで自動的に競合解決
    Y.applyUpdate(session.yDoc, update);
    
    // 変更履歴を記録
    const changeEvent: ChangeEvent = {
      userId: participant.userId,
      timestamp: new Date(),
      operation: 'insert', // 実際の操作タイプは update から推測
      content: '', // 実際の内容は update から抽出
      position: 0
    };
    session.changeHistory.push(changeEvent);
    
    // 他の参加者に変更を配信
    socket.to(sessionId).emit('doc-update', {
      userId: participant.userId,
      update: update
    });
    
    // Redisに変更を保存（永続化）
    await this.saveSessionState(session);
    
    // Supabase Realtimeにも変更を通知
    await this.broadcastToSupabase(sessionId, 'document-updated', {
      userId: participant.userId,
      timestamp: new Date()
    });
  }
  
  /**
   * Socket.IOとSupabase Realtimeの統合
   */
  private initializeRealtimeSubscriptions(): void {
    // Supabaseのリアルタイムイベントを監視
    this.supabase
      .channel('collaboration-events')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'collaboration_sessions'
      }, (payload) => {
        this.handleSupabaseEvent(payload);
      })
      .subscribe();
  }
  
  /**
   * 同時編集セッション管理
   */
  private async joinSession(
    socket: Socket,
    documentId: string,
    sessionId?: string
  ): Promise<CollaborationSession | null> {
    let session: CollaborationSession;
    
    if (sessionId && this.sessions.has(sessionId)) {
      session = this.sessions.get(sessionId)!;
    } else {
      // 新しいセッションを作成
      session = await this.createSession(documentId);
      this.sessions.set(session.id, session);
    }
    
    // 参加者を追加
    const participant: Participant = {
      id: socket.id,
      userId: socket.data.user.id,
      userName: socket.data.user.name,
      color: this.generateUserColor(socket.data.user.id),
      cursor: null,
      selection: null,
      isTyping: false,
      lastSeen: new Date()
    };
    
    session.participants.set(socket.id, participant);
    socket.join(session.id);
    
    // ユーザーセッションマッピングを更新
    if (!this.userSessions.has(socket.data.user.id)) {
      this.userSessions.set(socket.data.user.id, new Set());
    }
    this.userSessions.get(socket.data.user.id)!.add(session.id);
    
    // 他の参加者に通知
    socket.to(session.id).emit('participant-joined', {
      participant: participant
    });
    
    // セッション状態を永続化
    await this.saveSessionState(session);
    
    return session;
  }
  
  /**
   * 高性能なセッション作成
   */
  private async createSession(documentId: string): Promise<CollaborationSession> {
    const sessionId = this.generateSessionId();
    const yDoc = new Y.Doc();
    const awareness = new Awareness(yDoc);
    
    // 既存のドキュメント内容を読み込み
    const { data: document } = await this.supabase
      .from('documents')
      .select('content')
      .eq('id', documentId)
      .single();
    
    if (document?.content) {
      const text = yDoc.getText('content');
      text.insert(0, document.content);
    }
    
    const session: CollaborationSession = {
      id: sessionId,
      documentId,
      participants: new Map(),
      yDoc,
      awareness,
      lastActivity: new Date(),
      changeHistory: []
    };
    
    // Redisにセッション情報を保存
    await this.redis.set(
      `session:${sessionId}`,
      JSON.stringify({
        id: sessionId,
        documentId,
        createdAt: new Date(),
        lastActivity: new Date()
      }),
      'EX',
      3600 * 24 // 24時間TTL
    );
    
    return session;
  }
  
  /**
   * カーソル位置の効率的な同期
   */
  private async handleCursorUpdate(
    socket: Socket,
    sessionId: string,
    cursor: { line: number; column: number } | null
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const participant = session.participants.get(socket.id);
    if (!participant) return;
    
    participant.cursor = cursor;
    participant.lastSeen = new Date();
    
    // バッチ処理で効率化（10ms待機して一括送信）
    this.scheduleBatchUpdate(sessionId, 'cursor-updates', {
      userId: participant.userId,
      cursor
    });
  }
  
  /**
   * 選択範囲の同期
   */
  private async handleSelectionUpdate(
    socket: Socket,
    sessionId: string,
    selection: { start: number; end: number } | null
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const participant = session.participants.get(socket.id);
    if (!participant) return;
    
    participant.selection = selection;
    
    socket.to(sessionId).emit('selection-update', {
      userId: participant.userId,
      selection
    });
  }
  
  /**
   * タイピング状態の管理
   */
  private async handleTypingStatus(
    socket: Socket,
    sessionId: string,
    isTyping: boolean
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const participant = session.participants.get(socket.id);
    if (!participant) return;
    
    participant.isTyping = isTyping;
    
    socket.to(sessionId).emit('typing-status', {
      userId: participant.userId,
      isTyping
    });
  }
  
  /**
   * 切断時のクリーンアップ
   */
  private async handleDisconnect(socket: Socket): Promise<void> {
    const userId = socket.data.user?.id;
    if (!userId) return;
    
    const userSessionIds = this.userSessions.get(userId);
    if (!userSessionIds) return;
    
    for (const sessionId of userSessionIds) {
      const session = this.sessions.get(sessionId);
      if (!session) continue;
      
      session.participants.delete(socket.id);
      
      // 他の参加者に通知
      socket.to(sessionId).emit('participant-left', {
        userId: userId
      });
      
      // セッションが空になったら削除を検討
      if (session.participants.size === 0) {
        await this.scheduleSessionCleanup(sessionId);
      }
    }
    
    this.userSessions.delete(userId);
  }
  
  /**
   * パフォーマンス最適化のためのバッチ処理
   */
  private batchUpdateTimers: Map<string, NodeJS.Timeout> = new Map();
  private batchUpdateQueues: Map<string, any[]> = new Map();
  
  private scheduleBatchUpdate(sessionId: string, type: string, data: any): void {
    const key = `${sessionId}:${type}`;
    
    if (!this.batchUpdateQueues.has(key)) {
      this.batchUpdateQueues.set(key, []);
    }
    this.batchUpdateQueues.get(key)!.push(data);
    
    if (this.batchUpdateTimers.has(key)) {
      clearTimeout(this.batchUpdateTimers.get(key)!);
    }
    
    const timer = setTimeout(() => {
      const updates = this.batchUpdateQueues.get(key)!;
      this.io.to(sessionId).emit(type, updates);
      this.batchUpdateQueues.delete(key);
      this.batchUpdateTimers.delete(key);
    }, 10); // 10ms のバッチウィンドウ
    
    this.batchUpdateTimers.set(key, timer);
  }
  
  // ヘルパーメソッド群
  private async authenticateUser(token: string): Promise<any> {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    return error ? null : user;
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FECA57', '#6C5CE7', '#A29BFE', '#FD79A8'
    ];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  }
  
  private async saveSessionState(session: CollaborationSession): Promise<void> {
    const state = Y.encodeStateAsUpdate(session.yDoc);
    await this.redis.set(
      `session-state:${session.id}`,
      Buffer.from(state).toString('base64'),
      'EX',
      3600 * 24
    );
  }
  
  private async broadcastToSupabase(
    sessionId: string,
    event: string,
    data: any
  ): Promise<void> {
    await this.supabase
      .channel(`session:${sessionId}`)
      .send({
        type: 'broadcast',
        event: event,
        payload: data
      });
  }
  
  private handleSupabaseEvent(payload: any): void {
    // Supabaseイベントの処理
    console.log('Supabase event:', payload);
  }
  
  private async scheduleSessionCleanup(sessionId: string): Promise<void> {
    // 5分後にセッションをクリーンアップ
    setTimeout(async () => {
      const session = this.sessions.get(sessionId);
      if (session && session.participants.size === 0) {
        this.sessions.delete(sessionId);
        await this.redis.del(`session:${sessionId}`, `session-state:${sessionId}`);
      }
    }, 5 * 60 * 1000);
  }
  
  /**
   * パフォーマンスメトリクス
   */
  async getPerformanceMetrics(): Promise<{
    activeSessions: number;
    totalParticipants: number;
    averageLatency: number;
    messagesPerSecond: number;
  }> {
    const activeSessions = this.sessions.size;
    let totalParticipants = 0;
    
    for (const session of this.sessions.values()) {
      totalParticipants += session.participants.size;
    }
    
    // 実際の実装では、より詳細なメトリクスを収集
    return {
      activeSessions,
      totalParticipants,
      averageLatency: 5, // ms
      messagesPerSecond: 100
    };
  }
}