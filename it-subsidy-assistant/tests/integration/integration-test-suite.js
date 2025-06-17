/**
 * 統合テスト設計 - フロント・バック連携テスト
 * ユーザージャーニー全体とデータ整合性検証
 */

const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');
const { createApp } = require('../../backend/src/app');
const { connectDB, disconnectDB } = require('../../backend/src/config/database');

describe('IT補助金アシストツール 統合テスト', () => {
  let app;
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // テスト環境セットアップ
    await connectDB();
    app = createApp();
    
    // テストユーザー作成
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: '統合テスト ユーザー',
        companyName: '株式会社テスト'
      });
    
    testUserId = registerResponse.body.data.user.id;
    authToken = registerResponse.body.data.token;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('🔐 認証・認可フロー統合テスト', () => {
    test('登録→ログイン→認証済みAPI呼び出しフロー', async () => {
      // 1. ログイン
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data.token).toBeTruthy();

      // 2. 認証済みエンドポイントアクセス
      const profileResponse = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.data.user.email).toBe('test@example.com');
    });

    test('トークン期限切れ・リフレッシュフロー', async () => {
      // 期限切れトークンでアクセス
      const expiredToken = 'expired.token.here';
      const protectedResponse = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(protectedResponse.status).toBe(401);
      expect(protectedResponse.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('🔍 補助金検索エンドツーエンドフロー', () => {
    test('検索→詳細表示→お気に入り追加の完全フロー', async () => {
      // 1. 補助金検索実行
      const searchResponse = await request(app)
        .get('/api/subsidies/search')
        .query({
          companySize: '中小企業',
          industry: 'IT・情報通信業',
          investmentAmount: 5000000
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.data.subsidies).toBeInstanceOf(Array);
      expect(searchResponse.body.data.subsidies.length).toBeGreaterThan(0);

      const firstSubsidy = searchResponse.body.data.subsidies[0];
      expect(firstSubsidy).toHaveProperty('id');
      expect(firstSubsidy).toHaveProperty('matchScore');

      // 2. 補助金詳細取得
      const detailResponse = await request(app)
        .get(`/api/subsidies/${firstSubsidy.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(detailResponse.status).toBe(200);
      expect(detailResponse.body.data.id).toBe(firstSubsidy.id);
      expect(detailResponse.body.data).toHaveProperty('requirements');
      expect(detailResponse.body.data).toHaveProperty('applicationFlow');

      // 3. お気に入り追加
      const favoriteResponse = await request(app)
        .post(`/api/subsidies/${firstSubsidy.id}/favorite`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(favoriteResponse.status).toBe(200);

      // 4. お気に入り一覧確認
      const favoritesResponse = await request(app)
        .get('/api/subsidies/favorites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(favoritesResponse.status).toBe(200);
      expect(favoritesResponse.body.data.favorites.length).toBe(1);
      expect(favoritesResponse.body.data.favorites[0].id).toBe(firstSubsidy.id);
    });

    test('検索条件による絞り込み・ソート機能', async () => {
      // 複数条件での検索
      const complexSearchResponse = await request(app)
        .get('/api/subsidies/search')
        .query({
          companySize: '中小企業',
          industry: 'IT・情報通信業',
          investmentAmount: 3000000,
          subsidyRate: 0.5,
          deadline: '3ヶ月以内',
          region: '東京都',
          sort: 'matchScore',
          order: 'desc',
          page: 1,
          limit: 10
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(complexSearchResponse.status).toBe(200);
      
      const subsidies = complexSearchResponse.body.data.subsidies;
      expect(subsidies).toBeInstanceOf(Array);
      
      // ソート確認（マッチスコア降順）
      for (let i = 0; i < subsidies.length - 1; i++) {
        expect(subsidies[i].matchScore).toBeGreaterThanOrEqual(subsidies[i + 1].matchScore);
      }

      // ページネーション確認
      expect(complexSearchResponse.body.data.pagination).toHaveProperty('page');
      expect(complexSearchResponse.body.data.pagination).toHaveProperty('total');
    });
  });

  describe('📄 資料作成エンドツーエンドフロー', () => {
    test('テンプレート選択→情報入力→資料生成→ダウンロードの完全フロー', async () => {
      // 1. テンプレート一覧取得
      const templatesResponse = await request(app)
        .get('/api/documents/templates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(templatesResponse.status).toBe(200);
      const templates = templatesResponse.body.data.templates;
      expect(templates.length).toBeGreaterThan(0);

      const selectedTemplate = templates[0];

      // 2. 資料生成開始
      const generateResponse = await request(app)
        .post('/api/documents/generate')
        .send({
          templateId: selectedTemplate.id,
          subsidyId: 'subsidy_001',
          companyInfo: {
            name: '株式会社統合テスト',
            representative: '統合 太郎',
            address: '東京都千代田区1-1-1',
            phone: '03-1234-5678',
            email: 'integration@test.co.jp',
            establishedDate: '2020-04-01',
            employeeCount: 50,
            capital: 10000000,
            industry: 'IT・情報通信業'
          },
          businessPlan: {
            currentChallenges: '業務効率化が急務',
            solutionApproach: 'ITツール導入による自動化推進',
            expectedEffects: '作業時間50%削減、品質向上'
          },
          itInvestmentPlan: {
            targetSoftware: '統合業務管理システム',
            investmentAmount: 5000000,
            implementationSchedule: '2025年6月〜8月',
            expectedROI: '投資回収期間2年以内'
          }
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(generateResponse.status).toBe(200);
      expect(generateResponse.body.data).toHaveProperty('documentId');
      expect(generateResponse.body.data.status).toBe('generated');

      const documentId = generateResponse.body.data.documentId;

      // 3. 生成完了確認（ポーリング）
      let documentStatus = 'processing';
      let attempts = 0;
      const maxAttempts = 10;

      while (documentStatus !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request(app)
          .get(`/api/documents/${documentId}`)
          .set('Authorization', `Bearer ${authToken}`);

        documentStatus = statusResponse.body.data.status;
        attempts++;
      }

      expect(documentStatus).toBe('completed');

      // 4. ダウンロード確認
      const downloadResponse = await request(app)
        .get(`/api/documents/${documentId}/download`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(downloadResponse.status).toBe(200);
      expect(downloadResponse.headers['content-type']).toBe('application/pdf');
    });

    test('下書き保存・復元機能', async () => {
      const draftData = {
        templateId: 'template_001',
        companyInfo: {
          name: '株式会社下書きテスト',
          representative: '下書き 太郎'
        },
        isDraft: true
      };

      // 下書き保存
      const saveDraftResponse = await request(app)
        .post('/api/documents/draft')
        .send(draftData)
        .set('Authorization', `Bearer ${authToken}`);

      expect(saveDraftResponse.status).toBe(200);
      const draftId = saveDraftResponse.body.data.draftId;

      // 下書き取得
      const getDraftResponse = await request(app)
        .get(`/api/documents/draft/${draftId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getDraftResponse.status).toBe(200);
      expect(getDraftResponse.body.data.companyInfo.name).toBe('株式会社下書きテスト');
    });
  });

  describe('🔄 データ整合性検証テスト', () => {
    test('同期的データ更新の整合性確認', async () => {
      // お気に入り追加
      await request(app)
        .post('/api/subsidies/subsidy_001/favorite')
        .set('Authorization', `Bearer ${authToken}`);

      // ユーザープロファイルでお気に入り数確認
      const profileResponse = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // お気に入り一覧での確認
      const favoritesResponse = await request(app)
        .get('/api/subsidies/favorites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileResponse.body.data.user.favoriteCount).toBe(favoritesResponse.body.data.favorites.length);
    });

    test('非同期処理の整合性確認', async () => {
      // 複数の資料生成を並行実行
      const generatePromises = Array.from({ length: 3 }, (_, i) => 
        request(app)
          .post('/api/documents/generate')
          .send({
            templateId: 'template_001',
            companyInfo: { name: `並行テスト${i + 1}` }
          })
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(generatePromises);

      // 全て成功し、異なるIDが発行されることを確認
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.data.documentId).toBeTruthy();
      });

      const documentIds = responses.map(r => r.body.data.documentId);
      const uniqueIds = new Set(documentIds);
      expect(uniqueIds.size).toBe(documentIds.length);
    });

    test('トランザクション整合性テスト', async () => {
      // 資料生成開始
      const generateResponse = await request(app)
        .post('/api/documents/generate')
        .send({
          templateId: 'template_001',
          companyInfo: { name: 'トランザクションテスト' }
        })
        .set('Authorization', `Bearer ${authToken}`);

      const documentId = generateResponse.body.data.documentId;

      // 処理中にキャンセル要求
      const cancelResponse = await request(app)
        .post(`/api/documents/${documentId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(cancelResponse.status).toBe(200);

      // キャンセル後の状態確認
      const statusResponse = await request(app)
        .get(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.body.data.status).toBe('cancelled');
    });
  });

  describe('🚀 パフォーマンス・負荷テスト', () => {
    test('同時検索リクエスト負荷テスト', async () => {
      const concurrentRequests = 20;
      const startTime = Date.now();

      const searchPromises = Array.from({ length: concurrentRequests }, () =>
        request(app)
          .get('/api/subsidies/search')
          .query({ companySize: '中小企業' })
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(searchPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 全て成功することを確認
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // パフォーマンス要件確認（20並行リクエストが10秒以内）
      expect(totalTime).toBeLessThan(10000);
      
      console.log(`並行検索テスト: ${concurrentRequests}件のリクエストを${totalTime}msで処理`);
    });

    test('大量データ検索のメモリ効率性', async () => {
      const largeSearchResponse = await request(app)
        .get('/api/subsidies/search')
        .query({
          limit: 100,
          includeDetails: true
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(largeSearchResponse.status).toBe(200);
      expect(largeSearchResponse.body.data.subsidies.length).toBeLessThanOrEqual(100);
      
      // レスポンスサイズの確認（5MB以下）
      const responseSize = JSON.stringify(largeSearchResponse.body).length;
      expect(responseSize).toBeLessThan(5 * 1024 * 1024);
    });
  });

  describe('🛡️ セキュリティ統合テスト', () => {
    test('SQLインジェクション攻撃耐性', async () => {
      const maliciousQuery = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .get('/api/subsidies/search')
        .query({ companySize: maliciousQuery })
        .set('Authorization', `Bearer ${authToken}`);

      // 適切にエラーハンドリングされることを確認
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('XSS攻撃耐性', async () => {
      const maliciousScript = '<script>alert("XSS")</script>';
      
      const response = await request(app)
        .post('/api/documents/generate')
        .send({
          templateId: 'template_001',
          companyInfo: { name: maliciousScript }
        })
        .set('Authorization', `Bearer ${authToken}`);

      // 入力値検証でブロックされることを確認
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('認証バイパス攻撃耐性', async () => {
      // 無効なトークンでの攻撃
      const invalidTokens = [
        'Bearer invalid.token.here',
        'Bearer ' + 'A'.repeat(1000),
        'Bearer null',
        'Bearer undefined'
      ];

      for (const invalidToken of invalidTokens) {
        const response = await request(app)
          .get('/api/user/profile')
          .set('Authorization', invalidToken);

        expect(response.status).toBe(401);
      }
    });

    test('レート制限機能', async () => {
      // 短時間での大量リクエスト
      const requests = Array.from({ length: 150 }, () =>
        request(app)
          .get('/api/subsidies/search')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.allSettled(requests);
      
      // 一部のリクエストがレート制限でブロックされることを確認
      const rateLimitedResponses = responses.filter(result => 
        result.status === 'fulfilled' && result.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('🔍 エラーハンドリング・回復力テスト', () => {
    test('データベース接続エラー時の適切な応答', async () => {
      // モックでDB接続エラーをシミュレート
      jest.spyOn(require('../../backend/src/config/database'), 'query')
        .mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/subsidies/search')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(503);
      expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
    });

    test('外部API障害時のフォールバック', async () => {
      // 外部AI APIの障害をシミュレート
      jest.spyOn(require('../../backend/src/services/ai-service'), 'generateDocument')
        .mockRejectedValueOnce(new Error('External API timeout'));

      const response = await request(app)
        .post('/api/documents/generate')
        .send({
          templateId: 'template_001',
          companyInfo: { name: 'フォールバックテスト' }
        })
        .set('Authorization', `Bearer ${authToken}`);

      // グレースフルなエラー処理
      expect(response.status).toBe(503);
      expect(response.body.error.message).toContain('一時的に利用できません');
    });
  });
});

module.exports = {
  setupIntegrationTests: async () => {
    // 統合テスト環境のセットアップユーティリティ
    await connectDB();
    return createApp();
  },
  
  cleanupIntegrationTests: async () => {
    // 統合テスト環境のクリーンアップ
    await disconnectDB();
  }
};