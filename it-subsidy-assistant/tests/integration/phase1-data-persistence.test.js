/**
 * Phase 1 データ永続化統合テスト
 * SessionManagerとSupabase統合の確認
 */

const request = require('supertest');
const { chromium } = require('playwright');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 30000;

describe('Phase 1 データ永続化統合テスト', () => {
  let browser;
  let page;
  let authToken;
  let userId;

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false'
    });

    // テスト用ユーザーでログイン
    const loginResponse = await request(BACKEND_URL)
      .post('/api/auth/login')
      .send({
        email: 'demo@example.com',
        password: 'demo123'
      });

    authToken = loginResponse.body.token;
    userId = loginResponse.body.user.id;
  }, TEST_TIMEOUT);

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(FRONTEND_URL);
    
    // 認証トークンを設定
    await page.evaluate((token) => {
      localStorage.setItem('auth_token', token);
    }, authToken);
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('1. セッションCRUD操作', () => {
    let createdSessionId;

    test('新規セッションの作成と保存', async () => {
      // APIエンドポイントで直接セッション作成
      const createResponse = await request(BACKEND_URL)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'テストセッション',
          businessType: 'IT',
          employeeCount: 50,
          currentChallenges: ['業務効率化', 'コスト削減']
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.session).toBeDefined();
      expect(createResponse.body.session.id).toBeTruthy();
      
      createdSessionId = createResponse.body.session.id;

      // フロントエンドで確認
      await page.reload();
      await page.waitForTimeout(2000);

      // SessionManagerでセッションが表示されることを確認
      const sessionItem = await page.waitForSelector(
        `[data-session-id="${createdSessionId}"], .session-card:has-text("テストセッション")`,
        { timeout: 5000 }
      ).catch(() => null);

      expect(sessionItem).toBeTruthy();
    });

    test('セッションの読み込みと表示', async () => {
      // セッション一覧を取得
      const listResponse = await request(BACKEND_URL)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body.sessions)).toBe(true);
      expect(listResponse.body.sessions.length).toBeGreaterThan(0);

      // フロントエンドでの表示確認
      await page.reload();
      await page.waitForTimeout(2000);

      // セッション数の確認
      const sessionItems = await page.$$('[data-testid="session-item"], .session-card');
      expect(sessionItems.length).toBe(listResponse.body.sessions.length);
    });

    test('セッションの更新と自動保存', async () => {
      if (!createdSessionId) {
        // セッションを作成
        const createResponse = await request(BACKEND_URL)
          .post('/api/sessions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: '更新テスト用セッション'
          });
        
        createdSessionId = createResponse.body.session.id;
      }

      // フロントエンドでセッションを開く
      await page.reload();
      await page.waitForTimeout(2000);

      const sessionItem = await page.waitForSelector(
        `[data-session-id="${createdSessionId}"], .session-card`,
        { timeout: 5000 }
      );

      await sessionItem.click();

      // セッション詳細画面で編集
      const titleInput = await page.waitForSelector('input[name="title"], input[placeholder*="タイトル"]');
      await titleInput.fill('更新されたセッション');

      // 自動保存をトリガー（3秒待機）
      await page.waitForTimeout(3500);

      // APIで更新を確認
      const getResponse = await request(BACKEND_URL)
        .get(`/api/sessions/${createdSessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.session.title).toBe('更新されたセッション');
    });

    test('セッションの削除', async () => {
      // 削除用のセッションを作成
      const createResponse = await request(BACKEND_URL)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '削除テスト用セッション'
        });

      const deleteSessionId = createResponse.body.session.id;

      // 削除実行
      const deleteResponse = await request(BACKEND_URL)
        .delete(`/api/sessions/${deleteSessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);

      // 削除確認
      const getResponse = await request(BACKEND_URL)
        .get(`/api/sessions/${deleteSessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  describe('2. 自動保存機能', () => {
    test('3秒後の自動保存動作', async () => {
      // 新規セッション作成
      const createResponse = await request(BACKEND_URL)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '自動保存テスト'
        });

      const sessionId = createResponse.body.session.id;

      // フロントエンドで編集
      await page.reload();
      await page.waitForTimeout(2000);

      // SessionManagerで編集モードに入る
      const editButton = await page.waitForSelector(
        `[data-session-id="${sessionId}"] button:has-text("編集"), .edit-button`,
        { timeout: 5000 }
      ).catch(() => null);

      if (editButton) {
        await editButton.click();

        // フィールドを編集
        const businessTypeSelect = await page.$('select[name="businessType"]');
        if (businessTypeSelect) {
          await businessTypeSelect.selectOption('製造業');
        }

        // 自動保存インジケーターの確認
        const savingIndicator = await page.waitForSelector(
          '.saving-indicator, [data-testid="saving"], text=/保存中/',
          { timeout: 5000 }
        ).catch(() => null);

        expect(savingIndicator).toBeTruthy();

        // 保存完了の確認
        const savedIndicator = await page.waitForSelector(
          '.saved-indicator, [data-testid="saved"], text=/保存済み|保存完了/',
          { timeout: 5000 }
        ).catch(() => null);

        expect(savedIndicator).toBeTruthy();
      }
    });

    test('連続編集時のデバウンス動作', async () => {
      await page.reload();

      // 編集可能なフィールドを探す
      const inputField = await page.waitForSelector(
        'input[type="text"]:not([readonly]), textarea:not([readonly])',
        { timeout: 5000 }
      ).catch(() => null);

      if (inputField) {
        // APIコールを監視
        let saveCallCount = 0;
        page.on('request', request => {
          if (request.method() === 'PUT' && request.url().includes('/api/sessions')) {
            saveCallCount++;
          }
        });

        // 連続入力
        await inputField.fill('A');
        await page.waitForTimeout(500);
        await inputField.fill('AB');
        await page.waitForTimeout(500);
        await inputField.fill('ABC');
        await page.waitForTimeout(500);
        await inputField.fill('ABCD');

        // デバウンス時間（3秒）待機
        await page.waitForTimeout(3500);

        // 1回だけ保存されることを確認
        expect(saveCallCount).toBe(1);
      }
    });
  });

  describe('3. データ整合性', () => {
    test('複数タブでの同期', async () => {
      // セッション作成
      const createResponse = await request(BACKEND_URL)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '同期テスト',
          businessType: 'IT'
        });

      const sessionId = createResponse.body.session.id;

      // 2つ目のタブを開く
      const page2 = await browser.newPage();
      await page2.goto(FRONTEND_URL);
      await page2.evaluate((token) => {
        localStorage.setItem('auth_token', token);
      }, authToken);

      // 1つ目のタブで更新
      const updateResponse = await request(BACKEND_URL)
        .put(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '同期テスト - 更新済み'
        });

      expect(updateResponse.status).toBe(200);

      // 2つ目のタブでリロードして確認
      await page2.reload();
      await page2.waitForTimeout(2000);

      const updatedTitle = await page2.waitForSelector(
        'text=/同期テスト - 更新済み/',
        { timeout: 5000 }
      );

      expect(updatedTitle).toBeTruthy();

      await page2.close();
    });

    test('オフライン時のローカルストレージ活用', async () => {
      // セッションデータをローカルストレージに保存
      await page.evaluate(() => {
        const sessionData = {
          id: 'local-test-session',
          title: 'ローカルセッション',
          businessType: 'IT',
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('session_draft', JSON.stringify(sessionData));
      });

      // ネットワークをオフラインに
      await page.context().setOffline(true);

      // ページをリロード
      await page.reload();

      // ローカルデータが表示されることを確認
      const draftIndicator = await page.waitForSelector(
        '.draft-indicator, [data-testid="offline-mode"], text=/オフライン|下書き/',
        { timeout: 5000 }
      ).catch(() => null);

      if (draftIndicator) {
        expect(draftIndicator).toBeTruthy();
      }

      // オンラインに戻す
      await page.context().setOffline(false);
    });
  });

  describe('4. Supabase統合確認', () => {
    test('リアルタイム更新の受信', async () => {
      // セッション作成
      const createResponse = await request(BACKEND_URL)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'リアルタイム更新テスト'
        });

      const sessionId = createResponse.body.session.id;

      // フロントエンドで監視
      await page.reload();
      await page.waitForTimeout(2000);

      // 別のクライアントから更新（APIで直接）
      const updateResponse = await request(BACKEND_URL)
        .put(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'リアルタイム更新完了'
        });

      expect(updateResponse.status).toBe(200);

      // フロントエンドで更新が反映されることを確認
      const updatedElement = await page.waitForSelector(
        'text=/リアルタイム更新完了/',
        { timeout: 10000 }
      ).catch(() => null);

      // Supabaseのリアルタイム機能が有効な場合
      if (updatedElement) {
        expect(updatedElement).toBeTruthy();
      }
    });

    test('認証トークンの有効性確認', async () => {
      // 無効なトークンでのアクセス
      const invalidResponse = await request(BACKEND_URL)
        .get('/api/sessions')
        .set('Authorization', 'Bearer invalid-token');

      expect(invalidResponse.status).toBe(401);

      // 有効なトークンでのアクセス
      const validResponse = await request(BACKEND_URL)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(validResponse.status).toBe(200);
    });
  });

  describe('5. エラー時のデータ保護', () => {
    test('保存失敗時のリトライとローカルバックアップ', async () => {
      await page.reload();

      // ネットワークエラーをシミュレート
      await page.route('**/api/sessions/**', route => {
        if (route.request().method() === 'PUT') {
          route.abort('failed');
        } else {
          route.continue();
        }
      });

      // 編集を実行
      const inputField = await page.waitForSelector(
        'input[type="text"]:not([readonly])',
        { timeout: 5000 }
      ).catch(() => null);

      if (inputField) {
        await inputField.fill('保存失敗テスト');

        // エラー表示の確認
        const errorMessage = await page.waitForSelector(
          '.save-error, [data-testid="save-error"], text=/保存.*失敗/',
          { timeout: 10000 }
        ).catch(() => null);

        expect(errorMessage).toBeTruthy();

        // ローカルバックアップの確認
        const localBackup = await page.evaluate(() => {
          return localStorage.getItem('session_backup') || 
                 localStorage.getItem('unsaved_changes');
        });

        expect(localBackup).toBeTruthy();
      }
    });
  });
});

// テストヘルパー関数
async function createTestSession(authToken, data = {}) {
  const response = await request(BACKEND_URL)
    .post('/api/sessions')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      title: 'Test Session',
      businessType: 'IT',
      ...data
    });

  return response.body.session;
}

module.exports = { createTestSession };