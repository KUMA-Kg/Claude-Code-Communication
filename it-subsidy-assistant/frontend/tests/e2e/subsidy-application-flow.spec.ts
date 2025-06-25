/**
 * 補助金申請フローE2Eテストシナリオ
 * 3つの主要補助金の完全な申請フローをテスト
 */

import { test, expect, Page } from '@playwright/test';
import { SubsidyDataValidator } from '../../src/validators/subsidy-data-validator';

// テストデータ
const TEST_COMPANY_DATA = {
  companyName: 'テスト株式会社',
  companyNameKana: 'テストカブシキガイシャ',
  corporateNumber: '1234567890123',
  postalCode: '100-0001',
  address: '東京都千代田区千代田1-1',
  phoneNumber: '03-1234-5678',
  email: 'test@example.com',
  representative: '山田太郎',
  establishmentDate: '2020-01-01',
  capital: '10000000',
  employees: '50'
};

// 補助金タイプ別のテストシナリオ
const SUBSIDY_SCENARIOS = [
  {
    type: 'it-donyu',
    name: 'IT導入補助金',
    maxAmount: 4500000,
    expectedDocuments: ['事業計画書', '見積書', '履歴事項全部証明書', '納税証明書']
  },
  {
    type: 'jizokuka',
    name: '持続化補助金',
    maxAmount: 2000000,
    expectedDocuments: ['経営計画書', '補助事業計画書', '確定申告書', '開業届']
  },
  {
    type: 'monozukuri',
    name: 'ものづくり補助金',
    maxAmount: 50000000,
    expectedDocuments: ['事業計画書', '決算書', '賃金台帳', '労働者名簿']
  }
];

test.describe('補助金申請フロー E2Eテスト', () => {
  let validator: SubsidyDataValidator;

  test.beforeAll(() => {
    validator = new SubsidyDataValidator();
  });

  test.beforeEach(async ({ page }) => {
    // 初期設定
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // パフォーマンス計測開始
    await page.evaluate(() => {
      window.performance.mark('test-start');
    });
  });

  test.afterEach(async ({ page }) => {
    // パフォーマンス計測終了
    const metrics = await page.evaluate(() => {
      window.performance.mark('test-end');
      window.performance.measure('test-duration', 'test-start', 'test-end');
      const measure = window.performance.getEntriesByName('test-duration')[0];
      return {
        duration: measure.duration,
        memory: (window.performance as any).memory?.usedJSHeapSize
      };
    });
    
    console.log(`テスト実行時間: ${metrics.duration}ms`);
    console.log(`メモリ使用量: ${metrics.memory ? Math.round(metrics.memory / 1024 / 1024) + 'MB' : 'N/A'}`);
  });

  // 各補助金タイプのE2Eテスト
  for (const scenario of SUBSIDY_SCENARIOS) {
    test(`${scenario.name}の完全申請フロー`, async ({ page }) => {
      // ステップ1: 診断開始
      await test.step('診断質問への回答', async () => {
        await page.click('[data-testid="start-diagnosis"]');
        
        // 企業規模の選択
        await page.click(`[data-testid="company-size-${scenario.type === 'monozukuri' ? 'large' : 'small'}"]`);
        
        // 業種の選択
        await page.selectOption('[data-testid="industry-select"]', 'manufacturing');
        
        // 導入目的の選択（補助金タイプに応じて）
        if (scenario.type === 'it-donyu') {
          await page.click('[data-testid="purpose-it-efficiency"]');
        } else if (scenario.type === 'jizokuka') {
          await page.click('[data-testid="purpose-business-continuity"]');
        } else {
          await page.click('[data-testid="purpose-equipment-upgrade"]');
        }
        
        await page.click('[data-testid="submit-diagnosis"]');
      });

      // ステップ2: 補助金選択
      await test.step('推奨補助金の選択', async () => {
        // 推奨結果の確認
        await expect(page.locator(`[data-testid="subsidy-card-${scenario.type}"]`)).toBeVisible();
        
        // スコアとマッチ度の確認
        const matchScore = await page.locator(`[data-testid="match-score-${scenario.type}"]`).textContent();
        expect(parseInt(matchScore || '0')).toBeGreaterThan(70);
        
        // 補助金を選択
        await page.click(`[data-testid="select-subsidy-${scenario.type}"]`);
      });

      // ステップ3: 必要書類確認
      await test.step('必要書類のチェックリスト確認', async () => {
        // 必要書類リストの表示確認
        for (const doc of scenario.expectedDocuments) {
          await expect(page.locator(`text=${doc}`)).toBeVisible();
        }
        
        // 書類準備状況のチェック
        for (const doc of scenario.expectedDocuments) {
          await page.click(`[data-testid="doc-checkbox-${doc}"]`);
        }
        
        // 全書類チェック完了の確認
        const progress = await page.locator('[data-testid="document-progress"]').getAttribute('data-value');
        expect(progress).toBe('100');
        
        await page.click('[data-testid="proceed-to-form"]');
      });

      // ステップ4: 申請書作成
      await test.step('申請フォームの入力', async () => {
        // 基本情報の入力
        await fillCompanyInfo(page, TEST_COMPANY_DATA);
        
        // 補助金固有の情報入力
        await fillSubsidySpecificInfo(page, scenario.type);
        
        // 入力検証
        await validateFormInputs(page);
        
        await page.click('[data-testid="save-draft"]');
        await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
      });

      // ステップ5: 確認・提出
      await test.step('最終確認と提出', async () => {
        await page.click('[data-testid="preview-application"]');
        
        // プレビュー画面の確認
        await expect(page.locator('[data-testid="preview-modal"]')).toBeVisible();
        
        // PDF生成
        await page.click('[data-testid="generate-pdf"]');
        const download = await page.waitForEvent('download');
        expect(download.suggestedFilename()).toContain(scenario.type);
        
        // 最終確認チェックボックス
        await page.click('[data-testid="final-confirmation"]');
        
        // 提出（モックモードでは実際には送信しない）
        await page.click('[data-testid="submit-application"]');
        await expect(page.locator('[data-testid="submission-complete"]')).toBeVisible();
      });
    });
  }

  // データ整合性テスト
  test('申請データの整合性検証', async ({ page }) => {
    await test.step('データ検証システムのテスト', async () => {
      // 不正なデータでのテスト
      await page.goto('/application-form');
      
      // 不正な法人番号
      await page.fill('[data-testid="corporate-number"]', '123'); // 13桁未満
      await page.click('[data-testid="validate-form"]');
      
      await expect(page.locator('[data-testid="error-corporate-number"]')).toContainText('13桁');
      
      // 将来の日付での設立年月日
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      await page.fill('[data-testid="establishment-date"]', futureDate.toISOString().split('T')[0]);
      
      await page.click('[data-testid="validate-form"]');
      await expect(page.locator('[data-testid="error-establishment-date"]')).toBeVisible();
    });
  });

  // 多言語対応テスト
  test('日本語・英語切り替えテスト', async ({ page }) => {
    await test.step('言語切り替え機能の検証', async () => {
      // 初期状態（日本語）の確認
      await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
      await expect(page.locator('[data-testid="app-title"]')).toContainText('IT補助金申請支援システム');
      
      // 英語に切り替え
      await page.click('[data-testid="language-switch"]');
      await page.click('[data-testid="language-en"]');
      
      // 英語表示の確認
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('[data-testid="app-title"]')).toContainText('IT Subsidy Application Support System');
      
      // フォームラベルの翻訳確認
      await page.goto('/application-form');
      await expect(page.locator('label[for="company-name"]')).toContainText('Company Name');
      
      // 日本語に戻す
      await page.click('[data-testid="language-switch"]');
      await page.click('[data-testid="language-ja"]');
      await expect(page.locator('label[for="company-name"]')).toContainText('法人名');
    });
  });

  // エラーリカバリーテスト
  test('エラー処理とリカバリー', async ({ page }) => {
    await test.step('ネットワークエラーのハンドリング', async () => {
      // ネットワークを切断
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/application-form');
      await fillCompanyInfo(page, TEST_COMPANY_DATA);
      await page.click('[data-testid="save-draft"]');
      
      // エラーメッセージの表示
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      
      // リトライ機能
      await page.unroute('**/api/**');
      await page.click('[data-testid="retry-save"]');
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    });
  });

  // パフォーマンステスト
  test('大量データでのパフォーマンス', async ({ page }) => {
    await test.step('100件の書類リスト表示パフォーマンス', async () => {
      // モックデータを生成
      await page.evaluate(() => {
        const documents = Array.from({ length: 100 }, (_, i) => ({
          id: `doc-${i}`,
          name: `書類${i + 1}`,
          required: Math.random() > 0.5,
          status: Math.random() > 0.5 ? 'completed' : 'pending'
        }));
        
        (window as any).mockDocuments = documents;
      });
      
      const startTime = Date.now();
      await page.goto('/document-checklist');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // 3秒以内
      
      // スクロールパフォーマンス
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // FPSの確認（60fps維持）
      const fps = await page.evaluate(() => {
        return new Promise(resolve => {
          let frames = 0;
          const startTime = performance.now();
          
          function countFrames() {
            frames++;
            if (performance.now() - startTime < 1000) {
              requestAnimationFrame(countFrames);
            } else {
              resolve(frames);
            }
          }
          
          requestAnimationFrame(countFrames);
        });
      });
      
      expect(Number(fps)).toBeGreaterThan(30); // 最低30fps
    });
  });
});

// ヘルパー関数
async function fillCompanyInfo(page: Page, data: typeof TEST_COMPANY_DATA) {
  await page.fill('[data-testid="company-name"]', data.companyName);
  await page.fill('[data-testid="company-name-kana"]', data.companyNameKana);
  await page.fill('[data-testid="corporate-number"]', data.corporateNumber);
  await page.fill('[data-testid="postal-code"]', data.postalCode);
  await page.fill('[data-testid="address"]', data.address);
  await page.fill('[data-testid="phone-number"]', data.phoneNumber);
  await page.fill('[data-testid="email"]', data.email);
  await page.fill('[data-testid="representative"]', data.representative);
  await page.fill('[data-testid="establishment-date"]', data.establishmentDate);
  await page.fill('[data-testid="capital"]', data.capital);
  await page.fill('[data-testid="employees"]', data.employees);
}

async function fillSubsidySpecificInfo(page: Page, subsidyType: string) {
  switch (subsidyType) {
    case 'it-donyu':
      await page.fill('[data-testid="it-tool-name"]', 'クラウド会計システム');
      await page.fill('[data-testid="monthly-cost"]', '50000');
      await page.selectOption('[data-testid="implementation-period"]', '6months');
      break;
    
    case 'jizokuka':
      await page.fill('[data-testid="business-plan"]', '新規顧客開拓のためのECサイト構築');
      await page.fill('[data-testid="expected-effect"]', '売上30%向上');
      break;
    
    case 'monozukuri':
      await page.fill('[data-testid="equipment-name"]', '最新型CNC工作機械');
      await page.fill('[data-testid="investment-amount"]', '30000000');
      await page.fill('[data-testid="productivity-improvement"]', '生産性50%向上');
      break;
  }
}

async function validateFormInputs(page: Page) {
  // 各フィールドのバリデーション状態を確認
  const fields = await page.$$('[data-testid^="error-"]');
  expect(fields.length).toBe(0);
  
  // 必須フィールドの確認
  const requiredFields = await page.$$('[required]');
  for (const field of requiredFields) {
    const value = await field.inputValue();
    expect(value).not.toBe('');
  }
}