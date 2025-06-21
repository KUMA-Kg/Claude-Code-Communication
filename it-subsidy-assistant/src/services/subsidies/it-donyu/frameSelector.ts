/**
 * IT導入補助金 申請枠判定サービス
 * 
 * 質問への回答に基づいて最適な申請枠を判定し、
 * 必要書類を自動的にフィルタリングします
 */

import frameSelectionData from '../../../data/subsidies/it-donyu-2024/questionnaires/frame_selection.json';

export interface Answer {
  questionId: string;
  value: string | string[];
}

export interface FrameDeterminationResult {
  frameCode: string;
  frameName: string;
  requiredDocuments: string[];
  optionalDocuments: string[];
  categoryDocuments?: string[];
  totalQuestions: number;
  answeredQuestions: number;
}

export interface Question {
  id: string;
  type: 'single_select' | 'multi_select';
  required: boolean;
  question: string;
  options: QuestionOption[];
  condition?: string;
}

export interface QuestionOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  next_questions?: string[];
  suggested_frame?: string;
  frame_name?: string;
}

export class ITSubsidyFrameSelector {
  private questionnaire = frameSelectionData;

  /**
   * 初期質問を取得
   */
  getInitialQuestion(): Question {
    return this.questionnaire.questions[0] as Question;
  }

  /**
   * 回答に基づいて次の質問を取得
   */
  getNextQuestions(answers: Answer[]): Question[] {
    const mainAnswer = answers.find(a => a.id === 'q1_main_challenge');
    if (!mainAnswer) return [];

    const selectedOption = this.questionnaire.questions[0].options
      .find(opt => opt.value === mainAnswer.value);
    
    if (!selectedOption?.next_questions) return [];

    return this.questionnaire.questions
      .filter(q => selectedOption.next_questions!.includes(q.id))
      .map(q => q as Question);
  }

  /**
   * 回答から申請枠を判定
   */
  determineFrame(answers: Answer[]): FrameDeterminationResult {
    const mainAnswer = answers.find(a => a.id === 'q1_main_challenge');
    if (!mainAnswer) {
      throw new Error('主要な質問への回答がありません');
    }

    // 選択されたオプションから申請枠を特定
    const selectedOption = this.questionnaire.questions[0].options
      .find(opt => opt.value === mainAnswer.value);
    
    if (!selectedOption?.suggested_frame) {
      throw new Error('申請枠を特定できません');
    }

    const frameCode = selectedOption.suggested_frame;
    const frameRule = this.questionnaire.frame_determination_rules[frameCode];

    if (!frameRule) {
      throw new Error(`申請枠 ${frameCode} の定義が見つかりません`);
    }

    // 必要書類のリストを作成
    const requiredDocuments = [
      ...this.questionnaire.common_required_documents,
      ...frameRule.required_documents
    ];

    // ITツールカテゴリーは後で判定（現時点では仮でカテゴリー5を使用）
    const categoryDocuments = this.questionnaire.category_documents.category_5;

    // 質問の総数と回答数を計算
    const totalQuestions = this.calculateTotalQuestions(answers);
    const answeredQuestions = answers.length;

    return {
      frameCode: frameRule.frame_code,
      frameName: frameRule.frame_name,
      requiredDocuments,
      optionalDocuments: frameRule.optional_documents,
      categoryDocuments,
      totalQuestions,
      answeredQuestions
    };
  }

  /**
   * 必要な質問の総数を計算
   */
  private calculateTotalQuestions(answers: Answer[]): number {
    const mainAnswer = answers.find(a => a.id === 'q1_main_challenge');
    if (!mainAnswer) return 1;

    const selectedOption = this.questionnaire.questions[0].options
      .find(opt => opt.value === mainAnswer.value);
    
    const additionalQuestions = selectedOption?.next_questions?.length || 0;
    return 1 + additionalQuestions;
  }

  /**
   * 申請枠の一覧を取得
   */
  getAvailableFrames(): Array<{code: string, name: string}> {
    return Object.entries(this.questionnaire.frame_determination_rules)
      .map(([code, rule]) => ({
        code,
        name: rule.frame_name
      }));
  }

  /**
   * 特定の申請枠の詳細情報を取得
   */
  getFrameDetails(frameCode: string) {
    const frameRule = this.questionnaire.frame_determination_rules[frameCode];
    if (!frameRule) return null;

    return {
      ...frameRule,
      commonRequiredDocuments: this.questionnaire.common_required_documents,
      categoryDocuments: this.questionnaire.category_documents
    };
  }
}