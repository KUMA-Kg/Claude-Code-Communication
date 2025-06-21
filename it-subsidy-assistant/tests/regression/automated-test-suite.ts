/**
 * Automated Regression Test Suite for Subsidy Application System
 * Comprehensive test automation with AI-powered test data generation
 */

import { test, expect, Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

// Test data imports
const itSubsidyData = JSON.parse(readFileSync(join(__dirname, '../data/it-subsidy-test-data.json'), 'utf-8'));
const monozukuriData = JSON.parse(readFileSync(join(__dirname, '../data/monozukuri-test-data.json'), 'utf-8'));
const jizokukaData = JSON.parse(readFileSync(join(__dirname, '../data/jizokuka-test-data.json'), 'utf-8'));
const boundaryTests = JSON.parse(readFileSync(join(__dirname, '../data/boundary-test-cases.json'), 'utf-8'));

/**
 * AI-powered test data generator
 */
class AITestDataGenerator {
  private scenarios: any[] = [];
  
  constructor() {
    this.loadTestScenarios();
  }

  private loadTestScenarios() {
    this.scenarios = [
      ...itSubsidyData.testCompanies,
      ...monozukuriData.testCompanies,
      ...jizokukaData.testCompanies
    ];
  }

  /**
   * Generate diverse test data based on patterns
   */
  generateDiverseCompanies(count: number = 50) {
    const generatedCompanies = [];
    
    const industries = ['製造業', 'サービス業', '小売業', '卸売業', '情報通信業', '建設業'];
    const challenges = [
      ['デジタル化', '効率化', '自動化'],
      ['セキュリティ強化', '情報保護', 'システム統合'],
      ['販路開拓', '顧客獲得', 'ブランディング'],
      ['生産性向上', 'コスト削減', '品質向上'],
      ['新製品開発', '技術革新', '研究開発'],
      ['海外展開', 'グローバル化', '輸出拡大']
    ];

    for (let i = 0; i < count; i++) {
      const industry = industries[Math.floor(Math.random() * industries.length)];
      const challengeSet = challenges[Math.floor(Math.random() * challenges.length)];
      
      generatedCompanies.push({
        id: `ai-generated-${i.toString().padStart(3, '0')}`,
        name: `AI生成企業${i + 1}`,
        industry,
        employeeCount: this.generateEmployeeCount(industry),
        annualRevenue: this.generateAnnualRevenue(),
        establishedYear: 2000 + Math.floor(Math.random() * 24),
        currentChallenges: challengeSet,
        digitalMaturity: ['低', '中', '高'][Math.floor(Math.random() * 3)],
        gbizIdStatus: Math.random() > 0.3 ? '取得済み' : '未取得'
      });
    }

    return generatedCompanies;
  }

  private generateEmployeeCount(industry: string): number {
    const ranges = {
      '製造業': [5, 300],
      'サービス業': [3, 100],
      '小売業': [2, 50],
      '卸売業': [5, 80],
      '情報通信業': [10, 200],
      '建設業': [8, 150]
    };
    
    const [min, max] = ranges[industry as keyof typeof ranges] || [5, 100];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private generateAnnualRevenue(): number {
    // 10百万円から10億円の範囲
    return Math.floor(Math.random() * 990000000) + 10000000;
  }
}

/**
 * Test result analyzer
 */
class TestResultAnalyzer {
  private results: any[] = [];

  addResult(testName: string, status: 'passed' | 'failed', duration: number, details?: any) {
    this.results.push({
      testName,
      status,
      duration,
      timestamp: new Date().toISOString(),
      details
    });
  }

  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'passed').length;
    const failedTests = totalTests - passedTests;
    const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;

    return {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        passRate: (passedTests / totalTests * 100).toFixed(2),
        averageDuration: Math.round(averageDuration)
      },
      details: this.results,
      recommendations: this.generateRecommendations()
    };
  }

  private generateRecommendations(): string[] {
    const recommendations = [];
    const failedTests = this.results.filter(r => r.status === 'failed');
    
    if (failedTests.length > 0) {
      recommendations.push(`${failedTests.length}件のテスト失敗があります。優先的に修正してください。`);
    }

    const slowTests = this.results.filter(r => r.duration > 5000);
    if (slowTests.length > 0) {
      recommendations.push(`${slowTests.length}件のテストが5秒以上かかっています。パフォーマンス改善を検討してください。`);
    }

    return recommendations;
  }
}

/**
 * Regression test helper functions
 */
class RegressionTestHelper {
  static async fillCompanyForm(page: Page, company: any) {
    await page.fill('[data-testid="company-name"]', company.name);
    await page.selectOption('[data-testid="industry-select"]', company.industry);
    await page.fill('[data-testid="employee-count"]', company.employeeCount.toString());
    
    if (company.annualRevenue) {
      await page.fill('[data-testid="annual-revenue"]', company.annualRevenue.toString());
    }
    
    if (company.establishedYear) {
      await page.fill('[data-testid="established-year"]', company.establishedYear.toString());
    }
  }

  static async answerQuestions(page: Page, questionFlow: any[]) {
    for (const question of questionFlow) {
      await page.waitForSelector('[data-testid="question-text"]');
      
      if (question.type === 'radio') {
        const optionIndex = Math.floor(Math.random() * question.options.length);
        await page.click(`[data-testid="answer-option-${optionIndex}"]`);
      } else if (question.type === 'checkbox') {
        // Select 1-3 random options
        const selectCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < selectCount; i++) {
          const optionIndex = Math.floor(Math.random() * question.options.length);
          await page.click(`[data-testid="checkbox-option-${optionIndex}"]`);
        }
      } else if (question.type === 'number') {
        const value = question.min + Math.floor(Math.random() * (question.max - question.min));
        await page.fill('[data-testid="number-input"]', value.toString());
      }
      
      await page.click('[data-testid="next-question"]');
    }
  }

  static async verifyResult(page: Page, expectedSubsidy: string) {
    await page.waitForSelector('[data-testid="result-container"]');
    const resultText = await page.textContent('[data-testid="recommended-subsidy"]');
    return resultText?.includes(expectedSubsidy) || false;
  }
}

// Global test setup
const testAnalyzer = new TestResultAnalyzer();
const aiGenerator = new AITestDataGenerator();

test.describe('Comprehensive Regression Test Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }, testInfo) => {
    // テスト結果の記録
    testAnalyzer.addResult(
      testInfo.title,
      testInfo.status as 'passed' | 'failed',
      testInfo.duration,
      {
        url: page.url(),
        errors: testInfo.errors
      }
    );
  });

  test.describe('IT導入補助金 回帰テスト', () => {
    itSubsidyData.testCompanies.forEach((company: any) => {
      test(`${company.name} - ${company.targetCategory}`, async ({ page }) => {
        const startTime = Date.now();
        
        await page.click('[data-testid="start-button"]');
        await RegressionTestHelper.fillCompanyForm(page, company);
        await page.click('[data-testid="next-button"]');
        
        // 質問フローの処理
        const questionFlow = itSubsidyData.questionFlows.find(
          (flow: any) => flow.categoryId === company.targetCategory
        );
        
        if (questionFlow) {
          await RegressionTestHelper.answerQuestions(page, questionFlow.questions);
        }
        
        // 結果検証
        const isCorrect = await RegressionTestHelper.verifyResult(page, 'IT導入補助金');
        expect(isCorrect).toBeTruthy();
        
        // カテゴリー検証
        const categoryText = await page.textContent('[data-testid="subsidy-category"]');
        expect(categoryText).toContain(company.targetCategory);
        
        const duration = Date.now() - startTime;
        console.log(`Test completed in ${duration}ms`);
        expect(duration).toBeLessThan(10000); // 10秒以内
      });
    });
  });

  test.describe('ものづくり補助金 回帰テスト', () => {
    monozukuriData.testCompanies.forEach((company: any) => {
      test(`${company.name} - ${company.targetCategory}`, async ({ page }) => {
        await page.click('[data-testid="start-button"]');
        await RegressionTestHelper.fillCompanyForm(page, company);
        await page.click('[data-testid="next-button"]');
        
        const questionFlow = monozukuriData.questionFlows.find(
          (flow: any) => flow.categoryId === company.targetCategory
        );
        
        if (questionFlow) {
          await RegressionTestHelper.answerQuestions(page, questionFlow.questions);
        }
        
        const isCorrect = await RegressionTestHelper.verifyResult(page, 'ものづくり補助金');
        expect(isCorrect).toBeTruthy();
      });
    });
  });

  test.describe('小規模事業者持続化補助金 回帰テスト', () => {
    jizokukaData.testCompanies.forEach((company: any) => {
      test(`${company.name} - ${company.targetCategory}`, async ({ page }) => {
        await page.click('[data-testid="start-button"]');
        await RegressionTestHelper.fillCompanyForm(page, company);
        await page.click('[data-testid="next-button"]');
        
        const questionFlow = jizokukaData.questionFlows.find(
          (flow: any) => flow.categoryId === company.targetCategory
        );
        
        if (questionFlow) {
          await RegressionTestHelper.answerQuestions(page, questionFlow.questions);
        }
        
        const isCorrect = await RegressionTestHelper.verifyResult(page, '小規模事業者持続化補助金');
        expect(isCorrect).toBeTruthy();
      });
    });
  });

  test.describe('境界値テスト回帰', () => {
    boundaryTests.categories.forEach((category: any) => {
      test.describe(category.name, () => {
        category.testCases.forEach((testCase: any) => {
          test(testCase.name, async ({ page }) => {
            await page.click('[data-testid="start-button"]');
            
            // 入力値の設定
            if (testCase.input.employeeCount !== undefined) {
              await page.fill('[data-testid="employee-count"]', testCase.input.employeeCount.toString());
            }
            
            if (testCase.input.industry) {
              await page.selectOption('[data-testid="industry-select"]', testCase.input.industry);
            }
            
            if (testCase.input.requestedAmount !== undefined) {
              await page.fill('[data-testid="requested-amount"]', testCase.input.requestedAmount.toString());
            }
            
            await page.click('[data-testid="next-button"]');
            
            // 期待される結果の検証
            if (testCase.expected.result === '合格') {
              await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
            } else if (testCase.expected.result === '不合格') {
              await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
              if (testCase.expected.message) {
                await expect(page.locator('[data-testid="error-message"]')).toContainText(testCase.expected.message);
              }
            }
          });
        });
      });
    });
  });

  test.describe('AI生成データによる探索的テスト', () => {
    const generatedCompanies = aiGenerator.generateDiverseCompanies(20);
    
    generatedCompanies.forEach((company, index) => {
      test(`AI生成企業 ${index + 1} - ${company.industry}`, async ({ page }) => {
        await page.click('[data-testid="start-button"]');
        await RegressionTestHelper.fillCompanyForm(page, company);
        await page.click('[data-testid="next-button"]');
        
        // ランダムな質問回答
        let questionCount = 0;
        while (questionCount < 5) { // 最大5問まで
          const questionExists = await page.locator('[data-testid="question-text"]').isVisible();
          if (!questionExists) break;
          
          const radioOptions = await page.locator('[data-testid^="answer-option-"]').count();
          if (radioOptions > 0) {
            const randomOption = Math.floor(Math.random() * radioOptions);
            await page.click(`[data-testid="answer-option-${randomOption}"]`);
          }
          
          await page.click('[data-testid="next-question"]');
          questionCount++;
        }
        
        // 結果が表示されることを確認
        await page.waitForSelector('[data-testid="result-container"]', { timeout: 10000 });
        await expect(page.locator('[data-testid="recommended-subsidy"]')).toBeVisible();
        
        // 推奨補助金が有効な選択肢であることを確認
        const subsidyText = await page.textContent('[data-testid="recommended-subsidy"]');
        expect(['IT導入補助金', 'ものづくり補助金', '小規模事業者持続化補助金'])
          .toContain(subsidyText?.split('の')[0]);
      });
    });
  });

  test.describe('パフォーマンス回帰テスト', () => {
    test('大量データ処理性能', async ({ page }) => {
      const startTime = Date.now();
      
      // 50社分のデータを連続処理
      const companies = aiGenerator.generateDiverseCompanies(50);
      
      for (let i = 0; i < 5; i++) { // 代表的な5社でテスト
        const company = companies[i];
        
        await page.goto('/');
        await page.click('[data-testid="start-button"]');
        await RegressionTestHelper.fillCompanyForm(page, company);
        await page.click('[data-testid="next-button"]');
        
        // 簡単な質問回答
        const questionExists = await page.locator('[data-testid="question-text"]').isVisible();
        if (questionExists) {
          await page.click('[data-testid="answer-option-0"]');
          await page.click('[data-testid="next-question"]');
        }
        
        await page.waitForSelector('[data-testid="result-container"]');
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`Processed 5 companies in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(30000); // 30秒以内
    });

    test('メモリ使用量監視', async ({ page }) => {
      await page.addInitScript(() => {
        (window as any).initialMemory = (performance as any).memory?.usedJSMemory || 0;
      });

      // 複数回の診断実行
      for (let i = 0; i < 10; i++) {
        await page.goto('/');
        await page.click('[data-testid="start-button"]');
        await page.fill('[data-testid="company-name"]', `メモリテスト企業${i}`);
        await page.selectOption('[data-testid="industry-select"]', '製造業');
        await page.fill('[data-testid="employee-count"]', '10');
        await page.click('[data-testid="next-button"]');
        await page.click('[data-testid="answer-option-0"]');
        await page.click('[data-testid="restart-button"]');
      }

      const memoryIncrease = await page.evaluate(() => {
        const current = (performance as any).memory?.usedJSMemory || 0;
        const initial = (window as any).initialMemory || 0;
        return current - initial;
      });

      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // 20MB未満
    });
  });
});

// テスト完了後のレポート生成
test.afterAll(async () => {
  const report = testAnalyzer.generateReport();
  console.log('\n=== Regression Test Report ===');
  console.log(`Total Tests: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Pass Rate: ${report.summary.passRate}%`);
  console.log(`Average Duration: ${report.summary.averageDuration}ms`);
  
  if (report.recommendations.length > 0) {
    console.log('\n=== Recommendations ===');
    report.recommendations.forEach(rec => console.log(`- ${rec}`));
  }
  
  // CI/CD環境では結果をファイルに出力
  if (process.env.CI) {
    const fs = require('fs');
    fs.writeFileSync('test-results/regression-report.json', JSON.stringify(report, null, 2));
  }
});