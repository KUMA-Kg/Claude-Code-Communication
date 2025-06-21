/**
 * 必要書類動的質問フロー E2Eテスト
 * 補助金の種類や企業の状況に応じた動的な質問分岐
 */

const { test, expect } = require('@playwright/test');

test.describe('必要書類動的質問フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/document-requirements');
    await expect(page).toHaveTitle(/IT補助金アシストツール/);
  });

  test('IT導入補助金 - 通常枠の書類要求フロー', async ({ page }) => {
    // 補助金選択
    await page.selectOption('[data-testid="subsidy-type"]', 'it-tsujyo');
    
    // 企業形態の質問
    await expect(page.locator('h3')).toContainText('企業形態を選択してください');
    await page.click('[data-testid="company-type-corporation"]'); // 法人
    
    // 創業年数の質問
    await expect(page.locator('h3')).toContainText('創業から何年経過していますか？');
    await page.click('[data-testid="years-over-3"]'); // 3年以上
    
    // ITツール導入経験
    await expect(page.locator('h3')).toContainText('ITツールの導入経験はありますか？');
    await page.click('[data-testid="it-experience-yes"]');
    
    // クラウドサービス利用
    await expect(page.locator('h3')).toContainText('今回導入予定のITツールはクラウドサービスですか？');
    await page.click('[data-testid="cloud-service-yes"]');
    
    // 結果表示
    await expect(page.locator('[data-testid="required-documents-list"]')).toBeVisible();
    
    // 必須書類の確認
    const requiredDocs = page.locator('[data-testid="required-doc"]');
    await expect(requiredDocs).toContainText('履歴事項全部証明書');
    await expect(requiredDocs).toContainText('納税証明書');
    await expect(requiredDocs).toContainText('決算書（直近3期分）');
    await expect(requiredDocs).toContainText('事業計画書');
    await expect(requiredDocs).toContainText('gBizIDプライムアカウント');
  });

  test('IT導入補助金 - セキュリティ対策推進枠の追加書類', async ({ page }) => {
    // 補助金選択
    await page.selectOption('[data-testid="subsidy-type"]', 'it-security');
    
    // 基本質問に回答
    await page.click('[data-testid="company-type-corporation"]');
    await page.click('[data-testid="years-over-3"]');
    await page.click('[data-testid="it-experience-yes"]');
    
    // セキュリティ対策特有の質問
    await expect(page.locator('h3')).toContainText('情報セキュリティ基本方針を策定していますか？');
    await page.click('[data-testid="security-policy-no"]');
    
    // SECURITY ACTION宣言
    await expect(page.locator('h3')).toContainText('SECURITY ACTIONを宣言していますか？');
    await page.click('[data-testid="security-action-planning"]'); // 今後宣言予定
    
    // 結果に追加書類が含まれることを確認
    await expect(page.locator('[data-testid="required-doc"]')).toContainText('情報セキュリティ基本方針策定のサポート資料');
    await expect(page.locator('[data-testid="required-doc"]')).toContainText('SECURITY ACTION宣言の手引き');
  });

  test('ものづくり補助金 - 設備投資に関する書類分岐', async ({ page }) => {
    // 補助金選択
    await page.selectOption('[data-testid="subsidy-type"]', 'monozukuri');
    
    // 基本情報
    await page.click('[data-testid="company-type-corporation"]');
    await page.click('[data-testid="years-over-3"]');
    
    // 設備投資の種類
    await expect(page.locator('h3')).toContainText('導入予定の設備・システムの種類は？');
    await page.click('[data-testid="equipment-type-machine"]'); // 機械装置
    
    // 既存設備の有無
    await expect(page.locator('h3')).toContainText('同種の設備を既に保有していますか？');
    await page.click('[data-testid="existing-equipment-yes"]');
    
    // 追加書類の確認
    await expect(page.locator('[data-testid="required-doc"]')).toContainText('既存設備の仕様書・カタログ');
    await expect(page.locator('[data-testid="required-doc"]')).toContainText('設備比較表');
    await expect(page.locator('[data-testid="required-doc"]')).toContainText('生産性向上の根拠資料');
  });

  test('持続化補助金 - 創業枠と通常枠の分岐', async ({ page }) => {
    // 補助金選択
    await page.selectOption('[data-testid="subsidy-type"]', 'jizokuka');
    
    // 企業形態
    await page.click('[data-testid="company-type-individual"]'); // 個人事業主
    
    // 創業状況の確認
    await expect(page.locator('h3')).toContainText('事業の開始時期を教えてください');
    await page.click('[data-testid="business-start-planning"]'); // これから創業予定
    
    // 創業枠特有の質問
    await expect(page.locator('h3')).toContainText('創業に向けた準備状況は？');
    await page.click('[data-testid="startup-preparation-planning"]'); // 事業計画作成中
    
    // 創業枠特有の書類確認
    await expect(page.locator('[data-testid="required-doc"]')).toContainText('創業計画書');
    await expect(page.locator('[data-testid="required-doc"]')).toContainText('資金調達計画書');
    await expect(page.locator('[data-testid="required-doc"]')).toContainText('認定経営革新等支援機関の確認書');
    
    // 通常枠の書類が表示されないことを確認
    await expect(page.locator('[data-testid="required-doc"]')).not.toContainText('決算書');
  });

  test('動的な質問分岐 - 条件変更による再表示', async ({ page }) => {
    // IT導入補助金を選択
    await page.selectOption('[data-testid="subsidy-type"]', 'it-tsujyo');
    
    // 法人として回答
    await page.click('[data-testid="company-type-corporation"]');
    await page.click('[data-testid="years-over-3"]');
    
    // 戦るボタンで個人事業主に変更
    await page.click('[data-testid="change-company-type"]');
    await page.click('[data-testid="company-type-individual"]');
    
    // 質問が変わったことを確認
    await expect(page.locator('h3')).toContainText('開業届を提出していますか？');
    await page.click('[data-testid="business-registration-yes"]');
    
    // 個人事業主特有の書類が表示されることを確認
    await expect(page.locator('[data-testid="required-doc"]')).toContainText('開業届のコピー');
    await expect(page.locator('[data-testid="required-doc"]')).toContainText('確定申告書（直近）');
  });

  test('必要書類のダウンロード機能', async ({ page }) => {
    // 補助金選択と基本情報入力
    await page.selectOption('[data-testid="subsidy-type"]', 'it-tsujyo');
    await page.click('[data-testid="company-type-corporation"]');
    await page.click('[data-testid="years-over-3"]');
    await page.click('[data-testid="it-experience-yes"]');
    await page.click('[data-testid="cloud-service-yes"]');
    
    // 必要書類リストが表示される
    await expect(page.locator('[data-testid="required-documents-list"]')).toBeVisible();
    
    // PDFダウンロードボタンの確認
    const downloadButton = page.locator('[data-testid="download-checklist-pdf"]');
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toContainText('チェックリストをダウンロード');
    
    // ダウンロードイベントのリスナー設定
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;
    
    // ファイル名の確認
    expect(download.suggestedFilename()).toMatch(/必要書類チェックリスト.*\.pdf/);
  });

  test('エラーハンドリング - 必須項目未入力', async ({ page }) => {
    // 補助金を選択せずに進もうとする
    await page.click('[data-testid="next-button"]');
    
    // エラーメッセージの表示
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('補助金の種類を選択してください');
    
    // 補助金を選択後、企業形態を選択せずに進む
    await page.selectOption('[data-testid="subsidy-type"]', 'it-tsujyo');
    await page.click('[data-testid="next-button"]');
    
    // 新しいエラーメッセージ
    await expect(page.locator('[data-testid="error-message"]')).toContainText('企業形態を選択してください');
  });
});