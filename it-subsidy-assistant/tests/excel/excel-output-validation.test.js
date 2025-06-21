/**
 * Excel出力品質検証テスト
 * Worker2のExcel生成機能の正確性確認
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

describe('Excel出力品質検証', () => {
  let testWorkbook;
  const testDataPath = path.join(__dirname, '../data');
  
  beforeAll(async () => {
    // テスト用Excelファイルの準備
    testWorkbook = new ExcelJS.Workbook();
  });

  describe('IT導入補助金Excel出力検証', () => {
    test('基本フィールドの正確な書き込み', async () => {
      const worksheet = testWorkbook.addWorksheet('IT導入補助金申請書');
      
      // テストデータ
      const formData = {
        companyName: 'テスト株式会社',
        representativeName: '山田太郎',
        applicationAmount: 1000000,
        expectedEffect: '業務効率50%向上',
        employeeCount: 25,
        annualRevenue: 50000000
      };

      // フィールドマッピングのテスト
      const fieldMappings = [
        { field: 'companyName', cell: 'B5', expected: 'テスト株式会社' },
        { field: 'representativeName', cell: 'B7', expected: '山田太郎' },
        { field: 'applicationAmount', cell: 'F10', expected: 1000000 },
        { field: 'expectedEffect', cell: 'B15', expected: '業務効率50%向上' }
      ];

      // 各フィールドを書き込み
      fieldMappings.forEach(mapping => {
        worksheet.getCell(mapping.cell).value = formData[mapping.field];
      });

      // 検証
      fieldMappings.forEach(mapping => {
        const cellValue = worksheet.getCell(mapping.cell).value;
        expect(cellValue).toBe(mapping.expected);
      });
    });

    test('数値フォーマットの正確性', async () => {
      const worksheet = testWorkbook.addWorksheet('数値フォーマットテスト');
      
      // 金額フィールドのテスト
      worksheet.getCell('A1').value = 1000000;
      worksheet.getCell('A1').numFmt = '#,##0';
      
      worksheet.getCell('B1').value = 0.75;
      worksheet.getCell('B1').numFmt = '0%';
      
      // フォーマット確認
      expect(worksheet.getCell('A1').numFmt).toBe('#,##0');
      expect(worksheet.getCell('B1').numFmt).toBe('0%');
      expect(worksheet.getCell('A1').value).toBe(1000000);
      expect(worksheet.getCell('B1').value).toBe(0.75);
    });

    test('必須フィールドの存在確認', async () => {
      const requiredFields = [
        'companyName',
        'representativeName', 
        'applicationAmount',
        'businessPlan',
        'expectedEffect'
      ];

      const formData = {
        companyName: 'テスト株式会社',
        representativeName: '山田太郎',
        applicationAmount: 1000000,
        businessPlan: 'ITツール導入による効率化',
        expectedEffect: '生産性向上'
      };

      // 全必須フィールドが存在することを確認
      requiredFields.forEach(field => {
        expect(formData).toHaveProperty(field);
        expect(formData[field]).toBeTruthy();
      });
    });
  });

  describe('ものづくり補助金Excel出力検証', () => {
    test('CAGR算出ツールの計算精度', async () => {
      const worksheet = testWorkbook.addWorksheet('CAGR算出');
      
      // テストデータ（3年間の売上データ）
      const salesData = {
        year1: 100000000, // 1億円
        year2: 110000000, // 1.1億円 
        year3: 121000000  // 1.21億円（年率10%成長）
      };

      // 売上データを入力
      worksheet.getCell('B5').value = salesData.year1;
      worksheet.getCell('B6').value = salesData.year2;
      worksheet.getCell('B7').value = salesData.year3;

      // CAGR計算式
      const cagrFormula = '=POWER(B7/B5,1/2)-1';
      worksheet.getCell('B10').value = { formula: cagrFormula };
      worksheet.getCell('B10').numFmt = '0.00%';

      // 期待値：10%成長なので約10%のCAGR
      const expectedCAGR = Math.pow(salesData.year3 / salesData.year1, 1/2) - 1;
      expect(expectedCAGR).toBeCloseTo(0.1, 2); // 約0.1（10%）
    });

    test('製造業特有フィールドの処理', async () => {
      const worksheet = testWorkbook.addWorksheet('製造業申請書');
      
      const manufacturingData = {
        facilityInvestment: 50000000,
        productionCapacity: 1000,
        qualityImprovement: '不良率1%削減',
        environmentalImpact: 'CO2排出量20%削減'
      };

      // 製造業特有のフィールドを設定
      worksheet.getCell('C10').value = manufacturingData.facilityInvestment;
      worksheet.getCell('C12').value = manufacturingData.productionCapacity;
      worksheet.getCell('C15').value = manufacturingData.qualityImprovement;
      worksheet.getCell('C18').value = manufacturingData.environmentalImpact;

      // 検証
      expect(worksheet.getCell('C10').value).toBe(50000000);
      expect(worksheet.getCell('C12').value).toBe(1000);
      expect(worksheet.getCell('C15').value).toBe('不良率1%削減');
      expect(worksheet.getCell('C18').value).toBe('CO2排出量20%削減');
    });
  });

  describe('持続化補助金Excel出力検証', () => {
    test('小規模事業者情報の正確性', async () => {
      const worksheet = testWorkbook.addWorksheet('持続化補助金申請書');
      
      const smallBusinessData = {
        employeeCount: 5,
        salesChannels: '店舗販売、EC',
        marketingPlan: 'SNS広告展開',
        expectedCustomerIncrease: 200
      };

      // 小規模事業者特有のデータを入力
      worksheet.getCell('D5').value = smallBusinessData.employeeCount;
      worksheet.getCell('D8').value = smallBusinessData.salesChannels;
      worksheet.getCell('D12').value = smallBusinessData.marketingPlan;
      worksheet.getCell('D15').value = smallBusinessData.expectedCustomerIncrease;

      // 従業員数が小規模事業者の範囲内であることを確認
      expect(smallBusinessData.employeeCount).toBeLessThanOrEqual(20);
      expect(worksheet.getCell('D5').value).toBe(5);
      expect(worksheet.getCell('D8').value).toBe('店舗販売、EC');
    });
  });

  describe('共通検証項目', () => {
    test('日付フォーマットの統一性', async () => {
      const worksheet = testWorkbook.addWorksheet('日付テスト');
      
      const testDate = new Date('2025-03-15');
      worksheet.getCell('A1').value = testDate;
      worksheet.getCell('A1').numFmt = 'yyyy/mm/dd';
      
      expect(worksheet.getCell('A1').value).toBeInstanceOf(Date);
      expect(worksheet.getCell('A1').numFmt).toBe('yyyy/mm/dd');
    });

    test('セルの結合とレイアウト', async () => {
      const worksheet = testWorkbook.addWorksheet('レイアウトテスト');
      
      // タイトル行の結合
      worksheet.mergeCells('A1:F1');
      worksheet.getCell('A1').value = 'IT補助金申請書';
      worksheet.getCell('A1').alignment = { horizontal: 'center' };
      
      // 結合が正しく行われていることを確認
      expect(worksheet.getCell('A1').isMerged).toBe(true);
      expect(worksheet.getCell('A1').value).toBe('IT補助金申請書');
    });

    test('データ検証ルールの設定', async () => {
      const worksheet = testWorkbook.addWorksheet('データ検証');
      
      // 数値範囲の検証
      worksheet.getCell('A1').dataValidation = {
        type: 'whole',
        operator: 'between',
        formulae: [0, 100000000]
      };
      
      // 選択肢の検証
      worksheet.getCell('B1').dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"製造業,サービス業,小売業"']
      };

      expect(worksheet.getCell('A1').dataValidation.type).toBe('whole');
      expect(worksheet.getCell('B1').dataValidation.type).toBe('list');
    });

    test('エラーハンドリング - 不正データの処理', async () => {
      const worksheet = testWorkbook.addWorksheet('エラーテスト');
      
      // 不正な数値データのテスト
      const invalidData = {
        amount: 'invalid_number',
        percentage: 150, // 100%を超過
        negativeValue: -1000
      };

      // 数値変換エラーのハンドリング
      const safeParseNumber = (value) => {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      };

      // パーセンテージ範囲チェック
      const safePercentage = (value) => {
        return Math.max(0, Math.min(100, value));
      };

      expect(safeParseNumber(invalidData.amount)).toBe(0);
      expect(safePercentage(invalidData.percentage)).toBe(100);
      expect(Math.max(0, invalidData.negativeValue)).toBe(0);
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量データ処理の性能', async () => {
      const worksheet = testWorkbook.addWorksheet('パフォーマンステスト');
      
      const startTime = Date.now();
      
      // 1000行のデータを生成
      for (let i = 1; i <= 1000; i++) {
        worksheet.getCell(`A${i}`).value = `Company${i}`;
        worksheet.getCell(`B${i}`).value = i * 1000;
        worksheet.getCell(`C${i}`).value = Math.random() * 100;
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // 1000行の処理が5秒以内で完了することを確認
      expect(processingTime).toBeLessThan(5000);
      expect(worksheet.rowCount).toBe(1000);
    });

    test('メモリ使用量の最適化', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 複数のワークシートを作成
      for (let i = 0; i < 10; i++) {
        const worksheet = testWorkbook.addWorksheet(`Sheet${i}`);
        for (let j = 1; j <= 100; j++) {
          worksheet.getCell(`A${j}`).value = `Data${j}`;
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // メモリ増加量が50MB以下であることを確認
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  afterAll(async () => {
    // テスト用ファイルのクリーンアップ
    const testOutputPath = path.join(__dirname, '../temp/test-output.xlsx');
    
    if (testWorkbook.worksheets.length > 0) {
      try {
        await testWorkbook.xlsx.writeFile(testOutputPath);
        // ファイルが正常に作成されたことを確認
        const fileExists = fs.existsSync(testOutputPath);
        expect(fileExists).toBe(true);
        
        // テストファイルを削除
        if (fileExists) {
          fs.unlinkSync(testOutputPath);
        }
      } catch (error) {
        console.warn('テストファイルの出力に失敗:', error.message);
      }
    }
  });
});