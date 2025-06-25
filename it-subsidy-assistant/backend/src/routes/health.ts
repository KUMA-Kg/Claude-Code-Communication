import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

const router = Router()

/**
 * ヘルスチェックエンドポイント
 * Worker1の要求に準拠
 */
router.get('/v1/health', async (req: Request, res: Response) => {
  try {
    // データベース接続確認
    const { error } = await supabase
      .from('subsidies')
      .select('id')
      .limit(1)

    if (error) {
      logger.error('Database health check failed:', error)
      return res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: {
          code: 'DB_CONNECTION_ERROR',
          message: 'Database connection failed'
        }
      })
    }

    // 成功レスポンス
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.API_VERSION || 'v1.0.0',
      environment: process.env.NODE_ENV || 'development'
    })

  } catch (error) {
    logger.error('Health check error:', error)
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: 'Health check failed'
      }
    })
  }
})

/**
 * 詳細ヘルスチェック（内部用）
 */
router.get('/v1/health/detailed', async (req: Request, res: Response) => {
  try {
    const checks = {
      database: false,
      redis: false,
      authentication: false,
      storage: false
    }

    // データベースチェック
    try {
      const { error } = await supabase
        .from('subsidies')
        .select('count')
        .limit(1)
      checks.database = !error
    } catch (err) {
      checks.database = false
    }

    // Redis チェック（実装されている場合）
    // TODO: Redis接続確認

    // 認証サービスチェック
    checks.authentication = !!supabase.auth

    // ストレージチェック
    try {
      const { error } = await supabase.storage
        .from('documents')
        .list('', { limit: 1 })
      checks.storage = !error
    } catch (err) {
      checks.storage = false
    }

    const allHealthy = Object.values(checks).every(check => check)

    return res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.API_VERSION || 'v1.0.0'
    })

  } catch (error) {
    logger.error('Detailed health check error:', error)
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: 'Detailed health check failed'
      }
    })
  }
})

export default router