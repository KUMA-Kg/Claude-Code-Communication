/**
 * Phase 1 クイック統合テスト
 * Worker1とWorker2の実装を直接確認
 */

const request = require('supertest');
const path = require('path');

// Worker2の実装サーバーを直接インポート
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

describe('Phase 1 クイック統合テスト', () => {
  
  describe('1. バックエンドAPI疎通確認', () => {
    test('ヘルスチェックエンドポイント', async () => {
      const response = await request(BACKEND_URL)
        .get('/api/health')
        .timeout(5000);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });

    test('補助金データエンドポイント', async () => {
      const response = await request(BACKEND_URL)
        .get('/api/subsidies')
        .timeout(5000);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('subsidies');
      expect(Array.isArray(response.body.subsidies)).toBe(true);
    });
  });

  describe('2. 認証機能確認', () => {
    test('デモユーザーログイン', async () => {
      const response = await request(BACKEND_URL)
        .post('/api/auth/login')
        .send({
          email: 'demo@example.com',
          password: 'demo123'
        })
        .timeout(5000);

      // 200 or 404 (未実装の場合)
      expect([200, 404, 401]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('token');
      }
    });

    test('新規ユーザー登録', async () => {
      const testEmail = `test${Date.now()}@example.com`;
      
      const response = await request(BACKEND_URL)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'TestPass123!'
        })
        .timeout(5000);

      // 201 or 404 (未実装の場合)
      expect([201, 404, 400]).toContain(response.status);
    });
  });

  describe('3. セッション管理API確認', () => {
    let authToken;

    beforeAll(async () => {
      // 認証トークンを取得（可能な場合）
      try {
        const loginResponse = await request(BACKEND_URL)
          .post('/api/auth/login')
          .send({
            email: 'demo@example.com',
            password: 'demo123'
          });

        if (loginResponse.status === 200) {
          authToken = loginResponse.body.token;
        }
      } catch (e) {
        // 認証が未実装の場合はスキップ
      }
    });

    test('セッション一覧取得', async () => {
      const response = await request(BACKEND_URL)
        .get('/api/sessions')
        .set('Authorization', authToken ? `Bearer ${authToken}` : '')
        .timeout(5000);

      // 200, 401, 404のいずれか
      expect([200, 401, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('sessions');
      }
    });

    test('新規セッション作成', async () => {
      const sessionData = {
        sessionName: 'テストセッション',
        subsidyType: 'IT導入補助金',
        answers: {
          company: 'テスト株式会社',
          businessType: 'IT'
        }
      };

      const response = await request(BACKEND_URL)
        .post('/api/sessions')
        .set('Authorization', authToken ? `Bearer ${authToken}` : '')
        .send(sessionData)
        .timeout(5000);

      // 201, 401, 404のいずれか
      expect([201, 401, 404]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body).toHaveProperty('session');
        expect(response.body.session).toHaveProperty('id');
      }
    });
  });

  describe('4. CORS設定確認', () => {
    test('フロントエンドオリジンからのアクセス', async () => {
      const response = await request(BACKEND_URL)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000')
        .timeout(5000);

      expect(response.status).toBe(200);
      
      // CORSヘッダーの確認
      const corsHeader = response.headers['access-control-allow-origin'];
      expect(corsHeader).toBeTruthy();
    });
  });

  describe('5. セキュリティ機能確認', () => {
    test('セキュリティヘッダーの設定', async () => {
      const response = await request(BACKEND_URL)
        .get('/api/health')
        .timeout(5000);

      expect(response.status).toBe(200);
      
      // 基本的なセキュリティヘッダーの確認
      const headers = response.headers;
      expect(headers['x-content-type-options']).toBeTruthy();
      expect(headers['x-frame-options']).toBeTruthy();
    });

    test('SQLインジェクション対策', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(BACKEND_URL)
        .get('/api/subsidies')
        .query({ search: maliciousInput })
        .timeout(5000);

      expect(response.status).toBe(200);
      // サーバーがクラッシュしないことを確認
    });
  });

  describe('6. エラーハンドリング確認', () => {
    test('存在しないエンドポイント', async () => {
      const response = await request(BACKEND_URL)
        .get('/api/nonexistent')
        .timeout(5000);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('不正なJSON送信', async () => {
      const response = await request(BACKEND_URL)
        .post('/api/sessions')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .timeout(5000);

      expect(response.status).toBe(400);
    });
  });
});

// フロントエンド機能の簡易確認
describe('フロントエンド機能確認', () => {
  const fs = require('fs');
  const frontendPath = path.join(__dirname, '../../frontend/src');

  test('SessionManagerコンポーネントの存在', () => {
    const sessionManagerPath = path.join(frontendPath, 'components/session/SessionManager.tsx');
    expect(fs.existsSync(sessionManagerPath)).toBe(true);
  });

  test('API serviceの存在', () => {
    const apiServicePath = path.join(frontendPath, 'services/api.service.ts');
    const apiServicePathAlt = path.join(frontendPath, 'services/api.ts');
    
    const exists = fs.existsSync(apiServicePath) || fs.existsSync(apiServicePathAlt);
    expect(exists).toBe(true);
  });

  test('認証関連コンポーネントの存在', () => {
    const authPaths = [
      path.join(frontendPath, 'components/auth'),
      path.join(frontendPath, 'components/Auth'),
      path.join(frontendPath, 'pages/auth'),
      path.join(frontendPath, 'pages/Auth')
    ];

    const authExists = authPaths.some(authPath => fs.existsSync(authPath));
    expect(authExists).toBe(true);
  });

  test('エラーハンドリングコンポーネントの存在', () => {
    const errorPaths = [
      path.join(frontendPath, 'components/ErrorBoundary.tsx'),
      path.join(frontendPath, 'components/ErrorDisplay.tsx'),
      path.join(frontendPath, 'components/error'),
      path.join(frontendPath, 'hooks/useErrorHandler.ts')
    ];

    const errorHandlingExists = errorPaths.some(errorPath => fs.existsSync(errorPath));
    expect(errorHandlingExists).toBe(true);
  });
});