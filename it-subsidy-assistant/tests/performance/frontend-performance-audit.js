/**
 * フロントエンドパフォーマンス監査
 * Core Web Vitals、リソース最適化、レンダリングパフォーマンスの測定
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

// パフォーマンス監査結果
const performanceResults = {
  timestamp: new Date().toISOString(),
  coreWebVitals: [],
  resourceOptimization: [],
  renderingPerformance: [],
  recommendations: []
};

// Core Web Vitalsの闾値
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }  // Time to First Byte
};

test.describe('フロントエンドパフォーマンス監査', () => {
  test.describe('Core Web Vitals測定', () => {
    test('ホームページのCore Web Vitals', async ({ page }) => {
      // パフォーマンスオブザーバーを設定
      await page.evaluateOnNewDocument(() => {
        window.performanceMetrics = {
          LCP: 0,
          FID: 0,
          CLS: 0,
          FCP: 0,
          TTFB: 0
        };
        
        // LCPの測定
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          window.performanceMetrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // FIDの測定
        new PerformanceObserver((entryList) => {
          const firstInput = entryList.getEntries()[0];
          window.performanceMetrics.FID = firstInput.processingStart - firstInput.startTime;
        }).observe({ entryTypes: ['first-input'] });
        
        // CLSの測定
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              window.performanceMetrics.CLS = clsValue;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
        
        // FCPの測定
        new PerformanceObserver((entryList) => {
          const fcpEntry = entryList.getEntries().find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            window.performanceMetrics.FCP = fcpEntry.startTime;
          }
        }).observe({ entryTypes: ['paint'] });
      });
      
      // ページを読み込み
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // ユーザーインタラクションをシミュレート（FID測定用）
      await page.mouse.click(100, 100);
      
      // メトリクスが収集されるまで待機
      await page.waitForTimeout(5000);
      
      // パフォーマンスメトリクスを取得
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          ...window.performanceMetrics,
          TTFB: navigation.responseStart - navigation.requestStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart
        };
      });
      
      // 結果を記録
      performanceResults.coreWebVitals.push({
        page: 'ホームページ',
        metrics,
        evaluation: evaluateMetrics(metrics)
      });
    });
    
    test('検索ページのCore Web Vitals', async ({ page }) => {
      await page.goto('/search', { waitUntil: 'networkidle' });
      
      // 検索を実行
      await page.fill('[data-testid="search-input"]', 'IT導入補助金');
      await page.click('[data-testid="search-button"]');
      
      await page.waitForTimeout(3000);
      
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          TTFB: navigation.responseStart - navigation.requestStart,
          domInteractive: navigation.domInteractive - navigation.fetchStart,
          domComplete: navigation.domComplete - navigation.fetchStart
        };
      });
      
      performanceResults.coreWebVitals.push({
        page: '検索ページ',
        metrics,
        evaluation: evaluateMetrics(metrics)
      });
    });
  });
  
  test.describe('リソース最適化チェック', () => {
    test('画像最適化の確認', async ({ page }) => {
      await page.goto('/');
      
      // すべての画像を取得
      const images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          loading: img.loading,
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          format: img.src.split('.').pop()?.toLowerCase()
        }));
      });
      
      const imageIssues = [];
      
      for (const img of images) {
        // 遅延読み込みの確認
        if (img.loading !== 'lazy' && !isAboveTheFold(img)) {
          imageIssues.push({
            issue: '遅延読み込み未設定',
            image: img.src,
            recommendation: 'loading="lazy"属性を追加'
          });
        }
        
        // 画像サイズの確認
        if (img.naturalWidth > img.width * 2 || img.naturalHeight > img.height * 2) {
          imageIssues.push({
            issue: '過度に大きい画像',
            image: img.src,
            recommendation: `画像サイズを最適化 (${img.naturalWidth}x${img.naturalHeight} -> ${img.width}x${img.height})`
          });
        }
        
        // WebP形式の推奨
        if (img.format && ['jpg', 'jpeg', 'png'].includes(img.format)) {
          imageIssues.push({
            issue: '最適化されていない画像形式',
            image: img.src,
            recommendation: 'WebP形式への変換を検討'
          });
        }
        
        // altテキストの確認
        if (!img.alt) {
          imageIssues.push({
            issue: 'alt属性がありません',
            image: img.src,
            recommendation: 'アクセシビリティとSEOのためaltテキストを追加'
          });
        }
      }
      
      performanceResults.resourceOptimization.push({
        type: '画像最適化',
        totalImages: images.length,
        issues: imageIssues
      });
    });
    
    test('JavaScriptバンドルサイズの確認', async ({ page }) => {
      const coverage = await page.coverage.startJSCoverage();
      await page.goto('/', { waitUntil: 'networkidle' });
      const jsCoverage = await page.coverage.stopJSCoverage();
      
      let totalBytes = 0;
      let usedBytes = 0;
      const unusedScripts = [];
      
      for (const entry of jsCoverage) {
        totalBytes += entry.text.length;
        
        let usedLength = 0;
        for (const range of entry.ranges) {
          usedLength += range.end - range.start;
        }
        usedBytes += usedLength;
        
        const unusedPercentage = ((entry.text.length - usedLength) / entry.text.length) * 100;
        
        if (unusedPercentage > 50) {
          unusedScripts.push({
            url: entry.url,
            totalSize: entry.text.length,
            unusedSize: entry.text.length - usedLength,
            unusedPercentage: unusedPercentage.toFixed(2)
          });
        }
      }
      
      performanceResults.resourceOptimization.push({
        type: 'JavaScriptカバレッジ',
        totalSize: totalBytes,
        usedSize: usedBytes,
        unusedSize: totalBytes - usedBytes,
        unusedPercentage: ((totalBytes - usedBytes) / totalBytes * 100).toFixed(2),
        unusedScripts
      });
    });
    
    test('CSS最適化の確認', async ({ page }) => {
      const coverage = await page.coverage.startCSSCoverage();
      await page.goto('/', { waitUntil: 'networkidle' });
      const cssCoverage = await page.coverage.stopCSSCoverage();
      
      let totalBytes = 0;
      let usedBytes = 0;
      const unusedStyles = [];
      
      for (const entry of cssCoverage) {
        totalBytes += entry.text.length;
        
        let usedLength = 0;
        for (const range of entry.ranges) {
          usedLength += range.end - range.start;
        }
        usedBytes += usedLength;
        
        const unusedPercentage = ((entry.text.length - usedLength) / entry.text.length) * 100;
        
        if (unusedPercentage > 50) {
          unusedStyles.push({
            url: entry.url,
            totalSize: entry.text.length,
            unusedSize: entry.text.length - usedLength,
            unusedPercentage: unusedPercentage.toFixed(2)
          });
        }
      }
      
      performanceResults.resourceOptimization.push({
        type: 'CSSカバレッジ',
        totalSize: totalBytes,
        usedSize: usedBytes,
        unusedSize: totalBytes - usedBytes,
        unusedPercentage: ((totalBytes - usedBytes) / totalBytes * 100).toFixed(2),
        unusedStyles
      });
    });
    
    test('ネットワークリクエストの分析', async ({ page }) => {
      const requests = [];
      
      page.on('request', request => {
        requests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          timestamp: Date.now()
        });
      });
      
      page.on('response', response => {
        const request = requests.find(r => r.url === response.url());
        if (request) {
          request.status = response.status();
          request.size = response.headers()['content-length'] || 0;
          request.timing = response.timing();
        }
      });
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // リソースタイプ別に集計
      const resourceStats = {};
      for (const request of requests) {
        if (!resourceStats[request.resourceType]) {
          resourceStats[request.resourceType] = {
            count: 0,
            totalSize: 0,
            requests: []
          };
        }
        
        resourceStats[request.resourceType].count++;
        resourceStats[request.resourceType].totalSize += parseInt(request.size) || 0;
        resourceStats[request.resourceType].requests.push(request);
      }
      
      performanceResults.resourceOptimization.push({
        type: 'ネットワークリクエスト',
        totalRequests: requests.length,
        resourceStats,
        recommendations: generateNetworkRecommendations(resourceStats)
      });
    });
  });
  
  test.describe('レンダリングパフォーマンス', () => {
    test('レンダリングブロッキングの確認', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      const renderBlockingResources = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        
        const blocking = [];
        
        // ブロッキングスクリプトの確認
        scripts.forEach(script => {
          if (!script.async && !script.defer) {
            blocking.push({
              type: 'script',
              url: script.src,
              issue: 'レンダリングブロッキングスクリプト',
              recommendation: 'asyncまたはdefer属性を追加'
            });
          }
        });
        
        // ブロッキングCSSの確認
        stylesheets.forEach(link => {
          const media = link.getAttribute('media');
          if (!media || media === 'all' || media === 'screen') {
            blocking.push({
              type: 'stylesheet',
              url: link.href,
              issue: 'レンダリングブロッキングCSS',
              recommendation: 'クリティカルCSSのインライン化を検討'
            });
          }
        });
        
        return blocking;
      });
      
      performanceResults.renderingPerformance.push({
        type: 'レンダリングブロッキングリソース',
        count: renderBlockingResources.length,
        resources: renderBlockingResources
      });
    });
    
    test('フォント読み込みの最適化', async ({ page }) => {
      await page.goto('/');
      
      const fontLoading = await page.evaluate(() => {
        const fonts = [];
        const styleSheets = document.styleSheets;
        
        for (const sheet of styleSheets) {
          try {
            const rules = sheet.cssRules || sheet.rules;
            for (const rule of rules) {
              if (rule instanceof CSSFontFaceRule) {
                fonts.push({
                  family: rule.style.fontFamily,
                  src: rule.style.src,
                  display: rule.style.fontDisplay || 'auto'
                });
              }
            }
          } catch (e) {
            // クロスオリジンのスタイルシートはアクセスできない
          }
        }
        
        return fonts;
      });
      
      const fontIssues = [];
      for (const font of fontLoading) {
        if (font.display === 'auto' || font.display === 'block') {
          fontIssues.push({
            font: font.family,
            issue: 'font-displayが最適化されていません',
            recommendation: 'font-display: swapまたはfallbackを使用'
          });
        }
      }
      
      performanceResults.renderingPerformance.push({
        type: 'フォント読み込み',
        totalFonts: fontLoading.length,
        issues: fontIssues
      });
    });
    
    test('アニメーションパフォーマンス', async ({ page }) => {
      await page.goto('/');
      
      // FPS測定
      const fps = await page.evaluate(() => {
        return new Promise(resolve => {
          let frames = 0;
          let lastTime = performance.now();
          const measurements = [];
          
          function measureFPS() {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
              const fps = Math.round(frames * 1000 / (currentTime - lastTime));
              measurements.push(fps);
              frames = 0;
              lastTime = currentTime;
              
              if (measurements.length >= 5) {
                const avgFPS = measurements.reduce((a, b) => a + b) / measurements.length;
                resolve({
                  average: avgFPS,
                  min: Math.min(...measurements),
                  max: Math.max(...measurements),
                  measurements
                });
              } else {
                requestAnimationFrame(measureFPS);
              }
            } else {
              requestAnimationFrame(measureFPS);
            }
          }
          
          requestAnimationFrame(measureFPS);
        });
      });
      
      performanceResults.renderingPerformance.push({
        type: 'FPS測定',
        fps,
        recommendation: fps.average < 30 ? 'GPUアクセラレーションやtransform/opacityを使用したアニメーションを検討' : null
      });
    });
  });
});

// メトリクス評価関数
function evaluateMetrics(metrics) {
  const evaluation = {};
  
  for (const [metric, value] of Object.entries(metrics)) {
    if (PERFORMANCE_THRESHOLDS[metric]) {
      const threshold = PERFORMANCE_THRESHOLDS[metric];
      if (value <= threshold.good) {
        evaluation[metric] = 'good';
      } else if (value <= threshold.needsImprovement) {
        evaluation[metric] = 'needs-improvement';
      } else {
        evaluation[metric] = 'poor';
      }
    }
  }
  
  return evaluation;
}

// Above the foldの判定
function isAboveTheFold(img) {
  // 簡易的な判定（実際はビューポートに基づいて判定すべき）
  return img.height < 800;
}

// ネットワーク推奨事項の生成
function generateNetworkRecommendations(resourceStats) {
  const recommendations = [];
  
  // スクリプト数が多い場合
  if (resourceStats.script && resourceStats.script.count > 20) {
    recommendations.push({
      issue: 'JavaScriptファイルが多すぎます',
      recommendation: 'バンドルの統合やコード分割を検討'
    });
  }
  
  // CSSファイルが多い場合
  if (resourceStats.stylesheet && resourceStats.stylesheet.count > 10) {
    recommendations.push({
      issue: 'CSSファイルが多すぎます',
      recommendation: 'CSSの統合やクリティカルCSSの抽出を検討'
    });
  }
  
  // 画像の総サイズが大きい場合
  if (resourceStats.image && resourceStats.image.totalSize > 2 * 1024 * 1024) {
    recommendations.push({
      issue: '画像の総サイズが大きすぎます',
      recommendation: '画像の圧縮、WebP形式への変換、遅延読み込みを検討'
    });
  }
  
  return recommendations;
}

// レポートの保存
test.afterAll(async () => {
  // 推奨事項の生成
  generatePerformanceRecommendations();
  
  // レポートの保存
  const reportPath = path.join(__dirname, '../../reports/frontend-performance-audit.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(performanceResults, null, 2));
  
  // HTMLレポートの生成
  const htmlReport = generateHTMLReport(performanceResults);
  await fs.writeFile(
    path.join(__dirname, '../../reports/frontend-performance-audit.html'),
    htmlReport
  );
  
  console.log('\n=== フロントエンドパフォーマンス監査完了 ===');
  console.log('レポートが reports/frontend-performance-audit.html に保存されました');
});

// 推奨事項の生成
function generatePerformanceRecommendations() {
  // Core Web Vitalsの推奨
  for (const result of performanceResults.coreWebVitals) {
    for (const [metric, evaluation] of Object.entries(result.evaluation)) {
      if (evaluation === 'poor' || evaluation === 'needs-improvement') {
        performanceResults.recommendations.push({
          category: 'Core Web Vitals',
          metric,
          current: result.metrics[metric],
          target: PERFORMANCE_THRESHOLDS[metric]?.good,
          recommendation: getRecommendationForMetric(metric)
        });
      }
    }
  }
  
  // リソース最適化の推奨
  const jsOptimization = performanceResults.resourceOptimization.find(r => r.type === 'JavaScriptカバレッジ');
  if (jsOptimization && parseFloat(jsOptimization.unusedPercentage) > 30) {
    performanceResults.recommendations.push({
      category: 'リソース最適化',
      metric: 'JavaScript',
      issue: `未使用コードが${jsOptimization.unusedPercentage}%`,
      recommendation: 'Tree shaking、コード分割、動的インポートを使用してバンドルサイズを削減'
    });
  }
}

// メトリクス別の推奨事項
function getRecommendationForMetric(metric) {
  const recommendations = {
    LCP: '最大のコンテンツ要素の読み込みを最適化（画像の遅延読み込み、クリティカルCSSのインライン化）',
    FID: 'メインスレッドのブロッキングを減らす（Web Workerの使用、長いタスクの分割）',
    CLS: 'レイアウトシフトを防ぐ（サイズ属性の指定、フォントのpreload）',
    FCP: '初回コンテンツ表示の高速化（サーバー応答時間の改善、レンダリングブロッキングリソースの削減）',
    TTFB: 'サーバー応答時間の改善（CDNの使用、サーバーサイドキャッシュ）'
  };
  
  return recommendations[metric] || 'パフォーマンスの最適化が必要です';
}

// HTMLレポート生成
function generateHTMLReport(results) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>フロントエンドパフォーマンス監査レポート</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2 { color: #333; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #007bff; }
        .metric-card.good { border-left-color: #28a745; }
        .metric-card.needs-improvement { border-left-color: #ffc107; }
        .metric-card.poor { border-left-color: #dc3545; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .recommendation { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .issue { background: #f8d7da; padding: 10px; border-radius: 5px; margin: 5px 0; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 フロントエンドパフォーマンス監査レポート</h1>
        <p class="timestamp">監査日時: ${new Date(results.timestamp).toLocaleString('ja-JP')}</p>
        
        <h2>📊 Core Web Vitals</h2>
        ${results.coreWebVitals.map(result => `
            <h3>${result.page}</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                ${Object.entries(result.metrics).filter(([key]) => PERFORMANCE_THRESHOLDS[key]).map(([metric, value]) => `
                    <div class="metric-card ${result.evaluation[metric] || ''}">
                        <h4>${metric}</h4>
                        <div class="metric-value">${typeof value === 'number' ? value.toFixed(2) : value}${metric === 'CLS' ? '' : 'ms'}</div>
                        <div>評価: ${result.evaluation[metric] || 'N/A'}</div>
                    </div>
                `).join('')}
            </div>
        `).join('')}
        
        <h2>🔍 リソース最適化</h2>
        ${results.resourceOptimization.map(opt => `
            <div class="metric-card">
                <h3>${opt.type}</h3>
                ${opt.type.includes('カバレッジ') ? `
                    <p>総サイズ: ${(opt.totalSize / 1024).toFixed(2)}KB</p>
                    <p>使用済み: ${(opt.usedSize / 1024).toFixed(2)}KB</p>
                    <p>未使用: ${(opt.unusedSize / 1024).toFixed(2)}KB (${opt.unusedPercentage}%)</p>
                ` : ''}
                ${opt.issues && opt.issues.length > 0 ? `
                    <h4>問題点:</h4>
                    ${opt.issues.map(issue => `
                        <div class="issue">
                            <strong>${issue.issue}</strong><br>
                            ${issue.image || issue.url || ''}<br>
                            推奨: ${issue.recommendation}
                        </div>
                    `).join('')}
                ` : ''}
            </div>
        `).join('')}
        
        <h2>🎨 レンダリングパフォーマンス</h2>
        ${results.renderingPerformance.map(perf => `
            <div class="metric-card">
                <h3>${perf.type}</h3>
                ${perf.count !== undefined ? `<p>件数: ${perf.count}</p>` : ''}
                ${perf.resources ? `
                    <table>
                        <tr><th>タイプ</th><th>URL</th><th>問題</th><th>推奨</th></tr>
                        ${perf.resources.map(res => `
                            <tr>
                                <td>${res.type}</td>
                                <td>${res.url}</td>
                                <td>${res.issue}</td>
                                <td>${res.recommendation}</td>
                            </tr>
                        `).join('')}
                    </table>
                ` : ''}
                ${perf.fps ? `
                    <p>平均FPS: ${perf.fps.average}</p>
                    <p>最小FPS: ${perf.fps.min}</p>
                    <p>最大FPS: ${perf.fps.max}</p>
                ` : ''}
            </div>
        `).join('')}
        
        <h2>💡 推奨事項</h2>
        ${results.recommendations.map(rec => `
            <div class="recommendation">
                <h4>${rec.category} - ${rec.metric}</h4>
                ${rec.current ? `<p>現在値: ${rec.current}${rec.metric === 'CLS' ? '' : 'ms'}</p>` : ''}
                ${rec.target ? `<p>目標値: ${rec.target}${rec.metric === 'CLS' ? '' : 'ms'}</p>` : ''}
                ${rec.issue ? `<p>問題: ${rec.issue}</p>` : ''}
                <p>推奨: ${rec.recommendation}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
}