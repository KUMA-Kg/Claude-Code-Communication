import { Router } from 'express';
import { query, param, validationResult } from 'express-validator';
import { SubsidyModel } from '@/models/Subsidy';
import { logger } from '@/utils/logger';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { authenticate, optionalAuth } from '@/middleware/auth';
import { searchRateLimit, logRateLimit } from '@/middleware/rateLimit';
import { SubsidySearchParams, SubsidySearchResponse, SubsidyDetailResponse } from '@/types/subsidy';
import { supabaseService } from '@/config/database';

const router = Router();

const searchValidation = [
  query('companySize')
    .optional()
    .isIn(['small', 'medium', 'large'])
    .withMessage('Company size must be one of: small, medium, large'),
  query('industry')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Industry code must be a valid string'),
  query('investmentAmount')
    .optional()
    .isNumeric()
    .toInt()
    .isInt({ min: 0 })
    .withMessage('Investment amount must be a positive number'),
  query('region')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Region code must be a valid string'),
  query('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid ISO 8601 date'),
  query('subsidyRate')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Subsidy rate must be between 0 and 1'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
  query('keyword')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Keyword must be between 1 and 100 characters')
];

const subsidyIdValidation = [
  param('id')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Subsidy ID must be a valid string')
];

router.get('/search', searchRateLimit, optionalAuth, searchValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }

  const user = (req as any).user;
  if (user) {
    await logRateLimit(req, 'search');
  }

  const searchParams: SubsidySearchParams = {
    companySize: req.query.companySize as any,
    industry: req.query.industry as string,
    investmentAmount: req.query.investmentAmount ? parseInt(req.query.investmentAmount as string) : undefined,
    region: req.query.region as string,
    deadline: req.query.deadline as string,
    subsidyRate: req.query.subsidyRate ? parseFloat(req.query.subsidyRate as string) : undefined,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    keyword: req.query.keyword as string
  };

  logger.info('Subsidy search request:', {
    params: searchParams,
    userId: user?.id,
    ip: req.ip
  });

  const { subsidies, total } = await SubsidyModel.search(searchParams);

  const totalPages = Math.ceil(total / searchParams.limit!);

  const response: SubsidySearchResponse = {
    success: true,
    data: {
      subsidies,
      pagination: {
        page: searchParams.page!,
        limit: searchParams.limit!,
        total,
        totalPages
      }
    }
  };

  if (user) {
    await supabaseService
      .from('search_logs')
      .insert({
        user_id: user.id,
        search_params: searchParams,
        result_count: subsidies.length,
        response_time_ms: Date.now() - req.startTime,
        created_at: new Date().toISOString()
      });
  }

  res.json(response);
}));

router.get('/regions', asyncHandler(async (req, res) => {
  const regions = await SubsidyModel.getAllRegions();
  
  res.json({
    success: true,
    data: { regions }
  });
}));

router.get('/industries', asyncHandler(async (req, res) => {
  const industries = await SubsidyModel.getAllIndustries();
  
  res.json({
    success: true,
    data: { industries }
  });
}));

router.get('/favorites', authenticate, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const favorites = await SubsidyModel.getUserFavorites(user.id);

  res.json({
    success: true,
    data: { favorites }
  });
}));

router.get('/:id', subsidyIdValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }

  const { id } = req.params;
  const subsidy = await SubsidyModel.findById(id);

  if (!subsidy) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Subsidy not found'
      }
    });
  }

  const response: SubsidyDetailResponse = {
    success: true,
    data: subsidy
  };

  logger.info('Subsidy detail viewed:', {
    subsidyId: id,
    ip: req.ip
  });

  res.json(response);
}));

router.post('/:id/favorite', authenticate, subsidyIdValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }

  const { id } = req.params;
  const user = (req as any).user;

  const subsidy = await SubsidyModel.findById(id);
  if (!subsidy) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Subsidy not found'
      }
    });
  }

  const isAlreadyFavorite = await SubsidyModel.isFavorite(user.id, id);
  if (isAlreadyFavorite) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Subsidy already in favorites'
      }
    });
  }

  await SubsidyModel.addToFavorites(user.id, id);

  logger.info('Subsidy added to favorites:', {
    subsidyId: id,
    userId: user.id
  });

  res.json({
    success: true,
    message: 'Added to favorites'
  });
}));

router.delete('/:id/favorite', authenticate, subsidyIdValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }

  const { id } = req.params;
  const user = (req as any).user;

  await SubsidyModel.removeFromFavorites(user.id, id);

  logger.info('Subsidy removed from favorites:', {
    subsidyId: id,
    userId: user.id
  });

  res.json({
    success: true,
    message: 'Removed from favorites'
  });
}));

export { router as subsidyRoutes };