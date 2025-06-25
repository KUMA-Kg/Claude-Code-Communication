import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface QuestionnaireData {
  businessType?: string;
  employeeCount?: string;
  annualRevenue?: string;
  currentChallenges?: string;
  digitalizationLevel?: string;
  budgetRange?: string;
  industry?: string;
  location?: string;
  [key: string]: any;
}

interface MatchedSubsidy {
  subsidy_id: string;
  match_score: number;
  reasons: string[];
  confidence: number;
  estimated_approval_probability: number;
}

interface AIMatchingResult {
  id: string;
  user_id: string;
  questionnaire_data: QuestionnaireData;
  matched_subsidies: MatchedSubsidy[];
  analysis_summary: {
    total_matches: number;
    avg_match_score: number;
    recommended_subsidy_id: string;
    key_strengths: string[];
    improvement_suggestions: string[];
  };
  created_at: string;
}

interface UseAIMatchingReturn {
  results: AIMatchingResult | null;
  loading: boolean;
  error: string | null;
  runMatching: (questionnaireData: QuestionnaireData) => Promise<AIMatchingResult | null>;
  clearResults: () => void;
  getMatchingHistory: () => Promise<AIMatchingResult[]>;
}

export function useAIMatching(): UseAIMatchingReturn {
  const { user } = useAuth();
  const [results, setResults] = useState<AIMatchingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AIマッチング実行
  const runMatching = useCallback(async (questionnaireData: QuestionnaireData): Promise<AIMatchingResult | null> => {
    if (!user) {
      setError('ログインが必要です');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // バックエンドのAIマッチングAPIを呼び出し
      const response = await fetch('/api/ai-matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          questionnaire_data: questionnaireData
        })
      });

      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'マッチング処理でエラーが発生しました');
      }

      // Supabaseにも結果を保存（リアルタイム更新のため）
      const { data: savedResult, error: saveError } = await supabase
        .from('matching_results')
        .insert({
          user_id: user.id,
          questionnaire_data: questionnaireData,
          matched_subsidies: data.data.matched_subsidies,
          analysis_summary: data.data.analysis_summary
        })
        .select()
        .single();

      if (saveError) {
        console.error('結果保存エラー:', saveError);
        // 保存に失敗してもマッチング結果は返す
      }

      const result: AIMatchingResult = savedResult || data.data;
      setResults(result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
      console.error('AIマッチングエラー:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 結果をクリア
  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  // マッチング履歴を取得
  const getMatchingHistory = useCallback(async (): Promise<AIMatchingResult[]> => {
    if (!user) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('matching_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('履歴取得エラー:', err);
      return [];
    }
  }, [user]);

  return {
    results,
    loading,
    error,
    runMatching,
    clearResults,
    getMatchingHistory
  };
}

// 質問票データから基本的なマッチングスコアを計算するヘルパー関数
export function calculateBasicMatchScore(
  questionnaireData: QuestionnaireData,
  subsidyType: 'it-donyu' | 'monozukuri' | 'jizokuka'
): number {
  let score = 0;
  let totalWeight = 0;

  // 事業形態による適合度
  if (questionnaireData.businessType) {
    totalWeight += 20;
    switch (subsidyType) {
      case 'it-donyu':
        if (['service', 'it', 'retail'].includes(questionnaireData.businessType)) {
          score += 20;
        } else if (questionnaireData.businessType === 'manufacturing') {
          score += 15;
        } else {
          score += 10;
        }
        break;
      case 'monozukuri':
        if (questionnaireData.businessType === 'manufacturing') {
          score += 20;
        } else if (['it', 'service'].includes(questionnaireData.businessType)) {
          score += 12;
        } else {
          score += 8;
        }
        break;
      case 'jizokuka':
        if (['retail', 'service'].includes(questionnaireData.businessType)) {
          score += 20;
        } else {
          score += 15;
        }
        break;
    }
  }

  // 従業員数による適合度
  if (questionnaireData.employeeCount) {
    totalWeight += 15;
    const employeeRange = questionnaireData.employeeCount;
    switch (subsidyType) {
      case 'it-donyu':
        if (['1-5', '6-20', '21-50'].includes(employeeRange)) {
          score += 15;
        } else {
          score += 10;
        }
        break;
      case 'monozukuri':
        if (['6-20', '21-50', '51-100'].includes(employeeRange)) {
          score += 15;
        } else {
          score += 10;
        }
        break;
      case 'jizokuka':
        if (['1-5', '6-20'].includes(employeeRange)) {
          score += 15;
        } else {
          score += 8;
        }
        break;
    }
  }

  // 課題による適合度
  if (questionnaireData.currentChallenges) {
    totalWeight += 25;
    switch (subsidyType) {
      case 'it-donyu':
        if (questionnaireData.currentChallenges === 'efficiency') {
          score += 25;
        } else if (['cost', 'hr'].includes(questionnaireData.currentChallenges)) {
          score += 18;
        } else {
          score += 12;
        }
        break;
      case 'monozukuri':
        if (questionnaireData.currentChallenges === 'innovation') {
          score += 25;
        } else if (['efficiency', 'sales'].includes(questionnaireData.currentChallenges)) {
          score += 18;
        } else {
          score += 10;
        }
        break;
      case 'jizokuka':
        if (questionnaireData.currentChallenges === 'sales') {
          score += 25;
        } else if (['efficiency', 'cost'].includes(questionnaireData.currentChallenges)) {
          score += 15;
        } else {
          score += 10;
        }
        break;
    }
  }

  // デジタル化レベルによる適合度
  if (questionnaireData.digitalizationLevel) {
    totalWeight += 20;
    switch (subsidyType) {
      case 'it-donyu':
        if (['none', 'basic'].includes(questionnaireData.digitalizationLevel)) {
          score += 20;
        } else if (questionnaireData.digitalizationLevel === 'partial') {
          score += 15;
        } else {
          score += 8;
        }
        break;
      case 'monozukuri':
        if (['partial', 'advanced'].includes(questionnaireData.digitalizationLevel)) {
          score += 20;
        } else {
          score += 12;
        }
        break;
      case 'jizokuka':
        score += 15; // デジタル化レベルに関係なく適用可能
        break;
    }
  }

  // 予算による適合度
  if (questionnaireData.budgetRange) {
    totalWeight += 20;
    switch (subsidyType) {
      case 'it-donyu':
        if (['500k-1m', '1m-3m'].includes(questionnaireData.budgetRange)) {
          score += 20;
        } else if (questionnaireData.budgetRange === 'under-500k') {
          score += 15;
        } else {
          score += 12;
        }
        break;
      case 'monozukuri':
        if (['3m-5m', 'over-5m'].includes(questionnaireData.budgetRange)) {
          score += 20;
        } else if (questionnaireData.budgetRange === '1m-3m') {
          score += 15;
        } else {
          score += 8;
        }
        break;
      case 'jizokuka':
        if (['under-500k', '500k-1m'].includes(questionnaireData.budgetRange)) {
          score += 20;
        } else {
          score += 12;
        }
        break;
    }
  }

  // 最終スコアを100点満点で計算
  return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
}

// マッチング理由を生成するヘルパー関数
export function generateMatchingReasons(
  questionnaireData: QuestionnaireData,
  subsidyType: 'it-donyu' | 'monozukuri' | 'jizokuka',
  score: number
): string[] {
  const reasons: string[] = [];

  // 基本的な適合理由
  if (questionnaireData.businessType) {
    const businessTypeMap: Record<string, string> = {
      'manufacturing': '製造業',
      'retail': '小売業',
      'service': 'サービス業',
      'it': 'IT関連',
      'other': 'その他'
    };
    
    const businessTypeName = businessTypeMap[questionnaireData.businessType] || questionnaireData.businessType;
    
    if (subsidyType === 'it-donyu' && ['service', 'it', 'retail'].includes(questionnaireData.businessType)) {
      reasons.push(`${businessTypeName}での業務効率化に最適な補助金です`);
    } else if (subsidyType === 'monozukuri' && questionnaireData.businessType === 'manufacturing') {
      reasons.push(`${businessTypeName}の革新的な取り組みを支援します`);
    } else if (subsidyType === 'jizokuka') {
      reasons.push(`${businessTypeName}の販路開拓・持続的成長を支援します`);
    }
  }

  // 課題による理由
  if (questionnaireData.currentChallenges) {
    const challengeMap: Record<string, string> = {
      'efficiency': '業務効率化',
      'sales': '売上拡大',
      'cost': 'コスト削減',
      'innovation': '新商品・サービス開発',
      'hr': '人材育成・確保'
    };
    
    const challengeName = challengeMap[questionnaireData.currentChallenges] || questionnaireData.currentChallenges;
    
    if (subsidyType === 'it-donyu' && questionnaireData.currentChallenges === 'efficiency') {
      reasons.push(`${challengeName}の課題解決に直結する補助金です`);
    } else if (subsidyType === 'monozukuri' && questionnaireData.currentChallenges === 'innovation') {
      reasons.push(`${challengeName}の実現を強力にサポートします`);
    } else if (subsidyType === 'jizokuka' && questionnaireData.currentChallenges === 'sales') {
      reasons.push(`${challengeName}のための具体的な取り組みを支援します`);
    }
  }

  // 規模による理由
  if (questionnaireData.employeeCount) {
    const sizeMap: Record<string, string> = {
      '1-5': '小規模',
      '6-20': '中小規模',
      '21-50': '中規模',
      '51-100': '中規模以上',
      '101-300': '大規模'
    };
    
    const sizeName = sizeMap[questionnaireData.employeeCount] || questionnaireData.employeeCount;
    
    if (subsidyType === 'jizokuka' && ['1-5', '6-20'].includes(questionnaireData.employeeCount)) {
      reasons.push(`${sizeName}事業者向けの支援制度として最適です`);
    } else if (subsidyType === 'it-donyu' && ['1-5', '6-20', '21-50'].includes(questionnaireData.employeeCount)) {
      reasons.push(`${sizeName}企業のDX推進に適した補助金です`);
    }
  }

  // スコアによる追加理由
  if (score >= 80) {
    reasons.push('すべての要件を満たしており、採択可能性が高いです');
  } else if (score >= 60) {
    reasons.push('主要な要件を満たしており、申請を検討することをお勧めします');
  }

  return reasons.length > 0 ? reasons : ['基本的な要件を満たしています'];
}