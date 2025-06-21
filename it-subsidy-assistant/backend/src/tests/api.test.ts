import request from 'supertest';
import app from '@/index';
import { supabase } from '@/config/supabase';

describe('IT補助金アシストツール API テスト', () => {
  let authToken: string;
  let testUserId: string;
  let testCompanyId: string;

  // テスト用のユーザーを作成
  beforeAll(async () => {
    const testUser = {
      email: 'test@example.com',
      password: 'TestPass123!',
      name: 'テストユーザー'
    };

    // ユーザー登録
    const registerRes = await request(app)
      .post('/v1/auth/register')
      .send(testUser);

    if (registerRes.status === 201) {
      // ログイン
      const loginRes = await request(app)
        .post('/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      authToken = loginRes.body.data.accessToken;
      testUserId = loginRes.body.data.user.id;
    }
  });

  // テスト後のクリーンアップ
  afterAll(async () => {
    if (testUserId) {
      await supabase.from('users').delete().eq('id', testUserId);
    }
  });

  describe('認証API', () => {
    test('ユーザー登録が正常に動作する', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'NewPass123!',
        name: '新規ユーザー'
      };

      const res = await request(app)
        .post('/v1/auth/register')
        .send(newUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(newUser.email);

      // クリーンアップ
      if (res.body.data.user.id) {
        await supabase.from('users').delete().eq('id', res.body.data.user.id);
      }
    });

    test('ログインが正常に動作する', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    test('無効な認証情報でログインが失敗する', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('企業情報API', () => {
    test('企業情報の作成が正常に動作する', async () => {
      const companyData = {
        name: 'テスト株式会社',
        corporate_number: '1234567890123',
        postal_code: '100-0001',
        prefecture: '東京都',
        city: '千代田区',
        address: '千代田1-1-1',
        phone: '03-1234-5678',
        representative_name: 'テスト太郎',
        capital_amount: 10000,
        employee_count: 50
      };

      const res = await request(app)
        .post('/v1/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(companyData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(companyData.name);
      expect(res.body.data.is_sme).toBe(true);

      testCompanyId = res.body.data.id;
    });

    test('企業一覧の取得が正常に動作する', async () => {
      const res = await request(app)
        .get('/v1/companies')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('企業詳細の取得が正常に動作する', async () => {
      const res = await request(app)
        .get(`/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testCompanyId);
    });

    test('認証なしでアクセスが拒否される', async () => {
      const res = await request(app)
        .get('/v1/companies');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('申請枠判定API', () => {
    const subsidyId = 'it-donyu-2024';

    test('簡易判定（3つの質問）が正常に動作する', async () => {
      const res = await request(app)
        .post(`/v1/eligibility/subsidies/${subsidyId}/check-eligibility-simple`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hasDigitization: true,
          hasSecurityInvestment: false,
          isInvoiceRequired: false
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommended_frame).toBeDefined();
      expect(res.body.data.recommended_frame.frame_code).toBe('digitization');
      expect(res.body.data.recommended_frame.subsidy_rate).toBe(0.67);
    });

    test('判定用質問の取得が正常に動作する', async () => {
      const res = await request(app)
        .get(`/v1/eligibility/subsidies/${subsidyId}/eligibility-questions`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    test('申請枠一覧の取得が正常に動作する', async () => {
      const res = await request(app)
        .get(`/v1/eligibility/subsidies/${subsidyId}/frames`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('必要書類自動抽出API', () => {
    const subsidyId = 'it-donyu-2024';

    test('自動書類抽出が正常に動作する', async () => {
      const res = await request(app)
        .post(`/v1/required-documents/subsidies/${subsidyId}/documents/auto-extract`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hasDigitization: false,
          hasSecurityInvestment: true,
          isInvoiceRequired: false
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommended_frame.frame_code).toBe('security');
      expect(Array.isArray(res.body.data.required_documents)).toBe(true);
      expect(res.body.data.total_required).toBeGreaterThan(0);
    });

    test('カテゴリ別必要書類の取得が正常に動作する', async () => {
      const frameCode = 'normal';
      const res = await request(app)
        .get(`/v1/required-documents/subsidies/${subsidyId}/frames/${frameCode}/documents/by-category`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('category');
      expect(res.body.data[0]).toHaveProperty('documents');
    });

    test('書類詳細の取得が正常に動作する', async () => {
      const documentCode = 'DOC001';
      const res = await request(app)
        .get(`/v1/required-documents/documents/${documentCode}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.document_code).toBe(documentCode);
      expect(res.body.data.name).toBeDefined();
    });
  });

  describe('リアルタイムAPI', () => {
    test('WebSocket接続情報の取得が正常に動作する', async () => {
      const res = await request(app)
        .get('/v1/realtime/connection-info')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(testUserId);
      expect(res.body.data.connectionUrl).toBeDefined();
      expect(res.body.data.channels).toBeDefined();
    });

    test('接続状態の取得が正常に動作する', async () => {
      const res = await request(app)
        .get('/v1/realtime/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.connections).toBeDefined();
      expect(typeof res.body.data.total).toBe('number');
    });
  });

  describe('スケジュール管理API', () => {
    let testApplicationId: string;
    let testScheduleId: string;

    // テスト用の申請を作成
    beforeAll(async () => {
      const applicationData = {
        company_id: testCompanyId,
        subsidy_id: 'it-donyu-2024',
        application_frame: 'normal',
        answers: {
          hasDigitization: true,
          hasSecurityInvestment: false,
          isInvoiceRequired: false
        }
      };

      const { data } = await supabase
        .from('applications')
        .insert([applicationData])
        .select()
        .single();

      testApplicationId = data.id;
    });

    test('スケジュールの作成が正常に動作する', async () => {
      const scheduleData = {
        application_id: testApplicationId,
        schedule_type: 'deadline',
        title: '申請書類提出締切',
        description: 'IT導入補助金の申請書類を提出',
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7日後
        reminder_enabled: true,
        reminder_minutes: 1440 // 24時間前
      };

      const res = await request(app)
        .post('/v1/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scheduleData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(scheduleData.title);
      expect(res.body.data.schedule_type).toBe(scheduleData.schedule_type);
      expect(res.body.data.status).toBe('scheduled');

      testScheduleId = res.body.data.id;
    });

    test('スケジュール一覧の取得が正常に動作する', async () => {
      const res = await request(app)
        .get('/v1/schedules')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some((s: any) => s.id === testScheduleId)).toBe(true);
    });

    test('フィルター付きスケジュール一覧の取得', async () => {
      const res = await request(app)
        .get(`/v1/schedules?applicationId=${testApplicationId}&scheduleType=deadline`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((s: any) => s.application_id === testApplicationId)).toBe(true);
      expect(res.body.data.every((s: any) => s.schedule_type === 'deadline')).toBe(true);
    });

    test('今後のスケジュールの取得', async () => {
      const res = await request(app)
        .get('/v1/schedules/upcoming?limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
      expect(res.body.meta.limit).toBe(5);
    });

    test('スケジュール詳細の取得', async () => {
      const res = await request(app)
        .get(`/v1/schedules/${testScheduleId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testScheduleId);
      expect(res.body.data.application).toBeDefined();
      expect(res.body.data.reminders).toBeDefined();
    });

    test('スケジュールの更新', async () => {
      const updateData = {
        title: '更新されたタイトル',
        description: '更新された説明'
      };

      const res = await request(app)
        .put(`/v1/schedules/${testScheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(updateData.title);
      expect(res.body.data.description).toBe(updateData.description);
    });

    test('スケジュールの完了', async () => {
      const res = await request(app)
        .post(`/v1/schedules/${testScheduleId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('completed');
    });

    test('スケジュールの削除', async () => {
      const res = await request(app)
        .delete(`/v1/schedules/${testScheduleId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // 削除確認
      const getRes = await request(app)
        .get(`/v1/schedules/${testScheduleId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(404);
    });

    // クリーンアップ
    afterAll(async () => {
      if (testApplicationId) {
        await supabase.from('applications').delete().eq('id', testApplicationId);
      }
    });
  });

  describe('エラーハンドリング', () => {
    test('存在しないエンドポイントで404エラーが返される', async () => {
      const res = await request(app)
        .get('/v1/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('バリデーションエラーが適切に返される', async () => {
      const res = await request(app)
        .post('/v1/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // nameフィールドが不足
          corporate_number: 'invalid'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeDefined();
    });
  });
});