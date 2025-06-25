import { useState, useEffect, useMemo, useCallback } from 'react';
import { MatchingCandidate, QuantumState, EntanglementPair } from '../types/quantum';

export const useQuantumMatching = (
  candidates: MatchingCandidate[],
  userProfile: any
) => {
  const [quantumStates, setQuantumStates] = useState<QuantumState[]>([]);
  const [superposition, setSuperposition] = useState<number>(1);
  const [entanglement, setEntanglement] = useState<[string, string][]>([]);
  const [collapsedStates, setCollapsedStates] = useState<Set<string>>(new Set());

  // 量子状態の初期化
  useEffect(() => {
    const states: QuantumState[] = candidates.map((candidate, index) => {
      const angle = (index / candidates.length) * Math.PI * 2;
      const radius = 5;
      
      return {
        candidateId: candidate.id,
        candidate,
        amplitude: Math.random() * 0.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
        spin: Math.random() > 0.5 ? 1 : -1,
        position: [
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 3,
          Math.sin(angle) * radius
        ],
        entangled: false,
        collapsed: false
      };
    });
    
    setQuantumStates(states);
    
    // エンタングルメントの生成
    const pairs: [string, string][] = [];
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        // 類似度に基づいてエンタングル
        const similarity = calculateSimilarity(candidates[i], candidates[j]);
        if (similarity > 0.7) {
          pairs.push([candidates[i].id, candidates[j].id]);
        }
      }
    }
    setEntanglement(pairs);
  }, [candidates]);

  // 波動関数の崩壊
  const collapse = useCallback((candidateId: string) => {
    setCollapsedStates(prev => new Set([...prev, candidateId]));
    
    setQuantumStates(prev => prev.map(state => {
      if (state.candidateId === candidateId) {
        return { ...state, collapsed: true, amplitude: 1 };
      }
      
      // エンタングルメントによる影響
      const isEntangled = entanglement.some(
        ([a, b]) => (a === candidateId && b === state.candidateId) ||
                   (b === candidateId && a === state.candidateId)
      );
      
      if (isEntangled) {
        return { 
          ...state, 
          amplitude: state.amplitude * 0.8,
          phase: state.phase + Math.PI / 4
        };
      }
      
      return state;
    }));
    
    // 重ね合わせの減少
    setSuperposition(prev => Math.max(0.3, prev * 0.8));
  }, [entanglement]);

  // マッチング確率の計算
  const matchingProbabilities = useMemo(() => {
    const probs: Record<string, number> = {};
    
    quantumStates.forEach(state => {
      if (state.collapsed) {
        probs[state.candidateId] = 1;
      } else {
        // 量子確率振幅から古典確率へ
        const baseProbability = Math.pow(state.amplitude, 2);
        
        // ユーザープロファイルとの適合度
        const compatibility = calculateCompatibility(state.candidate, userProfile);
        
        // 位相による補正
        const phaseCorrection = Math.cos(state.phase) * 0.1 + 1;
        
        probs[state.candidateId] = baseProbability * compatibility * phaseCorrection;
      }
    });
    
    // 正規化
    const total = Object.values(probs).reduce((sum, p) => sum + p, 0);
    Object.keys(probs).forEach(key => {
      probs[key] /= total;
    });
    
    return probs;
  }, [quantumStates, userProfile]);

  return {
    quantumStates,
    superposition,
    collapse,
    entanglement,
    matchingProbabilities
  };
};

// 補助関数
function calculateSimilarity(c1: MatchingCandidate, c2: MatchingCandidate): number {
  // 属性の類似度を計算
  const attrs1 = Object.values(c1.attributes);
  const attrs2 = Object.values(c2.attributes);
  
  let similarity = 0;
  const minLength = Math.min(attrs1.length, attrs2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (attrs1[i] === attrs2[i]) similarity += 1;
  }
  
  return similarity / minLength;
}

function calculateCompatibility(candidate: MatchingCandidate, profile: any): number {
  // プロファイルとの適合度を計算
  let score = candidate.score;
  
  // プロファイルの各属性と候補の属性を比較
  if (profile.preferences) {
    Object.entries(profile.preferences).forEach(([key, value]) => {
      if (candidate.attributes[key] === value) {
        score *= 1.2;
      }
    });
  }
  
  return Math.min(1, score / 100);
}