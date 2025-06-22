/**
 * インテリジェント E2E テストフレームワーク
 * AI支援による動的テストシナリオ生成とエッジケース発見
 */

const { test, expect, chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

class IntelligentE2EFramework {
  constructor() {
    this.testResults = [];
    this.edgeCases = [];
    this.performanceMetrics = [];
    this.securityIssues = [];
    this.accessibilityIssues = [];
  }

  // 動的テストシナリオ生成
  generateDynamicScenarios(formStructure) {
    const scenarios = [];
    
    // 正常系シナリオ
    scenarios.push({
      name: '正常系フロー',
      type: 'happy_path',
      data: this.generateValidTestData(formStructure),
      expectedResult: 'success'
    });

    // 境界値テストシナリオ
    scenarios.push(...this.generateBoundaryValueScenarios(formStructure));

    // エラーケースシナリオ
    scenarios.push(...this.generateErrorScenarios(formStructure));

    // セキュリティテストシナリオ
    scenarios.push(...this.generateSecurityScenarios(formStructure));

    // パフォーマンステストシナリオ
    scenarios.push(...this.generatePerformanceScenarios(formStructure));

    return scenarios;
  }

  // 有効なテストデータ生成
  generateValidTestData(formStructure) {
    const testData = {};
    
    for (const field of formStructure.fields) {
      switch (field.type) {
        case 'email':
          testData[field.name] = 'test@example.com';
          break;
        case 'phone':
          testData[field.name] = '090-1234-5678';
          break;
        case 'number':
          testData[field.name] = field.min ? Math.max(field.min, 100) : 100;
          break;
        case 'text':
          testData[field.name] = field.name.includes('company') ? 'テスト株式会社' : 'テストデータ';
          break;
        case 'date':
          testData[field.name] = '2025-01-01';
          break;
        case 'select':
          testData[field.name] = field.options ? field.options[0] : 'option1';
          break;
        default:
          testData[field.name] = 'デフォルト値';
      }
    }
    
    return testData;
  }

  // 境界値テストシナリオ生成
  generateBoundaryValueScenarios(formStructure) {
    const scenarios = [];
    
    for (const field of formStructure.fields) {
      if (field.type === 'number' && field.min !== undefined && field.max !== undefined) {
        // 最小値、最大値、範囲外のテスト
        scenarios.push({
          name: `境界値テスト - ${field.name} 最小値`,
          type: 'boundary',
          data: { [field.name]: field.min },
          expectedResult: 'success'
        });
        
        scenarios.push({
          name: `境界値テスト - ${field.name} 最大値`,
          type: 'boundary',
          data: { [field.name]: field.max },
          expectedResult: 'success'
        });
        
        scenarios.push({
          name: `境界値テスト - ${field.name} 範囲外(小)`,
          type: 'boundary',
          data: { [field.name]: field.min - 1 },
          expectedResult: 'validation_error'
        });
        
        scenarios.push({
          name: `境界値テスト - ${field.name} 範囲外(大)`,
          type: 'boundary',
          data: { [field.name]: field.max + 1 },
          expectedResult: 'validation_error'
        });
      }
      
      if (field.type === 'text' && field.maxLength) {
        scenarios.push({
          name: `境界値テスト - ${field.name} 最大文字数`,
          type: 'boundary',
          data: { [field.name]: 'a'.repeat(field.maxLength) },
          expectedResult: 'success'
        });
        
        scenarios.push({
          name: `境界値テスト - ${field.name} 文字数超過`,
          type: 'boundary',
          data: { [field.name]: 'a'.repeat(field.maxLength + 1) },
          expectedResult: 'validation_error'
        });
      }
    }
    
    return scenarios;
  }

  // エラーケースシナリオ生成
  generateErrorScenarios(formStructure) {
    const scenarios = [];
    
    const errorPatterns = [
      { name: '空文字', value: '' },
      { name: 'null値', value: null },
      { name: 'undefined', value: undefined },
      { name: '特殊文字', value: '!@#$%^&*()' },
      { name: '非常に長い文字列', value: 'a'.repeat(10000) },
      { name: '制御文字', value: '\x00\x01\x02' },
      { name: 'Unicode文字', value: '🚀🎯💎' },
      { name: 'HTMLタグ', value: '<script>alert("test")</script>' },
      { name: 'SQLインジェクション', value: "'; DROP TABLE users; --" }
    ];
    
    for (const field of formStructure.fields) {
      for (const pattern of errorPatterns) {
        scenarios.push({
          name: `エラーケース - ${field.name} ${pattern.name}`,
          type: 'error',
          data: { [field.name]: pattern.value },
          expectedResult: 'validation_error'
        });
      }
    }
    
    return scenarios;
  }

  // セキュリティテストシナリオ生成
  generateSecurityScenarios(formStructure) {
    const scenarios = [];
    
    const securityPayloads = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src=x onerror=alert("XSS")>',
      "' OR '1'='1",
      '"; DROP TABLE users; --',
      '../../../etc/passwd',
      '${7*7}',
      '{{7*7}}',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>'
    ];
    
    for (const field of formStructure.fields) {
      for (const payload of securityPayloads) {
        scenarios.push({
          name: `セキュリティテスト - ${field.name} - ${payload.substring(0, 20)}...`,
          type: 'security',
          data: { [field.name]: payload },
          expectedResult: 'security_blocked'
        });
      }
    }
    
    return scenarios;
  }

  // パフォーマンステストシナリオ生成
  generatePerformanceScenarios(formStructure) {
    return [
      {
        name: 'パフォーマンステスト - 大量データ',
        type: 'performance',
        data: this.generateLargeDataSet(formStructure),
        expectedResult: 'performance_acceptable'
      },
      {
        name: 'パフォーマンステスト - 同時送信',
        type: 'performance',
        data: this.generateValidTestData(formStructure),
        concurrent: 10,
        expectedResult: 'performance_acceptable'
      }
    ];
  }

  // 大量データセット生成
  generateLargeDataSet(formStructure) {
    const data = {};
    
    for (const field of formStructure.fields) {
      if (field.type === 'text') {
        data[field.name] = 'a'.repeat(Math.min(field.maxLength || 1000, 1000));
      } else if (field.type === 'number') {
        data[field.name] = field.max || 999999;
      } else {
        data[field.name] = this.generateValidTestData(formStructure)[field.name];
      }
    }
    
    return data;
  }

  // フォーム構造の自動解析
  async analyzeFormStructure(page) {
    return await page.evaluate(() => {
      const formFields = [];
      const inputs = document.querySelectorAll('input, select, textarea');
      
      inputs.forEach(input => {
        const field = {
          name: input.name || input.id,
          type: input.type || input.tagName.toLowerCase(),
          required: input.required,
          min: input.min,
          max: input.max,
          maxLength: input.maxLength,
          pattern: input.pattern
        };
        
        if (input.tagName.toLowerCase() === 'select') {
          field.options = Array.from(input.options).map(opt => opt.value);
        }
        
        formFields.push(field);
      });
      
      return {
        fields: formFields,
        action: document.querySelector('form')?.action,
        method: document.querySelector('form')?.method
      };
    });
  }

  // エッジケースの自動発見
  async discoverEdgeCases(page, scenarios) {
    const edgeCases = [];
    
    for (const scenario of scenarios) {
      try {
        const result = await this.executeScenario(page, scenario);
        
        // 予想外の動作を検出
        if (result.actualResult !== scenario.expectedResult) {
          edgeCases.push({
            scenario: scenario.name,
            expected: scenario.expectedResult,
            actual: result.actualResult,
            data: scenario.data,
            timestamp: new Date().toISOString()
          });
        }
        
        // パフォーマンス異常の検出
        if (result.duration > 5000) {
          edgeCases.push({
            scenario: scenario.name,
            issue: 'performance_slow',
            duration: result.duration,
            data: scenario.data,
            timestamp: new Date().toISOString()
          });
        }
        
      } catch (error) {
        edgeCases.push({
          scenario: scenario.name,
          issue: 'execution_error',
          error: error.message,
          data: scenario.data,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return edgeCases;
  }

  // シナリオ実行
  async executeScenario(page, scenario) {
    const startTime = Date.now();
    let actualResult = 'unknown';
    
    try {
      // フォーム入力
      for (const [fieldName, value] of Object.entries(scenario.data)) {
        const selector = `[name="${fieldName}"], #${fieldName}`;
        
        try {
          await page.fill(selector, String(value));
        } catch (error) {
          // フィールドが見つからない場合はスキップ
          continue;
        }
      }
      
      // フォーム送信
      if (scenario.concurrent && scenario.concurrent > 1) {
        // 同時送信テスト
        const promises = [];
        for (let i = 0; i < scenario.concurrent; i++) {
          promises.push(page.click('button[type="submit"], input[type="submit"]'));
        }
        await Promise.all(promises);
      } else {
        await page.click('button[type="submit"], input[type="submit"]');
      }
      
      // 結果の判定
      await page.waitForTimeout(2000);
      
      const hasSuccessMessage = await page.locator('.success, .complete, [class*="success"]').count() > 0;
      const hasErrorMessage = await page.locator('.error, .invalid, [class*="error"]').count() > 0;
      const hasValidationError = await page.locator('.validation-error, [class*="validation"]').count() > 0;
      
      if (hasSuccessMessage) {
        actualResult = 'success';
      } else if (hasValidationError) {
        actualResult = 'validation_error';
      } else if (hasErrorMessage) {
        actualResult = 'error';
      } else {
        actualResult = 'no_response';
      }
      
    } catch (error) {
      actualResult = 'execution_error';
    }
    
    const duration = Date.now() - startTime;
    
    return {
      actualResult,
      duration,
      timestamp: new Date().toISOString()
    };
  }

  // アクセシビリティテスト
  async runAccessibilityTests(page) {
    const accessibilityIssues = [];
    
    // フォーカス可能要素のテスト
    const focusableElements = await page.locator('input, button, select, textarea, a[href]').count();
    if (focusableElements === 0) {
      accessibilityIssues.push({
        type: 'no_focusable_elements',
        message: 'フォーカス可能な要素が見つかりません'
      });
    }
    
    // ラベルの存在確認
    const inputs = await page.locator('input').count();
    const labels = await page.locator('label').count();
    if (inputs > labels) {
      accessibilityIssues.push({
        type: 'missing_labels',
        message: 'ラベルが不足している入力フィールドがあります'
      });
    }
    
    // カラーコントラストの確認
    const contrastIssues = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('*');
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          // 簡易的なコントラスト比チェック
          const colorLuminance = this.getLuminance(color);
          const bgLuminance = this.getLuminance(backgroundColor);
          const contrast = (Math.max(colorLuminance, bgLuminance) + 0.05) / (Math.min(colorLuminance, bgLuminance) + 0.05);
          
          if (contrast < 4.5) {
            issues.push({
              element: el.tagName + (el.className ? '.' + el.className : ''),
              contrast: contrast.toFixed(2)
            });
          }
        }
      });
      
      return issues;
    });
    
    accessibilityIssues.push(...contrastIssues.map(issue => ({
      type: 'low_contrast',
      message: `コントラスト比が不十分: ${issue.element} (${issue.contrast}:1)`
    })));
    
    return accessibilityIssues;
  }

  // パフォーマンス監査
  async runPerformanceAudit(page) {
    const performanceMetrics = [];
    
    // ページロード時間の測定
    const loadStartTime = Date.now();
    await page.reload();
    const loadEndTime = Date.now();
    const pageLoadTime = loadEndTime - loadStartTime;
    
    performanceMetrics.push({
      metric: 'page_load_time',
      value: pageLoadTime,
      unit: 'ms',
      threshold: 3000,
      status: pageLoadTime < 3000 ? 'pass' : 'fail'
    });
    
    // フォーム送信時間の測定
    const formStartTime = Date.now();
    await page.click('button[type="submit"], input[type="submit"]');
    await page.waitForLoadState('networkidle');
    const formEndTime = Date.now();
    const formSubmitTime = formEndTime - formStartTime;
    
    performanceMetrics.push({
      metric: 'form_submit_time',
      value: formSubmitTime,
      unit: 'ms',
      threshold: 5000,
      status: formSubmitTime < 5000 ? 'pass' : 'fail'
    });
    
    // メモリ使用量の確認
    const memoryUsage = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (memoryUsage) {
      performanceMetrics.push({
        metric: 'memory_usage',
        value: memoryUsage.used,
        unit: 'bytes',
        threshold: 50 * 1024 * 1024, // 50MB
        status: memoryUsage.used < 50 * 1024 * 1024 ? 'pass' : 'fail'
      });
    }
    
    return performanceMetrics;
  }

  // 総合的なテスト実行
  async runComprehensiveTests(url = 'http://localhost:5174') {
    console.log('🚀 インテリジェント E2E テストを開始...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
      await page.goto(url);
      
      // フォーム構造の解析
      const formStructure = await this.analyzeFormStructure(page);
      console.log('📋 フォーム構造を解析:', formStructure.fields.length, 'フィールド');
      
      // 動的シナリオ生成
      const scenarios = this.generateDynamicScenarios(formStructure);
      console.log('🎯 動的シナリオを生成:', scenarios.length, 'シナリオ');
      
      // エッジケースの発見
      const edgeCases = await this.discoverEdgeCases(page, scenarios);
      console.log('🔍 エッジケースを発見:', edgeCases.length, 'ケース');
      
      // アクセシビリティテスト
      const accessibilityIssues = await this.runAccessibilityTests(page);
      console.log('♿ アクセシビリティ問題:', accessibilityIssues.length, '件');
      
      // パフォーマンステスト
      const performanceMetrics = await this.runPerformanceAudit(page);
      console.log('⚡ パフォーマンス監査完了');
      
      // 結果のまとめ
      const report = {
        timestamp: new Date().toISOString(),
        formStructure,
        scenarios: scenarios.length,
        edgeCases,
        accessibilityIssues,
        performanceMetrics,
        summary: {
          totalTests: scenarios.length,
          edgeCasesFound: edgeCases.length,
          accessibilityIssues: accessibilityIssues.length,
          performanceIssues: performanceMetrics.filter(m => m.status === 'fail').length
        }
      };
      
      // レポート保存
      const reportPath = path.join(__dirname, '../../reports/intelligent-e2e-report.json');
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log('📊 インテリジェント E2E レポート生成:', reportPath);
      
      return report;
      
    } finally {
      await browser.close();
    }
  }
}

// テスト実行関数
async function runIntelligentE2E() {
  const framework = new IntelligentE2EFramework();
  try {
    const report = await framework.runComprehensiveTests();
    
    console.log('\n🎯 インテリジェント E2E テスト完了:');
    console.log(`総テスト数: ${report.summary.totalTests}`);
    console.log(`エッジケース発見: ${report.summary.edgeCasesFound}`);
    console.log(`アクセシビリティ問題: ${report.summary.accessibilityIssues}`);
    console.log(`パフォーマンス問題: ${report.summary.performanceIssues}`);
    
    return report;
  } catch (error) {
    console.error('インテリジェント E2E テスト中にエラーが発生:', error);
    throw error;
  }
}

module.exports = { IntelligentE2EFramework, runIntelligentE2E };

if (require.main === module) {
  runIntelligentE2E();
}