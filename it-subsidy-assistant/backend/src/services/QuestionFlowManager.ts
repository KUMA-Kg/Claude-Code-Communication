import { supabaseService } from '@/config/database';
import { logger } from '@/utils/logger';

export interface Question {
  id: string;
  questionCode: string;
  questionText: string;
  questionType: 'text' | 'number' | 'select' | 'multi-select' | 'boolean' | 'date' | 'file';
  inputConfig: any;
  validationRules: any;
  helpText?: string;
  sortOrder: number;
  isRequired: boolean;
  conditions?: QuestionCondition[];
}

export interface QuestionCondition {
  id: string;
  conditionType: 'show_if' | 'hide_if' | 'required_if' | 'validate_if';
  dependsOnQuestionCode: string;
  conditionOperator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  conditionValue: any;
}

export interface QuestionSet {
  id: string;
  name: string;
  description?: string;
  subsidyId?: string;
  subsidyType?: string;
  version: number;
  questions: Question[];
}

export class QuestionFlowManager {
  /**
   * 補助金IDまたはタイプに基づいて質問セットを取得
   */
  public static async getQuestionSet(
    subsidyId?: string,
    subsidyType?: string
  ): Promise<QuestionSet | null> {
    try {
      let query = supabaseService
        .from('question_sets')
        .select(`
          id,
          name,
          description,
          subsidy_id,
          subsidy_type,
          version,
          questions (
            id,
            question_code,
            question_text,
            question_type,
            input_config,
            validation_rules,
            help_text,
            sort_order,
            is_required,
            question_conditions (
              id,
              condition_type,
              depends_on_question_code,
              condition_operator,
              condition_value
            )
          )
        `)
        .eq('is_active', true);

      if (subsidyId) {
        query = query.eq('subsidy_id', subsidyId);
      } else if (subsidyType) {
        query = query.eq('subsidy_type', subsidyType);
      } else {
        logger.error('Either subsidyId or subsidyType must be provided');
        return null;
      }

      const { data, error } = await query
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        logger.error('Failed to get question set:', error);
        return null;
      }

      // 質問を整形
      const questions: Question[] = data.questions
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((q: any) => ({
          id: q.id,
          questionCode: q.question_code,
          questionText: q.question_text,
          questionType: q.question_type,
          inputConfig: q.input_config,
          validationRules: q.validation_rules,
          helpText: q.help_text,
          sortOrder: q.sort_order,
          isRequired: q.is_required,
          conditions: q.question_conditions?.map((c: any) => ({
            id: c.id,
            conditionType: c.condition_type,
            dependsOnQuestionCode: c.depends_on_question_code,
            conditionOperator: c.condition_operator,
            conditionValue: c.condition_value
          }))
        }));

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        subsidyId: data.subsidy_id,
        subsidyType: data.subsidy_type,
        version: data.version,
        questions
      };
    } catch (error) {
      logger.error('QuestionFlowManager.getQuestionSet error:', error);
      return null;
    }
  }

  /**
   * 回答に基づいて次に表示すべき質問を計算
   */
  public static evaluateQuestionVisibility(
    questions: Question[],
    answers: Record<string, any>
  ): Question[] {
    return questions.filter(question => {
      // 条件がない場合は常に表示
      if (!question.conditions || question.conditions.length === 0) {
        return true;
      }

      // すべての条件を評価
      for (const condition of question.conditions) {
        const dependentValue = answers[condition.dependsOnQuestionCode];
        const isConditionMet = this.evaluateCondition(
          dependentValue,
          condition.conditionOperator,
          condition.conditionValue
        );

        switch (condition.conditionType) {
          case 'show_if':
            if (!isConditionMet) return false;
            break;
          case 'hide_if':
            if (isConditionMet) return false;
            break;
          case 'required_if':
            // 必須条件は表示には影響しない
            break;
          case 'validate_if':
            // 検証条件は表示には影響しない
            break;
        }
      }

      return true;
    });
  }

  /**
   * 質問が必須かどうかを動的に判定
   */
  public static isQuestionRequired(
    question: Question,
    answers: Record<string, any>
  ): boolean {
    // 基本の必須設定
    if (question.isRequired) {
      return true;
    }

    // 条件付き必須をチェック
    if (question.conditions) {
      for (const condition of question.conditions) {
        if (condition.conditionType === 'required_if') {
          const dependentValue = answers[condition.dependsOnQuestionCode];
          if (this.evaluateCondition(
            dependentValue,
            condition.conditionOperator,
            condition.conditionValue
          )) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * 条件を評価
   */
  private static evaluateCondition(
    actualValue: any,
    operator: string,
    expectedValue: any
  ): boolean {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'not_equals':
        return actualValue !== expectedValue;
      case 'contains':
        return String(actualValue).includes(String(expectedValue));
      case 'greater_than':
        return Number(actualValue) > Number(expectedValue);
      case 'less_than':
        return Number(actualValue) < Number(expectedValue);
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
      default:
        return false;
    }
  }

  /**
   * 質問セットの作成または更新
   */
  public static async upsertQuestionSet(
    questionSet: Partial<QuestionSet> & { questions?: Partial<Question>[] }
  ): Promise<string | null> {
    try {
      const { questions, ...setData } = questionSet;

      // 質問セットを作成/更新
      const { data: questionSetData, error: setError } = await supabaseService
        .from('question_sets')
        .upsert({
          ...setData,
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (setError || !questionSetData) {
        logger.error('Failed to upsert question set:', setError);
        return null;
      }

      // 質問を作成/更新
      if (questions && questions.length > 0) {
        for (const question of questions) {
          const { conditions, ...questionData } = question;

          const { data: questionRow, error: questionError } = await supabaseService
            .from('questions')
            .upsert({
              ...questionData,
              question_set_id: questionSetData.id,
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (questionError || !questionRow) {
            logger.error('Failed to upsert question:', questionError);
            continue;
          }

          // 条件を作成
          if (conditions && conditions.length > 0) {
            const conditionData = conditions.map(condition => ({
              ...condition,
              question_id: questionRow.id
            }));

            const { error: conditionError } = await supabaseService
              .from('question_conditions')
              .upsert(conditionData);

            if (conditionError) {
              logger.error('Failed to upsert conditions:', conditionError);
            }
          }
        }
      }

      return questionSetData.id;
    } catch (error) {
      logger.error('QuestionFlowManager.upsertQuestionSet error:', error);
      return null;
    }
  }

  /**
   * 質問への回答を検証
   */
  public static validateAnswers(
    questions: Question[],
    answers: Record<string, any>
  ): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    const visibleQuestions = this.evaluateQuestionVisibility(questions, answers);

    for (const question of visibleQuestions) {
      const value = answers[question.questionCode];
      const isRequired = this.isQuestionRequired(question, answers);

      // 必須チェック
      if (isRequired && (value === undefined || value === null || value === '')) {
        errors[question.questionCode] = '必須項目です';
        continue;
      }

      // 値がない場合はスキップ
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // バリデーションルールの適用
      if (question.validationRules) {
        const validationError = this.applyValidationRules(
          value,
          question.validationRules,
          question.questionType
        );
        if (validationError) {
          errors[question.questionCode] = validationError;
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * バリデーションルールを適用
   */
  private static applyValidationRules(
    value: any,
    rules: any,
    questionType: string
  ): string | null {
    switch (questionType) {
      case 'text':
        if (rules.minLength && value.length < rules.minLength) {
          return `${rules.minLength}文字以上入力してください`;
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          return `${rules.maxLength}文字以内で入力してください`;
        }
        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
          return rules.patternMessage || '入力形式が正しくありません';
        }
        break;

      case 'number':
        const numValue = Number(value);
        if (rules.min !== undefined && numValue < rules.min) {
          return `${rules.min}以上の値を入力してください`;
        }
        if (rules.max !== undefined && numValue > rules.max) {
          return `${rules.max}以下の値を入力してください`;
        }
        break;

      case 'date':
        const dateValue = new Date(value);
        if (rules.minDate && dateValue < new Date(rules.minDate)) {
          return `${rules.minDate}以降の日付を入力してください`;
        }
        if (rules.maxDate && dateValue > new Date(rules.maxDate)) {
          return `${rules.maxDate}以前の日付を入力してください`;
        }
        break;

      case 'file':
        if (rules.maxSize && value.size > rules.maxSize) {
          return `ファイルサイズは${rules.maxSize / 1024 / 1024}MB以下にしてください`;
        }
        if (rules.allowedTypes && !rules.allowedTypes.includes(value.type)) {
          return `許可されたファイル形式: ${rules.allowedTypes.join(', ')}`;
        }
        break;
    }

    return null;
  }
}