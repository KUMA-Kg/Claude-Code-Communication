import { Router } from 'express';
import { SubsidyModel } from '@/models/Subsidy';
import { QuestionFlowManager } from '@/services/QuestionFlowManager';
import { DeadlineScheduler } from '@/services/DeadlineScheduler';
import { supabaseService } from '@/config/database';
import { asyncHandler } from '@/middleware/asyncHandler';
import { authenticate } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validateRequest';
import { body, param, query } from 'express-validator';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * 補助金一覧取得（拡張版）
 * GET /api/subsidies
 */
router.get(
  '/',
  [
    query('subsidy_type').optional().isString(),
    query('status').optional().isIn(['active', 'upcoming', 'closed', 'suspended']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { subsidy_type, status, page = 1, limit = 20, ...searchParams } = req.query;

    // 拡張検索クエリの構築
    let searchQuery = SubsidyModel.search({
      ...searchParams,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    // 追加フィルタリング
    if (subsidy_type || status) {
      const { data: subsidies, error } = await supabaseService
        .from('subsidies')
        .select('*')
        .match({
          ...(subsidy_type && { subsidy_type }),
          ...(status && { status })
        })
        .eq('is_active', true);

      if (error) {
        logger.error('Failed to fetch subsidies with filters:', error);
        return res.status(500).json({ error: 'Failed to fetch subsidies' });
      }

      return res.json({
        subsidies: subsidies || [],
        total: subsidies?.length || 0,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
    }

    const result = await searchQuery;
    res.json(result);
  })
);

/**
 * 補助金詳細取得（拡張版）
 * GET /api/subsidies/:id
 */
router.get(
  '/:id',
  param('id').isString(),
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 基本情報取得
    const subsidy = await SubsidyModel.findById(id);
    if (!subsidy) {
      return res.status(404).json({ error: 'Subsidy not found' });
    }

    // 拡張情報を追加取得
    const { data: extendedData } = await supabaseService
      .from('subsidies')
      .select(`
        *,
        subsidy_types (
          id, name, display_name, description, icon_url, color_scheme
        ),
        subsidy_schedules (
          id, schedule_type, round_number, round_name,
          start_date, end_date, notification_date, status
        )
      `)
      .eq('id', id)
      .single();

    // ユーザーがログインしている場合はお気に入り状態も取得
    let isFavorite = false;
    if (req.user) {
      isFavorite = await SubsidyModel.isFavorite(req.user.id, id);
    }

    res.json({
      ...subsidy,
      ...extendedData,
      isFavorite
    });
  })
);

/**
 * 補助金の質問フロー取得
 * GET /api/subsidies/:id/questions
 */
router.get(
  '/:id/questions',
  param('id').isString(),
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 補助金の存在確認
    const subsidy = await SubsidyModel.findById(id);
    if (!subsidy) {
      return res.status(404).json({ error: 'Subsidy not found' });
    }

    // 質問セットを取得
    const questionSet = await QuestionFlowManager.getQuestionSet(id);
    if (!questionSet) {
      // 補助金タイプから質問セットを取得
      const { data } = await supabaseService
        .from('subsidies')
        .select('subsidy_type')
        .eq('id', id)
        .single();

      if (data?.subsidy_type) {
        const typeQuestionSet = await QuestionFlowManager.getQuestionSet(
          undefined,
          data.subsidy_type
        );
        return res.json(typeQuestionSet || { questions: [] });
      }

      return res.json({ questions: [] });
    }

    res.json(questionSet);
  })
);

/**
 * 質問への回答を検証
 * POST /api/subsidies/:id/validate-answers
 */
router.post(
  '/:id/validate-answers',
  authenticate,
  [
    param('id').isString(),
    body('answers').isObject()
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { answers } = req.body;

    // 質問セットを取得
    const questionSet = await QuestionFlowManager.getQuestionSet(id);
    if (!questionSet) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    // 回答を検証
    const validationResult = QuestionFlowManager.validateAnswers(
      questionSet.questions,
      answers
    );

    // 表示すべき質問を計算
    const visibleQuestions = QuestionFlowManager.evaluateQuestionVisibility(
      questionSet.questions,
      answers
    );

    res.json({
      valid: validationResult.valid,
      errors: validationResult.errors,
      visibleQuestions: visibleQuestions.map(q => ({
        questionCode: q.questionCode,
        isRequired: QuestionFlowManager.isQuestionRequired(q, answers)
      }))
    });
  })
);

/**
 * 補助金のスケジュール取得
 * GET /api/subsidies/:id/schedules
 */
router.get(
  '/:id/schedules',
  param('id').isString(),
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { data: schedules, error } = await supabaseService
      .from('subsidy_schedules')
      .select('*')
      .eq('subsidy_id', id)
      .order('start_date', { ascending: true });

    if (error) {
      logger.error('Failed to fetch schedules:', error);
      return res.status(500).json({ error: 'Failed to fetch schedules' });
    }

    res.json(schedules || []);
  })
);

/**
 * 締切アラート設定
 * POST /api/subsidies/:id/alerts
 */
router.post(
  '/:id/alerts',
  authenticate,
  [
    param('id').isString(),
    body('alert_type').isIn(['email', 'push', 'both']),
    body('days_before').isArray(),
    body('days_before.*').isInt({ min: 1, max: 365 })
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { alert_type, days_before } = req.body;

    const alertId = await DeadlineScheduler.setUserAlert(
      req.user!.id,
      id,
      {
        alertType: alert_type,
        daysBefore: days_before,
        isActive: true
      }
    );

    if (!alertId) {
      return res.status(500).json({ error: 'Failed to set alert' });
    }

    res.json({ id: alertId, message: 'Alert set successfully' });
  })
);

/**
 * 締切アラート解除
 * DELETE /api/subsidies/:id/alerts
 */
router.delete(
  '/:id/alerts',
  authenticate,
  param('id').isString(),
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { error } = await supabaseService
      .from('deadline_alerts')
      .update({ is_active: false })
      .eq('user_id', req.user!.id)
      .eq('subsidy_id', id);

    if (error) {
      logger.error('Failed to delete alert:', error);
      return res.status(500).json({ error: 'Failed to delete alert' });
    }

    res.json({ message: 'Alert deleted successfully' });
  })
);

/**
 * 補助金タイプ一覧取得
 * GET /api/subsidies/types
 */
router.get(
  '/types',
  asyncHandler(async (req, res) => {
    const { data: types, error } = await supabaseService
      .from('subsidy_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      logger.error('Failed to fetch subsidy types:', error);
      return res.status(500).json({ error: 'Failed to fetch subsidy types' });
    }

    res.json(types || []);
  })
);

/**
 * 管理者用: 補助金情報を更新
 * PUT /api/subsidies/:id
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').isString(),
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('status').optional().isIn(['active', 'upcoming', 'closed', 'suspended']),
    body('metadata').optional().isObject()
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    // 管理者権限チェック
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const updates = req.body;

    // ユーザーIDを設定（バージョン管理用）
    await supabaseService.rpc('set_config', {
      setting: 'app.current_user_id',
      value: req.user.id
    });

    const { data, error } = await supabaseService
      .from('subsidies')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update subsidy:', error);
      return res.status(500).json({ error: 'Failed to update subsidy' });
    }

    res.json(data);
  })
);

export default router;