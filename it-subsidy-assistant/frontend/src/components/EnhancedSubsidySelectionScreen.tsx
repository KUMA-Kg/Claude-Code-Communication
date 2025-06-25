import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, Star, Info, Lock, ExternalLink } from 'lucide-react';
import StatusBadge, { SubsidyStatus, StatusBadgeStyles } from './StatusBadge';
import { styles } from '../styles';
import '../../templates/darkmode.css';

interface SubsidyMatch {
  subsidyType: string;
  subsidyName: string;
  score: number;
  matchLevel: 'high' | 'medium' | 'low';
  description: string;
  icon: string;
  status?: SubsidyStatus;
  deadline?: string;
  comingSoonDate?: string;
}

interface SubsidySelectionScreenProps {
  matches: SubsidyMatch[];
  onSelect: (selectedSubsidy: SubsidyMatch) => void;
  onBack: () => void;
}

// ダークモード統合
const initializeDarkMode = () => {
  const script = document.createElement('script');
  script.src = '/templates/darkmode.js';
  document.body.appendChild(script);
};

const EnhancedSubsidySelectionScreen: React.FC<SubsidySelectionScreenProps> = ({ 
  matches, 
  onSelect,
  onBack 
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showDisabledMessage, setShowDisabledMessage] = useState<string | null>(null);

  useEffect(() => {
    initializeDarkMode();
    // StatusBadgeのスタイルを適用
    const styleElement = document.createElement('style');
    styleElement.textContent = StatusBadgeStyles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const getMatchLevelStyle = (level: string, isDisabled: boolean = false) => {
    const baseStyles = {
      transition: 'all 0.3s ease',
      opacity: isDisabled ? 0.6 : 1,
      cursor: isDisabled ? 'not-allowed' : 'pointer'
    };

    if (isDisabled) {
      return {
        ...baseStyles,
        backgroundColor: 'var(--bg-tertiary, #f3f4f6)',
        color: 'var(--text-secondary, #6b7280)',
        border: '2px solid var(--border-color, #d1d5db)'
      };
    }

    switch (level) {
      case 'high':
        return {
          ...baseStyles,
          backgroundColor: 'var(--success-bg, #dcfce7)',
          color: 'var(--success-text, #166534)',
          border: '2px solid var(--success-border, #22c55e)'
        };
      case 'medium':
        return {
          ...baseStyles,
          backgroundColor: 'var(--warning-bg, #fef3c7)',
          color: 'var(--warning-text, #92400e)',
          border: '2px solid var(--warning-border, #f59e0b)'
        };
      case 'low':
        return {
          ...baseStyles,
          backgroundColor: 'var(--danger-bg, #fee2e2)',
          color: 'var(--danger-text, #991b1b)',
          border: '2px solid var(--danger-border, #ef4444)'
        };
      default:
        return baseStyles;
    }
  };

  const getMatchLevelText = (level: string) => {
    switch (level) {
      case 'high':
        return '高適合';
      case 'medium':
        return '中適合';
      case 'low':
        return '低適合';
      default:
        return '適合度不明';
    }
  };

  const subsidyDetails = {
    it_donyu: {
      fullName: 'IT導入補助金',
      description: 'ITツールの導入で業務効率化・デジタル化を支援する補助金',
      maxAmount: '最大450万円',
      subsidyRate: '1/2～3/4補助',
      features: [
        'ソフトウェア購入費用の補助',
        'クラウドサービス利用料の補助',
        'デジタル化による生産性向上'
      ],
      deadline: '随時募集',
      processingTime: '約2-3ヶ月',
      officialUrl: 'https://it-hojo.jp/'
    },
    jizokuka: {
      fullName: '小規模事業者持続化補助金',
      description: '小規模事業者の販路開拓・マーケティング活動を支援する補助金',
      maxAmount: '最大200万円',
      subsidyRate: '2/3補助',
      features: [
        '広告・宣伝費の補助',
        'ホームページ制作費用の補助',
        '展示会出展費用の補助'
      ],
      deadline: '年4回公募',
      processingTime: '約3-4ヶ月',
      officialUrl: 'https://jizokuka-hojo.jp/'
    },
    saikochiku: {
      fullName: '事業再構築補助金',
      description: '新分野展開や業態転換等の事業再構築を支援する大型補助金',
      maxAmount: '最大1.5億円',
      subsidyRate: '1/2～3/4補助',
      features: [
        '新分野展開・事業転換の支援',
        '大規模な設備投資に対応',
        'グリーン・デジタル分野への取組み優遇'
      ],
      deadline: '年3回公募',
      processingTime: '約6ヶ月',
      officialUrl: 'https://jigyou-saikouchiku.go.jp/',
      status: 'preparing' as SubsidyStatus,
      comingSoonDate: '2025年4月'
    }
  };

  // デフォルトのステータス設定
  const enrichedMatches = matches.map(match => ({
    ...match,
    status: match.status || (match.subsidyType === 'saikochiku' ? 'preparing' : 'active') as SubsidyStatus,
    deadline: match.deadline || (match.subsidyType === 'it_donyu' ? '2025年3月31日' : '2025年2月28日')
  }));

  // 事業再構築補助金を追加
  if (!enrichedMatches.find(m => m.subsidyType === 'saikochiku')) {
    enrichedMatches.push({
      subsidyType: 'saikochiku',
      subsidyName: '事業再構築補助金',
      score: 0,
      matchLevel: 'low',
      description: subsidyDetails.saikochiku.description,
      icon: '🏭',
      status: 'preparing' as SubsidyStatus,
      comingSoonDate: '2025年4月'
    });
  }

  const handleCardClick = (match: SubsidyMatch) => {
    if (match.status === 'active') {
      onSelect(match);
    } else {
      setShowDisabledMessage(match.subsidyType);
      setTimeout(() => setShowDisabledMessage(null), 3000);
    }
  };

  return (
    <div style={{
      ...styles.container,
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      transition: 'all 0.3s ease'
    }}>
      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ ...styles.flex.center, gap: '12px', marginBottom: '16px' }}
        >
          <CheckCircle size={32} color="var(--accent-color, #2563eb)" />
          <h1 style={{
            ...styles.text.title,
            color: 'var(--text-primary)'
          }}>補助金判定結果</h1>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            ...styles.text.subtitle,
            color: 'var(--text-secondary)'
          }}
        >
          あなたの回答に基づいて最適な補助金をランキングしました
        </motion.p>
      </div>

      {/* 判定結果 */}
      <div style={{ marginBottom: '32px' }}>
        <AnimatePresence>
          {enrichedMatches.map((match, index) => {
            const details = subsidyDetails[match.subsidyType as keyof typeof subsidyDetails];
            const isDisabled = match.status !== 'active';
            const matchStyle = getMatchLevelStyle(match.matchLevel, isDisabled);
            
            return (
              <motion.div
                key={match.subsidyType}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{
                  ...styles.card,
                  marginBottom: '24px',
                  position: 'relative',
                  ...matchStyle,
                  transform: hoveredCard === match.subsidyType && !isDisabled ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: hoveredCard === match.subsidyType && !isDisabled 
                    ? '0 10px 30px rgba(0, 0, 0, 0.15)' 
                    : 'var(--shadow)'
                }}
                onClick={() => handleCardClick(match)}
                onMouseEnter={() => setHoveredCard(match.subsidyType)}
                onMouseLeave={() => setHoveredCard(null)}
                role="button"
                tabIndex={0}
                aria-label={`${details.fullName} - ${getMatchLevelText(match.matchLevel)}`}
                aria-disabled={isDisabled}
              >
                {/* グレーアウトオーバーレイ */}
                {isDisabled && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(128, 128, 128, 0.1)',
                    borderRadius: 'inherit',
                    pointerEvents: 'none',
                    zIndex: 1
                  }} />
                )}

                {/* ランキングバッジ（アクティブな補助金のみ） */}
                {match.status === 'active' && index < 3 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: index * 0.1 + 0.3 }}
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '20px',
                      backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#cd7c2f',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 2
                    }}
                  >
                    {index === 0 && <Star size={16} />}
                    第{index + 1}位
                  </motion.div>
                )}

                {/* ステータスバッジ */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '20px',
                  zIndex: 2
                }}>
                  <StatusBadge 
                    status={match.status!}
                    deadline={match.deadline}
                    size="medium"
                    animated={true}
                  />
                </div>

                <div style={{ paddingTop: '12px', position: 'relative', zIndex: 2 }}>
                  {/* 補助金基本情報 */}
                  <div style={{ ...styles.flex.between, alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...styles.flex.start, gap: '12px', marginBottom: '8px' }}>
                        <motion.div 
                          animate={{ 
                            rotate: hoveredCard === match.subsidyType ? [0, -10, 10, -10, 0] : 0 
                          }}
                          transition={{ duration: 0.5 }}
                          style={{ fontSize: '24px', filter: isDisabled ? 'grayscale(1)' : 'none' }}
                        >
                          {match.icon}
                        </motion.div>
                        <div>
                          <h3 style={{ 
                            fontSize: '20px', 
                            fontWeight: 'bold', 
                            color: isDisabled ? 'var(--text-secondary)' : 'var(--text-primary)', 
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {details.fullName}
                            {isDisabled && <Lock size={18} />}
                          </h3>
                          <p style={{ 
                            color: 'var(--text-secondary)', 
                            fontSize: '14px' 
                          }}>
                            {details.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 適合度スコア（アクティブな補助金のみ） */}
                    {match.status === 'active' && (
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        style={{ textAlign: 'center', minWidth: '120px' }}
                      >
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: matchStyle.color,
                          marginBottom: '4px'
                        }}>
                          {match.score}点
                        </div>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: matchStyle.backgroundColor,
                          color: matchStyle.color
                        }}>
                          {getMatchLevelText(match.matchLevel)}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* 補助金詳細 */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '16px', 
                    marginBottom: '16px',
                    opacity: isDisabled ? 0.7 : 1
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        補助上限額
                      </div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {details.maxAmount}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        補助率
                      </div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {details.subsidyRate}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        募集時期
                      </div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {details.deadline}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        審査期間
                      </div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {details.processingTime}
                      </div>
                    </div>
                  </div>

                  {/* 特徴 */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      主な特徴
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {details.features.map((feature, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + i * 0.05 }}
                          style={{
                            backgroundColor: isDisabled 
                              ? 'var(--bg-tertiary)' 
                              : 'rgba(255, 255, 255, 0.8)',
                            color: 'var(--text-primary)',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          {feature}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* 準備中メッセージ */}
                  {match.status === 'preparing' && match.comingSoonDate && (
                    <div style={{
                      backgroundColor: 'var(--info-bg)',
                      color: 'var(--info-text)',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Info size={16} />
                      <span style={{ fontSize: '14px' }}>
                        {match.comingSoonDate}より受付開始予定です
                      </span>
                    </div>
                  )}

                  {/* 無効化メッセージ */}
                  <AnimatePresence>
                    {showDisabledMessage === match.subsidyType && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                          backgroundColor: 'var(--warning-bg)',
                          color: 'var(--warning-text)',
                          padding: '12px',
                          borderRadius: '8px',
                          marginBottom: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Info size={16} />
                        <span style={{ fontSize: '14px' }}>
                          この補助金は現在{match.status === 'preparing' ? '準備中' : '受付を終了しています'}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 選択ボタン/詳細リンク */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      style={{
                        ...styles.button.primary,
                        flex: 1,
                        justifyContent: 'center',
                        backgroundColor: isDisabled 
                          ? 'var(--text-secondary)' 
                          : index === 0 ? '#2563eb' : '#6b7280',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.6 : 1
                      }}
                      disabled={isDisabled}
                      aria-disabled={isDisabled}
                    >
                      <span>{isDisabled ? '現在選択できません' : 'この補助金で申請を進める'}</span>
                      {!isDisabled && <ArrowRight size={20} />}
                    </button>
                    
                    {details.officialUrl && (
                      <a
                        href={details.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          ...styles.button.secondary,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>詳細</span>
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ナビゲーション */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ ...styles.flex.between, marginTop: '32px' }}
      >
        <button
          onClick={onBack}
          style={{
            ...styles.button.secondary,
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '2px solid var(--border-color)'
          }}
        >
          ← 質問に戻る
        </button>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '12px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Info size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            複数の補助金に同時申請も可能です
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedSubsidySelectionScreen;