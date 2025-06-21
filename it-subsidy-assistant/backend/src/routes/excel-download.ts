import express from 'express';
import { ExcelProcessor } from '@/services/excelProcessor';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();
const excelProcessor = new ExcelProcessor();

/**
 * @route POST /api/excel/complete-flow
 * @desc 完全フロー対応（診断→推薦→Excel出力）- 認証不要版
 * @access Public (for demo)
 */
router.post('/complete-flow', async (req, res) => {
  try {
    const { answers, selectedSubsidy } = req.body;

    logger.info(`完全フロー処理開始: ${selectedSubsidy}`, {
      sessionId: req.body.sessionId || 'anonymous',
      answers: Object.keys(answers || {})
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
    logger.error('完全フローエラー:', error);
    res.status(500).json({
      success: false,
      message: '完全フロー処理に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/excel/download/:documentId
 * @desc 個別ドキュメントダウンロード - 認証不要版
 * @access Public (for demo)
 */
router.get('/download/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { subsidyType } = req.query;

    logger.info(`ドキュメントダウンロード要求: ${documentId}`);

    // ドキュメントIDからファイル名を決定
    const fileNameMap: Record<string, string> = {
      'it_filled_application': 'it2025_chingin_houkoku.xlsx',
      'it_wage_report': 'it2025_chingin_houkoku.xlsx',
      'it_implementation_plan': 'it2025_jisshinaiyosetsumei_cate5.xlsx',
      'it_price_breakdown': 'it2025_kakakusetsumei_cate5.xlsx',
      'mono_business_plan': 'CAGR算出ツール_20250314.xlsx',
      'mono_cagr_tool': 'CAGR算出ツール_20250314.xlsx',
      'jizoku_application_form': 'r3i_y3e.xlsx',
      'jizoku_project_plan': 'r3i_y3e.xlsx'
    };

    const fileName = fileNameMap[documentId];
    if (!fileName) {
      // テンプレートファイルを返す
      const templatePath = path.join(process.cwd(), 'data', 'excel-templates', `${documentId}.xlsx`);
      try {
        const buffer = await fs.readFile(templatePath);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${documentId}.xlsx"`);
        return res.send(buffer);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'ドキュメントが見つかりません'
        });
      }
    }

    // フォームデータから動的にExcelを生成
    const formData = req.session?.formData || createSampleFormData(subsidyType as string);
    
    // Excel生成
    const result = await excelProcessor.writeFormDataToExcel({
      subsidyType: subsidyType as string || 'it-donyu',
      applicationFrame: 'general',
      formData
    });

    if (result.success && result.downloadUrls && result.downloadUrls[0]) {
      // 生成されたファイルにリダイレクト
      res.redirect(result.downloadUrls[0]);
    } else {
      // デフォルトテンプレートを返す
      const templatePath = path.join(process.cwd(), 'data', 'excel-templates', fileName);
      const buffer = await fs.readFile(templatePath);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    }

  } catch (error) {
    logger.error('ダウンロードエラー:', error);
    res.status(500).json({
      success: false,
      message: 'ダウンロードに失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 回答データをフォームデータに変換する関数
function convertAnswersToFormData(subsidyType: string, answers: Record<string, any>): Record<string, any> {
  const formData: Record<string, any> = {};

  // 共通フィールドのマッピング
  if (answers.company_name) formData.company_name = answers.company_name;
  if (answers.companyName) formData.company_name = answers.companyName;
  if (answers.industry) formData.industry = answers.industry;
  if (answers.employee_count) formData.employee_count = parseInt(answers.employee_count);
  if (answers.employeeCount) formData.employee_count = parseInt(answers.employeeCount);
  if (answers.annual_revenue) formData.annual_revenue = parseInt(answers.annual_revenue);
  if (answers.annualRevenue) formData.annual_revenue = parseInt(answers.annualRevenue);
  if (answers.location) formData.location = answers.location;

  // 補助金タイプ別の特殊マッピング
  switch (subsidyType) {
    case 'it-donyu':
      formData.representative_name = answers.representative_name || answers.representativeName || formData.company_name + ' 代表者';
      formData.representative_title = '代表取締役';
      formData.corporate_number = answers.corporate_number || answers.corporateNumber || '1234567890123';
      formData.current_avg_salary = Math.floor((formData.annual_revenue || 5000) * 10000 / (formData.employee_count || 10) / 12);
      formData.planned_avg_salary = Math.floor(formData.current_avg_salary * 1.15);
      formData.it_tool_name = 'クラウド型業務管理システム';
      formData.it_provider_name = 'ITソリューション株式会社';
      formData.current_issues = '業務プロセスが手作業中心で効率化が課題';
      formData.expected_effects = '業務効率30%向上、働き方改革の推進';
      formData.usage_method = 'クラウドシステムによる業務の自動化とデータ管理';
      formData.productivity_target = '労働生産性を年率3%以上向上';
      formData.implementation_schedule = '契約後3ヶ月以内に導入完了予定';
      formData.software_cost = 1500000;
      formData.implementation_cost = 500000;
      formData.service_cost = 300000;
      formData.maintenance_cost = 200000;
      break;

    case 'monozukuri':
      const baseRevenue = (formData.annual_revenue || 5000) * 10000;
      formData.base_year_revenue = baseRevenue;
      formData.year1_target = Math.floor(baseRevenue * 1.05);
      formData.year2_target = Math.floor(baseRevenue * 1.10);
      formData.year3_target = Math.floor(baseRevenue * 1.15);
      formData.year5_target = Math.floor(baseRevenue * 1.25);
      break;

    case 'jizokuka':
      formData.subsidy_project_name = '販路開拓・顧客獲得促進事業';
      formData.sales_expansion_plan = `新規顧客開拓のためのWebマーケティング強化。
ホームページのリニューアルとSEO対策により、オンラインからの問い合わせを増加させる。
また、展示会出展により直接的な顧客接点を創出し、売上拡大を図る。`;
      formData.project_effects = `1. 新規顧客獲得：年間50社以上
2. Web経由の問い合わせ：現在の3倍に増加
3. 売上高：前年比20%向上
4. 顧客満足度の向上`;
      
      // 経費明細のサンプルデータ
      formData.expense_item_0 = '機械装置等費';
      formData.expense_quantity_0 = 1;
      formData.expense_unit_price_0 = 500000;
      
      formData.expense_item_1 = '広報費';
      formData.expense_quantity_1 = 1;
      formData.expense_unit_price_1 = 300000;
      
      formData.expense_item_2 = 'ウェブサイト関連費';
      formData.expense_quantity_2 = 1;
      formData.expense_unit_price_2 = 400000;
      break;
  }

  return formData;
}

// サンプルフォームデータ生成
function createSampleFormData(subsidyType: string): Record<string, any> {
  return convertAnswersToFormData(subsidyType, {
    company_name: 'サンプル株式会社',
    industry: 'サービス業',
    employee_count: '50',
    annual_revenue: '10000',
    location: '東京都'
  });
}

export default router;