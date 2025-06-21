import React, { useState } from 'react';
import { SubsidyApplicationGuide } from '../components/guide/SubsidyApplicationGuide';
import { SubsidyFrameSelector } from '../components/guide/SubsidyFrameSelector';
import { Button } from '../components/ui/Button';

type GuideMode = 'overview' | 'frame-selection' | 'process-guide' | 'timeline';

export const ApplicationGuidePage: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<GuideMode>('overview');
  const [selectedSubsidyType, setSelectedSubsidyType] = useState<'it-introduction' | 'manufacturing' | 'sustainability'>('it-introduction');

  const renderOverview = () => (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--spacing-xl)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="heading-1" style={{ 
          color: 'var(--color-primary-900)',
          marginBottom: 'var(--spacing-md)'
        }}>
          補助金申請ガイド
        </h1>
        <p className="body-large" style={{ 
          color: 'var(--color-neutral-600)',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          申請から着金まで、全工程をサポートします。<br />
          最適な申請枠の判定から必要書類の準備まで、ステップバイステップでご案内します。
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        {/* 申請枠判定カード */}
        <div className="card" style={{ 
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)',
          border: '2px solid var(--color-primary-200)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>🎯</div>
          <h3 className="heading-3" style={{ 
            color: 'var(--color-primary-900)',
            marginBottom: 'var(--spacing-md)'
          }}>
            申請枠判定
          </h3>
          <p className="body-medium" style={{ 
            color: 'var(--color-primary-700)',
            marginBottom: 'var(--spacing-lg)',
            lineHeight: 1.5
          }}>
            簡単な質問に答えるだけで、あなたに最適な申請枠を判定します。
            最小の質問数で最短ルートをご提案。
          </p>
          <Button 
            variant="primary" 
            size="lg"
            onClick={() => setCurrentMode('frame-selection')}
            style={{ width: '100%' }}
          >
            診断を始める
          </Button>
        </div>

        {/* 申請プロセスガイドカード */}
        <div className="card" style={{ 
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--color-success-50) 0%, var(--color-success-100) 100%)',
          border: '2px solid var(--color-success-200)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>📋</div>
          <h3 className="heading-3" style={{ 
            color: 'var(--color-success-900)',
            marginBottom: 'var(--spacing-md)'
          }}>
            申請プロセスガイド
          </h3>
          <p className="body-medium" style={{ 
            color: 'var(--color-success-700)',
            marginBottom: 'var(--spacing-lg)',
            lineHeight: 1.5
          }}>
            3つの補助金の申請ステップと必要書類を詳しく解説。
            準備期間や取得方法も分かりやすく説明。
          </p>
          <Button 
            variant="primary" 
            size="lg"
            onClick={() => setCurrentMode('process-guide')}
            style={{ 
              width: '100%',
              backgroundColor: 'var(--color-success-600)',
              borderColor: 'var(--color-success-600)'
            }}
          >
            ガイドを見る
          </Button>
        </div>

        {/* タイムライン・着金予定カード */}
        <div className="card" style={{ 
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--color-warning-50) 0%, var(--color-warning-100) 100%)',
          border: '2px solid var(--color-warning-200)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>⏰</div>
          <h3 className="heading-3" style={{ 
            color: 'var(--color-warning-900)',
            marginBottom: 'var(--spacing-md)'
          }}>
            着金スケジュール
          </h3>
          <p className="body-medium" style={{ 
            color: 'var(--color-warning-700)',
            marginBottom: 'var(--spacing-lg)',
            lineHeight: 1.5
          }}>
            申請から着金まで6-14ヶ月の全工程を可視化。
            キャッシュフロー計画に役立つタイムライン。
          </p>
          <Button 
            variant="primary" 
            size="lg"
            onClick={() => setCurrentMode('timeline')}
            style={{ 
              width: '100%',
              backgroundColor: 'var(--color-warning-600)',
              borderColor: 'var(--color-warning-600)'
            }}
          >
            タイムラインを見る
          </Button>
        </div>
      </div>

      {/* 補助金選択セクション */}
      <div className="card" style={{ 
        padding: 'var(--spacing-xl)',
        background: 'var(--color-neutral-50)'
      }}>
        <h3 className="heading-3" style={{ 
          textAlign: 'center',
          color: 'var(--color-neutral-900)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          対象補助金を選択
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--spacing-md)'
        }}>
          {[
            {
              id: 'it-introduction',
              name: 'IT導入補助金2025',
              description: 'ITツールの導入による生産性向上',
              color: '#2563eb',
              amount: '最大450万円',
              period: '6-10ヶ月'
            },
            {
              id: 'manufacturing',
              name: 'ものづくり補助金',
              description: '革新的な設備・システム導入',
              color: '#dc2626',
              amount: '最大3,000万円',
              period: '10-14ヶ月'
            },
            {
              id: 'sustainability',
              name: '小規模事業者持続化補助金',
              description: '販路開拓・業務効率化',
              color: '#059669',
              amount: '最大200万円',
              period: '8-12ヶ月'
            }
          ].map((subsidy) => (
            <div
              key={subsidy.id}
              onClick={() => setSelectedSubsidyType(subsidy.id as any)}
              className="card"
              style={{
                padding: 'var(--spacing-lg)',
                cursor: 'pointer',
                border: selectedSubsidyType === subsidy.id 
                  ? `2px solid ${subsidy.color}` 
                  : '2px solid var(--color-neutral-200)',
                background: selectedSubsidyType === subsidy.id 
                  ? `${subsidy.color}10` 
                  : 'white',
                transition: 'all 0.2s ease'
              }}
            >
              <h4 className="heading-4" style={{ 
                color: subsidy.color,
                marginBottom: 'var(--spacing-sm)'
              }}>
                {subsidy.name}
              </h4>
              <p className="body-small" style={{ 
                color: 'var(--color-neutral-600)',
                marginBottom: 'var(--spacing-md)'
              }}>
                {subsidy.description}
              </p>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span className="body-small" style={{ 
                  background: `${subsidy.color}20`,
                  color: subsidy.color,
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontWeight: 'bold'
                }}>
                  {subsidy.amount}
                </span>
                <span className="body-small" style={{ color: 'var(--color-neutral-600)' }}>
                  期間: {subsidy.period}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderModeContent = () => {
    switch (currentMode) {
      case 'frame-selection':
        return <SubsidyFrameSelector subsidyType={selectedSubsidyType} />;
      case 'process-guide':
      case 'timeline':
        return <SubsidyApplicationGuide />;
      default:
        return renderOverview();
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-neutral-50)' }}>
      {/* ナビゲーションヘッダー */}
      {currentMode !== 'overview' && (
        <div style={{ 
          background: 'white',
          borderBottom: '1px solid var(--color-neutral-200)',
          padding: 'var(--spacing-md) 0'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            padding: '0 var(--spacing-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)'
          }}>
            <Button 
              variant="ghost" 
              onClick={() => setCurrentMode('overview')}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
            >
              ← ガイドTOP
            </Button>
            <div style={{ 
              height: '20px', 
              width: '1px', 
              background: 'var(--color-neutral-300)' 
            }} />
            <span className="body-medium" style={{ color: 'var(--color-neutral-600)' }}>
              {currentMode === 'frame-selection' && '申請枠判定'}
              {currentMode === 'process-guide' && '申請プロセスガイド'}
              {currentMode === 'timeline' && '着金スケジュール'}
            </span>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      {renderModeContent()}
    </div>
  );
};