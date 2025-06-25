/**
 * Phase 2 パフォーマンス監視システム
 * API応答時間・ページロード性能の継続監視
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// パフォーマンス基準値
const PERFORMANCE_STANDARDS = {
  apiResponse: 200,        // 200ms以下
  pageLoad: 3000,         // 3秒以下
  firstContentfulPaint: 1500, // 1.5秒以下
  largestContentfulPaint: 2500, // 2.5秒以下
  cumulativeLayoutShift: 0.1,   // 0.1以下
  firstInputDelay: 100,    // 100ms以下
};

class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.reportPath = path.join(__dirname, '../reports/performance-report.json');
  }

  async runMonitoring(duration = 600000) { // 10分間監視
    console.log('🚀 パフォーマンス監視開始...');
    
    const endTime = Date.now() + duration;
    let testCount = 0;
    
    while (Date.now() < endTime) {
      testCount++;
      console.log(`\n📊 テスト実行 #${testCount}`);
      
      try {
        const metrics = await this.measurePerformance();
        this.metrics.push({
          timestamp: new Date().toISOString(),
          testNumber: testCount,
          ...metrics
        });
        
        // リアルタイム結果表示
        this.displayMetrics(metrics);
        
        // 基準値違反の警告
        this.checkViolations(metrics);
        
      } catch (error) {
        console.error(`❌ テスト #${testCount} でエラー:`, error.message);
      }
      
      // 30秒間隔
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    // 最終レポート生成
    await this.generateReport();
    console.log('✅ パフォーマンス監視完了');
  }

  async measurePerformance() {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      // パフォーマンス測定の準備
      const performanceMetrics = {
        pageLoad: null,
        apiResponses: [],
        webVitals: {},
        resourceLoading: {},
        errors: []
      };

      // API レスポンス時間の監視
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          const timing = response.timing();
          if (timing) {
            const responseTime = timing.responseEnd - timing.requestStart;
            performanceMetrics.apiResponses.push({
              url: response.url(),
              method: response.request().method(),
              status: response.status(),
              responseTime: responseTime,
              timestamp: Date.now()
            });
          }
        }
      });

      // エラーの監視
      page.on('pageerror', error => {
        performanceMetrics.errors.push({
          message: error.message,
          stack: error.stack,
          timestamp: Date.now()
        });
      });

      // Web Vitals の測定
      await page.addInitScript(() => {
        // First Contentful Paint
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              window.fcpTime = entry.startTime;
            }
          }
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          window.lcpTime = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.fidTime = entry.processingStart - entry.startTime;
          }
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let cumulativeLayoutShiftScore = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cumulativeLayoutShiftScore += entry.value;
            }
          }
          window.clsScore = cumulativeLayoutShiftScore;
        }).observe({ entryTypes: ['layout-shift'] });
      });

      // ページロード測定
      const startTime = Date.now();
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
      const endTime = Date.now();
      
      performanceMetrics.pageLoad = endTime - startTime;

      // Web Vitals の取得
      await page.waitForTimeout(2000); // メトリクス収集待機

      const webVitals = await page.evaluate(() => ({
        fcp: window.fcpTime || null,
        lcp: window.lcpTime || null,
        fid: window.fidTime || null,
        cls: window.clsScore || null
      }));

      performanceMetrics.webVitals = webVitals;

      // リソース読み込み時間の測定
      const resourceTimings = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map(entry => ({
          name: entry.name,
          duration: entry.duration,
          transferSize: entry.transferSize,
          type: entry.initiatorType
        }));
      });

      performanceMetrics.resourceLoading = {
        totalResources: resourceTimings.length,
        averageLoadTime: resourceTimings.reduce((sum, r) => sum + r.duration, 0) / resourceTimings.length,
        slowestResources: resourceTimings
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5)
      };

      // ユーザーインタラクション測定
      await this.measureInteractionPerformance(page, performanceMetrics);

      await browser.close();
      return performanceMetrics;

    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async measureInteractionPerformance(page, metrics) {
    try {
      // ボタンクリック応答時間
      const buttons = await page.$$('button:not([disabled])');
      const interactions = [];

      for (const button of buttons.slice(0, 3)) {
        const startTime = performance.now();
        await button.click();
        await page.waitForTimeout(100);
        const endTime = performance.now();
        
        interactions.push(endTime - startTime);
      }

      metrics.interactionTimes = interactions;

      // フォーム入力応答性
      const inputs = await page.$$('input[type="text"]');
      const inputTimes = [];

      for (const input of inputs.slice(0, 2)) {
        const startTime = performance.now();
        await input.fill('パフォーマンステスト');
        const endTime = performance.now();
        
        inputTimes.push(endTime - startTime);
      }

      metrics.inputResponseTimes = inputTimes;

    } catch (error) {
      console.warn('インタラクション測定エラー:', error.message);
    }
  }

  displayMetrics(metrics) {
    console.log('📈 パフォーマンスメトリクス:');
    console.log(`  ページロード: ${metrics.pageLoad}ms`);
    
    if (metrics.apiResponses.length > 0) {
      const avgApiTime = metrics.apiResponses.reduce((sum, api) => sum + api.responseTime, 0) / metrics.apiResponses.length;
      console.log(`  平均API応答: ${Math.round(avgApiTime)}ms`);
    }
    
    if (metrics.webVitals.fcp) {
      console.log(`  FCP: ${Math.round(metrics.webVitals.fcp)}ms`);
    }
    
    if (metrics.webVitals.lcp) {
      console.log(`  LCP: ${Math.round(metrics.webVitals.lcp)}ms`);
    }
    
    if (metrics.webVitals.cls !== null) {
      console.log(`  CLS: ${metrics.webVitals.cls.toFixed(3)}`);
    }
    
    if (metrics.errors.length > 0) {
      console.log(`  ❌ エラー数: ${metrics.errors.length}`);
    }
  }

  checkViolations(metrics) {
    const violations = [];

    if (metrics.pageLoad > PERFORMANCE_STANDARDS.pageLoad) {
      violations.push(`ページロード時間違反: ${metrics.pageLoad}ms (基準: ${PERFORMANCE_STANDARDS.pageLoad}ms)`);
    }

    for (const api of metrics.apiResponses) {
      if (api.responseTime > PERFORMANCE_STANDARDS.apiResponse) {
        violations.push(`API応答時間違反: ${api.url} ${api.responseTime}ms`);
      }
    }

    if (metrics.webVitals.fcp && metrics.webVitals.fcp > PERFORMANCE_STANDARDS.firstContentfulPaint) {
      violations.push(`FCP違反: ${Math.round(metrics.webVitals.fcp)}ms`);
    }

    if (metrics.webVitals.lcp && metrics.webVitals.lcp > PERFORMANCE_STANDARDS.largestContentfulPaint) {
      violations.push(`LCP違反: ${Math.round(metrics.webVitals.lcp)}ms`);
    }

    if (metrics.webVitals.cls && metrics.webVitals.cls > PERFORMANCE_STANDARDS.cumulativeLayoutShift) {
      violations.push(`CLS違反: ${metrics.webVitals.cls.toFixed(3)}`);
    }

    if (violations.length > 0) {
      console.log('\n⚠️ パフォーマンス基準違反:');
      violations.forEach(violation => console.log(`  - ${violation}`));
    }
  }

  async generateReport() {
    if (this.metrics.length === 0) {
      console.log('📊 測定データがありません');
      return;
    }

    // 統計計算
    const stats = this.calculateStatistics();
    
    // レポート生成
    const report = {
      generatedAt: new Date().toISOString(),
      testCount: this.metrics.length,
      duration: this.calculateDuration(),
      statistics: stats,
      standards: PERFORMANCE_STANDARDS,
      compliance: this.calculateCompliance(stats),
      recommendations: this.generateRecommendations(stats),
      rawData: this.metrics
    };

    // ファイル保存
    await this.ensureReportDirectory();
    await fs.writeFile(this.reportPath, JSON.stringify(report, null, 2));
    
    // サマリー表示
    this.displaySummary(report);
    
    console.log(`\n📄 詳細レポート: ${this.reportPath}`);
  }

  calculateStatistics() {
    const pageLoads = this.metrics.map(m => m.pageLoad).filter(v => v !== null);
    const apiResponses = this.metrics.flatMap(m => m.apiResponses).map(api => api.responseTime);
    const fcps = this.metrics.map(m => m.webVitals.fcp).filter(v => v !== null);
    const lcps = this.metrics.map(m => m.webVitals.lcp).filter(v => v !== null);
    const clss = this.metrics.map(m => m.webVitals.cls).filter(v => v !== null);

    return {
      pageLoad: this.calculateMetricStats(pageLoads),
      apiResponse: this.calculateMetricStats(apiResponses),
      fcp: this.calculateMetricStats(fcps),
      lcp: this.calculateMetricStats(lcps),
      cls: this.calculateMetricStats(clss),
      errorRate: this.calculateErrorRate()
    };
  }

  calculateMetricStats(values) {
    if (values.length === 0) return null;

    const sorted = values.sort((a, b) => a - b);
    return {
      min: Math.round(sorted[0]),
      max: Math.round(sorted[sorted.length - 1]),
      avg: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length),
      median: Math.round(sorted[Math.floor(sorted.length / 2)]),
      p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
      count: values.length
    };
  }

  calculateErrorRate() {
    const totalErrors = this.metrics.reduce((sum, m) => sum + m.errors.length, 0);
    const totalTests = this.metrics.length;
    return (totalErrors / totalTests * 100).toFixed(2);
  }

  calculateDuration() {
    if (this.metrics.length < 2) return 0;
    
    const start = new Date(this.metrics[0].timestamp);
    const end = new Date(this.metrics[this.metrics.length - 1].timestamp);
    return Math.round((end - start) / 1000 / 60); // 分
  }

  calculateCompliance(stats) {
    const compliance = {};

    if (stats.pageLoad) {
      compliance.pageLoad = (stats.pageLoad.avg <= PERFORMANCE_STANDARDS.pageLoad) ? 'PASS' : 'FAIL';
    }

    if (stats.apiResponse) {
      compliance.apiResponse = (stats.apiResponse.avg <= PERFORMANCE_STANDARDS.apiResponse) ? 'PASS' : 'FAIL';
    }

    if (stats.fcp) {
      compliance.fcp = (stats.fcp.avg <= PERFORMANCE_STANDARDS.firstContentfulPaint) ? 'PASS' : 'FAIL';
    }

    if (stats.lcp) {
      compliance.lcp = (stats.lcp.avg <= PERFORMANCE_STANDARDS.largestContentfulPaint) ? 'PASS' : 'FAIL';
    }

    if (stats.cls) {
      compliance.cls = (stats.cls.avg <= PERFORMANCE_STANDARDS.cumulativeLayoutShift) ? 'PASS' : 'FAIL';
    }

    return compliance;
  }

  generateRecommendations(stats) {
    const recommendations = [];

    if (stats.pageLoad && stats.pageLoad.avg > PERFORMANCE_STANDARDS.pageLoad) {
      recommendations.push({
        category: 'ページロード',
        priority: 'HIGH',
        description: 'ページロード時間を最適化してください',
        suggestions: [
          '画像の最適化と遅延読み込み',
          'JavaScript/CSSの最小化',
          'CDNの導入検討'
        ]
      });
    }

    if (stats.apiResponse && stats.apiResponse.avg > PERFORMANCE_STANDARDS.apiResponse) {
      recommendations.push({
        category: 'API応答',
        priority: 'HIGH',
        description: 'API応答時間を改善してください',
        suggestions: [
          'データベースクエリの最適化',
          'キャッシュの実装',
          'サーバーリソースの増強'
        ]
      });
    }

    if (stats.lcp && stats.lcp.avg > PERFORMANCE_STANDARDS.largestContentfulPaint) {
      recommendations.push({
        category: 'LCP',
        priority: 'MEDIUM',
        description: 'Largest Contentful Paintの改善',
        suggestions: [
          '重要なリソースのプリロード',
          'サーバー応答時間の最適化',
          '重要でないJavaScriptの延期'
        ]
      });
    }

    if (parseFloat(stats.errorRate) > 5) {
      recommendations.push({
        category: 'エラー率',
        priority: 'HIGH',
        description: 'エラー率が高すぎます',
        suggestions: [
          'エラーログの詳細分析',
          'エラーハンドリングの改善',
          'ユーザビリティテストの実施'
        ]
      });
    }

    return recommendations;
  }

  displaySummary(report) {
    console.log('\n📊 パフォーマンス監視サマリー');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`測定期間: ${report.duration}分`);
    console.log(`測定回数: ${report.testCount}回`);
    console.log(`エラー率: ${report.statistics.errorRate}%`);
    
    console.log('\n📈 主要メトリクス:');
    if (report.statistics.pageLoad) {
      console.log(`  ページロード平均: ${report.statistics.pageLoad.avg}ms ${report.compliance.pageLoad === 'PASS' ? '✅' : '❌'}`);
    }
    
    if (report.statistics.apiResponse) {
      console.log(`  API応答平均: ${report.statistics.apiResponse.avg}ms ${report.compliance.apiResponse === 'PASS' ? '✅' : '❌'}`);
    }
    
    if (report.statistics.fcp) {
      console.log(`  FCP平均: ${report.statistics.fcp.avg}ms ${report.compliance.fcp === 'PASS' ? '✅' : '❌'}`);
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n⚠️ 改善推奨事項:');
      report.recommendations.forEach(rec => {
        console.log(`  - [${rec.priority}] ${rec.description}`);
      });
    }
  }

  async ensureReportDirectory() {
    const dir = path.dirname(this.reportPath);
    await fs.mkdir(dir, { recursive: true });
  }
}

// CLI実行
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  const duration = process.argv[2] ? parseInt(process.argv[2]) * 1000 : 600000; // デフォルト10分
  
  monitor.runMonitoring(duration).catch(error => {
    console.error('❌ 監視エラー:', error);
    process.exit(1);
  });
}

module.exports = { PerformanceMonitor, PERFORMANCE_STANDARDS };