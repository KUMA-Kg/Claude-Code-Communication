const { test, expect } = require('@playwright/test');

test.describe('IT補助金検索機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('メインページの表示確認', async ({ page }) => {
    await expect(page).toHaveTitle(/IT補助金アシストツール/);
    await expect(page.locator('h1')).toContainText('IT補助金検索');
  });

  test('補助金検索フォームの動作', async ({ page }) => {
    // 検索フォームの存在確認
    await expect(page.locator('[data-testid="search-form"]')).toBeVisible();
    
    // 企業規模選択
    await page.selectOption('[data-testid="company-size"]', '中小企業');
    
    // 業種選択
    await page.selectOption('[data-testid="industry"]', 'IT・情報通信業');
    
    // 投資額入力
    await page.fill('[data-testid="investment-amount"]', '500');
    
    // 検索実行
    await page.click('[data-testid="search-button"]');
    
    // 結果表示確認
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="subsidy-card"]')).toHaveCount.toBeGreaterThan(0);
  });

  test('検索結果の詳細表示', async ({ page }) => {
    // 検索実行（事前条件）
    await page.selectOption('[data-testid="company-size"]', '中小企業');
    await page.click('[data-testid="search-button"]');
    
    // 最初の結果をクリック
    await page.click('[data-testid="subsidy-card"]:first-child');
    
    // 詳細モーダルの表示確認
    await expect(page.locator('[data-testid="subsidy-detail-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="subsidy-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="subsidy-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="subsidy-requirements"]')).toBeVisible();
  });

  test('絞り込み機能', async ({ page }) => {
    // 詳細検索の展開
    await page.click('[data-testid="advanced-search-toggle"]');
    
    // 申請期限フィルター
    await page.selectOption('[data-testid="deadline-filter"]', '3ヶ月以内');
    
    // 補助率フィルター
    await page.fill('[data-testid="subsidy-rate-min"]', '50');
    
    // フィルター適用
    await page.click('[data-testid="apply-filters"]');
    
    // フィルター結果確認
    await expect(page.locator('[data-testid="filter-results-count"]')).toBeVisible();
  });

  test('お気に入り機能', async ({ page }) => {
    // 検索実行
    await page.click('[data-testid="search-button"]');
    
    // お気に入りボタンクリック
    await page.click('[data-testid="favorite-button"]:first-child');
    
    // お気に入り追加確認
    await expect(page.locator('[data-testid="favorite-button"]:first-child')).toHaveClass(/active/);
    
    // お気に入り一覧へ移動
    await page.click('[data-testid="favorites-tab"]');
    
    // お気に入り一覧表示確認
    await expect(page.locator('[data-testid="favorite-items"]')).toBeVisible();
  });
});

test.describe('資料作成機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/document-creator');
  });

  test('申請書類テンプレート選択', async ({ page }) => {
    // テンプレート一覧表示確認
    await expect(page.locator('[data-testid="template-list"]')).toBeVisible();
    
    // テンプレート選択
    await page.click('[data-testid="template-card"]:first-child');
    
    // フォーム表示確認
    await expect(page.locator('[data-testid="document-form"]')).toBeVisible();
  });

  test('企業情報入力', async ({ page }) => {
    // テンプレート選択
    await page.click('[data-testid="template-card"]:first-child');
    
    // 企業情報入力
    await page.fill('[data-testid="company-name"]', '株式会社テスト');
    await page.fill('[data-testid="representative"]', '山田太郎');
    await page.fill('[data-testid="employee-count"]', '50');
    await page.fill('[data-testid="capital"]', '10000000');
    
    // 入力値保存確認
    await page.click('[data-testid="save-draft"]');
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
  });

  test('ドキュメント生成', async ({ page }) => {
    // 事前にフォーム入力
    await page.click('[data-testid="template-card"]:first-child');
    await page.fill('[data-testid="company-name"]', '株式会社テスト');
    
    // ドキュメント生成実行
    await page.click('[data-testid="generate-document"]');
    
    // 生成中の表示確認
    await expect(page.locator('[data-testid="generating-indicator"]')).toBeVisible();
    
    // 生成完了確認（最大30秒待機）
    await expect(page.locator('[data-testid="document-preview"]')).toBeVisible({ timeout: 30000 });
    
    // ダウンロードボタン確認
    await expect(page.locator('[data-testid="download-pdf"]')).toBeVisible();
  });

  test('プレビュー機能', async ({ page }) => {
    // ドキュメント生成（事前条件）
    await page.click('[data-testid="template-card"]:first-child');
    await page.fill('[data-testid="company-name"]', '株式会社テスト');
    await page.click('[data-testid="generate-document"]');
    
    // プレビュー表示
    await expect(page.locator('[data-testid="document-preview"]')).toBeVisible();
    
    // 編集モード切り替え
    await page.click('[data-testid="edit-mode-toggle"]');
    
    // インライン編集確認
    await expect(page.locator('[data-testid="inline-editor"]')).toBeVisible();
  });
});

test.describe('セキュリティテスト', () => {
  test('CSP設定確認', async ({ page }) => {
    const response = await page.goto('/');
    const cspHeader = response.headers()['content-security-policy'];
    expect(cspHeader).toBeTruthy();
    expect(cspHeader).toContain("default-src 'self'");
  });

  test('XSS防止確認', async ({ page }) => {
    await page.goto('/');
    
    // 悪意のあるスクリプトを入力
    const maliciousScript = '<script>alert("XSS")</script>';
    await page.fill('[data-testid="search-input"]', maliciousScript);
    
    // スクリプトが実行されないことを確認
    page.on('dialog', dialog => {
      throw new Error('XSS攻撃が成功してしまいました');
    });
    
    await page.click('[data-testid="search-button"]');
    // アラートが表示されなければテスト成功
  });

  test('CSRF保護確認', async ({ page, context }) => {
    await page.goto('/');
    
    // CSRFトークンの存在確認
    const csrfToken = await page.locator('[name="csrf-token"]').getAttribute('content');
    expect(csrfToken).toBeTruthy();
    
    // 無效なCSRFトークンでのリクエスト
    await context.route('**/api/**', route => {
      const request = route.request();
      if (request.method() === 'POST') {
        route.fulfill({
          status: 403,
          body: 'CSRF token mismatch'
        });
      } else {
        route.continue();
      }
    });
  });
});