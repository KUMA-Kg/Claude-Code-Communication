import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Preload, Stats } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
import { Leva, useControls } from 'leva';
import * as THREE from 'three';
import SubsidyNode from './SubsidyNode';
import NavigationPath from './NavigationPath';
import { useAIPathCalculation } from '../../hooks/useAIPathCalculation';
import { CompanyProfile, SubsidyData } from '../../types/navigator';
import LoadingSpinner from './LoadingSpinner';

interface VisualAINavigatorProps {
  companyProfile: CompanyProfile;
  onSubsidySelect: (subsidyId: string) => void;
}

const VisualAINavigator: React.FC<VisualAINavigatorProps> = ({
  companyProfile,
  onSubsidySelect,
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  // AI経路計算フック
  const { calculatedPath, isCalculating } = useAIPathCalculation(companyProfile);
  
  // デバッグコントロール（開発環境のみ）
  const { showStats, bloomIntensity, dofEnabled } = useControls('Visual Settings', {
    showStats: { value: false, label: 'Show FPS' },
    bloomIntensity: { value: 0.5, min: 0, max: 2, step: 0.1 },
    dofEnabled: { value: true, label: 'Depth of Field' },
  });

  // 補助金データ（実際にはAPIから取得）
  const subsidies: SubsidyData[] = [
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
  ];

  // カメラアニメーション
  const animateCamera = (targetPosition: [number, number, number]) => {
    if (!cameraRef.current) return;
    
    // カメラアニメーションロジック（gsapなどを使用可能）
    console.log('Animating camera to:', targetPosition);
  };

  const handleNodeClick = (subsidyId: string) => {
    setSelectedNode(subsidyId);
    const subsidy = subsidies.find(s => s.id === subsidyId);
    if (subsidy) {
      // カメラを選択したノードにフォーカス
      animateCamera([
        subsidy.position[0] + 3,
        subsidy.position[1] + 2,
        subsidy.position[2] + 5,
      ]);
    }
    onSubsidySelect(subsidyId);
  };

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl overflow-hidden">
      {/* デバッグパネル */}
      <Leva hidden={process.env.NODE_ENV === 'production'} />
      
      {/* 3Dキャンバス */}
      <Canvas
        id="subsidy-map-3d"
        shadows
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          toneMapping: THREE.ACESFilmicToneMapping,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          {/* カメラ設定 */}
          <PerspectiveCamera
            ref={cameraRef}
            makeDefault
            position={[10, 8, 15]}
            fov={45}
            near={0.1}
            far={1000}
          />
          
          {/* コントロール */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI * 0.85}
            minDistance={5}
            maxDistance={50}
            autoRotate={!selectedNode}
            autoRotateSpeed={0.5}
          />
          
          {/* ライティング */}
          <ambientLight intensity={0.2} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#8b5cf6" />
          
          {/* 環境マップ */}
          <Environment preset="city" />
          
          {/* 補助金ノード */}
          {subsidies.map((subsidy) => (
            <SubsidyNode
              key={subsidy.id}
              data={subsidy}
              isSelected={selectedNode === subsidy.id}
              isHovered={hoveredNode === subsidy.id}
              isOnPath={calculatedPath?.includes(subsidy.id) || false}
              onClick={() => handleNodeClick(subsidy.id)}
              onHover={(hovered) => setHoveredNode(hovered ? subsidy.id : null)}
            />
          ))}
          
          {/* AIが計算したパス */}
          {calculatedPath && calculatedPath.length > 1 && (
            <NavigationPath
              subsidies={subsidies}
              path={calculatedPath}
              animated={true}
            />
          )}
          
          {/* ポストプロセッシング */}
          <EffectComposer>
            <Bloom intensity={bloomIntensity} luminanceThreshold={0.1} />
            {dofEnabled && (
              <DepthOfField
                focusDistance={0.01}
                focalLength={0.1}
                bokehScale={2}
              />
            )}
          </EffectComposer>
          
          {/* パフォーマンス統計 */}
          {showStats && <Stats />}
          
          <Preload all />
        </Suspense>
      </Canvas>
      
      {/* UI オーバーレイ */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md rounded-lg p-4 text-white max-w-sm">
        <h3 className="text-lg font-bold mb-2">補助金ナビゲーター</h3>
        <p className="text-sm opacity-80 mb-3">
          あなたの企業プロファイルに基づいて、最適な補助金への経路を表示しています。
        </p>
        {isCalculating && (
          <div className="flex items-center gap-2 text-blue-400">
            <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
            <span className="text-sm">AIが最適経路を計算中...</span>
          </div>
        )}
        {selectedNode && (
          <div className="mt-3 p-3 bg-white/10 rounded">
            <p className="text-sm font-medium">
              選択中: {subsidies.find(s => s.id === selectedNode)?.name}
            </p>
          </div>
        )}
      </div>
      
      {/* 凡例 */}
      <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md rounded-lg p-3 text-white text-xs">
        <p className="font-bold mb-2">凡例</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>推奨経路</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span>選択中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
            <span>その他の補助金</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualAINavigator;