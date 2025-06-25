/**
 * エンタープライズリアルタイム同期・通信サービス
 * 既存RealtimeServiceを拡張 - マルチテナント・AI-インテリジェンス対応
 * Worker2実装: 企業向けIT補助金アシスタント
 */

import { RealtimeService, RealtimeSubscription } from './RealtimeService'
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import { Server as SocketIOServer } from 'socket.io'
import { Server as HttpServer } from 'http'
import { Request, Response } from 'express'
import EventEmitter from 'events'
import { logger } from '@/utils/logger'

interface EnterpriseNotificationPayload {
  id: string
  organization_id: string
  user_id?: string
  type: string
  title: string
  message: string
  data: any
  priority: 'low' | 'normal' | 'high' | 'urgent'
  channels: string[]
}

interface WebSocketSession {
  socket_id: string
  user_id: string
  organization_id: string
  tenant_id: string
  channels: string[]
  last_heartbeat: Date
}

interface AIMatchingNotification {
  subsidy_id: string
  score: number
  confidence_level: 'high' | 'medium' | 'low'
  explanation: string
  recommended_actions: string[]
}

export class RealtimeEnterpriseService extends EventEmitter {
  private supabase: SupabaseClient
  private io?: SocketIOServer
  private activeChannels: Map<string, RealtimeChannel> = new Map()
  private websocketSessions: Map<string, WebSocketSession> = new Map()
  private sseConnections: Map<string, Response> = new Map()

  constructor(httpServer?: HttpServer) {
    super()
    
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        realtime: {
          params: {
            eventsPerSecond: 100
          }
        }
      }
    )

    if (httpServer) {
      this.initializeWebSocket(httpServer)
    }

    this.initializeEnterpriseRealtime()
    this.startCleanupInterval()
  }

  /**
   * WebSocket初期化（Socket.IO）
   */
  private initializeWebSocket(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    })

    this.io.on('connection', (socket) => {
      logger.info(`Enterprise WebSocket client connected: ${socket.id}`)

      // 認証確認
      socket.on('authenticate', async (data) => {
        try {
          const { token, tenant_id } = data
          const authResult = await this.verifyEnterpriseToken(token, tenant_id)

          if (authResult.success) {
            const session: WebSocketSession = {
              socket_id: socket.id,
              user_id: authResult.user_id!,
              organization_id: authResult.organization_id!,
              tenant_id,
              channels: [],
              last_heartbeat: new Date()
            }

            this.websocketSessions.set(socket.id, session)
            
            // セッション記録
            await this.recordWebSocketSession(session)

            socket.emit('authenticated', { 
              success: true, 
              user_id: authResult.user_id,
              organization_id: authResult.organization_id,
              tenant_id
            })

            // エンタープライズ用デフォルトチャンネル参加
            await this.joinEnterpriseChannels(socket, session)

          } else {
            socket.emit('authentication_failed', { error: 'Invalid enterprise token' })
            socket.disconnect()
          }
        } catch (error) {
          logger.error('Enterprise authentication failed:', error)
          socket.emit('authentication_failed', { error: 'Authentication error' })
          socket.disconnect()
        }
      })

      // AI マッチング結果チャンネル参加
      socket.on('subscribe_ai_matching', async (data) => {
        const session = this.websocketSessions.get(socket.id)
        if (!session) return

        await this.subscribeToAIMatching(socket, session)
      })

      // 組織レベル通知チャンネル参加
      socket.on('subscribe_org_notifications', async (data) => {
        const session = this.websocketSessions.get(socket.id)
        if (!session) return

        await this.subscribeToOrganizationNotifications(socket, session)
      })

      // ハートビート処理
      socket.on('heartbeat', () => {
        const session = this.websocketSessions.get(socket.id)
        if (session) {
          session.last_heartbeat = new Date()
          this.websocketSessions.set(socket.id, session)
        }
      })

      // 切断処理
      socket.on('disconnect', async () => {
        logger.info(`Enterprise WebSocket client disconnected: ${socket.id}`)
        await this.handleDisconnection(socket.id)
      })
    })
  }

  /**
   * エンタープライズリアルタイム機能初期化
   */
  private initializeEnterpriseRealtime(): void {
    // AI マッチングスコア監視
    this.subscribeToAIMatchingUpdates()
    
    // 組織レベル通知監視
    this.subscribeToOrganizationNotifications()
    
    // 補助金情報リアルタイム更新
    this.subscribeToSubsidyIntelligence()
    
    // セキュリティアラート監視
    this.subscribeToSecurityAlerts()
  }

  /**
   * AI マッチングスコア更新監視
   */
  private subscribeToAIMatchingUpdates(): void {
    const channel = this.supabase
      .channel('ai_matching_global')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_matching_scores'
      }, (payload) => {
        this.handleAIMatchingUpdate(payload.new)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ai_matching_scores',
        filter: 'overall_score=gte.0.7'
      }, (payload) => {
        this.handleHighScoreUpdate(payload.new)
      })

    channel.subscribe((status) => {
      logger.info(`AI Matching channel status: ${status}`)
    })

    this.activeChannels.set('ai_matching_global', channel)
  }

  /**
   * 組織通知監視
   */
  private subscribeToOrganizationNotifications(): void {
    const channel = this.supabase
      .channel('organization_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'realtime_notifications'
      }, (payload) => {
        this.handleOrganizationNotification(payload.new)
      })

    channel.subscribe()
    this.activeChannels.set('organization_notifications', channel)
  }

  /**
   * 補助金インテリジェンス監視
   */
  private subscribeToSubsidyIntelligence(): void {
    const channel = this.supabase
      .channel('subsidy_intelligence')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subsidies'
      }, (payload) => {
        this.handleSubsidyIntelligenceUpdate(payload)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subsidy_schedules'
      }, (payload) => {
        this.handleScheduleIntelligenceUpdate(payload)
      })

    channel.subscribe()
    this.activeChannels.set('subsidy_intelligence', channel)
  }

  /**
   * セキュリティアラート監視
   */
  private subscribeToSecurityAlerts(): void {
    const channel = this.supabase
      .channel('security_alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'security_audit_logs',
        filter: 'risk_score=gte.0.7'
      }, (payload) => {
        this.handleSecurityAlert(payload.new)
      })

    channel.subscribe()
    this.activeChannels.set('security_alerts', channel)
  }

  /**
   * 組織固有AI マッチング監視
   */
  async subscribeToOrganizationAIMatching(organizationId: string): Promise<RealtimeSubscription> {
    const channelName = `ai_matching_org_${organizationId}`
    
    try {
      let channel = this.activeChannels.get(channelName)
      
      if (!channel) {
        channel = this.supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'ai_matching_scores',
            filter: `organization_id=eq.${organizationId}`
          }, (payload) => {
            this.broadcastToOrganization(organizationId, 'ai_matching_update', {
              event_type: payload.eventType,
              score_data: payload.new,
              timestamp: new Date().toISOString()
            })
          })

        await new Promise<void>((resolve) => {
          channel!.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.info(`AI Matching subscription created for org: ${organizationId}`)
              resolve()
            }
          })
        })

        this.activeChannels.set(channelName, channel)
      }

      return {
        channel,
        unsubscribe: () => this.unsubscribeFromChannel(channelName)
      }

    } catch (error) {
      logger.error('Failed to subscribe to organization AI matching:', error)
      throw error
    }
  }

  /**
   * Server-Sent Events エンドポイント処理
   */
  handleEnterpriseSSE(req: Request, res: Response): void {
    const { user_id, organization_id, tenant_id } = req.query as Record<string, string>
    
    if (!user_id || !organization_id || !tenant_id) {
      res.status(400).json({ error: 'Missing required enterprise parameters' })
      return
    }

    // エンタープライズSSE設定
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control, Authorization',
      'X-Enterprise-Stream': 'active'
    })

    const connectionId = `enterprise_sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.sseConnections.set(connectionId, res)

    // 強化されたハートビート（15秒間隔）
    const heartbeat = setInterval(() => {
      try {
        res.write(`data: {"type":"enterprise_heartbeat","timestamp":"${new Date().toISOString()}","connection_id":"${connectionId}"}\n\n`)
      } catch (error) {
        clearInterval(heartbeat)
        this.sseConnections.delete(connectionId)
      }
    }, 15000)

    // 初期接続メッセージ
    res.write(`data: {"type":"enterprise_connected","connection_id":"${connectionId}","organization_id":"${organization_id}","capabilities":["ai_matching","realtime_notifications","security_alerts"]}\n\n`)

    // 切断処理
    req.on('close', () => {
      clearInterval(heartbeat)
      this.sseConnections.delete(connectionId)
      logger.info(`Enterprise SSE connection closed: ${connectionId}`)
    })
  }

  /**
   * エンタープライズ通知ブロードキャスト
   */
  async broadcastEnterpriseNotification(notification: EnterpriseNotificationPayload): Promise<void> {
    try {
      // 高優先度通知の場合は複数チャンネル同時送信
      if (notification.priority === 'urgent' || notification.priority === 'high') {
        await Promise.all([
          this.sendWebSocketNotification(notification),
          this.sendSSENotification(notification),
          this.sendPushNotification(notification)
        ])
      } else {
        // 通常優先度はWebSocket + SSE
        await Promise.all([
          this.sendWebSocketNotification(notification),
          this.sendSSENotification(notification)
        ])
      }

      // 配信状況更新
      await this.updateNotificationStatus(notification.id, 'sent')

    } catch (error) {
      logger.error('Failed to broadcast enterprise notification:', error)
      await this.updateNotificationStatus(notification.id, 'failed')
    }
  }

  /**
   * AI マッチング結果の即座配信
   */
  async broadcastAIMatchingResult(
    organizationId: string, 
    matchingData: AIMatchingNotification
  ): Promise<void> {
    const notification: EnterpriseNotificationPayload = {
      id: `ai_match_${Date.now()}`,
      organization_id: organizationId,
      type: 'ai_matching_result',
      title: '新しい高適合補助金を発見',
      message: `適合度${Math.round(matchingData.score * 100)}%の補助金が見つかりました`,
      data: matchingData,
      priority: matchingData.score > 0.9 ? 'urgent' : 'high',
      channels: ['websocket', 'sse', 'push']
    }

    await this.broadcastEnterpriseNotification(notification)
  }

  /**
   * イベントハンドラー実装
   */
  private async handleAIMatchingUpdate(scoreData: any): Promise<void> {
    if (scoreData.overall_score > 0.7) {
      await this.broadcastAIMatchingResult(scoreData.organization_id, {
        subsidy_id: scoreData.subsidy_id,
        score: scoreData.overall_score,
        confidence_level: scoreData.confidence_level,
        explanation: scoreData.explanation,
        recommended_actions: JSON.parse(scoreData.recommended_actions || '[]')
      })
    }
  }

  private async handleHighScoreUpdate(scoreData: any): Promise<void> {
    await this.broadcastToOrganization(scoreData.organization_id, 'high_score_alert', {
      subsidy_id: scoreData.subsidy_id,
      score: scoreData.overall_score,
      urgent: scoreData.overall_score > 0.9
    })
  }

  private async handleOrganizationNotification(notificationData: any): Promise<void> {
    await this.broadcastEnterpriseNotification(notificationData)
  }

  private async handleSubsidyIntelligenceUpdate(payload: any): Promise<void> {
    const subsidy = payload.new || payload.old
    
    // 関心のある組織を特定
    const interestedOrgs = await this.findInterestedOrganizations(subsidy.id)
    
    for (const orgId of interestedOrgs) {
      await this.broadcastToOrganization(orgId, 'subsidy_intelligence_update', {
        event_type: payload.eventType,
        subsidy_data: subsidy,
        impact_level: this.calculateImpactLevel(subsidy)
      })
    }
  }

  private async handleScheduleIntelligenceUpdate(payload: any): Promise<void> {
    const schedule = payload.new || payload.old
    
    // 締切が迫っている場合の緊急アラート
    const daysToDeadline = this.calculateDaysToDeadline(schedule.end_date)
    
    if (daysToDeadline <= 3) {
      await this.broadcastUrgentDeadlineAlert({
        subsidy_id: schedule.subsidy_id,
        deadline: schedule.end_date,
        days_remaining: daysToDeadline,
        urgency_level: daysToDeadline <= 1 ? 'critical' : 'high'
      })
    }
  }

  private async handleSecurityAlert(auditLog: any): Promise<void> {
    if (auditLog.organization_id) {
      await this.broadcastToOrganization(auditLog.organization_id, 'security_alert', {
        alert_type: 'high_risk_activity',
        risk_score: auditLog.risk_score,
        event_details: auditLog,
        recommended_actions: this.generateSecurityRecommendations(auditLog)
      })
    }
  }

  /**
   * ヘルパーメソッド
   */
  private async verifyEnterpriseToken(token: string, tenantId: string): Promise<{
    success: boolean
    user_id?: string
    organization_id?: string
  }> {
    // エンタープライズJWT検証（AuthenticationServiceを活用）
    // 実装は簡略化
    return { success: true, user_id: 'enterprise_user', organization_id: 'enterprise_org' }
  }

  private async recordWebSocketSession(session: WebSocketSession): Promise<void> {
    await this.supabase
      .from('websocket_sessions')
      .insert({
        session_id: session.socket_id,
        organization_id: session.organization_id,
        user_id: session.user_id,
        connection_data: { 
          tenant_id: session.tenant_id,
          type: 'enterprise',
          features: ['ai_matching', 'realtime_notifications', 'security_monitoring']
        }
      })
  }

  private async joinEnterpriseChannels(socket: any, session: WebSocketSession): Promise<void> {
    const enterpriseChannels = [
      `enterprise_org_${session.organization_id}`,
      `ai_matching_${session.organization_id}`,
      `security_alerts_${session.organization_id}`,
      `subsidy_intelligence_${session.organization_id}`
    ]

    for (const channel of enterpriseChannels) {
      socket.join(channel)
      session.channels.push(channel)
    }

    this.websocketSessions.set(session.socket_id, session)
    socket.emit('enterprise_channels_joined', { channels: enterpriseChannels })
  }

  private async subscribeToAIMatching(socket: any, session: WebSocketSession): Promise<void> {
    const channelName = `ai_matching_${session.organization_id}`
    socket.join(channelName)
    
    socket.emit('ai_matching_subscribed', { 
      organization_id: session.organization_id,
      features: ['real_time_scoring', 'automatic_notifications', 'trend_analysis']
    })
  }

  private async broadcastToOrganization(
    organizationId: string, 
    eventType: string, 
    data: any
  ): Promise<void> {
    if (!this.io) return

    const targetSessions = Array.from(this.websocketSessions.values())
      .filter(session => session.organization_id === organizationId)

    for (const session of targetSessions) {
      const socket = this.io.sockets.sockets.get(session.socket_id)
      if (socket) {
        socket.emit(eventType, {
          ...data,
          organization_id: organizationId,
          timestamp: new Date().toISOString()
        })
      }
    }
  }

  private async sendWebSocketNotification(notification: EnterpriseNotificationPayload): Promise<void> {
    if (!this.io) return

    const targetSessions = Array.from(this.websocketSessions.values())
      .filter(session => {
        if (notification.user_id) {
          return session.user_id === notification.user_id
        }
        return session.organization_id === notification.organization_id
      })

    for (const session of targetSessions) {
      const socket = this.io.sockets.sockets.get(session.socket_id)
      if (socket) {
        socket.emit('enterprise_notification', {
          ...notification,
          timestamp: new Date().toISOString(),
          session_id: session.socket_id
        })
      }
    }
  }

  private async sendSSENotification(notification: EnterpriseNotificationPayload): Promise<void> {
    const message = {
      type: 'enterprise_notification',
      ...notification,
      timestamp: new Date().toISOString()
    }

    for (const [connectionId, res] of this.sseConnections) {
      try {
        res.write(`data: ${JSON.stringify(message)}\n\n`)
      } catch (error) {
        this.sseConnections.delete(connectionId)
      }
    }
  }

  private async sendPushNotification(notification: EnterpriseNotificationPayload): Promise<void> {
    // エンタープライズPush通知実装
    logger.info('Enterprise push notification would be sent:', notification.title)
  }

  private async handleDisconnection(socketId: string): Promise<void> {
    const session = this.websocketSessions.get(socketId)
    if (session) {
      await this.supabase
        .from('websocket_sessions')
        .delete()
        .eq('session_id', socketId)

      this.websocketSessions.delete(socketId)
    }
  }

  private calculateDaysToDeadline(deadline: string): number {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  private calculateImpactLevel(subsidy: any): 'low' | 'medium' | 'high' | 'critical' {
    // 補助金のインパクトレベル計算ロジック
    if (subsidy.amount_max > 10000000) return 'critical' // 1000万円以上
    if (subsidy.amount_max > 5000000) return 'high'      // 500万円以上
    if (subsidy.amount_max > 1000000) return 'medium'    // 100万円以上
    return 'low'
  }

  private generateSecurityRecommendations(auditLog: any): string[] {
    const recommendations: string[] = []
    
    if (auditLog.risk_score > 0.8) {
      recommendations.push('即座にパスワード変更を実施')
      recommendations.push('2要素認証の有効化を確認')
    }
    
    if (auditLog.threat_indicators?.tor_exit_node) {
      recommendations.push('VPN/Torアクセスの制限を検討')
    }
    
    return recommendations
  }

  private async findInterestedOrganizations(subsidyId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('subsidy_monitoring')
      .select('organization_id')
      .eq('is_active', true)

    return data?.map(row => row.organization_id) || []
  }

  private async updateNotificationStatus(notificationId: string, status: string): Promise<void> {
    await this.supabase
      .from('realtime_notifications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
  }

  private async unsubscribeFromChannel(channelName: string): Promise<void> {
    const channel = this.activeChannels.get(channelName)
    if (channel) {
      await channel.unsubscribe()
      this.activeChannels.delete(channelName)
      logger.info(`Unsubscribed from enterprise channel: ${channelName}`)
    }
  }

  private async broadcastUrgentDeadlineAlert(alert: any): Promise<void> {
    // 緊急締切アラートの実装
    logger.info('Urgent deadline alert:', alert)
  }

  private startCleanupInterval(): void {
    setInterval(async () => {
      const cutoff = new Date(Date.now() - 3 * 60 * 1000) // 3分前
      
      for (const [socketId, session] of this.websocketSessions) {
        if (session.last_heartbeat < cutoff) {
          await this.handleDisconnection(socketId)
        }
      }
    }, 30000) // 30秒間隔
  }
}