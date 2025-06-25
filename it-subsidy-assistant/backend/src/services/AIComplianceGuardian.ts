import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ComplianceRule {
  id: string;
  name: string;
  category: string;
  required: boolean;
  validator: (content: string) => boolean;
  autoFix?: (content: string) => string;
  errorMessage: string;
}

interface ComplianceResult {
  ruleId: string;
  passed: boolean;
  message: string;
  suggestion?: string;
  autoFixed?: boolean;
}

interface ComplianceReport {
  overall: number;
  timestamp: Date;
  results: ComplianceResult[];
  categories: Map<string, number>;
  recommendations: string[];
  autoFixesApplied: number;
}

interface SubsidyGuideline {
  subsidyType: string;
  version: string;
  lastUpdated: Date;
  rules: ComplianceRule[];
}

export class AIComplianceGuardian extends EventEmitter {
  private guidelines: Map<string, SubsidyGuideline> = new Map();
  private complianceHistory: ComplianceReport[] = [];
  private readonly COMPLIANCE_THRESHOLD = 85; // 85%以上で合格

  constructor() {
    super();
    this.initializeGuidelines();
  }

  /**
   * ガイドラインの初期化
   */
  private async initializeGuidelines(): Promise<void> {
    // IT導入補助金のガイドライン
    this.guidelines.set('it-subsidy', {
      subsidyType: 'IT導入補助金',
      version: '2024.1',
      lastUpdated: new Date(),
      rules: [
        {
          id: 'it-001',
          name: '事業概要の明確化',
          category: '必須項目',
          required: true,
          validator: (content) => {
            return content.includes('事業内容') && 
                   content.includes('従業員数') && 
                   content.includes('売上高');
          },
          autoFix: (content) => {
            if (!content.includes('事業内容')) {
              content += '\n\n【事業内容】\n[具体的な事業内容を記載してください]';
            }
            if (!content.includes('従業員数')) {
              content += '\n【従業員数】[人数]名';
            }
            if (!content.includes('売上高')) {
              content += '\n【売上高】[金額]万円';
            }
            return content;
          },
          errorMessage: '事業概要に必須項目（事業内容、従業員数、売上高）が不足しています'
        },
        {
          id: 'it-002',
          name: 'IT導入の目的',
          category: '必須項目',
          required: true,
          validator: (content) => {
            const purposeKeywords = ['生産性向上', '業務効率化', 'DX推進', 'デジタル化'];
            return purposeKeywords.some(keyword => content.includes(keyword));
          },
          errorMessage: 'IT導入の目的が明確に記載されていません'
        },
        {
          id: 'it-003',
          name: '具体的な数値目標',
          category: '評価項目',
          required: false,
          validator: (content) => {
            return /\d+[%％]/.test(content) || /\d+時間/.test(content) || /\d+万円/.test(content);
          },
          errorMessage: '具体的な数値目標があると評価が高くなります'
        },
        {
          id: 'it-004',
          name: '実施スケジュール',
          category: '必須項目',
          required: true,
          validator: (content) => {
            return content.includes('導入時期') || content.includes('スケジュール') || /\d+月/.test(content);
          },
          autoFix: (content) => {
            if (!content.includes('導入時期') && !content.includes('スケジュール')) {
              content += '\n\n【実施スケジュール】\n- 導入準備期間：[開始月]～[終了月]\n- 本格導入：[開始月]';
            }
            return content;
          },
          errorMessage: '実施スケジュールが記載されていません'
        },
        {
          id: 'it-005',
          name: 'セキュリティ対策',
          category: '加点項目',
          required: false,
          validator: (content) => {
            const securityKeywords = ['セキュリティ', '暗号化', 'アクセス制御', 'バックアップ'];
            return securityKeywords.some(keyword => content.includes(keyword));
          },
          errorMessage: 'セキュリティ対策の記載があると加点されます'
        }
      ]
    });

    // 持続化補助金のガイドライン
    this.guidelines.set('sustainability-subsidy', {
      subsidyType: '持続化補助金',
      version: '2024.1',
      lastUpdated: new Date(),
      rules: [
        {
          id: 'sus-001',
          name: '販路開拓の具体策',
          category: '必須項目',
          required: true,
          validator: (content) => {
            return content.includes('販路開拓') || content.includes('新規顧客') || content.includes('売上拡大');
          },
          errorMessage: '販路開拓の具体的な方策が記載されていません'
        },
        {
          id: 'sus-002',
          name: '地域貢献',
          category: '加点項目',
          required: false,
          validator: (content) => {
            return content.includes('地域') || content.includes('地元') || content.includes('コミュニティ');
          },
          errorMessage: '地域貢献の観点があると評価が高くなります'
        }
      ]
    });

    this.emit('guidelinesInitialized', { count: this.guidelines.size });
  }

  /**
   * コンプライアンスチェックの実行
   */
  async checkCompliance(
    content: string, 
    subsidyType: string,
    autoFix: boolean = false
  ): Promise<ComplianceReport> {
    const guideline = this.guidelines.get(subsidyType);
    
    if (!guideline) {
      throw new Error(`Unknown subsidy type: ${subsidyType}`);
    }

    let processedContent = content;
    const results: ComplianceResult[] = [];
    const categoryScores = new Map<string, { passed: number; total: number }>();
    let autoFixesApplied = 0;

    // 各ルールをチェック
    for (const rule of guideline.rules) {
      const passed = rule.validator(processedContent);
      
      let autoFixed = false;
      if (!passed && autoFix && rule.autoFix) {
        processedContent = rule.autoFix(processedContent);
        autoFixed = rule.validator(processedContent);
        if (autoFixed) {
          autoFixesApplied++;
        }
      }

      results.push({
        ruleId: rule.id,
        passed: passed || autoFixed,
        message: passed || autoFixed ? `✓ ${rule.name}` : `✗ ${rule.name}: ${rule.errorMessage}`,
        autoFixed
      });

      // カテゴリ別スコアの集計
      if (!categoryScores.has(rule.category)) {
        categoryScores.set(rule.category, { passed: 0, total: 0 });
      }
      const categoryScore = categoryScores.get(rule.category)!;
      categoryScore.total++;
      if (passed || autoFixed) {
        categoryScore.passed++;
      }
    }

    // カテゴリ別スコアを計算
    const categories = new Map<string, number>();
    categoryScores.forEach((score, category) => {
      categories.set(category, (score.passed / score.total) * 100);
    });

    // 全体スコアの計算（必須項目は重み付けを高く）
    let totalScore = 0;
    let totalWeight = 0;
    results.forEach(result => {
      const rule = guideline.rules.find(r => r.id === result.ruleId)!;
      const weight = rule.required ? 2 : 1;
      totalWeight += weight;
      if (result.passed) {
        totalScore += weight;
      }
    });
    const overallScore = (totalScore / totalWeight) * 100;

    // レコメンデーションの生成
    const recommendations = this.generateRecommendations(results, guideline);

    const report: ComplianceReport = {
      overall: overallScore,
      timestamp: new Date(),
      results,
      categories,
      recommendations,
      autoFixesApplied
    };

    // 履歴に追加
    this.complianceHistory.push(report);

    this.emit('complianceChecked', {
      subsidyType,
      score: overallScore,
      passed: overallScore >= this.COMPLIANCE_THRESHOLD
    });

    // 自動修正が適用された場合は修正後のコンテンツも返す
    if (autoFix && autoFixesApplied > 0) {
      return { ...report, processedContent } as any;
    }

    return report;
  }

  /**
   * レコメンデーションの生成
   */
  private generateRecommendations(
    results: ComplianceResult[], 
    guideline: SubsidyGuideline
  ): string[] {
    const recommendations: string[] = [];
    
    // 失敗した必須項目
    const failedRequired = results.filter(r => {
      const rule = guideline.rules.find(rule => rule.id === r.ruleId);
      return rule?.required && !r.passed;
    });

    if (failedRequired.length > 0) {
      recommendations.push(
        `⚠️ 以下の必須項目を満たしていません：${failedRequired.map(r => r.message).join(', ')}`
      );
    }

    // 加点項目の提案
    const missedBonus = results.filter(r => {
      const rule = guideline.rules.find(rule => rule.id === r.ruleId);
      return !rule?.required && !r.passed;
    });

    if (missedBonus.length > 0) {
      recommendations.push(
        `💡 以下の項目を追加すると評価が向上します：${missedBonus.map(r => r.message).join(', ')}`
      );
    }

    // 自動修正された項目
    const autoFixed = results.filter(r => r.autoFixed);
    if (autoFixed.length > 0) {
      recommendations.push(
        `🔧 ${autoFixed.length}項目が自動修正されました。内容を確認してください。`
      );
    }

    return recommendations;
  }

  /**
   * 最新のガイドラインを取得（外部APIから）
   */
  async updateGuidelines(subsidyType: string): Promise<void> {
    // 実際の実装では外部APIから最新ガイドラインを取得
    // ここではシミュレーション
    console.log(`Updating guidelines for ${subsidyType}...`);
    
    // バージョンを更新
    const guideline = this.guidelines.get(subsidyType);
    if (guideline) {
      guideline.version = '2024.2';
      guideline.lastUpdated = new Date();
      
      this.emit('guidelinesUpdated', { subsidyType, version: guideline.version });
    }
  }

  /**
   * コンプライアンス証跡の保存
   */
  async saveComplianceAudit(
    documentId: string,
    report: ComplianceReport
  ): Promise<void> {
    const auditPath = path.join(
      process.cwd(),
      'compliance-audits',
      `${documentId}-${Date.now()}.json`
    );

    await fs.mkdir(path.dirname(auditPath), { recursive: true });
    await fs.writeFile(
      auditPath,
      JSON.stringify({
        documentId,
        report,
        timestamp: new Date().toISOString()
      }, null, 2)
    );

    this.emit('auditSaved', { documentId, path: auditPath });
  }

  /**
   * 統計情報の取得
   */
  getComplianceStats(): {
    totalChecks: number;
    averageScore: number;
    passRate: number;
    commonIssues: string[];
  } {
    if (this.complianceHistory.length === 0) {
      return {
        totalChecks: 0,
        averageScore: 0,
        passRate: 0,
        commonIssues: []
      };
    }

    const totalChecks = this.complianceHistory.length;
    const totalScore = this.complianceHistory.reduce((sum, report) => sum + report.overall, 0);
    const passedCount = this.complianceHistory.filter(report => report.overall >= this.COMPLIANCE_THRESHOLD).length;

    // 共通の問題を特定
    const issueFrequency = new Map<string, number>();
    this.complianceHistory.forEach(report => {
      report.results.filter(r => !r.passed).forEach(result => {
        const count = issueFrequency.get(result.message) || 0;
        issueFrequency.set(result.message, count + 1);
      });
    });

    const commonIssues = Array.from(issueFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue);

    return {
      totalChecks,
      averageScore: totalScore / totalChecks,
      passRate: (passedCount / totalChecks) * 100,
      commonIssues
    };
  }
}

// 使用例
export async function demonstrateComplianceGuardian() {
  const guardian = new AIComplianceGuardian();

  const documentContent = `
    【事業概要】
    弊社は小売業を営んでおり、従業員数は15名です。
    
    【IT導入の目的】
    業務効率化を図るため、新しい在庫管理システムを導入します。
    
    【期待される効果】
    在庫管理の時間を50%削減し、発注ミスをゼロにします。
  `;

  // コンプライアンスチェック（自動修正あり）
  const report = await guardian.checkCompliance(documentContent, 'it-subsidy', true);
  
  console.log(`コンプライアンススコア: ${report.overall.toFixed(2)}%`);
  console.log(`自動修正項目数: ${report.autoFixesApplied}`);
  console.log('推奨事項:');
  report.recommendations.forEach(rec => console.log(rec));

  // 監査証跡の保存
  await guardian.saveComplianceAudit('DOC-001', report);
}