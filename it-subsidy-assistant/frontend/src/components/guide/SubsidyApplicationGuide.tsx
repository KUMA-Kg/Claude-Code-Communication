import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface SubsidyGuideData {
  id: string;
  name: string;
  totalDays: string;
  preparationDays: string;
  reviewDays: string;
  color: string;
  steps: Array<{
    id: number;
    title: string;
    duration: string;
    description: string;
    icon: string;
  }>;
  documents: Array<{
    name: string;
    source: string;
    duration: string;
    notes: string;
    required: boolean;
  }>;
  importantPoints: string[];
}

const subsidyData: SubsidyGuideData[] = [
  {
    id: 'it-introduction',
    name: 'IT導入補助金2025',
    totalDays: '6-10ヶ月',
    preparationDays: '15-17日',
    reviewDays: '30-60日',
    color: '#2563eb',
    steps: [
      {
        id: 1,
        title: 'IT導入支援事業者選定',
        duration: '3-5日',
        description: '認定されたIT導入支援事業者を選択し、相談・打ち合わせを実施',
        icon: '👥'
      },
      {
        id: 2,
        title: 'ITツール選定',
        duration: '2-3日',
        description: '事前登録されたITツールから自社に最適なものを選択',
        icon: '💻'
      },
      {
        id: 3,
        title: '申請準備',
        duration: '5-7日',
        description: '実施内容説明書、価格説明書、事業計画の作成',
        icon: '📋'
      },
      {
        id: 4,
        title: '電子申請',
        duration: '1-2日',
        description: 'IT事業者ポータルでの電子申請実施',
        icon: '📤'
      },
      {
        id: 5,
        title: '交付決定',
        duration: '30-60日',
        description: '審査結果の通知と交付決定',
        icon: '✅'
      }
    ],
    documents: [
      { name: '履歴事項全部証明書', source: '法務局', duration: '即日-3日', notes: '発行3ヶ月以内', required: true },
      { name: '納税証明書（その1,その2）', source: '税務署', duration: '即日-1週間', notes: '直近のもの', required: true },
      { name: '決算書（2期分）', source: '自社保管', duration: '-', notes: '貸借対照表、損益計算書', required: true },
      { name: 'gBizIDプライム', source: 'オンライン', duration: '2-3週間', notes: '事前取得必須', required: true }
    ],
    importantPoints: [
      'IT導入支援事業者が主導して申請',
      'ITツールは事前登録されたものから選択',
      '交付決定前の発注・契約・支払いは補助対象外'
    ]
  },
  {
    id: 'manufacturing',
    name: 'ものづくり補助金（第20次）',
    totalDays: '10-14ヶ月',
    preparationDays: '44-45日',
    reviewDays: '60-90日',
    color: '#dc2626',
    steps: [
      {
        id: 1,
        title: '事業計画策定',
        duration: '14-21日',
        description: '革新性のある事業計画書の作成・検討',
        icon: '📊'
      },
      {
        id: 2,
        title: '見積取得',
        duration: '5-7日',
        description: '設備・システムの見積書取得（相見積必須）',
        icon: '💰'
      },
      {
        id: 3,
        title: '書類準備',
        duration: '7-10日',
        description: '申請書類の収集・整理',
        icon: '📄'
      },
      {
        id: 4,
        title: '加点要素準備',
        duration: '3-5日',
        description: '事業継続力強化計画等の加点要素準備',
        icon: '⭐'
      },
      {
        id: 5,
        title: '電子申請',
        duration: '1-2日',
        description: 'GビズIDを使用した電子申請',
        icon: '📤'
      },
      {
        id: 6,
        title: '採択通知',
        duration: '60-90日',
        description: '審査結果の発表',
        icon: '🎯'
      }
    ],
    documents: [
      { name: '履歴事項全部証明書', source: '法務局', duration: '即日-3日', notes: '発行3ヶ月以内', required: true },
      { name: '決算書（直近2期分）', source: '自社保管', duration: '-', notes: '個人は確定申告書', required: true },
      { name: '見積書（相見積）', source: '取引先', duration: '3-7日', notes: '50万円以上は相見積必須', required: true },
      { name: 'GビズIDプライム', source: 'オンライン', duration: '2-3週間', notes: '事前取得必須', required: true },
      { name: '事業継続力強化計画認定書', source: '経済産業局', duration: '1-2ヶ月', notes: '加点要素', required: false }
    ],
    importantPoints: [
      '事業計画書の革新性が最重要',
      '付加価値額年率3%以上の向上が必須',
      '交付決定後に発注・契約'
    ]
  },
  {
    id: 'sustainability',
    name: '小規模事業者持続化補助金（第17回）',
    totalDays: '8-12ヶ月',
    preparationDays: '33日',
    reviewDays: '60-90日',
    color: '#059669',
    steps: [
      {
        id: 1,
        title: '商工会相談',
        duration: '3-5日',
        description: '商工会/商工会議所への相談・打ち合わせ',
        icon: '🏢'
      },
      {
        id: 2,
        title: '経営計画作成',
        duration: '7-10日',
        description: '経営計画書・補助事業計画書の作成',
        icon: '📈'
      },
      {
        id: 3,
        title: '事業支援計画書',
        duration: '3-5日',
        description: '商工会/商工会議所での事業支援計画書発行',
        icon: '📜'
      },
      {
        id: 4,
        title: '見積取得',
        duration: '3-5日',
        description: '補助対象経費の見積書取得',
        icon: '💵'
      },
      {
        id: 5,
        title: '書類準備',
        duration: '5-7日',
        description: 'その他必要書類の準備・整理',
        icon: '📁'
      },
      {
        id: 6,
        title: '電子申請',
        duration: '1日',
        description: 'Jグランツでの電子申請',
        icon: '📤'
      },
      {
        id: 7,
        title: '採択通知',
        duration: '60-90日',
        description: '審査結果の発表',
        icon: '📢'
      }
    ],
    documents: [
      { name: '事業支援計画書', source: '商工会/商工会議所', duration: '3-5日', notes: '発行に相談必須', required: true },
      { name: '見積書', source: '取引先', duration: '3-7日', notes: '税抜10万円以上', required: true },
      { name: 'GビズIDプライム', source: 'オンライン', duration: '2-3週間', notes: '電子申請に必須', required: true },
      { name: '決算書・確定申告書', source: '自社保管', duration: '-', notes: '直近1期分', required: true },
      { name: '履歴事項全部証明書', source: '法務局', duration: '即日-3日', notes: '法人のみ・発行3ヶ月以内', required: false }
    ],
    importantPoints: [
      '商工会/商工会議所の支援が必須',
      '従業員数制限（商業・サービス業5人以下、製造業等20人以下）',
      '創業枠は専用様式を使用'
    ]
  }
];

export const SubsidyApplicationGuide: React.FC = () => {
  const [selectedSubsidy, setSelectedSubsidy] = useState<string>(subsidyData[0].id);
  const [activeTab, setActiveTab] = useState<'process' | 'documents' | 'timeline'>('process');

  const currentSubsidy = subsidyData.find(s => s.id === selectedSubsidy) || subsidyData[0];

  const renderProcessFlow = () => (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <h3 className="heading-3" style={{ marginBottom: 'var(--spacing-lg)', color: currentSubsidy.color }}>
        申請ステップ（全{currentSubsidy.steps.length}ステップ）
      </h3>
      <div style={{
        display: 'grid',
        gap: 'var(--spacing-md)',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
      }}>
        {currentSubsidy.steps.map((step, index) => (
          <div key={step.id} className="card" style={{
            padding: 'var(--spacing-lg)',
            border: `2px solid ${currentSubsidy.color}20`,
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: 'var(--spacing-md)',
              background: currentSubsidy.color,
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {step.id}
            </div>
            <div style={{
              fontSize: '2rem',
              textAlign: 'center',
              marginBottom: 'var(--spacing-sm)'
            }}>
              {step.icon}
            </div>
            <h4 className="heading-4" style={{ color: currentSubsidy.color, marginBottom: 'var(--spacing-sm)' }}>
              {step.title}
            </h4>
            <div className="body-small" style={{
              background: `${currentSubsidy.color}10`,
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              borderRadius: 'var(--border-radius-sm)',
              marginBottom: 'var(--spacing-sm)',
              color: currentSubsidy.color,
              fontWeight: 'bold'
            }}>
              期間: {step.duration}
            </div>
            <p className="body-medium" style={{ color: 'var(--color-neutral-700)' }}>
              {step.description}
            </p>
            {index < currentSubsidy.steps.length - 1 && (
              <div style={{
                position: 'absolute',
                right: '-20px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.5rem',
                color: currentSubsidy.color
              }}>
                →
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="card" style={{
        marginTop: 'var(--spacing-xl)',
        padding: 'var(--spacing-lg)',
        background: `${currentSubsidy.color}05`
      }}>
        <h4 className="heading-4" style={{ color: currentSubsidy.color, marginBottom: 'var(--spacing-md)' }}>
          ⚠️ 重要ポイント
        </h4>
        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)' }}>
          {currentSubsidy.importantPoints.map((point, index) => (
            <li key={index} className="body-medium" style={{ 
              marginBottom: 'var(--spacing-sm)',
              color: 'var(--color-neutral-700)'
            }}>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <h3 className="heading-3" style={{ marginBottom: 'var(--spacing-lg)', color: currentSubsidy.color }}>
        必要書類チェックリスト
      </h3>
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: `${currentSubsidy.color}10` }}>
              <th style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-neutral-200)', color: currentSubsidy.color }}>書類名</th>
              <th style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-neutral-200)', color: currentSubsidy.color }}>取得場所</th>
              <th style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-neutral-200)', color: currentSubsidy.color }}>取得期間</th>
              <th style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-neutral-200)', color: currentSubsidy.color }}>備考</th>
              <th style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-neutral-200)', color: currentSubsidy.color }}>必須</th>
            </tr>
          </thead>
          <tbody>
            {currentSubsidy.documents.map((doc, index) => (
              <tr key={index} style={{ background: index % 2 === 0 ? 'transparent' : 'var(--color-neutral-50)' }}>
                <td style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-neutral-200)' }}>
                  <span className="body-medium" style={{ fontWeight: doc.required ? 'bold' : 'normal' }}>
                    {doc.name}
                  </span>
                </td>
                <td style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-neutral-200)' }}>
                  <span className="body-small">{doc.source}</span>
                </td>
                <td style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-neutral-200)' }}>
                  <span className="body-small">{doc.duration}</span>
                </td>
                <td style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-neutral-200)' }}>
                  <span className="body-small">{doc.notes}</span>
                </td>
                <td style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-neutral-200)', textAlign: 'center' }}>
                  <span style={{ 
                    fontSize: '1.2rem',
                    color: doc.required ? '#059669' : '#6b7280'
                  }}>
                    {doc.required ? '✅' : '⭕'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <h3 className="heading-3" style={{ marginBottom: 'var(--spacing-lg)', color: currentSubsidy.color }}>
        申請から着金までのタイムライン
      </h3>
      <div style={{ display: 'flex', gap: 'var(--spacing-xl)', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div className="card" style={{ 
          padding: 'var(--spacing-md)', 
          textAlign: 'center',
          background: `${currentSubsidy.color}10`
        }}>
          <div className="body-small" style={{ color: currentSubsidy.color }}>総期間</div>
          <div className="heading-4" style={{ color: currentSubsidy.color }}>{currentSubsidy.totalDays}</div>
        </div>
        <div className="card" style={{ 
          padding: 'var(--spacing-md)', 
          textAlign: 'center',
          background: 'var(--color-warning-50)'
        }}>
          <div className="body-small" style={{ color: 'var(--color-warning-600)' }}>準備期間</div>
          <div className="heading-4" style={{ color: 'var(--color-warning-600)' }}>{currentSubsidy.preparationDays}</div>
        </div>
        <div className="card" style={{ 
          padding: 'var(--spacing-md)', 
          textAlign: 'center',
          background: 'var(--color-success-50)'
        }}>
          <div className="body-small" style={{ color: 'var(--color-success-600)' }}>審査期間</div>
          <div className="heading-4" style={{ color: 'var(--color-success-600)' }}>{currentSubsidy.reviewDays}</div>
        </div>
      </div>
      
      <div className="card" style={{
        padding: 'var(--spacing-lg)',
        background: 'var(--color-info-50)',
        border: '1px solid var(--color-info-200)'
      }}>
        <h4 className="heading-4" style={{ color: 'var(--color-info-600)', marginBottom: 'var(--spacing-md)' }}>
          💰 重要：補助金は後払いです
        </h4>
        <p className="body-medium" style={{ color: 'var(--color-info-700)', marginBottom: 'var(--spacing-sm)' }}>
          事業実施時は自己資金での支払いが必要になります。十分なキャッシュフローの準備をお勧めします。
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <div className="body-small" style={{ 
            background: 'white', 
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--color-info-300)'
          }}>
            📋 事業実施 → 💰 自己資金支払い → 📄 実績報告 → ✅ 補助金振込
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--spacing-lg)' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="heading-1" style={{ 
          textAlign: 'center',
          marginBottom: 'var(--spacing-md)',
          color: 'var(--color-primary-900)'
        }}>
          補助金申請ガイド
        </h1>
        <p className="body-large" style={{ 
          textAlign: 'center',
          color: 'var(--color-neutral-600)',
          marginBottom: 'var(--spacing-xl)'
        }}>
          申請から着金まで、全工程を分かりやすく解説します
        </p>
      </div>

      {/* 補助金選択タブ */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--spacing-sm)', 
        marginBottom: 'var(--spacing-xl)',
        borderBottom: '1px solid var(--color-neutral-200)',
        overflowX: 'auto'
      }}>
        {subsidyData.map((subsidy) => (
          <Button
            key={subsidy.id}
            variant={selectedSubsidy === subsidy.id ? 'primary' : 'secondary'}
            onClick={() => setSelectedSubsidy(subsidy.id)}
            style={{
              borderRadius: 'var(--border-radius-md) var(--border-radius-md) 0 0',
              backgroundColor: selectedSubsidy === subsidy.id ? subsidy.color : undefined,
              borderColor: subsidy.color,
              color: selectedSubsidy === subsidy.id ? 'white' : subsidy.color,
              whiteSpace: 'nowrap'
            }}
          >
            {subsidy.name}
          </Button>
        ))}
      </div>

      {/* コンテンツタブ */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--spacing-sm)', 
        marginBottom: 'var(--spacing-lg)',
        borderBottom: '1px solid var(--color-neutral-200)'
      }}>
        {[
          { id: 'process', label: '申請ステップ', icon: '📋' },
          { id: 'documents', label: '必要書類', icon: '📄' },
          { id: 'timeline', label: 'タイムライン', icon: '⏰' }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'ghost'}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              backgroundColor: activeTab === tab.id ? currentSubsidy.color : undefined,
              color: activeTab === tab.id ? 'white' : currentSubsidy.color
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </Button>
        ))}
      </div>

      {/* コンテンツエリア */}
      <div className="card" style={{ minHeight: '500px' }}>
        {activeTab === 'process' && renderProcessFlow()}
        {activeTab === 'documents' && renderDocuments()}
        {activeTab === 'timeline' && renderTimeline()}
      </div>
    </div>
  );
};