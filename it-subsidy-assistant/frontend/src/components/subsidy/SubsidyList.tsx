import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SubsidyCard from './SubsidyCard';
import SubsidyComparison from './SubsidyComparison';
import { SubsidyMatch } from '../../types/subsidy';
import { calculateMatchScore } from '../../utils/matchCalculator';

const SubsidyList: React.FC = () => {
  const [subsidies, setSubsidies] = useState<SubsidyMatch[]>([]);
  const [selectedSubsidies, setSelectedSubsidies] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // セッションストレージから回答を取得
    const answers = JSON.parse(sessionStorage.getItem('questionnaireAnswers') || '{}');
    
    // マッチ度を計算して補助金リストを生成
    const subsidyData: SubsidyMatch[] = [
      {
        id: 'it-donyu',
        name: 'IT導入補助金2025',
        description: 'ITツール導入による業務効率化・DX推進を支援',
        maxAmount: '450万円',
        subsidyRate: '最大3/4',
        matchScore: calculateMatchScore(answers, 'it-donyu'),
        features: ['クラウドサービス導入支援', 'セキュリティ強化', 'テレワーク環境整備'],
        targetBusiness: ['全業種対象'],
        applicationPeriod: '2025年3月〜2025年12月',
        color: '#2196F3'
      },
      {
        id: 'monozukuri',
        name: 'ものづくり補助金',
        description: '革新的な製品・サービス開発または生産プロセス改善を支援',
        maxAmount: '1,250万円',
        subsidyRate: '最大2/3',
        matchScore: calculateMatchScore(answers, 'monozukuri'),
        features: ['設備投資支援', '試作品開発', '生産性向上'],
        targetBusiness: ['製造業', 'サービス業'],
        applicationPeriod: '年4回公募',
        color: '#4CAF50'
      },
      {
        id: 'jizokuka',
        name: '小規模事業者持続化補助金',
        description: '販路開拓・業務効率化の取り組みを支援',
        maxAmount: '200万円',
        subsidyRate: '最大3/4',
        matchScore: calculateMatchScore(answers, 'jizokuka'),
        features: ['販路開拓支援', 'ホームページ制作', '展示会出展'],
        targetBusiness: ['小規模事業者'],
        applicationPeriod: '年6回公募',
        color: '#FF9800'
      }
    ];

    // マッチ度でソート
    subsidyData.sort((a, b) => b.matchScore - a.matchScore);
    
    // アニメーション用の遅延
    setTimeout(() => {
      setSubsidies(subsidyData);
      setIsLoading(false);
    }, 800);
  }, []);

  const handleSelectSubsidy = (subsidyId: string) => {
    if (selectedSubsidies.includes(subsidyId)) {
      setSelectedSubsidies(selectedSubsidies.filter(id => id !== subsidyId));
    } else {
      setSelectedSubsidies([...selectedSubsidies, subsidyId]);
    }
  };

  const handleCompare = () => {
    setShowComparison(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 20
      }
    }
  };

  if (isLoading) {
    return (
      <div className="subsidy-list-loading">
        <div className="loading-spinner" />
        <p>最適な補助金を分析中...</p>
      </div>
    );
  }

  return (
    <div className="subsidy-list-container">
      <motion.div
        className="subsidy-list-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="subsidy-list-title">あなたにおすすめの補助金</h1>
        <p className="subsidy-list-subtitle">
          回答内容から、以下の補助金が活用できる可能性があります
        </p>
      </motion.div>

      <motion.div
        className="subsidy-cards"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {subsidies.map((subsidy, index) => (
          <motion.div key={subsidy.id} variants={itemVariants}>
            <SubsidyCard
              subsidy={subsidy}
              isSelected={selectedSubsidies.includes(subsidy.id)}
              onSelect={handleSelectSubsidy}
              rank={index + 1}
            />
          </motion.div>
        ))}
      </motion.div>

      {selectedSubsidies.length >= 2 && (
        <motion.div
          className="comparison-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            className="btn btn-primary btn-lg"
            onClick={handleCompare}
          >
            選択した補助金を比較する ({selectedSubsidies.length}件)
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {showComparison && (
          <SubsidyComparison
            subsidies={subsidies.filter(s => selectedSubsidies.includes(s.id))}
            onClose={() => setShowComparison(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubsidyList;