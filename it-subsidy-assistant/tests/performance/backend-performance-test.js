/**
 * バックエンドパフォーマンステスト
 * APIエンドポイントのレスポンスタイム、スループット、リソース使用率の測定
 */

const autocannon = require('autocannon');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// テスト結果を保存するオブジェクト
const performanceResults = {
  timestamp: new Date().toISOString(),
  endpoints: [],
  databasePerformance: [],
  cachePerformance: [],
  resourceUsage: [],
  recommendations: []
};

// APIエンドポイントの定義
const endpoints = [
  {
    name: '補助金一覧取得',
    method: 'GET',
    url: '/api/subsidies',
    expectedResponseTime: 200,
    expectedThroughput: 100
  },
  {
    name: '補助金検索',
    method: 'GET',
    url: '/api/subsidies/search?q=IT&category=it-donyu',
    expectedResponseTime: 300,
    expectedThroughput: 50
  },
  {
    name: '適格性チェック',
    method: 'POST',
    url: '/api/eligibility/check',
    body: {
      companySize: 'small',
      industry: 'it',
      investmentAmount: 1000000,
      subsidyId: 'it-donyu-2025'
    },
    expectedResponseTime: 500,
    expectedThroughput: 30
  },
  {
    name: '書類生成',
    method: 'POST',
    url: '/api/documents/generate',
    body: {
      subsidyId: 'it-donyu-2025',
      companyInfo: {
        name: 'テスト企業',
        employeeCount: 50
      }
    },
    expectedResponseTime: 1000,
    expectedThroughput: 10
  }
];

// 負荷テストの実行
async function runLoadTest(endpoint, duration = 30, connections = 10) {
  console.log(`\n🚀 ${endpoint.name} の負荷テストを実行中...`);
  
  const instance = autocannon({
    url: `http://localhost:3001${endpoint.url}`,
    method: endpoint.method,
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token' // テスト用トークン
    },
    duration,
    connections,
    pipelining: 1,
    bailout: 1000 // 1000エラーで中止
  });
  
  return new Promise((resolve) => {
    autocannon.track(instance, {
      renderProgressBar: true,
      renderResultsTable: true
    });
    
    instance.on('done', (result) => {
      const summary = {
        endpoint: endpoint.name,
        url: endpoint.url,
        method: endpoint.method,
        duration: result.duration,
        requests: {
          total: result.requests.total,
          persec: result.requests.persec
        },
        throughput: {
          total: result.throughput.total,
          persec: result.throughput.average
        },
        latency: {
          min: result.latency.min,
          max: result.latency.max,
          average: result.latency.average,
          p50: result.latency.p50,
          p90: result.latency.p90,
          p99: result.latency.p99
        },
        errors: result.errors,
        timeouts: result.timeouts,
        non2xx: result.non2xx,
        performance: evaluatePerformance(endpoint, result)
      };
      
      performanceResults.endpoints.push(summary);
      resolve(summary);
    });
  });
}

// パフォーマンス評価
function evaluatePerformance(endpoint, result) {
  const evaluation = {
    responseTime: 'PASS',
    throughput: 'PASS',
    errorRate: 'PASS',
    overall: 'PASS'
  };
  
  // レスポンスタイムの評価
  if (result.latency.p90 > endpoint.expectedResponseTime) {
    evaluation.responseTime = 'FAIL';
    evaluation.overall = 'FAIL';
  } else if (result.latency.p90 > endpoint.expectedResponseTime * 0.8) {
    evaluation.responseTime = 'WARNING';
    if (evaluation.overall === 'PASS') evaluation.overall = 'WARNING';
  }
  
  // スループットの評価
  if (result.requests.persec < endpoint.expectedThroughput) {
    evaluation.throughput = 'FAIL';
    evaluation.overall = 'FAIL';
  } else if (result.requests.persec < endpoint.expectedThroughput * 1.2) {
    evaluation.throughput = 'WARNING';
    if (evaluation.overall === 'PASS') evaluation.overall = 'WARNING';
  }
  
  // エラー率の評価
  const errorRate = (result.errors + result.timeouts + result.non2xx) / result.requests.total;
  if (errorRate > 0.05) {
    evaluation.errorRate = 'FAIL';
    evaluation.overall = 'FAIL';
  } else if (errorRate > 0.01) {
    evaluation.errorRate = 'WARNING';
    if (evaluation.overall === 'PASS') evaluation.overall = 'WARNING';
  }
  
  return evaluation;
}

// データベースパフォーマンステスト
async function testDatabasePerformance() {
  console.log('\n🗺️ データベースパフォーマンステスト...');
  
  const queries = [
    {
      name: '補助金一覧クエリ',
      endpoint: '/api/test/db/subsidies-list',
      expectedTime: 50
    },
    {
      name: '複雑な検索クエリ',
      endpoint: '/api/test/db/complex-search',
      expectedTime: 200
    },
    {
      name: '集計クエリ',
      endpoint: '/api/test/db/aggregation',
      expectedTime: 500
    }
  ];
  
  for (const query of queries) {
    const results = [];
    
    // 10回実行して平均を取る
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      try {
        await axios.get(`http://localhost:3001${query.endpoint}`);
        const duration = Date.now() - start;
        results.push(duration);
      } catch (error) {
        console.error(`クエリエラー: ${query.name}`, error.message);
      }
    }
    
    if (results.length > 0) {
      const avg = results.reduce((a, b) => a + b) / results.length;
      const min = Math.min(...results);
      const max = Math.max(...results);
      
      performanceResults.databasePerformance.push({
        query: query.name,
        averageTime: avg,
        minTime: min,
        maxTime: max,
        expectedTime: query.expectedTime,
        performance: avg <= query.expectedTime ? 'PASS' : avg <= query.expectedTime * 1.5 ? 'WARNING' : 'FAIL'
      });
    }
  }
}

// キャッシュパフォーマンステスト
async function testCachePerformance() {
  console.log('\n📦 キャッシュパフォーマンステスト...');
  
  // キャッシュメトリクスを取得
  try {
    const response = await axios.get('http://localhost:3001/api/metrics/cache');
    const cacheStats = response.data;
    
    performanceResults.cachePerformance.push({
      timestamp: new Date().toISOString(),
      hitRate: cacheStats.hitRate,
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      totalRequests: cacheStats.total,
      performance: cacheStats.hitRate > 0.8 ? 'EXCELLENT' : cacheStats.hitRate > 0.6 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
    });
    
    // キャッシュ効果のテスト
    console.log('キャッシュ効果の測定中...');
    
    // 同じリクエストを2回実行
    const endpoint = '/api/subsidies/it-donyu-2025';
    
    // 1回目（キャッシュミス）
    const start1 = Date.now();
    await axios.get(`http://localhost:3001${endpoint}`);
    const time1 = Date.now() - start1;
    
    // 2回目（キャッシュヒット）
    const start2 = Date.now();
    await axios.get(`http://localhost:3001${endpoint}`);
    const time2 = Date.now() - start2;
    
    const speedup = time1 / time2;
    
    performanceResults.cachePerformance.push({
      test: 'キャッシュ効果',
      firstRequest: time1,
      cachedRequest: time2,
      speedup: speedup.toFixed(2) + 'x',
      performance: speedup > 5 ? 'EXCELLENT' : speedup > 2 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
    });
    
  } catch (error) {
    console.error('キャッシュメトリクスの取得エラー:', error.message);
  }
}

// リソース使用率の監視
async function monitorResourceUsage(duration = 60) {
  console.log(`\n📈 ${duration}秒間のリソース使用率を監視中...`);
  
  const measurements = [];
  const interval = 5000; // 5秒ごとに測定
  const iterations = duration * 1000 / interval;
  
  for (let i = 0; i < iterations; i++) {
    try {
      const response = await axios.get('http://localhost:3001/api/metrics/system');
      const metrics = response.data;
      
      measurements.push({
        timestamp: new Date().toISOString(),
        memory: {
          used: metrics.memory.process.heapUsed,
          total: metrics.memory.process.heapTotal,
          percentage: (metrics.memory.process.heapUsed / metrics.memory.process.heapTotal) * 100
        },
        cpu: metrics.cpu.usage,
        uptime: metrics.uptime
      });
      
      // 負荷をかける
      if (i % 2 === 0) {
        // 並列リクエストを発生させる
        const promises = [];
        for (let j = 0; j < 50; j++) {
          promises.push(axios.get('http://localhost:3001/api/subsidies'));
        }
        await Promise.all(promises);
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      console.error('リソースメトリクス取得エラー:', error.message);
    }
  }
  
  // 統計を計算
  if (measurements.length > 0) {
    const memoryUsages = measurements.map(m => m.memory.percentage);
    const avgMemory = memoryUsages.reduce((a, b) => a + b) / memoryUsages.length;
    const maxMemory = Math.max(...memoryUsages);
    
    performanceResults.resourceUsage.push({
      duration,
      measurements: measurements.length,
      memory: {
        average: avgMemory.toFixed(2) + '%',
        max: maxMemory.toFixed(2) + '%',
        trend: measurements[measurements.length - 1].memory.percentage > measurements[0].memory.percentage ? 'INCREASING' : 'STABLE'
      },
      performance: maxMemory < 80 ? 'GOOD' : maxMemory < 90 ? 'WARNING' : 'CRITICAL'
    });
  }
}

// ストレステスト
async function runStressTest() {
  console.log('\n💥 ストレステストを実行中...');
  
  const scenarios = [
    { connections: 50, duration: 30, name: '中負荷' },
    { connections: 100, duration: 30, name: '高負荷' },
    { connections: 200, duration: 20, name: '極高負荷' }
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n${scenario.name}シナリオ (${scenario.connections}接続)...`);
    
    // 最も重要なエンドポイントでテスト
    const criticalEndpoint = endpoints.find(e => e.name === '補助金検索');
    await runLoadTest(criticalEndpoint, scenario.duration, scenario.connections);
  }
}

// 推奨事項の生成
function generateRecommendations() {
  console.log('\n💡 推奨事項を生成中...');
  
  // エンドポイントのパフォーマンス
  for (const endpoint of performanceResults.endpoints) {
    if (endpoint.performance.overall === 'FAIL') {
      performanceResults.recommendations.push({
        category: 'APIパフォーマンス',
        endpoint: endpoint.endpoint,
        issue: `レスポンスタイムが遅い (P90: ${endpoint.latency.p90}ms)`,
        recommendation: [
          'クエリの最適化',
          'インデックスの追加',
          'キャッシュの実装',
          'N+1クエリの解決'
        ]
      });
    }
  }
  
  // データベースパフォーマンス
  const slowQueries = performanceResults.databasePerformance.filter(q => q.performance === 'FAIL');
  if (slowQueries.length > 0) {
    performanceResults.recommendations.push({
      category: 'データベース',
      issue: `${slowQueries.length}件の遅いクエリ`,
      queries: slowQueries.map(q => q.query),
      recommendation: [
        'EXPLAINを使用してクエリプランを分析',
        '適切なインデックスの追加',
        'クエリのリファクタリング',
        'マテリアライズドビューの検討'
      ]
    });
  }
  
  // キャッシュパフォーマンス
  const cachePerf = performanceResults.cachePerformance[0];
  if (cachePerf && cachePerf.hitRate < 0.8) {
    performanceResults.recommendations.push({
      category: 'キャッシュ',
      issue: `キャッシュヒット率が低い (${(cachePerf.hitRate * 100).toFixed(1)}%)`,
      recommendation: [
        'キャッシュキーの最適化',
        'TTLの調整',
        'キャッシュウォーミングの実装',
        'キャッシュサイズの拡大'
      ]
    });
  }
  
  // リソース使用率
  const resourcePerf = performanceResults.resourceUsage[0];
  if (resourcePerf && resourcePerf.performance !== 'GOOD') {
    performanceResults.recommendations.push({
      category: 'リソース',
      issue: 'メモリ使用率が高い',
      recommendation: [
        'メモリリークの調査',
        'ガベージコレクションのチューニング',
        'オブジェクトプールの実装',
        'ストリーミング処理の活用'
      ]
    });
  }
}

// HTMLレポートの生成
function generateHTMLReport(results) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>バックエンドパフォーマンステストレポート</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2 { color: #333; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 10px 0; }
        .pass { border-left: 4px solid #28a745; }
        .warning { border-left: 4px solid #ffc107; }
        .fail { border-left: 4px solid #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .performance-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 600; display: inline-block; }
        .performance-badge.pass { background: #d4edda; color: #155724; }
        .performance-badge.warning { background: #fff3cd; color: #856404; }
        .performance-badge.fail { background: #f8d7da; color: #721c24; }
        .chart { margin: 20px 0; }
        .bar { height: 20px; background: #007bff; margin: 2px 0; }
        .recommendation { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚡ バックエンドパフォーマンステストレポート</h1>
        <p>テスト日時: ${new Date(results.timestamp).toLocaleString('ja-JP')}</p>
        
        <h2>🎯 APIエンドポイントパフォーマンス</h2>
        ${results.endpoints.map(endpoint => `
            <div class="metric-card ${endpoint.performance.overall.toLowerCase()}">
                <h3>${endpoint.endpoint}</h3>
                <span class="performance-badge ${endpoint.performance.overall.toLowerCase()}">${endpoint.performance.overall}</span>
                <table>
                    <tr>
                        <th>メトリクス</th>
                        <th>値</th>
                        <th>評価</th>
                    </tr>
                    <tr>
                        <td>平均レスポンスタイム</td>
                        <td>${endpoint.latency.average.toFixed(2)}ms</td>
                        <td class="performance-badge ${endpoint.performance.responseTime.toLowerCase()}">${endpoint.performance.responseTime}</td>
                    </tr>
                    <tr>
                        <td>P90レスポンスタイム</td>
                        <td>${endpoint.latency.p90}ms</td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <td>P99レスポンスタイム</td>
                        <td>${endpoint.latency.p99}ms</td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <td>スループット</td>
                        <td>${endpoint.requests.persec.toFixed(2)} req/s</td>
                        <td class="performance-badge ${endpoint.performance.throughput.toLowerCase()}">${endpoint.performance.throughput}</td>
                    </tr>
                    <tr>
                        <td>エラー率</td>
                        <td>${((endpoint.errors + endpoint.timeouts + endpoint.non2xx) / endpoint.requests.total * 100).toFixed(2)}%</td>
                        <td class="performance-badge ${endpoint.performance.errorRate.toLowerCase()}">${endpoint.performance.errorRate}</td>
                    </tr>
                </table>
            </div>
        `).join('')}
        
        <h2>🗺️ データベースパフォーマンス</h2>
        <table>
            <tr>
                <th>クエリ</th>
                <th>平均実行時間</th>
                <th>期待値</th>
                <th>評価</th>
            </tr>
            ${results.databasePerformance.map(db => `
                <tr>
                    <td>${db.query}</td>
                    <td>${db.averageTime.toFixed(2)}ms</td>
                    <td>${db.expectedTime}ms</td>
                    <td class="performance-badge ${db.performance.toLowerCase()}">${db.performance}</td>
                </tr>
            `).join('')}
        </table>
        
        <h2>📦 キャッシュパフォーマンス</h2>
        ${results.cachePerformance.map(cache => {
          if (cache.hitRate !== undefined) {
            return `
                <div class="metric-card">
                    <h3>キャッシュ統計</h3>
                    <p>ヒット率: ${(cache.hitRate * 100).toFixed(1)}%</p>
                    <p>ヒット数: ${cache.hits}</p>
                    <p>ミス数: ${cache.misses}</p>
                    <p>評価: <span class="performance-badge ${cache.performance.toLowerCase()}">${cache.performance}</span></p>
                </div>
            `;
          } else {
            return `
                <div class="metric-card">
                    <h3>${cache.test}</h3>
                    <p>初回リクエスト: ${cache.firstRequest}ms</p>
                    <p>キャッシュされたリクエスト: ${cache.cachedRequest}ms</p>
                    <p>高速化: ${cache.speedup}</p>
                    <p>評価: <span class="performance-badge ${cache.performance.toLowerCase()}">${cache.performance}</span></p>
                </div>
            `;
          }
        }).join('')}
        
        <h2>📈 リソース使用率</h2>
        ${results.resourceUsage.map(resource => `
            <div class="metric-card ${resource.performance.toLowerCase()}">
                <h3>${resource.duration}秒間の監視結果</h3>
                <p>平均メモリ使用率: ${resource.memory.average}</p>
                <p>最大メモリ使用率: ${resource.memory.max}</p>
                <p>トレンド: ${resource.memory.trend}</p>
                <p>評価: <span class="performance-badge ${resource.performance.toLowerCase()}">${resource.performance}</span></p>
            </div>
        `).join('')}
        
        <h2>💡 推奨事項</h2>
        ${results.recommendations.map(rec => `
            <div class="recommendation">
                <h3>${rec.category}</h3>
                <p><strong>問題:</strong> ${rec.issue}</p>
                ${rec.queries ? `<p>対象: ${rec.queries.join(', ')}</p>` : ''}
                <p><strong>推奨:</strong></p>
                <ul>
                    ${rec.recommendation.map(r => `<li>${r}</li>`).join('')}
                </ul>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
}

// メイン実行関数
async function main() {
  console.log('🚀 バックエンドパフォーマンステストを開始します\n');
  
  try {
    // サーバーが起動しているか確認
    await axios.get('http://localhost:3001/api/health');
    
    // 各種テストの実行
    for (const endpoint of endpoints) {
      await runLoadTest(endpoint);
    }
    
    await testDatabasePerformance();
    await testCachePerformance();
    await monitorResourceUsage(30); // 30秒間監視
    
    // ストレステスト（オプション）
    // await runStressTest();
    
    // 推奨事項の生成
    generateRecommendations();
    
    // レポートの保存
    const reportDir = path.join(__dirname, '../../reports');
    await fs.mkdir(reportDir, { recursive: true });
    
    await fs.writeFile(
      path.join(reportDir, 'backend-performance-test.json'),
      JSON.stringify(performanceResults, null, 2)
    );
    
    const htmlReport = generateHTMLReport(performanceResults);
    await fs.writeFile(
      path.join(reportDir, 'backend-performance-test.html'),
      htmlReport
    );
    
    console.log('\n✅ パフォーマンステストが完了しました');
    console.log('📄 レポート: reports/backend-performance-test.html');
    
  } catch (error) {
    console.error('\n❌ テスト実行中にエラーが発生しました:', error.message);
    console.error('サーバーが起動しているか確認してください (npm run dev)');
    process.exit(1);
  }
}

// スクリプトの実行
if (require.main === module) {
  main();
}

module.exports = { main };