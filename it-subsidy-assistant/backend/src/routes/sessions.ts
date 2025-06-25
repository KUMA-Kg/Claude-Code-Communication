import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { authenticateJWT } from '../middleware/auth-jwt'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// 全エンドポイントで認証を要求
router.use(authenticateJWT)

/**
 * セッション一覧取得
 * GET /api/sessions
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      })
    }

    const { limit = 20, offset = 0 } = req.query

    // ユーザーのセッション一覧を取得
    const { data: sessions, error, count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (error) {
      logger.error('Failed to fetch sessions:', error)
      return res.status(500).json({
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch sessions',
          details: error.message
        }
      })
    }

    return res.json({
      success: true,
      data: sessions || [],
      meta: {
        total: count || 0,
        limit: Number(limit),
        offset: Number(offset)
      }
    })

  } catch (error) {
    logger.error('Get sessions error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

/**
 * セッション詳細取得
 * GET /api/sessions/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const sessionId = req.params.id

    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      })
    }

    // セッション取得（ユーザーIDでフィルタ）
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (error || !session) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found'
        }
      })
    }

    return res.json({
      success: true,
      data: session
    })

  } catch (error) {
    logger.error('Get session error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

/**
 * 新規セッション作成
 * POST /api/sessions
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      })
    }

    const { name, answers = {}, recommendations = {}, generated_documents = {} } = req.body

    // 名前の検証
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session name is required'
        }
      })
    }

    // 新規セッション作成
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        name: name.trim(),
        answers,
        recommendations,
        generated_documents
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create session:', error)
      return res.status(500).json({
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create session',
          details: error.message
        }
      })
    }

    return res.status(201).json({
      success: true,
      data: session
    })

  } catch (error) {
    logger.error('Create session error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

/**
 * セッション更新
 * PUT /api/sessions/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const sessionId = req.params.id

    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      })
    }

    const { name, answers, recommendations, generated_documents } = req.body

    // 更新データの準備
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (answers !== undefined) updateData.answers = answers
    if (recommendations !== undefined) updateData.recommendations = recommendations
    if (generated_documents !== undefined) updateData.generated_documents = generated_documents

    // 空の場合はエラー
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No data to update'
        }
      })
    }

    // セッション更新（ユーザーIDでフィルタ）
    const { data: session, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update session:', error)
      return res.status(500).json({
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update session',
          details: error.message
        }
      })
    }

    if (!session) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found'
        }
      })
    }

    return res.json({
      success: true,
      data: session
    })

  } catch (error) {
    logger.error('Update session error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

/**
 * セッション削除
 * DELETE /api/sessions/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const sessionId = req.params.id

    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      })
    }

    // セッション削除（ユーザーIDでフィルタ）
    const { error, count } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId)

    if (error) {
      logger.error('Failed to delete session:', error)
      return res.status(500).json({
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete session',
          details: error.message
        }
      })
    }

    if (count === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found'
        }
      })
    }

    return res.json({
      success: true,
      message: 'Session deleted successfully'
    })

  } catch (error) {
    logger.error('Delete session error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

/**
 * セッション一括更新（部分更新）
 * PATCH /api/sessions/:id
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const sessionId = req.params.id

    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      })
    }

    // 既存セッション取得
    const { data: existingSession, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existingSession) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found'
        }
      })
    }

    // 部分更新データのマージ
    const { name, answers, recommendations, generated_documents } = req.body
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (answers !== undefined) {
      updateData.answers = { ...existingSession.answers, ...answers }
    }
    if (recommendations !== undefined) {
      updateData.recommendations = { ...existingSession.recommendations, ...recommendations }
    }
    if (generated_documents !== undefined) {
      updateData.generated_documents = { ...existingSession.generated_documents, ...generated_documents }
    }

    // セッション更新
    const { data: session, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      logger.error('Failed to patch session:', error)
      return res.status(500).json({
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update session',
          details: error.message
        }
      })
    }

    return res.json({
      success: true,
      data: session
    })

  } catch (error) {
    logger.error('Patch session error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

export default router