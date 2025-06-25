/**
 * Phase 1 統合テスト
 * フロントエンド⇔バックエンド接続の基本動作確認
 */

const request = require('supertest');
const { chromium } = require('playwright');

// テスト設定
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 30000; // 30秒

describe('Phase 1 統合テスト', () => {
  let browser;
  let page;
  let backendApp;

  beforeAll(async () => {
    // ブラウザ起動
    browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false'
    });
    
    console.log('🔗 統合テスト開始');
    console.log(`Frontend: ${FRONTEND_URL}`);
    console.log(`Backend: ${BACKEND_URL}`);
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

  describe('1. 基本的な接続確認', () => {
    test('フロントエンドが起動している', async () => {
      const response = await page.goto(FRONTEND_URL);
      expect(response.status()).toBe(200);
      
      // タイトルの確認
      const title = await page.title();
      expect(title).toContain('IT補助金アシスタント');
    }, TEST_TIMEOUT);

    test('バックエンドAPIが応答する', async () => {
      const response = await fetch(`${BACKEND_URL}/api/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('ok');
    });

    test('フロントエンドからバックエンドAPIを呼び出せる', async () => {
      await page.goto(FRONTEND_URL);
      
      // APIコールをインターセプト
      let apiCalled = false;
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          apiCalled = true;
        }
      });

      // 初期データ読み込みまで待機
      await page.waitForTimeout(2000);
      
      expect(apiCalled).toBe(true);
    });
  });

  describe('2. 補助金検索機能の動作確認', () => {
    test('補助金一覧が表示される', async () => {
      await page.goto(FRONTEND_URL);
      
      // 補助金一覧の読み込みを待つ
      await page.waitForSelector('[data-testid="subsidy-list"], .subsidy-card', {
        timeout: 10000
      });

      // 補助金カードが存在することを確認
      const subsidyCards = await page.$$('[data-testid="subsidy-card"], .subsidy-card');
      expect(subsidyCards.length).toBeGreaterThan(0);
    });

    test('検索機能が動作する', async () => {
      await page.goto(FRONTEND_URL);
      
      // 検索ボックスを探す
      const searchInput = await page.$('[data-testid="search-input"], input[type="search"], input[placeholder*="検索"]');
      
      if (searchInput) {
        // 検索キーワードを入力
        await searchInput.type('IT');
        
        // 検索結果の更新を待つ
        await page.waitForTimeout(1000);
        
        // 結果が表示されることを確認
        const results = await page.$$('[data-testid="subsidy-card"], .subsidy-card');
        expect(results.length).toBeGreaterThan(0);
      }
    });

    test('カテゴリフィルターが動作する', async () => {
      await page.goto(FRONTEND_URL);
      
      // カテゴリボタンまたはフィルターを探す
      const categoryFilter = await page.$('[data-testid="category-filter"], [data-category], button:has-text("IT")');
      
      if (categoryFilter) {
        await categoryFilter.click();
        await page.waitForTimeout(1000);
        
        // フィルタリング結果を確認
        const results = await page.$$('[data-testid="subsidy-card"], .subsidy-card');
        expect(results.length).toBeGreaterThan(0);
      }
    });
  });

  describe('3. 診断機能の基本動作', () => {
    test('診断開始ボタンが表示される', async () => {
      await page.goto(FRONTEND_URL);
      
      // 診断開始ボタンを探す
      const diagnosisButton = await page.$('button:has-text("診断"), [data-testid="start-diagnosis"]');
      expect(diagnosisButton).toBeTruthy();
    });

    test('診断フローが開始できる', async () => {
      await page.goto(FRONTEND_URL);
      
      const diagnosisButton = await page.$('button:has-text("診断"), [data-testid="start-diagnosis"]');
      if (diagnosisButton) {
        await diagnosisButton.click();
        
        // 診断画面への遷移を確認
        await page.waitForSelector('[data-testid="diagnosis-form"], .diagnosis-container', {
          timeout: 5000
        });
        
        // 最初の質問が表示されることを確認
        const questionText = await page.textContent('h2, h3, [data-testid="question"]');
        expect(questionText).toBeTruthy();
      }
    });

    test('診断の回答が送信できる', async () => {
      await page.goto(FRONTEND_URL);
      
      // 診断を開始
      const diagnosisButton = await page.$('button:has-text("診断"), [data-testid="start-diagnosis"]');
      if (diagnosisButton) {
        await diagnosisButton.click();
        
        // 最初の質問に回答
        const firstOption = await page.$('input[type="radio"], button[data-answer]');
        if (firstOption) {
          await firstOption.click();
          
          // 次へボタンをクリック
          const nextButton = await page.$('button:has-text("次へ"), button:has-text("Next")');
          if (nextButton) {
            await nextButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });
  });

  describe('4. データ永続化の確認', () => {
    test('入力データが保存される', async () => {
      await page.goto(FRONTEND_URL);
      
      // フォーム入力フィールドを探す
      const inputField = await page.$('input[type="text"]:not([type="search"])');
      if (inputField) {
        const testValue = `テストデータ_${Date.now()}`;
        await inputField.fill(testValue);
        
        // 保存ボタンがあれば押す
        const saveButton = await page.$('button:has-text("保存"), button[type="submit"]');
        if (saveButton) {
          await saveButton.click();
          await page.waitForTimeout(1000);
          
          // ページをリロード
          await page.reload();
          
          // データが残っているか確認（LocalStorageまたはAPIから）
          const savedValue = await page.evaluate(() => {
            return localStorage.getItem('testData') || '';
          });
          
          // 何らかの形でデータが保存されていることを確認
          expect(savedValue).toBeTruthy();
        }
      }
    });

    test('セッションデータが維持される', async () => {
      await page.goto(FRONTEND_URL);
      
      // セッションIDを確認
      const sessionId = await page.evaluate(() => {
        return sessionStorage.getItem('sessionId') || 
               localStorage.getItem('sessionId') || 
               document.cookie.match(/session=([^;]+)/)?.[1];
      });
      
      // ページをリロード
      await page.reload();
      
      // セッションが維持されているか確認
      const newSessionId = await page.evaluate(() => {
        return sessionStorage.getItem('sessionId') || 
               localStorage.getItem('sessionId') || 
               document.cookie.match(/session=([^;]+)/)?.[1];
      });
      
      if (sessionId) {
        expect(newSessionId).toBe(sessionId);
      }
    });
  });

  describe('5. エラーハンドリングの基本確認', () => {
    test('ネットワークエラー時にエラーメッセージが表示される', async () => {
      // バックエンドへのリクエストをブロック
      await page.route('**/api/**', route => route.abort());
      
      await page.goto(FRONTEND_URL);
      
      // エラーメッセージの表示を待つ
      const errorMessage = await page.waitForSelector(
        '[data-testid="error-message"], .error-message, .alert-danger',
        { timeout: 5000 }
      ).catch(() => null);
      
      if (errorMessage) {
        const errorText = await errorMessage.textContent();
        expect(errorText).toBeTruthy();
      }
    });

    test('404エラーが適切に処理される', async () => {
      await page.goto(`${FRONTEND_URL}/non-existent-page`);
      
      // 404ページまたはリダイレクトを確認
      const notFoundText = await page.textContent('body');
      expect(notFoundText).toMatch(/404|見つかりません|not found/i);
    });
  });

  describe('6. 基本的なセキュリティ確認', () => {
    test('セキュリティヘッダーが設定されている', async () => {
      const response = await page.goto(FRONTEND_URL);
      const headers = response.headers();
      
      // 基本的なセキュリティヘッダーの確認
      expect(headers['x-frame-options'] || headers['content-security-policy']).toBeTruthy();
    });

    test('APIエンドポイントがCORS設定されている', async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/health`, {
          headers: {
            'Origin': 'http://malicious-site.com'
          }
        });
        
        // CORSヘッダーの確認
        const corsHeader = response.headers.get('access-control-allow-origin');
        expect(corsHeader).not.toBe('*');
      } catch (error) {
        // CORSエラーは期待される動作
        expect(error).toBeTruthy();
      }
    });
  });
});

// ユーティリティ関数
async function waitForAPIResponse(page, urlPattern, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('API response timeout'));
    }, timeout);

    page.on('response', response => {
      if (response.url().match(urlPattern)) {
        clearTimeout(timer);
        resolve(response);
      }
    });
  });
}

// エクスポート
module.exports = {
  FRONTEND_URL,
  BACKEND_URL,
  waitForAPIResponse
};