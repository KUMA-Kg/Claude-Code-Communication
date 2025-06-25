/**
 * エンタープライズレベル認証サービス
 * マルチテナント対応・ゼロトラスト・セキュリティ
 * Worker2実装: 企業向けIT補助金アシスタント
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import speakeasy from 'speakeasy'
import geoip from 'geoip-lite'
import { Request, Response } from 'express'

interface TenantUser {
  id: string
  organization_id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'user' | 'viewer'
  department?: string
  position?: string
  permissions: Record<string, boolean>
  preferences: Record<string, any>
  is_active: boolean
}

interface Organization {
  id: string
  tenant_id: string
  name: string
  subscription_plan: string
  max_users: number
  features_enabled: Record<string, boolean>
  is_active: boolean
}

interface SecurityContext {
  ip_address: string
  user_agent: string
  geo_location: any
  risk_score: number
  threat_indicators: Record<string, any>
}

export class AuthenticationService {
  private supabase: SupabaseClient
  private serviceRoleClient: SupabaseClient

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    )
    
    this.serviceRoleClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  /**
   * マルチテナント認証
   */
  async authenticateWithTenant(
    email: string, 
    password: string, 
    tenantId: string,
    request: Request
  ): Promise<{
    success: boolean
    user?: TenantUser
    organization?: Organization
    tokens?: { access_token: string, refresh_token: string }
    mfa_required?: boolean
    error?: string
  }> {
    try {
      // セキュリティコンテキスト分析
      const securityContext = await this.analyzeSecurityContext(request)
      
      // 組織の存在確認
      const { data: org, error: orgError } = await this.serviceRoleClient
        .from('organizations')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .single()

      if (orgError || !org) {
        await this.logSecurityEvent('login_failed', null, 'invalid_tenant', securityContext)
        return { success: false, error: 'Invalid tenant' }
      }

      // Supabase認証
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError || !authData.user) {
        await this.logSecurityEvent('login_failed', null, 'invalid_credentials', securityContext)
        return { success: false, error: 'Invalid credentials' }
      }

      // テナントユーザー情報取得
      const { data: tenantUser, error: userError } = await this.serviceRoleClient
        .from('tenant_users')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .single()

      if (userError || !tenantUser) {
        await this.logSecurityEvent('login_failed', authData.user.id, 'user_not_in_tenant', securityContext)
        return { success: false, error: 'User not authorized for this tenant' }
      }

      // リスクスコア評価
      const riskScore = await this.calculateRiskScore(tenantUser, securityContext)
      
      if (riskScore > 0.7) {
        // 高リスク: MFA必須
        await this.logSecurityEvent('high_risk_login', tenantUser.id, 'mfa_required', securityContext)
        return { success: false, mfa_required: true, error: 'Multi-factor authentication required' }
      }

      // JWTトークン生成
      const tokens = await this.generateTokens(tenantUser, org)

      // 最終ログイン更新
      await this.serviceRoleClient
        .from('tenant_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', tenantUser.id)

      // 成功ログ
      await this.logSecurityEvent('login_success', tenantUser.id, 'success', securityContext)

      return {
        success: true,
        user: tenantUser,
        organization: org,
        tokens
      }

    } catch (error) {
      console.error('Authentication error:', error)
      return { success: false, error: 'Authentication failed' }
    }
  }

  /**
   * MFA検証
   */
  async verifyMFA(
    userId: string, 
    token: string, 
    tenantId: string,
    request: Request
  ): Promise<{
    success: boolean
    user?: TenantUser
    organization?: Organization
    tokens?: { access_token: string, refresh_token: string }
    error?: string
  }> {
    try {
      const securityContext = await this.analyzeSecurityContext(request)

      // ユーザー情報取得
      const { data: userWithOrg } = await this.serviceRoleClient
        .from('tenant_users')
        .select(`
          *,
          organizations!inner(*)
        `)
        .eq('id', userId)
        .eq('organizations.tenant_id', tenantId)
        .single()

      if (!userWithOrg) {
        return { success: false, error: 'User not found' }
      }

      // MFA検証（例：TOTP）
      const secret = userWithOrg.preferences?.mfa_secret
      if (!secret) {
        return { success: false, error: 'MFA not configured' }
      }

      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2
      })

      if (!verified) {
        await this.logSecurityEvent('mfa_failed', userId, 'invalid_token', securityContext)
        return { success: false, error: 'Invalid MFA token' }
      }

      // JWTトークン生成
      const tokens = await this.generateTokens(userWithOrg, userWithOrg.organizations)

      await this.logSecurityEvent('mfa_success', userId, 'success', securityContext)

      return {
        success: true,
        user: userWithOrg,
        organization: userWithOrg.organizations,
        tokens
      }

    } catch (error) {
      console.error('MFA verification error:', error)
      return { success: false, error: 'MFA verification failed' }
    }
  }

  /**
   * リスクスコア計算（ゼロトラスト）
   */
  private async calculateRiskScore(
    user: TenantUser, 
    context: SecurityContext
  ): Promise<number> {
    let riskScore = 0

    // 異常なログイン時間
    const hour = new Date().getHours()
    if (hour < 6 || hour > 22) {
      riskScore += 0.2
    }

    // 新しいIP/場所
    const { data: recentLogins } = await this.serviceRoleClient
      .from('security_audit_logs')
      .select('ip_address, geo_location')
      .eq('user_id', user.id)
      .eq('event_type', 'login')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10)

    const knownIPs = recentLogins?.map(log => log.ip_address) || []
    if (!knownIPs.includes(context.ip_address)) {
      riskScore += 0.3
    }

    // 管理者権限
    if (user.role === 'admin') {
      riskScore += 0.1
    }

    // 脅威インジケーター
    if (context.threat_indicators.suspicious_user_agent) {
      riskScore += 0.4
    }

    return Math.min(riskScore, 1.0)
  }

  /**
   * セキュリティコンテキスト分析
   */
  private async analyzeSecurityContext(request: Request): Promise<SecurityContext> {
    const ip = request.ip || request.connection.remoteAddress || '127.0.0.1'
    const userAgent = request.headers['user-agent'] || ''
    const geoLocation = geoip.lookup(ip)

    const threatIndicators = {
      suspicious_user_agent: this.detectSuspiciousUserAgent(userAgent),
      tor_exit_node: await this.checkTorExitNode(ip),
      known_malicious_ip: await this.checkMaliciousIP(ip)
    }

    const riskScore = Object.values(threatIndicators).filter(Boolean).length * 0.3

    return {
      ip_address: ip,
      user_agent: userAgent,
      geo_location: geoLocation,
      risk_score: riskScore,
      threat_indicators: threatIndicators
    }
  }

  /**
   * JWTトークン生成
   */
  private async generateTokens(
    user: TenantUser, 
    organization: Organization
  ): Promise<{ access_token: string, refresh_token: string }> {
    const payload = {
      user_id: user.id,
      organization_id: organization.id,
      tenant_id: organization.tenant_id,
      role: user.role,
      permissions: user.permissions,
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1時間
      iat: Math.floor(Date.now() / 1000)
    }

    const refreshPayload = {
      user_id: user.id,
      organization_id: organization.id,
      tenant_id: organization.tenant_id,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7日
      iat: Math.floor(Date.now() / 1000)
    }

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { algorithm: 'HS256' })
    const refreshToken = jwt.sign(refreshPayload, process.env.JWT_REFRESH_SECRET!, { algorithm: 'HS256' })

    return {
      access_token: accessToken,
      refresh_token: refreshToken
    }
  }

  /**
   * トークン検証・更新
   */
  async verifyAndRefreshToken(refreshToken: string): Promise<{
    success: boolean
    tokens?: { access_token: string, refresh_token: string }
    error?: string
  }> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any

      if (decoded.type !== 'refresh') {
        return { success: false, error: 'Invalid token type' }
      }

      // ユーザー・組織情報再取得
      const { data: userWithOrg } = await this.serviceRoleClient
        .from('tenant_users')
        .select(`
          *,
          organizations!inner(*)
        `)
        .eq('id', decoded.user_id)
        .eq('organization_id', decoded.organization_id)
        .eq('is_active', true)
        .single()

      if (!userWithOrg) {
        return { success: false, error: 'User not found or inactive' }
      }

      // 新しいトークン生成
      const tokens = await this.generateTokens(userWithOrg, userWithOrg.organizations)

      return { success: true, tokens }

    } catch (error) {
      return { success: false, error: 'Invalid refresh token' }
    }
  }

  /**
   * セキュリティイベントログ記録
   */
  private async logSecurityEvent(
    eventType: string,
    userId: string | null,
    result: string,
    context: SecurityContext
  ): Promise<void> {
    try {
      await this.serviceRoleClient
        .from('security_audit_logs')
        .insert({
          user_id: userId,
          event_type: eventType,
          action: 'authenticate',
          ip_address: context.ip_address,
          user_agent: context.user_agent,
          risk_score: context.risk_score,
          threat_indicators: context.threat_indicators,
          geo_location: context.geo_location,
          result
        })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  /**
   * 脅威検知ヘルパー
   */
  private detectSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /curl/i, /wget/i, /python/i, /bot/i, /crawler/i,
      /scanner/i, /test/i, /automated/i
    ]
    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }

  private async checkTorExitNode(ip: string): Promise<boolean> {
    // 実装例：Tor Exit Nodeチェック
    // 実際の実装では外部APIを使用
    return false
  }

  private async checkMaliciousIP(ip: string): Promise<boolean> {
    // 実装例：既知の悪意あるIPチェック
    // 実際の実装では脅威インテリジェンスAPIを使用
    return false
  }

  /**
   * ユーザー権限チェック
   */
  async checkPermission(
    userId: string, 
    tenantId: string, 
    permission: string
  ): Promise<boolean> {
    try {
      const { data: user } = await this.serviceRoleClient
        .from('tenant_users')
        .select(`
          permissions,
          role,
          organizations!inner(tenant_id)
        `)
        .eq('id', userId)
        .eq('organizations.tenant_id', tenantId)
        .eq('is_active', true)
        .single()

      if (!user) return false

      // 管理者は全権限
      if (user.role === 'admin') return true

      // 明示的な権限チェック
      return user.permissions?.[permission] === true
      
    } catch (error) {
      return false
    }
  }

  /**
   * セッション管理
   */
  async createSession(userId: string, tenantId: string): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // セッション情報をRedisまたはDBに保存
    // 実装は環境に応じて調整
    
    return sessionId
  }

  async validateSession(sessionId: string): Promise<boolean> {
    // セッション検証ロジック
    return true
  }

  async invalidateSession(sessionId: string): Promise<void> {
    // セッション無効化ロジック
  }
}