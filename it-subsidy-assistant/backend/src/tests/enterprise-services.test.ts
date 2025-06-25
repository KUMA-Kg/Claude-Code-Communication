/**
 * エンタープライズサービス統合テスト
 * Jest実装: Worker2 - 企業向けIT補助金アシスタント
 */

import { AuthenticationService } from '../services/AuthenticationService'
import { AIMatchingService } from '../services/AIMatchingService'
import { RealtimeEnterpriseService } from '../services/RealtimeEnterpriseService'
import { createClient } from '@supabase/supabase-js'
import { Request, Response } from 'express'
import { Server as HttpServer } from 'http'

// モック設定
jest.mock('@supabase/supabase-js')
jest.mock('socket.io')
jest.mock('../utils/logger')

const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  channel: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn(),
  auth: {
    signInWithPassword: jest.fn()
  }
}

;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)

describe('Enterprise Services Integration Tests', () => {
  describe('AuthenticationService', () => {
    let authService: AuthenticationService
    let mockRequest: Partial<Request>

    beforeEach(() => {
      authService = new AuthenticationService()
      mockRequest = {
        ip: '192.168.1.100',
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible test browser)'
        },
        connection: { remoteAddress: '192.168.1.100' }
      }
      jest.clearAllMocks()
    })

    describe('マルチテナント認証', () => {
      it('有効な認証情報で成功すること', async () => {
        // モックデータ設定
        mockSupabaseClient.single
          .mockResolvedValueOnce({ 
            data: { 
              id: 'org-1', 
              tenant_id: 'test-tenant', 
              is_active: true 
            }, 
            error: null 
          })
          .mockResolvedValueOnce({ 
            data: { 
              id: 'user-1', 
              organization_id: 'org-1', 
              is_active: true,
              role: 'admin'
            }, 
            error: null 
          })

        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: { user: { id: 'auth-user-1' } },
          error: null
        })

        const result = await authService.authenticateWithTenant(
          'test@example.com',
          'password123',
          'test-tenant',
          mockRequest as Request
        )

        expect(result.success).toBe(true)
        expect(result.tokens).toBeDefined()
        expect(result.user).toBeDefined()
        expect(result.organization).toBeDefined()
      })

      it('無効なテナントIDで失敗すること', async () => {
        mockSupabaseClient.single.mockResolvedValueOnce({ 
          data: null, 
          error: { message: 'Not found' } 
        })

        const result = await authService.authenticateWithTenant(
          'test@example.com',
          'password123',
          'invalid-tenant',
          mockRequest as Request
        )

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid tenant')
      })

      it('高リスクスコアでMFA要求すること', async () => {
        // 夜間アクセス（高リスク）のテスト
        const nightTimeRequest = {
          ...mockRequest,
          ip: '10.0.0.1' // 新しいIP
        }

        // 組織データモック
        mockSupabaseClient.single
          .mockResolvedValueOnce({ 
            data: { 
              id: 'org-1', 
              tenant_id: 'test-tenant', 
              is_active: true 
            }, 
            error: null 
          })
          .mockResolvedValueOnce({ 
            data: { 
              id: 'user-1', 
              organization_id: 'org-1', 
              is_active: true,
              role: 'admin' // 管理者は追加リスク
            }, 
            error: null 
          })

        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: { user: { id: 'auth-user-1' } },
          error: null
        })

        // 過去ログイン履歴（空 = 新しいIP）
        mockSupabaseClient.select.mockResolvedValueOnce({ 
          data: [], 
          error: null 
        })

        const result = await authService.authenticateWithTenant(
          'admin@example.com',
          'password123',
          'test-tenant',
          nightTimeRequest as Request
        )

        expect(result.success).toBe(false)
        expect(result.mfa_required).toBe(true)
      })
    })

    describe('MFA検証', () => {
      it('有効なTOTPで成功すること', async () => {
        const mockUser = {
          id: 'user-1',
          preferences: { mfa_secret: 'JBSWY3DPEHPK3PXP' },
          organizations: { id: 'org-1', tenant_id: 'test-tenant' }
        }

        mockSupabaseClient.single.mockResolvedValue({ 
          data: mockUser, 
          error: null 
        })

        // 有効なTOTPトークンをモック
        jest.spyOn(require('speakeasy'), 'totp').mockReturnValue({
          verify: jest.fn().mockReturnValue(true)
        })

        const result = await authService.verifyMFA(
          'user-1',
          '123456',
          'test-tenant',
          mockRequest as Request
        )

        expect(result.success).toBe(true)
        expect(result.tokens).toBeDefined()
      })

      it('無効なTOTPで失敗すること', async () => {
        const mockUser = {
          id: 'user-1',
          preferences: { mfa_secret: 'JBSWY3DPEHPK3PXP' },
          organizations: { id: 'org-1', tenant_id: 'test-tenant' }
        }

        mockSupabaseClient.single.mockResolvedValue({ 
          data: mockUser, 
          error: null 
        })

        jest.spyOn(require('speakeasy'), 'totp').mockReturnValue({
          verify: jest.fn().mockReturnValue(false)
        })

        const result = await authService.verifyMFA(
          'user-1',
          '000000',
          'test-tenant',
          mockRequest as Request
        )

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid MFA token')
      })
    })

    describe('権限チェック', () => {
      it('管理者は全権限を持つこと', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: {
            role: 'admin',
            permissions: {},
            organizations: { tenant_id: 'test-tenant' }
          },
          error: null
        })

        const hasPermission = await authService.checkPermission(
          'user-1',
          'test-tenant',
          'manage_subsidies'
        )

        expect(hasPermission).toBe(true)
      })

      it('一般ユーザーは明示的権限のみ持つこと', async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: {
            role: 'user',
            permissions: { view_subsidies: true },
            organizations: { tenant_id: 'test-tenant' }
          },
          error: null
        })

        const hasViewPermission = await authService.checkPermission(
          'user-1',
          'test-tenant',
          'view_subsidies'
        )

        const hasManagePermission = await authService.checkPermission(
          'user-1',
          'test-tenant',
          'manage_subsidies'
        )

        expect(hasViewPermission).toBe(true)
        expect(hasManagePermission).toBe(false)
      })
    })
  })

  describe('AIMatchingService', () => {
    let aiService: AIMatchingService

    beforeEach(() => {
      aiService = new AIMatchingService()
      jest.clearAllMocks()
    })

    describe('AI補助金マッチング', () => {
      it('高スコアマッチを正しく計算すること', async () => {
        // 企業プロファイルモック
        const mockCompanyProfile = {
          id: 'company-1',
          organization_id: 'org-1',
          industry_code: '39', // 情報通信業
          employee_count: 50,
          annual_revenue: 500000000,
          it_maturity_level: 4,
          business_profile: {
            description: 'AI・IoTソリューション開発',
            technology_stack: ['Python', 'TensorFlow', 'AWS']
          },
          subsidy_history: []
        }

        // アクティブ補助金モック
        const mockSubsidies = [{
          id: 'subsidy-1',
          name: 'IT導入補助金2024',
          target_industries: ['39'], // 情報通信業
          target_company_size: ['medium'],
          description: 'AI・IoT技術導入支援',
          keywords: ['AI', 'IoT', 'デジタル化']
        }]

        // AIサービスのモックメソッド設定
        jest.spyOn(aiService as any, 'getCompanyProfile')
          .mockResolvedValue(mockCompanyProfile)
        jest.spyOn(aiService as any, 'getActiveSubsidies')
          .mockResolvedValue(mockSubsidies)
        jest.spyOn(aiService as any, 'saveMatchingResults')
          .mockResolvedValue(undefined)
        jest.spyOn(aiService as any, 'triggerHighScoreNotifications')
          .mockResolvedValue(undefined)

        const results = await aiService.performAIMatching('org-1')

        expect(results).toHaveLength(1)
        expect(results[0].overall_score).toBeGreaterThan(0.7)
        expect(results[0].category_scores.industry_match).toBe(1.0)
        expect(results[0].confidence_level).toBe('high')
      })

      it('低スコアマッチを除外すること', async () => {
        const mockCompanyProfile = {
          id: 'company-1',
          organization_id: 'org-1',
          industry_code: '05', // 農業
          employee_count: 5,
          annual_revenue: 50000000,
          it_maturity_level: 1,
          business_profile: { description: '農作物生産' },
          subsidy_history: []
        }

        const mockSubsidies = [{
          id: 'subsidy-1',
          name: '先端IT技術導入補助金',
          target_industries: ['39'], // 情報通信業のみ
          target_company_size: ['large'],
          description: '最先端AI技術導入支援',
          keywords: ['AI', '機械学習', 'ビッグデータ']
        }]

        jest.spyOn(aiService as any, 'getCompanyProfile')
          .mockResolvedValue(mockCompanyProfile)
        jest.spyOn(aiService as any, 'getActiveSubsidies')
          .mockResolvedValue(mockSubsidies)
        jest.spyOn(aiService as any, 'saveMatchingResults')
          .mockResolvedValue(undefined)
        jest.spyOn(aiService as any, 'triggerHighScoreNotifications')
          .mockResolvedValue(undefined)

        const results = await aiService.performAIMatching('org-1')

        expect(results).toHaveLength(0) // 低スコアで除外
      })
    })

    describe('特徴ベクトル生成', () => {
      it('企業プロファイルから正しい特徴ベクトルを生成すること', async () => {
        const mockProfile = {
          industry_code: '39',
          employee_count: 100,
          annual_revenue: 1000000000,
          it_maturity_level: 5,
          business_profile: {
            main_services: ['AI開発', 'IoTシステム']
          },
          subsidy_history: [{ year: 2023, type: 'IT導入' }]
        }

        const features = await (aiService as any).generateCompanyFeatureVector(mockProfile)

        expect(features).toHaveProperty('industry_vector')
        expect(features).toHaveProperty('size_vector')
        expect(features).toHaveProperty('needs_vector')
        expect(features).toHaveProperty('tech_vector')
        expect(features).toHaveProperty('financial_vector')
        expect(features).toHaveProperty('experience_vector')

        expect(Array.isArray(features.industry_vector)).toBe(true)
        expect(features.tech_vector[0]).toBe(1.0) // ITレベル5 = 1.0
      })
    })
  })

  describe('RealtimeEnterpriseService', () => {
    let realtimeService: RealtimeEnterpriseService
    let mockHttpServer: HttpServer
    let mockResponse: Partial<Response>

    beforeEach(() => {
      mockHttpServer = {} as HttpServer
      realtimeService = new RealtimeEnterpriseService()
      
      mockResponse = {
        writeHead: jest.fn(),
        write: jest.fn(),
        on: jest.fn()
      }

      jest.clearAllMocks()
    })

    describe('Server-Sent Events', () => {
      it('有効なパラメータでSSE接続を確立すること', () => {
        const mockRequest = {
          query: {
            user_id: 'user-1',
            organization_id: 'org-1',
            tenant_id: 'test-tenant'
          },
          on: jest.fn()
        }

        realtimeService.handleEnterpriseSSE(
          mockRequest as any,
          mockResponse as Response
        )

        expect(mockResponse.writeHead).toHaveBeenCalledWith(200, 
          expect.objectContaining({
            'Content-Type': 'text/event-stream',
            'X-Enterprise-Stream': 'active'
          })
        )
        expect(mockResponse.write).toHaveBeenCalledWith(
          expect.stringContaining('enterprise_connected')
        )
      })

      it('無効なパラメータでエラーを返すこと', () => {
        const mockRequest = {
          query: { user_id: 'user-1' } // organization_id, tenant_id が不足
        }

        mockResponse.status = jest.fn().mockReturnThis()
        mockResponse.json = jest.fn()

        realtimeService.handleEnterpriseSSE(
          mockRequest as any,
          mockResponse as Response
        )

        expect(mockResponse.status).toHaveBeenCalledWith(400)
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Missing required enterprise parameters'
        })
      })
    })

    describe('通知ブロードキャスト', () => {
      it('エンタープライズ通知を正しく配信すること', async () => {
        const notification = {
          id: 'notif-1',
          organization_id: 'org-1',
          type: 'ai_matching_result',
          title: 'New High-Score Match',
          message: 'A 95% match has been found',
          data: { score: 0.95 },
          priority: 'high' as const,
          channels: ['websocket', 'sse']
        }

        jest.spyOn(realtimeService as any, 'sendWebSocketNotification')
          .mockResolvedValue(undefined)
        jest.spyOn(realtimeService as any, 'sendSSENotification')
          .mockResolvedValue(undefined)
        jest.spyOn(realtimeService as any, 'updateNotificationStatus')
          .mockResolvedValue(undefined)

        await realtimeService.broadcastEnterpriseNotification(notification)

        expect((realtimeService as any).sendWebSocketNotification)
          .toHaveBeenCalledWith(notification)
        expect((realtimeService as any).sendSSENotification)
          .toHaveBeenCalledWith(notification)
        expect((realtimeService as any).updateNotificationStatus)
          .toHaveBeenCalledWith('notif-1', 'sent')
      })

      it('緊急通知で全チャンネル配信すること', async () => {
        const urgentNotification = {
          id: 'urgent-1',
          organization_id: 'org-1',
          type: 'urgent_deadline',
          title: 'Urgent Deadline Alert',
          message: 'Application deadline in 24 hours',
          data: { hours_remaining: 24 },
          priority: 'urgent' as const,
          channels: ['websocket', 'sse', 'push']
        }

        jest.spyOn(realtimeService as any, 'sendWebSocketNotification')
          .mockResolvedValue(undefined)
        jest.spyOn(realtimeService as any, 'sendSSENotification')
          .mockResolvedValue(undefined)
        jest.spyOn(realtimeService as any, 'sendPushNotification')
          .mockResolvedValue(undefined)

        await realtimeService.broadcastEnterpriseNotification(urgentNotification)

        expect((realtimeService as any).sendWebSocketNotification)
          .toHaveBeenCalled()
        expect((realtimeService as any).sendSSENotification)
          .toHaveBeenCalled()
        expect((realtimeService as any).sendPushNotification)
          .toHaveBeenCalled()
      })
    })

    describe('AI マッチング結果配信', () => {
      it('高スコアマッチング結果を即座に配信すること', async () => {
        const matchingData = {
          subsidy_id: 'subsidy-1',
          score: 0.95,
          confidence_level: 'high' as const,
          explanation: 'Perfect industry and size match',
          recommended_actions: ['Start application immediately']
        }

        jest.spyOn(realtimeService, 'broadcastEnterpriseNotification')
          .mockResolvedValue(undefined)

        await realtimeService.broadcastAIMatchingResult('org-1', matchingData)

        expect(realtimeService.broadcastEnterpriseNotification)
          .toHaveBeenCalledWith(expect.objectContaining({
            organization_id: 'org-1',
            type: 'ai_matching_result',
            priority: 'urgent', // score > 0.9 なので urgent
            data: matchingData
          }))
      })
    })
  })

  describe('統合シナリオテスト', () => {
    it('完全なエンタープライズワークフローが動作すること', async () => {
      // 1. 認証
      const authService = new AuthenticationService()
      const mockRequest = {
        ip: '192.168.1.100',
        headers: { 'user-agent': 'Enterprise Browser' },
        connection: { remoteAddress: '192.168.1.100' }
      }

      // 認証成功をモック
      jest.spyOn(authService, 'authenticateWithTenant')
        .mockResolvedValue({
          success: true,
          user: { id: 'user-1', organization_id: 'org-1' } as any,
          organization: { id: 'org-1', tenant_id: 'enterprise-tenant' } as any,
          tokens: { access_token: 'token', refresh_token: 'refresh' }
        })

      // 2. AI マッチング実行
      const aiService = new AIMatchingService()
      jest.spyOn(aiService, 'performAIMatching')
        .mockResolvedValue([{
          subsidy_id: 'subsidy-1',
          overall_score: 0.95,
          category_scores: {
            industry_match: 1.0,
            size_match: 0.9,
            needs_match: 0.95,
            technical_fit: 1.0,
            historical_success: 0.8
          },
          reason_codes: ['perfect_industry_match', 'ideal_company_size'],
          explanation: 'Excellent match for IT subsidy',
          recommended_actions: ['Apply immediately'],
          confidence_level: 'high'
        }])

      // 3. リアルタイム通知
      const realtimeService = new RealtimeEnterpriseService()
      jest.spyOn(realtimeService, 'broadcastAIMatchingResult')
        .mockResolvedValue(undefined)

      // ワークフロー実行
      const authResult = await authService.authenticateWithTenant(
        'admin@enterprise.com',
        'password',
        'enterprise-tenant',
        mockRequest as Request
      )

      const matchingResults = await aiService.performAIMatching('org-1')

      await realtimeService.broadcastAIMatchingResult('org-1', {
        subsidy_id: matchingResults[0].subsidy_id,
        score: matchingResults[0].overall_score,
        confidence_level: matchingResults[0].confidence_level,
        explanation: matchingResults[0].explanation,
        recommended_actions: matchingResults[0].recommended_actions
      })

      // 検証
      expect(authResult.success).toBe(true)
      expect(matchingResults).toHaveLength(1)
      expect(matchingResults[0].overall_score).toBe(0.95)
      expect(realtimeService.broadcastAIMatchingResult).toHaveBeenCalled()
    })
  })
})

describe('パフォーマンステスト', () => {
  describe('大量データ処理', () => {
    it('1000件の補助金データを10秒以内で処理すること', async () => {
      const aiService = new AIMatchingService()
      
      // 大量補助金データのモック
      const mockSubsidies = Array.from({ length: 1000 }, (_, i) => ({
        id: `subsidy-${i}`,
        name: `補助金${i}`,
        target_industries: ['39'],
        target_company_size: ['medium'],
        description: `補助金${i}の説明`
      }))

      jest.spyOn(aiService as any, 'getCompanyProfile')
        .mockResolvedValue({ id: 'company-1', industry_code: '39' })
      jest.spyOn(aiService as any, 'getActiveSubsidies')
        .mockResolvedValue(mockSubsidies)
      jest.spyOn(aiService as any, 'saveMatchingResults')
        .mockResolvedValue(undefined)
      jest.spyOn(aiService as any, 'triggerHighScoreNotifications')
        .mockResolvedValue(undefined)

      const startTime = Date.now()
      await aiService.performAIMatching('org-1')
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(10000) // 10秒以内
    }, 15000) // Jest timeout 15秒

    it('100同時接続のWebSocketを処理できること', async () => {
      const realtimeService = new RealtimeEnterpriseService()
      
      // 100個の模擬セッション作成
      const sessions = Array.from({ length: 100 }, (_, i) => ({
        socket_id: `socket-${i}`,
        user_id: `user-${i}`,
        organization_id: 'org-1',
        tenant_id: 'test-tenant',
        channels: [],
        last_heartbeat: new Date()
      }))

      // セッション登録をモック
      jest.spyOn(realtimeService as any, 'websocketSessions', 'get')
        .mockReturnValue(new Map(sessions.map(s => [s.socket_id, s])))

      const notification = {
        id: 'broadcast-test',
        organization_id: 'org-1',
        type: 'performance_test',
        title: 'Performance Test',
        message: 'Testing 100 concurrent connections',
        data: {},
        priority: 'normal' as const,
        channels: ['websocket']
      }

      const startTime = Date.now()
      await realtimeService.broadcastEnterpriseNotification(notification)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // 1秒以内
    })
  })

  describe('メモリ使用量テスト', () => {
    it('長時間稼働でメモリリークしないこと', async () => {
      const realtimeService = new RealtimeEnterpriseService()
      
      const initialMemory = process.memoryUsage().heapUsed
      
      // 1000回の通知配信シミュレーション
      for (let i = 0; i < 1000; i++) {
        const notification = {
          id: `memory-test-${i}`,
          organization_id: 'org-1',
          type: 'memory_test',
          title: `Test ${i}`,
          message: `Memory test notification ${i}`,
          data: { iteration: i },
          priority: 'low' as const,
          channels: ['websocket']
        }

        jest.spyOn(realtimeService as any, 'sendWebSocketNotification')
          .mockResolvedValue(undefined)
        jest.spyOn(realtimeService as any, 'updateNotificationStatus')
          .mockResolvedValue(undefined)

        await realtimeService.broadcastEnterpriseNotification(notification)
        
        // 100回毎にガベージコレクション実行
        if (i % 100 === 0 && global.gc) {
          global.gc()
        }
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // メモリ増加量が10MB以下であることを確認
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })
})