/**
 * 補助金マスターデータ検証システム
 * 各補助金のデータ整合性を包括的に検証
 */

import { z } from 'zod';

// 共通スキーマ定義
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式はYYYY-MM-DDである必要があります');

const QuestionOptionSchema = z.object({
  value: z.string().min(1, 'オプション値は必須です'),
  label: z.string().min(1, 'オプションラベルは必須です'),
  subQuestions: z.array(z.string()).optional()
});

const ValidationRuleSchema = z.object({
  minLength: z.number().positive().optional(),
  maxLength: z.number().positive().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  customValidator: z.string().optional()
}).refine(data => {
  if (data.minLength && data.maxLength) {
    return data.minLength <= data.maxLength;
  }
  if (data.min !== undefined && data.max !== undefined) {
    return data.min <= data.max;
  }
  return true;
}, '最小値は最大値以下である必要があります');

const QuestionSchema = z.object({
  id: z.string().min(1, '質問IDは必須です'),
  type: z.enum(['text', 'number', 'date', 'radio', 'select', 'multiselect', 'checkbox', 'textarea']),
  question: z.string().min(1, '質問文は必須です'),
  required: z.boolean(),
  category: z.string().optional(),
  hint: z.string().optional(),
  options: z.array(QuestionOptionSchema).optional(),
  validation: ValidationRuleSchema.optional(),
  dependencies: z.array(z.object({
    questionId: z.string(),
    value: z.union([z.string(), z.array(z.string())]),
    action: z.enum(['show', 'hide', 'require'])
  })).optional()
}).refine(data => {
  const requiresOptions = ['radio', 'select', 'multiselect', 'checkbox'].includes(data.type);
  if (requiresOptions && (!data.options || data.options.length === 0)) {
    return false;
  }
  return true;
}, '選択系の質問には選択肢が必要です');

// 補助金基本情報スキーマ
const SubsidyInfoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['it-donyu', 'jizokuka', 'monozukuri']),
  description: z.string().min(1),
  maxAmount: z.number().positive(),
  subsidyRate: z.number().min(0).max(1),
  applicationPeriod: z.object({
    start: DateSchema,
    end: DateSchema
  }).refine(data => new Date(data.start) < new Date(data.end), '申請開始日は終了日より前である必要があります'),
  eligibleCompanyTypes: z.array(z.string()).min(1),
  eligibleIndustries: z.array(z.string()).optional(),
  requiredDocuments: z.array(z.string()).min(1)
});

// 質問フロー検証クラス
export class SubsidyDataValidator {
  private errors: Array<{
    path: string;
    message: string;
    severity: 'error' | 'warning';
  }> = [];

  /**
   * 補助金データの包括的検証
   */
  async validateSubsidyData(subsidyType: string, data: any): Promise<ValidationResult> {
    this.errors = [];

    try {
      // 1. 基本情報の検証
      this.validateBasicInfo(data);

      // 2. 質問フローの検証
      await this.validateQuestionFlow(data.questions || []);

      // 3. 締切日程の論理的整合性
      this.validateDeadlines(data);

      // 4. 必要書類の整合性
      this.validateRequiredDocuments(data);

      // 5. 金額・補助率の妥当性
      this.validateFinancialConstraints(data);

      // 6. 依存関係の循環参照チェック
      this.validateDependencyCycles(data.questions || []);

      return {
        isValid: this.errors.filter(e => e.severity === 'error').length === 0,
        errors: this.errors,
        warnings: this.errors.filter(e => e.severity === 'warning'),
        summary: this.generateValidationSummary()
      };

    } catch (error) {
      this.errors.push({
        path: 'root',
        message: `検証中にエラーが発生しました: ${error}`,
        severity: 'error'
      });
      return {
        isValid: false,
        errors: this.errors,
        warnings: [],
        summary: '検証プロセスが失敗しました'
      };
    }
  }

  /**
   * 基本情報の検証
   */
  private validateBasicInfo(data: any): void {
    try {
      SubsidyInfoSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          this.errors.push({
            path: err.path.join('.'),
            message: err.message,
            severity: 'error'
          });
        });
      }
    }
  }

  /**
   * 質問フローの検証
   */
  private async validateQuestionFlow(questions: any[]): Promise<void> {
    const questionIds = new Set<string>();
    
    for (const question of questions) {
      // 重複IDチェック
      if (questionIds.has(question.id)) {
        this.errors.push({
          path: `questions.${question.id}`,
          message: '重複する質問IDが検出されました',
          severity: 'error'
        });
      }
      questionIds.add(question.id);

      // 個別質問の検証
      try {
        QuestionSchema.parse(question);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            this.errors.push({
              path: `questions.${question.id}.${err.path.join('.')}`,
              message: err.message,
              severity: 'error'
            });
          });
        }
      }

      // 依存関係の検証
      if (question.dependencies) {
        this.validateQuestionDependencies(question, questionIds);
      }
    }
  }

  /**
   * 質問の依存関係検証
   */
  private validateQuestionDependencies(question: any, existingIds: Set<string>): void {
    for (const dep of question.dependencies || []) {
      if (!existingIds.has(dep.questionId)) {
        this.errors.push({
          path: `questions.${question.id}.dependencies`,
          message: `依存先の質問ID "${dep.questionId}" が存在しません`,
          severity: 'error'
        });
      }
    }
  }

  /**
   * 締切日程の論理的整合性検証
   */
  private validateDeadlines(data: any): void {
    const now = new Date();
    const applicationStart = new Date(data.applicationPeriod?.start);
    const applicationEnd = new Date(data.applicationPeriod?.end);

    // 過去の締切チェック
    if (applicationEnd < now) {
      this.errors.push({
        path: 'applicationPeriod.end',
        message: '申請期限が過去の日付です',
        severity: 'warning'
      });
    }

    // 申請期間の妥当性チェック（最低2週間）
    const periodDays = (applicationEnd.getTime() - applicationStart.getTime()) / (1000 * 60 * 60 * 24);
    if (periodDays < 14) {
      this.errors.push({
        path: 'applicationPeriod',
        message: '申請期間が短すぎます（推奨: 最低2週間）',
        severity: 'warning'
      });
    }

    // 関連締切の整合性チェック
    if (data.milestones) {
      this.validateMilestones(data.milestones, applicationStart, applicationEnd);
    }
  }

  /**
   * マイルストーンの検証
   */
  private validateMilestones(milestones: any[], appStart: Date, appEnd: Date): void {
    let previousDate = appStart;
    
    for (const milestone of milestones) {
      const milestoneDate = new Date(milestone.date);
      
      if (milestoneDate < previousDate) {
        this.errors.push({
          path: `milestones.${milestone.id}`,
          message: 'マイルストーンの日付が時系列順になっていません',
          severity: 'error'
        });
      }
      
      if (milestoneDate > appEnd && milestone.required) {
        this.errors.push({
          path: `milestones.${milestone.id}`,
          message: '必須マイルストーンが申請期限後に設定されています',
          severity: 'error'
        });
      }
      
      previousDate = milestoneDate;
    }
  }

  /**
   * 必要書類の整合性検証
   */
  private validateRequiredDocuments(data: any): void {
    const definedDocuments = new Set(data.requiredDocuments || []);
    const referencedDocuments = new Set<string>();

    // 質問から参照されている書類を収集
    (data.questions || []).forEach((q: any) => {
      if (q.relatedDocuments) {
        q.relatedDocuments.forEach((doc: string) => referencedDocuments.add(doc));
      }
    });

    // 未定義の書類参照チェック
    referencedDocuments.forEach(doc => {
      if (!definedDocuments.has(doc)) {
        this.errors.push({
          path: 'requiredDocuments',
          message: `質問で参照されている書類 "${doc}" が必要書類リストに定義されていません`,
          severity: 'error'
        });
      }
    });
  }

  /**
   * 金額・補助率の妥当性検証
   */
  private validateFinancialConstraints(data: any): void {
    const maxAmount = data.maxAmount;
    const subsidyRate = data.subsidyRate;

    // 補助金タイプ別の制約チェック
    switch (data.type) {
      case 'it-donyu':
        if (maxAmount > 4500000) {
          this.errors.push({
            path: 'maxAmount',
            message: 'IT導入補助金の最大額が通常枠の上限を超えています',
            severity: 'warning'
          });
        }
        if (subsidyRate > 0.75) {
          this.errors.push({
            path: 'subsidyRate',
            message: 'IT導入補助金の補助率が上限を超えています',
            severity: 'error'
          });
        }
        break;
      
      case 'jizokuka':
        if (maxAmount > 2000000) {
          this.errors.push({
            path: 'maxAmount',
            message: '持続化補助金の最大額が通常枠の上限を超えています',
            severity: 'warning'
          });
        }
        break;
      
      case 'monozukuri':
        if (maxAmount > 50000000) {
          this.errors.push({
            path: 'maxAmount',
            message: 'ものづくり補助金の最大額が異常に高いです',
            severity: 'warning'
          });
        }
        break;
    }
  }

  /**
   * 依存関係の循環参照チェック
   */
  private validateDependencyCycles(questions: any[]): void {
    const graph = new Map<string, Set<string>>();
    
    // 依存関係グラフの構築
    questions.forEach(q => {
      if (!graph.has(q.id)) {
        graph.set(q.id, new Set());
      }
      (q.dependencies || []).forEach((dep: any) => {
        graph.get(q.id)!.add(dep.questionId);
      });
    });

    // DFSで循環参照を検出
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);
      
      const neighbors = graph.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
      
      recursionStack.delete(node);
      return false;
    };

    for (const questionId of graph.keys()) {
      if (!visited.has(questionId)) {
        if (hasCycle(questionId)) {
          this.errors.push({
            path: 'questions.dependencies',
            message: `質問ID "${questionId}" を含む循環参照が検出されました`,
            severity: 'error'
          });
        }
      }
    }
  }

  /**
   * 検証サマリーの生成
   */
  private generateValidationSummary(): string {
    const errorCount = this.errors.filter(e => e.severity === 'error').length;
    const warningCount = this.errors.filter(e => e.severity === 'warning').length;
    
    if (errorCount === 0 && warningCount === 0) {
      return '✅ すべての検証項目をパスしました';
    }
    
    return `検証完了: ${errorCount}個のエラー, ${warningCount}個の警告が検出されました`;
  }
}

// 型定義
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    path: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    path: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  summary: string;
}

// 自動検証トリガーの設定
export class DataValidationTrigger {
  private validator: SubsidyDataValidator;
  private watchedFiles: Map<string, number> = new Map();

  constructor() {
    this.validator = new SubsidyDataValidator();
  }

  /**
   * ファイル変更時の自動検証
   */
  async watchDataFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      const stats = await import('fs').then(fs => fs.promises.stat(filePath));
      this.watchedFiles.set(filePath, stats.mtimeMs);
    }

    // 定期的にファイルの変更をチェック
    setInterval(async () => {
      for (const [filePath, lastModified] of this.watchedFiles) {
        const stats = await import('fs').then(fs => fs.promises.stat(filePath));
        if (stats.mtimeMs > lastModified) {
          console.log(`📝 データファイルが更新されました: ${filePath}`);
          await this.validateFile(filePath);
          this.watchedFiles.set(filePath, stats.mtimeMs);
        }
      }
    }, 5000); // 5秒ごとにチェック
  }

  /**
   * ファイルの検証実行
   */
  private async validateFile(filePath: string): Promise<void> {
    try {
      const data = await import('fs').then(fs => 
        JSON.parse(fs.readFileSync(filePath, 'utf8'))
      );
      
      const subsidyType = this.extractSubsidyType(filePath);
      const result = await this.validator.validateSubsidyData(subsidyType, data);
      
      if (!result.isValid) {
        console.error(`❌ 検証エラー: ${filePath}`);
        console.error(result.errors);
      } else if (result.warnings.length > 0) {
        console.warn(`⚠️  検証警告: ${filePath}`);
        console.warn(result.warnings);
      } else {
        console.log(`✅ 検証成功: ${filePath}`);
      }
    } catch (error) {
      console.error(`🚨 検証失敗: ${filePath}`, error);
    }
  }

  /**
   * ファイルパスから補助金タイプを抽出
   */
  private extractSubsidyType(filePath: string): string {
    if (filePath.includes('it-donyu')) return 'it-donyu';
    if (filePath.includes('jizokuka')) return 'jizokuka';
    if (filePath.includes('monozukuri')) return 'monozukuri';
    return 'unknown';
  }
}

// デフォルトエクスポート
export default SubsidyDataValidator;