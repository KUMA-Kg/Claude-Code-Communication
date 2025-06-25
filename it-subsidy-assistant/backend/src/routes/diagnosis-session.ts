import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { v4 as uuidv4 } from 'uuid'
import { authenticate } from '../middleware/auth'

const router = Router()

/**
 * 新規診断セッション作成
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { userId, metadata = {} } = req.body

    // セッションコード生成（短く覚えやすい）
    const sessionCode = `DS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    const { data: session, error } = await supabase
      .from('diagnosis_sessions')
      .insert({
        user_id: userId,
        session_code: sessionCode,
        metadata,
        status: 'in_progress'
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create diagnosis session:', error)
      return res.status(500).json({
        error: {
          code: 'SESSION_CREATE_ERROR',
          message: 'Failed to create diagnosis session',
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
 * セッション情報取得
 */
router.get('/sessions/:sessionCode', async (req: Request, res: Response) => {
  try {
    const { sessionCode } = req.params

    const { data: session, error } = await supabase
      .from('diagnosis_sessions')
      .select(`
        *,
        diagnosis_answers (
          question_code,
          question_text,
          answer_value,
          answer_type,
          answered_at
        ),
        subsidy_recommendations (
          subsidy_id,
          subsidy_name,
          match_score,
          match_reasons,
          is_selected
        )
      `)
      .eq('session_code', sessionCode)
      .single()

    if (error || !session) {
      return res.status(404).json({
        error: {
          code: 'SESSION_NOT_FOUND',
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
 * 診断回答保存
 */
router.post('/sessions/:sessionId/answers', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    const answers = req.body.answers || []

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ANSWERS',
          message: 'Answers must be a non-empty array'
        }
      })
    }

    // 既存回答の削除（更新のため）
    const questionCodes = answers.map(a => a.question_code)
    await supabase
      .from('diagnosis_answers')
      .delete()
      .eq('session_id', sessionId)
      .in('question_code', questionCodes)

    // 新規回答の挿入
    const answerRecords = answers.map(answer => ({
      session_id: sessionId,
      question_code: answer.question_code,
      question_text: answer.question_text,
      answer_value: answer.answer_value,
      answer_type: answer.answer_type
    }))

    const { data, error } = await supabase
      .from('diagnosis_answers')
      .insert(answerRecords)
      .select()

    if (error) {
      logger.error('Failed to save answers:', error)
      return res.status(500).json({
        error: {
          code: 'ANSWERS_SAVE_ERROR',
          message: 'Failed to save answers',
          details: error.message
        }
      })
    }

    return res.json({
      success: true,
      data: {
        saved_count: data.length,
        answers: data
      }
    })

  } catch (error) {
    logger.error('Save answers error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

/**
 * 推薦結果保存
 */
router.post('/sessions/:sessionId/recommendations', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    const { recommendations = [] } = req.body

    if (!Array.isArray(recommendations)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_RECOMMENDATIONS',
          message: 'Recommendations must be an array'
        }
      })
    }

    // 既存推薦の削除
    await supabase
      .from('subsidy_recommendations')
      .delete()
      .eq('session_id', sessionId)

    // 新規推薦の挿入
    const recommendationRecords = recommendations.map(rec => ({
      session_id: sessionId,
      subsidy_id: rec.subsidy_id,
      subsidy_name: rec.subsidy_name,
      match_score: rec.match_score || 0,
      match_reasons: rec.match_reasons || [],
      is_selected: rec.is_selected || false
    }))

    const { data, error } = await supabase
      .from('subsidy_recommendations')
      .insert(recommendationRecords)
      .select()

    if (error) {
      logger.error('Failed to save recommendations:', error)
      return res.status(500).json({
        error: {
          code: 'RECOMMENDATIONS_SAVE_ERROR',
          message: 'Failed to save recommendations',
          details: error.message
        }
      })
    }

    return res.json({
      success: true,
      data: {
        saved_count: data.length,
        recommendations: data
      }
    })

  } catch (error) {
    logger.error('Save recommendations error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

/**
 * セッション完了
 */
router.put('/sessions/:sessionId/complete', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params

    const { data, error } = await supabase
      .from('diagnosis_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      logger.error('Failed to complete session:', error)
      return res.status(500).json({
        error: {
          code: 'SESSION_COMPLETE_ERROR',
          message: 'Failed to complete session',
          details: error.message
        }
      })
    }

    return res.json({
      success: true,
      data
    })

  } catch (error) {
    logger.error('Complete session error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

/**
 * 生成文書保存
 */
router.post('/sessions/:sessionId/documents', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    const { userId, documentType, documentName, content, metadata = {} } = req.body

    if (!documentType || !content) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DOCUMENT',
          message: 'Document type and content are required'
        }
      })
    }

    const { data, error } = await supabase
      .from('generated_documents')
      .insert({
        session_id: sessionId,
        user_id: userId,
        document_type: documentType,
        document_name: documentName || `${documentType}_${Date.now()}`,
        content,
        metadata
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to save document:', error)
      return res.status(500).json({
        error: {
          code: 'DOCUMENT_SAVE_ERROR',
          message: 'Failed to save document',
          details: error.message
        }
      })
    }

    return res.status(201).json({
      success: true,
      data
    })

  } catch (error) {
    logger.error('Save document error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

/**
 * ユーザーの過去セッション一覧取得
 */
router.get('/users/:userId/sessions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { limit = 10, offset = 0 } = req.query

    const { data: sessions, error, count } = await supabase
      .from('diagnosis_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (error) {
      logger.error('Failed to get user sessions:', error)
      return res.status(500).json({
        error: {
          code: 'SESSIONS_FETCH_ERROR',
          message: 'Failed to fetch sessions',
          details: error.message
        }
      })
    }

    return res.json({
      success: true,
      data: {
        sessions,
        total: count,
        limit: Number(limit),
        offset: Number(offset)
      }
    })

  } catch (error) {
    logger.error('Get user sessions error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })
  }
})

export default router