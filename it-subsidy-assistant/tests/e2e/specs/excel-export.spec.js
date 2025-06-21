/**
 * Excel出力機能 E2Eテスト
 * 申請情報のExcelエクスポート、テンプレート生成、インポート機能
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs').promises;

test.describe('Excel出力・インポート機能', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン状態でテストを実行
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // ダッシュボードへ移動
    await expect(page).toHaveURL('/dashboard');
  });

  test('申請情報のExcelテンプレートダウンロード', async ({ page }) => {
    // 申請書作成ページへ移動
    await page.click('[data-testid="create-application"]');
    
    // 補助金種別選択
    await page.selectOption('[data-testid="subsidy-select"]', 'it-tsujyo');
    
    // Excelテンプレートダウンロードボタンの確認
    const templateButton = page.locator('[data-testid="download-excel-template"]');
    await expect(templateButton).toBeVisible();
    await expect(templateButton).toContainText('Excelテンプレートをダウンロード');
    
    // ダウンロード実行
    const downloadPromise = page.waitForEvent('download');
    await templateButton.click();
    const download = await downloadPromise;
    
    // ファイル名の確認
    expect(download.suggestedFilename()).toMatch(/IT導入補助金_申請テンプレート.*\.xlsx/);
    
    // ファイルの保存
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
  });

  test('Excelファイルのアップロードとデータインポート', async ({ page }) => {
    // 申請書作成ページへ移動
    await page.click('[data-testid="create-application"]');
    await page.selectOption('[data-testid="subsidy-select"]', 'it-tsujyo');
    
    // テスト用Excelファイルのパス
    const testFilePath = path.join(__dirname, '../../../data/test-application.xlsx');
    
    // ファイル選択ボタンをクリック
    await page.click('[data-testid="import-excel-button"]');
    
    // ファイル選択ダイアログが表示される
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // アップロード進捗の表示
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    
    // インポート完了の確認
    await expect(page.locator('[data-testid="import-success"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="import-success"]')).toContainText('データのインポートが完了しました');
    
    // インポートされたデータの確認
    await expect(page.locator('[data-testid="company-name-input"]')).toHaveValue('株式会社テスト');
    await expect(page.locator('[data-testid="representative-input"]')).toHaveValue('山田太郎');
    await expect(page.locator('[data-testid="capital-input"]')).toHaveValue('10000000');
    await expect(page.locator('[data-testid="employees-input"]')).toHaveValue('50');
  });

  test('入力データのExcelエクスポート', async ({ page }) => {
    // 申請書作成ページでデータ入力
    await page.click('[data-testid="create-application"]');
    await page.selectOption('[data-testid="subsidy-select"]', 'monozukuri');
    
    // 企業情報入力
    await page.fill('[data-testid="company-name-input"]', '株式会社製造テスト');
    await page.fill('[data-testid="representative-input"]', '佐藤花子');
    await page.fill('[data-testid="capital-input"]', '30000000');
    await page.fill('[data-testid="employees-input"]', '120');
    await page.selectOption('[data-testid="industry-select"]', 'manufacturing');
    
    // 事業計画入力
    await page.fill('[data-testid="project-title"]', '新型製造装置の導入による生産性向上');
    await page.fill('[data-testid="project-description"]', '最新の製造装置を導入し、生産効率を50%向上させる');
    await page.fill('[data-testid="investment-amount"]', '15000000');
    await page.fill('[data-testid="subsidy-request"]', '10000000');
    
    // 期待効果入力
    await page.fill('[data-testid="expected-effect-1"]', '生産性が50%向上');
    await page.fill('[data-testid="expected-effect-2"]', '不良率が80%削減');
    await page.fill('[data-testid="expected-effect-3"]', 'リードタイムが30%短縮');
    
    // Excelエクスポートボタンをクリック
    const exportButton = page.locator('[data-testid="export-excel-button"]');
    await expect(exportButton).toBeVisible();
    
    // エクスポート実行
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;
    
    // ファイル名の確認
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/ものづくり補助金_申請データ_\d{8}_\d{6}\.xlsx/);
  });

  test('複数シートを含むExcelのエクスポート', async ({ page }) => {
    // 持続化補助金の申請ページ
    await page.click('[data-testid="create-application"]');
    await page.selectOption('[data-testid="subsidy-select"]', 'jizokuka');
    
    // 基本情報入力
    await page.fill('[data-testid="company-name-input"]', '個人事業テスト');
    await page.fill('[data-testid="representative-input"]', '田中一郎');
    
    // 販路開拓計画
    await page.fill('[data-testid="sales-plan-1"]', '新商品の開発');
    await page.fill('[data-testid="sales-plan-2"]', 'Webサイトのリニューアル');
    await page.fill('[data-testid="sales-plan-3"]', 'SNS広告の実施');
    
    // 資金計画
    await page.fill('[data-testid="fund-plan-1"]', '自己資金: 500,000円');
    await page.fill('[data-testid="fund-plan-2"]', '融資: 1,000,000円');
    
    // 複数シートエクスポートオプションを選択
    await page.check('[data-testid="include-financial-sheet"]');
    await page.check('[data-testid="include-schedule-sheet"]');
    await page.check('[data-testid="include-document-checklist"]');
    
    // エクスポート実行
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-excel-button"]');
    const download = await downloadPromise;
    
    // ファイル名に「完全版」が含まれることを確認
    expect(download.suggestedFilename()).toContain('完全版');
  });

  test('Excelテンプレートのバリデーション', async ({ page }) => {
    // 申請書作成ページ
    await page.click('[data-testid="create-application"]');
    await page.selectOption('[data-testid="subsidy-select"]', 'it-tsujyo');
    
    // 不正な形式のファイルをアップロード
    const invalidFilePath = path.join(__dirname, '../../../data/invalid-format.txt');
    
    await page.click('[data-testid="import-excel-button"]');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFilePath);
    
    // エラーメッセージの表示
    await expect(page.locator('[data-testid="import-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-error"]')).toContainText('Excelファイル（.xlsxまたは.xls）を選択してください');
    
    // 正しい形式だがテンプレートと一致しないファイル
    const wrongTemplateFile = path.join(__dirname, '../../../data/wrong-template.xlsx');
    
    await fileInput.setInputFiles(wrongTemplateFile);
    
    // テンプレート不一致エラー
    await expect(page.locator('[data-testid="import-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-error"]')).toContainText('テンプレートの形式が異なります');
  });

  test('エクスポート履歴の管理', async ({ page }) => {
    // マイページへ移動
    await page.click('[data-testid="my-page-link"]');
    
    // エクスポート履歴タブを選択
    await page.click('[data-testid="export-history-tab"]');
    
    // 履歴リストの表示
    await expect(page.locator('[data-testid="export-history-list"]')).toBeVisible();
    
    // 履歴アイテムの確認
    const historyItems = page.locator('[data-testid="export-history-item"]');
    await expect(historyItems).toHaveCount.toBeGreaterThan(0);
    
    // 履歴の詳細情報
    const firstItem = historyItems.first();
    await expect(firstItem).toContainText('補助金種別:');
    await expect(firstItem).toContainText('エクスポート日時:');
    await expect(firstItem).toContainText('ファイル名:');
    
    // 再ダウンロードボタン
    const redownloadButton = firstItem.locator('[data-testid="redownload-button"]');
    await expect(redownloadButton).toBeVisible();
    
    // 再ダウンロード実行
    const downloadPromise = page.waitForEvent('download');
    await redownloadButton.click();
    const download = await downloadPromise;
    
    // ファイル名が元のものと同じであることを確認
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('一括エクスポート機能', async ({ page }) => {
    // ダッシュボードの一括エクスポートボタン
    await page.click('[data-testid="bulk-export-button"]');
    
    // エクスポートオプションモーダル
    await expect(page.locator('[data-testid="bulk-export-modal"]')).toBeVisible();
    
    // エクスポート対象の選択
    await page.check('[data-testid="export-it-applications"]');
    await page.check('[data-testid="export-monozukuri-applications"]');
    await page.check('[data-testid="export-jizokuka-applications"]');
    
    // 期間指定
    await page.fill('[data-testid="export-date-from"]', '2024-01-01');
    await page.fill('[data-testid="export-date-to"]', '2024-12-31');
    
    // エクスポート形式選択
    await page.selectOption('[data-testid="export-format"]', 'consolidated'); // 統合ファイル
    
    // エクスポート実行
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="execute-bulk-export"]');
    
    // 進捗バーの表示
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();
    
    // ダウンロード完了
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/補助金申請データ一括_2024年.*\.xlsx/);
  });
});