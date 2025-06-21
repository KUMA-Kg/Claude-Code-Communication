/**
 * 補助金診断フロー E2Eテスト
 * 6つの質問フローから最適な補助金選択までの完全なユーザージャーニー
 */

const { test, expect } = require('@playwright/test');

test.describe('補助金診断フロー - 6つの質問', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/diagnosis');
    await expect(page).toHaveTitle(/IT補助金アシストツール/);
  });

  test('全質問完走テスト - IT導入補助金が最適と判定されるケース', async ({ page }) => {
    // 質問1: 事業の現在の状況
    await expect(page.locator('h2')).toContainText('あなたの事業の現在の状況を教えてください');
    await page.click('[data-testid="answer-existing"]');
    
    // プログレスバーの進捗確認
    await expect(page.locator('.bg-blue-500')).toHaveCSS('width', /16\.\d+%/);
    
    // 質問2: 従業員数
    await expect(page.locator('h2')).toContainText('従業員数（パート・アルバイト含む）を教えてください');
    await page.click('[data-testid="answer-small"]'); // 6〜20人
    
    // 質問3: 主な事業分野
    await expect(page.locator('h2')).toContainText('主な事業分野を教えてください');
    await page.click('[data-testid="answer-it"]'); // 情報通信業
    
    // 質問4: 投資で実現したいこと
    await expect(page.locator('h2')).toContainText('今回の投資で実現したいことは？');
    await page.click('[data-testid="answer-digital"]'); // 業務のデジタル化・効率化
    
    // 質問5: 想定している投資予算
    await expect(page.locator('h2')).toContainText('想定している投資予算を教えてください');
    await page.click('[data-testid="answer-100to500"]'); // 100万円〜500万円
    
    // 質問6: いつから取り組みを開始したいか
    await expect(page.locator('h2')).toContainText('いつから取り組みを開始したいですか？');
    await page.click('[data-testid="answer-quarter"]'); // 3ヶ月以内
    
    // 診断結果の表示確認
    await expect(page.locator('h2')).toContainText('診断完了！');
    await expect(page.locator('.border-blue-500')).toContainText('IT導入補助金2025');
    await expect(page.locator('.border-blue-500 .bg-blue-500')).toContainText('おすすめ');
    
    // スコアと適合度の確認
    const recommendedCard = page.locator('.border-blue-500');
    await expect(recommendedCard.locator('.text-2xl')).toContainText('%');
    await expect(recommendedCard).toContainText('適合度: 高');
    
    // 申請準備開始ボタンの確認
    await expect(recommendedCard.locator('button')).toContainText('この補助金で申請準備を始める');
  });

  test('全質問完走テスト - ものづくり補助金が最適と判定されるケース', async ({ page }) => {
    // 質問1: 事業の現在の状況
    await page.click('[data-testid="answer-existing"]');
    
    // 質問2: 従業員数
    await page.click('[data-testid="answer-medium"]'); // 21〜100人
    
    // 質問3: 主な事業分野
    await page.click('[data-testid="answer-manufacturing"]'); // 製造業
    
    // 質問4: 投資で実現したいこと
    await page.click('[data-testid="answer-facility"]'); // 設備投資・生産性向上
    
    // 質問5: 想定している投資予算
    await page.click('[data-testid="answer-over1000"]'); // 1000万円以上
    
    // 質問6: いつから取り組みを開始したいか
    await page.click('[data-testid="answer-half"]'); // 半年以内
    
    // 診断結果の確認
    await expect(page.locator('.border-blue-500')).toContainText('ものづくり補助金');
  });

  test('全質問完走テスト - 持続化補助金が最適と判定されるケース', async ({ page }) => {
    // 質問1: 事業の現在の状況
    await page.click('[data-testid="answer-startup"]'); // 創業して3年以内
    
    // 質問2: 従業員数
    await page.click('[data-testid="answer-micro"]'); // 2〜5人
    
    // 質問3: 主な事業分野
    await page.click('[data-testid="answer-retail"]'); // 小売業
    
    // 質問4: 投資で実現したいこと
    await page.click('[data-testid="answer-sales"]'); // 売上拡大・新規顧客開拓
    
    // 質問5: 想定している投資予算
    await page.click('[data-testid="answer-50to100"]'); // 50万円〜100万円
    
    // 質問6: いつから取り組みを開始したいか
    await page.click('[data-testid="answer-asap"]'); // すぐに開始したい
    
    // 診断結果の確認
    await expect(page.locator('.border-blue-500')).toContainText('小規模事業者持続化補助金');
  });

  test('戻るボタンの動作確認', async ({ page }) => {
    // 質問1に回答
    await page.click('[data-testid="answer-existing"]');
    
    // 質問2に回答
    await page.click('[data-testid="answer-small"]');
    
    // 質問3まで進む
    await expect(page.locator('h2')).toContainText('主な事業分野を教えてください');
    
    // 戻るボタンをクリック
    await page.click('button:has-text("前の質問に戻る")');
    
    // 質問2に戻ったことを確認
    await expect(page.locator('h2')).toContainText('従業員数（パート・アルバイト含む）を教えてください');
    
    // もう一度戻る
    await page.click('button:has-text("前の質問に戻る")');
    
    // 質問1に戻ったことを確認
    await expect(page.locator('h2')).toContainText('あなたの事業の現在の状況を教えてください');
    
    // 質問1では戻るボタンが表示されないことを確認
    await expect(page.locator('button:has-text("前の質問に戻る")')).not.toBeVisible();
  });

  test('もう一度診断するボタンの動作確認', async ({ page }) => {
    // 全質問に回答して結果画面まで進む
    await page.click('[data-testid="answer-existing"]');
    await page.click('[data-testid="answer-small"]');
    await page.click('[data-testid="answer-it"]');
    await page.click('[data-testid="answer-digital"]');
    await page.click('[data-testid="answer-100to500"]');
    await page.click('[data-testid="answer-quarter"]');
    
    // 結果画面が表示されたことを確認
    await expect(page.locator('h2')).toContainText('診断完了！');
    
    // 「もう一度診断する」をクリック
    await page.click('button:has-text("もう一度診断する")');
    
    // 最初の質問に戻ったことを確認
    await expect(page.locator('h2')).toContainText('あなたの事業の現在の状況を教えてください');
    await expect(page.locator('.bg-blue-500')).toHaveCSS('width', /16\.\d+%/);
  });

  test('プログレスバーの動作確認', async ({ page }) => {
    // 初期状態
    await expect(page.locator('span:has-text("質問 1 / 6")')).toBeVisible();
    await expect(page.locator('.bg-blue-500')).toHaveCSS('width', /16\.\d+%/);
    
    // 質問2へ
    await page.click('[data-testid="answer-existing"]');
    await expect(page.locator('span:has-text("質問 2 / 6")')).toBeVisible();
    await expect(page.locator('.bg-blue-500')).toHaveCSS('width', /33\.\d+%/);
    
    // 質問3へ
    await page.click('[data-testid="answer-small"]');
    await expect(page.locator('span:has-text("質問 3 / 6")')).toBeVisible();
    await expect(page.locator('.bg-blue-500')).toHaveCSS('width', /50%/);
    
    // 質問4へ
    await page.click('[data-testid="answer-it"]');
    await expect(page.locator('span:has-text("質問 4 / 6")')).toBeVisible();
    await expect(page.locator('.bg-blue-500')).toHaveCSS('width', /66\.\d+%/);
    
    // 質問5へ
    await page.click('[data-testid="answer-digital"]');
    await expect(page.locator('span:has-text("質問 5 / 6")')).toBeVisible();
    await expect(page.locator('.bg-blue-500')).toHaveCSS('width', /83\.\d+%/);
    
    // 質問6へ
    await page.click('[data-testid="answer-100to500"]');
    await expect(page.locator('span:has-text("質問 6 / 6")')).toBeVisible();
    await expect(page.locator('.bg-blue-500')).toHaveCSS('width', /100%/);
  });

  test('複数の補助金が表示される際の優先順位確認', async ({ page }) => {
    // バランスの取れた回答を選択
    await page.click('[data-testid="answer-existing"]');
    await page.click('[data-testid="answer-small"]');
    await page.click('[data-testid="answer-service"]');
    await page.click('[data-testid="answer-product"]'); // 新製品・サービス開発
    await page.click('[data-testid="answer-100to500"]');
    await page.click('[data-testid="answer-quarter"]');
    
    // 結果画面で3つの補助金が表示されることを確認
    const subsidyCards = page.locator('[data-testid="subsidy-card"]');
    await expect(subsidyCards).toHaveCount(3);
    
    // 最初のカードにのみ「おすすめ」ラベルがあることを確認
    await expect(page.locator('.border-blue-500 .bg-blue-500')).toHaveCount(1);
    await expect(page.locator('.border-blue-500')).toContainText('おすすめ');
    
    // 2番目と3番目のカードにはおすすめラベルがないことを確認
    const secondCard = subsidyCards.nth(1);
    const thirdCard = subsidyCards.nth(2);
    await expect(secondCard.locator('.bg-blue-500:has-text("おすすめ")')).not.toBeVisible();
    await expect(thirdCard.locator('.bg-blue-500:has-text("おすすめ")')).not.toBeVisible();
  });
});