import { QuestionnaireData } from '../types/questionnaire';

export const calculateMatchScore = (answers: QuestionnaireData, subsidyId: string): number => {
  let score = 0;
  let maxScore = 0;

  // IT導入補助金のスコア計算
  if (subsidyId === 'it-donyu') {
    // デジタル化レベル
    maxScore += 30;
    if (answers.digitalizationLevel === 'none') score += 30;
    else if (answers.digitalizationLevel === 'basic') score += 25;
    else if (answers.digitalizationLevel === 'partial') score += 15;
    else if (answers.digitalizationLevel === 'advanced') score += 5;

    // 経営課題
    maxScore += 25;
    if (answers.currentChallenges === 'efficiency') score += 25;
    else if (answers.currentChallenges === 'cost') score += 20;
    else if (answers.currentChallenges === 'sales') score += 15;
    else if (answers.currentChallenges === 'innovation') score += 10;
    else if (answers.currentChallenges === 'hr') score += 10;

    // 予算範囲
    maxScore += 20;
    if (answers.budgetRange === '500k-1m') score += 20;
    else if (answers.budgetRange === '1m-3m') score += 20;
    else if (answers.budgetRange === '3m-5m') score += 15;
    else if (answers.budgetRange === 'under-500k') score += 10;
    else if (answers.budgetRange === 'over-5m') score += 10;

    // 従業員数
    maxScore += 15;
    if (answers.employeeCount === '6-20') score += 15;
    else if (answers.employeeCount === '21-50') score += 15;
    else if (answers.employeeCount === '51-100') score += 10;
    else if (answers.employeeCount === '1-5') score += 10;
    else if (answers.employeeCount === '101-300') score += 5;

    // 業種
    maxScore += 10;
    if (answers.businessType === 'service') score += 10;
    else if (answers.businessType === 'retail') score += 8;
    else if (answers.businessType === 'manufacturing') score += 6;
    else if (answers.businessType === 'it') score += 5;
    else score += 4;
  }

  // ものづくり補助金のスコア計算
  else if (subsidyId === 'monozukuri') {
    // 業種
    maxScore += 30;
    if (answers.businessType === 'manufacturing') score += 30;
    else if (answers.businessType === 'it') score += 20;
    else if (answers.businessType === 'service') score += 15;
    else score += 5;

    // 経営課題
    maxScore += 25;
    if (answers.currentChallenges === 'innovation') score += 25;
    else if (answers.currentChallenges === 'efficiency') score += 20;
    else if (answers.currentChallenges === 'sales') score += 15;
    else score += 10;

    // 予算範囲
    maxScore += 20;
    if (answers.budgetRange === 'over-5m') score += 20;
    else if (answers.budgetRange === '3m-5m') score += 18;
    else if (answers.budgetRange === '1m-3m') score += 15;
    else if (answers.budgetRange === '500k-1m') score += 10;
    else score += 5;

    // 売上高
    maxScore += 15;
    if (answers.annualRevenue === '100m-500m') score += 15;
    else if (answers.annualRevenue === 'over-500m') score += 15;
    else if (answers.annualRevenue === '50m-100m') score += 12;
    else if (answers.annualRevenue === '10m-50m') score += 8;
    else score += 5;

    // 従業員数
    maxScore += 10;
    if (answers.employeeCount === '21-50') score += 10;
    else if (answers.employeeCount === '51-100') score += 10;
    else if (answers.employeeCount === '101-300') score += 8;
    else if (answers.employeeCount === '6-20') score += 6;
    else score += 4;
  }

  // 小規模事業者持続化補助金のスコア計算
  else if (subsidyId === 'jizokuka') {
    // 従業員数（小規模が有利）
    maxScore += 35;
    if (answers.employeeCount === '1-5') score += 35;
    else if (answers.employeeCount === '6-20') score += 25;
    else if (answers.employeeCount === '21-50') score += 10;
    else score += 0;

    // 経営課題
    maxScore += 25;
    if (answers.currentChallenges === 'sales') score += 25;
    else if (answers.currentChallenges === 'efficiency') score += 20;
    else if (answers.currentChallenges === 'cost') score += 15;
    else score += 10;

    // 予算範囲（小規模向け）
    maxScore += 20;
    if (answers.budgetRange === 'under-500k') score += 20;
    else if (answers.budgetRange === '500k-1m') score += 18;
    else if (answers.budgetRange === '1m-3m') score += 10;
    else score += 5;

    // 業種
    maxScore += 10;
    if (answers.businessType === 'retail') score += 10;
    else if (answers.businessType === 'service') score += 8;
    else if (answers.businessType === 'manufacturing') score += 6;
    else score += 5;

    // 売上高（小規模が有利）
    maxScore += 10;
    if (answers.annualRevenue === 'under-10m') score += 10;
    else if (answers.annualRevenue === '10m-50m') score += 8;
    else if (answers.annualRevenue === '50m-100m') score += 5;
    else score += 2;
  }

  // パーセンテージに変換（0-100）
  return Math.round((score / maxScore) * 100);
};