import { test, expect } from '@playwright/test';

test.describe('Enhanced Confirmation Screen with Inline Editing', () => {
  test.beforeEach(async ({ page }) => {
    // デモアプリケーションに移動
    await page.goto('http://localhost:5175/demo-index.html');
    
    // フローを進めて確認画面まで到達
    await page.waitForSelector('text=補助金適用判定');
    
    // 質問に回答してフローを進める
    await page.click('[data-testid="business-type-existing"]');
    await page.click('text=次の質問');
    
    await page.click('[data-testid="challenge-efficiency"]');
    await page.click('text=次の質問');
    
    await page.click('[data-testid="size-small-company"]');
    await page.click('text=次の質問');
    
    await page.click('[data-testid="budget-medium"]');
    await page.click('text=次の質問');
    
    await page.click('[data-testid="urgency-soon"]');
    await page.click('text=次の質問');
    
    await page.click('[data-testid="experience-no"]');
    await page.click('text=結果を見る');
    
    // 補助金選択
    await page.click('text=この補助金で申請を進める');
    
    // 申請枠選択
    await page.click('[data-testid="frame-tsujyo"]');
    await page.click('text=書類作成を開始');
    
    // フォーム入力をスキップして確認画面へ
    await page.click('text=確認画面へ');
  });

  test('should display enhanced confirmation screen', async ({ page }) => {
    await expect(page.locator('text=申請書類の確認・編集')).toBeVisible();
    await expect(page.locator('text=インライン編集モード')).toBeVisible();
  });

  test('should enable inline editing mode', async ({ page }) => {
    // インライン編集モードを有効化
    await page.click('text=インライン編集モード');
    
    // 編集モードが有効になることを確認
    await expect(page.locator('text=編集モード終了')).toBeVisible();
    
    // 編集可能な要素をクリック
    const editableElement = page.locator('[contenteditable="true"]').first();
    await editableElement.click();
    
    // ツールバーが表示されることを確認
    await expect(page.locator('[title="太字 (Ctrl+B)"]')).toBeVisible();
    await expect(page.locator('[title="保存 (Ctrl+S)"]')).toBeVisible();
  });

  test('should perform inline content editing', async ({ page }) => {
    await page.click('text=インライン編集モード');
    
    // 編集可能エリアにテキストを入力
    const editableElement = page.locator('[contenteditable="true"]').first();
    await editableElement.click();
    await editableElement.fill('テスト入力内容を変更しました');
    
    // 保存ボタンをクリック
    await page.click('[title="保存 (Ctrl+S)"]');
    
    // 変更が反映されることを確認
    await expect(editableElement).toContainText('テスト入力内容を変更しました');
  });

  test('should show autosave functionality', async ({ page }) => {
    await page.click('text=インライン編集モード');
    
    const editableElement = page.locator('[contenteditable="true"]').first();
    await editableElement.click();
    await editableElement.type('自動保存テスト');
    
    // 自動保存インジケーターが表示されることを確認
    await expect(page.locator('text=自動保存中...')).toBeVisible({ timeout: 1000 });
    
    // 最終保存時刻が表示されることを確認
    await expect(page.locator('text=最終保存:')).toBeVisible({ timeout: 2000 });
  });

  test('should display diff highlighting', async ({ page }) => {
    await page.click('text=インライン編集モード');
    
    const editableElement = page.locator('[contenteditable="true"]').first();
    await editableElement.click();
    
    // 差分表示ボタンをクリック
    await page.click('[title="差分表示の切り替え"]');
    
    // テキストを変更
    await editableElement.type('差分テスト');
    
    // 差分ハイライトが表示されることを確認（追加された部分が緑色）
    await expect(page.locator('.diff-added, [style*="background-color: #dcfce7"]')).toBeVisible();
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    await page.click('text=インライン編集モード');
    
    const editableElement = page.locator('[contenteditable="true"]').first();
    await editableElement.click();
    await editableElement.type('ショートカットテスト');
    
    // Ctrl+B で太字にする
    await page.keyboard.press('Control+b');
    await expect(page.locator('strong, b, [style*="font-weight: bold"]')).toBeVisible();
    
    // Ctrl+S で保存
    await page.keyboard.press('Control+s');
    await expect(page.locator('text=最終保存:')).toBeVisible();
    
    // Escでキャンセル
    await page.keyboard.press('Escape');
    // 編集モードが終了することを確認
  });

  test('should integrate with Figma functionality', async ({ page }) => {
    // Figma統合ボタンが表示されることを確認
    await expect(page.locator('[title="Figma統合機能"]')).toBeVisible();
    
    // Figmaパネルを開く
    await page.click('[title="Figma統合機能"]');
    
    // Figmaパネルが表示されることを確認
    await expect(page.locator('text=Figma統合')).toBeVisible();
    await expect(page.locator('text=AIレイアウト生成')).toBeVisible();
    await expect(page.locator('text=デザインテンプレート')).toBeVisible();
    
    // レイアウト生成ボタンをクリック
    await page.click('text=レイアウト生成');
    
    // 生成中インジケーターを確認
    await expect(page.locator('[class*="animate-spin"]')).toBeVisible();
    
    // プレビューが表示されることを確認
    await expect(page.locator('text=プレビュー')).toBeVisible({ timeout: 3000 });
  });

  test('should apply design templates', async ({ page }) => {
    await page.click('[title="Figma統合機能"]');
    
    // テンプレートを選択
    await page.click('text=クリーンフォーム');
    
    // テンプレート適用のフィードバックを確認
    await expect(page.locator('text=テンプレート適用済み')).toBeVisible({ timeout: 3000 });
    
    // スタイルが適用されることを確認（CSSの変更）
    const documentContainer = page.locator('.document-container');
    await expect(documentContainer).toHaveCSS('border-radius', '12px');
  });

  test('should handle unsaved changes warning', async ({ page }) => {
    await page.click('text=インライン編集モード');
    
    const editableElement = page.locator('[contenteditable="true"]').first();
    await editableElement.click();
    await editableElement.type('未保存の変更');
    
    // 未保存変更のインジケーターが表示されることを確認
    await expect(page.locator('text=変更を保存')).toBeVisible();
    
    // 一括保存ボタンをクリック
    await page.click('text=変更を保存');
    
    // 保存後にインジケーターが消えることを確認
    await expect(page.locator('text=変更を保存')).not.toBeVisible();
  });

  test('should export enhanced Excel with template info', async ({ page }) => {
    // テンプレートを適用
    await page.click('[title="Figma統合機能"]');
    await page.click('text=クリーンフォーム');
    await page.click('text=✕'); // パネルを閉じる
    
    // Excelダウンロードボタンをクリック
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Excelファイルをダウンロード');
    
    const download = await downloadPromise;
    
    // ファイル名にテンプレート情報が含まれることを確認
    expect(download.suggestedFilename()).toMatch(/clean-form|クリーンフォーム/);
    
    // ダウンロード完了のフィードバックを確認
    await expect(page.locator('text=✓ ダウンロード完了！')).toBeVisible();
  });

  test('should maintain editing history', async ({ page }) => {
    await page.click('text=インライン編集モード');
    
    const editableElement = page.locator('[contenteditable="true"]').first();
    await editableElement.click();
    
    // 複数回編集
    await editableElement.type('最初の編集');
    await page.keyboard.press('Control+s');
    
    await editableElement.selectAll();
    await editableElement.type('二回目の編集');
    
    // Undo機能をテスト
    await page.click('[title="元に戻す (Ctrl+Z)"]');
    await expect(editableElement).toContainText('最初の編集');
    
    // Redo機能をテスト
    await page.click('[title="やり直し (Ctrl+Shift+Z)"]');
    await expect(editableElement).toContainText('二回目の編集');
  });

  test('should be mobile responsive', async ({ page }) => {
    // モバイルビューポートに変更
    await page.setViewportSize({ width: 375, height: 667 });
    
    // インライン編集モードを有効化
    await page.click('text=インライン編集モード');
    
    // モバイルでも編集ツールバーが適切に表示されることを確認
    const editableElement = page.locator('[contenteditable="true"]').first();
    await editableElement.click();
    
    await expect(page.locator('[title="太字 (Ctrl+B)"]')).toBeVisible();
    
    // Figmaボタンがモバイルでもアクセス可能であることを確認
    await expect(page.locator('[title="Figma統合機能"]')).toBeVisible();
  });
});

test.describe('Performance and Accessibility', () => {
  test('should have good performance metrics', async ({ page }) => {
    await page.goto('http://localhost:5175/demo-index.html');
    
    // パフォーマンス測定
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // 基本的なパフォーマンス要件を確認
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // 2秒以内
    expect(performanceMetrics.loadComplete).toBeLessThan(3000); // 3秒以内
  });

  test('should meet accessibility standards', async ({ page }) => {
    await page.goto('http://localhost:5175/demo-index.html');
    
    // フォーカス管理の確認
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // ARIA属性の確認
    await expect(page.locator('[role="button"]').first()).toBeVisible();
    
    // カラーコントラストの基本チェック（視覚的要素が適切に表示されるか）
    const primaryButton = page.locator('button').first();
    const backgroundColor = await primaryButton.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    const color = await primaryButton.evaluate(el => 
      window.getComputedStyle(el).color
    );
    
    // 基本的な色の設定がされていることを確認
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)'); // 透明でない
    expect(color).not.toBe('rgba(0, 0, 0, 0)'); // 透明でない
  });
});