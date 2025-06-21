import { supabase } from '@/config/supabase';
import { SubsidyMatchResult } from '@/models/DiagnosisSession';
import { logger } from '@/utils/logger';

interface MatchingCriteria {
  company_info: any;
  diagnosis_data: any;
  answers: Array<{ question_key: string; answer: any }>;
}

interface SubsidyWithRules {
  id: string;
  name: string;
  eligibility_rules: Array<{
    rule_type: string;
    field_name: string;
    operator: string;
    value: any;
    weight: number;
  }>;
}

export async function matchSubsidies(
  criteria: MatchingCriteria
): Promise<SubsidyMatchResult[]> {
  try {
    // 補助金と適格性ルールを取得
    const { data: subsidies, error } = await supabase
      .from('subsidies')
      .select(`
        id,
        name,
        eligibility_rules (
          rule_type,
          field_name,
          operator,
          value,
          weight
        )
      `)
      .eq('status', 'active');

    if (error) {
      logger.error('Failed to fetch subsidies:', error);
      return [];
    }

    // 各補助金に対してマッチングスコアを計算
    const matchResults: SubsidyMatchResult[] = [];

    for (const subsidy of subsidies as SubsidyWithRules[]) {
      const matchResult = calculateMatchScore(subsidy, criteria);
      matchResults.push(matchResult);
    }

    // スコアの高い順にソート
    matchResults.sort((a, b) => b.match_score - a.match_score);

    return matchResults;
  } catch (error) {
    logger.error('Error in subsidy matching:', error);
    return [];
  }
}

function calculateMatchScore(
  subsidy: SubsidyWithRules,
  criteria: MatchingCriteria
): SubsidyMatchResult {
  const evaluationResults: Array<{
    rule: any;
    passed: boolean;
    reason: string;
  }> = [];

  let totalWeight = 0;
  let passedWeight = 0;

  // 回答データをマップに変換
  const answersMap = criteria.answers.reduce((acc, ans) => {
    acc[ans.question_key] = ans.answer;
    return acc;
  }, {} as Record<string, any>);

  // 全データを統合
  const allData = {
    ...criteria.company_info,
    ...criteria.diagnosis_data?.answers,
    ...answersMap,
  };

  // 各ルールを評価
  for (const rule of subsidy.eligibility_rules) {
    const evaluation = evaluateRule(rule, allData);
    evaluationResults.push({
      rule,
      passed: evaluation.passed,
      reason: evaluation.reason,
    });

    totalWeight += rule.weight || 1;
    if (evaluation.passed) {
      passedWeight += rule.weight || 1;
    }
  }

  // マッチングスコアを計算（0-100）
  const matchScore = totalWeight > 0 ? (passedWeight / totalWeight) * 100 : 0;

  // 適格性ステータスを判定
  let eligibilityStatus: 'eligible' | 'potentially_eligible' | 'not_eligible';
  if (matchScore >= 80) {
    eligibilityStatus = 'eligible';
  } else if (matchScore >= 50) {
    eligibilityStatus = 'potentially_eligible';
  } else {
    eligibilityStatus = 'not_eligible';
  }

  // 理由と不足要件を生成
  const reasons = evaluationResults
    .filter(r => r.passed)
    .map(r => r.reason);

  const missingRequirements = evaluationResults
    .filter(r => !r.passed)
    .map(r => r.reason);

  // 次のステップを生成
  const nextSteps = generateNextSteps(eligibilityStatus, missingRequirements);

  return {
    subsidy_id: subsidy.id,
    subsidy_name: subsidy.name,
    match_score: Math.round(matchScore),
    eligibility_status: eligibilityStatus,
    reasons,
    missing_requirements: missingRequirements,
    next_steps: nextSteps,
  };
}

function evaluateRule(
  rule: any,
  data: Record<string, any>
): { passed: boolean; reason: string } {
  const fieldValue = data[rule.field_name];

  if (fieldValue === undefined || fieldValue === null) {
    return {
      passed: false,
      reason: `${rule.field_name}の情報が不足しています`,
    };
  }

  let passed = false;
  let reason = '';

  switch (rule.operator) {
    case 'equals':
      passed = fieldValue === rule.value;
      reason = passed
        ? `${rule.field_name}が条件を満たしています`
        : `${rule.field_name}が${rule.value}である必要があります`;
      break;

    case 'not_equals':
      passed = fieldValue !== rule.value;
      reason = passed
        ? `${rule.field_name}が条件を満たしています`
        : `${rule.field_name}が${rule.value}でない必要があります`;
      break;

    case 'greater_than':
      passed = Number(fieldValue) > Number(rule.value);
      reason = passed
        ? `${rule.field_name}が${rule.value}を超えています`
        : `${rule.field_name}が${rule.value}を超える必要があります`;
      break;

    case 'less_than':
      passed = Number(fieldValue) < Number(rule.value);
      reason = passed
        ? `${rule.field_name}が${rule.value}未満です`
        : `${rule.field_name}が${rule.value}未満である必要があります`;
      break;

    case 'greater_than_or_equal':
      passed = Number(fieldValue) >= Number(rule.value);
      reason = passed
        ? `${rule.field_name}が${rule.value}以上です`
        : `${rule.field_name}が${rule.value}以上である必要があります`;
      break;

    case 'less_than_or_equal':
      passed = Number(fieldValue) <= Number(rule.value);
      reason = passed
        ? `${rule.field_name}が${rule.value}以下です`
        : `${rule.field_name}が${rule.value}以下である必要があります`;
      break;

    case 'contains':
      passed = String(fieldValue).includes(String(rule.value));
      reason = passed
        ? `${rule.field_name}に必要な要素が含まれています`
        : `${rule.field_name}に${rule.value}を含む必要があります`;
      break;

    case 'in':
      const values = Array.isArray(rule.value) ? rule.value : [rule.value];
      passed = values.includes(fieldValue);
      reason = passed
        ? `${rule.field_name}が適切な値です`
        : `${rule.field_name}が指定された値のいずれかである必要があります`;
      break;

    case 'between':
      const [min, max] = rule.value;
      const numValue = Number(fieldValue);
      passed = numValue >= min && numValue <= max;
      reason = passed
        ? `${rule.field_name}が範囲内です`
        : `${rule.field_name}が${min}から${max}の間である必要があります`;
      break;

    default:
      passed = false;
      reason = `不明な評価条件: ${rule.operator}`;
  }

  return { passed, reason };
}

function generateNextSteps(
  status: string,
  missingRequirements: string[]
): string[] {
  const steps: string[] = [];

  switch (status) {
    case 'eligible':
      steps.push('申請書類の準備を開始してください');
      steps.push('必要書類リストを確認してください');
      steps.push('申請期限を確認してください');
      break;

    case 'potentially_eligible':
      steps.push('不足している要件を確認してください');
      if (missingRequirements.length > 0) {
        steps.push(`以下の条件を満たす必要があります: ${missingRequirements.slice(0, 3).join(', ')}`);
      }
      steps.push('詳細な診断を受けることをお勧めします');
      break;

    case 'not_eligible':
      steps.push('他の補助金制度を検討してください');
      steps.push('要件を満たすための改善計画を立ててください');
      steps.push('専門家に相談することをお勧めします');
      break;
  }

  return steps;
}