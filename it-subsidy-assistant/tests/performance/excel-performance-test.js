/**
 * Excel機能・動的質問フローパフォーマンステスト
 * 新機能の負荷特性とレスポンス時間を測定
 */

const http = require('k6/http');
const { check, sleep } = require('k6');
const { Rate, Trend, Counter } = require('k6/metrics');
const encoding = require('k6/encoding');

// カスタムメトリクス
const excelProcessingTime = new Trend('excel_processing_duration');
const questionFlowTime = new Trend('question_flow_duration');
const errorRate = new Rate('errors');
const excelFailures = new Counter('excel_failures');
const questionFlowFailures = new Counter('question_flow_failures');

// テスト設定
export const options = {
  scenarios: {
    // Excel処理の負荷テスト
    excel_load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },   // 5同時ユーザーまで増加
        { duration: '2m', target: 10 },   // 10同時ユーザーを維持
        { duration: '1m', target: 20 },   // 20同時ユーザーまで増加
        { duration: '2m', target: 20 },   // 20同時ユーザーを維持
        { duration: '30s', target: 0 },   // ゼロまで減少
      ],
      exec: 'excelPerformanceTest',
      tags: { scenario: 'excel_load' },
    },
    
    // 動的質問フローの負荷テスト
    question_flow_test: {
      executor: 'constant-vus',
      vus: 30,
      duration: '3m',
      exec: 'questionFlowPerformanceTest',
      tags: { scenario: 'question_flow' },
    },
    
    // 混合シナリオテスト
    mixed_scenario_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 15 },
        { duration: '3m', target: 30 },
        { duration: '1m', target: 0 },
      ],
      exec: 'mixedScenarioTest',
      tags: { scenario: 'mixed' },
    }
  },
  thresholds: {
    // Excel処理の閾値
    'excel_processing_duration': [
      'p(95)<3000',    // 95%のExcel処理が3秒以内
      'p(50)<1500',    // 50%のExcel処理が1.5秒以内
    ],
    'excel_processing_duration{operation:read}': ['p(95)<2000'],
    'excel_processing_duration{operation:write}': ['p(95)<3000'],
    'excel_processing_duration{operation:batch}': ['p(95)<5000'],
    
    // 動的質問フローの閾値
    'question_flow_duration': [
      'p(95)<500',     // 95%の質問フローが500ms以内
      'p(50)<200',     // 50%の質問フローが200ms以内
    ],
    
    // エラー率閾値
    'http_req_failed': ['rate<0.05'],  // 5%未満のエラー率
    'errors': ['rate<0.05'],
    'excel_failures': ['count<10'],
    'question_flow_failures': ['count<20'],
    
    // レスポンス時間閾値
    'http_req_duration': ['p(95)<2000', 'p(50)<800'],
    'http_req_waiting': ['p(95)<1500'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';

// テストデータ
const testUsers = [
  { email: 'perf1@test.com', password: 'TestPerf123!' },
  { email: 'perf2@test.com', password: 'TestPerf123!' },
  { email: 'perf3@test.com', password: 'TestPerf123!' },
  { email: 'perf4@test.com', password: 'TestPerf123!' },
  { email: 'perf5@test.com', password: 'TestPerf123!' },
];

const subsidyTypes = ['it-donyu', 'monozukuri', 'jizokuka'];
const applicationFrames = ['tsujyo', 'security', 'invoice', 'fukusu'];

// 認証ヘルパー
function authenticate() {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  const payload = JSON.stringify({ email: user.email, password: user.password });
  
  const response = http.post(`${BASE_URL}/api/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (response.status === 200) {
    return response.json('token');
  }
  
  errorRate.add(1);
  return null;
}

// Excel読み込みパフォーマンステスト
export function excelPerformanceTest() {
  const token = authenticate();
  if (!token) {
    sleep(1);
    return;
  }

  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  };

  // テストファイルの作成（実際のExcelファイルバイナリを模擬）
  const excelContent = createTestExcelFile();
  const formData = {
    excelFile: http.file(excelContent, 'test.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  };

  // Excel読み込みテスト
  const readStartTime = Date.now();
  let response = http.post(`${BASE_URL}/api/excel/read`, formData, authHeaders);
  const readDuration = Date.now() - readStartTime;
  
  const readSuccess = check(response, {
    'excel read status 200': (r) => r.status === 200,
    'excel read response time < 3s': (r) => r.timings.duration < 3000,
    'excel read has data': (r) => r.json('data') !== undefined,
  });

  excelProcessingTime.add(readDuration, { operation: 'read' });
  if (!readSuccess) {
    excelFailures.add(1);
    errorRate.add(1);
  }

  sleep(0.5);

  // Excel書き込みテスト
  const writePayload = {
    subsidyType: subsidyTypes[Math.floor(Math.random() * subsidyTypes.length)],
    applicationFrame: applicationFrames[Math.floor(Math.random() * applicationFrames.length)],
    formData: generateTestFormData()
  };

  const writeStartTime = Date.now();
  response = http.post(`${BASE_URL}/api/excel/write`, JSON.stringify(writePayload), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  const writeDuration = Date.now() - writeStartTime;

  const writeSuccess = check(response, {
    'excel write status 200': (r) => r.status === 200,
    'excel write response time < 4s': (r) => r.timings.duration < 4000,
    'excel write has download urls': (r) => r.json('data.downloadUrls') !== undefined,
  });

  excelProcessingTime.add(writeDuration, { operation: 'write' });
  if (!writeSuccess) {
    excelFailures.add(1);
    errorRate.add(1);
  }

  sleep(0.8);

  // 一括出力テスト（重い処理）
  if (Math.random() < 0.3) { // 30%の確率で実行
    const batchStartTime = Date.now();
    response = http.post(`${BASE_URL}/api/excel/batch-export`, JSON.stringify(writePayload), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    const batchDuration = Date.now() - batchStartTime;

    const batchSuccess = check(response, {
      'batch export status 200': (r) => r.status === 200,
      'batch export response time < 6s': (r) => r.timings.duration < 6000,
      'batch export has multiple files': (r) => {
        const files = r.json('data.processedFiles');
        return Array.isArray(files) && files.length > 1;
      },
    });

    excelProcessingTime.add(batchDuration, { operation: 'batch' });
    if (!batchSuccess) {
      excelFailures.add(1);
      errorRate.add(1);
    }
  }

  sleep(1);
}

// 動的質問フローパフォーマンステスト
export function questionFlowPerformanceTest() {
  const token = authenticate();
  if (!token) {
    sleep(0.5);
    return;
  }

  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  };

  // 複数の質問フローシナリオをテスト
  const scenarios = [
    {
      name: 'IT導入補助金フロー',
      subsidyType: 'it-donyu',
      answers: {
        companyType: 'corporation',
        businessYears: 'over-3',
        itExperience: 'yes',
        cloudService: 'yes'
      }
    },
    {
      name: 'ものづくり補助金フロー',
      subsidyType: 'monozukuri',
      answers: {
        companyType: 'corporation',
        businessYears: 'over-3',
        equipmentType: 'machine',
        investmentAmount: 'over-10million'
      }
    },
    {
      name: '持続化補助金フロー',
      subsidyType: 'jizokuka',
      answers: {
        companyType: 'individual',
        businessStart: 'under-1',
        salesChannel: 'online'
      }
    }
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  const flowStartTime = Date.now();

  // 質問フロー開始
  let response = http.post(`${BASE_URL}/api/document-requirements/start`, 
    JSON.stringify({ subsidyType: scenario.subsidyType }), authHeaders);

  const flowInitSuccess = check(response, {
    'flow init status 200': (r) => r.status === 200,
    'flow init response time < 300ms': (r) => r.timings.duration < 300,
    'flow init has session': (r) => r.json('sessionId') !== undefined,
  });

  if (!flowInitSuccess) {
    questionFlowFailures.add(1);
    errorRate.add(1);
    return;
  }

  const sessionId = response.json('sessionId');
  sleep(0.1);

  // 順次質問に回答
  for (const [key, value] of Object.entries(scenario.answers)) {
    response = http.post(`${BASE_URL}/api/document-requirements/answer`, 
      JSON.stringify({
        sessionId: sessionId,
        questionId: key,
        answer: value
      }), authHeaders);

    const answerSuccess = check(response, {
      [`answer ${key} status 200`]: (r) => r.status === 200,
      [`answer ${key} response time < 200ms`]: (r) => r.timings.duration < 200,
    });

    if (!answerSuccess) {
      questionFlowFailures.add(1);
      errorRate.add(1);
    }

    sleep(0.1);
  }

  // 結果取得
  response = http.get(`${BASE_URL}/api/document-requirements/result/${sessionId}`, authHeaders);
  
  const resultSuccess = check(response, {
    'result status 200': (r) => r.status === 200,
    'result response time < 400ms': (r) => r.timings.duration < 400,
    'result has documents': (r) => {
      const docs = r.json('requiredDocuments');
      return Array.isArray(docs) && docs.length > 0;
    },
  });

  const flowTotalDuration = Date.now() - flowStartTime;
  questionFlowTime.add(flowTotalDuration);

  if (!resultSuccess) {
    questionFlowFailures.add(1);
    errorRate.add(1);
  }

  sleep(0.3);
}

// 混合シナリオテスト
export function mixedScenarioTest() {
  const scenario = Math.random();
  
  if (scenario < 0.4) {
    // 40%の確率でExcelテスト
    excelPerformanceTest();
  } else if (scenario < 0.8) {
    // 40%の確率で質問フローテスト
    questionFlowPerformanceTest();
  } else {
    // 20%の確率で複合操作
    complexWorkflowTest();
  }
}

// 複合ワークフローテスト
function complexWorkflowTest() {
  const token = authenticate();
  if (!token) {
    sleep(1);
    return;
  }

  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  };

  // 1. 質問フローを実行
  let response = http.post(`${BASE_URL}/api/document-requirements/start`, 
    JSON.stringify({ subsidyType: 'it-donyu' }), authHeaders);

  if (response.status !== 200) {
    errorRate.add(1);
    return;
  }

  const sessionId = response.json('sessionId');
  
  // 2. 簡単な質問に回答
  response = http.post(`${BASE_URL}/api/document-requirements/answer`, 
    JSON.stringify({
      sessionId: sessionId,
      questionId: 'companyType',
      answer: 'corporation'
    }), authHeaders);

  sleep(0.2);

  // 3. Excel書き込み（並行作業をシミュレート）
  const writePayload = {
    subsidyType: 'it-donyu',
    formData: generateTestFormData()
  };

  response = http.post(`${BASE_URL}/api/excel/write`, JSON.stringify(writePayload), authHeaders);

  const complexSuccess = check(response, {
    'complex workflow excel success': (r) => r.status === 200,
    'complex workflow response time < 5s': (r) => r.timings.duration < 5000,
  });

  if (!complexSuccess) {
    errorRate.add(1);
  }

  sleep(0.5);

  // 4. 結果ダウンロード
  if (response.status === 200) {
    const downloadUrls = response.json('data.downloadUrls');
    if (downloadUrls && downloadUrls.length > 0) {
      const downloadResponse = http.get(downloadUrls[0], authHeaders);
      check(downloadResponse, {
        'download success': (r) => r.status === 200,
        'download response time < 2s': (r) => r.timings.duration < 2000,
      });
    }
  }

  sleep(1);
}

// ヘルパー関数：テスト用Excelファイル作成
function createTestExcelFile() {
  // 実際のExcelファイルの最小バイナリ構造をシミュレート
  const header = 'PK\x03\x04\x14\x00\x06\x00';
  const content = 'test,data,for,performance\n1,2,3,4\n5,6,7,8\n';
  const footer = 'PK\x05\x06\x00\x00\x00\x00';
  
  return encoding.b64encode(header + content + footer);
}

// ヘルパー関数：テスト用フォームデータ生成
function generateTestFormData() {
  const companies = ['テスト株式会社', 'サンプル有限会社', 'デモ企業'];
  const representatives = ['田中太郎', '佐藤花子', '鈴木一郎'];
  
  return {
    company_name: companies[Math.floor(Math.random() * companies.length)],
    representative_name: representatives[Math.floor(Math.random() * representatives.length)],
    employee_count: Math.floor(Math.random() * 100) + 1,
    corporate_number: '1234567890123',
    current_avg_salary: Math.floor(Math.random() * 1000000) + 3000000,
    planned_avg_salary: Math.floor(Math.random() * 1000000) + 3500000,
    it_tool_name: 'パフォーマンステスト用ITツール',
    current_issues: '現在の課題をパフォーマンステスト用に記載',
    expected_effects: '期待される効果をパフォーマンステスト用に記載'
  };
}

// セットアップ関数
export function setup() {
  console.log('Excel・質問フローパフォーマンステスト開始...');
  
  // テストユーザーの作成（必要に応じて）
  testUsers.forEach(user => {
    const payload = JSON.stringify({
      email: user.email,
      password: user.password,
      name: 'Performance Test User',
      role: 'user'
    });

    const response = http.post(`${BASE_URL}/api/auth/register`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 201) {
      console.log(`テストユーザー作成: ${user.email}`);
    }
  });

  return { timestamp: new Date().toISOString() };
}

// ティアダウン関数
export function teardown(data) {
  console.log('パフォーマンステスト完了 - データクリーンアップ');
}

// カスタムサマリー
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_duration: data.state.testRunDurationMs,
    scenarios: {},
    metrics: {},
    thresholds: data.thresholds,
  };

  // シナリオ別サマリー
  Object.keys(data.metrics).forEach(metricName => {
    const metric = data.metrics[metricName];
    if (metric.type === 'trend') {
      summary.metrics[metricName] = {
        avg: metric.values.avg,
        min: metric.values.min,
        max: metric.values.max,
        p50: metric.values['p(50)'],
        p95: metric.values['p(95)'],
        p99: metric.values['p(99)'],
      };
    } else if (metric.type === 'rate') {
      summary.metrics[metricName] = {
        rate: metric.values.rate,
        passes: metric.values.passes,
        fails: metric.values.fails,
      };
    } else if (metric.type === 'counter') {
      summary.metrics[metricName] = {
        count: metric.values.count,
        rate: metric.values.rate,
      };
    }
  });

  // パフォーマンス分析
  const analysis = {
    excel_performance: 'UNKNOWN',
    question_flow_performance: 'UNKNOWN',
    overall_rating: 'UNKNOWN',
    recommendations: []
  };

  // Excel処理パフォーマンス評価
  const excelP95 = summary.metrics.excel_processing_duration?.p95;
  if (excelP95) {
    if (excelP95 < 2000) {
      analysis.excel_performance = 'EXCELLENT';
    } else if (excelP95 < 3000) {
      analysis.excel_performance = 'GOOD';
    } else if (excelP95 < 5000) {
      analysis.excel_performance = 'ACCEPTABLE';
    } else {
      analysis.excel_performance = 'POOR';
      analysis.recommendations.push('Excel処理の最適化が必要です');
    }
  }

  // 質問フロー パフォーマンス評価
  const questionP95 = summary.metrics.question_flow_duration?.p95;
  if (questionP95) {
    if (questionP95 < 300) {
      analysis.question_flow_performance = 'EXCELLENT';
    } else if (questionP95 < 500) {
      analysis.question_flow_performance = 'GOOD';
    } else if (questionP95 < 1000) {
      analysis.question_flow_performance = 'ACCEPTABLE';
    } else {
      analysis.question_flow_performance = 'POOR';
      analysis.recommendations.push('質問フローの応答速度改善が必要です');
    }
  }

  // エラー率チェック
  const errorRate = summary.metrics.errors?.rate;
  if (errorRate && errorRate > 0.05) {
    analysis.recommendations.push(`エラー率が高すぎます: ${(errorRate * 100).toFixed(2)}%`);
  }

  // 総合評価
  if (analysis.excel_performance === 'EXCELLENT' && analysis.question_flow_performance === 'EXCELLENT') {
    analysis.overall_rating = 'EXCELLENT';
  } else if (analysis.excel_performance !== 'POOR' && analysis.question_flow_performance !== 'POOR') {
    analysis.overall_rating = 'GOOD';
  } else {
    analysis.overall_rating = 'NEEDS_IMPROVEMENT';
  }

  summary.performance_analysis = analysis;

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'performance-summary.json': JSON.stringify(summary, null, 2),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let output = `${indent}Performance Test Summary\n`;
  output += `${indent}========================\n\n`;
  
  // Test duration
  output += `${indent}Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s\n\n`;
  
  // Key metrics
  if (data.metrics.excel_processing_duration) {
    const metric = data.metrics.excel_processing_duration;
    output += `${indent}Excel Processing Performance:\n`;
    output += `${indent}  Average: ${metric.values.avg.toFixed(2)}ms\n`;
    output += `${indent}  95th percentile: ${metric.values['p(95)'].toFixed(2)}ms\n`;
    output += `${indent}  Max: ${metric.values.max.toFixed(2)}ms\n\n`;
  }
  
  if (data.metrics.question_flow_duration) {
    const metric = data.metrics.question_flow_duration;
    output += `${indent}Question Flow Performance:\n`;
    output += `${indent}  Average: ${metric.values.avg.toFixed(2)}ms\n`;
    output += `${indent}  95th percentile: ${metric.values['p(95)'].toFixed(2)}ms\n`;
    output += `${indent}  Max: ${metric.values.max.toFixed(2)}ms\n\n`;
  }
  
  // Error rates
  if (data.metrics.errors) {
    const rate = data.metrics.errors.values.rate;
    output += `${indent}Error Rate: ${(rate * 100).toFixed(2)}%\n`;
  }
  
  return output;
}

module.exports = {
  excelPerformanceTest,
  questionFlowPerformanceTest,
  mixedScenarioTest
};