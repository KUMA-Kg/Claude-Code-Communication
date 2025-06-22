import { Router, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import { RequiredDocumentModel } from '@/models/RequiredDocument';
import { EligibilityRuleModel } from '@/models/EligibilityRule';
import { logger } from '@/utils/logger';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { authenticate, AuthenticatedRequest } from '@/middleware/auth';

const router = Router();

// 申請枠に基づく必要書類の取得
router.get(
  '/subsidies/:subsidyId/frames/:frameCode/documents',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subsidyId, frameCode } = req.params;

    const documents = await RequiredDocumentModel.getRequiredDocuments(subsidyId, frameCode);

    res.json({
      success: true,
      data: documents,
      count: documents.length
    });
  })
);

// カテゴリ別に必要書類を取得
router.get(
  '/subsidies/:subsidyId/frames/:frameCode/documents/by-category',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subsidyId, frameCode } = req.params;

    const documentsByCategory = await RequiredDocumentModel.getDocumentsByCategory(
      subsidyId,
      frameCode
    );

    // カテゴリ順序の定義
    const categoryOrder = ['基本書類', '財務書類', '事業計画書類', '枠別書類', '見積書類', 'ベンダー書類', '任意書類'];
    
    // 順序付きで返す
    const orderedCategories = categoryOrder
      .filter(cat => documentsByCategory[cat])
      .map(cat => ({
        category: cat,
        documents: documentsByCategory[cat]
      }));

    res.json({
      success: true,
      data: orderedCategories,
      total_documents: Object.values(documentsByCategory).flat().length
    });
  })
);

// 自動判定による必要書類の抽出
router.post(
  '/subsidies/:subsidyId/documents/auto-extract',
  authenticate,
  [
    param('subsidyId').notEmpty().withMessage('補助金IDは必須です'),
    body('hasDigitization').isBoolean().withMessage('電子化対応の有無を指定してください'),
    body('hasSecurityInvestment').isBoolean().withMessage('セキュリティ投資の有無を指定してください'),
    body('isInvoiceRequired').isBoolean().withMessage('インボイス対応の必要性を指定してください')
  ],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { subsidyId } = req.params;
    const { hasDigitization, hasSecurityInvestment, isInvoiceRequired } = req.body;

    // まず申請枠を判定
    const eligibilityResult = await EligibilityRuleModel.checkEligibilitySimple(
      subsidyId,
      hasDigitization,
      hasSecurityInvestment,
      isInvoiceRequired
    );

    // 判定された枠の必要書類を取得
    const documents = await RequiredDocumentModel.getRequiredDocuments(
      subsidyId,
      eligibilityResult.frame_code
    );

    // カテゴリ別にも整理
    const documentsByCategory = await RequiredDocumentModel.getDocumentsByCategory(
      subsidyId,
      eligibilityResult.frame_code
    );

    logger.info('Auto-extracted required documents', {
      userId: req.user!.userId,
      subsidyId,
      frameCode: eligibilityResult.frame_code,
      documentCount: documents.length
    });

    res.json({
      success: true,
      data: {
        recommended_frame: eligibilityResult,
        required_documents: documents,
        documents_by_category: documentsByCategory,
        total_required: documents.filter(d => d.is_required).length,
        total_optional: documents.filter(d => !d.is_required).length
      }
    });
  })
);

// 書類詳細の取得
router.get(
  '/documents/:documentCode',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { documentCode } = req.params;

    const document = await RequiredDocumentModel.getDocumentByCode(documentCode);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: '指定された書類が見つかりません'
        }
      });
    }

    res.json({
      success: true,
      data: document
    });
  })
);

// 申請用書類チェックリストの生成
router.get(
  '/applications/:applicationId/document-checklist',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { applicationId } = req.params;
    
    // TODO: 申請情報から補助金IDと申請枠を取得する処理を実装
    // 仮の実装
    const subsidyId = 'it-donyu-2024';
    const frameCode = 'normal';

    const checklist = await RequiredDocumentModel.generateDocumentChecklist(
      subsidyId,
      frameCode,
      applicationId
    );

    const summary = {
      total: checklist.length,
      required: checklist.filter(d => d.is_required).length,
      optional: checklist.filter(d => !d.is_required).length,
      uploaded: checklist.filter(d => d.is_uploaded).length,
      pending: checklist.filter(d => !d.is_uploaded && d.is_required).length,
      approved: checklist.filter(d => d.upload_status === 'approved').length,
      rejected: checklist.filter(d => d.upload_status === 'rejected').length
    };

    res.json({
      success: true,
      data: {
        checklist,
        summary,
        completion_rate: (summary.uploaded / summary.required * 100).toFixed(1)
      }
    });
  })
);

// 条件付き書類の評価
router.post(
  '/documents/evaluate-conditional',
  authenticate,
  [
    body('documents').isArray().withMessage('書類リストは配列形式で送信してください'),
    body('conditions').isObject().withMessage('条件データはオブジェクト形式で送信してください')
  ],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { documents, conditions } = req.body;

    const evaluatedDocuments = await RequiredDocumentModel.evaluateConditionalDocuments(
      documents,
      conditions
    );

    res.json({
      success: true,
      data: {
        required_documents: evaluatedDocuments,
        excluded_documents: documents.filter(
          (d: any) => !evaluatedDocuments.find(ed => ed.document_code === d.document_code)
        )
      }
    });
  })
);

export const documentsRequiredRoutes = router;