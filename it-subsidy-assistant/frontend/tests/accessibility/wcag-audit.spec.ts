/**
 * WCAG 2.1 AA準拠の包括的アクセシビリティ監査
 * 補助金選択システムの完全なアクセシビリティテスト
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

// テスト対象ページのマッピング
const PAGES_TO_TEST = [
  { name: 'ホームページ', path: '/' },
  { name: '補助金診断', path: '/subsidy-flow' },
  { name: '補助金選択', path: '/subsidy-selection' },
  { name: '必要書類確認', path: '/document-requirements' },
  { name: '申請書作成', path: '/application-form' },
  { name: 'IT導入補助金詳細', path: '/subsidies/it-donyu' },
  { name: '持続化補助金詳細', path: '/subsidies/jizokuka' },
  { name: 'ものづくり補助金詳細', path: '/subsidies/monozukuri' }
];

// WCAG 2.1 AA基準のルール設定
const WCAG_RULES = {
  wcagVersion: '2.1',
  conformanceLevel: 'AA',
  rules: {
    'color-contrast': { enabled: true },
    'document-title': { enabled: true },
    'html-has-lang': { enabled: true },
    'html-lang-valid': { enabled: true },
    'meta-viewport': { enabled: true },
    'aria-allowed-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'button-name': { enabled: true },
    'duplicate-id': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'frame-title': { enabled: true },
    'heading-order': { enabled: true },
    'image-alt': { enabled: true },
    'input-image-alt': { enabled: true },
    'label': { enabled: true },
    'link-name': { enabled: true },
    'list': { enabled: true },
    'listitem': { enabled: true },
    'meta-refresh': { enabled: true },
    'object-alt': { enabled: true },
    'role-img-alt': { enabled: true },
    'scrollable-region-focusable': { enabled: true },
    'select-name': { enabled: true },
    'valid-lang': { enabled: true },
    'video-caption': { enabled: true }
  }
};

test.describe('WCAG 2.1 AA準拠アクセシビリティ監査', () => {
  test.beforeEach(async ({ page }) => {
    // axe-coreを注入
    await injectAxe(page);
  });

  // 各ページの包括的アクセシビリティテスト
  for (const pageInfo of PAGES_TO_TEST) {
    test(`${pageInfo.name}のアクセシビリティ検証`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // WCAG 2.1 AA基準でのチェック
      const results = await checkA11y(page, null, {
        axeOptions: WCAG_RULES,
        detailedReport: true,
        detailedReportOptions: {
          html: true
        }
      });

      // カスタムアクセシビリティチェック
      await performCustomAccessibilityChecks(page, pageInfo.name);
    });
  }

  // キーボードナビゲーション専用テスト
  test('キーボードナビゲーションの完全性', async ({ page }) => {
    await page.goto('/subsidy-flow');
    
    // Tabキーでのフォーカス移動テスト
    const focusableElements = await page.$$eval('*', elements => {
      return elements
        .filter(el => {
          const tagName = el.tagName.toLowerCase();
          const tabIndex = el.getAttribute('tabindex');
          return (
            ['a', 'button', 'input', 'select', 'textarea'].includes(tagName) ||
            (tabIndex && parseInt(tabIndex) >= 0)
          );
        })
        .map(el => ({
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim() || '',
          ariaLabel: el.getAttribute('aria-label') || ''
        }));
    });

    // 各要素がキーボードでアクセス可能か確認
    for (let i = 0; i < focusableElements.length; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName.toLowerCase(),
          hasVisibleFocusIndicator: window.getComputedStyle(el!).outline !== 'none'
        };
      });

      expect(focusedElement.hasVisibleFocusIndicator).toBeTruthy();
    }

    // Escキーでのモーダル閉じるテスト
    const hasModal = await page.$('[role="dialog"]');
    if (hasModal) {
      await page.keyboard.press('Escape');
      const modalClosed = await page.$('[role="dialog"]');
      expect(modalClosed).toBeNull();
    }
  });

  // スクリーンリーダー対応テスト
  test('スクリーンリーダーアナウンスの適切性', async ({ page }) => {
    await page.goto('/subsidy-flow');

    // ランドマークの確認
    const landmarks = await page.$$eval('[role]', elements => 
      elements.map(el => ({
        role: el.getAttribute('role'),
        label: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
      }))
    );

    const requiredLandmarks = ['banner', 'navigation', 'main', 'contentinfo'];
    for (const landmark of requiredLandmarks) {
      const found = landmarks.some(l => l.role === landmark);
      expect(found).toBeTruthy();
    }

    // フォーム要素のラベル確認
    const formElements = await page.$$eval('input, select, textarea', elements =>
      elements.map(el => {
        const id = el.id;
        const label = document.querySelector(`label[for="${id}"]`);
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledby = el.getAttribute('aria-labelledby');
        
        return {
          hasLabel: !!(label || ariaLabel || ariaLabelledby),
          type: el.tagName.toLowerCase(),
          name: el.getAttribute('name') || ''
        };
      })
    );

    formElements.forEach(element => {
      expect(element.hasLabel).toBeTruthy();
    });

    // 動的コンテンツのアナウンス確認
    const liveRegions = await page.$$eval('[aria-live]', elements =>
      elements.map(el => ({
        level: el.getAttribute('aria-live'),
        role: el.getAttribute('role'),
        hasContent: el.textContent!.trim().length > 0
      }))
    );

    liveRegions.forEach(region => {
      expect(['polite', 'assertive']).toContain(region.level);
    });
  });

  // カラーコントラスト詳細テスト
  test('カラーコントラスト比の詳細検証', async ({ page }) => {
    await page.goto('/');

    const contrastIssues = await page.evaluate(() => {
      const issues: any[] = [];
      const elements = document.querySelectorAll('*');

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        
        if (bgColor !== 'rgba(0, 0, 0, 0)' && textColor !== 'rgba(0, 0, 0, 0)') {
          // 簡易的なコントラスト比計算（実際はより複雑）
          const getBrightness = (color: string) => {
            const rgb = color.match(/\d+/g);
            if (!rgb) return 0;
            return (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
          };

          const bgBrightness = getBrightness(bgColor);
          const textBrightness = getBrightness(textColor);
          const contrast = Math.abs(bgBrightness - textBrightness);

          if (contrast < 125) { // WCAG AA基準の簡易チェック
            issues.push({
              element: el.tagName,
              bgColor,
              textColor,
              contrast
            });
          }
        }
      });

      return issues;
    });

    // 重大なコントラスト問題がないことを確認
    expect(contrastIssues.length).toBe(0);
  });

  // フォーカス管理テスト
  test('フォーカス管理とフォーカストラップ', async ({ page }) => {
    await page.goto('/subsidy-flow');

    // モーダルを開く
    const modalTrigger = await page.$('[data-testid="open-modal"]');
    if (modalTrigger) {
      await modalTrigger.click();
      
      // フォーカスがモーダル内に移動したか確認
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('role'));
      expect(focusedElement).toBe('dialog');

      // Tab循環テスト
      const modalFocusableElements = await page.$$('[role="dialog"] [tabindex]:not([tabindex="-1"]), [role="dialog"] button, [role="dialog"] a');
      const elementCount = modalFocusableElements.length;

      for (let i = 0; i < elementCount + 1; i++) {
        await page.keyboard.press('Tab');
      }

      // フォーカスがモーダル内で循環しているか確認
      const stillInModal = await page.evaluate(() => {
        const activeEl = document.activeElement;
        const modal = document.querySelector('[role="dialog"]');
        return modal?.contains(activeEl);
      });

      expect(stillInModal).toBeTruthy();
    }
  });

  // レスポンシブデザインでのアクセシビリティ
  test('モバイルビューでのアクセシビリティ', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/subsidy-flow');

    // タッチターゲットサイズの確認
    const touchTargets = await page.$$eval('button, a, input[type="checkbox"], input[type="radio"]', elements =>
      elements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          element: el.tagName,
          text: el.textContent?.trim() || ''
        };
      })
    );

    // WCAG 2.1の最小タッチターゲットサイズ（44x44px）
    touchTargets.forEach(target => {
      expect(target.width).toBeGreaterThanOrEqual(44);
      expect(target.height).toBeGreaterThanOrEqual(44);
    });
  });

  // エラー処理のアクセシビリティ
  test('エラーメッセージのアクセシビリティ', async ({ page }) => {
    await page.goto('/application-form');

    // 空のフォームを送信してエラーを発生させる
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();

      // エラーメッセージの確認
      const errorMessages = await page.$$eval('[role="alert"], .error-message', elements =>
        elements.map(el => ({
          hasRole: el.getAttribute('role') === 'alert',
          isAriaLive: el.getAttribute('aria-live') === 'assertive' || el.getAttribute('aria-live') === 'polite',
          hasAriaInvalid: !!document.querySelector(`[aria-invalid="true"][aria-describedby="${el.id}"]`)
        }))
      );

      errorMessages.forEach(error => {
        expect(error.hasRole || error.isAriaLive).toBeTruthy();
      });
    }
  });
});

// カスタムアクセシビリティチェック関数
async function performCustomAccessibilityChecks(page: any, pageName: string) {
  // ページ固有のチェック
  switch (pageName) {
    case '補助金診断':
      // プログレスインジケーターのアクセシビリティ
      const progressIndicator = await page.$('[role="progressbar"]');
      if (progressIndicator) {
        const ariaValueNow = await progressIndicator.getAttribute('aria-valuenow');
        const ariaValueMin = await progressIndicator.getAttribute('aria-valuemin');
        const ariaValueMax = await progressIndicator.getAttribute('aria-valuemax');
        
        expect(ariaValueNow).toBeTruthy();
        expect(ariaValueMin).toBeTruthy();
        expect(ariaValueMax).toBeTruthy();
      }
      break;

    case '申請書作成':
      // フォームのグループ化とフィールドセット
      const fieldsets = await page.$$('fieldset');
      for (const fieldset of fieldsets) {
        const legend = await fieldset.$('legend');
        expect(legend).toBeTruthy();
      }
      break;
  }

  // 共通チェック：見出し構造
  const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
    elements.map(el => ({
      level: parseInt(el.tagName.charAt(1)),
      text: el.textContent?.trim() || ''
    }))
  );

  // 見出しレベルの飛び越しがないか確認
  for (let i = 1; i < headings.length; i++) {
    const diff = headings[i].level - headings[i - 1].level;
    expect(diff).toBeLessThanOrEqual(1);
  }
}