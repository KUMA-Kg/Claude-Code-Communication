import React from 'react';
import { Download, FileText, CheckCircle, Calendar, ExternalLink, Printer } from 'lucide-react';
import '../styles/modern-ui.css';

interface CompletionPageProps {
  selectedSubsidy: string;
  formData: any;
  requiredDocuments: any[];
}

export const CompletionPageDebug: React.FC<CompletionPageProps> = ({
  selectedSubsidy,
  formData,
  requiredDocuments
}) => {
  const subsidyNames = {
    'it-donyu': 'IT導入補助金2025',
    'monozukuri': 'ものづくり補助金',
    'jizokuka': '小規模事業者持続化補助金'
  };

  // 追加で必要な書類の情報
  const getAdditionalDocuments = (subsidyType: string) => {
    const commonDocs = [
      {
        name: '登記簿謄本（履歴事項全部証明書）',
        icon: '🏢',
        description: '法人の場合は必須。発行から3ヶ月以内のもの',
        location: '法務局（オンライン申請可）',
        note: 'オンライン申請の場合は「登記ねっと」を利用可能'
      },
      {
        name: '納税証明書',
        icon: '🧾',
        description: '直近3期分の法人税・消費税・固定資産税の納税証明書',
        location: '管轄税務署または市区町村役場',
        note: '未納がある場合は申請不可'
      },
      {
        name: '決算書類',
        icon: '📊',
        description: '直近2期分の財務諸表（財務諸表、損益計算書、製造原価報告書等）',
        location: '自社で保管',
        note: '税理士の押印が必要な場合あり'
      }
    ];

    const subsidySpecificDocs: Record<string, any[]> = {
      'it-donyu': [
        ...commonDocs,
        {
          name: '身分証明書（運転免許証等）',
          icon: '🆔',
          description: '代表者の本人確認書類',
          location: '運転免許証は警察署、マイナンバーカードは市区町村役場',
          note: '有効期限内のもの'
        },
        {
          name: 'SECURITY ACTION自己宣言',
          icon: '🔐',
          description: 'IPAのSECURITY ACTIONの宣言証明',
          location: 'IPAウェブサイトでオンライン宣言',
          note: '申請前に必ず宣言が必要'
        }
      ],
      'monozukuri': [
        ...commonDocs,
        {
          name: '認定経営革新等支援機関による確認書',
          icon: '🏆',
          description: '事業計画の確認書',
          location: '認定支援機関（商工会議所、金融機関等）',
          note: '事前に支援機関との相談が必要'
        },
        {
          name: '従業員数を証明する書類',
          icon: '👥',
          description: '雇用保険被保険者資格取得等確認通知書等',
          location: 'ハローワークまたは年金事務所',
          note: '直近のもの'
        }
      ],
      'jizokuka': [
        ...commonDocs,
        {
          name: '商工会議所・商工会の会員証明',
          icon: '🤝',
          description: '会員であることの証明書',
          location: '所属する商工会議所・商工会',
          note: '非会員の場合は入会が必要'
        },
        {
          name: '開業届控え（個人事業主の場合）',
          icon: '📝',
          description: '税務署に提出した開業届の控え',
          location: '自社で保管（税務署提出済み）',
          note: '開業から1年未満の場合は開業届で代替可'
        }
      ]
    };

    return subsidySpecificDocs[subsidyType] || commonDocs;
  };

  // オンライン申請情報
  const getOnlineSubmissionInfo = (subsidyType: string) => {
    const info: Record<string, any> = {
      'it-donyu': {
        description: 'IT導入支援事業者と連携して、専用ポータルから申請します。電子申請にはgBizIDプライムの取得が必要です。',
        url: 'https://www.it-hojo.jp/',
        buttonText: 'IT導入補助金申請ポータルへ'
      },
      'monozukuri': {
        description: '電子申請システムを利用して申請します。GBizIDプライムの取得が必要です。',
        url: 'https://portal.monodukuri-hojo.jp/',
        buttonText: 'ものづくり補助金電子申請システムへ'
      },
      'jizokuka': {
        description: '商工会議所・商工会経由での申請が基本ですが、一部電子申請も可能です。',
        url: 'https://www.jizokukahojokin.info/',
        buttonText: '持続化補助金公式サイトへ'
      }
    };
    return info[subsidyType] || info['it-donyu'];
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* 完了ヒーロー */}
        <div className="completion-hero" style={{ marginBottom: '40px' }}>
          <div className="completion-icon">
            🎉
          </div>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: 'bold',
            marginBottom: '16px',
            color: 'white'
          }}>
            申請書類作成完了！
          </h1>
          <p style={{ 
            fontSize: '20px',
            opacity: 0.9,
            marginBottom: '24px',
            color: 'white'
          }}>
            {subsidyNames[selectedSubsidy as keyof typeof subsidyNames]} の申請書類をすべて準備いたしました
          </p>
        </div>

        {/* メインコンテンツ */}
        <div className="card-modern">
          {/* 追加で必要な書類 */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(250, 112, 154, 0.1) 0%, rgba(254, 225, 64, 0.1) 100%)',
            border: '1px solid rgba(250, 112, 154, 0.2)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '32px',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📄 追加で必要な書類と取得場所
            </h2>
            
            <div style={{ marginBottom: '24px' }}>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '16px',
                background: 'rgba(250, 112, 154, 0.1)',
                padding: '12px',
                borderRadius: 'var(--border-radius)',
                borderLeft: '4px solid var(--warning-color)'
              }}>
                ⚠️ 以下の書類は別途ご用意いただく必要があります。申請時に必須となりますので、事前にご準備ください。
              </p>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                {getAdditionalDocuments(selectedSubsidy).map((doc, index) => (
                  <div key={index} style={{
                    background: 'var(--bg-primary)',
                    padding: '20px',
                    borderRadius: 'var(--border-radius)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                  }}>
                    <div style={{
                      fontSize: '32px',
                      minWidth: '48px',
                      textAlign: 'center'
                    }}>
                      {doc.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '8px'
                      }}>
                        {doc.name}
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        marginBottom: '8px'
                      }}>
                        {doc.description}
                      </p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: 'var(--primary-color)'
                      }}>
                        📍 取得場所: <strong>{doc.location}</strong>
                      </div>
                      {doc.note && (
                        <p style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                          fontStyle: 'italic'
                        }}>
                          ※ {doc.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 提出方法 */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius)',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🚀 申請書類の提出方法
            </h2>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%)',
                borderRadius: 'var(--border-radius)',
                border: '1px solid rgba(79, 172, 254, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  💻 オンライン申請（推奨）
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  marginBottom: '12px'
                }}>
                  {getOnlineSubmissionInfo(selectedSubsidy).description}
                </p>
                <a 
                  href={getOnlineSubmissionInfo(selectedSubsidy).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--primary-color)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={16} />
                  {getOnlineSubmissionInfo(selectedSubsidy).buttonText}
                </a>
              </div>
            </div>
          </div>

          {/* 参考リンク */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius)',
            padding: '24px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ExternalLink size={20} />
              参考リンク
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}>公式サイト</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <a href="https://gbiz-id.go.jp/" target="_blank" rel="noopener noreferrer"
                     style={{
                       color: 'var(--primary-color)',
                       fontSize: '14px',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '4px',
                       textDecoration: 'none'
                     }}>
                    <ExternalLink size={14} />
                    GBizID（電子申請用）
                  </a>
                  <a href="https://www.nta.go.jp/taxes/nozei/nozei-shomei/01.htm" target="_blank" rel="noopener noreferrer"
                     style={{
                       color: 'var(--primary-color)',
                       fontSize: '14px',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '4px',
                       textDecoration: 'none'
                     }}>
                    <ExternalLink size={14} />
                    国税庁 - 納税証明書の取得方法
                  </a>
                  <a href="https://www.touki-kyoutaku-online.moj.go.jp/" target="_blank" rel="noopener noreferrer"
                     style={{
                       color: 'var(--primary-color)',
                       fontSize: '14px',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '4px',
                       textDecoration: 'none'
                     }}>
                    <ExternalLink size={14} />
                    登記ねっと（登記簿謄本オンライン申請）
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};