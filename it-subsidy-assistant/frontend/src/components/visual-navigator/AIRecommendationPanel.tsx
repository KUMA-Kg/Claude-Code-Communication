import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, Target, AlertCircle, ChevronRight } from 'lucide-react';
import { CompanyProfile, SubsidyData } from '../../types/navigator';

interface AIRecommendationPanelProps {
  companyProfile: CompanyProfile;
  selectedSubsidy: SubsidyData | null;
  calculatedPath: string[];
  subsidies: SubsidyData[];
  onNavigateToSubsidy: (subsidyId: string) => void;
}

interface Recommendation {
  type: 'primary' | 'secondary' | 'warning';
  title: string;
  description: string;
  action?: {
    label: string;
    subsidyId: string;
  };
}

const AIRecommendationPanel: React.FC<AIRecommendationPanelProps> = ({
  companyProfile,
  selectedSubsidy,
  calculatedPath,
  subsidies,
  onNavigateToSubsidy,
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // AI分析をシミュレート
  useEffect(() => {
    const analyzeProfile = async () => {
      setIsAnalyzing(true);
      
      // 実際のAPIコールをシミュレート
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newRecommendations: Recommendation[] = [];
      
      // デジタル化レベルに基づく推奨
      if (companyProfile.digitalizationLevel === 'none' || companyProfile.digitalizationLevel === 'basic') {
        newRecommendations.push({
          type: 'primary',
          title: 'IT導入補助金を優先的に検討',
          description: 'デジタル化レベルが初期段階のため、IT導入補助金が最適です。最大450万円の支援を受けられます。',
          action: {
            label: 'IT導入補助金を見る',
            subsidyId: 'it-donyu',
          },
        });
      }
      
      // 企業規模に基づく推奨
      if (companyProfile.companySize < 20) {
        newRecommendations.push({
          type: 'secondary',
          title: '小規模事業者向け補助金も対象',
          description: '従業員数20名未満の企業は、持続化補助金の対象となります。販路開拓に活用できます。',
          action: {
            label: '持続化補助金を見る',
            subsidyId: 'jizokuka',
          },
        });
      }
      
      // 予算に基づく警告
      if (companyProfile.investmentBudget > 50000000) {
        newRecommendations.push({
          type: 'warning',
          title: '大規模投資には事業再構築補助金',
          description: '5,000万円を超える投資には、事業再構築補助金が適しています。最大1.5億円まで支援可能です。',
          action: {
            label: '事業再構築補助金を見る',
            subsidyId: 'jigyosaikochiku',
          },
        });
      }
      
      // 業界特有の推奨
      if (companyProfile.industry === 'manufacturing') {
        newRecommendations.push({
          type: 'secondary',
          title: '製造業向けものづくり補助金',
          description: '革新的な製品開発や生産プロセス改善に、ものづくり補助金が活用できます。',
          action: {
            label: 'ものづくり補助金を見る',
            subsidyId: 'monozukuri',
          },
        });
      }
      
      setRecommendations(newRecommendations);
      setIsAnalyzing(false);
    };
    
    analyzeProfile();
  }, [companyProfile]);

  const getIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'primary':
        return <Target className="w-5 h-5 text-blue-400" />;
      case 'secondary':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-20 left-4 w-80 max-h-[calc(100vh-120px)] overflow-y-auto bg-black/80 backdrop-blur-md rounded-lg border border-white/20 text-white"
    >
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-bold">AI推奨事項</h3>
        </div>
        <p className="text-sm text-gray-400">
          企業プロファイルに基づく最適な補助金をAIが分析
        </p>
      </div>

      <div className="p-4 space-y-3">
        {isAnalyzing ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full" />
          </div>
        ) : (
          <AnimatePresence>
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${
                  rec.type === 'primary' ? 'bg-blue-500/20 border-blue-500/50' :
                  rec.type === 'secondary' ? 'bg-green-500/20 border-green-500/50' :
                  'bg-yellow-500/20 border-yellow-500/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(rec.type)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">{rec.title}</h4>
                    <p className="text-xs text-gray-300 mb-2">{rec.description}</p>
                    {rec.action && (
                      <button
                        onClick={() => onNavigateToSubsidy(rec.action!.subsidyId)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        {rec.action.label}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* 選択中の補助金の詳細分析 */}
        {selectedSubsidy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg"
          >
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              {selectedSubsidy.name}の適合度分析
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">補助率</span>
                <span>{Math.round(selectedSubsidy.subsidyRate * 100)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">最大補助額</span>
                <span>{(selectedSubsidy.maxAmount / 10000).toLocaleString()}万円</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">申請難易度</span>
                <span>{selectedSubsidy.applicationDifficulty || '中'}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10">
                <p className="text-xs text-gray-300">
                  あなたの企業は{companyProfile.currentChallenges.length}つの課題を抱えており、
                  この補助金で{Math.min(companyProfile.currentChallenges.length, 2)}つの課題解決が期待できます。
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 経路の説明 */}
        {calculatedPath.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg"
          >
            <h4 className="font-semibold text-sm mb-2">推奨申請順序</h4>
            <ol className="space-y-1">
              {calculatedPath.map((subsidyId, index) => {
                const subsidy = subsidies.find(s => s.id === subsidyId);
                return subsidy ? (
                  <li key={subsidyId} className="text-xs flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span>{subsidy.name}</span>
                  </li>
                ) : null;
              })}
            </ol>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AIRecommendationPanel;