import { supabase } from '../config/supabase';
import { Company, Subsidy } from '../types';

interface QuantumState {
  superposition: number[];
  entanglement: Map<string, number>;
  probability: number;
}

export class QuantumMatchingEngine {
  private readonly dimensions = ['industry', 'scale', 'need', 'technology', 'timeline'];
  
  /**
   * 量子風確率的マッチングアルゴリズム
   * 複数の次元で同時に最適解を探索
   */
  async performQuantumMatching(company: Company): Promise<{
    matches: Array<{
      subsidy: Subsidy;
      probability: number;
      quantumScore: number;
      collapseReason: string;
    }>;
    quantumInsights: string[];
  }> {
    // 企業の量子状態を生成
    const companyQuantumState = this.createQuantumState(company);
    
    // 全補助金を量子空間にマッピング
    const { data: subsidies } = await supabase
      .from('subsidies')
      .select('*')
      .eq('status', 'active');
    
    const quantumMatches = [];
    const insights = new Set<string>();
    
    for (const subsidy of subsidies || []) {
      // 補助金の量子状態を生成
      const subsidyQuantumState = this.createSubsidyQuantumState(subsidy);
      
      // 量子もつれ計算（相関関係の発見）
      const entanglement = this.calculateEntanglement(
        companyQuantumState,
        subsidyQuantumState
      );
      
      // 波動関数の崩壊（最終スコアの決定）
      const collapseResult = this.collapseWaveFunction(entanglement);
      
      if (collapseResult.probability > 0.5) {
        quantumMatches.push({
          subsidy,
          probability: collapseResult.probability,
          quantumScore: collapseResult.quantumScore,
          collapseReason: collapseResult.reason
        });
        
        // 量子的洞察の抽出
        if (collapseResult.insight) {
          insights.add(collapseResult.insight);
        }
      }
    }
    
    // 量子スコアでソート
    quantumMatches.sort((a, b) => b.quantumScore - a.quantumScore);
    
    return {
      matches: quantumMatches.slice(0, 10),
      quantumInsights: Array.from(insights)
    };
  }
  
  /**
   * 企業の多次元量子状態を生成
   */
  private createQuantumState(company: Company): QuantumState {
    const superposition = this.dimensions.map(dimension => {
      // 各次元での確率振幅を計算
      switch (dimension) {
        case 'industry':
          return this.getIndustryAmplitude(company.industry);
        case 'scale':
          return this.getScaleAmplitude(company.employeeCount);
        case 'need':
          return this.getNeedAmplitude(company.businessNeeds);
        case 'technology':
          return this.getTechnologyAmplitude(company.techStack);
        case 'timeline':
          return this.getTimelineAmplitude(company.projectTimeline);
        default:
          return 0.5;
      }
    });
    
    return {
      superposition,
      entanglement: new Map(),
      probability: this.calculateProbability(superposition)
    };
  }
  
  /**
   * 補助金の量子状態を生成
   */
  private createSubsidyQuantumState(subsidy: Subsidy): QuantumState {
    // 補助金の特性を量子状態に変換
    const superposition = [
      subsidy.industryRelevance || 0.5,
      subsidy.scaleRequirement || 0.5,
      subsidy.needAlignment || 0.5,
      subsidy.techRequirement || 0.5,
      subsidy.urgency || 0.5
    ];
    
    return {
      superposition,
      entanglement: new Map(),
      probability: this.calculateProbability(superposition)
    };
  }
  
  /**
   * 量子もつれの計算（非局所的相関）
   */
  private calculateEntanglement(
    state1: QuantumState,
    state2: QuantumState
  ): QuantumState {
    const entangledState: QuantumState = {
      superposition: [],
      entanglement: new Map(),
      probability: 0
    };
    
    // ベル状態の生成
    for (let i = 0; i < state1.superposition.length; i++) {
      const amplitude1 = state1.superposition[i];
      const amplitude2 = state2.superposition[i];
      
      // 量子干渉パターン
      const interference = Math.cos(amplitude1 * Math.PI) * Math.cos(amplitude2 * Math.PI);
      const entangledAmplitude = (amplitude1 + amplitude2) / 2 + interference * 0.2;
      
      entangledState.superposition.push(entangledAmplitude);
      entangledState.entanglement.set(
        this.dimensions[i],
        Math.abs(interference)
      );
    }
    
    entangledState.probability = this.calculateProbability(entangledState.superposition);
    
    return entangledState;
  }
  
  /**
   * 波動関数の崩壊（観測による確定）
   */
  private collapseWaveFunction(entangledState: QuantumState): {
    probability: number;
    quantumScore: number;
    reason: string;
    insight?: string;
  } {
    // 最も強いもつれを持つ次元を特定
    let maxEntanglement = 0;
    let dominantDimension = '';
    
    entangledState.entanglement.forEach((value, key) => {
      if (value > maxEntanglement) {
        maxEntanglement = value;
        dominantDimension = key;
      }
    });
    
    // 量子スコアの計算（0-1の範囲）
    const quantumScore = entangledState.probability * (1 + maxEntanglement);
    
    // 崩壊理由の生成
    const reason = this.generateCollapseReason(dominantDimension, maxEntanglement);
    
    // 閾値を超えた場合、洞察を生成
    const insight = maxEntanglement > 0.8
      ? `異常に強い${dominantDimension}の相関を検出。隠れた成功要因の可能性`
      : undefined;
    
    return {
      probability: entangledState.probability,
      quantumScore: Math.min(quantumScore, 1),
      reason,
      insight
    };
  }
  
  // ヘルパーメソッド群
  private getIndustryAmplitude(industry: string): number {
    const industryScores: Record<string, number> = {
      'IT': 0.9,
      '製造業': 0.8,
      'サービス業': 0.7,
      '小売業': 0.6,
      'その他': 0.5
    };
    return industryScores[industry] || 0.5;
  }
  
  private getScaleAmplitude(employeeCount: number): number {
    if (employeeCount < 20) return 0.9;
    if (employeeCount < 50) return 0.8;
    if (employeeCount < 100) return 0.7;
    if (employeeCount < 300) return 0.6;
    return 0.5;
  }
  
  private getNeedAmplitude(needs: string[]): number {
    const priorityNeeds = ['DX推進', '業務効率化', '新規事業', 'AI活用'];
    const matchCount = needs.filter(need => 
      priorityNeeds.some(priority => need.includes(priority))
    ).length;
    return Math.min(0.5 + matchCount * 0.15, 1);
  }
  
  private getTechnologyAmplitude(techStack: string[]): number {
    const modernTech = ['AI', 'IoT', 'ブロックチェーン', 'クラウド', 'ビッグデータ'];
    const matchCount = techStack.filter(tech =>
      modernTech.some(modern => tech.includes(modern))
    ).length;
    return Math.min(0.5 + matchCount * 0.1, 1);
  }
  
  private getTimelineAmplitude(timeline: string): number {
    const timelineScores: Record<string, number> = {
      '緊急': 0.9,
      '3ヶ月以内': 0.8,
      '6ヶ月以内': 0.7,
      '1年以内': 0.6,
      '未定': 0.5
    };
    return timelineScores[timeline] || 0.5;
  }
  
  private calculateProbability(superposition: number[]): number {
    // 波動関数の二乗（ボルンの規則）
    const sumOfSquares = superposition.reduce((sum, amp) => sum + amp * amp, 0);
    return Math.sqrt(sumOfSquares / superposition.length);
  }
  
  private generateCollapseReason(dimension: string, entanglement: number): string {
    const dimensionNames: Record<string, string> = {
      'industry': '業界適合性',
      'scale': '企業規模',
      'need': 'ニーズ適合性',
      'technology': '技術要件',
      'timeline': 'タイムライン'
    };
    
    const strength = entanglement > 0.8 ? '非常に強い' : 
                    entanglement > 0.6 ? '強い' : 
                    entanglement > 0.4 ? '中程度の' : '弱い';
    
    return `${dimensionNames[dimension] || dimension}において${strength}量子もつれを観測`;
  }
}