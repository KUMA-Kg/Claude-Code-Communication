/**
 * Phase 2 自動化ユーザビリティテスト
 * Worker1のUX最適化をサポート
 */

const { chromium } = require('playwright');
const { performance } = require('perf_hooks');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

// UXテスト基準値
const UX_STANDARDS = {
  pageLoadTime: 3000,        // 3秒以内
  interactionResponse: 200,   // 200ms以内
  formCompletionTime: 300000, // 5分以内（最大許容）
  minimumClickableArea: 44,   // 44px以上（モバイルアクセシビリティ）
  contrastRatio: 4.5,        // WCAG AA準拠
};

describe('Phase 2 自動化ユーザビリティテスト', () => {
  let browser;
  let context;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false'
    });
    
    // モバイルとデスクトップの両方をテスト
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
  }, TEST_TIMEOUT);

  beforeEach(async () => {
    page = await context.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('1. ページロード性能テスト', () => {
    test('初回ページロードが3秒以内', async () => {
      const startTime = performance.now();
      
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.log(`ページロード時間: ${Math.round(loadTime)}ms`);
      expect(loadTime).toBeLessThan(UX_STANDARDS.pageLoadTime);
    });

    test('サブページロードが2秒以内', async () => {
      await page.goto(FRONTEND_URL);
      
      // サブページへのナビゲーション
      const subPageLink = await page.$('[href*="/diagnosis"], [href*="/subsidies"], a:has-text("診断")');
      
      if (subPageLink) {
        const startTime = performance.now();
        
        await subPageLink.click();
        await page.waitForLoadState('networkidle');
        
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        console.log(`サブページロード時間: ${Math.round(loadTime)}ms`);
        expect(loadTime).toBeLessThan(2000);
      }
    });

    test('API応答時間が200ms以下', async () => {
      await page.goto(FRONTEND_URL);
      
      // API呼び出しの監視
      const apiCalls = [];
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          apiCalls.push({
            url: response.url(),
            status: response.status(),
            timing: response.timing()
          });
        }
      });

      // API呼び出しをトリガー
      await page.reload();
      await page.waitForTimeout(3000);

      // API応答時間の確認
      for (const call of apiCalls) {
        if (call.timing && call.timing.responseEnd) {
          const responseTime = call.timing.responseEnd - call.timing.requestStart;
          console.log(`API ${call.url}: ${Math.round(responseTime)}ms`);
          expect(responseTime).toBeLessThan(UX_STANDARDS.interactionResponse);
        }
      }
    });
  });

  describe('2. インタラクション応答性テスト', () => {
    test('ボタンクリック応答が200ms以内', async () => {
      await page.goto(FRONTEND_URL);
      
      const buttons = await page.$$('button:not([disabled])');
      
      for (const button of buttons.slice(0, 5)) { // 最初の5個をテスト
        const startTime = performance.now();
        
        await button.click();
        
        // 視覚的フィードバックを待つ
        await page.waitForTimeout(50);
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        expect(responseTime).toBeLessThan(UX_STANDARDS.interactionResponse);
      }
    });

    test('フォーム入力応答性', async () => {
      await page.goto(FRONTEND_URL);
      
      const inputs = await page.$$('input[type="text"], input[type="email"], textarea');
      
      for (const input of inputs.slice(0, 3)) {
        const startTime = performance.now();
        
        await input.focus();
        await input.type('テスト入力');
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        expect(responseTime).toBeLessThan(UX_STANDARDS.interactionResponse * 5); // 1秒以内
      }
    });
  });

  describe('3. フォーム完了率テスト', () => {
    test('診断フォーム完了フロー', async () => {
      await page.goto(FRONTEND_URL);
      
      const startTime = performance.now();
      
      // 診断開始
      const diagnosisButton = await page.$('button:has-text("診断"), [data-testid="start-diagnosis"]');
      if (diagnosisButton) {
        await diagnosisButton.click();
        
        // フォーム入力をシミュレート
        let stepCount = 0;
        while (stepCount < 10) { // 最大10ステップ
          await page.waitForTimeout(500);
          
          // 現在のフォーム要素を探す
          const radioButton = await page.$('input[type="radio"]:first-of-type');
          const selectBox = await page.$('select');
          const textInput = await page.$('input[type="text"]:not([readonly])');
          const nextButton = await page.$('button:has-text("次へ"), button:has-text("Next")');
          const submitButton = await page.$('button:has-text("送信"), button:has-text("完了")');
          
          // 入力
          if (radioButton) {
            await radioButton.click();
          } else if (selectBox) {
            await selectBox.selectOption({ index: 1 });
          } else if (textInput) {
            await textInput.fill('テスト株式会社');
          }
          
          // 次のステップへ
          if (submitButton) {
            await submitButton.click();
            break;
          } else if (nextButton) {
            await nextButton.click();
          } else {
            break;
          }
          
          stepCount++;
        }
        
        const endTime = performance.now();
        const completionTime = endTime - startTime;
        
        console.log(`フォーム完了時間: ${Math.round(completionTime)}ms`);
        expect(completionTime).toBeLessThan(UX_STANDARDS.formCompletionTime);
      }
    });

    test('入力完了率の測定', async () => {
      await page.goto(FRONTEND_URL);
      
      const allFormFields = await page.$$('input, select, textarea');
      let completedFields = 0;
      
      for (const field of allFormFields) {
        const tagName = await field.evaluate(el => el.tagName.toLowerCase());
        const type = await field.evaluate(el => el.type);
        
        try {
          if (tagName === 'input' && ['text', 'email', 'tel'].includes(type)) {
            await field.fill('テスト入力');
            completedFields++;
          } else if (tagName === 'select') {
            await field.selectOption({ index: 1 });
            completedFields++;
          } else if (type === 'radio') {
            await field.click();
            completedFields++;
          }
        } catch (e) {
          // 入力できないフィールドはスキップ
        }
      }
      
      const completionRate = (completedFields / allFormFields.length) * 100;
      console.log(`入力完了率: ${Math.round(completionRate)}%`);
      
      // 80%以上の入力完了率を目標
      expect(completionRate).toBeGreaterThan(80);
    });
  });

  describe('4. モバイルユーザビリティテスト', () => {
    let mobileContext;
    let mobilePage;

    beforeEach(async () => {
      mobileContext = await browser.newContext({
        viewport: { width: 375, height: 667 }, // iPhone SE
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      });
      mobilePage = await mobileContext.newPage();
    });

    afterEach(async () => {
      await mobileContext.close();
    });

    test('モバイルでのタッチターゲットサイズ', async () => {
      await mobilePage.goto(FRONTEND_URL);
      
      const clickableElements = await mobilePage.$$('button, a, input[type="submit"], [role="button"]');
      
      for (const element of clickableElements) {
        const box = await element.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(UX_STANDARDS.minimumClickableArea);
          expect(box.height).toBeGreaterThan(UX_STANDARDS.minimumClickableArea);
        }
      }
    });

    test('モバイルでのスクロール性能', async () => {
      await mobilePage.goto(FRONTEND_URL);
      
      const startTime = performance.now();
      
      // スクロールテスト
      await mobilePage.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      
      await mobilePage.waitForTimeout(100);
      
      const endTime = performance.now();
      const scrollTime = endTime - startTime;
      
      expect(scrollTime).toBeLessThan(100); // 100ms以内
    });

    test('モバイルでのフォーム入力', async () => {
      await mobilePage.goto(FRONTEND_URL);
      
      const textInputs = await mobilePage.$$('input[type="text"], input[type="email"]');
      
      for (const input of textInputs.slice(0, 2)) {
        await input.tap();
        
        // キーボードが表示されることを確認
        await mobilePage.waitForTimeout(500);
        
        await input.fill('モバイルテスト');
        
        // 入力値が反映されることを確認
        const value = await input.inputValue();
        expect(value).toBe('モバイルテスト');
      }
    });
  });

  describe('5. アクセシビリティテスト', () => {
    test('キーボードナビゲーション', async () => {
      await page.goto(FRONTEND_URL);
      
      // Tab キーでのナビゲーション
      const focusableElements = [];
      
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        const activeElement = await page.evaluateHandle(() => document.activeElement);
        const tagName = await activeElement.evaluate(el => el.tagName);
        const role = await activeElement.evaluate(el => el.getAttribute('role'));
        
        focusableElements.push({ tagName, role });
      }
      
      // フォーカス可能な要素が適切にあることを確認
      expect(focusableElements.length).toBeGreaterThan(5);
    });

    test('ALTテキストと ARIA ラベル', async () => {
      await page.goto(FRONTEND_URL);
      
      // 画像のALTテキスト
      const images = await page.$$('img');
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        
        expect(alt || ariaLabel).toBeTruthy();
      }
      
      // ボタンのアクセシビリティ
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        
        expect(text?.trim() || ariaLabel).toBeTruthy();
      }
    });

    test('カラーコントラスト比（基本チェック）', async () => {
      await page.goto(FRONTEND_URL);
      
      // テキスト要素のコントラストチェック
      const textElements = await page.$$('p, h1, h2, h3, h4, h5, h6, span, div, button');
      
      for (const element of textElements.slice(0, 10)) {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });
        
        // 基本的なチェック（詳細なコントラスト計算は別ツールで）
        expect(styles.color).not.toBe(styles.backgroundColor);
      }
    });
  });

  describe('6. エラー回復性テスト', () => {
    test('ネットワーク切断からの回復', async () => {
      await page.goto(FRONTEND_URL);
      
      // オフラインモード
      await page.context().setOffline(true);
      
      // 何らかのアクションを実行
      const button = await page.$('button:not([disabled])');
      if (button) {
        await button.click();
        
        // エラーメッセージまたはオフライン表示
        const errorMessage = await page.waitForSelector(
          '.offline-message, .network-error, [data-testid="offline"]',
          { timeout: 5000 }
        ).catch(() => null);
        
        expect(errorMessage).toBeTruthy();
      }
      
      // オンラインに戻す
      await page.context().setOffline(false);
      
      // 回復確認
      await page.reload();
      const mainContent = await page.$('[data-testid="main-content"], main, #app');
      expect(mainContent).toBeTruthy();
    });

    test('入力データの保持', async () => {
      await page.goto(FRONTEND_URL);
      
      // フォームに入力
      const textInput = await page.$('input[type="text"]');
      if (textInput) {
        const testValue = 'データ保持テスト';
        await textInput.fill(testValue);
        
        // ページをリロード
        await page.reload();
        
        // データが復元されるか確認（LocalStorageから）
        const restoredValue = await page.evaluate(() => {
          return localStorage.getItem('form_draft') || 
                 localStorage.getItem('session_data');
        });
        
        // 何らかの形でデータが保持されていることを期待
        expect(restoredValue).toBeTruthy();
      }
    });
  });
});

// UXメトリクス計算ユーティリティ
class UXMetrics {
  static calculateUserSatisfactionScore(metrics) {
    const weights = {
      loadTime: 0.3,
      interactionResponse: 0.25,
      completionRate: 0.25,
      errorRate: 0.2
    };
    
    let score = 100;
    
    if (metrics.loadTime > UX_STANDARDS.pageLoadTime) {
      score -= (metrics.loadTime / UX_STANDARDS.pageLoadTime - 1) * weights.loadTime * 100;
    }
    
    if (metrics.interactionResponse > UX_STANDARDS.interactionResponse) {
      score -= (metrics.interactionResponse / UX_STANDARDS.interactionResponse - 1) * weights.interactionResponse * 100;
    }
    
    score += metrics.completionRate * weights.completionRate;
    score -= metrics.errorRate * weights.errorRate * 100;
    
    return Math.max(0, Math.min(100, score));
  }
  
  static generateUXReport(testResults) {
    return {
      timestamp: new Date().toISOString(),
      overallScore: this.calculateUserSatisfactionScore(testResults),
      metrics: testResults,
      recommendations: this.generateRecommendations(testResults)
    };
  }
  
  static generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.loadTime > UX_STANDARDS.pageLoadTime) {
      recommendations.push('ページロード時間の最適化が必要です');
    }
    
    if (metrics.completionRate < 80) {
      recommendations.push('フォーム完了率の改善が必要です');
    }
    
    if (metrics.mobileScore < 90) {
      recommendations.push('モバイルユーザビリティの向上が必要です');
    }
    
    return recommendations;
  }
}

module.exports = { UXMetrics, UX_STANDARDS };