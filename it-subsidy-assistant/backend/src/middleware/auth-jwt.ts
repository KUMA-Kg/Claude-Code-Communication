import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

// Request型を拡張してユーザー情報を追加
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        userId: string
        email: string
        role: string
      }
      authUserId?: string
    }
  }
}

/**
 * JWT認証ミドルウェア
 * Worker1連携用
 */
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Authorizationヘッダーからトークン取得
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided'
        }
      })
    }

    const token = authHeader.substring(7)

    // JWT検証
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (err) {
      logger.error('JWT verification failed:', err)
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      })
    }

    // ユーザー情報をリクエストに追加
    req.user = {
      id: decoded.userId || decoded.sub,
      userId: decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role || 'user'
    }

    // Supabase Authのuser_idも取得（RLS用）
    if (decoded.sub) {
      req.authUserId = decoded.sub
    }

    next()

  } catch (error) {
    logger.error('Authentication error:', error)
    return res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      }
    })
  }
}

/**
 * Supabaseトークン認証ミドルウェア（オプション）
 * Supabase Authトークンを直接使用する場合
 */
export const authenticateSupabase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided'
        }
      })
    }

    const token = authHeader.substring(7)

    // Supabaseトークン検証
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      logger.error('Supabase auth error:', error)
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      })
    }

    // ユーザー情報取得
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('auth_user_id', user.id)
      .single()

    req.user = {
      id: dbUser?.id || user.id,
      userId: dbUser?.id || user.id,
      email: user.email || '',
      role: dbUser?.role || 'user'
    }
    req.authUserId = user.id

    next()

  } catch (error) {
    logger.error('Supabase authentication error:', error)
    return res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      }
    })
  }
}

/**
 * オプショナル認証（認証なしでも続行可能）
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // トークンがない場合はそのまま続行
      return next()
    }

    const token = authHeader.substring(7)

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      req.user = {
        id: decoded.userId || decoded.sub,
        userId: decoded.userId || decoded.sub,
        email: decoded.email,
        role: decoded.role || 'user'
      }
    } catch (err) {
      // トークンが無効でも続行
      logger.warn('Optional auth: Invalid token', err)
    }

    next()

  } catch (error) {
    // エラーでも続行
    logger.error('Optional auth error:', error)
    next()
  }
}