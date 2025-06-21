import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { EligibilityRuleModel } from '@/models/EligibilityRule';
import { logger } from '@/utils/logger';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';

const router = Router();

// バリデーションルール
const checkEligibilityValidation = [
  param('subsidyId')
    .notEmpty()
    .withMessage('補助金IDは必須です'),
  body('answers')
    .isObject()
    .withMessage('回答データはオブジェクト形式で送信してください')
];

const simpleCheckValidation = [
  param('subsidyId')
    .notEmpty()
    .withMessage('補助金IDは必須です'),
  body('hasDigitization')
    .isBoolean()
    .withMessage('電子化対応の有無を指定してください'),
  body('hasSecurityInvestment')
    .isBoolean()
    .withMessage('セキュリティ投資の有無を指定してください'),
  body('isInvoiceRequired')
    .isBoolean()
    .withMessage('インボイス対応の必要性を指定してください')
];

// 申請枠の自動判定（詳細版）
router.post(
  '/subsidies/:subsidyId/check-eligibility',
  authenticate,
  checkEligibilityValidation,
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { subsidyId } = req.params;
    const { answers } = req.body;

    const results = await EligibilityRuleModel.checkEligibility(subsidyId, answers);

    // 適格な枠のみフィルタリング
    const eligibleFrames = results.filter(r => r.is_eligible);
    const recommendedFrame = eligibleFrames[0] || null;

    logger.info('Eligibility check performed', {
      userId: req.user!.userId,
      subsidyId,
      eligibleCount: eligibleFrames.length,
      recommendedFrame: recommendedFrame?.frame_code
    });

    res.json({
      success: true,
      data: {
        eligible_frames: eligibleFrames,
        recommended_frame: recommendedFrame,
        all_results: results
      }
    });
  })
);

// 申請枠の自動判定（簡易版・3つの質問）
router.post(
  '/subsidies/:subsidyId/check-eligibility-simple',
  authenticate,
  simpleCheckValidation,
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { subsidyId } = req.params;
    const { hasDigitization, hasSecurityInvestment, isInvoiceRequired } = req.body;

    const result = await EligibilityRuleModel.checkEligibilitySimple(
      subsidyId,
      hasDigitization,
      hasSecurityInvestment,
      isInvoiceRequired
    );

    logger.info('Simple eligibility check performed', {
      userId: req.user!.userId,
      subsidyId,
      recommendedFrame: result.frame_code
    });

    res.json({
      success: true,
      data: {
        recommended_frame: result,
        questions_asked: {
          hasDigitization,
          hasSecurityInvestment,
          isInvoiceRequired
        }
      }
    });
  })
);

// 補助金の全申請枠を取得
router.get(
  '/subsidies/:subsidyId/frames',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { subsidyId } = req.params;

    const frames = await EligibilityRuleModel.getAllFrames(subsidyId);

    res.json({
      success: true,
      data: frames,
      count: frames.length
    });
  })
);

// 特定の申請枠の詳細を取得
router.get(
  '/subsidies/:subsidyId/frames/:frameCode',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { subsidyId, frameCode } = req.params;

    const frame = await EligibilityRuleModel.getFrameDetails(subsidyId, frameCode);

    if (!frame) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FRAME_NOT_FOUND',
          message: '指定された申請枠が見つかりません'
        }
      });
    }

    res.json({
      success: true,
      data: frame
    });
  })
);

// 申請枠判定のための質問取得
router.get(
  '/subsidies/:subsidyId/eligibility-questions',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { subsidyId } = req.params;

    // シンプルな3つの質問を返す
    const questions = [
      {
        id: 'hasDigitization',
        type: 'boolean',
        text: '紙の書類や業務プロセスを電子化・デジタル化する予定はありますか？',
        description: '請求書、契約書、報告書などの電子化、ワークフローのデジタル化などが該当します',
        order: 1
      },
      {
        id: 'hasSecurityInvestment',
        type: 'boolean',
        text: 'セキュリティ対策のためのIT投資を行う予定はありますか？',
        description: 'ファイアウォール、ウイルス対策、EDR、SIEM等のセキュリティツール導入が該当します',
        order: 2
      },
      {
        id: 'isInvoiceRequired',
        type: 'boolean',
        text: 'インボイス制度への対応が必要ですか？',
        description: '課税事業者でインボイス登録をしていない、または登録予定の場合が該当します',
        order: 3
      }
    ];

    res.json({
      success: true,
      data: questions
    });
  })
);

export const eligibilityRoutes = router;