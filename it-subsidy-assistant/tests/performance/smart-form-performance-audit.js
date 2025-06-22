/**
 * スマートフォームシステム パフォーマンス監査ツール
 * ボトルネック特定とスケーラビリティ検証
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class SmartFormPerformanceAuditor {
  constructor() {
    this.performanceData = {
      pageLoad: [],
      formSubmission: [],
      resourceLoading: [],
      memoryUsage: [],
      networkRequests: [],
      renderingMetrics: []
    };
    this.bottlenecks = [];
    this.recommendations = [];
  }

  // ページロードパフォーマンス測定
  async measurePageLoadPerformance(page, url) {
    console.log('📊 ページロードパフォーマンスを測定中...');
    
    const metrics = [];
    
    // 複数回測定して平均を取る
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      
      // ナビゲーション開始
      await page.goto(url, { waitUntil: 'load' });
      
      // Core Web Vitals の測定
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals = {
              FCP: null, // First Contentful Paint
              LCP: null, // Largest Contentful Paint
              FID: null, // First Input Delay
              CLS: null  // Cumulative Layout Shift
            };
            
            entries.forEach(entry => {
              if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
                vitals.FCP = entry.startTime;
              }
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.LCP = entry.startTime;
              }
              if (entry.entryType === 'first-input') {
                vitals.FID = entry.processingStart - entry.startTime;
              }
              if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                vitals.CLS = (vitals.CLS || 0) + entry.value;
              }
            });
            
            setTimeout(() => resolve(vitals), 3000);
          });
          
          observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
        });
      });

      // ページロード完了時間
      const loadEndTime = Date.now();
      const totalLoadTime = loadEndTime - startTime;

      // リソース読み込み時間の詳細
      const resourceTiming = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        return resources.map(resource => ({
          name: resource.name,
          duration: resource.duration,
          size: resource.transferSize || 0,
          type: resource.initiatorType
        }));
      });

      metrics.push({
        iteration: i + 1,
        totalLoadTime,
        webVitals,
        resourceTiming,
        timestamp: new Date().toISOString()
      });

      // 測定間隔
      await page.waitForTimeout(2000);
    }

    this.performanceData.pageLoad = metrics;
    return this.analyzePageLoadMetrics(metrics);
  }

  // フォーム送信パフォーマンス測定
  async measureFormSubmissionPerformance(page) {
    console.log('📝 フォーム送信パフォーマンスを測定中...');
    
    const formMetrics = [];
    
    // 異なるデータサイズでテスト
    const testSizes = [
      { name: '小', data: this.generateSmallFormData() },
      { name: '中', data: this.generateMediumFormData() },
      { name: '大', data: this.generateLargeFormData() }
    ];

    for (const testSize of testSizes) {
      const metrics = [];
      
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        
        // フォーム入力
        await this.fillForm(page, testSize.data);
        
        // ネットワーク監視開始
        const networkRequests = [];
        page.on('request', request => {
          networkRequests.push({
            url: request.url(),
            method: request.method(),
            size: request.postData()?.length || 0,
            timestamp: Date.now()
          });
        });

        // フォーム送信
        const submitStartTime = Date.now();
        await page.click('button[type="submit"], input[type="submit"]');
        
        // 応答待機
        try {
          await page.waitForSelector('.success, .complete, .error', { timeout: 30000 });
        } catch (error) {
          console.warn('フォーム送信の応答が確認できませんでした');
        }
        
        const submitEndTime = Date.now();
        const submitDuration = submitEndTime - submitStartTime;
        const totalDuration = submitEndTime - startTime;

        metrics.push({
          iteration: i + 1,
          size: testSize.name,
          submitDuration,
          totalDuration,
          networkRequests: networkRequests.length,
          timestamp: new Date().toISOString()
        });

        // フォームリセット
        await page.reload();
        await page.waitForTimeout(1000);
      }
      
      formMetrics.push({
        size: testSize.name,
        metrics
      });
    }

    this.performanceData.formSubmission = formMetrics;
    return this.analyzeFormSubmissionMetrics(formMetrics);
  }

  // リソース読み込み分析
  async analyzeResourceLoading(page) {
    console.log('🔍 リソース読み込みを分析中...');
    
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    
    const resourceAnalysis = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const analysis = {
        total: resources.length,
        byType: {},
        bySize: {},
        slowResources: [],
        totalSize: 0,
        totalDuration: 0
      };

      resources.forEach(resource => {
        const type = resource.initiatorType || 'other';
        const size = resource.transferSize || 0;
        const duration = resource.duration;

        // タイプ別集計
        analysis.byType[type] = (analysis.byType[type] || 0) + 1;

        // サイズ別集計
        if (size > 1024 * 1024) { // 1MB以上
          analysis.bySize.large = (analysis.bySize.large || 0) + 1;
        } else if (size > 100 * 1024) { // 100KB以上
          analysis.bySize.medium = (analysis.bySize.medium || 0) + 1;
        } else {
          analysis.bySize.small = (analysis.bySize.small || 0) + 1;
        }

        // 遅いリソースの検出
        if (duration > 2000) { // 2秒以上
          analysis.slowResources.push({
            name: resource.name,
            duration: duration,
            size: size,
            type: type
          });
        }

        analysis.totalSize += size;
        analysis.totalDuration += duration;
      });

      return analysis;
    });

    this.performanceData.resourceLoading = resourceAnalysis;
    return resourceAnalysis;
  }

  // メモリ使用量監視
  async monitorMemoryUsage(page) {
    console.log('💾 メモリ使用量を監視中...');
    
    const memoryMetrics = [];
    
    // 初期状態
    let initialMemory = await this.getMemoryUsage(page);
    memoryMetrics.push({ stage: 'initial', ...initialMemory });

    // フォーム操作後
    await this.performFormOperations(page);
    let afterFormMemory = await this.getMemoryUsage(page);
    memoryMetrics.push({ stage: 'after_form', ...afterFormMemory });

    // 大量データ処理後
    await this.processLargeDataSet(page);
    let afterLargeDataMemory = await this.getMemoryUsage(page);
    memoryMetrics.push({ stage: 'after_large_data', ...afterLargeDataMemory });

    // ガベージコレクション強制実行
    await page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });
    let afterGCMemory = await this.getMemoryUsage(page);
    memoryMetrics.push({ stage: 'after_gc', ...afterGCMemory });

    this.performanceData.memoryUsage = memoryMetrics;
    return this.analyzeMemoryUsage(memoryMetrics);
  }

  // メモリ使用量取得
  async getMemoryUsage(page) {
    return await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          timestamp: Date.now()
        };
      }
      return null;
    });
  }

  // 負荷テスト
  async runLoadTest(url, concurrentUsers = 10, duration = 60000) {
    console.log(`⚡ 負荷テストを実行中 (${concurrentUsers}並行ユーザー, ${duration/1000}秒)...`);
    
    const browsers = [];
    const results = [];
    
    try {
      // 並行ユーザーのブラウザを起動
      for (let i = 0; i < concurrentUsers; i++) {
        const browser = await chromium.launch({ headless: true });
        browsers.push(browser);
      }

      const startTime = Date.now();
      const endTime = startTime + duration;
      
      // 並行テスト実行
      const promises = browsers.map(async (browser, index) => {
        const page = await browser.newPage();
        const userResults = {
          userId: index + 1,
          requests: 0,
          errors: 0,
          responseTimes: [],
          startTime: Date.now()
        };

        while (Date.now() < endTime) {
          try {
            const requestStart = Date.now();
            
            await page.goto(url);
            await this.performRandomFormAction(page);
            
            const requestEnd = Date.now();
            const responseTime = requestEnd - requestStart;
            
            userResults.requests++;
            userResults.responseTimes.push(responseTime);
            
            if (responseTime > 10000) { // 10秒以上は異常
              userResults.errors++;
            }
            
          } catch (error) {
            userResults.errors++;
          }
          
          // 少し待機
          await page.waitForTimeout(Math.random() * 2000 + 1000);
        }
        
        userResults.endTime = Date.now();
        userResults.duration = userResults.endTime - userResults.startTime;
        userResults.avgResponseTime = userResults.responseTimes.reduce((a, b) => a + b, 0) / userResults.responseTimes.length;
        
        return userResults;
      });

      const userResults = await Promise.all(promises);
      
      // 結果の集計
      const totalRequests = userResults.reduce((sum, user) => sum + user.requests, 0);
      const totalErrors = userResults.reduce((sum, user) => sum + user.errors, 0);
      const allResponseTimes = userResults.flatMap(user => user.responseTimes);
      
      const loadTestResults = {
        concurrentUsers,
        duration: duration / 1000,
        totalRequests,
        totalErrors,
        errorRate: (totalErrors / totalRequests) * 100,
        avgResponseTime: allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length,
        maxResponseTime: Math.max(...allResponseTimes),
        minResponseTime: Math.min(...allResponseTimes),
        requestsPerSecond: totalRequests / (duration / 1000),
        userResults
      };

      return loadTestResults;
      
    } finally {
      // ブラウザのクリーンアップ
      for (const browser of browsers) {
        await browser.close();
      }
    }
  }

  // ボトルネック分析
  analyzeBottlenecks() {
    console.log('🔍 ボトルネックを分析中...');
    
    const bottlenecks = [];

    // ページロードのボトルネック
    if (this.performanceData.pageLoad.length > 0) {
      const avgLoadTime = this.performanceData.pageLoad.reduce((sum, metric) => 
        sum + metric.totalLoadTime, 0) / this.performanceData.pageLoad.length;
      
      if (avgLoadTime > 3000) {
        bottlenecks.push({
          type: 'page_load',
          severity: 'HIGH',
          description: `ページロード時間が遅い (平均${avgLoadTime.toFixed(0)}ms)`,
          recommendation: 'リソースの最適化、CDN使用、画像圧縮を検討'
        });
      }
    }

    // フォーム送信のボトルネック
    if (this.performanceData.formSubmission.length > 0) {
      this.performanceData.formSubmission.forEach(sizeGroup => {
        const avgSubmitTime = sizeGroup.metrics.reduce((sum, metric) => 
          sum + metric.submitDuration, 0) / sizeGroup.metrics.length;
        
        if (avgSubmitTime > 5000) {
          bottlenecks.push({
            type: 'form_submission',
            severity: 'MEDIUM',
            description: `フォーム送信が遅い (${sizeGroup.size}サイズ: 平均${avgSubmitTime.toFixed(0)}ms)`,
            recommendation: 'サーバーサイド処理の最適化、非同期処理の導入'
          });
        }
      });
    }

    // リソース読み込みのボトルネック
    if (this.performanceData.resourceLoading) {
      const resource = this.performanceData.resourceLoading;
      
      if (resource.slowResources.length > 0) {
        bottlenecks.push({
          type: 'slow_resources',
          severity: 'MEDIUM',
          description: `遅いリソースが${resource.slowResources.length}個検出`,
          recommendation: 'リソースの最適化、遅延読み込み、キャッシュ戦略の見直し'
        });
      }

      if (resource.totalSize > 5 * 1024 * 1024) { // 5MB以上
        bottlenecks.push({
          type: 'large_bundle_size',
          severity: 'HIGH',
          description: `バンドルサイズが大きい (${(resource.totalSize / 1024 / 1024).toFixed(1)}MB)`,
          recommendation: 'コード分割、Tree shaking、圧縮の実装'
        });
      }
    }

    // メモリ使用量のボトルネック
    if (this.performanceData.memoryUsage.length > 0) {
      const maxMemory = Math.max(...this.performanceData.memoryUsage.map(m => m.used || 0));
      
      if (maxMemory > 100 * 1024 * 1024) { // 100MB以上
        bottlenecks.push({
          type: 'high_memory_usage',
          severity: 'MEDIUM',
          description: `メモリ使用量が高い (最大${(maxMemory / 1024 / 1024).toFixed(1)}MB)`,
          recommendation: 'メモリリークの調査、不要なオブジェクトの解放'
        });
      }
    }

    this.bottlenecks = bottlenecks;
    return bottlenecks;
  }

  // パフォーマンス推奨事項生成
  generateRecommendations() {
    const recommendations = [];

    // 一般的な推奨事項
    recommendations.push({
      category: 'リソース最適化',
      priority: 'HIGH',
      items: [
        'CSS/JSファイルの圧縮と結合',
        '画像の最適化（WebP形式の使用）',
        'フォントの最適化と事前読み込み',
        '不要なCSS/JSの削除'
      ]
    });

    recommendations.push({
      category: 'ネットワーク最適化',
      priority: 'MEDIUM',
      items: [
        'CDNの導入',
        'HTTP/2の活用',
        'Gzip圧縮の有効化',
        'キャッシュ戦略の最適化'
      ]
    });

    recommendations.push({
      category: 'レンダリング最適化',
      priority: 'MEDIUM',
      items: [
        'Critical CSSのインライン化',
        'JavaScriptの非同期読み込み',
        '画像の遅延読み込み',
        'フォームの段階的エンハンスメント'
      ]
    });

    // ボトルネックに基づく推奨事項
    this.bottlenecks.forEach(bottleneck => {
      const existing = recommendations.find(r => r.category === bottleneck.type);
      if (!existing) {
        recommendations.push({
          category: bottleneck.type,
          priority: bottleneck.severity,
          items: [bottleneck.recommendation]
        });
      }
    });

    this.recommendations = recommendations;
    return recommendations;
  }

  // ヘルパーメソッド
  generateSmallFormData() {
    return {
      name: 'テスト太郎',
      email: 'test@example.com',
      phone: '090-1234-5678'
    };
  }

  generateMediumFormData() {
    return {
      ...this.generateSmallFormData(),
      address: '東京都渋谷区テスト1-2-3',
      description: 'a'.repeat(500),
      category: 'business'
    };
  }

  generateLargeFormData() {
    return {
      ...this.generateMediumFormData(),
      longText: 'a'.repeat(5000),
      details: 'b'.repeat(3000),
      notes: 'c'.repeat(2000)
    };
  }

  async fillForm(page, data) {
    for (const [field, value] of Object.entries(data)) {
      try {
        await page.fill(`[name="${field}"], #${field}`, String(value));
      } catch (error) {
        // フィールドが見つからない場合はスキップ
      }
    }
  }

  async performFormOperations(page) {
    await this.fillForm(page, this.generateMediumFormData());
    await page.click('button[type="submit"], input[type="submit"]');
  }

  async processLargeDataSet(page) {
    await this.fillForm(page, this.generateLargeFormData());
  }

  async performRandomFormAction(page) {
    const actions = [
      () => page.click('input'),
      () => page.fill('input[type="text"]', 'test'),
      () => page.click('button')
    ];
    
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    try {
      await randomAction();
    } catch (error) {
      // エラーは無視
    }
  }

  analyzePageLoadMetrics(metrics) {
    const avgLoadTime = metrics.reduce((sum, m) => sum + m.totalLoadTime, 0) / metrics.length;
    const avgFCP = metrics.reduce((sum, m) => sum + (m.webVitals.FCP || 0), 0) / metrics.length;
    const avgLCP = metrics.reduce((sum, m) => sum + (m.webVitals.LCP || 0), 0) / metrics.length;
    
    return {
      averageLoadTime: avgLoadTime,
      averageFCP: avgFCP,
      averageLCP: avgLCP,
      status: avgLoadTime < 3000 ? 'GOOD' : avgLoadTime < 5000 ? 'NEEDS_IMPROVEMENT' : 'POOR'
    };
  }

  analyzeFormSubmissionMetrics(formMetrics) {
    return formMetrics.map(sizeGroup => {
      const avgSubmitTime = sizeGroup.metrics.reduce((sum, m) => sum + m.submitDuration, 0) / sizeGroup.metrics.length;
      return {
        size: sizeGroup.size,
        averageSubmitTime: avgSubmitTime,
        status: avgSubmitTime < 2000 ? 'GOOD' : avgSubmitTime < 5000 ? 'NEEDS_IMPROVEMENT' : 'POOR'
      };
    });
  }

  analyzeMemoryUsage(memoryMetrics) {
    const maxMemory = Math.max(...memoryMetrics.map(m => m.used || 0));
    const memoryGrowth = memoryMetrics[memoryMetrics.length - 1].used - memoryMetrics[0].used;
    
    return {
      maxMemoryUsage: maxMemory,
      memoryGrowth: memoryGrowth,
      status: maxMemory < 50 * 1024 * 1024 ? 'GOOD' : maxMemory < 100 * 1024 * 1024 ? 'NEEDS_IMPROVEMENT' : 'POOR'
    };
  }

  // メイン監査実行
  async runPerformanceAudit(url = 'http://localhost:5174') {
    console.log('🚀 スマートフォームパフォーマンス監査を開始...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
      // 各種パフォーマンステストを実行
      const pageLoadAnalysis = await this.measurePageLoadPerformance(page, url);
      const formSubmissionAnalysis = await this.measureFormSubmissionPerformance(page);
      const resourceAnalysis = await this.analyzeResourceLoading(page);
      const memoryAnalysis = await this.monitorMemoryUsage(page);
      
      // 負荷テスト
      const loadTestResults = await this.runLoadTest(url, 5, 30000);
      
      // ボトルネック分析
      const bottlenecks = this.analyzeBottlenecks();
      
      // 推奨事項生成
      const recommendations = this.generateRecommendations();
      
      // 結果をまとめる
      const report = {
        timestamp: new Date().toISOString(),
        pageLoad: pageLoadAnalysis,
        formSubmission: formSubmissionAnalysis,
        resourceLoading: resourceAnalysis,
        memoryUsage: memoryAnalysis,
        loadTest: loadTestResults,
        bottlenecks,
        recommendations,
        summary: {
          overallStatus: this.calculateOverallStatus(),
          criticalIssues: bottlenecks.filter(b => b.severity === 'HIGH').length,
          improvementAreas: bottlenecks.filter(b => b.severity === 'MEDIUM').length
        }
      };
      
      // レポート保存
      const reportPath = path.join(__dirname, '../../reports/smart-form-performance-audit.json');
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log('📊 パフォーマンス監査レポート生成:', reportPath);
      
      return report;
      
    } finally {
      await browser.close();
    }
  }

  calculateOverallStatus() {
    const highSeverityCount = this.bottlenecks.filter(b => b.severity === 'HIGH').length;
    const mediumSeverityCount = this.bottlenecks.filter(b => b.severity === 'MEDIUM').length;
    
    if (highSeverityCount > 0) return 'POOR';
    if (mediumSeverityCount > 2) return 'NEEDS_IMPROVEMENT';
    return 'GOOD';
  }
}

// 監査実行関数
async function runPerformanceAudit() {
  const auditor = new SmartFormPerformanceAuditor();
  try {
    const report = await auditor.runPerformanceAudit();
    
    console.log('\n🎯 パフォーマンス監査完了:');
    console.log(`全体ステータス: ${report.summary.overallStatus}`);
    console.log(`重要な問題: ${report.summary.criticalIssues}件`);
    console.log(`改善エリア: ${report.summary.improvementAreas}件`);
    
    return report;
  } catch (error) {
    console.error('パフォーマンス監査中にエラーが発生:', error);
    throw error;
  }
}

module.exports = { SmartFormPerformanceAuditor, runPerformanceAudit };

if (require.main === module) {
  runPerformanceAudit();
}