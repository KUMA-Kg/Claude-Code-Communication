import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/modern-ui.css';

interface SubsidyInfo {
  id: string;
  name: string;
  description: string;
  maxAmount: string;
  subsidyRate: string;
  features: string[];
  targetBusiness: string;
  isActive?: boolean;
  publicNumber?: string;
  deadline?: string;
  status?: string;
}

export const SubsidyResults: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSubsidy, setSelectedSubsidy] = useState<string>('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isAnimating, setIsAnimating] = useState(true);

  const subsidies: Record<string, SubsidyInfo> = {
    'it-donyu': {
      id: 'it-donyu',
      name: 'IT導入補助金2025（第3次募集）',
      description: 'ITツール導入による生産性向上や業務効率化を支援',
      maxAmount: '450万円',
      subsidyRate: '最大3/4',
      features: [
        'クラウドサービスの利用料も対象',
        'ハードウェア購入費も補助対象',
        '賃上げ要件で補助率アップ'
      ],
      targetBusiness: '中小企業・小規模事業者',
      isActive: true,
      publicNumber: '第3次',
      deadline: '2025年7月18日'
    },
    'monozukuri': {
      id: 'monozukuri',
      name: 'ものづくり補助金（第20次公募）',
      description: '革新的な製品・サービス開発や生産プロセス改善を支援',
      maxAmount: '1,250万円',
      subsidyRate: '最大2/3',
      features: [
        '設備投資を伴う事業に最適',
        '試作品開発費も対象',
        '専門家のサポート付き'
      ],
      targetBusiness: '中小企業・小規模事業者',
      isActive: true,
      publicNumber: '第20次',
      deadline: '2025年7月25日'
    },
    'jizokuka': {
      id: 'jizokuka',
      name: '小規模事業者持続化補助金（第17回公募予定）',
      description: '販路開拓や業務効率化など小規模事業者の取り組みを支援',
      maxAmount: '200万円',
      subsidyRate: '最大3/4',
      features: [
        '広告宣伝費も補助対象',
        'ホームページ制作費も対象',
        '申請書類が比較的シンプル'
      ],
      targetBusiness: '小規模事業者',
      isActive: false,
      publicNumber: '第17回',
      deadline: '2025年6月13日（予定）',
      status: '2025年3月4日開始予定'
    },
    'jigyou-saikouchiku': {
      id: 'jigyou-saikouchiku',
      name: '事業再構築補助金（第13回・最終公募）',
      description: 'ポストコロナ時代の経済社会の変化に対応し、成長分野への大胆な事業再構築を支援',
      maxAmount: '最大1億円（通常枠）',
      subsidyRate: '中小1/2、中堅1/3',
      features: [
        '成長枠（通常類型）：新市場進出・市場拡大を支援',
        'グリーン成長枠（GX類型）：グリーン分野での事業再構築',
        '付加価値額を年3〜4%以上増加が必須要件',
        '認定経営革新等支援機関の事業計画確認が必須'
      ],
      targetBusiness: '中小企業・中堅企業',
      isActive: false,
      publicNumber: '第13回（最終）',
      deadline: '2025年3月26日（終了）',
      status: '募集終了'
    }
  };

  useEffect(() => {
    // 診断結果を取得
    const savedScores = sessionStorage.getItem('subsidyScores');
    if (savedScores) {
      setScores(JSON.parse(savedScores));
    }

    // アニメーション制御
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  }, []);

  const sortedSubsidies = Object.keys(subsidies).sort((a, b) => {
    const subsidyA = subsidies[a];
    const subsidyB = subsidies[b];
    
    // まずアクティブステータスで並び替え（アクティブなものが上）
    if (subsidyA.isActive !== subsidyB.isActive) {
      return subsidyA.isActive === false ? 1 : -1;
    }
    
    // 同じアクティブステータスの場合はスコアで並び替え
    return (scores[b] || 0) - (scores[a] || 0);
  });

  const handleSelectSubsidy = (subsidyId: string) => {
    const subsidy = subsidies[subsidyId];
    
    // 募集停止中の補助金の場合は警告表示
    if (subsidy.isActive === false) {
      if (subsidyId === 'jizokuka') {
        alert('小規模事業者持続化補助金は2025年3月4日から募集開始予定です。開始までお待ちください。');
      } else {
        alert('申し訳ございません。この補助金は現在募集を停止しております。他の補助金をご検討ください。');
      }
      return;
    }
    
    setSelectedSubsidy(subsidyId);
    sessionStorage.setItem('selectedSubsidy', subsidyId);
    
    // 次の画面へ遷移
    setTimeout(() => {
      navigate(`/document-requirements/${subsidyId}`);
    }, 300);
  };

  const getMatchLevel = (score: number) => {
    if (score >= 80) return { label: '最適', color: '#4facfe' };
    if (score >= 60) return { label: '適合', color: '#667eea' };
    return { label: '利用可能', color: '#a8a8a8' };
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            fontSize: '60px', 
            marginBottom: '20px',
            animation: isAnimating ? 'bounceIn 0.5s' : 'none'
          }}>
            🎯
          </div>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginBottom: '12px'
          }}>
            診断結果
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: 'var(--text-secondary)' 
          }}>
            あなたの事業に最適な補助金をご提案します
          </p>
        </div>

        {/* 結果カード */}
        <div style={{ marginBottom: '40px' }}>
          {sortedSubsidies.map((subsidyId, index) => {
            const subsidy = subsidies[subsidyId];
            const score = scores[subsidyId] || 0;
            const matchLevel = getMatchLevel(score);
            
            return (
              <div
                key={subsidyId}
                className={`subsidy-card ${selectedSubsidy === subsidyId ? 'selected' : ''} ${subsidy.isActive === false ? 'inactive' : ''}`}
                onClick={() => handleSelectSubsidy(subsidyId)}
                style={{
                  marginBottom: '20px',
                  animation: isAnimating ? `slideUp 0.5s ${index * 0.1}s both` : 'none',
                  position: 'relative',
                  opacity: subsidy.isActive === false ? 0.5 : 1,
                  filter: subsidy.isActive === false ? 'grayscale(70%)' : 'none',
                  cursor: subsidy.isActive === false ? 'not-allowed' : 'pointer'
                }}
              >
                {/* ランキング表示・募集状況 */}
                {subsidy.isActive === false ? (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '20px',
                    background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                    color: 'white',
                    padding: '4px 16px',
                    borderRadius: '100px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: 'var(--shadow-md)'
                  }}>
                    🚫 募集停止中
                  </div>
                ) : index === 0 && sortedSubsidies.filter(id => subsidies[id].isActive !== false).indexOf(subsidyId) === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '20px',
                    background: 'var(--warning-gradient)',
                    color: 'white',
                    padding: '4px 16px',
                    borderRadius: '100px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: 'var(--shadow-md)'
                  }}>
                    👑 おすすめ
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold',
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      {subsidy.name}
                    </h3>
                    <p style={{ 
                      color: 'var(--text-secondary)',
                      marginBottom: '8px'
                    }}>
                      {subsidy.description}
                    </p>
                    
                    {/* 締切日表示 */}
                    {subsidy.deadline && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        background: subsidy.isActive === false ? 'rgba(156, 163, 175, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '100px',
                        marginBottom: '16px',
                        fontSize: '14px',
                        color: subsidy.isActive === false ? '#6b7280' : '#dc2626',
                        fontWeight: '600'
                      }}>
                        <span style={{ fontSize: '16px' }}>📅</span>
                        {subsidy.isActive === false && subsidy.status ? 
                          subsidy.status : 
                          `締切: ${subsidy.deadline}`
                        }
                      </div>
                    )}

                    {/* 特徴 */}
                    <div style={{ marginBottom: '20px' }}>
                      {subsidy.features.map((feature, idx) => (
                        <div 
                          key={idx}
                          style={{ 
                            display: 'inline-block',
                            background: 'var(--bg-secondary)',
                            padding: '6px 12px',
                            borderRadius: '100px',
                            fontSize: '14px',
                            marginRight: '8px',
                            marginBottom: '8px',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          ✓ {feature}
                        </div>
                      ))}
                    </div>

                    {/* 補助金情報 */}
                    <div style={{ display: 'flex', gap: '40px' }}>
                      <div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: 'var(--text-muted)',
                          marginBottom: '4px'
                        }}>
                          最大補助額
                        </div>
                        <div style={{ 
                          fontSize: '28px', 
                          fontWeight: 'bold',
                          color: 'var(--primary-color)'
                        }}>
                          {subsidy.maxAmount}
                        </div>
                      </div>
                      <div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: 'var(--text-muted)',
                          marginBottom: '4px'
                        }}>
                          補助率
                        </div>
                        <div style={{ 
                          fontSize: '28px', 
                          fontWeight: 'bold',
                          color: 'var(--primary-color)'
                        }}>
                          {subsidy.subsidyRate}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* マッチ度 */}
                  <div style={{ 
                    textAlign: 'center',
                    minWidth: '120px'
                  }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      margin: '0 auto 8px',
                      position: 'relative'
                    }}>
                      <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#f0f0f0"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke={matchLevel.color}
                          strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 45 * score / 100} ${2 * Math.PI * 45}`}
                          strokeLinecap="round"
                          style={{
                            transition: 'stroke-dasharray 1s ease-out',
                            animation: isAnimating ? 'drawCircle 1s ease-out' : 'none'
                          }}
                        />
                      </svg>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '28px',
                        fontWeight: 'bold',
                        color: matchLevel.color
                      }}>
                        {score}%
                      </div>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: matchLevel.color
                    }}>
                      {matchLevel.label}
                    </div>
                  </div>
                </div>

                {/* 選択ボタン */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      background: 'white',
                      color: 'var(--primary-color)',
                      border: '2px solid var(--primary-color)',
                      borderRadius: 'var(--border-radius)',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all var(--transition-normal)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/subsidy/${subsidyId}`);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--primary-color)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = 'var(--primary-color)';
                    }}
                  >
                    詳細を見る
                  </button>
                  <button
                    className="btn-gradient"
                    style={{
                      flex: 2,
                      fontSize: '18px',
                      opacity: subsidy.isActive === false ? 0.5 : 1,
                      cursor: subsidy.isActive === false ? 'not-allowed' : 'pointer',
                      filter: subsidy.isActive === false ? 'grayscale(50%)' : 'none'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSubsidy(subsidyId);
                    }}
                    disabled={subsidy.isActive === false}
                  >
                    {subsidy.isActive === false ? '募集停止中' : 'この補助金で申請を進める →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 戻るボタン */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 32px',
              background: 'white',
              color: 'var(--text-primary)',
              border: '2px solid var(--bg-tertiary)',
              borderRadius: 'var(--border-radius)',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)'
            }}
          >
            診断をやり直す
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes drawCircle {
          from {
            stroke-dasharray: 0 ${2 * Math.PI * 45};
          }
        }
      `}</style>
    </div>
  );
};