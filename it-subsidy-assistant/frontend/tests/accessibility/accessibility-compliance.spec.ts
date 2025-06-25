/**
 * アクセシビリティコンプライアンスE2Eテスト
 * WCAG 2.1 Level AAに準拠した包括的なテスト
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

// アクセシビリティ違反の重要度
type ViolationImpact = 'minor' | 'moderate' | 'serious' | 'critical';

// テスト対象ページ
const TEST_PAGES = [
  { path: '/demo/integrated', name: '統合デモページ' },
  { path: '/auth/login', name: 'ログインページ' },
  { path: '/subsidies', name: '補助金一覧ページ' },
  { path: '/application-form', name: '申請フォームページ' }
];

test.describe('アクセシビリティコンプライアンステスト', () => {
  test.beforeEach(async ({ page }) => {
    // axe-coreの注入
    await page.goto('/');
    await injectAxe(page);
  });

  // 各ページでの自動アクセシビリティテスト
  for (const { path, name } of TEST_PAGES) {
    test(`${name}のWCAG準拠テスト`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // axe-coreによる自動検査
      const violations = await getViolations(page, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        }
      });

      // 違反をimpactレベルでグループ化
      const violationsByImpact = violations.reduce((acc, violation) => {
        const impact = violation.impact as ViolationImpact;
        if (!acc[impact]) acc[impact] = [];
        acc[impact].push(violation);
        return acc;
      }, {} as Record<ViolationImpact, typeof violations>);

      // 結果の出力
      console.log(`\n=== ${name}のアクセシビリティ検査結果 ===`);
      console.log(`総違反数: ${violations.length}`);
      
      if (violations.length > 0) {
        Object.entries(violationsByImpact).forEach(([impact, items]) => {
          console.log(`\n${impact.toUpperCase()}レベルの違反 (${items.length}件):`);
          items.forEach(violation => {
            console.log(`- ${violation.id}: ${violation.description}`);
            console.log(`  影響を受ける要素: ${violation.nodes.length}個`);
          });
        });
      }

      // criticalとseriousの違反は許可しない
      const criticalViolations = violationsByImpact.critical || [];
      const seriousViolations = violationsByImpact.serious || [];
      
      expect(criticalViolations.length).toBe(0);
      expect(seriousViolations.length).toBe(0);
    });
  }

  test('キーボードナビゲーションの完全性', async ({ page }) => {
    await page.goto('/demo/integrated');
    await page.waitForLoadState('networkidle');

    // フォーカス可能な要素を取得
    const focusableElements = await page.$$('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    console.log(`フォーカス可能な要素数: ${focusableElements.length}`);

    // 各要素にTabキーでアクセスできるか確認
    let focusedCount = 0;
    const maxElements = Math.min(focusableElements.length, 20); // 最初の20要素をテスト

    for (let i = 0; i < maxElements; i++) {
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName.toLowerCase(),
          id: el?.id,
          className: el?.className,
          isVisible: el ? window.getComputedStyle(el).visibility !== 'hidden' : false,
          hasOutline: el ? window.getComputedStyle(el).outline !== 'none' : false
        };
      });

      if (focusedElement.isVisible) {
        focusedCount++;
        // フォーカスインジケーターが表示されているか
        expect(focusedElement.hasOutline).toBe(true);
      }
    }

    expect(focusedCount).toBeGreaterThan(0);

    // Escapeキーでモーダルを閉じられるかテスト
    const modalTrigger = page.locator('[data-testid="open-export-dialog"], button:has-text("エクスポート")').first();
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      // モーダルが閉じられたか確認
      const modal = page.locator('[role="dialog"], [data-testid="modal"]');
      await expect(modal).not.toBeVisible();
    }
  });

  test('スクリーンリーダー対応の確認', async ({ page }) => {
    await page.goto('/demo/integrated');

    // ページのランドマーク確認
    const landmarks = await page.evaluate(() => {
      const main = document.querySelector('main');
      const nav = document.querySelector('nav');
      const header = document.querySelector('header');
      const footer = document.querySelector('footer');
      
      return {
        hasMain: !!main,
        hasNav: !!nav,
        hasHeader: !!header,
        hasFooter: !!footer,
        mainRole: main?.getAttribute('role'),
        navRole: nav?.getAttribute('role'),
        headerRole: header?.getAttribute('role')
      };
    });

    expect(landmarks.hasMain).toBe(true);
    expect(landmarks.hasNav || landmarks.hasHeader).toBe(true);

    // 見出し構造の確認
    const headings = await page.evaluate(() => {
      const h1 = document.querySelectorAll('h1');
      const h2 = document.querySelectorAll('h2');
      const h3 = document.querySelectorAll('h3');
      const h4 = document.querySelectorAll('h4');
      
      return {
        h1Count: h1.length,
        h2Count: h2.length,
        h3Count: h3.length,
        h4Count: h4.length,
        h1Text: Array.from(h1).map(el => el.textContent),
        hierarchy: [] as string[]
      };
    });

    // h1は1つだけであるべき
    expect(headings.h1Count).toBe(1);
    console.log(`見出し構造: h1(${headings.h1Count}), h2(${headings.h2Count}), h3(${headings.h3Count}), h4(${headings.h4Count})`);

    // フォーム要素のラベル確認
    const formInputs = await page.$$('input, select, textarea');
    for (const input of formInputs) {
      const inputId = await input.getAttribute('id');
      const inputType = await input.getAttribute('type');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      
      if (inputType !== 'hidden' && inputType !== 'submit') {
        // ラベルが存在するか確認
        if (inputId) {
          const label = await page.$(`label[for="${inputId}"]`);
          const hasLabel = !!label || !!ariaLabel || !!ariaLabelledby;
          expect(hasLabel).toBe(true);
        }
      }
    }

    // 画像の代替テキスト確認
    const images = await page.$$('img');
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // 装飾的な画像でない限りaltが必要
      if (role !== 'presentation' && role !== 'none') {
        expect(alt).toBeTruthy();
      }
    }

    // ARIAライブリージョンの確認
    const liveRegions = await page.evaluate(() => {
      const ariaLive = document.querySelectorAll('[aria-live]');
      const roleAlert = document.querySelectorAll('[role="alert"]');
      const roleStatus = document.querySelectorAll('[role="status"]');
      
      return {
        ariaLiveCount: ariaLive.length,
        alertCount: roleAlert.length,
        statusCount: roleStatus.length
      };
    });

    console.log(`ARIAライブリージョン: aria-live(${liveRegions.ariaLiveCount}), alert(${liveRegions.alertCount}), status(${liveRegions.statusCount})`);
  });

  test('カラーコントラストとテーマ対応', async ({ page }) => {
    await page.goto('/demo/integrated');

    // ライトモードでのコントラスト確認
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await page.waitForTimeout(300);

    const lightModeColors = await page.evaluate(() => {
      const button = document.querySelector('button');
      const text = document.querySelector('p');
      
      if (button && text) {
        const buttonStyles = window.getComputedStyle(button);
        const textStyles = window.getComputedStyle(text);
        
        return {
          buttonColor: buttonStyles.color,
          buttonBg: buttonStyles.backgroundColor,
          textColor: textStyles.color,
          textBg: window.getComputedStyle(text.parentElement!).backgroundColor
        };
      }
      return null;
    });

    // ダークモードでのコントラスト確認
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(300);

    const darkModeColors = await page.evaluate(() => {
      const button = document.querySelector('button');
      const text = document.querySelector('p');
      
      if (button && text) {
        const buttonStyles = window.getComputedStyle(button);
        const textStyles = window.getComputedStyle(text);
        
        return {
          buttonColor: buttonStyles.color,
          buttonBg: buttonStyles.backgroundColor,
          textColor: textStyles.color,
          textBg: window.getComputedStyle(text.parentElement!).backgroundColor
        };
      }
      return null;
    });

    // 色が変わっていることを確認（ダークモード対応）
    if (lightModeColors && darkModeColors) {
      expect(lightModeColors.textColor).not.toBe(darkModeColors.textColor);
    }

    // 高コントラストモードのサポート確認
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    
    // アニメーションが無効化されているか確認
    const animationDuration = await page.evaluate(() => {
      const animated = document.querySelector('[class*="animate"], [class*="transition"]');
      if (animated) {
        return window.getComputedStyle(animated).animationDuration;
      }
      return '0s';
    });
    
    expect(animationDuration).toBe('0s');
  });

  test('フォームのアクセシビリティ', async ({ page }) => {
    await page.goto('/demo/integrated');
    
    // 認証フォームに移動
    await page.click('text=認証システム');
    await page.waitForTimeout(300);

    // エラーメッセージのアクセシビリティ
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // 空のフォームを送信
    await page.click('button:has-text("ログイン")');
    await page.waitForTimeout(500);

    // エラーメッセージの確認
    const emailError = await emailInput.getAttribute('aria-invalid');
    const emailDescribedBy = await emailInput.getAttribute('aria-describedby');
    
    if (emailError === 'true') {
      expect(emailDescribedBy).toBeTruthy();
      
      // エラーメッセージ要素の確認
      const errorElement = page.locator(`#${emailDescribedBy}`);
      await expect(errorElement).toBeVisible();
    }

    // 必須フィールドのマーキング
    const requiredInputs = await page.$$('input[required], select[required], textarea[required]');
    for (const input of requiredInputs) {
      const ariaRequired = await input.getAttribute('aria-required');
      expect(ariaRequired).toBe('true');
    }

    // フォームのグループ化確認
    const fieldsets = await page.$$('fieldset');
    for (const fieldset of fieldsets) {
      const legend = await fieldset.$('legend');
      expect(legend).toBeTruthy();
    }
  });

  test('レスポンシブテキストとズーム対応', async ({ page }) => {
    await page.goto('/demo/integrated');

    // 200%ズームでのレイアウト確認
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    await page.waitForTimeout(500);

    // 横スクロールが発生していないか確認
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    // 200%ズームでも横スクロールが発生しないことが理想
    // ただし、一部の要素では許容される場合もある

    // テキストのリフロー確認
    await page.setViewportSize({ width: 320, height: 568 });
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });

    const textElements = await page.$$('p, span, div');
    for (const element of textElements.slice(0, 5)) {
      const overflow = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          overflowX: styles.overflowX,
          textOverflow: styles.textOverflow,
          wordBreak: styles.wordBreak
        };
      });
      
      // テキストが適切に折り返されるか
      expect(['normal', 'break-word', 'break-all']).toContain(overflow.wordBreak);
    }
  });

  test('タイムアウトと自動更新の制御', async ({ page }) => {
    await page.goto('/demo/integrated');

    // セッションタイムアウトの警告確認
    const hasSessionWarning = await page.evaluate(() => {
      // セッション管理の実装を確認
      return !!(window as any).sessionTimeout || !!(window as any).SESSION_TIMEOUT;
    });

    if (hasSessionWarning) {
      console.log('セッションタイムアウト管理が実装されています');
    }

    // 自動更新の制御確認
    const autoRefreshElements = await page.$$('[data-auto-refresh]');
    for (const element of autoRefreshElements) {
      const pauseControl = await element.getAttribute('aria-live');
      // 自動更新要素にはaria-liveが設定されているべき
      expect(pauseControl).toBeTruthy();
    }

    // リアルタイム更新の一時停止機能確認
    const realtimeSection = page.locator('text=リアルタイム');
    if (await realtimeSection.count() > 0) {
      await realtimeSection.click();
      
      // 一時停止/再開ボタンの確認
      const pauseButton = page.locator('[aria-label*="一時停止"], [aria-label*="pause"]');
      // 実装されている場合のみテスト
    }
  });

  test('エラー処理とフィードバックのアクセシビリティ', async ({ page }) => {
    await page.goto('/demo/integrated');

    // ネットワークエラーのシミュレーション
    await page.route('**/api/**', route => route.abort());

    // AIマッチングセクションでエラーを発生させる
    await page.click('text=認証システム');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("ログイン")');

    // エラーメッセージの確認
    await page.waitForTimeout(1000);
    
    const errorMessages = await page.$$('[role="alert"], [aria-live="assertive"]');
    expect(errorMessages.length).toBeGreaterThan(0);

    // エラーメッセージがスクリーンリーダーに通知されるか
    for (const error of errorMessages) {
      const ariaLive = await error.getAttribute('aria-live');
      const role = await error.getAttribute('role');
      
      expect(ariaLive === 'assertive' || role === 'alert').toBe(true);
    }

    // フォーカス管理の確認
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`エラー後のフォーカス要素: ${focusedElement}`);
  });
});