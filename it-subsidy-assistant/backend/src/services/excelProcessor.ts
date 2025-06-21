import ExcelJS from 'exceljs';
import { logger } from '@/utils/logger';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs/promises';

interface ExcelFieldMapping {
  fieldId: string;
  fileName: string;
  sheetName?: string;
  cellReference: string;
  format?: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  isFormula?: boolean;
}

interface ProcessingOptions {
  subsidyType: 'it-donyu' | 'monozukuri' | 'jizokuka';
  applicationFrame?: string;
  formData: Record<string, any>;
  templatePath?: string;
}

interface ExcelProcessingResult {
  success: boolean;
  processedFiles: string[];
  errors: string[];
  downloadUrls?: string[];
}

export class ExcelProcessor {
  private supabase;
  private templatesPath: string;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.templatesPath = path.join(process.cwd(), 'data', 'excel-templates');
  }

  // Excel書類読み取りメイン処理
  async readExcelFile(buffer: Buffer, fileName: string): Promise<any> {
    try {
      logger.info(`Excel読み取り開始: ${fileName}`);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const subsidyType = this.detectSubsidyType(fileName);
      const mappings = this.getFieldMappings(subsidyType, fileName);

      const extractedData: Record<string, any> = {};

      for (const mapping of mappings) {
        try {
          const value = await this.extractCellValue(workbook, mapping);
          if (value !== null && value !== undefined) {
            extractedData[mapping.fieldId] = value;
          }
        } catch (error) {
          logger.warn(`セル読み取りエラー: ${mapping.cellReference}`, error);
        }
      }

      logger.info(`Excel読み取り完了: ${Object.keys(extractedData).length}件のフィールド抽出`);
      return {
        subsidyType,
        fileName,
        extractedData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Excel読み取りエラー:', error);
      throw new Error(`Excel読み取りに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // フォームデータ自動書き込み処理
  async writeFormDataToExcel(options: ProcessingOptions): Promise<ExcelProcessingResult> {
    try {
      logger.info(`Excel書き込み開始: ${options.subsidyType}`);
      
      const targetFiles = this.getTargetFiles(options.subsidyType, options.applicationFrame);
      const processedFiles: string[] = [];
      const errors: string[] = [];
      const downloadUrls: string[] = [];

      for (const fileName of targetFiles) {
        try {
          const templatePath = path.join(this.templatesPath, fileName);
          const outputPath = await this.processExcelFile(templatePath, fileName, options.formData, options.subsidyType);
          
          // Supabaseストレージにアップロード
          const downloadUrl = await this.uploadToStorage(outputPath, fileName, options.subsidyType);
          
          processedFiles.push(fileName);
          downloadUrls.push(downloadUrl);
          
          logger.info(`処理完了: ${fileName}`);
        } catch (error) {
          logger.error(`ファイル処理エラー: ${fileName}`, error);
          errors.push(`${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        processedFiles,
        errors,
        downloadUrls
      };

    } catch (error) {
      logger.error('Excel書き込みエラー:', error);
      throw new Error(`Excel書き込みに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 複数ファイル一括処理
  async batchExport(options: ProcessingOptions): Promise<ExcelProcessingResult> {
    try {
      logger.info(`一括出力開始: ${options.subsidyType}`);
      
      // 全ての対象ファイルを処理
      const result = await this.writeFormDataToExcel({
        ...options,
        applicationFrame: 'all'
      });

      // ZIP形式での一括ダウンロード用URLも生成
      if (result.success && result.downloadUrls && result.downloadUrls.length > 1) {
        const zipUrl = await this.createZipArchive(result.downloadUrls, options.subsidyType);
        result.downloadUrls.push(zipUrl);
      }

      logger.info(`一括出力完了: ${result.processedFiles.length}ファイル処理`);
      return result;

    } catch (error) {
      logger.error('一括出力エラー:', error);
      throw new Error(`一括出力に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // テンプレート取得
  async getTemplate(subsidyType: string, templateName?: string): Promise<Buffer> {
    try {
      const fileName = templateName || this.getDefaultTemplate(subsidyType);
      const templatePath = path.join(this.templatesPath, fileName);
      
      const buffer = await fs.readFile(templatePath);
      logger.info(`テンプレート取得: ${fileName}`);
      
      return buffer;
    } catch (error) {
      logger.error('テンプレート取得エラー:', error);
      throw new Error(`テンプレート取得に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // プライベートメソッド

  private detectSubsidyType(fileName: string): string {
    if (fileName.includes('it2025') || fileName.includes('IT導入')) {
      return 'it-donyu';
    }
    if (fileName.includes('monozukuri') || fileName.includes('ものづくり') || fileName.includes('CAGR')) {
      return 'monozukuri';
    }
    if (fileName.includes('jizokuka') || fileName.includes('持続化') || fileName.includes('r3i_y3')) {
      return 'jizokuka';
    }
    return 'unknown';
  }

  private getFieldMappings(subsidyType: string, fileName: string): ExcelFieldMapping[] {
    const mappings: ExcelFieldMapping[] = [];

    switch (subsidyType) {
      case 'it-donyu':
        if (fileName.includes('chingin_houkoku')) {
          mappings.push(
            { fieldId: 'company_name', fileName, cellReference: 'C4', format: 'text' },
            { fieldId: 'corporate_number', fileName, cellReference: 'C5', format: 'text' },
            { fieldId: 'representative_title', fileName, cellReference: 'C6', format: 'text' },
            { fieldId: 'representative_name', fileName, cellReference: 'C7', format: 'text' },
            { fieldId: 'employee_count', fileName, cellReference: 'C10', format: 'number' },
            { fieldId: 'current_avg_salary', fileName, cellReference: 'C11', format: 'currency' },
            { fieldId: 'planned_avg_salary', fileName, cellReference: 'C12', format: 'currency' },
            { fieldId: 'salary_increase_rate', fileName, cellReference: 'C13', format: 'percentage', isFormula: true }
          );
        } else if (fileName.includes('jisshinaiyosetsumei')) {
          mappings.push(
            { fieldId: 'it_tool_name', fileName, cellReference: 'B3', format: 'text' },
            { fieldId: 'it_provider_name', fileName, cellReference: 'B4', format: 'text' },
            { fieldId: 'current_issues', fileName, cellReference: 'B7', format: 'text' },
            { fieldId: 'expected_effects', fileName, cellReference: 'B10', format: 'text' },
            { fieldId: 'usage_method', fileName, cellReference: 'B13', format: 'text' },
            { fieldId: 'productivity_target', fileName, cellReference: 'B16', format: 'text' },
            { fieldId: 'implementation_schedule', fileName, cellReference: 'B19', format: 'text' }
          );
        } else if (fileName.includes('kakakusetsumei')) {
          mappings.push(
            { fieldId: 'software_cost', fileName, cellReference: 'C5', format: 'currency' },
            { fieldId: 'implementation_cost', fileName, cellReference: 'C6', format: 'currency' },
            { fieldId: 'service_cost', fileName, cellReference: 'C7', format: 'currency' },
            { fieldId: 'maintenance_cost', fileName, cellReference: 'C8', format: 'currency' },
            { fieldId: 'total_cost', fileName, cellReference: 'C10', format: 'currency', isFormula: true },
            { fieldId: 'eligible_cost', fileName, cellReference: 'C12', format: 'currency', isFormula: true },
            { fieldId: 'subsidy_amount', fileName, cellReference: 'C13', format: 'currency', isFormula: true }
          );
        }
        break;

      case 'monozukuri':
        if (fileName.includes('CAGR')) {
          mappings.push(
            { fieldId: 'base_year_revenue', fileName, cellReference: 'C5', format: 'currency' },
            { fieldId: 'year1_target', fileName, cellReference: 'C6', format: 'currency' },
            { fieldId: 'year2_target', fileName, cellReference: 'C7', format: 'currency' },
            { fieldId: 'year3_target', fileName, cellReference: 'C8', format: 'currency' },
            { fieldId: 'year5_target', fileName, cellReference: 'C9', format: 'currency' },
            { fieldId: 'cagr_3year', fileName, cellReference: 'E10', format: 'percentage', isFormula: true },
            { fieldId: 'cagr_5year', fileName, cellReference: 'E11', format: 'percentage', isFormula: true }
          );
        }
        break;

      case 'jizokuka':
        if (fileName.includes('r3i_y3')) {
          mappings.push(
            { fieldId: 'subsidy_project_name', fileName, cellReference: 'B3', format: 'text' },
            { fieldId: 'sales_expansion_plan', fileName, cellReference: 'B5', format: 'text' },
            { fieldId: 'project_effects', fileName, cellReference: 'B22', format: 'text' }
          );
          
          // 経費明細表の動的マッピング
          for (let i = 0; i < 16; i++) {
            const row = 25 + i;
            mappings.push(
              { fieldId: `expense_item_${i}`, fileName, cellReference: `D${row}`, format: 'text' },
              { fieldId: `expense_quantity_${i}`, fileName, cellReference: `E${row}`, format: 'number' },
              { fieldId: `expense_unit_price_${i}`, fileName, cellReference: `F${row}`, format: 'currency' },
              { fieldId: `expense_amount_${i}`, fileName, cellReference: `G${row}`, format: 'currency', isFormula: true }
            );
          }
          
          mappings.push(
            { fieldId: 'total_eligible_cost', fileName, cellReference: 'G42', format: 'currency', isFormula: true },
            { fieldId: 'subsidy_request_amount', fileName, cellReference: 'G43', format: 'currency', isFormula: true }
          );
        }
        break;
    }

    return mappings;
  }

  private async extractCellValue(workbook: ExcelJS.Workbook, mapping: ExcelFieldMapping): Promise<any> {
    const worksheet = workbook.getWorksheet(mapping.sheetName || 1);
    if (!worksheet) {
      throw new Error(`シートが見つかりません: ${mapping.sheetName || '1'}`);
    }

    const cell = worksheet.getCell(mapping.cellReference);
    let value = cell.value;

    // 数式セルの場合は結果値を取得
    if (mapping.isFormula && cell.formula) {
      value = cell.result || value;
    }

    // フォーマット変換
    return this.formatValue(value, mapping.format);
  }

  private formatValue(value: any, format?: string): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    switch (format) {
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^\d.-]/g, ''));
      case 'currency':
        const numValue = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^\d.-]/g, ''));
        return isNaN(numValue) ? 0 : numValue;
      case 'percentage':
        const pctValue = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^\d.-]/g, ''));
        return isNaN(pctValue) ? 0 : pctValue;
      case 'date':
        return value instanceof Date ? value.toISOString().split('T')[0] : value.toString();
      case 'text':
      default:
        return value.toString().trim();
    }
  }

  private getTargetFiles(subsidyType: string, applicationFrame?: string): string[] {
    const fileMap: Record<string, Record<string, string[]>> = {
      'it-donyu': {
        'normal': ['it2025_chingin_houkoku.xlsx', 'it2025_jisshinaiyosetsumei_cate5.xlsx', 'it2025_kakakusetsumei_cate5.xlsx'],
        'digital': ['it2025_torihiki_denshi.xlsx', 'it2025_jisshinaiyosetsumei_cate6.xlsx', 'it2025_kakakusetsumei_cate6.xlsx'],
        'security': ['it2025_torihiki_security.xlsx', 'it2025_jisshinaiyosetsumei_cate7.xlsx', 'it2025_kakakusetsumei_cate7.xlsx'],
        'all': ['it2025_chingin_houkoku.xlsx', 'it2025_jisshinaiyosetsumei_cate5.xlsx', 'it2025_kakakusetsumei_cate5.xlsx',
                'it2025_jisshinaiyosetsumei_cate6.xlsx', 'it2025_kakakusetsumei_cate6.xlsx',
                'it2025_jisshinaiyosetsumei_cate7.xlsx', 'it2025_kakakusetsumei_cate7.xlsx']
      },
      'monozukuri': {
        'all': ['事業計画書記載項目.docx', 'CAGR算出ツール_20250314.xlsx']
      },
      'jizokuka': {
        'all': ['r3i_y3e.xlsx']
      }
    };

    return fileMap[subsidyType]?.[applicationFrame || 'all'] || fileMap[subsidyType]?.['all'] || [];
  }

  private async processExcelFile(templatePath: string, fileName: string, formData: Record<string, any>, subsidyType: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    
    // テンプレートファイルの存在確認と読み込み
    try {
      await workbook.xlsx.readFile(templatePath);
    } catch (error) {
      // テンプレートがない場合は新規作成
      logger.warn(`テンプレートが見つかりません: ${templatePath}、新規作成します`);
      workbook.creator = 'IT補助金申請アシスタント';
      workbook.created = new Date();
    }

    const mappings = this.getFieldMappings(subsidyType, fileName);

    // フォームデータをExcelに書き込み
    for (const mapping of mappings) {
      try {
        const value = formData[mapping.fieldId];
        if (value !== undefined && value !== null) {
          await this.setCellValue(workbook, mapping, value);
        }
      } catch (error) {
        logger.warn(`セル書き込みエラー: ${mapping.cellReference}`, error);
      }
    }

    // 一時ファイルとして保存
    const outputPath = path.join('/tmp', `processed_${Date.now()}_${fileName}`);
    await workbook.xlsx.writeFile(outputPath);
    
    return outputPath;
  }

  private async setCellValue(workbook: ExcelJS.Workbook, mapping: ExcelFieldMapping, value: any): Promise<void> {
    const worksheet = workbook.getWorksheet(mapping.sheetName || 1) || workbook.addWorksheet('Sheet1');
    const cell = worksheet.getCell(mapping.cellReference);

    // 数式セルでない場合のみ値を設定
    if (!mapping.isFormula) {
      const formattedValue = this.formatValueForExcel(value, mapping.format);
      cell.value = formattedValue;

      // フォーマット設定
      this.applyCellFormat(cell, mapping.format);
    }
  }

  private formatValueForExcel(value: any, format?: string): any {
    switch (format) {
      case 'currency':
        return typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^\d.-]/g, '')) || 0;
      case 'percentage':
        const pct = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^\d.-]/g, '')) || 0;
        return pct / 100; // Excelでは0.1が10%
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^\d.-]/g, '')) || 0;
      case 'date':
        return value instanceof Date ? value : new Date(value);
      default:
        return value?.toString() || '';
    }
  }

  private applyCellFormat(cell: ExcelJS.Cell, format?: string): void {
    switch (format) {
      case 'currency':
        cell.numFmt = '¥#,##0';
        break;
      case 'percentage':
        cell.numFmt = '0.00%';
        break;
      case 'number':
        cell.numFmt = '#,##0';
        break;
      case 'date':
        cell.numFmt = 'yyyy/mm/dd';
        break;
    }
  }

  private async uploadToStorage(filePath: string, fileName: string, subsidyType: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const uploadPath = `excel-exports/${subsidyType}/${Date.now()}_${fileName}`;

      const { data, error } = await this.supabase.storage
        .from('documents')
        .upload(uploadPath, fileBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          upsert: true
        });

      if (error) {
        throw error;
      }

      const { data: urlData } = this.supabase.storage
        .from('documents')
        .getPublicUrl(uploadPath);

      // 一時ファイルを削除
      await fs.unlink(filePath).catch(() => {});

      return urlData.publicUrl;
    } catch (error) {
      logger.error('ストレージアップロードエラー:', error);
      throw new Error(`ファイルアップロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createZipArchive(fileUrls: string[], subsidyType: string): Promise<string> {
    // ZIP作成は別途実装が必要
    // 現在は個別ファイルのダウンロードURLを返す
    logger.info('ZIP作成機能は今後実装予定');
    return fileUrls[0]; // 暫定的に最初のファイルを返す
  }

  private getDefaultTemplate(subsidyType: string): string {
    const templates: Record<string, string> = {
      'it-donyu': 'it2025_chingin_houkoku.xlsx',
      'monozukuri': 'CAGR算出ツール_20250314.xlsx',
      'jizokuka': 'r3i_y3e.xlsx'
    };
    
    return templates[subsidyType] || templates['it-donyu'];
  }
}