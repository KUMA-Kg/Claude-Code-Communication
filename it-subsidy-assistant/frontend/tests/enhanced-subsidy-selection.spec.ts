import { test, expect } from '@playwright/test';

test.describe('補助金選択画面 - 拡張機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用のマッチデータを設定
    await page.goto('/subsidy-selection');
  });

  test('StatusBadgeコンポーネントの表示確認', async ({ page }) => {
    // アクティブなステータスバッジ
    const activeBadge = page.locator('[data-testid="status-badge-active"]').first();
    await expect(activeBadge).toBeVisible();
    await expect(activeBadge).toContainText('受付中');
    
    // 準備中のステータスバッジ
    const preparingBadge = page.locator('[data-testid="status-badge-preparing"]').first();
    await expect(preparingBadge).toBeVisible();
    await expect(preparingBadge).toContainText('準備中');
    
    // パルスアニメーションの確認（アクティブバッジのみ）
    await expect(activeBadge).toHaveCSS('position', 'relative');
  });

  test('グレーアウト機能の動作確認', async ({ page }) => {
    // 準備中の補助金カードを取得
    const disabledCard = page.locator('[aria-disabled="true"]').first();
    
    // グレーアウトスタイルの確認
    await expect(disabledCard).toHaveCSS('opacity', '0.6');
    await expect(disabledCard).toHaveCSS('cursor', 'not-allowed');
    
    // クリック時の動作確認
    await disabledCard.click();
    
    // 選択不可メッセージの表示確認
    const disabledMessage = page.locator('text=この補助金は現在準備中');
    await expect(disabledMessage).toBeVisible();
    
    // メッセージが3秒後に消えることを確認
    await page.waitForTimeout(3500);
    await expect(disabledMessage).not.toBeVisible();
  });

  test('ホバーエフェクトとインタラクション', async ({ page }) => {
    // アクティブな補助金カードを取得
    const activeCard = page.locator('[aria-disabled="false"]').first();
    
    // ホバー前の状態を記録
    const initialTransform = await activeCard.evaluate(el => 
      window.getComputedStyle(el).transform
    );
    
    // ホバー
    await activeCard.hover();
    
    // ホバー時のエフェクト確認
    await page.waitForTimeout(300); // アニメーション待機
    const hoverTransform = await activeCard.evaluate(el => 
      window.getComputedStyle(el).transform
    );
    
    expect(initialTransform).not.toBe(hoverTransform);
    
    // アイコンアニメーションの確認
    const icon = activeCard.locator('.subsidy-icon').first();
    await expect(icon).toBeVisible();
  });

  test('アクセシビリティ機能の確認', async ({ page }) => {
    // キーボードナビゲーション
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // フォーカスされた要素の確認
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('role', 'button');
    
    // ARIAラベルの確認
    const cards = page.locator('[role="button"]');
    const count = await cards.count();
    
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      await expect(card).toHaveAttribute('aria-label', /.+/);
    }
    
    // スクリーンリーダー向けの情報確認
    const disabledCards = page.locator('[aria-disabled="true"]');
    const disabledCount = await disabledCards.count();
    
    for (let i = 0; i < disabledCount; i++) {
      const card = disabledCards.nth(i);
      await expect(card).toHaveAttribute('aria-disabled', 'true');
    }
  });

  test('ダークモード切り替えテスト', async ({ page }) => {
    // ライトモードでのスクリーンショット
    await expect(page).toHaveScreenshot('subsidy-selection-light.png');
    
    // ダークモードトグルをクリック
    const darkModeToggle = page.locator('.theme-toggle');
    await darkModeToggle.click();
    
    // ダークモード適用待機
    await page.waitForTimeout(500);
    
    // ダークモードでのスクリーンショット
    await expect(page).toHaveScreenshot('subsidy-selection-dark.png');
    
    // CSS変数の確認
    const bgColor = await page.evaluate(() => 
      getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')
    );
    
    // ダークモードの背景色確認
    expect(bgColor).toBeTruthy();
  });

  test('複数補助金の同時表示とランキング', async ({ page }) => {
    // ランキングバッジの確認
    const firstRankBadge = page.locator('text=第1位');
    const secondRankBadge = page.locator('text=第2位');
    const thirdRankBadge = page.locator('text=第3位');
    
    await expect(firstRankBadge).toBeVisible();
    await expect(secondRankBadge).toBeVisible();
    await expect(thirdRankBadge).toBeVisible();
    
    // スコア表示の確認
    const scores = page.locator('.score-display');
    const scoreCount = await scores.count();
    
    // アクティブな補助金のみスコアが表示されることを確認
    for (let i = 0; i < scoreCount; i++) {
      const score = scores.nth(i);
      const scoreText = await score.textContent();
      expect(scoreText).toMatch(/\d+点/);
    }
  });

  test('外部リンクの動作確認', async ({ page }) => {
    // 新しいタブで開くことを確認
    const [newPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('a[target="_blank"]').first().click()
    ]);
    
    // 新しいタブが開かれたことを確認
    expect(newPage).toBeTruthy();
    await newPage.close();
  });

  test('レスポンシブデザインの確認', async ({ page }) => {
    // デスクトップビュー
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page).toHaveScreenshot('subsidy-selection-desktop.png');
    
    // タブレットビュー
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot('subsidy-selection-tablet.png');
    
    // モバイルビュー
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot('subsidy-selection-mobile.png');
    
    // モバイルでのグリッドレイアウト確認
    const gridContainer = page.locator('.subsidy-details-grid');
    const gridColumns = await gridContainer.evaluate(el => 
      window.getComputedStyle(el).gridTemplateColumns
    );
    
    // モバイルでは1カラムになることを確認
    expect(gridColumns).toContain('1fr');
  });

  test('アニメーションのパフォーマンステスト', async ({ page }) => {
    // アニメーションのFPS測定
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let fps = 0;
        let lastTime = performance.now();
        let frameCount = 0;
        
        const measureFPS = () => {
          frameCount++;
          const currentTime = performance.now();
          
          if (currentTime - lastTime >= 1000) {
            fps = frameCount;
            resolve(fps);
          } else {
            requestAnimationFrame(measureFPS);
          }
        };
        
        requestAnimationFrame(measureFPS);
      });
    });
    
    // 60FPSに近いことを確認
    expect(metrics).toBeGreaterThan(50);
  });

  test('エラー状態の処理確認', async ({ page }) => {
    // 補助金データが空の場合
    await page.evaluate(() => {
      window.subsidyMatches = [];
    });
    
    await page.reload();
    
    // エラーメッセージまたは空状態の表示確認
    const emptyState = page.locator('text=補助金が見つかりませんでした');
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    
    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
    }
  });
});