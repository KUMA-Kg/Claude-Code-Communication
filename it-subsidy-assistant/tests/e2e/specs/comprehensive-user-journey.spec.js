/**
 * 包括的ユーザージャーニー E2Eテスト
 * 実際のユーザー操作フローを完全に再現
 */

const { test, expect } = require('@playwright/test');

test.describe('IT補助金アシストツール - 包括的ユーザージャーニー', () => {
  // テストデータ
  const testUser = {
    email: 'test@example.com',
    password: 'SecurePassword123!'
  };

  const testCompany = {
    name: '株式会社テストIT',
    representative: '山田太郎',
    employeeCount: '50',
    capital: '10000000',
    industry: 'IT・情報通信業',
    address: '東京都渋谷区テスト1-1-1',
    phone: '03-1234-5678'
  };

  const testInvestment = {
    purpose: 'DX推進のためのクラウドシステム導入',
    amount: '800000',
    timeline: '6ヶ月以内',
    details: 'CRM・ERPシステムの統合および業務効率化'
  };

  test.beforeEach(async ({ page }) => {
    // 各テスト前にホームページに移動
    await page.goto('/');
    
    // 初期状態の確認
    await expect(page).toHaveTitle(/IT補助金アシストツール/);
    await expect(page.locator('h1')).toContainText('IT補助金検索');
  });

  test('新規ユーザーの完全な利用フロー', async ({ page }) => {
    // === 1. 初回訪問とチュートリアル ===
    
    // チュートリアルモーダルの表示確認
    await expect(page.locator('[data-testid="tutorial-modal"]')).toBeVisible();
    
    // チュートリアルを完了
    await page.click('[data-testid="tutorial-start"]');
    
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="tutorial-next"]');
      await page.waitForTimeout(500);
    }
    
    await page.click('[data-testid="tutorial-complete"]');
    await expect(page.locator('[data-testid="tutorial-modal"]')).not.toBeVisible();

    // === 2. 補助金検索の実行 ===
    
    // 基本検索条件の入力
    await page.selectOption('[data-testid="company-size"]', '中小企業');
    await page.selectOption('[data-testid="industry"]', 'IT・情報通信業');
    await page.fill('[data-testid="investment-amount"]', testInvestment.amount);
    
    // 詳細検索オプションの展開
    await page.click('[data-testid="advanced-search-toggle"]');
    await expect(page.locator('[data-testid="advanced-search-section"]')).toBeVisible();
    
    // 詳細条件の設定
    await page.selectOption('[data-testid="deadline-filter"]', '6ヶ月以内');
    await page.fill('[data-testid="subsidy-rate-min"]', '40');
    await page.selectOption('[data-testid="region-filter"]', '東京都');
    
    // 検索実行
    await page.click('[data-testid="search-button"]');
    
    // ローディング状態の確認
    await expect(page.locator('[data-testid="search-loading"]')).toBeVisible();
    
    // 検索結果の表示確認
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="subsidy-card"]')).toHaveCount.toBeGreaterThan(0);
    
    // 結果数の表示確認
    await expect(page.locator('[data-testid="results-count"]')).toContainText('件の補助金が見つかりました');

    // === 3. 補助金詳細の確認 ===
    
    // 最初の補助金カードをクリック
    await page.click('[data-testid="subsidy-card"]:first-child');
    
    // 詳細モーダルの表示確認
    await expect(page.locator('[data-testid="subsidy-detail-modal"]')).toBeVisible();
    
    // 詳細情報の確認
    await expect(page.locator('[data-testid="subsidy-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="subsidy-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="subsidy-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="subsidy-deadline"]')).toBeVisible();
    await expect(page.locator('[data-testid="subsidy-requirements"]')).toBeVisible();
    
    // 適格性計算ボタンのクリック
    await page.click('[data-testid="calculate-eligibility"]');
    
    // 企業情報入力フォームの表示確認
    await expect(page.locator('[data-testid="company-info-form"]')).toBeVisible();

    // === 4. 企業情報の入力 ===
    
    await page.fill('[data-testid="company-name"]', testCompany.name);
    await page.fill('[data-testid="representative"]', testCompany.representative);
    await page.fill('[data-testid="employee-count"]', testCompany.employeeCount);
    await page.fill('[data-testid="capital"]', testCompany.capital);
    await page.selectOption('[data-testid="industry-select"]', testCompany.industry);
    await page.fill('[data-testid="address"]', testCompany.address);
    await page.fill('[data-testid="phone"]', testCompany.phone);
    
    // 投資詳細の入力
    await page.fill('[data-testid="investment-purpose"]', testInvestment.purpose);
    await page.fill('[data-testid="investment-details"]', testInvestment.details);
    await page.selectOption('[data-testid="investment-timeline"]', testInvestment.timeline);
    
    // 適格性計算の実行
    await page.click('[data-testid="calculate-button"]');
    
    // 計算中のローディング表示
    await expect(page.locator('[data-testid="calculation-loading"]')).toBeVisible();
    
    // 計算結果の表示確認
    await expect(page.locator('[data-testid="calculation-results"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="eligible-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="subsidy-rate-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="calculation-breakdown"]')).toBeVisible();

    // === 5. お気に入り登録 ===
    
    // お気に入りボタンのクリック
    await page.click('[data-testid="favorite-button"]');
    
    // 会員登録/ログインモーダルの表示
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
    
    // 新規会員登録タブに切り替え
    await page.click('[data-testid="register-tab"]');
    
    // 会員登録情報の入力
    await page.fill('[data-testid="register-email"]', testUser.email);
    await page.fill('[data-testid="register-password"]', testUser.password);
    await page.fill('[data-testid="register-password-confirm"]', testUser.password);
    await page.check('[data-testid="terms-agreement"]');
    await page.check('[data-testid="privacy-agreement"]');
    
    // 会員登録実行
    await page.click('[data-testid="register-button"]');
    
    // 登録完了の確認
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    
    // モーダルクローズ
    await page.click('[data-testid="auth-modal-close"]');
    
    // お気に入りが追加されたことの確認
    await expect(page.locator('[data-testid="favorite-button"]')).toHaveClass(/active/);

    // === 6. 資料作成機能の利用 ===
    
    // 資料作成ボタンのクリック
    await page.click('[data-testid="create-document-button"]');
    
    // 資料作成ページへの遷移確認
    await expect(page).toHaveURL(/.*\/document-creator/);
    await expect(page.locator('h1')).toContainText('申請書類作成');
    
    // テンプレート選択
    await expect(page.locator('[data-testid="template-list"]')).toBeVisible();
    await page.click('[data-testid="template-card"]:first-child');
    
    // フォームの表示確認
    await expect(page.locator('[data-testid="document-form"]')).toBeVisible();
    
    // 企業情報が自動入力されていることの確認
    await expect(page.locator('[data-testid="company-name"]')).toHaveValue(testCompany.name);
    await expect(page.locator('[data-testid="representative"]')).toHaveValue(testCompany.representative);
    
    // 追加情報の入力
    await page.fill('[data-testid="project-overview"]', '業務効率化を目的としたクラウドシステム導入プロジェクト');
    await page.fill('[data-testid="expected-effects"]', '・業務処理時間の30%削減\n・データ入力ミスの90%削減\n・リモートワーク環境の整備');
    
    // ドキュメント生成実行
    await page.click('[data-testid="generate-document"]');
    
    // 生成中の表示確認
    await expect(page.locator('[data-testid="generating-indicator"]')).toBeVisible();
    
    // 生成完了の確認
    await expect(page.locator('[data-testid="document-preview"]')).toBeVisible({ timeout: 30000 });
    
    // プレビューの内容確認
    await expect(page.locator('[data-testid="document-preview"]')).toContainText(testCompany.name);
    await expect(page.locator('[data-testid="document-preview"]')).toContainText(testInvestment.purpose);

    // === 7. ドキュメントの編集・出力 ===
    
    // 編集モードに切り替え
    await page.click('[data-testid="edit-mode-toggle"]');
    
    // インライン編集の確認
    await expect(page.locator('[data-testid="inline-editor"]')).toBeVisible();
    
    // 文書の一部を編集
    await page.locator('[data-testid="editable-section"]:first-child').click();
    await page.keyboard.selectAll();
    await page.keyboard.type('編集済みのテキスト内容');
    
    // 編集完了
    await page.click('[data-testid="save-edit"]');
    
    // PDFダウンロード
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-pdf"]');
    const download = await downloadPromise;
    
    // ダウンロードファイル名の確認
    expect(download.suggestedFilename()).toMatch(/申請書類.*\.pdf/);

    // === 8. マイページでの履歴確認 ===
    
    // マイページへ移動
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="my-page"]');
    
    // マイページの表示確認
    await expect(page).toHaveURL(/.*\/mypage/);
    await expect(page.locator('h1')).toContainText('マイページ');
    
    // お気に入り一覧の確認
    await page.click('[data-testid="favorites-tab"]');
    await expect(page.locator('[data-testid="favorite-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="favorite-item"]')).toHaveCount.toBeGreaterThan(0);
    
    // 検索履歴の確認
    await page.click('[data-testid="search-history-tab"]');
    await expect(page.locator('[data-testid="search-history-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-item"]')).toHaveCount.toBeGreaterThan(0);
    
    // 作成文書履歴の確認
    await page.click('[data-testid="documents-tab"]');
    await expect(page.locator('[data-testid="document-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="document-item"]')).toHaveCount.toBeGreaterThan(0);

    // === 9. 通知・アラート機能の確認 ===
    
    // 通知設定ページへ移動
    await page.click('[data-testid="notification-settings"]');
    
    // 通知設定の変更
    await page.check('[data-testid="deadline-notification"]');
    await page.check('[data-testid="new-subsidy-notification"]');
    await page.selectOption('[data-testid="notification-frequency"]', 'weekly');
    
    // 設定保存
    await page.click('[data-testid="save-notifications"]');
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();

    // === 10. ログアウト ===
    
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout"]');
    
    // ログアウト確認
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('既存ユーザーのリピート利用フロー', async ({ page }) => {
    // === 1. ログイン ===
    
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
    
    await page.fill('[data-testid="login-email"]', testUser.email);
    await page.fill('[data-testid="login-password"]', testUser.password);
    await page.click('[data-testid="login-submit"]');
    
    await expect(page.locator('[data-testid="auth-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // === 2. 保存済み検索条件の利用 ===
    
    await page.click('[data-testid="saved-searches"]');
    await expect(page.locator('[data-testid="saved-search-items"]')).toBeVisible();
    
    // 保存済み検索の実行
    await page.click('[data-testid="saved-search-item"]:first-child');
    
    // 検索条件が自動入力されることの確認
    await expect(page.locator('[data-testid="company-size"]')).toHaveValue('中小企業');
    await expect(page.locator('[data-testid="industry"]')).toHaveValue('IT・情報通信業');
    
    // 検索実行
    await page.click('[data-testid="search-button"]');
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

    // === 3. お気に入りからの詳細確認 ===
    
    await page.click('[data-testid="favorites-quick-access"]');
    await page.click('[data-testid="favorite-item"]:first-child');
    
    // 詳細モーダルの表示
    await expect(page.locator('[data-testid="subsidy-detail-modal"]')).toBeVisible();
    
    // 企業情報が保存されていることの確認
    await page.click('[data-testid="calculate-eligibility"]');
    await expect(page.locator('[data-testid="company-name"]')).toHaveValue(testCompany.name);

    // === 4. 新規検索条件の保存 ===
    
    await page.click('[data-testid="modal-close"]');
    
    // 新しい検索条件を設定
    await page.selectOption('[data-testid="company-size"]', '小規模企業');
    await page.selectOption('[data-testid="industry"]', '製造業');
    await page.fill('[data-testid="investment-amount"]', '300000');
    
    // 検索条件を保存
    await page.click('[data-testid="save-search"]');
    await page.fill('[data-testid="search-name"]', '小規模製造業向け検索');
    await page.click('[data-testid="save-confirm"]');
    
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
  });

  test('モバイルデバイスでのユーザージャーニー', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // === 1. モバイル表示の確認 ===
    
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-form"]')).toHaveClass(/mobile-layout/);
    
    // === 2. ハンバーガーメニューの操作 ===
    
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    await page.click('[data-testid="menu-search"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
    
    // === 3. タッチ操作での検索 ===
    
    await page.tap('[data-testid="company-size"]');
    await page.selectOption('[data-testid="company-size"]', '中小企業');
    
    await page.tap('[data-testid="industry"]');
    await page.selectOption('[data-testid="industry"]', 'IT・情報通信業');
    
    // モバイル専用のキーボード入力
    await page.tap('[data-testid="investment-amount"]');
    await page.fill('[data-testid="investment-amount"]', '500000');
    
    // タッチで検索実行
    await page.tap('[data-testid="search-button"]');
    
    // === 4. スワイプ操作での結果閲覧 ===
    
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // 結果カードのスワイプ操作
    const resultsContainer = page.locator('[data-testid="results-container"]');
    await resultsContainer.swipe('left', { duration: 500 });
    
    // === 5. モバイルでの詳細表示 ===
    
    await page.tap('[data-testid="subsidy-card"]:first-child');
    
    // フルスクリーンモーダルの確認
    await expect(page.locator('[data-testid="mobile-detail-view"]')).toBeVisible();
    
    // スクロール操作での詳細確認
    await page.locator('[data-testid="mobile-detail-view"]').scroll({ top: 200 });
    
    // モーダルクローズ
    await page.tap('[data-testid="mobile-close"]');
  });

  test('アクセシビリティを考慮したユーザージャーニー', async ({ page }) => {
    // === 1. キーボードナビゲーション ===
    
    // Tabキーでのフォーカス移動
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="company-size"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="industry"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="investment-amount"]')).toBeFocused();
    
    // === 2. スクリーンリーダー対応の確認 ===
    
    // aria-labelの確認
    await expect(page.locator('[data-testid="company-size"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="search-button"]')).toHaveAttribute('aria-describedby');
    
    // === 3. キーボード操作での検索実行 ===
    
    await page.keyboard.press('Space'); // プルダウン開く
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter'); // 選択
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    await page.keyboard.press('Tab');
    await page.keyboard.type('500000');
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // 検索実行
    
    // === 4. 結果のキーボードナビゲーション ===
    
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // Tabキーで結果カード間を移動
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="subsidy-card"]:first-child')).toBeFocused();
    
    await page.keyboard.press('Enter'); // カード選択
    await expect(page.locator('[data-testid="subsidy-detail-modal"]')).toBeVisible();
    
    // Escapeキーでモーダルクローズ
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="subsidy-detail-modal"]')).not.toBeVisible();
  });

  test('エラー処理とリカバリーフロー', async ({ page }) => {
    // === 1. ネットワークエラーのシミュレーション ===
    
    // ネットワークを無効化
    await page.context().setOffline(true);
    
    await page.selectOption('[data-testid="company-size"]', '中小企業');
    await page.selectOption('[data-testid="industry"]', 'IT・情報通信業');
    await page.fill('[data-testid="investment-amount"]', '500000');
    
    await page.click('[data-testid="search-button"]');
    
    // エラーメッセージの表示確認
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // === 2. ネットワーク復旧とリトライ ===
    
    await page.context().setOffline(false);
    await page.click('[data-testid="retry-button"]');
    
    // 正常な検索結果の表示確認
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // === 3. バリデーションエラーの処理 ===
    
    await page.fill('[data-testid="investment-amount"]', '-100');
    await page.click('[data-testid="search-button"]');
    
    // エラーメッセージの表示
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('正の数値を入力してください');
    
    // エラー修正後の再試行
    await page.fill('[data-testid="investment-amount"]', '500000');
    await page.click('[data-testid="search-button"]');
    
    // エラーメッセージの消去確認
    await expect(page.locator('[data-testid="validation-error"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });
});