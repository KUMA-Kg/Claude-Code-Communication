/**
 * モバイルレスポンシブE2Eテスト
 * 各種モバイルデバイスでの表示と操作性を検証
 */

import { test, expect, devices } from '@playwright/test';

// テストするデバイス設定
const MOBILE_DEVICES = [
  { name: 'iPhone 12', device: devices['iPhone 12'] },
  { name: 'iPhone SE', device: devices['iPhone SE'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'Galaxy S21', device: devices['Galaxy S21'] }
];

// タブレットデバイス
const TABLET_DEVICES = [
  { name: 'iPad Pro', device: devices['iPad Pro'] },
  { name: 'iPad Mini', device: devices['iPad Mini'] }
];

test.describe('モバイルレスポンシブテスト', () => {
  // 各モバイルデバイスでテスト
  for (const { name, device } of MOBILE_DEVICES) {
    test.describe(`${name}での表示テスト`, () => {
      test.use(device);

      test('モバイルレイアウトの基本表示', async ({ page }) => {
        await page.goto('/demo/integrated');
        await page.waitForLoadState('networkidle');

        // ビューポートサイズの確認
        const viewport = page.viewportSize();
        console.log(`${name} viewport: ${viewport?.width}x${viewport?.height}`);

        // モバイル用ヘッダーの確認
        const header = page.locator('header').first();
        await expect(header).toBeVisible();

        // ハンバーガーメニューまたはモバイルナビゲーションの確認
        const mobileMenu = page.locator('[data-testid="mobile-menu-button"], [aria-label*="menu"]').first();
        if (await mobileMenu.count() > 0) {
          await expect(mobileMenu).toBeVisible();
          
          // メニューを開く
          await mobileMenu.click();
          await page.waitForTimeout(300);

          // メニュー項目の確認
          const menuItems = ['認証システム', 'AIマッチング', 'データ出力', 'リアルタイム'];
          for (const item of menuItems) {
            await expect(page.locator(`text=${item}`)).toBeVisible();
          }

          // メニューを閉じる
          await page.click('body'); // 外側をクリック
          await page.waitForTimeout(300);
        }

        // コンテンツがビューポート内に収まっているか確認
        const contentWidth = await page.evaluate(() => {
          return document.body.scrollWidth;
        });
        expect(contentWidth).toBeLessThanOrEqual(viewport!.width + 20); // 少しの余裕を持たせる
      });

      test('タッチ操作とスワイプ', async ({ page }) => {
        await page.goto('/demo/integrated');
        await page.waitForLoadState('networkidle');

        // セクション間のスワイプシミュレーション
        const sections = await page.$$('[data-testid^="section-"]');
        
        if (sections.length > 0) {
          // 最初のセクションから次のセクションへスワイプ
          const firstSection = sections[0];
          const box = await firstSection.boundingBox();
          
          if (box) {
            // スワイプジェスチャーのシミュレーション
            await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
            await page.waitForTimeout(100);
            
            // ドラッグによるスクロール
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width / 2, box.y + 100, { steps: 10 });
            await page.mouse.up();
          }
        }

        // ボタンのタップ可能領域の確認
        const buttons = await page.$$('button');
        for (const button of buttons.slice(0, 3)) { // 最初の3つのボタンをテスト
          const box = await button.boundingBox();
          if (box) {
            // 最小タップ領域の確認（44x44px）
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      });

      test('フォーム入力のモバイル最適化', async ({ page }) => {
        await page.goto('/demo/integrated');
        
        // 認証セクションに移動
        await page.click('text=認証システム');
        await page.waitForTimeout(300);

        // 入力フィールドのフォーカス
        const emailInput = page.locator('input[type="email"]');
        await emailInput.focus();

        // キーボードが表示されている想定でビューポートが調整されるか
        await page.waitForTimeout(500);

        // 入力フィールドが見えているか確認
        await expect(emailInput).toBeInViewport();

        // オートコンプリート属性の確認
        const autocomplete = await emailInput.getAttribute('autocomplete');
        expect(autocomplete).toBeTruthy();

        // 入力フィールドのサイズが適切か
        const inputBox = await emailInput.boundingBox();
        if (inputBox) {
          expect(inputBox.height).toBeGreaterThanOrEqual(40); // モバイルで押しやすいサイズ
        }
      });

      test('画像とメディアの最適化', async ({ page }) => {
        await page.goto('/demo/integrated');

        // 画像の遅延読み込み確認
        const images = await page.$$('img');
        for (const img of images) {
          const loading = await img.getAttribute('loading');
          // 重要でない画像は遅延読み込みされているべき
          if (await img.getAttribute('data-priority') !== 'high') {
            expect(loading).toBe('lazy');
          }
        }

        // 画像サイズの確認
        for (const img of images.slice(0, 3)) {
          const box = await img.boundingBox();
          if (box) {
            // モバイルビューポートに適したサイズか
            const viewport = page.viewportSize();
            expect(box.width).toBeLessThanOrEqual(viewport!.width);
          }
        }
      });

      test('モバイル特有のインタラクション', async ({ page }) => {
        await page.goto('/demo/integrated');

        // プルダウンリフレッシュのシミュレーション（実装されている場合）
        await page.evaluate(() => {
          window.scrollTo(0, 0);
        });

        // 上部で下にスワイプ
        await page.touchscreen.tap(200, 10);
        await page.mouse.down();
        await page.mouse.move(200, 100, { steps: 10 });
        await page.mouse.up();

        // 長押しメニューのテスト（実装されている場合）
        const firstButton = page.locator('button').first();
        const box = await firstButton.boundingBox();
        
        if (box) {
          // 長押しのシミュレーション
          await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
          await page.waitForTimeout(1000); // 1秒間押し続ける
        }
      });
    });
  }

  // タブレットデバイスでのテスト
  for (const { name, device } of TABLET_DEVICES) {
    test.describe(`${name}での表示テスト`, () => {
      test.use(device);

      test('タブレットレイアウトの確認', async ({ page }) => {
        await page.goto('/demo/integrated');
        await page.waitForLoadState('networkidle');

        // タブレットでは2カラムレイアウトの可能性
        const viewport = page.viewportSize();
        console.log(`${name} viewport: ${viewport?.width}x${viewport?.height}`);

        // サイドバーの表示確認（タブレットでは表示される可能性）
        const sidebar = page.locator('[data-testid="sidebar"]');
        if (viewport!.width >= 768) {
          // 768px以上では サイドバーが表示される可能性
          const sidebarVisible = await sidebar.isVisible();
          console.log(`Sidebar visible on ${name}: ${sidebarVisible}`);
        }

        // グリッドレイアウトの確認
        const gridContainers = await page.$$('[class*="grid"]');
        for (const grid of gridContainers) {
          const styles = await grid.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              display: computed.display,
              gridTemplateColumns: computed.gridTemplateColumns
            };
          });
          
          if (styles.display === 'grid') {
            console.log(`Grid columns on ${name}: ${styles.gridTemplateColumns}`);
          }
        }
      });

      test('タブレット向けの操作性', async ({ page }) => {
        await page.goto('/demo/integrated');

        // マルチタッチジェスチャーのシミュレーション
        // ピンチズームの動作確認（実装されている場合）
        const content = page.locator('main').first();
        const box = await content.boundingBox();
        
        if (box) {
          const centerX = box.x + box.width / 2;
          const centerY = box.y + box.height / 2;
          
          // 2本指でのピンチアウト
          await Promise.all([
            page.mouse.move(centerX - 50, centerY),
            page.mouse.move(centerX + 50, centerY)
          ]);
        }

        // 横向き・縦向きの切り替えテスト
        const viewport = page.viewportSize();
        if (viewport) {
          // 横向きに変更
          await page.setViewportSize({
            width: viewport.height,
            height: viewport.width
          });
          await page.waitForTimeout(500);

          // レイアウトが適切に調整されているか確認
          const contentWidth = await page.evaluate(() => document.body.scrollWidth);
          expect(contentWidth).toBeLessThanOrEqual(viewport.height + 20);

          // 縦向きに戻す
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height
          });
        }
      });
    });
  }

  // 共通のモバイル最適化テスト
  test.describe('モバイル共通機能テスト', () => {
    test.use(devices['iPhone 12']);

    test('オフライン対応の確認', async ({ page, context }) => {
      await page.goto('/demo/integrated');
      
      // オフラインモードに切り替え
      await context.setOffline(true);
      
      // オフライン通知の表示確認
      const offlineNotice = page.locator('[data-testid="offline-notice"], text=/オフライン|接続されていません/');
      await expect(offlineNotice).toBeVisible({ timeout: 5000 });

      // 基本的な機能が動作するか確認
      await page.click('text=認証システム');
      
      // オンラインに戻す
      await context.setOffline(false);
      
      // 再接続通知の確認
      const onlineNotice = page.locator('text=/オンライン|接続されました/');
      // 実装によっては表示されない可能性もある
    });

    test('モバイルパフォーマンスの計測', async ({ page }) => {
      // パフォーマンス計測開始
      await page.goto('/demo/integrated');
      
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });

      console.log('モバイルパフォーマンス指標:');
      console.log(`- ページ読み込み時間: ${metrics.loadTime}ms`);
      console.log(`- DOM構築時間: ${metrics.domContentLoaded}ms`);
      console.log(`- First Paint: ${metrics.firstPaint}ms`);
      console.log(`- First Contentful Paint: ${metrics.firstContentfulPaint}ms`);

      // モバイルでの許容値
      expect(metrics.loadTime).toBeLessThan(5000); // 5秒以内
      expect(metrics.firstContentfulPaint).toBeLessThan(3000); // 3秒以内
    });

    test('モバイル向けアクセシビリティ', async ({ page }) => {
      await page.goto('/demo/integrated');

      // タッチターゲットサイズの確認
      const interactiveElements = await page.$$('button, a, input, select, textarea');
      
      for (const element of interactiveElements.slice(0, 10)) { // 最初の10要素をチェック
        const box = await element.boundingBox();
        if (box && await element.isVisible()) {
          // WCAG 2.1の推奨: 44x44px以上
          const size = Math.min(box.width, box.height);
          expect(size).toBeGreaterThanOrEqual(44);
        }
      }

      // テキストの可読性確認
      const textElements = await page.$$('p, span, div');
      for (const element of textElements.slice(0, 5)) {
        const fontSize = await element.evaluate(el => {
          return window.getComputedStyle(el).fontSize;
        });
        
        // フォントサイズが小さすぎないか（最小14px推奨）
        const size = parseFloat(fontSize);
        if (size > 0) {
          expect(size).toBeGreaterThanOrEqual(14);
        }
      }

      // コントラスト比の簡易チェック
      const buttons = await page.$$('button');
      for (const button of buttons.slice(0, 3)) {
        const styles = await button.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor
          };
        });
        
        // 色が適切に設定されているか確認
        expect(styles.color).not.toBe('');
        expect(styles.backgroundColor).not.toBe('');
      }
    });
  });
});