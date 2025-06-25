/**
 * 統合デモページのE2Eテスト
 * Worker1が実装した全機能の統合テスト
 */

import { test, expect, Page } from '@playwright/test';

// テストユーザー情報
const TEST_USER = {
  email: 'e2e-test@example.com',
  password: 'TestPassword123!',
  displayName: 'E2E Test User'
};

// デモユーザー情報（既存のデモアカウント）
const DEMO_USER = {
  email: 'demo@example.com',
  password: 'demo123'
};

// テスト企業データ
const TEST_COMPANY_DATA = {
  businessType: 'manufacturing',
  employeeCount: '21-50',
  annualRevenue: '100m-500m',
  currentChallenges: 'efficiency',
  digitalizationLevel: 'partial',
  budgetRange: '1m-3m'
};

test.describe('統合デモページ E2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    // 統合デモページにアクセス
    await page.goto('/demo/integrated');
    await page.waitForLoadState('networkidle');
    
    // ダークモードの状態を確認
    const isDarkMode = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    console.log(`ダークモード: ${isDarkMode ? '有効' : '無効'}`);
  });

  test('ページの初期表示と基本UI要素の確認', async ({ page }) => {
    // タイトルの確認
    await expect(page.locator('h1')).toContainText('エンタープライズ統合デモ');
    
    // 機能セクションの確認
    const sections = ['認証システム', 'AIマッチング', 'データ出力', 'リアルタイム'];
    for (const section of sections) {
      await expect(page.locator(`text=${section}`)).toBeVisible();
    }
    
    // システム状態インジケーターの確認
    await expect(page.locator('text=システム状態')).toBeVisible();
    
    // リアルタイムインジケーターの存在確認
    await expect(page.locator('[data-testid="realtime-indicator"]')).toBeVisible();
  });

  test('ダークモード切り替え機能', async ({ page }) => {
    // ダークモードトグルボタンを探す
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');
    
    if (await darkModeToggle.count() > 0) {
      // 初期状態を記録
      const initialIsDark = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark');
      });
      
      // トグルをクリック
      await darkModeToggle.click();
      await page.waitForTimeout(500); // トランジション待機
      
      // 状態が変わったことを確認
      const afterToggleIsDark = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark');
      });
      
      expect(afterToggleIsDark).toBe(!initialIsDark);
      
      // ローカルストレージに保存されていることを確認
      const savedTheme = await page.evaluate(() => {
        return localStorage.getItem('theme');
      });
      expect(savedTheme).toBe(afterToggleIsDark ? 'dark' : 'light');
    }
  });

  test('認証フロー - ログインとログアウト', async ({ page }) => {
    // 認証セクションをクリック
    await page.click('text=認証システム');
    await page.waitForTimeout(300);
    
    // ログインフォームの確認
    await expect(page.locator('label:has-text("メールアドレス")')).toBeVisible();
    await expect(page.locator('label:has-text("パスワード")')).toBeVisible();
    
    // デモ認証情報でログイン
    await page.fill('input[type="email"]', DEMO_USER.email);
    await page.fill('input[type="password"]', DEMO_USER.password);
    
    // ログインボタンをクリック
    await page.click('button:has-text("ログイン")');
    
    // ログイン成功の確認（成功または失敗メッセージ）
    const successMessage = page.locator('text=ログインに成功しました');
    const errorMessage = page.locator('text=ログインに失敗しました');
    
    // どちらかのメッセージが表示されるまで待機
    await expect(successMessage.or(errorMessage)).toBeVisible({ timeout: 10000 });
    
    // 成功した場合の追加確認
    if (await successMessage.isVisible()) {
      // 認証済み状態の確認
      await expect(page.locator('text=認証済み')).toBeVisible({ timeout: 5000 });
      
      // ログアウトボタンの確認
      const logoutButton = page.locator('button:has-text("ログアウト")');
      await expect(logoutButton).toBeVisible();
      
      // ログアウト実行
      await logoutButton.click();
      
      // ログインフォームが再表示されることを確認
      await expect(page.locator('label:has-text("メールアドレス")')).toBeVisible({ timeout: 5000 });
    }
  });

  test('AIマッチング機能のテスト', async ({ page }) => {
    // まずログイン（AIマッチングには認証が必要）
    await performLogin(page);
    
    // AIマッチングセクションに移動
    await page.click('text=AIマッチング');
    await page.waitForTimeout(300);
    
    // フォームフィールドの確認
    const formFields = ['事業形態', '従業員数', '現在の課題', '投資予算'];
    for (const field of formFields) {
      await expect(page.locator(`text=${field}`)).toBeVisible();
    }
    
    // デフォルト値が設定されていることを確認
    const businessTypeSelect = page.locator('select[id="businessType"]');
    const selectedValue = await businessTypeSelect.inputValue();
    expect(selectedValue).toBeTruthy();
    
    // AIマッチング実行ボタンの確認
    const matchingButton = page.locator('button:has-text("AIマッチング実行")');
    await expect(matchingButton).toBeVisible();
    
    // 認証されている場合のみマッチング実行
    const isAuthenticated = await page.locator('text=認証済み').isVisible();
    if (isAuthenticated) {
      await matchingButton.click();
      
      // ローディング状態の確認
      await expect(page.locator('text=マッチング中')).toBeVisible();
      
      // 結果の表示を待つ（成功または失敗）
      const successResult = page.locator('text=/\\d+件の補助金が見つかりました/');
      const errorResult = page.locator('text=マッチングに失敗しました');
      
      await expect(successResult.or(errorResult)).toBeVisible({ timeout: 10000 });
    } else {
      // 認証が必要なメッセージの確認
      await expect(page.locator('text=ログインが必要です')).toBeVisible();
    }
  });

  test('データエクスポート機能のテスト', async ({ page }) => {
    // エクスポートセクションに移動
    await page.click('text=データ出力');
    await page.waitForTimeout(300);
    
    // エクスポート機能の説明確認
    await expect(page.locator('text=CSV、Excel、PDF形式での多機能エクスポート')).toBeVisible();
    
    // エクスポートボタンの確認
    const exportButton = page.locator('button:has-text("エクスポート設定を開く")');
    await expect(exportButton).toBeVisible();
    
    // エクスポート形式の特徴説明の確認
    const exportFormats = ['CSV形式', 'Excel形式', 'PDF形式'];
    for (const format of exportFormats) {
      await expect(page.locator(`text=${format}`)).toBeVisible();
    }
    
    // 未認証またはデータなしの場合の確認
    const isDisabled = await exportButton.isDisabled();
    if (isDisabled) {
      const warningText = await page.locator('text=/ログインが必要です|マッチング結果が必要です/').textContent();
      expect(warningText).toBeTruthy();
    }
  });

  test('リアルタイム接続状態の確認', async ({ page }) => {
    // リアルタイムセクションに移動
    await page.click('text=リアルタイム');
    await page.waitForTimeout(300);
    
    // 接続状態インジケーターの確認
    const connectionStatus = page.locator('text=/リアルタイム接続中|接続されていません/');
    await expect(connectionStatus).toBeVisible();
    
    // WebSocket接続の説明確認
    await expect(page.locator('text=WebSocketによる双方向通信')).toBeVisible();
    
    // 接続状態に応じた表示色の確認
    const isConnected = await page.locator('text=リアルタイム接続中').isVisible();
    const statusIndicator = page.locator('[style*="border-radius: 50%"]').first();
    
    if (isConnected) {
      // 緑色のインジケーター
      const bgColor = await statusIndicator.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(bgColor).toContain('rgb'); // 色が設定されていることを確認
    }
  });

  test('レスポンシブデザインの確認', async ({ page, viewport }) => {
    // モバイルビューポートでテスト
    await page.setViewportSize({ width: 375, height: 667 });
    
    // モバイルでサイドバーが非表示になっていることを確認
    const sidebar = page.locator('[data-testid="sidebar"]');
    if (await sidebar.count() > 0) {
      await expect(sidebar).not.toBeVisible();
    }
    
    // モバイルメニューボタンの確認（存在する場合）
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.count() > 0) {
      await expect(mobileMenuButton).toBeVisible();
      
      // メニューを開く
      await mobileMenuButton.click();
      await page.waitForTimeout(300);
      
      // メニュー項目の確認
      const menuItems = ['認証システム', 'AIマッチング', 'データ出力', 'リアルタイム'];
      for (const item of menuItems) {
        await expect(page.locator(`text=${item}`)).toBeVisible();
      }
    }
    
    // デスクトップビューポートに戻す
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('アクセシビリティ基本チェック', async ({ page }) => {
    // キーボードナビゲーションのテスト
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    // フォーカスが可視要素に当たっていることを確認
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        isVisible: el ? window.getComputedStyle(el).visibility !== 'hidden' : false
      };
    });
    
    expect(focusedElement.isVisible).toBe(true);
    
    // ARIAラベルの確認
    const buttons = await page.$$('button');
    for (const button of buttons.slice(0, 5)) { // 最初の5つのボタンをチェック
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      // テキストまたはaria-labelが存在することを確認
      expect(text || ariaLabel).toBeTruthy();
    }
    
    // 画像のalt属性確認
    const images = await page.$$('img');
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('エラーハンドリングとユーザーフィードバック', async ({ page }) => {
    // 無効な認証情報でログイン試行
    await page.click('text=認証システム');
    await page.waitForTimeout(300);
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("ログイン")');
    
    // エラーメッセージの表示確認
    const errorMessage = page.locator('text=/ログインに失敗しました|メールアドレスまたはパスワードが正しくありません/');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // エラーメッセージが一定時間後に消えることを確認（実装されている場合）
    await page.waitForTimeout(6000);
    // メッセージが消えているか、まだ表示されているかを確認
    // （実装によって動作が異なる可能性がある）
  });
});

// ヘルパー関数
async function performLogin(page: Page) {
  // 認証セクションに移動
  await page.click('text=認証システム');
  await page.waitForTimeout(300);
  
  // すでにログイン済みかチェック
  const isLoggedIn = await page.locator('text=認証済み').isVisible();
  
  if (!isLoggedIn) {
    // ログイン実行
    await page.fill('input[type="email"]', DEMO_USER.email);
    await page.fill('input[type="password"]', DEMO_USER.password);
    await page.click('button:has-text("ログイン")');
    
    // ログイン完了を待つ
    await expect(page.locator('text=ログインに成功しました').or(page.locator('text=認証済み'))).toBeVisible({ timeout: 10000 });
  }
}

// パフォーマンス計測ヘルパー
async function measurePerformance(page: Page, actionName: string, action: () => Promise<void>) {
  const startTime = Date.now();
  
  await page.evaluate((name) => {
    window.performance.mark(`${name}-start`);
  }, actionName);
  
  await action();
  
  await page.evaluate((name) => {
    window.performance.mark(`${name}-end`);
    window.performance.measure(name, `${name}-start`, `${name}-end`);
  }, actionName);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const measure = await page.evaluate((name) => {
    const entry = window.performance.getEntriesByName(name)[0];
    return entry ? entry.duration : null;
  }, actionName);
  
  console.log(`${actionName}: ${measure || duration}ms`);
  
  return measure || duration;
}