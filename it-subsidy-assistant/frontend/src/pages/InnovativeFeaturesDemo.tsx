import React, { useState, useEffect } from 'react';
import VisualAINavigator from '../components/visual-navigator/VisualAINavigator';
import FigmaProfileWizard from '../components/figma-wizard/FigmaProfileWizard';
import { CompanyProfile } from '../types/navigator';
import { performanceMonitor } from '../utils/performanceMonitor';
import { motion, AnimatePresence } from 'framer-motion';

const InnovativeFeaturesDemo: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<'navigator' | 'wizard'>('navigator');
  const [selectedSubsidy, setSelectedSubsidy] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  // サンプル企業プロファイル
  const companyProfile: CompanyProfile = {
    companySize: 30,
    industry: 'it',
    annualRevenue: 100000000,
    currentChallenges: ['efficiency', 'innovation'],
    investmentBudget: 5000000,
    digitalizationLevel: 'intermediate',
  };

  useEffect(() => {
    // パフォーマンス監視開始
    if ((window as any).enableFPSMeter) {
      performanceMonitor.startFPSMonitoring((fps) => {
        setPerformanceMetrics(performanceMonitor.getPerformanceMetrics());
      });
    }

    // モバイル検出
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleSubsidySelect = (subsidyId: string) => {
    setSelectedSubsidy(subsidyId);
    console.log('Selected subsidy:', subsidyId);
  };

  const handleWizardComplete = (formData: any) => {
    console.log('Form completed:', formData);
    alert('フォームが正常に保存されました！');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              革新的フロントエンド機能デモ
            </h1>
            {performanceMetrics && (
              <div className="text-sm text-gray-600">
                FPS: {performanceMetrics.fps} | 
                Avg: {performanceMetrics.averageFPS} |
                Memory: {performanceMetrics.memoryUsed}MB
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 機能切り替えタブ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setActiveFeature('navigator')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeFeature === 'navigator'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Visual AI Navigator
          </button>
          <button
            onClick={() => setActiveFeature('wizard')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeFeature === 'wizard'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Figma Profile Wizard
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeFeature === 'navigator' ? (
            <motion.div
              key="navigator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  3D補助金ナビゲーター
                </h2>
                <p className="text-gray-600 mb-6">
                  あなたの企業情報に基づいて、最適な補助金への経路をAIが3D空間で可視化します。
                  ノードをクリックして詳細を確認し、青い経路に沿って申請を進めましょう。
                </p>
                
                <VisualAINavigator
                  companyProfile={companyProfile}
                  onSubsidySelect={handleSubsidySelect}
                />
                
                {selectedSubsidy && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-800">
                      選択された補助金: <strong>{selectedSubsidy}</strong>
                    </p>
                    <button
                      data-testid="start-document-creation"
                      onClick={() => setActiveFeature('wizard')}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      申請書作成を開始
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-xl shadow-lg">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Figma連携プロファイルウィザード
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Figmaからコンポーネントをドラッグ&ドロップして、
                    補助金申請フォームをビジュアルに構築できます。
                    デザインの変更はリアルタイムで反映されます。
                  </p>
                </div>
                
                <FigmaProfileWizard onComplete={handleWizardComplete} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* モバイル最適化通知 */}
      {isMobile && (
        <div className="fixed bottom-4 left-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg">
          <p className="text-sm">
            モバイルデバイスでは一部の3D機能が制限される場合があります。
            最適な体験のためデスクトップでの利用を推奨します。
          </p>
        </div>
      )}
    </div>
  );
};

export default InnovativeFeaturesDemo;