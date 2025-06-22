import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Building, 
  FileText,
  CheckCircle,
  Users,
  TrendingUp
} from 'lucide-react';

// 補助金の詳細データ
const subsidyDetails: Record<string, any> = {
  'it-donyu': {
    id: 'it-donyu',
    name: 'IT導入補助金2025',
    category: 'IT・デジタル化',
    description: 'ITツール導入による生産性向上や業務効率化を支援する補助金です。クラウドサービスやハードウェアの導入費用も対象となります。',
    subsidyAmount: { min: 300000, max: 4500000 },
    subsidyRate: 0.75,
    applicationPeriod: { 
      start: '2025-01-15', 
      end: '2025-12-20' 
    },
    organizer: '経済産業省・中小企業庁',
    eligibleCompanies: ['中小企業', '小規模事業者', '個人事業主'],
    eligibleExpenses: [
      'ソフトウェア費',
      'クラウド利用費',
      'ハードウェア購入費',
      '導入コンサルティング費',
      '保守・サポート費'
    ],
    requirements: [
      '中小企業・小規模事業者であること',
      'IT導入支援事業者と連携すること',
      '生産性向上計画を策定すること',
      '補助事業終了後も継続的に効果測定を行うこと'
    ],
    applicationFlow: [
      'IT導入支援事業者の選定',
      'ITツールの選定・見積取得',
      '申請書類の作成・提出',
      '審査・採択通知',
      'ITツール導入・支払い',
      '実績報告書の提出',
      '補助金の受領'
    ],
    documents: [
      '事業計画書',
      '見積書',
      '会社概要',
      '決算書（直近2期分）',
      '労働者名簿',
      '賃金台帳'
    ],
    contactInfo: {
      phone: '0570-666-424',
      email: 'it-hojo@meti.go.jp',
      website: 'https://www.it-hojo.jp/'
    }
  },
  'monozukuri': {
    id: 'monozukuri',
    name: 'ものづくり補助金',
    category: '設備投資・技術開発',
    description: '革新的な製品・サービス開発や生産プロセス改善のための設備投資を支援する補助金です。',
    subsidyAmount: { min: 1000000, max: 12500000 },
    subsidyRate: 0.67,
    applicationPeriod: { 
      start: '2025-02-01', 
      end: '2025-11-30' 
    },
    organizer: '中小企業庁',
    eligibleCompanies: ['中小企業', '小規模事業者'],
    eligibleExpenses: [
      '機械装置・システム構築費',
      '技術導入費',
      '専門家経費',
      '運搬費',
      'クラウドサービス利用費'
    ],
    requirements: [
      '中小企業・小規模事業者であること',
      '事業計画期間において給与支給総額を年率平均1.5%以上増加',
      '事業場内最低賃金を地域別最低賃金+30円以上の水準にする',
      '付加価値額を年率平均3%以上増加'
    ],
    applicationFlow: [
      '公募要領の確認',
      '事業計画書の作成',
      '電子申請システムでの申請',
      '審査・採択通知',
      '交付申請・交付決定',
      '事業実施・設備導入',
      '実績報告・補助金受領'
    ],
    documents: [
      '事業計画書',
      '決算書（直近2期分）',
      '法人税確定申告書',
      '労働者名簿',
      '賃金台帳',
      '見積書（相見積もり含む）'
    ],
    contactInfo: {
      phone: '050-8880-4053',
      email: 'monozukuri@pasona.co.jp',
      website: 'https://portal.monodukuri-hojo.jp/'
    }
  },
  'jizokuka': {
    id: 'jizokuka',
    name: '小規模事業者持続化補助金',
    category: '販路開拓・業務効率化',
    description: '小規模事業者の販路開拓や業務効率化の取り組みを支援する補助金です。比較的少額から申請可能です。',
    subsidyAmount: { min: 500000, max: 2000000 },
    subsidyRate: 0.75,
    applicationPeriod: { 
      start: '2025-03-01', 
      end: '2025-10-31' 
    },
    organizer: '日本商工会議所',
    eligibleCompanies: ['小規模事業者'],
    eligibleExpenses: [
      '広報費（チラシ・HP制作等）',
      '開発費',
      '機械装置等費',
      '展示会等出展費',
      '委託・外注費'
    ],
    requirements: [
      '小規模事業者であること（従業員数5人以下等）',
      '商工会議所・商工会の支援を受けること',
      '経営計画書を作成すること',
      '補助事業終了後も販路開拓の取組を継続すること'
    ],
    applicationFlow: [
      '商工会議所・商工会への相談',
      '経営計画書・補助事業計画書の作成',
      '商工会議所・商工会の確認書取得',
      '申請書類の提出',
      '審査・採択通知',
      '事業実施',
      '実績報告・補助金受領'
    ],
    documents: [
      '経営計画書',
      '補助事業計画書',
      '商工会議所・商工会の確認書',
      '貸借対照表・損益計算書',
      '見積書',
      '従業員数を証明する書類'
    ],
    contactInfo: {
      phone: '03-6632-1502',
      email: 'jizokuka@jcci.or.jp',
      website: 'https://r3.jizokukahojokin.info/'
    }
  }
};

export const SimpleSubsidyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const subsidy = id ? subsidyDetails[id] : null;

  if (!subsidy) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '40px 20px'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
            補助金が見つかりませんでした
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            指定された補助金の情報を取得できませんでした
          </p>
          <button
            onClick={() => navigate('/subsidy-results')}
            className="btn-gradient"
            style={{ padding: '12px 24px' }}
          >
            補助金一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#4b5563'
          }}
        >
          <ArrowLeft size={16} />
          戻る
        </button>

        <div style={{ 
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
          marginBottom: '24px'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <span style={{
              display: 'inline-block',
              background: '#dbeafe',
              color: '#1e40af',
              padding: '6px 16px',
              borderRadius: '100px',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '16px'
            }}>
              {subsidy.category}
            </span>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '12px'
            }}>
              {subsidy.name}
            </h1>
            <p style={{ 
              fontSize: '18px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              {subsidy.description}
            </p>
          </div>

          {/* 基本情報 */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <DollarSign size={20} color="#6b7280" />
              <div>
                <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  補助金額
                </h3>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                  {formatAmount(subsidy.subsidyAmount.min)} ～ {formatAmount(subsidy.subsidyAmount.max)}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <TrendingUp size={20} color="#6b7280" />
              <div>
                <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  補助率
                </h3>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                  最大{Math.round(subsidy.subsidyRate * 100)}%
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <Calendar size={20} color="#6b7280" />
              <div>
                <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  申請期間
                </h3>
                <p style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                  {formatDate(subsidy.applicationPeriod.start)}<br />
                  ～ {formatDate(subsidy.applicationPeriod.end)}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <Building size={20} color="#6b7280" />
              <div>
                <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  主催組織
                </h3>
                <p style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                  {subsidy.organizer}
                </p>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div style={{ 
            display: 'flex',
            gap: '16px',
            padding: '24px',
            background: '#f3f4f6',
            borderRadius: '12px',
            marginTop: '32px'
          }}>
            <button
              onClick={() => {
                sessionStorage.setItem('selectedSubsidy', subsidy.id);
                navigate(`/document-requirements/${subsidy.id}`);
              }}
              className="btn-gradient"
              style={{
                flex: 1,
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: '600'
              }}
            >
              <FileText size={20} style={{ marginRight: '8px', display: 'inline' }} />
              この補助金で申請を進める
            </button>
          </div>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {/* 対象企業 */}
          <div className="card-modern" style={{ padding: '32px' }}>
            <h2 style={{ 
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Users size={24} />
              対象企業
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {subsidy.eligibleCompanies.map((company: string, index: number) => (
                <span
                  key={index}
                  style={{
                    background: '#d1fae5',
                    color: '#065f46',
                    padding: '6px 16px',
                    borderRadius: '100px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {company}
                </span>
              ))}
            </div>
          </div>

          {/* 対象経費 */}
          <div className="card-modern" style={{ padding: '32px' }}>
            <h2 style={{ 
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <DollarSign size={24} />
              対象経費
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {subsidy.eligibleExpenses.map((expense: string, index: number) => (
                <li key={index} style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  color: '#4b5563'
                }}>
                  <CheckCircle size={16} color="#10b981" />
                  {expense}
                </li>
              ))}
            </ul>
          </div>

          {/* 申請要件 */}
          <div className="card-modern" style={{ padding: '32px' }}>
            <h2 style={{ 
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FileText size={24} />
              申請要件
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {subsidy.requirements.map((requirement: string, index: number) => (
                <li key={index} style={{ 
                  display: 'flex',
                  alignItems: 'start',
                  gap: '8px',
                  marginBottom: '12px',
                  color: '#4b5563',
                  lineHeight: '1.5'
                }}>
                  <CheckCircle size={16} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
                  {requirement}
                </li>
              ))}
            </ul>
          </div>

          {/* 必要書類 */}
          <div className="card-modern" style={{ padding: '32px' }}>
            <h2 style={{ 
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FileText size={24} />
              必要書類
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {subsidy.documents.map((document: string, index: number) => (
                <li key={index} style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  color: '#4b5563'
                }}>
                  <FileText size={16} color="#6b7280" />
                  {document}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 申請の流れ */}
        <div className="card-modern" style={{ marginTop: '24px', padding: '32px' }}>
          <h2 style={{ 
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '24px'
          }}>
            申請の流れ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {subsidy.applicationFlow.map((step: string, index: number) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>
                <p style={{ margin: 0, color: '#4b5563' }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* お問い合わせ */}
        {subsidy.contactInfo && (
          <div className="card-modern" style={{ marginTop: '24px', padding: '32px' }}>
            <h2 style={{ 
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '20px'
            }}>
              お問い合わせ
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {subsidy.contactInfo.phone && (
                <p style={{ margin: 0, color: '#4b5563' }}>
                  📞 電話: <a href={`tel:${subsidy.contactInfo.phone}`} style={{ color: '#2563eb' }}>
                    {subsidy.contactInfo.phone}
                  </a>
                </p>
              )}
              {subsidy.contactInfo.email && (
                <p style={{ margin: 0, color: '#4b5563' }}>
                  ✉️ メール: <a href={`mailto:${subsidy.contactInfo.email}`} style={{ color: '#2563eb' }}>
                    {subsidy.contactInfo.email}
                  </a>
                </p>
              )}
              {subsidy.contactInfo.website && (
                <p style={{ margin: 0, color: '#4b5563' }}>
                  🌐 ウェブサイト: <a href={subsidy.contactInfo.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                    公式サイトを見る
                  </a>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};