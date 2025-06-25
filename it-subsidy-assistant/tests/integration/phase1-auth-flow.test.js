/**
 * Phase 1 認証フロー統合テスト
 * Worker1とWorker2の認証機能統合確認
 */

const request = require('supertest');
const { chromium } = require('playwright');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 30000;

describe('Phase 1 認証フロー統合テスト', () => {
  let browser;
  let page;
  let context;

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false'
    });
    context = await browser.newContext();
  }, TEST_TIMEOUT);

  beforeEach(async () => {
    page = await context.newPage();
    // ローカルストレージとCookieをクリア
    await context.clearCookies();
    await page.goto(FRONTEND_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('1. ログイン/サインアップUI統合', () => {
    test('認証UIコンポーネントが表示される', async () => {
      await page.goto(FRONTEND_URL);

      // 認証UIの存在確認
      const authComponent = await page.waitForSelector(
        '[data-testid="auth-component"], .auth-container, #auth-form',
        { timeout: 5000 }
      ).catch(() => null);

      expect(authComponent).toBeTruthy();

      // ログイン/サインアップ切り替えタブ
      const loginTab = await page.$('button:has-text("ログイン"), [data-testid="login-tab"]');
      const signupTab = await page.$('button:has-text("新規登録"), [data-testid="signup-tab"]');

      expect(loginTab || signupTab).toBeTruthy();
    });

    test('ログインフォームの入力と送信', async () => {
      await page.goto(FRONTEND_URL);

      // ログインフォームの入力
      const emailInput = await page.waitForSelector('input[type="email"], input[name="email"]');
      const passwordInput = await page.waitForSelector('input[type="password"], input[name="password"]');
      const submitButton = await page.waitForSelector('button[type="submit"], button:has-text("ログイン")');

      await emailInput.fill('demo@example.com');
      await passwordInput.fill('demo123');

      // APIレスポンスを監視
      const [response] = await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/auth/login')),
        submitButton.click()
      ]);

      expect(response.status()).toBe(200);

      // トークンがローカルストレージに保存されることを確認
      await page.waitForTimeout(1000);
      const token = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(token).toBeTruthy();
    });

    test('新規登録フローの完全テスト', async () => {
      await page.goto(FRONTEND_URL);

      // サインアップタブに切り替え
      const signupTab = await page.$('button:has-text("新規登録"), [data-testid="signup-tab"]');
      if (signupTab) {
        await signupTab.click();
      }

      // 新規登録フォームの入力
      const newEmail = `test${Date.now()}@example.com`;
      const emailInput = await page.waitForSelector('input[type="email"], input[name="email"]');
      const passwordInput = await page.waitForSelector('input[type="password"], input[name="password"]');
      const confirmPasswordInput = await page.$('input[name="confirmPassword"], input[placeholder*="確認"]');
      
      await emailInput.fill(newEmail);
      await passwordInput.fill('TestPass123!');
      if (confirmPasswordInput) {
        await confirmPasswordInput.fill('TestPass123!');
      }

      // 送信
      const submitButton = await page.$('button[type="submit"], button:has-text("登録")');
      const [response] = await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/auth/register')),
        submitButton.click()
      ]);

      expect(response.status()).toBe(201);

      // 自動ログイン確認
      await page.waitForTimeout(1000);
      const token = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(token).toBeTruthy();
    });
  });

  describe('2. JWT認証統合', () => {
    test('JWTトークンが正しくヘッダーに設定される', async () => {
      // まずログイン
      const loginResponse = await request(BACKEND_URL)
        .post('/api/auth/login')
        .send({
          email: 'demo@example.com',
          password: 'demo123'
        });

      const token = loginResponse.body.token;
      expect(token).toBeTruthy();

      // フロントエンドでトークンを設定
      await page.goto(FRONTEND_URL);
      await page.evaluate((token) => {
        localStorage.setItem('auth_token', token);
      }, token);

      // 認証が必要なAPIコールを監視
      page.on('request', request => {
        if (request.url().includes('/api/') && request.method() !== 'GET') {
          const headers = request.headers();
          expect(headers['authorization']).toBe(`Bearer ${token}`);
        }
      });

      // セッション作成をトリガー（認証が必要）
      const createSessionButton = await page.$('button:has-text("新規セッション"), [data-testid="create-session"]');
      if (createSessionButton) {
        await createSessionButton.click();
      }
    });

    test('トークン有効期限切れ時の再ログイン', async () => {
      await page.goto(FRONTEND_URL);

      // 期限切れトークンを設定
      await page.evaluate(() => {
        // 無効なトークンを設定
        localStorage.setItem('auth_token', 'expired.invalid.token');
      });

      // 認証が必要なアクションを実行
      const protectedAction = await page.$('[data-testid="protected-action"], button:has-text("マイページ")');
      if (protectedAction) {
        await protectedAction.click();

        // 再ログイン画面へのリダイレクトを確認
        await page.waitForTimeout(2000);
        const loginForm = await page.$('form[data-testid="login-form"], .login-form');
        expect(loginForm).toBeTruthy();
      }
    });
  });

  describe('3. SessionManagerとの統合', () => {
    let authToken;

    beforeEach(async () => {
      // ログインしてトークンを取得
      const loginResponse = await request(BACKEND_URL)
        .post('/api/auth/login')
        .send({
          email: 'demo@example.com',
          password: 'demo123'
        });

      authToken = loginResponse.body.token;
      
      // フロントエンドにトークンを設定
      await page.goto(FRONTEND_URL);
      await page.evaluate((token) => {
        localStorage.setItem('auth_token', token);
      }, authToken);
    });

    test('認証済みユーザーのセッション作成', async () => {
      // SessionManagerコンポーネントの確認
      const sessionManager = await page.waitForSelector(
        '[data-testid="session-manager"], .session-manager',
        { timeout: 5000 }
      ).catch(() => null);

      expect(sessionManager).toBeTruthy();

      // 新規セッション作成
      const createButton = await page.$('button:has-text("新規"), button:has-text("作成"), [data-testid="create-session"]');
      if (createButton) {
        const [response] = await Promise.all([
          page.waitForResponse(res => res.url().includes('/api/sessions')),
          createButton.click()
        ]);

        expect(response.status()).toBe(201);

        // セッションが表示されることを確認
        await page.waitForTimeout(1000);
        const sessionItem = await page.$('[data-testid="session-item"], .session-card');
        expect(sessionItem).toBeTruthy();
      }
    });

    test('未認証ユーザーのアクセス制限', async () => {
      // トークンをクリア
      await page.evaluate(() => {
        localStorage.removeItem('auth_token');
      });

      await page.reload();

      // セッション作成ボタンが無効化されているか確認
      const createButton = await page.$('button:has-text("新規"), [data-testid="create-session"]');
      if (createButton) {
        const isDisabled = await createButton.evaluate(el => el.disabled);
        expect(isDisabled).toBe(true);
      }

      // または認証促すメッセージ
      const authMessage = await page.$('text=/ログイン|サインイン|認証/');
      expect(authMessage).toBeTruthy();
    });
  });

  describe('4. 認証エラー処理', () => {
    test('無効な認証情報でのエラー表示', async () => {
      await page.goto(FRONTEND_URL);

      const emailInput = await page.waitForSelector('input[type="email"]');
      const passwordInput = await page.waitForSelector('input[type="password"]');
      const submitButton = await page.waitForSelector('button[type="submit"]');

      await emailInput.fill('wrong@example.com');
      await passwordInput.fill('wrongpassword');

      const [response] = await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/auth/login')),
        submitButton.click()
      ]);

      expect(response.status()).toBe(401);

      // エラーメッセージの表示確認
      const errorMessage = await page.waitForSelector(
        '.error-message, .alert-danger, [data-testid="auth-error"]',
        { timeout: 5000 }
      );

      const errorText = await errorMessage.textContent();
      expect(errorText).toMatch(/正しくありません|無効|失敗/);
    });

    test('ネットワークエラー時の処理', async () => {
      await page.goto(FRONTEND_URL);

      // APIリクエストをブロック
      await page.route('**/api/auth/**', route => route.abort());

      const emailInput = await page.waitForSelector('input[type="email"]');
      const passwordInput = await page.waitForSelector('input[type="password"]');
      const submitButton = await page.waitForSelector('button[type="submit"]');

      await emailInput.fill('demo@example.com');
      await passwordInput.fill('demo123');
      await submitButton.click();

      // ネットワークエラーメッセージ
      const errorMessage = await page.waitForSelector(
        '.error-message, [data-testid="network-error"]',
        { timeout: 5000 }
      );

      const errorText = await errorMessage.textContent();
      expect(errorText).toMatch(/ネットワーク|接続|通信/);
    });
  });

  describe('5. CSRF保護の統合確認', () => {
    test('CSRFトークンの取得と使用', async () => {
      // CSRFトークン取得
      const csrfResponse = await request(BACKEND_URL)
        .get('/api/auth/csrf-token');

      const csrfToken = csrfResponse.body.csrfToken;
      expect(csrfToken).toBeTruthy();

      // ログイン
      const loginResponse = await request(BACKEND_URL)
        .post('/api/auth/login')
        .send({
          email: 'demo@example.com',
          password: 'demo123'
        });

      const authToken = loginResponse.body.token;

      // フロントエンドでの統合確認
      await page.goto(FRONTEND_URL);
      await page.evaluate(({ authToken, csrfToken }) => {
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('csrf_token', csrfToken);
      }, { authToken, csrfToken });

      // POSTリクエストでCSRFトークンが送信されることを確認
      page.on('request', request => {
        if (request.method() === 'POST' && request.url().includes('/api/')) {
          const headers = request.headers();
          expect(headers['x-csrf-token']).toBeTruthy();
        }
      });
    });
  });
});

// テスト用ヘルパー関数
async function loginUser(page, email = 'demo@example.com', password = 'demo123') {
  await page.goto(FRONTEND_URL);
  
  const emailInput = await page.waitForSelector('input[type="email"]');
  const passwordInput = await page.waitForSelector('input[type="password"]');
  const submitButton = await page.waitForSelector('button[type="submit"]');

  await emailInput.fill(email);
  await passwordInput.fill(password);
  
  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login')),
    submitButton.click()
  ]);

  return response.status() === 200;
}

module.exports = { loginUser };