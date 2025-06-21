import { Router, Request, Response, NextFunction } from 'express';
import { ScheduleModel } from '@/models/Schedule';
import { authMiddleware } from '@/middleware/auth';
import { validateScheduleInput } from '@/validators/schedule';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/types/api';
import { Schedule, ScheduleInput } from '@/types/schedule';

const router = Router();

/**
 * @route   POST /api/v1/schedules
 * @desc    スケジュールの作成
 * @access  Private
 */
router.post('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
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
    } as ApiResponse);
  }

  const schedule = await ScheduleModel.create(userId, scheduleData);

  res.status(201).json({
    success: true,
    data: schedule
  } as ApiResponse<Schedule>);
}));

/**
 * @route   GET /api/v1/schedules
 * @desc    スケジュール一覧の取得
 * @access  Private
 */
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
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
  } as ApiResponse<Schedule[]>);
}));

/**
 * @route   GET /api/v1/schedules/upcoming
 * @desc    今後のスケジュール取得（ダッシュボード用）
 * @access  Private
 */
router.get('/upcoming', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const limit = parseInt(req.query.limit as string) || 10;

  const schedules = await ScheduleModel.getUpcoming(userId, limit);

  res.json({
    success: true,
    data: schedules,
    meta: {
      total: schedules.length,
      limit
    }
  } as ApiResponse<Schedule[]>);
}));

/**
 * @route   GET /api/v1/schedules/:id
 * @desc    スケジュール詳細の取得
 * @access  Private
 */
router.get('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const scheduleId = req.params.id;

  const schedule = await ScheduleModel.findById(userId, scheduleId);

  if (!schedule) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Schedule not found'
      }
    } as ApiResponse);
  }

  res.json({
    success: true,
    data: schedule
  } as ApiResponse<Schedule>);
}));

/**
 * @route   PUT /api/v1/schedules/:id
 * @desc    スケジュールの更新
 * @access  Private
 */
router.put('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
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
    } as ApiResponse);
  }

  const schedule = await ScheduleModel.update(userId, scheduleId, updateData);

  res.json({
    success: true,
    data: schedule
  } as ApiResponse<Schedule>);
}));

/**
 * @route   DELETE /api/v1/schedules/:id
 * @desc    スケジュールの削除
 * @access  Private
 */
router.delete('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const scheduleId = req.params.id;

  await ScheduleModel.delete(userId, scheduleId);

  res.json({
    success: true,
    message: 'Schedule deleted successfully'
  } as ApiResponse);
}));

/**
 * @route   POST /api/v1/schedules/:id/complete
 * @desc    スケジュールを完了にする
 * @access  Private
 */
router.post('/:id/complete', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const scheduleId = req.params.id;

  const schedule = await ScheduleModel.update(userId, scheduleId, {
    status: 'completed'
  });

  res.json({
    success: true,
    data: schedule
  } as ApiResponse<Schedule>);
}));

/**
 * @route   POST /api/v1/schedules/:id/cancel
 * @desc    スケジュールをキャンセルする
 * @access  Private
 */
router.post('/:id/cancel', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const scheduleId = req.params.id;
  const reason = req.body.reason;

  const schedule = await ScheduleModel.update(userId, scheduleId, {
    status: 'cancelled',
    description: reason ? `${schedule.description || ''}\n\nキャンセル理由: ${reason}` : undefined
  });

  res.json({
    success: true,
    data: schedule
  } as ApiResponse<Schedule>);
}));

/**
 * @route   POST /api/v1/schedules/:id/postpone
 * @desc    スケジュールを延期する
 * @access  Private
 */
router.post('/:id/postpone', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const scheduleId = req.params.id;
  const { newDate, reason } = req.body;

  if (!newDate) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'New date is required'
      }
    } as ApiResponse);
  }

  const schedule = await ScheduleModel.update(userId, scheduleId, {
    status: 'postponed',
    scheduled_date: newDate,
    description: reason ? `${schedule.description || ''}\n\n延期理由: ${reason}` : undefined
  });

  res.json({
    success: true,
    data: schedule
  } as ApiResponse<Schedule>);
}));

export { router as scheduleRoutes };