import ExcelJS from 'exceljs';
import { logger } from '@/utils/logger';

interface ParseOptions {
  buffer: Buffer;
  document_type: string;
}

interface ParsedData {
  [formType: string]: any;
}

export async function parseExcelData(options: ParseOptions): Promise<ParsedData> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(options.buffer);

  const parsedData: ParsedData = {};

  switch (options.document_type) {
    case 'application_form':
      parsedData.basic_info = await parseBasicInfo(workbook);
      parsedData.business_info = await parseBusinessInfo(workbook);
      break;
    case 'project_plan':
      parsedData.project_plan = await parseProjectPlan(workbook);
      break;
    case 'budget_sheet':
      const budgetData = await parseBudgetSheet(workbook);
      if (parsedData.project_plan) {
        parsedData.project_plan = { ...parsedData.project_plan, ...budgetData };
      } else {
        parsedData.project_plan = budgetData;
      }
      break;
    default:
      throw new Error(`Unknown document type: ${options.document_type}`);
  }

  return parsedData;
}

async function parseBasicInfo(workbook: ExcelJS.Workbook): Promise<any> {
  const worksheet = workbook.getWorksheet('申請書');
  if (!worksheet) {
    throw new Error('申請書シートが見つかりません');
  }

  const basicInfo: any = {};
  const fieldMapping: Record<string, string> = {
    '法人名': 'company_name',
    '法人名（カナ）': 'company_name_kana',
    '郵便番号': 'postal_code',
    '電話番号': 'phone',
    'FAX番号': 'fax',
    'メールアドレス': 'email',
    '代表者名': 'representative_name',
    '代表者役職': 'representative_title',
  };

  // 基本情報セクションを探す
  let basicInfoStartRow = 0;
  worksheet.eachRow((row, rowNumber) => {
    const cellValue = row.getCell(1).value?.toString();
    if (cellValue && cellValue.includes('申請者基本情報')) {
      basicInfoStartRow = rowNumber + 2;
    }
  });

  if (basicInfoStartRow === 0) {
    throw new Error('基本情報セクションが見つかりません');
  }

  // フィールドを読み取る
  for (let i = 0; i < 10; i++) {
    const row = worksheet.getRow(basicInfoStartRow + i);
    const label = row.getCell(1).value?.toString();
    const value = row.getCell(3).value?.toString();

    if (label && fieldMapping[label]) {
      basicInfo[fieldMapping[label]] = value || '';
    }
  }

  // 所在地の解析
  const addressRow = worksheet.getRow(basicInfoStartRow + 3);
  const fullAddress = addressRow.getCell(3).value?.toString() || '';
  const addressMatch = fullAddress.match(/^(.+?[都道府県])(.+?[市区町村])(.+)$/);
  if (addressMatch) {
    basicInfo.prefecture = addressMatch[1];
    basicInfo.city = addressMatch[2];
    basicInfo.address = addressMatch[3];
  }

  return basicInfo;
}

async function parseBusinessInfo(workbook: ExcelJS.Workbook): Promise<any> {
  const worksheet = workbook.getWorksheet('申請書');
  if (!worksheet) {
    throw new Error('申請書シートが見つかりません');
  }

  const businessInfo: any = {};
  const fieldMapping: Record<string, { field: string; parser?: (val: string) => any }> = {
    '設立年月日': { field: 'established_date' },
    '資本金': { 
      field: 'capital',
      parser: (val: string) => parseInt(val.replace(/[^\d]/g, ''))
    },
    '従業員数': {
      field: 'employee_count',
      parser: (val: string) => parseInt(val.replace(/[^\d]/g, ''))
    },
    '業種コード': { field: 'industry_code' },
    '主要事業': { field: 'main_business' },
    '年間売上高': {
      field: 'annual_revenue',
      parser: (val: string) => parseInt(val.replace(/[^\d]/g, ''))
    },
  };

  // 事業情報セクションを探す
  let businessInfoStartRow = 0;
  worksheet.eachRow((row, rowNumber) => {
    const cellValue = row.getCell(1).value?.toString();
    if (cellValue && cellValue.includes('事業情報')) {
      businessInfoStartRow = rowNumber + 2;
    }
  });

  if (businessInfoStartRow === 0) {
    return businessInfo;
  }

  // フィールドを読み取る
  for (let i = 0; i < 8; i++) {
    const row = worksheet.getRow(businessInfoStartRow + i);
    const label = row.getCell(1).value?.toString();
    const value = row.getCell(3).value?.toString();

    if (label && value) {
      const mapping = fieldMapping[label];
      if (mapping) {
        businessInfo[mapping.field] = mapping.parser ? mapping.parser(value) : value;
      }
    }
  }

  return businessInfo;
}

async function parseProjectPlan(workbook: ExcelJS.Workbook): Promise<any> {
  const worksheet = workbook.getWorksheet('事業計画');
  if (!worksheet) {
    throw new Error('事業計画シートが見つかりません');
  }

  const projectPlan: any = {
    expected_effects: [],
    implementation_schedule: [],
  };

  // プロジェクト名と目的を探す
  worksheet.eachRow((row, rowNumber) => {
    const cellA = row.getCell(1).value?.toString();
    const cellC = row.getCell(3).value?.toString();

    if (cellA === 'プロジェクト名' && cellC) {
      projectPlan.project_title = cellC;
    }
    
    if (cellA === '導入目的') {
      const nextRow = worksheet.getRow(rowNumber + 1);
      projectPlan.project_purpose = nextRow.getCell(1).value?.toString() || '';
    }
  });

  // 期待効果を探す
  let effectsStartRow = 0;
  worksheet.eachRow((row, rowNumber) => {
    const cellValue = row.getCell(1).value?.toString();
    if (cellValue && cellValue.includes('期待効果')) {
      effectsStartRow = rowNumber + 2;
    }
  });

  if (effectsStartRow > 0) {
    for (let i = 0; i < 5; i++) {
      const row = worksheet.getRow(effectsStartRow + i);
      const effectLabel = row.getCell(1).value?.toString();
      
      if (effectLabel && effectLabel.startsWith('効果')) {
        const effect = {
          effect_type: row.getCell(2).value?.toString() || '',
          description: row.getCell(3).value?.toString() || '',
          target_value: row.getCell(8).value?.toString() || '',
        };
        
        if (effect.effect_type || effect.description) {
          projectPlan.expected_effects.push(effect);
        }
      }
    }
  }

  // 実施スケジュールを探す
  let scheduleStartRow = 0;
  worksheet.eachRow((row, rowNumber) => {
    const cellValue = row.getCell(1).value?.toString();
    if (cellValue && cellValue.includes('実施スケジュール')) {
      scheduleStartRow = rowNumber + 3; // ヘッダー行をスキップ
    }
  });

  if (scheduleStartRow > 0) {
    for (let i = 0; i < 10; i++) {
      const row = worksheet.getRow(scheduleStartRow + i);
      const phase = row.getCell(1).value?.toString();
      
      if (phase && phase.trim() !== '') {
        const schedule = {
          phase: phase,
          start_date: row.getCell(2).value?.toString() || '',
          end_date: row.getCell(3).value?.toString() || '',
          description: row.getCell(4).value?.toString() || '',
        };
        
        projectPlan.implementation_schedule.push(schedule);
      }
    }
  }

  return projectPlan;
}

async function parseBudgetSheet(workbook: ExcelJS.Workbook): Promise<any> {
  const worksheet = workbook.getWorksheet('予算書');
  if (!worksheet) {
    throw new Error('予算書シートが見つかりません');
  }

  const budgetData: any = {
    total_budget: 0,
    budget_breakdown: [],
  };

  // 総予算を探す
  worksheet.eachRow((row, rowNumber) => {
    const cellA = row.getCell(1).value?.toString();
    const cellC = row.getCell(3).value;

    if (cellA === '総予算' && cellC) {
      budgetData.total_budget = typeof cellC === 'number' ? cellC : parseInt(cellC.toString().replace(/[^\d]/g, ''));
    }
  });

  // 予算内訳を探す
  let breakdownStartRow = 0;
  worksheet.eachRow((row, rowNumber) => {
    const cellValue = row.getCell(1).value?.toString();
    if (cellValue === '費用項目') {
      breakdownStartRow = rowNumber + 1;
    }
  });

  if (breakdownStartRow > 0) {
    for (let i = 0; i < 20; i++) {
      const row = worksheet.getRow(breakdownStartRow + i);
      const category = row.getCell(1).value?.toString();
      
      if (category && category !== '合計' && category.trim() !== '') {
        const amountValue = row.getCell(2).value;
        const amount = typeof amountValue === 'number' 
          ? amountValue 
          : parseInt(amountValue?.toString().replace(/[^\d]/g, '') || '0');
        
        if (amount > 0) {
          const item = {
            category: category,
            amount: amount,
            description: row.getCell(4).value?.toString() || '',
          };
          
          budgetData.budget_breakdown.push(item);
        }
      } else if (category === '合計') {
        break;
      }
    }
  }

  return budgetData;
}