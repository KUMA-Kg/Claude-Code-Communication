import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Preload, Stats, Stars, Float } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';
import { Leva, useControls } from 'leva';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import SubsidyNode from './SubsidyNode';
import NavigationPath from './NavigationPath';
import ParticleField from './ParticleField';
import AIRecommendationPanel from './AIRecommendationPanel';
import LoadingSpinner from './LoadingSpinner';
import { useAIPathCalculation } from '../../hooks/useAIPathCalculation';
import { CompanyProfile, SubsidyData } from '../../types/navigator';
import { Info, Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface EnhancedVisualAINavigatorProps {
  companyProfile: CompanyProfile;
  onSubsidySelect: (subsidyId: string) => void;
}

const EnhancedVisualAINavigator: React.FC<EnhancedVisualAINavigatorProps> = ({
  companyProfile,
  onSubsidySelect,
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([10, 8, 15]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<any>(null);
  
  // AI経路計算フック
  const { calculatedPath, isCalculating, confidence } = useAIPathCalculation(companyProfile);
  
  // デバッグコントロール（開発環境のみ）
  const { showStats, bloomIntensity, dofEnabled, particlesEnabled, starsEnabled } = useControls('Visual Settings', {
    showStats: { value: false, label: 'Show FPS' },
    bloomIntensity: { value: 0.8, min: 0, max: 2, step: 0.1 },
    dofEnabled: { value: true, label: 'Depth of Field' },
    particlesEnabled: { value: true, label: 'Particles' },
    starsEnabled: { value: true, label: 'Stars' },
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
      applicationDifficulty: 'easy',
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
      applicationDifficulty: 'hard',
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
      applicationDifficulty: 'easy',
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
      applicationDifficulty: 'hard',
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
      applicationDifficulty: 'medium',
    },
  ];

  // カメラを特定のノードにフォーカス
  const focusOnNode = (subsidyId: string) => {
    const subsidy = subsidies.find(s => s.id === subsidyId);
    if (subsidy && controlsRef.current) {
      controlsRef.current.target.set(...subsidy.position);
      controlsRef.current.update();
    }
  };

  // カメラリセット
  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // フルスクリーン切り替え
  const toggleFullscreen = () => {
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen();
    } else if (isFullscreen) {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleNodeClick = (subsidyId: string) => {
    setSelectedNode(subsidyId);
    focusOnNode(subsidyId);
    onSubsidySelect(subsidyId);
  };

  const selectedSubsidy = subsidies.find(s => s.id === selectedNode) || null;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[700px] bg-gradient-to-b from-gray-900 via-blue-900/20 to-purple-900/20 rounded-xl overflow-hidden"
    >
      {/* デバッグパネル */}
      <Leva hidden={process.env.NODE_ENV === 'production'} />
      
      {/* 3Dキャンバス */}
      <Canvas
        id="subsidy-navigator-3d"
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
            position={cameraPosition}
            fov={45}
            near={0.1}
            far={1000}
          />
          
          {/* コントロール */}
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI * 0.85}
            minDistance={5}
            maxDistance={50}
            autoRotate={!selectedNode}
            autoRotateSpeed={0.3}
            dampingFactor={0.05}
            enableDamping
          />
          
          {/* ライティング */}
          <ambientLight intensity={0.15} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={0.8}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[-10, -10, -5]} intensity={0.3} color="#8b5cf6" />
          <pointLight position={[10, -10, 5]} intensity={0.3} color="#3b82f6" />
          
          {/* 環境 */}
          <Environment preset="night" />
          {starsEnabled && <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />}
          
          {/* フォグ効果 */}
          <fog attach="fog" args={['#0a0a0a', 10, 50]} />
          
          {/* パーティクル */}
          {particlesEnabled && <ParticleField count={300} spread={20} color="#4a5568" />}
          
          {/* 補助金ノード */}
          {subsidies.map((subsidy) => (
            <Float
              key={subsidy.id}
              speed={1.5}
              rotationIntensity={0.5}
              floatIntensity={0.5}
              floatingRange={[-0.1, 0.1]}
            >
              <SubsidyNode
                data={subsidy}
                isSelected={selectedNode === subsidy.id}
                isHovered={hoveredNode === subsidy.id}
                isOnPath={calculatedPath?.includes(subsidy.id) || false}
                onClick={() => handleNodeClick(subsidy.id)}
                onHover={(hovered) => setHoveredNode(hovered ? subsidy.id : null)}
              />
            </Float>
          ))}
          
          {/* AIが計算したパス */}
          {calculatedPath && calculatedPath.length > 1 && (
            <NavigationPath
              subsidies={subsidies}
              path={calculatedPath}
              animated={true}
            />
          )}
          
          {/* グラウンドプレーン */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial 
              color="#1a1a1a" 
              metalness={0.5} 
              roughness={0.8}
              transparent
              opacity={0.3}
            />
          </mesh>
          
          {/* ポストプロセッシング */}
          <EffectComposer>
            <Bloom 
              intensity={bloomIntensity} 
              luminanceThreshold={0.1}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
            {dofEnabled && (
              <DepthOfField
                focusDistance={0.01}
                focalLength={0.1}
                bokehScale={2}
              />
            )}
            <Vignette darkness={0.3} />
          </EffectComposer>
          
          {/* パフォーマンス統計 */}
          {showStats && <Stats />}
          
          <Preload all />
        </Suspense>
      </Canvas>
      
      {/* AI推奨パネル */}
      {showAIPanel && (
        <AIRecommendationPanel
          companyProfile={companyProfile}
          selectedSubsidy={selectedSubsidy}
          calculatedPath={calculatedPath || []}
          subsidies={subsidies}
          onNavigateToSubsidy={focusOnNode}
        />
      )}
      
      {/* コントロールバー */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-md rounded-lg p-2 flex items-center gap-2">
        <button
          onClick={resetCamera}
          className="p-2 hover:bg-white/10 rounded transition-colors text-white"
          title="カメラリセット"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => controlsRef.current?.object.zoom > 0.5 && (controlsRef.current.object.zoom -= 0.1)}
          className="p-2 hover:bg-white/10 rounded transition-colors text-white"
          title="ズームアウト"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => controlsRef.current?.object.zoom < 2 && (controlsRef.current.object.zoom += 0.1)}
          className="p-2 hover:bg-white/10 rounded transition-colors text-white"
          title="ズームイン"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-white/10 rounded transition-colors text-white"
          title="フルスクリーン"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className="p-2 hover:bg-white/10 rounded transition-colors text-white"
          title="AI推奨パネル"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
      
      {/* ステータスバー */}
      <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md rounded-lg px-4 py-2 text-white text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isCalculating ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
            <span>{isCalculating ? 'AI分析中...' : 'AI分析完了'}</span>
          </div>
          {confidence > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">信頼度:</span>
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
                />
              </div>
              <span>{Math.round(confidence * 100)}%</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 操作ヒント */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-xs"
      >
        マウスドラッグで回転 • ホイールでズーム • ノードクリックで詳細表示
      </motion.div>
    </div>
  );
};

export default EnhancedVisualAINavigator;