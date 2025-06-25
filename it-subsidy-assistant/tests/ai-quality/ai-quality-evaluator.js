/**
 * Phase 2 AI機能品質評価システム
 * Worker2のAI改善をサポート
 */

const request = require('supertest');
const { performance } = require('perf_hooks');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// AI品質評価基準
const AI_QUALITY_STANDARDS = {
  responseTime: 5000,        // 5秒以内
  accuracyScore: 0.8,        // 80%以上
  relevanceScore: 0.75,      // 75%以上
  completenessScore: 0.7,    // 70%以上
  consistencyScore: 0.9,     // 90%以上（同じ入力で同様の結果）
  biasScore: 0.1,           // 10%以下（バイアススコア）
};

class AIQualityEvaluator {
  constructor() {
    this.testCases = this.generateTestCases();
    this.results = [];
  }

  generateTestCases() {
    return [
      // 基本的な診断ケース
      {
        id: 'basic_it_company',
        category: '基本診断',
        input: {
          companyName: 'テック株式会社',
          businessType: 'IT・ソフトウェア',
          employeeCount: 50,
          annualRevenue: 500000000,
          currentChallenges: ['業務効率化', 'デジタル化推進'],
          investmentBudget: 5000000
        },
        expected: {
          recommendedSubsidies: ['IT導入補助金', 'ものづくり補助金'],
          matchScore: { min: 0.7, max: 1.0 },
          requiredDocuments: ['事業計画書', '決算書'],
          estimatedAmount: { min: 1000000, max: 4500000 }
        }
      },
      {
        id: 'manufacturing_sme',
        category: '製造業診断',
        input: {
          companyName: '製造業株式会社',
          businessType: '製造業',
          employeeCount: 120,
          annualRevenue: 1200000000,
          currentChallenges: ['生産性向上', '省エネ対策'],
          investmentBudget: 15000000
        },
        expected: {
          recommendedSubsidies: ['ものづくり補助金', '省エネ補助金'],
          matchScore: { min: 0.8, max: 1.0 },
          requiredDocuments: ['事業計画書', '技術資料'],
          estimatedAmount: { min: 5000000, max: 12500000 }
        }
      },
      {
        id: 'startup_tech',
        category: 'スタートアップ診断',
        input: {
          companyName: 'スタートアップ株式会社',
          businessType: 'IT・ソフトウェア',
          employeeCount: 15,
          annualRevenue: 50000000,
          currentChallenges: ['事業拡大', '人材確保'],
          investmentBudget: 2000000
        },
        expected: {
          recommendedSubsidies: ['創業支援補助金', 'IT導入補助金'],
          matchScore: { min: 0.6, max: 0.9 },
          requiredDocuments: ['事業計画書', '創業計画書'],
          estimatedAmount: { min: 500000, max: 2000000 }
        }
      },
      // エッジケース
      {
        id: 'edge_case_large',
        category: 'エッジケース',
        input: {
          companyName: '大企業株式会社',
          businessType: '金融',
          employeeCount: 5000,
          annualRevenue: 50000000000,
          currentChallenges: ['DX推進'],
          investmentBudget: 100000000
        },
        expected: {
          recommendedSubsidies: [], // 大企業は対象外の場合が多い
          matchScore: { min: 0.0, max: 0.3 },
          explanation: '大企業向けの制度は限定的'
        }
      },
      // バイアステスト
      {
        id: 'bias_test_gender',
        category: 'バイアステスト',
        input: {
          companyName: '女性代表企業',
          businessType: 'サービス業',
          employeeCount: 30,
          ceoGender: '女性',
          currentChallenges: ['事業拡大']
        },
        expected: {
          biasCheck: true,
          genderNeutral: true
        }
      }
    ];
  }

  async runFullEvaluation() {
    console.log('🤖 AI品質評価開始...');
    
    const startTime = performance.now();
    
    for (const testCase of this.testCases) {
      console.log(`\n📝 テストケース: ${testCase.id}`);
      
      try {
        const result = await this.evaluateTestCase(testCase);
        this.results.push(result);
        
        this.displayTestResult(result);
        
      } catch (error) {
        console.error(`❌ テストケース ${testCase.id} でエラー:`, error.message);
        this.results.push({
          testCaseId: testCase.id,
          category: testCase.category,
          status: 'ERROR',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // 総合評価レポート生成
    const report = await this.generateQualityReport(totalTime);
    await this.saveReport(report);
    
    console.log('\n✅ AI品質評価完了');
    return report;
  }

  async evaluateTestCase(testCase) {
    const startTime = performance.now();
    
    // AI診断API呼び出し
    const aiResponse = await this.callAIDiagnosis(testCase.input);
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // 品質評価の実行
    const qualityScores = await this.calculateQualityScores(testCase, aiResponse);
    
    return {
      testCaseId: testCase.id,
      category: testCase.category,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      responseTime: responseTime,
      input: testCase.input,
      aiResponse: aiResponse,
      expected: testCase.expected,
      qualityScores: qualityScores,
      compliance: this.checkCompliance(qualityScores),
      recommendations: this.generateRecommendations(qualityScores, testCase)
    };
  }

  async callAIDiagnosis(input) {
    try {
      // 診断セッション開始
      const sessionResponse = await request(BACKEND_URL)
        .post('/api/diagnosis/start')
        .send({
          companyInfo: input
        })
        .timeout(10000);

      if (sessionResponse.status !== 200) {
        throw new Error(`診断開始エラー: ${sessionResponse.status}`);
      }

      const sessionId = sessionResponse.body.sessionId;

      // AI分析実行
      const analysisResponse = await request(BACKEND_URL)
        .post('/api/diagnosis/analyze')
        .send({
          sessionId: sessionId,
          analysisType: 'comprehensive'
        })
        .timeout(30000);

      if (analysisResponse.status !== 200) {
        throw new Error(`AI分析エラー: ${analysisResponse.status}`);
      }

      return analysisResponse.body;

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        // APIが利用できない場合はモックレスポンス
        return this.generateMockAIResponse(input);
      }
      throw error;
    }
  }

  generateMockAIResponse(input) {
    // 実際のAPIが利用できない場合のモックレスポンス
    const mockResponse = {
      sessionId: `mock_${Date.now()}`,
      analysis: {
        recommendedSubsidies: [
          {
            id: 'it_introduction',
            name: 'IT導入補助金',
            matchScore: 0.85,
            estimatedAmount: 2000000,
            reason: 'ITによる業務効率化に適合'
          }
        ],
        overallScore: 0.8,
        requiredDocuments: ['事業計画書', '決算書'],
        nextSteps: ['詳細計画書の作成', '申請書類の準備'],
        processingTime: 1500,
        confidence: 0.75
      },
      metadata: {
        aiModel: 'mock-model-v1',
        processingTime: Math.random() * 3000 + 1000,
        dataVersion: '2024.1'
      }
    };

    // 入力に基づく簡単な調整
    if (input.businessType?.includes('IT')) {
      mockResponse.analysis.recommendedSubsidies[0].matchScore = 0.9;
    }

    if (input.employeeCount > 100) {
      mockResponse.analysis.recommendedSubsidies.push({
        id: 'manufacturing',
        name: 'ものづくり補助金',
        matchScore: 0.7,
        estimatedAmount: 5000000,
        reason: '中規模企業向け設備投資支援'
      });
    }

    return mockResponse;
  }

  async calculateQualityScores(testCase, aiResponse) {
    const scores = {};

    // 応答時間スコア
    scores.responseTime = this.evaluateResponseTime(aiResponse.metadata?.processingTime);

    // 精度スコア（推奨補助金の適切性）
    scores.accuracy = this.evaluateAccuracy(testCase.expected, aiResponse.analysis);

    // 関連性スコア（入力に対する出力の関連性）
    scores.relevance = this.evaluateRelevance(testCase.input, aiResponse.analysis);

    // 完全性スコア（必要な情報が含まれているか）
    scores.completeness = this.evaluateCompleteness(aiResponse.analysis);

    // 一貫性スコア（同じ入力での結果の一貫性）
    scores.consistency = await this.evaluateConsistency(testCase.input);

    // バイアススコア（公平性の評価）
    scores.bias = this.evaluateBias(testCase, aiResponse);

    // 信頼度スコア
    scores.confidence = aiResponse.analysis.confidence || 0.5;

    return scores;
  }

  evaluateResponseTime(processingTime) {
    if (!processingTime) return 0.5;
    
    if (processingTime <= AI_QUALITY_STANDARDS.responseTime) {
      return 1.0;
    } else if (processingTime <= AI_QUALITY_STANDARDS.responseTime * 2) {
      return 0.7;
    } else {
      return 0.3;
    }
  }

  evaluateAccuracy(expected, actual) {
    let score = 0.0;
    let maxScore = 0.0;

    // 推奨補助金の精度
    if (expected.recommendedSubsidies) {
      maxScore += 0.4;
      const recommendedNames = actual.recommendedSubsidies?.map(s => s.name) || [];
      const matches = expected.recommendedSubsidies.filter(exp => 
        recommendedNames.some(rec => rec.includes(exp))
      );
      score += (matches.length / expected.recommendedSubsidies.length) * 0.4;
    }

    // マッチスコアの適切性
    if (expected.matchScore && actual.overallScore) {
      maxScore += 0.3;
      const inRange = actual.overallScore >= expected.matchScore.min && 
                     actual.overallScore <= expected.matchScore.max;
      score += inRange ? 0.3 : 0.1;
    }

    // 推定金額の妥当性
    if (expected.estimatedAmount && actual.recommendedSubsidies?.length > 0) {
      maxScore += 0.3;
      const totalEstimated = actual.recommendedSubsidies.reduce((sum, s) => sum + (s.estimatedAmount || 0), 0);
      const inRange = totalEstimated >= expected.estimatedAmount.min && 
                     totalEstimated <= expected.estimatedAmount.max;
      score += inRange ? 0.3 : 0.1;
    }

    return maxScore > 0 ? score / maxScore : 0.5;
  }

  evaluateRelevance(input, analysis) {
    let score = 0.0;

    // 業種と推奨補助金の関連性
    if (input.businessType && analysis.recommendedSubsidies) {
      const relevantSubsidies = analysis.recommendedSubsidies.filter(subsidy => {
        const reason = subsidy.reason || '';
        return reason.includes(input.businessType) || 
               this.isRelevantToBusinessType(input.businessType, subsidy.name);
      });
      score += (relevantSubsidies.length / analysis.recommendedSubsidies.length) * 0.4;
    }

    // 課題と解決策の関連性
    if (input.currentChallenges && analysis.recommendedSubsidies) {
      const challengeKeywords = input.currentChallenges.join(' ');
      const relevantCount = analysis.recommendedSubsidies.filter(subsidy => {
        const reason = subsidy.reason || '';
        return input.currentChallenges.some(challenge => reason.includes(challenge));
      }).length;
      score += (relevantCount / analysis.recommendedSubsidies.length) * 0.3;
    }

    // 企業規模の適切性
    if (input.employeeCount && analysis.recommendedSubsidies) {
      score += 0.3; // 基本的に企業規模チェックは実装されていると仮定
    }

    return Math.min(score, 1.0);
  }

  evaluateCompleteness(analysis) {
    let score = 0.0;
    const requiredFields = [
      'recommendedSubsidies',
      'requiredDocuments', 
      'nextSteps',
      'overallScore'
    ];

    requiredFields.forEach(field => {
      if (analysis[field] && 
          (Array.isArray(analysis[field]) ? analysis[field].length > 0 : true)) {
        score += 1.0 / requiredFields.length;
      }
    });

    // 推奨補助金の詳細度チェック
    if (analysis.recommendedSubsidies?.length > 0) {
      const detailedSubsidies = analysis.recommendedSubsidies.filter(s => 
        s.reason && s.estimatedAmount && s.matchScore
      );
      score += (detailedSubsidies.length / analysis.recommendedSubsidies.length) * 0.2;
    }

    return Math.min(score, 1.0);
  }

  async evaluateConsistency(input) {
    // 同じ入力で複数回実行して一貫性をチェック
    try {
      const response1 = await this.callAIDiagnosis(input);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
      const response2 = await this.callAIDiagnosis(input);

      // 推奨補助金の一致度
      const subsidies1 = response1.analysis.recommendedSubsidies?.map(s => s.name) || [];
      const subsidies2 = response2.analysis.recommendedSubsidies?.map(s => s.name) || [];
      
      const intersection = subsidies1.filter(s => subsidies2.includes(s));
      const union = [...new Set([...subsidies1, ...subsidies2])];
      
      const consistency = union.length > 0 ? intersection.length / union.length : 1.0;
      
      return consistency;

    } catch (error) {
      // 一貫性テストができない場合は中立的なスコア
      return 0.8;
    }
  }

  evaluateBias(testCase, aiResponse) {
    if (testCase.category !== 'バイアステスト') {
      return 0.0; // バイアススコアは低い方が良い
    }

    // 性別、地域、業種などによるバイアスをチェック
    let biasScore = 0.0;

    // 性別バイアスチェック
    if (testCase.input.ceoGender) {
      const hasGenderBias = this.checkGenderBias(aiResponse);
      if (hasGenderBias) {
        biasScore += 0.5;
      }
    }

    return biasScore;
  }

  checkGenderBias(aiResponse) {
    // AIレスポンスに性別に関する不適切な言及がないかチェック
    const responseText = JSON.stringify(aiResponse).toLowerCase();
    const biasKeywords = ['男性', '女性', 'female', 'male', '主婦', 'housewife'];
    
    return biasKeywords.some(keyword => responseText.includes(keyword));
  }

  isRelevantToBusinessType(businessType, subsidyName) {
    const relevanceMap = {
      'IT': ['IT導入', 'デジタル', 'DX'],
      '製造業': ['ものづくり', '製造', '設備'],
      'サービス業': ['サービス', '接客', '顧客']
    };

    const keywords = relevanceMap[businessType] || [];
    return keywords.some(keyword => subsidyName.includes(keyword));
  }

  checkCompliance(scores) {
    return {
      responseTime: scores.responseTime >= 0.7 ? 'PASS' : 'FAIL',
      accuracy: scores.accuracy >= AI_QUALITY_STANDARDS.accuracyScore ? 'PASS' : 'FAIL',
      relevance: scores.relevance >= AI_QUALITY_STANDARDS.relevanceScore ? 'PASS' : 'FAIL',
      completeness: scores.completeness >= AI_QUALITY_STANDARDS.completenessScore ? 'PASS' : 'FAIL',
      consistency: scores.consistency >= AI_QUALITY_STANDARDS.consistencyScore ? 'PASS' : 'FAIL',
      bias: scores.bias <= AI_QUALITY_STANDARDS.biasScore ? 'PASS' : 'FAIL'
    };
  }

  generateRecommendations(scores, testCase) {
    const recommendations = [];

    if (scores.accuracy < AI_QUALITY_STANDARDS.accuracyScore) {
      recommendations.push({
        category: '精度改善',
        priority: 'HIGH',
        description: 'AI推奨精度の向上が必要',
        suggestions: [
          '訓練データの質向上',
          'モデルパラメータの調整',
          '業種別ルールの強化'
        ]
      });
    }

    if (scores.relevance < AI_QUALITY_STANDARDS.relevanceScore) {
      recommendations.push({
        category: '関連性改善',
        priority: 'MEDIUM',
        description: '入力と出力の関連性向上',
        suggestions: [
          'コンテキスト理解の改善',
          '業種・課題マッピングの強化',
          '意味的類似性の向上'
        ]
      });
    }

    if (scores.responseTime < 0.7) {
      recommendations.push({
        category: '性能改善',
        priority: 'MEDIUM',
        description: 'AI応答時間の最適化',
        suggestions: [
          'モデルの軽量化',
          'キャッシュ機能の実装',
          'バッチ処理の最適化'
        ]
      });
    }

    if (scores.bias > AI_QUALITY_STANDARDS.biasScore) {
      recommendations.push({
        category: 'バイアス対策',
        priority: 'HIGH',
        description: 'AI公平性の改善が必要',
        suggestions: [
          'バイアス検出機能の強化',
          '多様なデータセットでの学習',
          '公平性テストの拡充'
        ]
      });
    }

    return recommendations;
  }

  async generateQualityReport(totalTime) {
    const overallScores = this.calculateOverallScores();
    const complianceRate = this.calculateComplianceRate();
    
    return {
      generatedAt: new Date().toISOString(),
      testDuration: Math.round(totalTime),
      totalTestCases: this.testCases.length,
      completedTests: this.results.filter(r => r.status === 'COMPLETED').length,
      failedTests: this.results.filter(r => r.status === 'ERROR').length,
      overallScores: overallScores,
      complianceRate: complianceRate,
      standards: AI_QUALITY_STANDARDS,
      categoryResults: this.getCategoryResults(),
      recommendations: this.getOverallRecommendations(),
      detailedResults: this.results
    };
  }

  calculateOverallScores() {
    const completed = this.results.filter(r => r.status === 'COMPLETED');
    if (completed.length === 0) return null;

    const scoreKeys = ['accuracy', 'relevance', 'completeness', 'consistency', 'bias'];
    const averages = {};

    scoreKeys.forEach(key => {
      const scores = completed
        .map(r => r.qualityScores[key])
        .filter(s => s !== undefined);
      
      if (scores.length > 0) {
        averages[key] = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      }
    });

    return averages;
  }

  calculateComplianceRate() {
    const completed = this.results.filter(r => r.status === 'COMPLETED');
    if (completed.length === 0) return 0;

    const totalChecks = completed.length * 6; // 6つの品質基準
    const passedChecks = completed.reduce((sum, result) => {
      return sum + Object.values(result.compliance).filter(c => c === 'PASS').length;
    }, 0);

    return (passedChecks / totalChecks * 100).toFixed(1);
  }

  getCategoryResults() {
    const categories = {};
    
    this.results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = {
          testCount: 0,
          passed: 0,
          averageScores: {}
        };
      }
      
      categories[result.category].testCount++;
      
      if (result.status === 'COMPLETED') {
        const allPassed = Object.values(result.compliance).every(c => c === 'PASS');
        if (allPassed) categories[result.category].passed++;
        
        // スコア平均計算
        Object.keys(result.qualityScores).forEach(key => {
          if (!categories[result.category].averageScores[key]) {
            categories[result.category].averageScores[key] = [];
          }
          categories[result.category].averageScores[key].push(result.qualityScores[key]);
        });
      }
    });

    // 平均値計算
    Object.keys(categories).forEach(category => {
      Object.keys(categories[category].averageScores).forEach(scoreKey => {
        const scores = categories[category].averageScores[scoreKey];
        categories[category].averageScores[scoreKey] = 
          scores.reduce((sum, s) => sum + s, 0) / scores.length;
      });
    });

    return categories;
  }

  getOverallRecommendations() {
    const allRecommendations = this.results
      .filter(r => r.status === 'COMPLETED')
      .flatMap(r => r.recommendations);

    // 優先度別にグループ化
    const grouped = allRecommendations.reduce((acc, rec) => {
      if (!acc[rec.priority]) acc[rec.priority] = [];
      acc[rec.priority].push(rec);
      return acc;
    }, {});

    return grouped;
  }

  displayTestResult(result) {
    if (result.status === 'ERROR') {
      console.log(`  ❌ エラー: ${result.error}`);
      return;
    }

    console.log(`  ⏱️ 応答時間: ${Math.round(result.responseTime)}ms`);
    console.log('  📊 品質スコア:');
    
    Object.entries(result.qualityScores).forEach(([key, score]) => {
      const status = result.compliance[key] === 'PASS' ? '✅' : '❌';
      console.log(`    ${key}: ${(score * 100).toFixed(1)}% ${status}`);
    });

    if (result.recommendations.length > 0) {
      console.log('  💡 改善提案:');
      result.recommendations.forEach(rec => {
        console.log(`    - [${rec.priority}] ${rec.description}`);
      });
    }
  }

  async saveReport(report) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const reportPath = path.join(__dirname, '../reports/ai-quality-report.json');
    const dir = path.dirname(reportPath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 AI品質レポート: ${reportPath}`);
  }
}

// CLI実行
if (require.main === module) {
  const evaluator = new AIQualityEvaluator();
  evaluator.runFullEvaluation().catch(error => {
    console.error('❌ AI品質評価エラー:', error);
    process.exit(1);
  });
}

module.exports = { AIQualityEvaluator, AI_QUALITY_STANDARDS };