import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Stats,
  Preload,
  Float,
  MeshTransmissionMaterial,
  Center,
  Text3D
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, GodRays } from '@react-three/postprocessing';
import { Leva, useControls } from 'leva';
import * as THREE from 'three';
import { QuantumNode } from './QuantumNode';
import { WaveFunction } from './WaveFunction';
import { ParallelUniverses } from './ParallelUniverses';
import { QuantumPath } from './QuantumPath';
import { useQuantumMatching } from '../../hooks/useQuantumMatching';
import { MatchingCandidate, QuantumState } from '../../types/quantum';
import { BlendFunction } from 'postprocessing';

interface QuantumMatchingEngineProps {
  candidates: MatchingCandidate[];
  userProfile: any;
  onMatchSelect: (candidateId: string) => void;
}

const QuantumMatchingEngine: React.FC<QuantumMatchingEngineProps> = ({
  candidates,
  userProfile,
  onMatchSelect,
}) => {
  const [selectedUniverse, setSelectedUniverse] = useState<number>(0);
  const [observedCandidates, setObservedCandidates] = useState<Set<string>>(new Set());
  const [currentDimension, setCurrentDimension] = useState<number>(3);
  const lightsRef = useRef<THREE.Light[]>([]);

  // 量子マッチング計算
  const { 
    quantumStates, 
    superposition, 
    collapse,
    entanglement,
    matchingProbabilities 
  } = useQuantumMatching(candidates, userProfile);

  // デバッグコントロール
  const { 
    showWaveFunction, 
    showEntanglement,
    dimensionCount,
    quantumNoiseLevel,
    collapseSpeed
  } = useControls('Quantum Settings', {
    showWaveFunction: { value: true, label: 'Wave Function' },
    showEntanglement: { value: true, label: 'Entanglement Lines' },
    dimensionCount: { value: 3, min: 3, max: 5, step: 1, label: 'Dimensions' },
    quantumNoiseLevel: { value: 0.3, min: 0, max: 1, step: 0.1 },
    collapseSpeed: { value: 0.02, min: 0.01, max: 0.1, step: 0.01 }
  });

  // 観測による波動関数の崩壊
  const handleObservation = (candidateId: string) => {
    collapse(candidateId);
    setObservedCandidates(prev => new Set([...prev, candidateId]));
    onMatchSelect(candidateId);
  };

  // 次元切り替え
  useEffect(() => {
    setCurrentDimension(dimensionCount);
  }, [dimensionCount]);

  return (
    <div className="relative w-full h-[800px] bg-black rounded-xl overflow-hidden">
      <Leva hidden={process.env.NODE_ENV === 'production'} />
      
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true
        }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera
            makeDefault
            position={[0, 0, 15]}
            fov={50}
            near={0.1}
            far={1000}
          />
          
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={true}
            autoRotateSpeed={0.3}
            maxDistance={30}
            minDistance={5}
          />

          {/* 環境設定 */}
          <color attach="background" args={['#000011']} />
          <fog attach="fog" args={['#000011', 10, 50]} />
          <ambientLight intensity={0.1} />
          
          {/* 量子フィールドライティング */}
          <directionalLight
            ref={(ref) => ref && (lightsRef.current[0] = ref)}
            position={[10, 10, 5]}
            intensity={0.5}
            color="#4080ff"
            castShadow
          />
          <pointLight position={[-10, -10, -5]} intensity={0.3} color="#ff4080" />
          <pointLight position={[0, 15, 0]} intensity={0.2} color="#80ff40" />

          {/* 量子ノード群 */}
          <group>
            {quantumStates.map((state, index) => (
              <QuantumNode
                key={state.candidateId}
                state={state}
                position={state.position}
                isObserved={observedCandidates.has(state.candidateId)}
                probability={matchingProbabilities[state.candidateId] || 0}
                onObserve={() => handleObservation(state.candidateId)}
                dimension={currentDimension}
              />
            ))}
          </group>

          {/* 波動関数可視化 */}
          {showWaveFunction && (
            <WaveFunction
              states={quantumStates}
              superposition={superposition}
              noiseLevel={quantumNoiseLevel}
              time={0}
            />
          )}

          {/* エンタングルメント表示 */}
          {showEntanglement && entanglement.length > 0 && (
            <group>
              {entanglement.map((pair, index) => (
                <QuantumPath
                  key={`entangle-${index}`}
                  start={quantumStates.find(s => s.candidateId === pair[0])?.position || [0,0,0]}
                  end={quantumStates.find(s => s.candidateId === pair[1])?.position || [0,0,0]}
                  strength={0.5}
                  color="#00ffff"
                />
              ))}
            </group>
          )}

          {/* 並行宇宙ビュー */}
          <ParallelUniverses
            universeCount={3}
            states={quantumStates}
            selectedUniverse={selectedUniverse}
            onUniverseSelect={setSelectedUniverse}
          />

          {/* ポストプロセッシング */}
          <EffectComposer>
            <Bloom 
              intensity={1.5} 
              luminanceThreshold={0.1} 
              luminanceSmoothing={0.9}
              blendFunction={BlendFunction.ADD}
            />
            <ChromaticAberration
              offset={[0.002, 0.002]}
              blendFunction={BlendFunction.NORMAL}
            />
          </EffectComposer>

          <Environment preset="night" />
          <Stats />
          <Preload all />
        </Suspense>
      </Canvas>

      {/* UI オーバーレイ */}
      <div className="absolute top-4 left-4 p-4 bg-black/80 backdrop-blur-md rounded-lg text-white max-w-sm">
        <h3 className="text-lg font-bold mb-2 text-cyan-400">量子マッチングエンジン</h3>
        <p className="text-sm opacity-80 mb-3">
          重ね合わせ状態の候補を観測して、最適なマッチングを確定させてください。
        </p>
        
        {/* 次元切り替え */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs">次元表示:</span>
          {[3, 4, 5].map(dim => (
            <button
              key={dim}
              onClick={() => setCurrentDimension(dim)}
              className={`px-2 py-1 text-xs rounded ${
                currentDimension === dim 
                  ? 'bg-cyan-500 text-black' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {dim}D
            </button>
          ))}
        </div>

        {/* 確率表示 */}
        <div className="space-y-1">
          <p className="text-xs text-gray-400">マッチング確率:</p>
          {Object.entries(matchingProbabilities)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([id, prob]) => {
              const candidate = candidates.find(c => c.id === id);
              return (
                <div key={id} className="flex justify-between text-xs">
                  <span>{candidate?.name}</span>
                  <span className="text-cyan-400">{(prob * 100).toFixed(1)}%</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* 並行宇宙セレクター */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        {[0, 1, 2].map(universe => (
          <button
            key={universe}
            onClick={() => setSelectedUniverse(universe)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedUniverse === universe
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Universe {universe + 1}
          </button>
        ))}
      </div>

      {/* 観測済み候補 */}
      {observedCandidates.size > 0 && (
        <div className="absolute top-4 right-4 p-4 bg-black/80 backdrop-blur-md rounded-lg text-white">
          <h4 className="text-sm font-bold mb-2">観測済み候補</h4>
          <div className="space-y-1">
            {Array.from(observedCandidates).map(id => {
              const candidate = candidates.find(c => c.id === id);
              return (
                <div key={id} className="text-xs text-green-400">
                  ✓ {candidate?.name}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantumMatchingEngine;