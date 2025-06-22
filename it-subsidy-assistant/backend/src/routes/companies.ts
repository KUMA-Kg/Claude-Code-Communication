import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { CompanyModel } from '@/models/Company';
import { logger } from '@/utils/logger';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { authenticate, AuthenticatedRequest } from '@/middleware/auth';

const router = Router();

// バリデーションルール
const createCompanyValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('企業名は必須です')
    .isLength({ max: 255 })
    .withMessage('企業名は255文字以内で入力してください'),
  body('corporate_number')
    .optional()
    .trim()
    .matches(/^\d{13}$/)
    .withMessage('法人番号は13桁の数字で入力してください'),
  body('postal_code')
    .optional()
    .trim()
    .matches(/^\d{3}-?\d{4}$/)
    .withMessage('郵便番号の形式が正しくありません'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d-+()]+$/)
    .withMessage('電話番号の形式が正しくありません'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('メールアドレスの形式が正しくありません'),
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('WebサイトURLの形式が正しくありません'),
  body('capital_amount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('資本金は0以上の整数で入力してください'),
  body('employee_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('従業員数は0以上の整数で入力してください'),
  body('annual_revenue')
    .optional()
    .isInt({ min: 0 })
    .withMessage('年商は0以上の整数で入力してください')
];

const updateCompanyValidation = [
  param('id').isUUID().withMessage('無効な企業IDです'),
  ...createCompanyValidation
];

const companyIdValidation = [
  param('id').isUUID().withMessage('無効な企業IDです')
];

// 企業一覧取得
router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  
  const companies = await CompanyModel.findByUserId(userId);
  
  res.json({
    success: true,
    data: companies,
    count: companies.length
  });
}));

// 企業詳細取得
router.get('/:id', authenticate, companyIdValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }
  
  const { id } = req.params;
  const userId = req.user!.userId;
  
  const company = await CompanyModel.findById(id, userId);
  
  if (!company) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COMPANY_NOT_FOUND',
        message: '企業情報が見つかりません'
      }
    });
  }
  
  res.json({
    success: true,
    data: company
  });
}));

// 法人番号で企業検索
router.get('/search/corporate-number/:number', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { number } = req.params;
  const userId = req.user!.userId;
  
  if (!number.match(/^\d{13}$/)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_CORPORATE_NUMBER',
        message: '法人番号は13桁の数字で入力してください'
      }
    });
  }
  
  const company = await CompanyModel.findByCorporateNumber(number, userId);
  
  res.json({
    success: true,
    data: company,
    found: !!company
  });
}));

// 企業作成
router.post('/', authenticate, createCompanyValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }
  
  const userId = req.user!.userId;
  
  // 法人番号の重複チェック
  if (req.body.corporate_number) {
    const existing = await CompanyModel.findByCorporateNumber(req.body.corporate_number, userId);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CORPORATE_NUMBER_EXISTS',
          message: 'この法人番号は既に登録されています'
        }
      });
    }
  }
  
  const company = await CompanyModel.create(userId, req.body);
  
  logger.info(`Company created: ${company.id}`, { 
    userId, 
    companyId: company.id,
    companyName: company.name 
  });
  
  res.status(201).json({
    success: true,
    data: company
  });
}));

// 企業更新
router.put('/:id', authenticate, updateCompanyValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }
  
  const { id } = req.params;
  const userId = req.user!.userId;
  
  // 存在確認
  const existing = await CompanyModel.findById(id, userId);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COMPANY_NOT_FOUND',
        message: '企業情報が見つかりません'
      }
    });
  }
  
  // 法人番号の重複チェック（変更時のみ）
  if (req.body.corporate_number && req.body.corporate_number !== existing.corporate_number) {
    const duplicate = await CompanyModel.findByCorporateNumber(req.body.corporate_number, userId);
    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CORPORATE_NUMBER_EXISTS',
          message: 'この法人番号は既に登録されています'
        }
      });
    }
  }
  
  const company = await CompanyModel.update(id, userId, req.body);
  
  logger.info(`Company updated: ${company.id}`, { 
    userId, 
    companyId: company.id,
    companyName: company.name 
  });
  
  res.json({
    success: true,
    data: company
  });
}));

// 企業削除
router.delete('/:id', authenticate, companyIdValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }
  
  const { id } = req.params;
  const userId = req.user!.userId;
  
  // 存在確認
  const existing = await CompanyModel.findById(id, userId);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COMPANY_NOT_FOUND',
        message: '企業情報が見つかりません'
      }
    });
  }
  
  await CompanyModel.delete(id, userId);
  
  logger.info(`Company deleted: ${id}`, { userId, companyId: id });
  
  res.json({
    success: true,
    message: '企業情報を削除しました'
  });
}));

export const companyRoutes = router;