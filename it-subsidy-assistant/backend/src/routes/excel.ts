import express from 'express';
import multer from 'multer';
import { ExcelProcessor } from '@/services/excelProcessor';
import { authenticate } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validateRequest';
import { logger } from '@/utils/logger';
import { body, param, query } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { AuthenticatedRequest } from '@/types/auth';

const router = express.Router();
const excelProcessor = new ExcelProcessor();

// ファイルアップロード設定
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('サポートされていないファイル形式です'));
    }
  }
});

// レート制限設定
const excelRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 10, // 最大10回のリクエスト
  message: {
    error: 'レート制限に達しました。15分後に再試行してください。'
  }
});

// バリデーションルール
const writeValidation = [
  body('subsidyType')
    .isIn(['it-donyu', 'monozukuri', 'jizokuka'])
    .withMessage('有効な補助金タイプを指定してください'),
  body('applicationFrame')
    .optional()
    .isString()
    .withMessage('申請枠は文字列で指定してください'),
  body('formData')
    .isObject()
    .withMessage('フォームデータはオブジェクト形式で送信してください'),
];

const templateValidation = [
  param('subsidyType')
    .isIn(['it-donyu', 'monozukuri', 'jizokuka'])
    .withMessage('有効な補助金タイプを指定してください'),
  query('templateName')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('テンプレート名は1-100文字で指定してください')
];

/**
 * @route POST /api/excel/read
 * @desc Excel書類読み取り
 * @access Private
 */
router.post('/read', 
  authenticate,
  excelRateLimit,
  upload.single('excelFile'),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Excelファイルが選択されていません'
        });
      }

      logger.info(`Excel読み取り要求: ${req.file.originalname}`, {
        userId: req.user?.id,
        fileSize: req.file.size
      });

      const result = await excelProcessor.readExcelFile(
        req.file.buffer,
        req.file.originalname
      );

      res.json({
        success: true,
        message: 'Excel読み取りが完了しました',
        data: result
      });

    } catch (error) {
      logger.error('Excel読み取りエラー:', error, {
        userId: req.user?.id,
        fileName: req.file?.originalname
      });

      res.status(500).json({
        success: false,
        message: 'Excel読み取りに失敗しました',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route POST /api/excel/write
 * @desc フォームデータExcel書き込み
 * @access Private
 */
router.post('/write',
  authenticate,
  excelRateLimit,
  writeValidation,
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { subsidyType, applicationFrame, formData } = req.body;

      logger.info(`Excel書き込み要求: ${subsidyType}`, {
        userId: req.user?.id,
        applicationFrame,
        fieldCount: Object.keys(formData).length
      });

      const result = await excelProcessor.writeFormDataToExcel({
        subsidyType,
        applicationFrame,
        formData
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Excel書き込みでエラーが発生しました',
          errors: result.errors
        });
      }

      res.json({
        success: true,
        message: 'Excel書き込みが完了しました',
        data: {
          processedFiles: result.processedFiles,
          downloadUrls: result.downloadUrls
        }
      });

    } catch (error) {
      logger.error('Excel書き込みエラー:', error, {
        userId: req.user?.id,
        subsidyType: req.body.subsidyType
      });

      res.status(500).json({
        success: false,
        message: 'Excel書き込みに失敗しました',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route GET /api/excel/template/:subsidyType
 * @desc テンプレートファイル取得
 * @access Private
 */
router.get('/template/:subsidyType',
  authenticate,
  templateValidation,
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { subsidyType } = req.params;
      const { templateName } = req.query;

      logger.info(`テンプレート取得要求: ${subsidyType}`, {
        userId: req.user?.id,
        templateName
      });

      const buffer = await excelProcessor.getTemplate(subsidyType, templateName as string);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${templateName || 'template.xlsx'}"`);
      res.send(buffer);

    } catch (error) {
      logger.error('テンプレート取得エラー:', error, {
        userId: req.user?.id,
        subsidyType: req.params.subsidyType
      });

      res.status(500).json({
        success: false,
        message: 'テンプレート取得に失敗しました',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route POST /api/excel/batch-export
 * @desc 一括出力処理
 * @access Private
 */
router.post('/batch-export',
  authenticate,
  excelRateLimit,
  writeValidation,
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { subsidyType, formData } = req.body;

      logger.info(`一括出力要求: ${subsidyType}`, {
        userId: req.user?.id,
        fieldCount: Object.keys(formData).length
      });

      const result = await excelProcessor.batchExport({
        subsidyType,
        applicationFrame: 'all',
        formData
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: '一括出力でエラーが発生しました',
          errors: result.errors
        });
      }

      res.json({
        success: true,
        message: '一括出力が完了しました',
        data: {
          processedFiles: result.processedFiles,
          downloadUrls: result.downloadUrls,
          totalFiles: result.processedFiles.length
        }
      });

    } catch (error) {
      logger.error('一括出力エラー:', error, {
        userId: req.user?.id,
        subsidyType: req.body.subsidyType
      });

      res.status(500).json({
        success: false,
        message: '一括出力に失敗しました',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route POST /api/excel/complete-flow
 * @desc 完全フロー対応（診断→推薦→Excel出力）
 * @access Private
 */
router.post('/complete-flow',
  authenticate,
  [
    body('answers')
      .isObject()
      .withMessage('回答データはオブジェクト形式で送信してください'),
    body('selectedSubsidy')
      .isString()
      .withMessage('選択された補助金タイプを指定してください')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { answers, selectedSubsidy } = req.body;

      logger.info(`完全フロー処理開始: ${selectedSubsidy}`, {
        userId: req.user?.id,
        answers: Object.keys(answers)
      });

      // フォームデータを補助金用に変換
      const formData = convertAnswersToFormData(selectedSubsidy, answers);

      // Excel書き込み実行
      const result = await excelProcessor.writeFormDataToExcel({
        subsidyType: selectedSubsidy,
        applicationFrame: 'general',
        formData
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Excel出力でエラーが発生しました',
          errors: result.errors
        });
      }

      res.json({
        success: true,
        message: '完全フローが正常に完了しました',
        data: {
          selectedSubsidy,
          processedFiles: result.processedFiles,
          downloadUrls: result.downloadUrls,
          formData
        }
      });

    } catch (error) {
      logger.error('完全フローエラー:', error, {
        userId: req.user?.id,
        selectedSubsidy: req.body.selectedSubsidy
      });

      res.status(500).json({
        success: false,
        message: '完全フロー処理に失敗しました',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route POST /api/excel/validate
 * @desc フォームデータ検証
 * @access Private
 */
router.post('/validate',
  authenticate,
  [
    body('subsidyType')
      .isIn(['it-donyu', 'monozukuri', 'jizokuka'])
      .withMessage('有効な補助金タイプを指定してください'),
    body('formData')
      .isObject()
      .withMessage('フォームデータはオブジェクト形式で送信してください')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { subsidyType, formData } = req.body;

      // バリデーションロジック
      const validationResult = validateFormData(subsidyType, formData);

      res.json({
        success: validationResult.isValid,
        message: validationResult.isValid ? '検証が完了しました' : '検証エラーがあります',
        data: {
          isValid: validationResult.isValid,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          missingFields: validationResult.missingFields
        }
      });

    } catch (error) {
      logger.error('フォーム検証エラー:', error, {
        userId: req.user?.id,
        subsidyType: req.body.subsidyType
      });

      res.status(500).json({
        success: false,
        message: 'フォーム検証に失敗しました',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route GET /api/excel/field-mappings/:subsidyType
 * @desc フィールドマッピング情報取得
 * @access Private
 */
router.get('/field-mappings/:subsidyType',
  authenticate,
  [
    param('subsidyType')
      .isIn(['it-donyu', 'monozukuri', 'jizokuka'])
      .withMessage('有効な補助金タイプを指定してください')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { subsidyType } = req.params;

      const mappings = getFieldMappingInfo(subsidyType);

      res.json({
        success: true,
        message: 'フィールドマッピング情報を取得しました',
        data: mappings
      });

    } catch (error) {
      logger.error('フィールドマッピング取得エラー:', error, {
        userId: req.user?.id,
        subsidyType: req.params.subsidyType
      });

      res.status(500).json({
        success: false,
        message: 'フィールドマッピング取得に失敗しました',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// ヘルパー関数

function validateFormData(subsidyType: string, formData: Record<string, any>) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // 補助金タイプ別の必須フィールド定義
  const requiredFields: Record<string, string[]> = {
    'it-donyu': ['company_name', 'representative_name', 'employee_count'],
    'monozukuri': ['base_year_revenue', 'year3_target'],
    'jizokuka': ['subsidy_project_name', 'sales_expansion_plan']
  };

  const required = requiredFields[subsidyType] || [];

  // 必須フィールドチェック
  for (const field of required) {
    if (!formData[field] || formData[field] === '') {
      missingFields.push(field);
      errors.push(`必須フィールド「${field}」が入力されていません`);
    }
  }

  // 数値フィールドの範囲チェック
  if (subsidyType === 'it-donyu') {
    if (formData.employee_count && (formData.employee_count < 1 || formData.employee_count > 9999)) {
      errors.push('従業員数は1～9999の範囲で入力してください');
    }
    
    if (formData.planned_avg_salary && formData.current_avg_salary && 
        formData.planned_avg_salary <= formData.current_avg_salary) {
      warnings.push('計画給与額は現在の給与額より高く設定することを推奨します');
    }
  }

  // 法人番号の形式チェック
  if (formData.corporate_number && !/^\d{13}$/.test(formData.corporate_number)) {
    errors.push('法人番号は13桁の数字で入力してください');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingFields
  };
}

function getFieldMappingInfo(subsidyType: string) {
  const mappingInfo: Record<string, any> = {
    'it-donyu': {
      files: [
        {
          fileName: 'it2025_chingin_houkoku.xlsx',
          displayName: '賃金報告書',
          fields: [
            { id: 'company_name', label: '申請者名（法人名/屋号）', cellReference: 'C4', required: true },
            { id: 'corporate_number', label: '法人番号', cellReference: 'C5', required: false },
            { id: 'representative_title', label: '代表者役職', cellReference: 'C6', required: true },
            { id: 'representative_name', label: '代表者氏名', cellReference: 'C7', required: true },
            { id: 'employee_count', label: '従業員数', cellReference: 'C10', required: true },
            { id: 'current_avg_salary', label: '現在の平均給与額', cellReference: 'C11', required: true },
            { id: 'planned_avg_salary', label: '計画平均給与額', cellReference: 'C12', required: true }
          ]
        },
        {
          fileName: 'it2025_jisshinaiyosetsumei_cate5.xlsx',
          displayName: '実施内容説明書',
          fields: [
            { id: 'it_tool_name', label: 'ITツール名', cellReference: 'B3', required: true },
            { id: 'it_provider_name', label: 'ITツール提供事業者名', cellReference: 'B4', required: true },
            { id: 'current_issues', label: '導入前の課題・問題点', cellReference: 'B7', required: true },
            { id: 'expected_effects', label: '導入により期待される効果', cellReference: 'B10', required: true }
          ]
        }
      ]
    },
    'monozukuri': {
      files: [
        {
          fileName: 'CAGR算出ツール_20250314.xlsx',
          displayName: 'CAGR算出ツール',
          fields: [
            { id: 'base_year_revenue', label: '基準年度売上高', cellReference: 'C5', required: true },
            { id: 'year1_target', label: '1年後売上高目標', cellReference: 'C6', required: true },
            { id: 'year2_target', label: '2年後売上高目標', cellReference: 'C7', required: true },
            { id: 'year3_target', label: '3年後売上高目標', cellReference: 'C8', required: true },
            { id: 'year5_target', label: '5年後売上高目標', cellReference: 'C9', required: true }
          ]
        }
      ]
    },
    'jizokuka': {
      files: [
        {
          fileName: 'r3i_y3e.xlsx',
          displayName: '様式3 補助事業計画書',
          fields: [
            { id: 'subsidy_project_name', label: '補助事業名', cellReference: 'B3', required: true },
            { id: 'sales_expansion_plan', label: '販路開拓等の取組内容', cellReference: 'B5', required: true },
            { id: 'project_effects', label: '補助事業の効果', cellReference: 'B22', required: true }
          ]
        }
      ]
    }
  };

  return mappingInfo[subsidyType] || {};
}

// 回答データをフォームデータに変換する関数
function convertAnswersToFormData(subsidyType: string, answers: Record<string, any>): Record<string, any> {
  const formData: Record<string, any> = {};

  // 共通フィールドのマッピング
  if (answers.company_name) formData.company_name = answers.company_name;
  if (answers.industry) formData.industry = answers.industry;
  if (answers.employee_count) formData.employee_count = parseInt(answers.employee_count);
  if (answers.annual_revenue) formData.annual_revenue = parseInt(answers.annual_revenue);
  if (answers.location) formData.location = answers.location;

  // 補助金タイプ別の特殊マッピング
  switch (subsidyType) {
    case 'it-donyu':
      // IT導入補助金向けフィールド
      formData.representative_name = answers.company_name + ' 代表者'; // デフォルト値
      formData.representative_title = '代表取締役'; // デフォルト値
      formData.current_avg_salary = Math.floor((answers.annual_revenue || 5000) * 10000 / (answers.employee_count || 10) / 12); // 推定月給
      formData.planned_avg_salary = Math.floor(formData.current_avg_salary * 1.15); // 15%アップを想定
      formData.it_tool_name = 'クラウド型業務システム'; // デフォルト値
      formData.it_provider_name = 'ITソリューション株式会社'; // デフォルト値
      formData.current_issues = '手作業による業務が多く、効率化が課題となっている';
      formData.expected_effects = 'IT導入により業務効率を30%向上させ、働き方改革を推進する';
      break;

    case 'monozukuri':
      // ものづくり補助金向けフィールド
      formData.base_year_revenue = (answers.annual_revenue || 5000) * 10000; // 万円から円に変換
      formData.year1_target = Math.floor(formData.base_year_revenue * 1.05); // 5%成長
      formData.year2_target = Math.floor(formData.base_year_revenue * 1.10); // 10%成長
      formData.year3_target = Math.floor(formData.base_year_revenue * 1.15); // 15%成長
      formData.year5_target = Math.floor(formData.base_year_revenue * 1.25); // 25%成長
      break;

    case 'jizokuka':
      // 持続化補助金向けフィールド
      formData.subsidy_project_name = '販路開拓・顧客獲得促進事業';
      formData.sales_expansion_plan = 'Webマーケティング強化により新規顧客開拓を行う';
      formData.project_effects = '売上高20%向上と新規顧客獲得50社を目指す';
      break;
  }

  return formData;
}

export default router;