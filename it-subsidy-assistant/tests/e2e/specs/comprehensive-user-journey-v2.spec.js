/**
 * 包括的ユーザージャーニーテスト v2
 * 6つの質問→補助金選択→必要書類→Excel出力の完全フロー
 */

const { test, expect } = require('@playwright/test');

test.describe('包括的ユーザージャーニー v2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/IT補助金アシストツール/);
  });

  test('IT導入補助金完全フロー - 質問からExcel出力まで', async ({ page }) => {
    // 1. 診断開始
    await page.click('button:has-text("診断を開始する")');
    await expect(page.locator('h2')).toContainText('あなたの事業の現在の状況を教えてください');
    
    // 2. 6つの質問に回答（IT導入補助金が推奨されるパターン）
    await page.click('[data-testid="answer-existing"]');
    await page.click('[data-testid="answer-small"]');
    await page.click('[data-testid="answer-it"]');
    await page.click('[data-testid="answer-digital"]');
    await page.click('[data-testid="answer-100to500"]');
    await page.click('[data-testid="answer-quarter"]');
    
    // 3. 診断結果確認
    await expect(page.locator('h2')).toContainText('診断完了！');
    const recommendedCard = page.locator('.border-blue-500');
    await expect(recommendedCard).toContainText('IT導入補助金2025');
    
    // 4. 申請準備開始
    await recommendedCard.locator('button:has-text("この補助金で申請準備を始める")').click();
    
    // 5. 必要書類画面確認
    await expect(page.locator('h2')).toContainText('必要書類の確認');
    await expect(page.locator('[data-testid="required-document"]')).toHaveCount.toBeGreaterThan(0);
    
    // 6. 会社情報入力
    await page.fill('[data-testid="company-name"]', 'テスト株式会社');
    await page.fill('[data-testid="representative-name"]', '山田太郎');
    await page.fill('[data-testid="application-amount"]', '1000000');
    await page.fill('[data-testid="expected-effect"]', '業務効率の大幅改善');
    
    // 7. Excel生成実行
    await page.click('button:has-text("Excel書類を生成する")');
    
    // 8. 生成完了確認
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('[data-testid="download-link"]')).toHaveCount.toBeGreaterThan(0);
    
    // 9. ダウンロードリンクの動作確認
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-link"]').first();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  });

  test('ものづくり補助金完全フロー', async ({ page }) => {
    // 診断開始
    await page.click('button:has-text("診断を開始する")');
    
    // ものづくり補助金が推奨される回答パターン
    await page.click('[data-testid="answer-existing"]');
    await page.click('[data-testid="answer-medium"]');
    await page.click('[data-testid="answer-manufacturing"]');
    await page.click('[data-testid="answer-facility"]');
    await page.click('[data-testid="answer-over1000"]');
    await page.click('[data-testid="answer-half"]');
    
    // 結果確認
    const recommendedCard = page.locator('.border-blue-500');
    await expect(recommendedCard).toContainText('ものづくり補助金');
    
    // 申請準備
    await recommendedCard.locator('button').click();
    
    // 製造業特有の入力項目確認
    await expect(page.locator('[data-testid="manufacturing-field"]')).toBeVisible();
    await page.fill('[data-testid="company-name"]', 'ものづくり有限会社');
    await page.fill('[data-testid="representative-name"]', '田中花子');
    await page.fill('[data-testid="application-amount"]', '5000000');
    
    // Excel生成
    await page.click('button:has-text("Excel書類を生成する")');
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('持続化補助金完全フロー', async ({ page }) => {
    // 診断開始
    await page.click('button:has-text("診断を開始する")');
    
    // 持続化補助金が推奨される回答パターン
    await page.click('[data-testid="answer-startup"]');
    await page.click('[data-testid="answer-micro"]');
    await page.click('[data-testid="answer-retail"]');
    await page.click('[data-testid="answer-sales"]');
    await page.click('[data-testid="answer-50to100"]');
    await page.click('[data-testid="answer-asap"]');
    
    // 結果確認
    const recommendedCard = page.locator('.border-blue-500');
    await expect(recommendedCard).toContainText('小規模事業者持続化補助金');
    
    // 申請準備
    await recommendedCard.locator('button').click();
    
    // 小規模事業者特有の入力項目確認
    await expect(page.locator('[data-testid="business-plan"]')).toBeVisible();
    await page.fill('[data-testid="company-name"]', '小規模商店');
    await page.fill('[data-testid="representative-name"]', '佐藤次郎');
    await page.fill('[data-testid="application-amount"]', '750000');
    
    // Excel生成
    await page.click('button:has-text("Excel書類を生成する")');
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('エラーハンドリング - 不正入力時の挙動', async ({ page }) => {
    await page.click('button:has-text("診断を開始する")');
    
    // 全質問回答
    await page.click('[data-testid="answer-existing"]');
    await page.click('[data-testid="answer-small"]');
    await page.click('[data-testid="answer-it"]');
    await page.click('[data-testid="answer-digital"]');
    await page.click('[data-testid="answer-100to500"]');
    await page.click('[data-testid="answer-quarter"]');
    
    // 申請準備画面へ
    await page.click('.border-blue-500 button');
    
    // 不正な値を入力
    await page.fill('[data-testid="company-name"]', '');
    await page.fill('[data-testid="application-amount"]', '-1000');
    
    // Excel生成を試行
    await page.click('button:has-text("Excel書類を生成する")');
    
    // エラーメッセージ確認
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('会社名は必須です');
    await expect(page.locator('.error-message')).toContainText('申請額は正の数値を入力してください');
  });

  test('レスポンシブ対応確認 - モバイル表示', async ({ page }) => {
    // モバイルサイズにリサイズ
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.click('button:has-text("診断を開始する")');
    
    // モバイルでの質問表示確認
    await expect(page.locator('h2')).toBeVisible();
    await expect(page.locator('[data-testid="answer-existing"]')).toBeVisible();
    
    // 質問に回答
    await page.click('[data-testid="answer-existing"]');
    await page.click('[data-testid="answer-small"]');
    await page.click('[data-testid="answer-it"]');
    await page.click('[data-testid="answer-digital"]');
    await page.click('[data-testid="answer-100to500"]');
    await page.click('[data-testid="answer-quarter"]');
    
    // モバイルでの結果表示確認
    await expect(page.locator('.border-blue-500')).toBeVisible();
    
    // モバイルでのスクロール動作確認
    await page.locator('.border-blue-500').scrollIntoViewIfNeeded();
    await page.click('.border-blue-500 button');
    
    // モバイルでの入力フォーム確認
    await expect(page.locator('[data-testid="company-name"]')).toBeVisible();
  });

  test('ダークモード対応確認', async ({ page }) => {
    // ダークモードトグル
    await page.click('[data-testid="dark-mode-toggle"]');
    
    // ダークモードのCSS確認
    const body = page.locator('body');
    await expect(body).toHaveClass(/dark/);
    
    // 診断フロー実行
    await page.click('button:has-text("診断を開始する")');
    await page.click('[data-testid="answer-existing"]');
    
    // ダークモードでの可読性確認
    const questionText = page.locator('h2');
    await expect(questionText).toBeVisible();
    
    // ライトモードに戻す
    await page.click('[data-testid="dark-mode-toggle"]');
    await expect(body).not.toHaveClass(/dark/);
  });

  test('戻る・やり直し機能の完全テスト', async ({ page }) => {
    await page.click('button:has-text("診断を開始する")');
    
    // 質問3まで進む
    await page.click('[data-testid="answer-existing"]');
    await page.click('[data-testid="answer-small"]');
    await page.click('[data-testid="answer-it"]');
    
    // 2回戻る
    await page.click('button:has-text("前の質問に戻る")');
    await page.click('button:has-text("前の質問に戻る")');
    
    // 質問1に戻ったことを確認
    await expect(page.locator('h2')).toContainText('あなたの事業の現在の状況を教えてください');
    
    // 改めて全質問に回答
    await page.click('[data-testid="answer-startup"]');
    await page.click('[data-testid="answer-micro"]');
    await page.click('[data-testid="answer-retail"]');
    await page.click('[data-testid="answer-sales"]');
    await page.click('[data-testid="answer-50to100"]');
    await page.click('[data-testid="answer-asap"]');
    
    // 結果画面で「もう一度診断する」
    await page.click('button:has-text("もう一度診断する")');
    await expect(page.locator('h2')).toContainText('あなたの事業の現在の状況を教えてください');
  });

  test('パフォーマンス確認 - 応答速度', async ({ page }) => {
    const startTime = Date.now();
    
    await page.click('button:has-text("診断を開始する")');
    
    // 各質問の応答速度を測定
    for (const answer of ['answer-existing', 'answer-small', 'answer-it', 'answer-digital', 'answer-100to500']) {
      const questionTime = Date.now();
      await page.click(`[data-testid="${answer}"]`);
      await page.waitForSelector('h2');
      const responseTime = Date.now() - questionTime;
      expect(responseTime).toBeLessThan(1000); // 1秒以内
    }
    
    // 最終質問
    await page.click('[data-testid="answer-quarter"]');
    
    // 結果表示までの時間
    const resultTime = Date.now();
    await page.waitForSelector('.border-blue-500');
    const totalResponseTime = Date.now() - resultTime;
    expect(totalResponseTime).toBeLessThan(3000); // 3秒以内
    
    const totalTime = Date.now() - startTime;
    console.log(`Total journey time: ${totalTime}ms`);
  });
});