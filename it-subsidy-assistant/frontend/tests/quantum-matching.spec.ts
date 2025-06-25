import { test, expect } from '@playwright/test';

test.describe('Quantum Matching Engine Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quantum-matching-demo');
    
    // 3Dシーンのロードを待つ
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000); // 初期アニメーション完了待ち
  });

  test('量子マッチングエンジンの初期表示', async ({ page }) => {
    // タイトルとヘッダーの確認
    await expect(page.locator('h1')).toContainText('Quantum Matching Engine Demo');
    
    // コントロールボタンの存在確認
    await expect(page.locator('button:has-text("WebGPU View")')).toBeVisible();
    await expect(page.locator('button:has-text("Reset Quantum State")')).toBeVisible();
    
    // 3Dキャンバスの存在確認
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // キャンバスサイズの確認
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox?.width).toBeGreaterThan(300);
    expect(canvasBox?.height).toBeGreaterThan(300);
  });

  test('量子ノードのインタラクション', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    // キャンバスの中心をクリック（ノードの選択を試みる）
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      
      // 選択結果の表示を待つ
      const result = page.locator('text=量子状態が収束しました');
      await expect(result).toBeVisible({ timeout: 5000 });
      
      // 補助金詳細の表示確認
      await expect(page.locator('text=最大金額')).toBeVisible();
      await expect(page.locator('text=マッチ度')).toBeVisible();
    }
  });

  test('WebGPUビューの切り替え', async ({ page }) => {
    // WebGPUビューに切り替え
    await page.click('button:has-text("WebGPU View")');
    
    // レンダラータイプの表示を確認
    await expect(page.locator('text=/WebGL|WebGPU/')).toBeVisible();
    
    // 標準ビューに戻す
    await page.click('button:has-text("Standard View")');
    
    // 3Dキャンバスが再表示されることを確認
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('3Dシーンの回転とズーム', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    
    if (box) {
      // ドラッグによる回転
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.7);
      await page.mouse.up();
      
      // マウスホイールによるズーム
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(500);
      await page.mouse.wheel(0, 100);
    }
  });

  test('タッチデバイス対応（エミュレーション）', async ({ page, context }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // タッチ操作のヒントが表示されることを確認
    await page.reload();
    await page.waitForSelector('canvas');
    
    const touchHint = page.locator('text=タッチ操作対応');
    const isMobileHint = await touchHint.isVisible();
    
    if (isMobileHint) {
      expect(await touchHint.textContent()).toContain('ピンチ・スワイプ可能');
    }
  });

  test('量子状態のリセット', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    // まず量子ノードを選択
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      
      // 選択結果が表示されるのを待つ
      await expect(page.locator('text=量子状態が収束しました')).toBeVisible();
      
      // リセットボタンをクリック
      await page.click('button:has-text("Reset Quantum State")');
      
      // 選択結果が消えることを確認
      await expect(page.locator('text=量子状態が収束しました')).not.toBeVisible();
    }
  });

  test('パフォーマンス測定', async ({ page }) => {
    // パフォーマンスメトリクスの取得
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frames = 0;
        const startTime = performance.now();
        
        const countFrames = () => {
          frames++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrames);
          } else {
            resolve({
              fps: frames,
              memory: (performance as any).memory?.usedJSHeapSize || 0
            });
          }
        };
        
        requestAnimationFrame(countFrames);
      });
    });
    
    // 60 FPSの目標に対して最低30 FPS以上を確認
    expect((metrics as any).fps).toBeGreaterThan(30);
  });

  test('補助金情報の表示確認', async ({ page }) => {
    // 技術仕様セクションの確認
    await expect(page.locator('text=量子重ね合わせ')).toBeVisible();
    await expect(page.locator('text=エンタングルメント')).toBeVisible();
    await expect(page.locator('text=多次元解析')).toBeVisible();
    
    // 説明文の確認
    const superpositionDesc = page.locator('text=全ての補助金候補が同時に存在する状態を可視化');
    await expect(superpositionDesc).toBeVisible();
  });

  test('アクセシビリティチェック', async ({ page }) => {
    // キーボードナビゲーション
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // フォーカスされた要素の確認
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe('BUTTON');
    
    // スクリーンリーダー用のaria属性確認
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('レスポンシブデザインの確認', async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    let canvas = page.locator('canvas');
    expect(await canvas.isVisible()).toBe(true);
    
    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    expect(await canvas.isVisible()).toBe(true);
    
    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    expect(await canvas.isVisible()).toBe(true);
  });

  test('エラーハンドリング', async ({ page }) => {
    // コンソールエラーの監視
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // ページのリロード
    await page.reload();
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000);
    
    // エラーがないことを確認
    expect(consoleErrors.length).toBe(0);
  });
});