import ExcelJS from 'exceljs';
import { logger } from '@/utils/logger';

interface ExcelGenerationOptions {
  session_id: string;
  document_type: string;
  form_data: Record<string, any>;
  company_info: any;
  include_instructions: boolean;
}

export async function generateExcelDocument(
  options: ExcelGenerationOptions
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  
  // ワークブックのプロパティ設定
  workbook.creator = 'IT補助金申請アシスタント';
  workbook.created = new Date();
  workbook.modified = new Date();

  switch (options.document_type) {
    case 'application_form':
      await generateApplicationForm(workbook, options);
      break;
    case 'project_plan':
      await generateProjectPlan(workbook, options);
      break;
    case 'budget_sheet':
      await generateBudgetSheet(workbook, options);
      break;
    case 'all':
      await generateApplicationForm(workbook, options);
      await generateProjectPlan(workbook, options);
      await generateBudgetSheet(workbook, options);
      break;
    default:
      throw new Error(`Unknown document type: ${options.document_type}`);
  }

  return workbook;
}

async function generateApplicationForm(
  workbook: ExcelJS.Workbook,
  options: ExcelGenerationOptions
): Promise<void> {
  const worksheet = workbook.addWorksheet('申請書');

  // ヘッダー設定
  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').value = 'IT導入補助金申請書';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  // 基本情報セクション
  let row = 3;
  worksheet.getCell(`A${row}`).value = '1. 申請者基本情報';
  worksheet.getCell(`A${row}`).font = { size: 14, bold: true };
  worksheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6E6' },
  };

  const basicInfo = options.form_data.basic_info || {};
  const infoFields = [
    { label: '法人名', value: basicInfo.company_name },
    { label: '法人名（カナ）', value: basicInfo.company_name_kana },
    { label: '郵便番号', value: basicInfo.postal_code },
    { label: '所在地', value: `${basicInfo.prefecture}${basicInfo.city}${basicInfo.address}${basicInfo.building || ''}` },
    { label: '電話番号', value: basicInfo.phone },
    { label: 'FAX番号', value: basicInfo.fax || '―' },
    { label: 'メールアドレス', value: basicInfo.email },
    { label: '代表者名', value: basicInfo.representative_name },
    { label: '代表者役職', value: basicInfo.representative_title },
  ];

  row += 2;
  for (const field of infoFields) {
    worksheet.getCell(`A${row}`).value = field.label;
    worksheet.getCell(`A${row}`).font = { bold: true };
    worksheet.getCell(`C${row}`).value = field.value || '';
    worksheet.mergeCells(`C${row}:F${row}`);
    row++;
  }

  // 事業情報セクション
  row += 2;
  worksheet.getCell(`A${row}`).value = '2. 事業情報';
  worksheet.getCell(`A${row}`).font = { size: 14, bold: true };
  worksheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6E6' },
  };

  const businessInfo = options.form_data.business_info || {};
  const businessFields = [
    { label: '設立年月日', value: businessInfo.established_date },
    { label: '資本金', value: businessInfo.capital ? `${businessInfo.capital.toLocaleString()}円` : '' },
    { label: '従業員数', value: businessInfo.employee_count ? `${businessInfo.employee_count}人` : '' },
    { label: '業種コード', value: businessInfo.industry_code },
    { label: '主要事業', value: businessInfo.main_business },
    { label: '年間売上高', value: businessInfo.annual_revenue ? `${businessInfo.annual_revenue.toLocaleString()}円` : '' },
  ];

  row += 2;
  for (const field of businessFields) {
    worksheet.getCell(`A${row}`).value = field.label;
    worksheet.getCell(`A${row}`).font = { bold: true };
    worksheet.getCell(`C${row}`).value = field.value || '';
    worksheet.mergeCells(`C${row}:F${row}`);
    row++;
  }

  // 列幅の調整
  worksheet.columns = [
    { width: 20 },
    { width: 5 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
  ];

  // 罫線の追加
  addBorders(worksheet, 3, row - 1, 1, 6);

  if (options.include_instructions) {
    addInstructions(worksheet, row + 2);
  }
}

async function generateProjectPlan(
  workbook: ExcelJS.Workbook,
  options: ExcelGenerationOptions
): Promise<void> {
  const worksheet = workbook.addWorksheet('事業計画');

  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = 'IT導入事業計画書';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  const projectPlan = options.form_data.project_plan || {};
  let row = 3;

  // プロジェクト概要
  worksheet.getCell(`A${row}`).value = '1. プロジェクト概要';
  worksheet.getCell(`A${row}`).font = { size: 14, bold: true };
  worksheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6E6' },
  };

  row += 2;
  worksheet.getCell(`A${row}`).value = 'プロジェクト名';
  worksheet.getCell(`A${row}`).font = { bold: true };
  worksheet.mergeCells(`C${row}:H${row}`);
  worksheet.getCell(`C${row}`).value = projectPlan.project_title || '';

  row += 2;
  worksheet.getCell(`A${row}`).value = '導入目的';
  worksheet.getCell(`A${row}`).font = { bold: true };
  row++;
  worksheet.mergeCells(`A${row}:H${row + 3}`);
  worksheet.getCell(`A${row}`).value = projectPlan.project_purpose || '';
  worksheet.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'top' };

  // 期待効果
  row += 5;
  worksheet.getCell(`A${row}`).value = '2. 期待効果';
  worksheet.getCell(`A${row}`).font = { size: 14, bold: true };
  worksheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6E6' },
  };

  row += 2;
  if (projectPlan.expected_effects && Array.isArray(projectPlan.expected_effects)) {
    projectPlan.expected_effects.forEach((effect: any, index: number) => {
      worksheet.getCell(`A${row}`).value = `効果${index + 1}`;
      worksheet.getCell(`A${row}`).font = { bold: true };
      worksheet.getCell(`B${row}`).value = effect.effect_type || '';
      worksheet.mergeCells(`C${row}:F${row}`);
      worksheet.getCell(`C${row}`).value = effect.description || '';
      worksheet.getCell(`G${row}`).value = '目標値';
      worksheet.getCell(`H${row}`).value = effect.target_value || '';
      row++;
    });
  }

  // 実施スケジュール
  row += 2;
  worksheet.getCell(`A${row}`).value = '3. 実施スケジュール';
  worksheet.getCell(`A${row}`).font = { size: 14, bold: true };
  worksheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6E6' },
  };

  row += 2;
  worksheet.getCell(`A${row}`).value = 'フェーズ';
  worksheet.getCell(`B${row}`).value = '開始日';
  worksheet.getCell(`C${row}`).value = '終了日';
  worksheet.mergeCells(`D${row}:H${row}`);
  worksheet.getCell(`D${row}`).value = '実施内容';
  [
    worksheet.getCell(`A${row}`),
    worksheet.getCell(`B${row}`),
    worksheet.getCell(`C${row}`),
    worksheet.getCell(`D${row}`),
  ].forEach(cell => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' },
    };
  });

  row++;
  if (projectPlan.implementation_schedule && Array.isArray(projectPlan.implementation_schedule)) {
    projectPlan.implementation_schedule.forEach((schedule: any) => {
      worksheet.getCell(`A${row}`).value = schedule.phase || '';
      worksheet.getCell(`B${row}`).value = schedule.start_date || '';
      worksheet.getCell(`C${row}`).value = schedule.end_date || '';
      worksheet.mergeCells(`D${row}:H${row}`);
      worksheet.getCell(`D${row}`).value = schedule.description || '';
      row++;
    });
  }

  // 列幅の調整
  worksheet.columns = [
    { width: 15 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 15 },
  ];
}

async function generateBudgetSheet(
  workbook: ExcelJS.Workbook,
  options: ExcelGenerationOptions
): Promise<void> {
  const worksheet = workbook.addWorksheet('予算書');

  worksheet.mergeCells('A1:E1');
  worksheet.getCell('A1').value = 'IT導入補助金　予算書';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  const projectPlan = options.form_data.project_plan || {};
  let row = 3;

  // 総予算
  worksheet.getCell(`A${row}`).value = '総予算';
  worksheet.getCell(`A${row}`).font = { size: 14, bold: true };
  worksheet.getCell(`C${row}`).value = projectPlan.total_budget || 0;
  worksheet.getCell(`C${row}`).numFmt = '¥#,##0';
  worksheet.getCell(`C${row}`).font = { size: 14, bold: true };

  // 予算内訳
  row += 3;
  worksheet.getCell(`A${row}`).value = '予算内訳';
  worksheet.getCell(`A${row}`).font = { size: 14, bold: true };
  worksheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6E6' },
  };

  row += 2;
  worksheet.getCell(`A${row}`).value = '費用項目';
  worksheet.getCell(`B${row}`).value = '金額';
  worksheet.getCell(`C${row}`).value = '補助対象';
  worksheet.mergeCells(`D${row}:E${row}`);
  worksheet.getCell(`D${row}`).value = '備考';
  
  [
    worksheet.getCell(`A${row}`),
    worksheet.getCell(`B${row}`),
    worksheet.getCell(`C${row}`),
    worksheet.getCell(`D${row}`),
  ].forEach(cell => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' },
    };
  });

  row++;
  let totalAmount = 0;
  let subsidyAmount = 0;

  if (projectPlan.budget_breakdown && Array.isArray(projectPlan.budget_breakdown)) {
    projectPlan.budget_breakdown.forEach((item: any) => {
      worksheet.getCell(`A${row}`).value = item.category || '';
      worksheet.getCell(`B${row}`).value = item.amount || 0;
      worksheet.getCell(`B${row}`).numFmt = '¥#,##0';
      worksheet.getCell(`C${row}`).value = '○';
      worksheet.mergeCells(`D${row}:E${row}`);
      worksheet.getCell(`D${row}`).value = item.description || '';
      
      totalAmount += item.amount || 0;
      subsidyAmount += item.amount || 0;
      row++;
    });
  }

  // 合計行
  row++;
  worksheet.getCell(`A${row}`).value = '合計';
  worksheet.getCell(`A${row}`).font = { bold: true };
  worksheet.getCell(`B${row}`).value = totalAmount;
  worksheet.getCell(`B${row}`).numFmt = '¥#,##0';
  worksheet.getCell(`B${row}`).font = { bold: true };
  worksheet.getCell(`C${row}`).value = subsidyAmount;
  worksheet.getCell(`C${row}`).numFmt = '¥#,##0';
  worksheet.getCell(`C${row}`).font = { bold: true };

  // 補助金申請額
  row += 2;
  worksheet.getCell(`A${row}`).value = '補助金申請額';
  worksheet.getCell(`A${row}`).font = { size: 12, bold: true };
  worksheet.getCell(`C${row}`).value = Math.floor(subsidyAmount * 0.5); // 補助率50%と仮定
  worksheet.getCell(`C${row}`).numFmt = '¥#,##0';
  worksheet.getCell(`C${row}`).font = { size: 12, bold: true };

  // 列幅の調整
  worksheet.columns = [
    { width: 25 },
    { width: 15 },
    { width: 12 },
    { width: 15 },
    { width: 20 },
  ];

  // 罫線の追加
  addBorders(worksheet, 3, row, 1, 5);
}

function addBorders(
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number
): void {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
  }
}

function addInstructions(worksheet: ExcelJS.Worksheet, startRow: number): void {
  worksheet.getCell(`A${startRow}`).value = '【記入上の注意】';
  worksheet.getCell(`A${startRow}`).font = { bold: true, color: { argb: 'FF0000FF' } };
  
  const instructions = [
    '1. 全ての項目を正確に記入してください。',
    '2. 金額は税抜きで記入してください。',
    '3. 該当しない項目は「―」を記入してください。',
    '4. 提出前に必ず内容を確認してください。',
  ];

  instructions.forEach((instruction, index) => {
    worksheet.getCell(`A${startRow + index + 1}`).value = instruction;
    worksheet.getCell(`A${startRow + index + 1}`).font = { size: 10 };
  });
}