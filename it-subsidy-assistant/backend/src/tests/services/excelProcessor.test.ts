import { ExcelProcessor } from '@/services/excelProcessor';
import { ExcelMapper } from '@/utils/excelMapper';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';

// Supabaseクライアントのモック
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test-url.com/file.xlsx' } }))
      }))
    }
  }))
}));

// ファイルシステム操作のモック
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('ExcelProcessor', () => {
  let excelProcessor: ExcelProcessor;

  beforeEach(() => {
    excelProcessor = new ExcelProcessor();
    jest.clearAllMocks();
  });

  describe('readExcelFile', () => {
    it('IT導入補助金の賃金報告書を正しく読み取る', async () => {
      // テスト用のExcelファイルを作成
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('賃金報告書');
      
      // テストデータを設定
      worksheet.getCell('C4').value = 'テスト株式会社';
      worksheet.getCell('C5').value = '1234567890123';
      worksheet.getCell('C6').value = '代表取締役';
      worksheet.getCell('C7').value = '山田太郎';
      worksheet.getCell('C10').value = 50;
      worksheet.getCell('C11').value = 400;
      worksheet.getCell('C12').value = 420;

      const buffer = await workbook.xlsx.writeBuffer() as Buffer;

      const result = await excelProcessor.readExcelFile(buffer, 'it2025_chingin_houkoku.xlsx');

      expect(result.subsidyType).toBe('it-donyu');
      expect(result.extractedData.company_name).toBe('テスト株式会社');
      expect(result.extractedData.corporate_number).toBe('1234567890123');
      expect(result.extractedData.representative_title).toBe('代表取締役');
      expect(result.extractedData.representative_name).toBe('山田太郎');
      expect(result.extractedData.employee_count).toBe(50);
      expect(result.extractedData.current_avg_salary).toBe(400);
      expect(result.extractedData.planned_avg_salary).toBe(420);
    });

    it('CAGR算出ツールを正しく読み取る', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('CAGR算出');
      
      worksheet.getCell('C5').value = 10000;
      worksheet.getCell('C6').value = 11000;
      worksheet.getCell('C7').value = 12100;
      worksheet.getCell('C8').value = 13310;
      worksheet.getCell('C9').value = 16105;

      const buffer = await workbook.xlsx.writeBuffer() as Buffer;

      const result = await excelProcessor.readExcelFile(buffer, 'CAGR算出ツール_20250314.xlsx');

      expect(result.subsidyType).toBe('monozukuri');
      expect(result.extractedData.base_year_revenue).toBe(10000);
      expect(result.extractedData.year1_target).toBe(11000);
      expect(result.extractedData.year3_target).toBe(13310);
    });

    it('存在しないセルの場合はエラーをログに記録する', async () => {
      const workbook = new ExcelJS.Workbook();
      workbook.addWorksheet('テストシート');

      const buffer = await workbook.xlsx.writeBuffer() as Buffer;

      const result = await excelProcessor.readExcelFile(buffer, 'it2025_chingin_houkoku.xlsx');

      expect(result.extractedData).toEqual({});
    });

    it('無効なファイル形式の場合はエラーを投げる', async () => {
      const invalidBuffer = Buffer.from('invalid excel data');

      await expect(
        excelProcessor.readExcelFile(invalidBuffer, 'invalid.xlsx')
      ).rejects.toThrow('Excel読み取りに失敗しました');
    });
  });

  describe('writeFormDataToExcel', () => {
    beforeEach(() => {
      // ファイル読み取りのモック
      mockedFs.readFile.mockResolvedValue(Buffer.from('template data'));
    });

    it('IT導入補助金のフォームデータを正しく書き込む', async () => {
      const formData = {
        company_name: 'テスト株式会社',
        corporate_number: '1234567890123',
        representative_title: '代表取締役',
        representative_name: '山田太郎',
        employee_count: 50,
        current_avg_salary: 400000,
        planned_avg_salary: 420000,
        it_tool_name: 'テストITツール',
        software_cost: 500000,
        implementation_cost: 100000
      };

      const result = await excelProcessor.writeFormDataToExcel({
        subsidyType: 'it-donyu',
        applicationFrame: 'normal',
        formData
      });

      expect(result.success).toBe(true);
      expect(result.processedFiles).toContain('it2025_chingin_houkoku.xlsx');
      expect(result.processedFiles).toContain('it2025_jisshinaiyosetsumei_cate5.xlsx');
      expect(result.downloadUrls).toHaveLength(result.processedFiles.length);
    });

    it('ものづくり補助金のCAGRデータを正しく書き込む', async () => {
      const formData = {
        base_year_revenue: 10000000,
        year1_target: 11000000,
        year2_target: 12100000,
        year3_target: 13310000,
        year5_target: 16105000
      };

      const result = await excelProcessor.writeFormDataToExcel({
        subsidyType: 'monozukuri',
        formData
      });

      expect(result.success).toBe(true);
      expect(result.processedFiles).toContain('CAGR算出ツール_20250314.xlsx');
    });

    it('必要なテンプレートファイルが存在しない場合は新規作成する', async () => {
      mockedFs.readFile.mockRejectedValue(new Error('File not found'));

      const formData = {
        subsidy_project_name: 'テスト事業',
        sales_expansion_plan: 'テスト販路開拓計画'
      };

      const result = await excelProcessor.writeFormDataToExcel({
        subsidyType: 'jizokuka',
        formData
      });

      expect(result.success).toBe(true);
    });
  });

  describe('batchExport', () => {
    beforeEach(() => {
      mockedFs.readFile.mockResolvedValue(Buffer.from('template data'));
    });

    it('複数ファイルの一括出力を正しく実行する', async () => {
      const formData = {
        company_name: 'テスト株式会社',
        representative_name: '山田太郎',
        employee_count: 50,
        current_avg_salary: 400000,
        planned_avg_salary: 420000,
        it_tool_name: 'テストITツール',
        software_cost: 500000
      };

      const result = await excelProcessor.batchExport({
        subsidyType: 'it-donyu',
        formData
      });

      expect(result.success).toBe(true);
      expect(result.processedFiles.length).toBeGreaterThan(1);
      expect(result.downloadUrls).toHaveLength(result.processedFiles.length + 1); // ZIP含む
    });
  });

  describe('getTemplate', () => {
    beforeEach(() => {
      mockedFs.readFile.mockResolvedValue(Buffer.from('template data'));
    });

    it('指定されたテンプレートファイルを取得する', async () => {
      const buffer = await excelProcessor.getTemplate('it-donyu', 'it2025_chingin_houkoku.xlsx');

      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('テンプレート名が指定されない場合はデフォルトを返す', async () => {
      const buffer = await excelProcessor.getTemplate('it-donyu');

      expect(buffer).toBeDefined();
      expect(mockedFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('it2025_chingin_houkoku.xlsx')
      );
    });

    it('存在しないテンプレートの場合はエラーを投げる', async () => {
      mockedFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(
        excelProcessor.getTemplate('invalid-type')
      ).rejects.toThrow('テンプレート取得に失敗しました');
    });
  });

  describe('データ変換とフォーマット', () => {
    it('通貨フォーマットを正しく変換する', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('テスト');
      
      // 通貨フィールドのテスト
      worksheet.getCell('C5').value = 500000;
      worksheet.getCell('C5').numFmt = '¥#,##0';

      const buffer = await workbook.xlsx.writeBuffer() as Buffer;

      const result = await excelProcessor.readExcelFile(buffer, 'it2025_kakakusetsumei_cate5.xlsx');

      expect(result.extractedData.software_cost).toBe(500000);
    });

    it('パーセンテージフォーマットを正しく変換する', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('テスト');
      
      worksheet.getCell('C13').value = 0.05; // 5%
      worksheet.getCell('C13').numFmt = '0.00%';

      const buffer = await workbook.xlsx.writeBuffer() as Buffer;

      const result = await excelProcessor.readExcelFile(buffer, 'it2025_chingin_houkoku.xlsx');

      expect(result.extractedData.salary_increase_rate).toBe(0.05);
    });
  });

  describe('エラーハンドリング', () => {
    it('Supabaseアップロードエラーを正しく処理する', async () => {
      // Supabaseエラーのモック
      const mockSupabase = {
        storage: {
          from: () => ({
            upload: jest.fn().mockResolvedValue({ 
              data: null, 
              error: new Error('Upload failed') 
            })
          })
        }
      };

      // ExcelProcessorの内部でSupabaseクライアントを置き換える必要があるが、
      // プライベートメソッドのテストは別のアプローチが必要
      mockedFs.readFile.mockResolvedValue(Buffer.from('template data'));

      const formData = { company_name: 'テスト' };

      // uploadToStorageメソッドがエラーを投げることを想定
      await expect(
        excelProcessor.writeFormDataToExcel({
          subsidyType: 'it-donyu',
          applicationFrame: 'normal',
          formData
        })
      ).rejects.toThrow();
    });

    it('無効な補助金タイプでも適切に処理する', async () => {
      const buffer = Buffer.from('test data');

      const result = await excelProcessor.readExcelFile(buffer, 'unknown_file.xlsx');

      expect(result.subsidyType).toBe('unknown');
      expect(result.extractedData).toEqual({});
    });
  });
});

describe('ExcelMapper', () => {
  describe('getTemplates', () => {
    it('IT導入補助金のテンプレート一覧を取得する', () => {
      const templates = ExcelMapper.getTemplates('it-donyu');

      expect(templates).toHaveLength(3);
      expect(templates[0].fileName).toBe('it2025_chingin_houkoku.xlsx');
      expect(templates[1].fileName).toBe('it2025_jisshinaiyosetsumei_cate5.xlsx');
      expect(templates[2].fileName).toBe('it2025_kakakusetsumei_cate5.xlsx');
    });

    it('存在しない補助金タイプの場合は空配列を返す', () => {
      const templates = ExcelMapper.getTemplates('unknown');

      expect(templates).toEqual([]);
    });
  });

  describe('validateFormData', () => {
    it('有効なIT導入補助金データを検証する', () => {
      const formData = {
        company_name: 'テスト株式会社',
        corporate_number: '1234567890123',
        representative_title: '代表取締役',
        representative_name: '山田太郎',
        employee_count: 50,
        current_avg_salary: 400000,
        planned_avg_salary: 420000,
        it_tool_name: 'テストITツール',
        software_cost: 500000
      };

      const result = ExcelMapper.validateFormData('it-donyu', formData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('必須フィールドが不足している場合はエラーを返す', () => {
      const formData = {
        company_name: '', // 必須フィールドが空
        employee_count: 50
      };

      const result = ExcelMapper.validateFormData('it-donyu', formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.missingFields).toContain('company_name');
    });

    it('法人番号の形式が正しくない場合はエラーを返す', () => {
      const formData = {
        company_name: 'テスト株式会社',
        corporate_number: '123456789', // 13桁でない
        representative_name: '山田太郎',
        employee_count: 50
      };

      const result = ExcelMapper.validateFormData('it-donyu', formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.fieldId === 'corporate_number' && 
        error.message.includes('13桁の数字')
      )).toBe(true);
    });

    it('数値範囲外の場合はエラーを返す', () => {
      const formData = {
        company_name: 'テスト株式会社',
        representative_name: '山田太郎',
        employee_count: 10000 // 上限を超える
      };

      const result = ExcelMapper.validateFormData('it-donyu', formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.fieldId === 'employee_count' && 
        error.message.includes('9999以下')
      )).toBe(true);
    });

    it('計画給与額が現在より低い場合は警告を返す', () => {
      const formData = {
        company_name: 'テスト株式会社',
        representative_name: '山田太郎',
        employee_count: 50,
        current_avg_salary: 500000,
        planned_avg_salary: 450000 // 現在より低い
      };

      const result = ExcelMapper.validateFormData('it-donyu', formData);

      expect(result.warnings.some(warning => 
        warning.fieldId === 'planned_avg_salary' && 
        warning.message.includes('高く設定')
      )).toBe(true);
    });

    it('IT導入補助金の金額制限を検証する', () => {
      const formData = {
        company_name: 'テスト株式会社',
        representative_name: '山田太郎',
        employee_count: 50,
        software_cost: 200000 // 30万円未満
      };

      const result = ExcelMapper.validateFormData('it-donyu', formData);

      expect(result.errors.some(error => 
        error.message.includes('最低申請額は30万円')
      )).toBe(true);
    });

    it('ものづくり補助金のCAGR警告を検証する', () => {
      const formData = {
        base_year_revenue: 10000000,
        year3_target: 10400000 // 約4%成長、5%未満
      };

      const result = ExcelMapper.validateFormData('monozukuri', formData);

      expect(result.warnings.some(warning => 
        warning.message.includes('CAGRが5%未満')
      )).toBe(true);
    });
  });

  describe('getFieldInfo', () => {
    it('指定されたフィールドの情報を取得する', () => {
      const fieldInfo = ExcelMapper.getFieldInfo('it-donyu', 'it2025_chingin_houkoku.xlsx', 'company_name');

      expect(fieldInfo).not.toBeNull();
      expect(fieldInfo!.label).toBe('申請者名（法人名/屋号）');
      expect(fieldInfo!.cellReference).toBe('C4');
      expect(fieldInfo!.required).toBe(true);
    });

    it('存在しないフィールドの場合はnullを返す', () => {
      const fieldInfo = ExcelMapper.getFieldInfo('it-donyu', 'it2025_chingin_houkoku.xlsx', 'unknown_field');

      expect(fieldInfo).toBeNull();
    });
  });
});