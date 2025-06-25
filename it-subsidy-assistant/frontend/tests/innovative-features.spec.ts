import { test, expect } from '@playwright/test';

// Visual AI Navigator Tests
test.describe('Visual AI Navigator', () => {
  test('3D補助金マップが正しく表示される', async ({ page }) => {
    await page.goto('/subsidy-navigator');
    
    // 3Dキャンバスの存在確認
    const canvas = await page.locator('canvas#subsidy-map-3d');
    await expect(canvas).toBeVisible();
    
    // WebGLコンテキストの確認
    const hasWebGL = await page.evaluate(() => {
      const canvas = document.querySelector('canvas#subsidy-map-3d') as HTMLCanvasElement;
      return !!canvas?.getContext('webgl');
    });
    expect(hasWebGL).toBeTruthy();
  });

  test('企業プロファイルに基づいてパスが動的に変化する', async ({ page }) => {
    await page.goto('/subsidy-navigator');
    
    // 企業情報入力
    await page.fill('[data-testid="company-size"]', '50');
    await page.selectOption('[data-testid="industry-type"]', 'it');
    
    // パスの更新を待つ
    await page.waitForSelector('[data-testid="recommended-path"]');
    
    // 推奨パスが表示されることを確認
    const path = await page.locator('[data-testid="recommended-path"]');
    await expect(path).toContainText('IT導入補助金');
  });
});

// Document Magic Studio Tests
test.describe('Document Magic Studio', () => {
  test('ドラッグ&ドロップでドキュメントブロックを配置できる', async ({ page }) => {
    await page.goto('/document-studio');
    
    // ドラッグ可能なブロックを取得
    const block = await page.locator('[data-testid="doc-block-company-info"]');
    const dropZone = await page.locator('[data-testid="document-canvas"]');
    
    // ドラッグ&ドロップ実行
    await block.dragTo(dropZone);
    
    // ブロックが配置されたことを確認
    const placedBlock = await dropZone.locator('[data-testid="doc-block-company-info"]');
    await expect(placedBlock).toBeVisible();
  });

  test('AIが文章を自動補完する', async ({ page }) => {
    await page.goto('/document-studio');
    
    // テキストブロックに入力
    const textBlock = await page.locator('[data-testid="text-block-1"]');
    await textBlock.type('当社は');
    
    // AI補完の提案を待つ
    await page.waitForSelector('[data-testid="ai-suggestions"]');
    
    // 提案が表示されることを確認
    const suggestions = await page.locator('[data-testid="ai-suggestions"]');
    await expect(suggestions).toBeVisible();
  });
});

// Live Collaboration Hub Tests
test.describe('Live Collaboration Hub', () => {
  test('複数ユーザーのカーソルが表示される', async ({ browser }) => {
    // 2つのブラウザコンテキストを作成
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // 両方のページで同じドキュメントを開く
    await page1.goto('/collaboration/doc-123');
    await page2.goto('/collaboration/doc-123');
    
    // ユーザー1のカーソルがユーザー2に表示される
    await page1.click('[data-testid="document-editor"]');
    
    const cursor2 = await page2.locator('[data-testid="remote-cursor-1"]');
    await expect(cursor2).toBeVisible();
    
    await context1.close();
    await context2.close();
  });

  test('リアルタイムで編集が同期される', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await page1.goto('/collaboration/doc-123');
    await page2.goto('/collaboration/doc-123');
    
    // ユーザー1が編集
    const editor1 = await page1.locator('[data-testid="document-editor"]');
    await editor1.type('テスト入力');
    
    // ユーザー2で変更が反映されることを確認
    const editor2 = await page2.locator('[data-testid="document-editor"]');
    await expect(editor2).toContainText('テスト入力');
    
    await context1.close();
    await context2.close();
  });
});

// Figma-Powered Profile Wizard Tests
test.describe('Figma-Powered Profile Wizard', () => {
  test('Figmaコンポーネントが正しくロードされる', async ({ page }) => {
    await page.goto('/profile-wizard');
    
    // Figma連携ボタンをクリック
    await page.click('[data-testid="connect-figma"]');
    
    // コンポーネントライブラリが表示される
    await page.waitForSelector('[data-testid="figma-components"]');
    
    const components = await page.locator('[data-testid="figma-component"]');
    expect(await components.count()).toBeGreaterThan(0);
  });

  test('ドラッグ&ドロップでフォーム要素を配置できる', async ({ page }) => {
    await page.goto('/profile-wizard');
    
    // Figmaコンポーネントをドラッグ
    const component = await page.locator('[data-testid="figma-input-component"]');
    const formCanvas = await page.locator('[data-testid="form-canvas"]');
    
    await component.dragTo(formCanvas);
    
    // フォーム要素が配置されたことを確認
    const placedInput = await formCanvas.locator('input');
    await expect(placedInput).toBeVisible();
  });

  test('デザイントークンが自動適用される', async ({ page }) => {
    await page.goto('/profile-wizard');
    
    // テーマ切り替え
    await page.selectOption('[data-testid="theme-selector"]', 'corporate-blue');
    
    // デザイントークンが適用されたことを確認
    const primaryButton = await page.locator('[data-testid="primary-button"]');
    const backgroundColor = await primaryButton.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    expect(backgroundColor).toBe('rgb(37, 99, 235)'); // corporate-blueの色
  });
});

// 統合テスト
test.describe('革新的機能の統合テスト', () => {
  test('全機能が連携して動作する', async ({ page }) => {
    // Visual AI Navigatorで補助金を選択
    await page.goto('/subsidy-navigator');
    await page.click('[data-testid="subsidy-node-it"]');
    
    // Document Magic Studioに遷移
    await page.click('[data-testid="start-document-creation"]');
    await expect(page).toHaveURL(/.*document-studio/);
    
    // Collaboration Hubを開く
    await page.click('[data-testid="invite-collaborators"]');
    const collaborationUrl = await page.locator('[data-testid="collaboration-link"]').textContent();
    expect(collaborationUrl).toContain('/collaboration/');
    
    // Figma連携でデザインをカスタマイズ
    await page.click('[data-testid="customize-design"]');
    await expect(page.locator('[data-testid="figma-panel"]')).toBeVisible();
  });
});

// パフォーマンステスト
test.describe('パフォーマンステスト', () => {
  test('3Dナビゲーターが60FPSで動作する', async ({ page }) => {
    await page.goto('/subsidy-navigator');
    
    // FPSメーターを有効化
    await page.evaluate(() => {
      (window as any).enableFPSMeter = true;
    });
    
    // 10秒間のFPSを測定
    await page.waitForTimeout(10000);
    
    const avgFPS = await page.evaluate(() => {
      return (window as any).averageFPS;
    });
    
    expect(avgFPS).toBeGreaterThan(55);
  });

  test('大規模ドキュメントでも応答性を維持する', async ({ page }) => {
    await page.goto('/document-studio');
    
    // 100個のブロックを追加
    for (let i = 0; i < 100; i++) {
      await page.click('[data-testid="add-text-block"]');
    }
    
    // 入力の応答時間を測定
    const startTime = Date.now();
    await page.type('[data-testid="text-block-99"]', 'テスト');
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(100); // 100ms以内
  });
});