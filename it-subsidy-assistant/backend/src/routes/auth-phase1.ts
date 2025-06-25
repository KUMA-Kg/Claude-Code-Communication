import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const router = Router()

/**
 * ユーザー登録（サインアップ）
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name, companyName } = req.body

    // バリデーション
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      })
    }

    // Supabase Authでユーザー作成
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          company_name: companyName
        }
      }
    })

    if (authError) {
      logger.error('Signup auth error:', authError)
      return res.status(400).json({
        error: {
          code: 'SIGNUP_ERROR',
          message: authError.message
        }
      })
    }

    // usersテーブルにレコード作成
    const { data: user, error: dbError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authData.user?.id,
        email,
        name,
        company_name: companyName
      })
      .select()
      .single()

    if (dbError) {
      logger.error('User record creation error:', dbError)
      // Authユーザーは作成されているので、エラーログのみ
    }

    // JWTトークン生成
    const token = jwt.sign(
      { 
        userId: user?.id || authData.user?.id,
        email: email,
        role: 'user'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user?.id,
          email: user?.email,
          name: user?.name,
          company_name: user?.company_name
        },
        token,
        auth_user_id: authData.user?.id
      }
    })

  } catch (error) {
    logger.error('Signup error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

/**
 * ログイン
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // バリデーション
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      })
    }

    // Supabase Auth でログイン
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      logger.error('Login auth error:', authError)
      return res.status(401).json({
        error: {
          code: 'LOGIN_ERROR',
          message: 'Invalid email or password'
        }
      })
    }

    // usersテーブルからユーザー情報取得
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authData.user?.id)
      .single()

    if (userError || !user) {
      logger.error('User not found in database:', userError)
      // ユーザーレコードがない場合は作成
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          auth_user_id: authData.user?.id,
          email: authData.user?.email,
          name: authData.user?.user_metadata?.name,
          company_name: authData.user?.user_metadata?.company_name
        })
        .select()
        .single()

      if (newUser) {
        Object.assign(user, newUser)
      }
    }

    // JWTトークン生成
    const token = jwt.sign(
      { 
        userId: user?.id || authData.user?.id,
        email: email,
        role: user?.role || 'user'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // セッション情報
    const sessionData = {
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
      expires_at: authData.session?.expires_at
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user?.id,
          email: user?.email,
          name: user?.name,
          company_name: user?.company_name,
          role: user?.role
        },
        token,
        session: sessionData
      }
    })

  } catch (error) {
    logger.error('Login error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

/**
 * ログアウト
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Supabase Authからログアウト
    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.error('Logout error:', error)
    }

    return res.json({
      success: true,
      message: 'Logged out successfully'
    })

  } catch (error) {
    logger.error('Logout error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

/**
 * 現在のユーザー情報取得
 */
router.get('/me', async (req: Request, res: Response) => {
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

    // トークン検証
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (err) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      })
    }

    // ユーザー情報取得
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      })
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          company_name: user.company_name,
          role: user.role,
          created_at: user.created_at
        }
      }
    })

  } catch (error) {
    logger.error('Get user error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

/**
 * パスワードリセットリクエスト
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required'
        }
      })
    }

    // Supabase Auth パスワードリセット
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    })

    if (error) {
      logger.error('Password reset error:', error)
      return res.status(400).json({
        error: {
          code: 'RESET_ERROR',
          message: error.message
        }
      })
    }

    return res.json({
      success: true,
      message: 'Password reset email sent'
    })

  } catch (error) {
    logger.error('Password reset error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

/**
 * トークンリフレッシュ
 */
router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body

    if (!refresh_token) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required'
        }
      })
    }

    // Supabase Auth でトークンリフレッシュ
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    })

    if (error) {
      logger.error('Token refresh error:', error)
      return res.status(401).json({
        error: {
          code: 'REFRESH_ERROR',
          message: 'Invalid refresh token'
        }
      })
    }

    // 新しいJWTトークン生成
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', data.user?.id)
      .single()

    const token = jwt.sign(
      { 
        userId: user?.id || data.user?.id,
        email: data.user?.email,
        role: user?.role || 'user'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return res.json({
      success: true,
      data: {
        token,
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at
        }
      }
    })

  } catch (error) {
    logger.error('Token refresh error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

export default router