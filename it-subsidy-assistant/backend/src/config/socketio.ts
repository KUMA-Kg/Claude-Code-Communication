import { Server as HttpServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { logger } from '../utils/logger'
import { authenticateSocketToken } from '../middleware/socketAuth'
import { CollaborationService } from '../services/CollaborationService'

export function setupSocketIO(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  })

  // Initialize collaboration service
  const collaborationService = new CollaborationService(io.of('/collaboration'))

  // 認証ミドルウェア
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization
      if (!token) {
        return next(new Error('Authentication required'))
      }

      // トークン検証
      const user = await authenticateSocketToken(token)
      if (!user) {
        return next(new Error('Invalid token'))
      }

      socket.data.user = user
      next()
    } catch (error) {
      logger.error('Socket authentication error:', error)
      next(new Error('Authentication failed'))
    }
  })

  // 接続イベント
  io.on('connection', (socket) => {
    const userId = socket.data.user?.id
    logger.info(`Socket connected: ${socket.id} (User: ${userId})`)

    // ユーザー専用ルームに参加
    if (userId) {
      socket.join(`user:${userId}`)
    }

    // 企業専用ルームに参加
    const companyId = socket.data.user?.companyId
    if (companyId) {
      socket.join(`company:${companyId}`)
    }

    // 補助金更新イベントの購読
    socket.on('subscribe:subsidies', async () => {
      socket.join('subsidies:updates')
      socket.emit('subscribed', { channel: 'subsidies:updates' })
    })

    // 申請状況更新の購読
    socket.on('subscribe:applications', async () => {
      if (companyId) {
        socket.join(`applications:${companyId}`)
        socket.emit('subscribed', { channel: `applications:${companyId}` })
      }
    })

    // AI マッチング結果の購読
    socket.on('subscribe:ai-matching', async () => {
      if (companyId) {
        socket.join(`ai-matching:${companyId}`)
        socket.emit('subscribed', { channel: `ai-matching:${companyId}` })
      }
    })

    // エラーハンドリング
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error)
    })

    // 切断処理
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (Reason: ${reason})`)
    })
  })

  // Store collaboration service in io for access
  (io as any).collaborationService = collaborationService

  return io
}

/**
 * 補助金更新をブロードキャスト
 */
export function broadcastSubsidyUpdate(io: SocketIOServer, update: any) {
  io.to('subsidies:updates').emit('subsidy:updated', {
    type: 'subsidy_update',
    data: update,
    timestamp: new Date().toISOString()
  })
}

/**
 * 申請状況更新を該当企業に送信
 */
export function broadcastApplicationUpdate(io: SocketIOServer, companyId: string, update: any) {
  io.to(`applications:${companyId}`).emit('application:updated', {
    type: 'application_update',
    data: update,
    timestamp: new Date().toISOString()
  })
}

/**
 * AI マッチング結果を該当企業に送信
 */
export function broadcastAIMatchingResult(io: SocketIOServer, companyId: string, result: any) {
  io.to(`ai-matching:${companyId}`).emit('ai-matching:result', {
    type: 'ai_matching_result',
    data: result,
    timestamp: new Date().toISOString()
  })
}

/**
 * 緊急通知を全ユーザーに送信
 */
export function broadcastUrgentNotification(io: SocketIOServer, notification: any) {
  io.emit('urgent:notification', {
    type: 'urgent_notification',
    data: notification,
    timestamp: new Date().toISOString()
  })
}