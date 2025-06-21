import request from 'supertest';
import express from 'express';
import excelRoutes from '@/routes/excel';
import { ExcelProcessor } from '@/services/excelProcessor';
import jwt from 'jsonwebtoken';

// ExcelProcessorのモック
jest.mock('@/services/excelProcessor');
const MockedExcelProcessor = ExcelProcessor as jest.MockedClass<typeof ExcelProcessor>;

// JWTのモック
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

const app = express();
app.use(express.json());
app.use('/excel', excelRoutes);

// テスト用のJWTトークン生成
const generateTestToken = (userId: string = 'test-user-id') => {
  return 'test-jwt-token';
};

// 認証ミドルウェアのモック設定
mockedJwt.verify.mockImplementation((token, secret, callback: any) => {
  if (token === 'test-jwt-token') {
    callback(null, { id: 'test-user-id', email: 'test@example.com' });
  } else {
    callback(new Error('Invalid token'), null);
  }
});

describe('Excel Routes', () => {
  let mockExcelProcessor: jest.Mocked<ExcelProcessor>;

  beforeEach(() => {
    mockExcelProcessor = new MockedExcelProcessor() as jest.Mocked<ExcelProcessor>;
    MockedExcelProcessor.mockImplementation(() => mockExcelProcessor);
    jest.clearAllMocks();
  });

  describe('POST /excel/read', () => {
    it('Excel読み取りが成功する場合', async () => {
      const mockResult = {
        subsidyType: 'it-donyu',
        fileName: 'test.xlsx',
        extractedData: {
          company_name: 'テスト株式会社',
          employee_count: 50
        },
        timestamp: '2025-01-01T00:00:00.000Z'
      };

      mockExcelProcessor.readExcelFile.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/excel/read')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .attach('excelFile', Buffer.from('test file content'), 'test.xlsx')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
      expect(mockExcelProcessor.readExcelFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        'test.xlsx'
      );
    });

    it('ファイルがアップロードされていない場合はエラーを返す', async () => {
      const response = await request(app)
        .post('/excel/read')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ファイルが選択されていません');
    });

    it('認証トークンがない場合は401エラーを返す', async () => {
      await request(app)
        .post('/excel/read')
        .attach('excelFile', Buffer.from('test file content'), 'test.xlsx')
        .expect(401);
    });

    it('Excel処理でエラーが発生した場合は500エラーを返す', async () => {
      mockExcelProcessor.readExcelFile.mockRejectedValue(new Error('Processing failed'));

      const response = await request(app)
        .post('/excel/read')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .attach('excelFile', Buffer.from('test file content'), 'test.xlsx')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Excel読み取りに失敗');
    });

    it('サポートされていないファイル形式の場合はエラーを返す', async () => {
      const response = await request(app)
        .post('/excel/read')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .attach('excelFile', Buffer.from('test file content'), 'test.txt')
        .expect(400);

      expect(response.body).toEqual({
        error: 'サポートされていないファイル形式です'
      });
    });
  });

  describe('POST /excel/write', () => {
    it('フォームデータ書き込みが成功する場合', async () => {
      const mockResult = {
        success: true,
        processedFiles: ['it2025_chingin_houkoku.xlsx'],
        errors: [],
        downloadUrls: ['https://example.com/file.xlsx']
      };

      mockExcelProcessor.writeFormDataToExcel.mockResolvedValue(mockResult);

      const requestData = {
        subsidyType: 'it-donyu',
        applicationFrame: 'normal',
        formData: {
          company_name: 'テスト株式会社',
          employee_count: 50
        }
      };

      const response = await request(app)
        .post('/excel/write')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.processedFiles).toEqual(mockResult.processedFiles);
      expect(response.body.data.downloadUrls).toEqual(mockResult.downloadUrls);
      expect(mockExcelProcessor.writeFormDataToExcel).toHaveBeenCalledWith({
        subsidyType: 'it-donyu',
        applicationFrame: 'normal',
        formData: requestData.formData
      });
    });

    it('無効な補助金タイプの場合はバリデーションエラーを返す', async () => {
      const requestData = {
        subsidyType: 'invalid-type',
        formData: { company_name: 'テスト' }
      };

      const response = await request(app)
        .post('/excel/write')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .send(requestData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('有効な補助金タイプ');
    });

    it('フォームデータが不正な場合はバリデーションエラーを返す', async () => {
      const requestData = {
        subsidyType: 'it-donyu',
        formData: 'invalid data' // オブジェクトでない
      };

      const response = await request(app)
        .post('/excel/write')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .send(requestData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('オブジェクト形式');
    });

    it('Excel処理でエラーが発生した場合は400エラーを返す', async () => {
      const mockResult = {
        success: false,
        processedFiles: [],
        errors: ['ファイル処理エラー'],
        downloadUrls: []
      };

      mockExcelProcessor.writeFormDataToExcel.mockResolvedValue(mockResult);

      const requestData = {
        subsidyType: 'it-donyu',
        formData: { company_name: 'テスト' }
      };

      const response = await request(app)
        .post('/excel/write')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(mockResult.errors);
    });
  });

  describe('GET /excel/template/:subsidyType', () => {
    it('テンプレートファイルを正常に取得する', async () => {
      const mockBuffer = Buffer.from('excel template data');
      mockExcelProcessor.getTemplate.mockResolvedValue(mockBuffer);

      const response = await request(app)
        .get('/excel/template/it-donyu')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .expect(200);

      expect(response.body).toEqual(mockBuffer);
      expect(response.headers['content-type']).toContain('spreadsheetml.sheet');
      expect(mockExcelProcessor.getTemplate).toHaveBeenCalledWith('it-donyu', undefined);
    });

    it('特定のテンプレート名を指定して取得する', async () => {
      const mockBuffer = Buffer.from('specific template data');
      mockExcelProcessor.getTemplate.mockResolvedValue(mockBuffer);

      await request(app)
        .get('/excel/template/it-donyu?templateName=specific_template.xlsx')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .expect(200);

      expect(mockExcelProcessor.getTemplate).toHaveBeenCalledWith('it-donyu', 'specific_template.xlsx');
    });

    it('無効な補助金タイプの場合はバリデーションエラーを返す', async () => {
      const response = await request(app)
        .get('/excel/template/invalid-type')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .expect(400);

      expect(response.body.errors[0].msg).toContain('有効な補助金タイプ');
    });

    it('テンプレート取得でエラーが発生した場合は500エラーを返す', async () => {
      mockExcelProcessor.getTemplate.mockRejectedValue(new Error('Template not found'));

      const response = await request(app)
        .get('/excel/template/it-donyu')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('テンプレート取得に失敗');
    });
  });

  describe('POST /excel/batch-export', () => {
    it('一括出力が成功する場合', async () => {
      const mockResult = {
        success: true,
        processedFiles: ['file1.xlsx', 'file2.xlsx'],
        errors: [],
        downloadUrls: ['url1', 'url2', 'zip_url']
      };

      mockExcelProcessor.batchExport.mockResolvedValue(mockResult);

      const requestData = {
        subsidyType: 'it-donyu',
        formData: { company_name: 'テスト' }
      };

      const response = await request(app)
        .post('/excel/batch-export')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalFiles).toBe(2);
      expect(mockExcelProcessor.batchExport).toHaveBeenCalledWith({
        subsidyType: 'it-donyu',
        applicationFrame: 'all',
        formData: requestData.formData
      });
    });

    it('一括出力でエラーが発生した場合は400エラーを返す', async () => {
      const mockResult = {
        success: false,
        processedFiles: [],
        errors: ['エラーメッセージ'],
        downloadUrls: []
      };

      mockExcelProcessor.batchExport.mockResolvedValue(mockResult);

      const requestData = {
        subsidyType: 'it-donyu',
        formData: { company_name: 'テスト' }
      };

      const response = await request(app)
        .post('/excel/batch-export')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(mockResult.errors);
    });
  });

  describe('POST /excel/validate', () => {
    it('バリデーションが成功する場合', async () => {
      const requestData = {
        subsidyType: 'it-donyu',
        formData: {
          company_name: 'テスト株式会社',
          representative_name: '山田太郎',
          employee_count: 50
        }
      };

      const response = await request(app)
        .post('/excel/validate')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBeDefined();
      expect(response.body.data.errors).toBeDefined();
      expect(response.body.data.warnings).toBeDefined();
    });

    it('バリデーションでエラーがある場合', async () => {
      const requestData = {
        subsidyType: 'it-donyu',
        formData: {
          company_name: '', // 必須フィールドが空
          employee_count: 10000 // 範囲外
        }
      };

      const response = await request(app)
        .post('/excel/validate')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.errors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /excel/field-mappings/:subsidyType', () => {
    it('フィールドマッピング情報を正常に取得する', async () => {
      const response = await request(app)
        .get('/excel/field-mappings/it-donyu')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toBeDefined();
      expect(Array.isArray(response.body.data.files)).toBe(true);
    });

    it('存在しない補助金タイプの場合は空のマッピングを返す', async () => {
      const response = await request(app)
        .get('/excel/field-mappings/unknown')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .expect(400);

      expect(response.body.errors[0].msg).toContain('有効な補助金タイプ');
    });
  });

  describe('レート制限', () => {
    it('短期間に多数のリクエストがある場合はレート制限される', async () => {
      // 最初の10回は成功
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/excel/validate')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            subsidyType: 'it-donyu',
            formData: { company_name: 'テスト' }
          })
          .expect(200);
      }

      // 11回目はレート制限でエラー
      const response = await request(app)
        .post('/excel/validate')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .send({
          subsidyType: 'it-donyu',
          formData: { company_name: 'テスト' }
        })
        .expect(429);

      expect(response.body.error).toContain('レート制限');
    });
  });

  describe('ファイルサイズ制限', () => {
    it('10MBを超えるファイルアップロードはエラーになる', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      const response = await request(app)
        .post('/excel/read')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .attach('excelFile', largeBuffer, 'large.xlsx')
        .expect(400);

      expect(response.body).toEqual({
        error: 'File too large'
      });
    });
  });
});