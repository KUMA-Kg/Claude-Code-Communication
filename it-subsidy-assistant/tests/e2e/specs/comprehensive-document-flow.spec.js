/**
 * 包括的必要書類判定フロー E2Eテスト
 * 全補助金の全分岐パターンを網羅的にテスト
 */

const { test, expect } = require('@playwright/test');

test.describe('包括的必要書類判定フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/document-requirements');
    await expect(page).toHaveTitle(/IT補助金アシストツール/);
  });

  // IT導入補助金の全分岐パターン
  test.describe('IT導入補助金 - 全分岐テスト', () => {
    const itSubsidyTypes = [
      { type: 'it-tsujyo', name: '通常枠' },
      { type: 'it-invoice', name: 'インボイス枠' },
      { type: 'it-security', name: 'セキュリティ対策推進枠' },
      { type: 'it-fukusu', name: '複数社連携IT導入枠' }
    ];

    const companyTypes = [
      { type: 'corporation', name: '法人', testId: 'company-type-corporation' },
      { type: 'individual', name: '個人事業主', testId: 'company-type-individual' },
      { type: 'nonprofit', name: 'NPO法人', testId: 'company-type-nonprofit' }
    ];

    const businessYears = [
      { years: 'under-1', name: '1年未満', testId: 'years-under-1' },
      { years: '1-3', name: '1-3年', testId: 'years-1-3' },
      { years: 'over-3', name: '3年以上', testId: 'years-over-3' }
    ];

    itSubsidyTypes.forEach(subsidyType => {
      companyTypes.forEach(companyType => {
        businessYears.forEach(businessYear => {
          test(`${subsidyType.name} - ${companyType.name} - ${businessYear.name}の書類要求`, async ({ page }) => {
            // 補助金タイプ選択
            await page.selectOption('[data-testid="subsidy-type"]', subsidyType.type);
            
            // 企業形態選択
            await page.click(`[data-testid="${companyType.testId}"]`);
            
            // 創業年数選択
            await page.click(`[data-testid="${businessYear.testId}"]`);
            
            // ITツール導入経験
            await page.click('[data-testid="it-experience-yes"]');
            
            // 結果の表示確認
            await expect(page.locator('[data-testid="required-documents-list"]')).toBeVisible();
            
            // 基本書類の確認
            const requiredDocs = page.locator('[data-testid="required-doc"]');
            
            if (companyType.type === 'corporation') {
              await expect(requiredDocs).toContainText('履歴事項全部証明書');
              if (businessYear.years === 'over-3') {
                await expect(requiredDocs).toContainText('決算書（直近3期分）');
              } else {
                await expect(requiredDocs).toContainText('決算書（設立以降全期分）');
              }
            } else if (companyType.type === 'individual') {
              await expect(requiredDocs).toContainText('開業届のコピー');
              await expect(requiredDocs).toContainText('確定申告書');
            }
            
            // 補助金タイプ固有の書類確認
            if (subsidyType.type === 'it-security') {
              await expect(requiredDocs).toContainText('SECURITY ACTION');
            } else if (subsidyType.type === 'it-invoice') {
              await expect(requiredDocs).toContainText('インボイス制度対応の説明資料');
            }
          });
        });
      });
    });
  });

  // 動的質問フローの分岐テスト
  test.describe('動的質問フローの詳細分岐', () => {
    test('IT導入補助金 - クラウド/オンプレミス分岐', async ({ page }) => {
      await page.selectOption('[data-testid="subsidy-type"]', 'it-tsujyo');
      await page.click('[data-testid="company-type-corporation"]');
      await page.click('[data-testid="years-over-3"]');
      await page.click('[data-testid="it-experience-yes"]');
      
      // クラウドサービス選択
      await page.click('[data-testid="cloud-service-yes"]');
      await expect(page.locator('[data-testid="required-doc"]')).toContainText('クラウドサービス利用規約');
      
      // 戻ってオンプレミス選択
      await page.click('[data-testid="back-button"]');
      await page.click('[data-testid="cloud-service-no"]');
      await expect(page.locator('[data-testid="required-doc"]')).toContainText('ハードウェア仕様書');
    });

    test('持続化補助金 - 創業時期による詳細分岐', async ({ page }) => {
      await page.selectOption('[data-testid="subsidy-type"]', 'jizokuka');
      await page.click('[data-testid="company-type-individual"]');
      
      // 創業1年未満
      await page.click('[data-testid="business-start-under-1"]');
      await expect(page.locator('h3')).toContainText('創業の届出状況は？');
      await page.click('[data-testid="startup-notification-completed"]');
      await expect(page.locator('[data-testid="required-doc"]')).toContainText('創業届出書');
      
      // 戻って創業予定に変更
      await page.click('[data-testid="change-startup-timing"]');
      await page.click('[data-testid="business-start-planning"]');
      await expect(page.locator('h3')).toContainText('創業予定時期は？');
      await page.click('[data-testid="startup-within-6months"]');
      await expect(page.locator('[data-testid="required-doc"]')).toContainText('創業計画書');
    });

    test('ものづくり補助金 - 設備投資額による分岐', async ({ page }) => {
      await page.selectOption('[data-testid="subsidy-type"]', 'monozukuri');
      await page.click('[data-testid="company-type-corporation"]');
      await page.click('[data-testid="years-over-3"]');
      
      // 設備投資額の質問
      await expect(page.locator('h3')).toContainText('設備投資予定額は？');
      
      // 1000万円以上の場合
      await page.click('[data-testid="investment-over-10million"]');
      await expect(page.locator('[data-testid="required-doc"]')).toContainText('投資計画詳細書');
      await expect(page.locator('[data-testid="required-doc"]')).toContainText('資金調達計画書');
      
      // 戻って1000万円未満に変更
      await page.click('[data-testid="change-investment-amount"]');
      await page.click('[data-testid="investment-under-10million"]');
      await expect(page.locator('[data-testid="required-doc"]')).not.toContainText('投資計画詳細書');
    });
  });

  // 特殊ケースの分岐テスト
  test.describe('特殊ケース・エッジケース', () => {
    test('複数補助金同時申請の書類重複確認', async ({ page }) => {
      // 最初の補助金設定
      await page.selectOption('[data-testid="subsidy-type"]', 'it-tsujyo');
      await page.click('[data-testid="company-type-corporation"]');
      await page.click('[data-testid="years-over-3"]');
      await page.click('[data-testid="it-experience-yes"]');
      
      // 複数申請の確認
      await expect(page.locator('h3')).toContainText('他の補助金も同時に申請予定ですか？');
      await page.click('[data-testid="multiple-application-yes"]');
      
      // 追加補助金選択
      await page.check('[data-testid="additional-subsidy-monozukuri"]');
      await page.check('[data-testid="additional-subsidy-jizokuka"]');
      
      // 重複書類の統合確認
      await expect(page.locator('[data-testid="document-consolidation"]')).toBeVisible();
      await expect(page.locator('[data-testid="consolidated-doc"]')).toContainText('履歴事項全部証明書（共通）');
    });

    test('外国人経営者の特別要件', async ({ page }) => {
      await page.selectOption('[data-testid="subsidy-type"]', 'it-tsujyo');
      await page.click('[data-testid="company-type-corporation"]');
      await page.click('[data-testid="years-over-3"]');
      
      // 経営者の国籍に関する質問
      await expect(page.locator('h3')).toContainText('代表者の国籍は日本ですか？');
      await page.click('[data-testid="representative-nationality-foreign"]');
      
      // 在留資格の確認
      await expect(page.locator('h3')).toContainText('在留資格の種類は？');
      await page.click('[data-testid="residence-status-business"]');
      
      // 追加書類の確認
      await expect(page.locator('[data-testid="required-doc"]')).toContainText('在留カード');
      await expect(page.locator('[data-testid="required-doc"]')).toContainText('住民票');
    });

    test('災害被災企業の特例措置', async ({ page }) => {
      await page.selectOption('[data-testid="subsidy-type"]', 'jizokuka');
      await page.click('[data-testid="company-type-corporation"]');
      await page.click('[data-testid="years-over-3"]');
      
      // 災害被災の確認
      await expect(page.locator('h3')).toContainText('過去3年以内に災害による被害を受けましたか？');
      await page.click('[data-testid="disaster-affected-yes"]');
      
      // 災害の種類
      await page.click('[data-testid="disaster-type-earthquake"]');
      
      // 特例措置の書類
      await expect(page.locator('[data-testid="required-doc"]')).toContainText('罹災証明書');
      await expect(page.locator('[data-testid="required-doc"]')).toContainText('被害状況報告書');
      
      // 簡略化された書類要件の確認
      await expect(page.locator('[data-testid="simplified-requirements"]')).toBeVisible();
      await expect(page.locator('[data-testid="simplified-requirements"]')).toContainText('決算書は直近1期分のみで可');
    });
  });

  // レスポンシブ対応のテスト
  test.describe('レスポンシブデザイン対応', () => {
    test('モバイル環境での質問フロー', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      await page.selectOption('[data-testid="subsidy-type"]', 'it-tsujyo');
      
      // モバイルでの質問表示確認
      await expect(page.locator('[data-testid="question-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      
      // スワイプ操作での質問遷移
      await page.click('[data-testid="company-type-corporation"]');
      await expect(page.locator('[data-testid="next-question"]')).toBeVisible();
      
      // モバイル固有のナビゲーション確認
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
    });

    test('タブレット環境での書類リスト表示', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      
      await page.selectOption('[data-testid="subsidy-type"]', 'monozukuri');
      await page.click('[data-testid="company-type-corporation"]');
      await page.click('[data-testid="years-over-3"]');
      await page.click('[data-testid="equipment-type-machine"]');
      
      // タブレットでの書類リスト表示
      await expect(page.locator('[data-testid="documents-grid"]')).toBeVisible();
      await expect(page.locator('[data-testid="document-card"]').first()).toBeVisible();
    });
  });

  // パフォーマンステスト
  test.describe('パフォーマンス検証', () => {
    test('大量分岐処理の応答時間', async ({ page }) => {
      const startTime = Date.now();
      
      // 複雑な分岐パターンを高速で実行
      await page.selectOption('[data-testid="subsidy-type"]', 'it-fukusu');
      await page.click('[data-testid="company-type-corporation"]');
      await page.click('[data-testid="years-over-3"]');
      await page.click('[data-testid="it-experience-yes"]');
      await page.click('[data-testid="cloud-service-yes"]');
      await page.click('[data-testid="multiple-application-yes"]');
      await page.check('[data-testid="additional-subsidy-monozukuri"]');
      await page.check('[data-testid="additional-subsidy-jizokuka"]');
      
      // 結果表示まで待機
      await expect(page.locator('[data-testid="required-documents-list"]')).toBeVisible();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 5秒以内での応答を確認
      expect(responseTime).toBeLessThan(5000);
      console.log(`複雑な分岐処理応答時間: ${responseTime}ms`);
    });

    test('同時アクセス負荷での安定性', async ({ browser }) => {
      // 10個の並列セッションを作成
      const contexts = await Promise.all(
        Array.from({ length: 10 }, () => browser.newContext())
      );
      
      const pages = await Promise.all(
        contexts.map(context => context.newPage())
      );
      
      // 全セッションで同時にフローを実行
      await Promise.all(
        pages.map(async (page, index) => {
          await page.goto('/document-requirements');
          await page.selectOption('[data-testid="subsidy-type"]', 'it-tsujyo');
          await page.click('[data-testid="company-type-corporation"]');
          await page.click('[data-testid="years-over-3"]');
          await expect(page.locator('[data-testid="required-documents-list"]')).toBeVisible();
        })
      );
      
      // 全セッションでの結果整合性を確認
      for (const page of pages) {
        await expect(page.locator('[data-testid="required-doc"]')).toContainText('履歴事項全部証明書');
      }
      
      // リソースクリーンアップ
      await Promise.all(contexts.map(context => context.close()));
    });
  });

  // アクセシビリティテスト
  test.describe('アクセシビリティ検証', () => {
    test('キーボードナビゲーション', async ({ page }) => {
      await page.focus('[data-testid="subsidy-type"]');
      
      // Tabキーでの遷移
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="company-type-corporation"]')).toBeFocused();
      
      // Enterキーでの選択
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="company-type-corporation"]')).toBeChecked();
      
      // 矢印キーでの移動
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('[data-testid="years-over-3"]')).toBeFocused();
    });

    test('スクリーンリーダー対応', async ({ page }) => {
      // ARIA属性の確認
      await expect(page.locator('[data-testid="question-container"]')).toHaveAttribute('role', 'region');
      await expect(page.locator('[data-testid="question-container"]')).toHaveAttribute('aria-label');
      
      // フォーカス管理
      await page.selectOption('[data-testid="subsidy-type"]', 'it-tsujyo');
      await expect(page.locator('[data-testid="next-question"]')).toHaveAttribute('aria-describedby');
    });
  });
});