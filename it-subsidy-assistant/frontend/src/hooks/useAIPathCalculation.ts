import { useState, useEffect, useMemo } from 'react';
import { CompanyProfile, SubsidyData, PathNode } from '../types/navigator';

// 補助金マッチングスコア計算
const calculateMatchScore = (
  company: CompanyProfile,
  subsidy: SubsidyData
): number => {
  let score = 0;
  
  // 業界マッチング
  if (subsidy.requirements.includes(company.industry)) {
    score += 30;
  }
  
  // 予算範囲チェック
  if (company.investmentBudget <= subsidy.maxAmount) {
    score += 20;
  }
  
  // 企業規模による適合性
  if (company.companySize < 20 && subsidy.id === 'jizokuka') {
    score += 25; // 小規模事業者向け
  } else if (company.companySize > 50 && subsidy.id === 'monozukuri') {
    score += 20; // 中規模以上向け
  }
  
  // デジタル化レベル
  if (subsidy.id === 'it-donyu') {
    switch (company.digitalizationLevel) {
      case 'none':
        score += 30; // 最も支援が必要
        break;
      case 'basic':
        score += 25;
        break;
      case 'intermediate':
        score += 15;
        break;
      case 'advanced':
        score += 5;
        break;
    }
  }
  
  // 課題マッチング
  company.currentChallenges.forEach(challenge => {
    if (subsidy.requirements.includes(challenge)) {
      score += 15;
    }
  });
  
  // 過去の補助金利用歴
  if (company.previousSubsidies?.includes(subsidy.id)) {
    score -= 10; // 同じ補助金の再利用は減点
  }
  
  return Math.min(100, Math.max(0, score));
};

// ダイクストラ法を使用した最適パス計算
const calculateOptimalPath = (
  company: CompanyProfile,
  subsidies: SubsidyData[]
): string[] => {
  // 各補助金のスコアを計算
  const scores = subsidies.map(subsidy => ({
    id: subsidy.id,
    score: calculateMatchScore(company, subsidy),
    subsidy,
  }));
  
  // スコアでソート
  scores.sort((a, b) => b.score - a.score);
  
  // 上位3つの補助金を経路として返す
  const path = scores.slice(0, 3).map(item => item.id);
  
  // 最も適合度の高い補助金を最後に配置（ゴール）
  if (path.length > 1) {
    const [first, ...rest] = path;
    return [...rest, first];
  }
  
  return path;
};

export const useAIPathCalculation = (companyProfile: CompanyProfile) => {
  const [calculatedPath, setCalculatedPath] = useState<string[] | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [confidence, setConfidence] = useState(0);
  
  // 補助金データ（実際にはAPIから取得）
  const subsidies: SubsidyData[] = useMemo(() => [
    {
      id: 'it-donyu',
      name: 'IT導入補助金2025',
      description: 'ITツール導入による業務効率化',
      position: [0, 0, 0],
      color: '#3b82f6',
      maxAmount: 4500000,
      subsidyRate: 0.75,
      requirements: ['it_investment', 'efficiency'],
    },
    {
      id: 'monozukuri',
      name: 'ものづくり補助金',
      description: '革新的な製品・サービス開発',
      position: [5, 2, -3],
      color: '#10b981',
      maxAmount: 12500000,
      subsidyRate: 0.67,
      requirements: ['innovation', 'manufacturing'],
    },
    {
      id: 'jizokuka',
      name: '小規模事業者持続化補助金',
      description: '販路開拓・業務効率化',
      position: [-5, -1, -2],
      color: '#f59e0b',
      maxAmount: 2000000,
      subsidyRate: 0.75,
      requirements: ['small_business', 'sales_expansion'],
    },
    {
      id: 'jigyosaikochiku',
      name: '事業再構築補助金',
      description: '新分野展開・事業転換',
      position: [3, -3, 2],
      color: '#ef4444',
      maxAmount: 150000000,
      subsidyRate: 0.67,
      requirements: ['restructuring', 'new_business'],
    },
    {
      id: 'shoene',
      name: '省エネ補助金',
      description: '省エネ設備の導入支援',
      position: [-3, 3, 1],
      color: '#8b5cf6',
      maxAmount: 10000000,
      subsidyRate: 0.5,
      requirements: ['energy_saving', 'equipment'],
    },
  ], []);
  
  useEffect(() => {
    const calculatePath = async () => {
      setIsCalculating(true);
      
      // AIによる計算をシミュレート（実際にはAPIを呼び出す）
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const path = calculateOptimalPath(companyProfile, subsidies);
      setCalculatedPath(path);
      
      // 信頼度の計算
      const avgScore = path.reduce((sum, id) => {
        const subsidy = subsidies.find(s => s.id === id);
        return sum + (subsidy ? calculateMatchScore(companyProfile, subsidy) : 0);
      }, 0) / path.length;
      
      setConfidence(avgScore / 100);
      setIsCalculating(false);
    };
    
    calculatePath();
  }, [companyProfile, subsidies]);
  
  return {
    calculatedPath,
    isCalculating,
    confidence,
    recalculate: () => {
      const path = calculateOptimalPath(companyProfile, subsidies);
      setCalculatedPath(path);
    },
  };
};