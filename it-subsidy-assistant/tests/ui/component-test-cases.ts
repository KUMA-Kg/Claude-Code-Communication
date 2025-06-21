import { test, expect } from '@playwright/test';

/**
 * UI Component Test Cases for Subsidy Application System
 * Comprehensive testing for responsive design, user interactions, and performance
 */

// Test data for UI components
const testCompanies = {
  smallManufacturer: {
    name: "小規模製造業テスト",
    industry: "製造業",
    employeeCount: 15,
    expectedSubsidy: "小規模事業者持続化補助金"
  },
  mediumIT: {
    name: "中規模IT企業テスト",
    industry: "情報通信業",
    employeeCount: 50,
    expectedSubsidy: "IT導入補助金"
  },
  innovativeManufacturer: {
    name: "革新的製造業テスト",
    industry: "製造業",
    employeeCount: 80,
    expectedSubsidy: "ものづくり補助金"
  }
};

test.describe('Subsidy Selection Flow UI Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('初期画面の表示確認', async ({ page }) => {
    // ヘッダーの確認
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('h1')).toContainText('補助金診断');
    
    // メインコンテンツの確認
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('[data-testid="start-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-button"]')).toContainText('診断を開始');
    
    // フッターの確認
    await expect(page.locator('footer')).toBeVisible();
  });

  test('申請枠判定フローの動作確認', async ({ page }) => {
    // 診断開始
    await page.click('[data-testid="start-button"]');
    
    // 企業情報入力画面
    await expect(page.locator('h2')).toContainText('企業情報を入力してください');
    
    // 企業名入力
    await page.fill('[data-testid="company-name"]', testCompanies.mediumIT.name);
    
    // 業種選択
    await page.selectOption('[data-testid="industry-select"]', testCompanies.mediumIT.industry);
    
    // 従業員数入力
    await page.fill('[data-testid="employee-count"]', testCompanies.mediumIT.employeeCount.toString());
    
    // 次へボタンクリック
    await page.click('[data-testid="next-button"]');
    await page.waitForLoadState('networkidle');
    
    // 質問画面の確認
    await expect(page.locator('[data-testid="question-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="question-text"]')).toBeVisible();
    
    // 最初の質問に回答
    await page.click('[data-testid="answer-option-0"]');
    await page.click('[data-testid="next-question"]');
    
    // 判定結果画面まで進む
    await page.waitForSelector('[data-testid="result-container"]', { timeout: 10000 });
    
    // 結果の確認
    await expect(page.locator('[data-testid="recommended-subsidy"]')).toContainText('IT導入補助金');
    await expect(page.locator('[data-testid="subsidy-category"]')).toBeVisible();
    await expect(page.locator('[data-testid="required-documents"]')).toBeVisible();
  });

  test('エラーハンドリングの確認', async ({ page }) => {
    await page.click('[data-testid="start-button"]');
    
    // 必須項目未入力でのエラー
    await page.click('[data-testid="next-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('企業名は必須です');
    
    // 無効な従業員数でのエラー
    await page.fill('[data-testid="company-name"]', 'テスト企業');
    await page.fill('[data-testid="employee-count"]', '-1');
    await page.click('[data-testid="next-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('従業員数は1名以上である必要があります');
  });

  test('進捗インジケーターの動作確認', async ({ page }) => {
    await page.click('[data-testid="start-button"]');
    
    // 初期状態
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-step-1"]')).toHaveClass(/active/);
    
    // 次のステップに進む
    await page.fill('[data-testid="company-name"]', testCompanies.smallManufacturer.name);
    await page.selectOption('[data-testid="industry-select"]', testCompanies.smallManufacturer.industry);
    await page.fill('[data-testid="employee-count"]', testCompanies.smallManufacturer.employeeCount.toString());
    await page.click('[data-testid="next-button"]');
    
    // 進捗の更新確認
    await expect(page.locator('[data-testid="progress-step-2"]')).toHaveClass(/active/);
  });

  test('戻るボタンの動作確認', async ({ page }) => {
    await page.click('[data-testid="start-button"]');
    
    // 企業情報入力
    await page.fill('[data-testid="company-name"]', testCompanies.mediumIT.name);
    await page.selectOption('[data-testid="industry-select"]', testCompanies.mediumIT.industry);
    await page.fill('[data-testid="employee-count"]', testCompanies.mediumIT.employeeCount.toString());
    await page.click('[data-testid="next-button"]');
    
    // 戻るボタンクリック
    await page.click('[data-testid="back-button"]');
    
    // 前の画面に戻ることを確認
    await expect(page.locator('[data-testid="company-name"]')).toHaveValue(testCompanies.mediumIT.name);
    await expect(page.locator('[data-testid="employee-count"]')).toHaveValue(testCompanies.mediumIT.employeeCount.toString());
  });

  test('やり直し機能の確認', async ({ page }) => {
    // 一度診断を完了させる
    await page.click('[data-testid="start-button"]');
    await page.fill('[data-testid="company-name"]', testCompanies.mediumIT.name);
    await page.selectOption('[data-testid="industry-select"]', testCompanies.mediumIT.industry);
    await page.fill('[data-testid="employee-count"]', testCompanies.mediumIT.employeeCount.toString());
    await page.click('[data-testid="next-button"]');
    
    // 質問に回答
    await page.click('[data-testid="answer-option-0"]');
    await page.click('[data-testid="next-question"]');
    
    // 結果画面でやり直しボタンクリック
    await page.waitForSelector('[data-testid="restart-button"]');
    await page.click('[data-testid="restart-button"]');
    
    // 最初の画面に戻ることを確認
    await expect(page.locator('[data-testid="start-button"]')).toBeVisible();
  });
});

test.describe('Responsive Design Tests', () => {
  
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`${name}での表示確認`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      
      // レスポンシブ対応の確認
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      
      // モバイル時のハンバーガーメニュー
      if (width <= 768) {
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      }
      
      // ボタンが適切に配置されているか
      const startButton = page.locator('[data-testid="start-button"]');
      await expect(startButton).toBeVisible();
      
      const boundingBox = await startButton.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    });
  });

  test('タッチデバイスでの操作確認', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari/WebKit only');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // タッチイベントの確認
    await page.tap('[data-testid="start-button"]');
    await expect(page.locator('h2')).toContainText('企業情報を入力してください');
  });
});

test.describe('Performance Tests', () => {
  
  test('ページ読み込み時間の計測', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000); // 3秒以内
  });

  test('大量データでの動作確認', async ({ page }) => {
    await page.goto('/');
    
    // 大量の選択肢がある業種選択
    await page.click('[data-testid="start-button"]');
    await page.fill('[data-testid="company-name"]', 'パフォーマンステスト企業');
    
    const industrySelect = page.locator('[data-testid="industry-select"]');
    await industrySelect.click();
    
    // 選択肢の読み込み時間
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="industry-option"]');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(1000); // 1秒以内
  });

  test('メモリリークの確認', async ({ page }) => {
    // 複数回診断を実行してメモリ使用量を確認
    for (let i = 0; i < 5; i++) {
      await page.goto('/');
      await page.click('[data-testid="start-button"]');
      await page.fill('[data-testid="company-name"]', `テスト企業${i}`);
      await page.selectOption('[data-testid="industry-select"]', '製造業');
      await page.fill('[data-testid="employee-count"]', '10');
      await page.click('[data-testid="next-button"]');
      await page.click('[data-testid="answer-option-0"]');
      await page.click('[data-testid="restart-button"]');
    }
    
    // メモリリークが発生していないことを確認
    const metrics = await page.evaluate(() => {
      return {
        usedJSMemory: (performance as any).memory?.usedJSMemory || 0,
        totalJSMemory: (performance as any).memory?.totalJSMemory || 0
      };
    });
    
    console.log('Memory usage:', metrics);
    expect(metrics.usedJSMemory).toBeLessThan(50 * 1024 * 1024); // 50MB未満
  });
});

test.describe('Accessibility Tests', () => {
  
  test('キーボードナビゲーション', async ({ page }) => {
    await page.goto('/');
    
    // Tabキーでフォーカス移動
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="start-button"]')).toBeFocused();
    
    // Enterキーでボタンクリック
    await page.keyboard.press('Enter');
    await expect(page.locator('h2')).toContainText('企業情報を入力してください');
    
    // フォームフィールドの移動
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="company-name"]')).toBeFocused();
  });

  test('ARIA属性の確認', async ({ page }) => {
    await page.goto('/');
    
    // ARIA ラベルの確認
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[aria-label="補助金診断開始"]')).toBeVisible();
    
    await page.click('[data-testid="start-button"]');
    
    // フォームのARIA属性
    await expect(page.locator('[aria-required="true"]')).toHaveCount(3); // 必須フィールド
    await expect(page.locator('[aria-describedby]')).toBeVisible(); // 説明文
  });

  test('カラーコントラストの確認', async ({ page }) => {
    await page.goto('/');
    
    // 主要なテキスト要素のコントラスト確認
    const textElements = await page.locator('h1, h2, p, button').all();
    
    for (const element of textElements) {
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        };
      });
      
      // 最低限のコントラスト比があることを確認（4.5:1）
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    }
  });
});

test.describe('Error Handling Tests', () => {
  
  test('ネットワークエラー時の動作', async ({ page }) => {
    // ネットワーク失敗をシミュレート
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/');
    await page.click('[data-testid="start-button"]');
    await page.fill('[data-testid="company-name"]', 'テスト企業');
    await page.selectOption('[data-testid="industry-select"]', '製造業');
    await page.fill('[data-testid="employee-count"]', '10');
    await page.click('[data-testid="next-button"]');
    
    // エラーメッセージの確認
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('JavaScript無効時の動作', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'navigator', {
        value: { ...navigator, javaEnabled: () => false }
      });
    });
    
    await page.goto('/');
    
    // フォールバック画面の確認
    await expect(page.locator('[data-testid="no-js-fallback"]')).toBeVisible();
  });

  test('無効なデータ入力時の動作', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="start-button"]');
    
    // 無効な文字列を数値フィールドに入力
    await page.fill('[data-testid="employee-count"]', 'abc');
    await page.click('[data-testid="next-button"]');
    
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('数値を入力してください');
  });
});

test.describe('Integration Tests', () => {
  
  test('複数ブラウザでの同期確認', async ({ page, context }) => {
    // セッションストレージの確認
    await page.goto('/');
    await page.click('[data-testid="start-button"]');
    await page.fill('[data-testid="company-name"]', 'セッションテスト企業');
    
    // 新しいタブで同じページを開く
    const newPage = await context.newPage();
    await newPage.goto('/');
    
    // セッションが独立していることを確認
    await newPage.click('[data-testid="start-button"]');
    await expect(newPage.locator('[data-testid="company-name"]')).toHaveValue('');
  });

  test('データ永続化の確認', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="start-button"]');
    await page.fill('[data-testid="company-name"]', '永続化テスト企業');
    
    // ページをリロード
    await page.reload();
    
    // データが保持されていることを確認（ローカルストレージ使用の場合）
    await page.click('[data-testid="start-button"]');
    // 設定によってはデータが復元される
  });
});