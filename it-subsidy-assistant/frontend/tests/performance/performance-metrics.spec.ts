/**
 * パフォーマンスメトリクスE2Eテスト
 * Core Web Vitalsおよびカスタムパフォーマンス指標の測定
 */

import { test, expect } from '@playwright/test';

// パフォーマンス閾値設定
const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LCP: 2500,    // Largest Contentful Paint (良好: 2.5秒以下)
  FID: 100,     // First Input Delay (良好: 100ms以下)
  CLS: 0.1,     // Cumulative Layout Shift (良好: 0.1以下)
  
  // その他の重要指標
  FCP: 1800,    // First Contentful Paint (良好: 1.8秒以下)
  TTFB: 800,    // Time to First Byte (良好: 0.8秒以下)
  TTI: 3800,    // Time to Interactive (良好: 3.8秒以下)
  
  // カスタム指標
  API_RESPONSE: 1000,      // API応答時間 (1秒以下)
  MEMORY_USAGE: 50,        // メモリ使用量 (50MB以下)
  MAIN_THREAD_BLOCKING: 50 // メインスレッドブロッキング (50ms以下)
};

// テスト対象のシナリオ
const PERFORMANCE_SCENARIOS = [
  {
    name: '初回読み込み',
    path: '/demo/integrated',
    actions: []
  },
  {
    name: '認証フロー',
    path: '/demo/integrated',
    actions: [
      { type: 'click', selector: 'text=認証システム' },
      { type: 'fill', selector: 'input[type="email"]', value: 'test@example.com' },
      { type: 'fill', selector: 'input[type="password"]', value: 'password' },
      { type: 'click', selector: 'button:has-text("ログイン")' }
    ]
  },
  {
    name: 'AIマッチング処理',
    path: '/demo/integrated',
    actions: [
      { type: 'click', selector: 'text=AIマッチング' },
      { type: 'click', selector: 'button:has-text("AIマッチング実行")' }
    ]
  }
];

test.describe('パフォーマンスメトリクステスト', () => {
  test.beforeEach(async ({ page }) => {
    // パフォーマンスAPIの準備
    await page.evaluateOnNewDocument(() => {
      // カスタムパフォーマンスマーカー
      window.customMetrics = {
        marks: new Map(),
        measures: new Map()
      };

      // パフォーマンスオブザーバーの設定
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          window.customMetrics.LCP = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Layout Shift
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          window.customMetrics.CLS = cls;
        }).observe({ entryTypes: ['layout-shift'] });

        // Long Tasks (メインスレッドブロッキング)
        window.customMetrics.longTasks = [];
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.customMetrics.longTasks.push({
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        }).observe({ entryTypes: ['longtask'] });
      }
    });
  });

  // 各シナリオでのパフォーマンステスト
  for (const scenario of PERFORMANCE_SCENARIOS) {
    test(`${scenario.name}のパフォーマンス測定`, async ({ page }) => {
      // ネットワーク条件の設定（3G Fast相当）
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100msの遅延
        await route.continue();
      });

      // CPU スロットリング（4倍）
      const client = await page.context().newCDPSession(page);
      await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

      // ページ読み込み開始
      const startTime = Date.now();
      await page.goto(scenario.path, { waitUntil: 'networkidle' });

      // シナリオのアクション実行
      for (const action of scenario.actions) {
        if (action.type === 'click') {
          await page.click(action.selector);
        } else if (action.type === 'fill') {
          await page.fill(action.selector, action.value || '');
        }
        await page.waitForTimeout(100);
      }

      // メトリクスの収集
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintEntries = performance.getEntriesByType('paint');
        
        return {
          // Navigation Timing
          TTFB: navigation.responseStart - navigation.requestStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          loadComplete: navigation.loadEventEnd - navigation.fetchStart,
          
          // Paint Timing
          FP: paintEntries.find(e => e.name === 'first-paint')?.startTime || 0,
          FCP: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
          
          // Custom Metrics
          LCP: (window as any).customMetrics?.LCP || 0,
          CLS: (window as any).customMetrics?.CLS || 0,
          longTasks: (window as any).customMetrics?.longTasks || [],
          
          // Memory Usage
          memory: (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize / 1024 / 1024,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize / 1024 / 1024,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit / 1024 / 1024
          } : null
        };
      });

      // 結果の出力
      console.log(`\n=== ${scenario.name}のパフォーマンス結果 ===`);
      console.log(`TTFB: ${metrics.TTFB.toFixed(2)}ms (閾値: ${PERFORMANCE_THRESHOLDS.TTFB}ms)`);
      console.log(`FCP: ${metrics.FCP.toFixed(2)}ms (閾値: ${PERFORMANCE_THRESHOLDS.FCP}ms)`);
      console.log(`LCP: ${metrics.LCP.toFixed(2)}ms (閾値: ${PERFORMANCE_THRESHOLDS.LCP}ms)`);
      console.log(`CLS: ${metrics.CLS.toFixed(3)} (閾値: ${PERFORMANCE_THRESHOLDS.CLS})`);
      console.log(`DOM読み込み: ${metrics.domContentLoaded.toFixed(2)}ms`);
      console.log(`完全読み込み: ${metrics.loadComplete.toFixed(2)}ms`);
      
      if (metrics.memory) {
        console.log(`メモリ使用量: ${metrics.memory.usedJSHeapSize.toFixed(2)}MB (閾値: ${PERFORMANCE_THRESHOLDS.MEMORY_USAGE}MB)`);
      }
      
      if (metrics.longTasks.length > 0) {
        const maxBlockingTime = Math.max(...metrics.longTasks.map((t: any) => t.duration));
        console.log(`最大ブロッキング時間: ${maxBlockingTime.toFixed(2)}ms`);
      }

      // 閾値チェック
      expect(metrics.TTFB).toBeLessThan(PERFORMANCE_THRESHOLDS.TTFB);
      expect(metrics.FCP).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
      expect(metrics.LCP).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
      expect(metrics.CLS).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
      
      if (metrics.memory) {
        expect(metrics.memory.usedJSHeapSize).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE);
      }
    });
  }

  test('リソース読み込みの最適化確認', async ({ page }) => {
    const resources: any[] = [];
    
    // リソース読み込みの監視
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      const headers = response.headers();
      
      resources.push({
        url,
        status,
        size: parseInt(headers['content-length'] || '0'),
        type: headers['content-type'],
        cacheControl: headers['cache-control'],
        timing: response.timing()
      });
    });

    await page.goto('/demo/integrated');
    await page.waitForLoadState('networkidle');

    // リソースの分析
    console.log('\n=== リソース最適化分析 ===');
    
    // 画像の最適化確認
    const images = resources.filter(r => r.type?.includes('image'));
    console.log(`画像リソース数: ${images.length}`);
    
    for (const img of images) {
      // 画像サイズが大きすぎないか確認（1MB以下推奨）
      if (img.size > 1024 * 1024) {
        console.warn(`大きな画像: ${img.url} (${(img.size / 1024 / 1024).toFixed(2)}MB)`);
      }
      
      // 適切なキャッシュヘッダーが設定されているか
      expect(img.cacheControl).toBeTruthy();
    }

    // JavaScriptバンドルサイズの確認
    const scripts = resources.filter(r => r.type?.includes('javascript'));
    const totalScriptSize = scripts.reduce((sum, s) => sum + s.size, 0);
    console.log(`JSバンドル総サイズ: ${(totalScriptSize / 1024).toFixed(2)}KB`);
    
    // 各スクリプトが適切に分割されているか（200KB以下推奨）
    for (const script of scripts) {
      if (script.size > 200 * 1024) {
        console.warn(`大きなスクリプト: ${script.url} (${(script.size / 1024).toFixed(2)}KB)`);
      }
    }

    // CSSの最適化確認
    const styles = resources.filter(r => r.type?.includes('css'));
    const totalStyleSize = styles.reduce((sum, s) => sum + s.size, 0);
    console.log(`CSS総サイズ: ${(totalStyleSize / 1024).toFixed(2)}KB`);

    // 不要なリダイレクトがないか確認
    const redirects = resources.filter(r => r.status >= 300 && r.status < 400);
    expect(redirects.length).toBe(0);

    // 404エラーがないか確認
    const notFound = resources.filter(r => r.status === 404);
    expect(notFound.length).toBe(0);
  });

  test('インタラクティブ性とレスポンシブネス', async ({ page }) => {
    await page.goto('/demo/integrated');
    await page.waitForLoadState('networkidle');

    // Time to Interactive (TTI) の測定
    const tti = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        let ttiValue = 0;
        
        // 5秒間ネットワークが静かで、メインスレッドがアイドル状態になるまで待つ
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          ttiValue = lastEntry.startTime + lastEntry.duration;
        });
        
        observer.observe({ entryTypes: ['longtask'] });
        
        // 5秒後に測定終了
        setTimeout(() => {
          observer.disconnect();
          resolve(ttiValue || performance.now());
        }, 5000);
      });
    });

    console.log(`Time to Interactive: ${tti.toFixed(2)}ms`);
    expect(tti).toBeLessThan(PERFORMANCE_THRESHOLDS.TTI);

    // First Input Delay (FID) のシミュレーション
    const inputDelay = await page.evaluate(async () => {
      const startTime = performance.now();
      
      // ユーザー入力をシミュレート
      const button = document.querySelector('button');
      if (button) {
        button.click();
      }
      
      // イベントループが処理されるまで待つ
      await new Promise(resolve => setTimeout(resolve, 0));
      
      return performance.now() - startTime;
    });

    console.log(`Simulated First Input Delay: ${inputDelay.toFixed(2)}ms`);
    expect(inputDelay).toBeLessThan(PERFORMANCE_THRESHOLDS.FID);

    // スクロールパフォーマンスの測定
    const scrollPerformance = await page.evaluate(async () => {
      const measurements: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        window.scrollBy(0, 100);
        await new Promise(resolve => requestAnimationFrame(resolve));
        measurements.push(performance.now() - startTime);
      }
      
      return {
        average: measurements.reduce((a, b) => a + b) / measurements.length,
        max: Math.max(...measurements)
      };
    });

    console.log(`スクロール平均時間: ${scrollPerformance.average.toFixed(2)}ms`);
    console.log(`スクロール最大時間: ${scrollPerformance.max.toFixed(2)}ms`);
    
    // 60fpsを維持するには16.67ms以下である必要がある
    expect(scrollPerformance.average).toBeLessThan(16.67);
  });

  test('メモリリークの検出', async ({ page }) => {
    await page.goto('/demo/integrated');
    
    // 初期メモリ使用量の記録
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // 重い操作を繰り返し実行
    for (let i = 0; i < 5; i++) {
      // セクション間の切り替え
      await page.click('text=認証システム');
      await page.waitForTimeout(500);
      await page.click('text=AIマッチング');
      await page.waitForTimeout(500);
      await page.click('text=データ出力');
      await page.waitForTimeout(500);
      await page.click('text=リアルタイム');
      await page.waitForTimeout(500);
    }

    // ガベージコレクションを強制実行
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    await page.waitForTimeout(1000);

    // 最終メモリ使用量の確認
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
    console.log(`メモリ増加量: ${memoryIncrease.toFixed(2)}MB`);

    // 許容可能なメモリ増加量（10MB以下）
    expect(memoryIncrease).toBeLessThan(10);
  });

  test('ネットワーク効率性の測定', async ({ page }) => {
    let totalTransferred = 0;
    let apiCallCount = 0;
    const apiResponseTimes: number[] = [];

    // ネットワーク監視
    page.on('response', response => {
      const url = response.url();
      const size = parseInt(response.headers()['content-length'] || '0');
      totalTransferred += size;

      if (url.includes('/api/')) {
        apiCallCount++;
        response.timing().then(timing => {
          if (timing) {
            apiResponseTimes.push(timing.responseEnd - timing.requestStart);
          }
        });
      }
    });

    await page.goto('/demo/integrated');
    
    // 各機能を使用
    await page.click('text=認証システム');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("ログイン")');
    await page.waitForTimeout(1000);

    // 結果の分析
    console.log('\n=== ネットワーク効率性分析 ===');
    console.log(`総転送量: ${(totalTransferred / 1024 / 1024).toFixed(2)}MB`);
    console.log(`API呼び出し回数: ${apiCallCount}`);
    
    if (apiResponseTimes.length > 0) {
      const avgApiTime = apiResponseTimes.reduce((a, b) => a + b) / apiResponseTimes.length;
      const maxApiTime = Math.max(...apiResponseTimes);
      
      console.log(`平均API応答時間: ${avgApiTime.toFixed(2)}ms`);
      console.log(`最大API応答時間: ${maxApiTime.toFixed(2)}ms`);
      
      expect(avgApiTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
    }

    // 初回読み込みで3MB以下が理想
    expect(totalTransferred).toBeLessThan(3 * 1024 * 1024);
  });
});