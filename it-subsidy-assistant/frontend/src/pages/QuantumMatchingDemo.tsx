import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { QuantumMatchingEngine } from '../components/quantum-matching/QuantumMatchingEngine';
import { WebGPURenderer } from '../components/quantum-matching/WebGPURenderer';
import { TouchControls } from '../components/quantum-matching/TouchControls';
import { MatchingCandidate } from '../types/quantum';
import { motion } from 'framer-motion';

// サンプル補助金データ
const sampleCandidates: MatchingCandidate[] = [
  {
    id: 'it-1',
    name: 'IT導入補助金',
    description: 'ITツール導入による生産性向上を支援',
    score: 95,
    attributes: {
      category: 'IT',
      maxAmount: 4500000,
      difficulty: 'medium',
      duration: '6months',
      industry: 'all'
    }
  },
  {
    id: 'mono-1',
    name: 'ものづくり補助金',
    description: '革新的サービス開発・試作品開発・生産プロセス改善',
    score: 88,
    attributes: {
      category: 'manufacturing',
      maxAmount: 30000000,
      difficulty: 'high',
      duration: '12months',
      industry: 'manufacturing'
    }
  },
  {
    id: 'jigyou-1',
    name: '事業再構築補助金',
    description: '新分野展開や業態転換、事業・業種転換等を支援',
    score: 92,
    attributes: {
      category: 'restructuring',
      maxAmount: 150000000,
      difficulty: 'very-high',
      duration: '18months',
      industry: 'all'
    }
  },
  {
    id: 'shoukibo-1',
    name: '小規模事業者持続化補助金',
    description: '小規模事業者の販路開拓等を支援',
    score: 85,
    attributes: {
      category: 'small-business',
      maxAmount: 2000000,
      difficulty: 'low',
      duration: '3months',
      industry: 'small-business'
    }
  },
  {
    id: 'green-1',
    name: 'グリーンイノベーション基金',
    description: 'カーボンニュートラル実現に向けた革新的技術開発',
    score: 78,
    attributes: {
      category: 'green',
      maxAmount: 1000000000,
      difficulty: 'extreme',
      duration: '60months',
      industry: 'green-tech'
    }
  }
];

const userProfile = {
  companySize: 'medium',
  industry: 'IT',
  preferences: {
    category: 'IT',
    difficulty: 'medium'
  }
};

export const QuantumMatchingDemo: React.FC = () => {
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [showWebGPU, setShowWebGPU] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // モバイルデバイス検出
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMatchSelect = (candidateId: string) => {
    setSelectedMatch(candidateId);
    const candidate = sampleCandidates.find(c => c.id === candidateId);
    
    if (candidate) {
      console.log('Selected subsidy:', candidate);
      // ここで実際の申請フローに遷移
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Quantum Matching Engine Demo
          </h1>
          <p className="text-gray-400">
            量子コンピューティングの概念を活用した革新的な補助金マッチングシステム
          </p>
        </motion.div>

        {/* コントロールパネル */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setShowWebGPU(!showWebGPU)}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
            >
              {showWebGPU ? 'Standard View' : 'WebGPU View'}
            </button>
            
            <button
              onClick={() => setSelectedMatch(null)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Reset Quantum State
            </button>
            
            {isMobile && (
              <div className="text-sm text-cyan-400">
                タッチ操作対応 • ピンチ・スワイプ可能
              </div>
            )}
          </div>
        </div>

        {/* メインビジュアライゼーション */}
        <div className="relative h-[600px] bg-gray-900/50 rounded-lg overflow-hidden">
          {showWebGPU ? (
            <WebGPURenderer
              states={sampleCandidates.map((c, i) => ({
                candidateId: c.id,
                candidate: c,
                amplitude: Math.random() * 0.5 + 0.5,
                phase: Math.random() * Math.PI * 2,
                spin: Math.random() > 0.5 ? 1 : -1,
                position: [
                  Math.cos(i * Math.PI * 2 / sampleCandidates.length) * 5,
                  (Math.random() - 0.5) * 3,
                  Math.sin(i * Math.PI * 2 / sampleCandidates.length) * 5
                ],
                entangled: false,
                collapsed: false
              }))}
              width={window.innerWidth}
              height={600}
            />
          ) : (
            <Canvas
              shadows
              dpr={[1, 2]}
              gl={{ 
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
              }}
            >
              {isMobile ? (
                <TouchControls
                  onPinch={(scale) => console.log('Pinch scale:', scale)}
                  onSwipe={(direction) => console.log('Swipe:', direction)}
                  onTap={(position) => console.log('Tap at:', position)}
                >
                  <QuantumMatchingEngine
                    candidates={sampleCandidates}
                    userProfile={userProfile}
                    onMatchSelect={handleMatchSelect}
                  />
                </TouchControls>
              ) : (
                <>
                  <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    minDistance={5}
                    maxDistance={50}
                  />
                  <QuantumMatchingEngine
                    candidates={sampleCandidates}
                    userProfile={userProfile}
                    onMatchSelect={handleMatchSelect}
                  />
                </>
              )}
            </Canvas>
          )}
        </div>

        {/* 選択結果表示 */}
        {selectedMatch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-r from-cyan-900/50 to-purple-900/50 backdrop-blur-md rounded-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-4">量子状態が収束しました</h2>
            {(() => {
              const match = sampleCandidates.find(c => c.id === selectedMatch);
              return match ? (
                <div className="space-y-4">
                  <h3 className="text-xl text-cyan-400">{match.name}</h3>
                  <p className="text-gray-300">{match.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-400">最大金額</div>
                      <div className="text-lg font-bold">
                        ¥{match.attributes.maxAmount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">マッチ度</div>
                      <div className="text-lg font-bold text-green-400">
                        {match.score}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">難易度</div>
                      <div className="text-lg font-bold">
                        {match.attributes.difficulty}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">期間</div>
                      <div className="text-lg font-bold">
                        {match.attributes.duration}
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 rounded-lg transition-all">
                    この補助金に申請する
                  </button>
                </div>
              ) : null;
            })()}
          </motion.div>
        )}

        {/* 技術仕様 */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-6">
            <h3 className="text-lg font-bold mb-3 text-cyan-400">量子重ね合わせ</h3>
            <p className="text-sm text-gray-400">
              全ての補助金候補が同時に存在する状態を可視化。観測により最適な選択肢に収束します。
            </p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-6">
            <h3 className="text-lg font-bold mb-3 text-purple-400">エンタングルメント</h3>
            <p className="text-sm text-gray-400">
              関連性の高い補助金同士の量子もつれを表現。一つの選択が他の可能性に影響を与えます。
            </p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-6">
            <h3 className="text-lg font-bold mb-3 text-green-400">多次元解析</h3>
            <p className="text-sm text-gray-400">
              3D/4D/5D空間での投影により、複雑な適合度を直感的に理解できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};