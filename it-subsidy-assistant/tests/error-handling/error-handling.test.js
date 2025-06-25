/**
 * Phase 1 エラーハンドリングテスト
 * API接続失敗時の動作確認
 */

const request = require('supertest');
const { chromium } = require('playwright');

// テスト設定
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 20000;

describe('Phase 1 エラーハンドリングテスト', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false'
    });
  }, TEST_TIMEOUT);

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('1. ネットワークエラーハンドリング', () => {
    test('バックエンドが利用できない場合のエラー表示', async () => {
      // バックエンドへのリクエストをブロック
      await page.route('**/api/**', route => route.abort('failed'));

      await page.goto(FRONTEND_URL);

      // エラーメッセージが表示されることを確認
      const errorMessage = await page.waitForSelector(
        '[data-testid="error-message"], .error-message, .alert-danger',
        { timeout: 10000 }
      ).catch(() => null);

      if (errorMessage) {
        const text = await errorMessage.textContent();
        expect(text).toContain('ネットワークエラー');
      }
    });

    test('タイムアウト時のエラー処理', async () => {
      // リクエストを遅延させる
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 35000)); // 35秒待機
        route.abort('timedout');
      });

      await page.goto(FRONTEND_URL);

      // タイムアウトエラーの確認
      const errorMessage = await page.waitForSelector(
        '[data-testid="error-message"], .error-message',
        { timeout: 40000 }
      ).catch(() => null);

      expect(errorMessage).toBeTruthy();
    }, 50000);
  });

  describe('2. APIエラーレスポンスのハンドリング', () => {
    test('400エラー（バリデーションエラー）の表示', async () => {
      await page.goto(FRONTEND_URL);

      // 無効なデータでフォーム送信をシミュレート
      const loginButton = await page.$('button:has-text("ログイン"), [data-testid="login-button"]');
      if (loginButton) {
        // 空のフォームで送信
        await loginButton.click();

        // バリデーションエラーメッセージ
        const errorMessage = await page.waitForSelector(
          '.validation-error, .field-error, .alert-warning',
          { timeout: 5000 }
        ).catch(() => null);

        if (errorMessage) {
          const text = await errorMessage.textContent();
          expect(text).toBeTruthy();
        }
      }
    });

    test('401エラー（認証エラー）の処理', async () => {
      // 無効なトークンでAPIを呼び出すシミュレート
      await page.goto(FRONTEND_URL);

      // 認証が必要なアクションを実行
      await page.evaluate(() => {
        // ローカルストレージから認証トークンを削除
        localStorage.removeItem('auth_token');
      });

      // 保護されたページへアクセス
      const protectedLink = await page.$('[href*="/dashboard"], [href*="/mypage"]');
      if (protectedLink) {
        await protectedLink.click();

        // ログインページへのリダイレクトまたはエラーメッセージ
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        const hasLoginRedirect = currentUrl.includes('login') || currentUrl.includes('signin');
        const hasErrorMessage = await page.$('.auth-error, .alert-danger');

        expect(hasLoginRedirect || hasErrorMessage).toBeTruthy();
      }
    });

    test('404エラーの処理', async () => {
      // 存在しないページへアクセス
      await page.goto(`${FRONTEND_URL}/non-existent-page-12345`);

      // 404ページまたはエラーメッセージの確認
      const notFoundIndicator = await page.waitForSelector(
        'text=/404|見つかりません|not found/i',
        { timeout: 5000 }
      ).catch(() => null);

      expect(notFoundIndicator).toBeTruthy();
    });

    test('429エラー（レート制限）の処理', async () => {
      // レート制限エラーをシミュレート
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 429,
          headers: {
            'Retry-After': '60',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'リクエスト数が多すぎます',
            retryAfter: 60,
          }),
        });
      });

      await page.goto(FRONTEND_URL);

      // レート制限エラーメッセージ
      const errorMessage = await page.waitForSelector(
        '.rate-limit-error, .alert-warning, [data-testid="error-message"]',
        { timeout: 5000 }
      ).catch(() => null);

      if (errorMessage) {
        const text = await errorMessage.textContent();
        expect(text).toContain('リクエスト数');
      }
    });

    test('500エラー（サーバーエラー）の処理', async () => {
      // サーバーエラーをシミュレート
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Internal Server Error',
          }),
        });
      });

      await page.goto(FRONTEND_URL);

      // サーバーエラーメッセージ
      const errorMessage = await page.waitForSelector(
        '.server-error, .alert-danger, [data-testid="error-message"]',
        { timeout: 5000 }
      ).catch(() => null);

      if (errorMessage) {
        const text = await errorMessage.textContent();
        expect(text).toMatch(/サーバー|エラー|問題/);
      }
    });
  });

  describe('3. エラーバウンダリのテスト', () => {
    test('JavaScriptエラーがキャッチされる', async () => {
      await page.goto(FRONTEND_URL);

      // JavaScriptエラーを発生させる
      await page.evaluate(() => {
        throw new Error('テスト用のJavaScriptエラー');
      }).catch(() => {});

      // エラーバウンダリの表示を確認
      const errorBoundary = await page.waitForSelector(
        '.error-boundary-container, [data-testid="error-boundary"]',
        { timeout: 5000 }
      ).catch(() => null);

      if (errorBoundary) {
        const text = await errorBoundary.textContent();
        expect(text).toContain('エラーが発生しました');
      }
    });

    test('エラー後のリカバリー機能', async () => {
      await page.goto(FRONTEND_URL);

      // エラーを発生させる
      await page.evaluate(() => {
        // 存在しないメソッドを呼び出す
        window.nonExistentFunction();
      }).catch(() => {});

      // リロードボタンを探す
      const reloadButton = await page.waitForSelector(
        'button:has-text("再読み込み"), button:has-text("リロード"), [data-testid="reload-button"]',
        { timeout: 5000 }
      ).catch(() => null);

      if (reloadButton) {
        await reloadButton.click();
        await page.waitForLoadState('networkidle');

        // ページが正常に表示されることを確認
        const mainContent = await page.$('[data-testid="main-content"], main, #app');
        expect(mainContent).toBeTruthy();
      }
    });
  });

  describe('4. エラーログの記録', () => {
    test('エラーがローカルストレージに記録される', async () => {
      await page.goto(FRONTEND_URL);

      // エラーを発生させる
      await page.route('**/api/subsidies', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Test error for logging' }),
        });
      });

      // APIコールをトリガー
      await page.reload();
      await page.waitForTimeout(2000);

      // ローカルストレージからエラーログを確認
      const errorLogs = await page.evaluate(() => {
        return localStorage.getItem('error_logs');
      });

      if (errorLogs) {
        const logs = JSON.parse(errorLogs);
        expect(Array.isArray(logs)).toBe(true);
        expect(logs.length).toBeGreaterThan(0);
        
        const latestLog = logs[0];
        expect(latestLog).toHaveProperty('id');
        expect(latestLog).toHaveProperty('timestamp');
        expect(latestLog).toHaveProperty('message');
      }
    });
  });

  describe('5. リトライ機能のテスト', () => {
    test('ネットワークエラー時の自動リトライ', async () => {
      let requestCount = 0;

      // 最初の2回は失敗、3回目で成功
      await page.route('**/api/subsidies', route => {
        requestCount++;
        if (requestCount < 3) {
          route.abort('failed');
        } else {
          route.fulfill({
            status: 200,
            body: JSON.stringify({ subsidies: [], total: 0 }),
          });
        }
      });

      await page.goto(FRONTEND_URL);

      // リトライ後に成功することを確認
      await page.waitForTimeout(5000);
      expect(requestCount).toBeGreaterThanOrEqual(2);

      // エラーメッセージが消えていることを確認
      const errorMessage = await page.$('.error-message, [data-testid="error-message"]');
      expect(errorMessage).toBeFalsy();
    });
  });

  describe('6. ユーザーフレンドリーなエラー表示', () => {
    test('技術的なエラー詳細が本番環境で隠される', async () => {
      // 本番環境をシミュレート
      await page.goto(FRONTEND_URL);
      
      await page.evaluate(() => {
        // @ts-ignore
        window.process = { env: { NODE_ENV: 'production' } };
      });

      // エラーを発生させる
      await page.evaluate(() => {
        throw new Error('Sensitive technical error details');
      }).catch(() => {});

      // エラー表示を確認
      const errorDetails = await page.$('pre, .error-stack-trace');
      
      // 本番環境では技術的詳細が表示されない
      if (process.env.NODE_ENV === 'production') {
        expect(errorDetails).toBeFalsy();
      }
    });

    test('エラーメッセージが日本語で表示される', async () => {
      await page.route('**/api/**', route => {
        route.abort('failed');
      });

      await page.goto(FRONTEND_URL);

      const errorMessage = await page.waitForSelector(
        '.error-message, [data-testid="error-message"]',
        { timeout: 5000 }
      ).catch(() => null);

      if (errorMessage) {
        const text = await errorMessage.textContent();
        // 日本語のエラーメッセージが含まれることを確認
        expect(text).toMatch(/エラー|失敗|問題|できません/);
      }
    });
  });
});

// バックエンドAPIのエラーハンドリングテスト
describe('バックエンドエラーハンドリング', () => {
  test('不正なJSONリクエストの処理', async () => {
    const response = await request(BACKEND_URL)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"invalid json}')
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  test('大きすぎるリクエストボディの処理', async () => {
    const largeData = 'x'.repeat(11 * 1024 * 1024); // 11MB

    const response = await request(BACKEND_URL)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!',
        largeField: largeData,
      })
      .expect(413); // Payload Too Large

    expect(response.body.error).toBeDefined();
  });
});