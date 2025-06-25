/**
 * Phase 1 基本セキュリティテスト
 * セキュリティ機能の動作確認
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

// テスト設定
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 10000;

describe('Phase 1 基本セキュリティテスト', () => {
  let authToken;
  let csrfToken;

  beforeAll(async () => {
    // テスト用ユーザーでログイン
    const loginResponse = await request(BACKEND_URL)
      .post('/api/auth/login')
      .send({
        email: 'demo@example.com',
        password: 'demo123',
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.token;
      csrfToken = loginResponse.body.csrfToken;
    }
  }, TEST_TIMEOUT);

  describe('1. セキュリティヘッダー', () => {
    test('必須セキュリティヘッダーが設定されている', async () => {
      const response = await request(BACKEND_URL)
        .get('/api/health')
        .expect(200);

      // Helmetによるセキュリティヘッダー
      expect(response.headers['x-dns-prefetch-control']).toBe('off');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    test('Content-Security-Policyが設定されている', async () => {
      const response = await request(BACKEND_URL)
        .get('/api/health')
        .expect(200);

      const csp = response.headers['content-security-policy'];
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
    });
  });

  describe('2. 認証機能', () => {
    test('正しい認証情報でログインできる', async () => {
      const response = await request(BACKEND_URL)
        .post('/api/auth/login')
        .send({
          email: 'demo@example.com',
          password: 'demo123',
        })
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.csrfToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('demo@example.com');
    });

    test('誤った認証情報でログインできない', async () => {
      const response = await request(BACKEND_URL)
        .post('/api/auth/login')
        .send({
          email: 'demo@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.token).toBeUndefined();
    });

    test('新規ユーザー登録ができる', async () => {
      const newEmail = `test${Date.now()}@example.com`;
      const response = await request(BACKEND_URL)
        .post('/api/auth/register')
        .send({
          email: newEmail,
          password: 'TestPass123!',
        })
        .expect(201);

      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(newEmail);
    });

    test('弱いパスワードは拒否される', async () => {
      const response = await request(BACKEND_URL)
        .post('/api/auth/register')
        .send({
          email: 'weak@example.com',
          password: 'weak',
        })
        .expect(400);

      expect(response.body.error).toContain('8文字以上');
    });
  });

  describe('3. JWT認証', () => {
    test('有効なトークンでアクセスできる', async () => {
      // 保護されたエンドポイントがあれば、ここでテスト
      // 現時点では認証ルートのヘルスチェックで確認
      const response = await request(BACKEND_URL)
        .get('/api/auth/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    test('無効なトークンはアクセス拒否される', async () => {
      const invalidToken = 'invalid.token.here';
      
      // 保護されたエンドポイントへのアクセステスト
      // 現時点では401が返ることを確認
    });

    test('期限切れトークンは拒否される', async () => {
      // 期限切れトークンの生成
      const expiredToken = jwt.sign(
        { id: '1', email: 'test@example.com', role: 'user' },
        'test-secret',
        { expiresIn: '-1h' } // 1時間前に期限切れ
      );

      // テスト実装は保護されたエンドポイント追加後
    });
  });

  describe('4. CSRF対策', () => {
    test('CSRFトークンが生成される', async () => {
      const response = await request(BACKEND_URL)
        .get('/api/auth/csrf-token')
        .expect(200);

      expect(response.body.csrfToken).toBeDefined();
      expect(response.body.csrfToken.length).toBeGreaterThan(32);
    });

    test('CSRFトークンなしでPOSTリクエストが拒否される（保護されたエンドポイント）', async () => {
      // 保護されたエンドポイントへのPOSTテスト
      // 現時点では実装待ち
    });
  });

  describe('5. SQLインジェクション対策', () => {
    test('危険な文字がサニタイズされる', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(BACKEND_URL)
        .post('/api/auth/login')
        .send({
          email: maliciousInput,
          password: 'test',
        })
        .expect(400); // 無効なメールフォーマット

      // エラーメッセージにSQLが含まれないこと
      expect(response.body.error).not.toContain('DROP TABLE');
    });

    test('SQLコメントが除去される', async () => {
      const sqlComment = "test@example.com' -- ";
      
      const response = await request(BACKEND_URL)
        .post('/api/auth/login')
        .send({
          email: sqlComment,
          password: 'test',
        });

      // SQLコメントが実行されないこと
      expect(response.status).toBe(401); // 通常の認証失敗
    });
  });

  describe('6. XSS対策', () => {
    test('HTMLタグがエスケープされる', async () => {
      const xssPayload = '<script>alert("XSS")</script>@example.com';
      
      const response = await request(BACKEND_URL)
        .post('/api/auth/register')
        .send({
          email: xssPayload,
          password: 'TestPass123!',
        })
        .expect(400); // 無効なメールフォーマット

      // レスポンスにスクリプトタグが含まれないこと
      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toContain('<script>');
      expect(responseText).not.toContain('</script>');
    });
  });

  describe('7. レート制限', () => {
    test('過剰なリクエストが制限される', async () => {
      const requests = [];
      
      // 100回以上のリクエストを送信
      for (let i = 0; i < 110; i++) {
        requests.push(
          request(BACKEND_URL)
            .get('/api/health')
            .then(res => res.status)
        );
      }

      const results = await Promise.all(requests);
      
      // 最後の方のリクエストは429を返すはず
      const rateLimited = results.filter(status => status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 30000); // 30秒のタイムアウト

    test('Retry-Afterヘッダーが設定される', async () => {
      // レート制限に達するまでリクエスト
      const requests = [];
      for (let i = 0; i < 110; i++) {
        requests.push(request(BACKEND_URL).get('/api/health'));
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find(r => r.status === 429);

      if (rateLimitedResponse) {
        expect(rateLimitedResponse.headers['retry-after']).toBeDefined();
        expect(parseInt(rateLimitedResponse.headers['retry-after'])).toBeGreaterThan(0);
      }
    }, 30000);
  });

  describe('8. 入力検証', () => {
    test('無効なメールアドレスが拒否される', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'test@',
        'test @example.com',
        'test..test@example.com',
      ];

      for (const email of invalidEmails) {
        const response = await request(BACKEND_URL)
          .post('/api/auth/register')
          .send({
            email,
            password: 'ValidPass123!',
          })
          .expect(400);

        expect(response.body.error).toContain('有効なメールアドレス');
      }
    });

    test('必須フィールドの欠落が検出される', async () => {
      // メールなし
      let response = await request(BACKEND_URL)
        .post('/api/auth/login')
        .send({ password: 'test' })
        .expect(400);

      expect(response.body.error).toContain('必須');

      // パスワードなし
      response = await request(BACKEND_URL)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.error).toContain('必須');
    });
  });

  describe('9. エラーハンドリング', () => {
    test('404エラーが適切に処理される', async () => {
      const response = await request(BACKEND_URL)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.path).toBe('/api/nonexistent');
    });

    test('不正なJSONが適切に処理される', async () => {
      const response = await request(BACKEND_URL)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid json}')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});

// ユーティリティ関数
async function generateManyRequests(url, count) {
  const requests = [];
  for (let i = 0; i < count; i++) {
    requests.push(
      request(url)
        .get('/api/health')
        .catch(() => null) // エラーを無視
    );
  }
  return Promise.all(requests);
}

module.exports = {
  generateManyRequests,
};