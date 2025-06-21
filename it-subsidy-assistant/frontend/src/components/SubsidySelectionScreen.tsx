import React from 'react';
import { ArrowRight, CheckCircle, Star, Info } from 'lucide-react';
import { styles } from '../styles';

interface SubsidyMatch {
  subsidyType: string;
  subsidyName: string;
  score: number;
  matchLevel: 'high' | 'medium' | 'low';
  description: string;
  icon: string;
}

interface SubsidySelectionScreenProps {
  matches: SubsidyMatch[];
  onSelect: (selectedSubsidy: SubsidyMatch) => void;
  onBack: () => void;
}

const SubsidySelectionScreen: React.FC<SubsidySelectionScreenProps> = ({ 
  matches, 
  onSelect,
  onBack 
}) => {
  const getMatchLevelStyle = (level: string) => {
    switch (level) {
      case 'high':
        return {
          backgroundColor: '#dcfce7',
          color: '#166534',
          border: '2px solid #22c55e'
        };
      case 'medium':
        return {
          backgroundColor: '#fef3c7',
          color: '#92400e',
          border: '2px solid #f59e0b'
        };
      case 'low':
        return {
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          border: '2px solid #ef4444'
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
          color: '#374151',
          border: '2px solid #d1d5db'
        };
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
      processingTime: '約2-3ヶ月'
    },
    monozukuri: {
      fullName: 'ものづくり・商業・サービス生産性向上促進補助金',
      description: '革新的サービス開発・試作品開発・生産プロセス改善を支援する補助金',
      maxAmount: '最大3,000万円',
      subsidyRate: '1/2～2/3補助',
      features: [
        '新製品・サービス開発費用の補助',
        '設備投資による生産性向上',
        '革新的な取り組みへの支援'
      ],
      deadline: '年3-4回公募',
      processingTime: '約4-6ヶ月'
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
      processingTime: '約3-4ヶ月'
    }
  };

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ ...styles.flex.center, gap: '12px', marginBottom: '16px' }}>
          <CheckCircle size={32} color="#2563eb" />
          <h1 style={styles.text.title}>補助金判定結果</h1>
        </div>
        <p style={styles.text.subtitle}>
          あなたの回答に基づいて最適な補助金をランキングしました
        </p>
      </div>

      {/* 判定結果 */}
      <div style={{ marginBottom: '32px' }}>
        {matches.map((match, index) => {
          const details = subsidyDetails[match.subsidyType as keyof typeof subsidyDetails];
          const matchStyle = getMatchLevelStyle(match.matchLevel);
          
          return (
            <div
              key={match.subsidyType}
              style={{
                ...styles.card,
                marginBottom: '24px',
                position: 'relative',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                ...matchStyle
              }}
              onClick={() => onSelect(match)}
            >
              {/* ランキングバッジ */}
              <div style={{
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
                gap: '4px'
              }}>
                {index === 0 && <Star size={16} />}
                第{index + 1}位
              </div>

              <div style={{ paddingTop: '12px' }}>
                {/* 補助金基本情報 */}
                <div style={{ ...styles.flex.between, alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...styles.flex.start, gap: '12px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '24px' }}>{match.icon}</div>
                      <div>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                          {details.fullName}
                        </h3>
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>
                          {details.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 適合度スコア */}
                  <div style={{ textAlign: 'center', minWidth: '120px' }}>
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
                  </div>
                </div>

                {/* 補助金詳細 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>補助上限額</div>
                    <div style={{ fontWeight: 'bold', color: '#111827' }}>{details.maxAmount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>補助率</div>
                    <div style={{ fontWeight: 'bold', color: '#111827' }}>{details.subsidyRate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>募集時期</div>
                    <div style={{ fontWeight: 'bold', color: '#111827' }}>{details.deadline}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>審査期間</div>
                    <div style={{ fontWeight: 'bold', color: '#111827' }}>{details.processingTime}</div>
                  </div>
                </div>

                {/* 特徴 */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>主な特徴</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {details.features.map((feature, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          color: '#374151',
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          border: '1px solid rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 選択ボタン */}
                <button
                  style={{
                    ...styles.button.primary,
                    width: '100%',
                    justifyContent: 'center',
                    backgroundColor: index === 0 ? '#2563eb' : '#6b7280',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  <span>この補助金で申請を進める</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ナビゲーション */}
      <div style={{ ...styles.flex.between, marginTop: '32px' }}>
        <button
          onClick={onBack}
          style={styles.button.secondary}
        >
          ← 質問に戻る
        </button>

        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '12px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Info size={16} color="#6b7280" />
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            複数の補助金に同時申請も可能です
          </span>
        </div>
      </div>
    </div>
  );
};

export default SubsidySelectionScreen;