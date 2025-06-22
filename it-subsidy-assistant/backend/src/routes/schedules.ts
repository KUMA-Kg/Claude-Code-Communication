import { Router, Response } from 'express';
import { ScheduleModel } from '@/models/Schedule';
import { authenticate, AuthenticatedRequest } from '@/middleware/auth';
import { validateScheduleInput } from '@/validators/schedule';
import { asyncHandler } from '@/middleware/asyncHandler';
import { Schedule, ScheduleInput } from '@/types/schedule';

const router = Router();

/**
 * @route   POST /api/v1/schedules
 * @desc    スケジュールの作成
 * @access  Private
 */
router.post('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const scheduleData: ScheduleInput = req.body;

  // バリデーション
  const validation = validateScheduleInput(scheduleData);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid schedule data',
        details: validation.errors
      }
    });
  }

  const schedule = await ScheduleModel.create(userId, scheduleData);

  res.status(201).json({
    success: true,
    data: schedule
  });
}));

/**
 * @route   GET /api/v1/schedules
 * @desc    スケジュール一覧の取得
 * @access  Private
 */
router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const filters = {
    applicationId: req.query.applicationId as string,
    scheduleType: req.query.scheduleType as string,
    status: req.query.status as string,
    fromDate: req.query.fromDate as string,
    toDate: req.query.toDate as string
  };

  const schedules = await ScheduleModel.findByUser(userId, filters);

  res.json({
    success: true,
    data: schedules,
    meta: {
      total: schedules.length
    }
  });
}));

/**
 * @route   GET /api/v1/schedules/upcoming
 * @desc    今後のスケジュール取得（ダッシュボード用）
 * @access  Private
 */
router.get('/upcoming', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const limit = parseInt(req.query.limit as string) || 10;

  const schedules = await ScheduleModel.getUpcoming(userId, limit);

  res.json({
    success: true,
    data: schedules,
    meta: {
      total: schedules.length,
      limit
    }
  });
}));

/**
 * @route   GET /api/v1/schedules/:id
 * @desc    スケジュール詳細の取得
 * @access  Private
 */
router.get('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const scheduleId = req.params.id;

  const schedule = await ScheduleModel.findById(userId, scheduleId);

  if (!schedule) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Schedule not found'
      }
    });
  }

  res.json({
    success: true,
    data: schedule
  });
}));

/**
 * @route   PUT /api/v1/schedules/:id
 * @desc    スケジュールの更新
 * @access  Private
 */
router.put('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const scheduleId = req.params.id;
  const updateData: Partial<ScheduleInput> = req.body;

  // バリデーション（部分更新なので必須フィールドチェックはスキップ）
  if (updateData.schedule_type && !['deadline', 'meeting', 'submission', 'review', 'notification'].includes(updateData.schedule_type)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid schedule type'
      }
    });
  }

  const schedule = await ScheduleModel.update(userId, scheduleId, updateData);

  res.json({
    success: true,
    data: schedule
  });
}));

/**
 * @route   DELETE /api/v1/schedules/:id
 * @desc    スケジュールの削除
 * @access  Private
 */
router.delete('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const scheduleId = req.params.id;

  await ScheduleModel.delete(userId, scheduleId);

  res.json({
    success: true,
    message: 'Schedule deleted successfully'
  });
}));

/**
 * @route   POST /api/v1/schedules/:id/complete
 * @desc    スケジュールを完了にする
 * @access  Private
 */
router.post('/:id/complete', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const scheduleId = req.params.id;

  const schedule = await ScheduleModel.update(userId, scheduleId, {
    status: 'completed'
  });

  res.json({
    success: true,
    data: schedule
  });
}));

/**
 * @route   POST /api/v1/schedules/:id/cancel
 * @desc    スケジュールをキャンセルする
 * @access  Private
 */
router.post('/:id/cancel', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const scheduleId = req.params.id;
  const reason = req.body.reason;

  const currentSchedule = await ScheduleModel.findById(userId, scheduleId);
  if (!currentSchedule) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Schedule not found'
      }
    });
  }

  const schedule = await ScheduleModel.update(userId, scheduleId, {
    status: 'cancelled',
    description: reason ? `${currentSchedule.description || ''}\n\nキャンセル理由: ${reason}` : undefined
  });

  res.json({
    success: true,
    data: schedule
  });
}));

/**
 * @route   POST /api/v1/schedules/:id/postpone
 * @desc    スケジュールを延期する
 * @access  Private
 */
router.post('/:id/postpone', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const scheduleId = req.params.id;
  const { newDate, reason } = req.body;

  if (!newDate) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'New date is required'
      }
    });
  }

  const currentSchedule = await ScheduleModel.findById(userId, scheduleId);
  if (!currentSchedule) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Schedule not found'
      }
    });
  }

  const schedule = await ScheduleModel.update(userId, scheduleId, {
    status: 'postponed',
    scheduled_date: newDate,
    description: reason ? `${currentSchedule.description || ''}\n\n延期理由: ${reason}` : undefined
  });

  res.json({
    success: true,
    data: schedule
  });
}));

export { router as scheduleRoutes };