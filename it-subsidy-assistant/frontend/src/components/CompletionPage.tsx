import React, { useEffect, useState } from 'react';
import { Download, FileText, CheckCircle, Calendar, ExternalLink, Printer } from 'lucide-react';
import '../styles/modern-ui.css';

interface CompletionPageProps {
  selectedSubsidy: string;
  formData: any;
  requiredDocuments: any[];
}

interface DocumentDownload {
  id: string;
  name: string;
  description: string;
  fileType: 'excel' | 'word' | 'pdf';
  category: 'template' | 'filled' | 'reference';
  downloadUrl?: string;
  size?: string;
}

export const CompletionPage: React.FC<CompletionPageProps> = ({
  selectedSubsidy,
  formData,
  requiredDocuments
}) => {
  const [downloadLinks, setDownloadLinks] = useState<DocumentDownload[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // 補助金別のダウンロード書類を設定
  useEffect(() => {
    const generateDownloadLinks = () => {
      let documents: DocumentDownload[] = [];

      switch (selectedSubsidy) {
        case 'it-donyu':
          documents = [
            {
              id: 'it_filled_application',
              name: '入力済み申請書一式',
              description: 'お客様の情報が入力された申請書類',
              fileType: 'excel',
              category: 'filled',
              size: '2.1MB'
            },
            {
              id: 'it_wage_report',
              name: '賃金報告書',
              description: '賃上げ計画の詳細書類',
              fileType: 'excel',
              category: 'filled',
              size: '856KB'
            },
            {
              id: 'it_implementation_plan',
              name: '実施内容説明書',
              description: 'IT導入計画の詳細',
              fileType: 'excel',
              category: 'filled',
              size: '1.2MB'
            },
            {
              id: 'it_price_breakdown',
              name: '価格説明書',
              description: '導入費用の詳細内訳',
              fileType: 'excel',
              category: 'filled',
              size: '945KB'
            },
            {
              id: 'it_template_blank',
              name: '空白テンプレート一式',
              description: '記入前のオリジナル書類（参考用）',
              fileType: 'excel',
              category: 'template',
              size: '1.8MB'
            },
            {
              id: 'it_application_guide',
              name: 'IT導入補助金申請ガイド',
              description: '申請手順と注意事項',
              fileType: 'pdf',
              category: 'reference',
              size: '3.4MB'
            }
          ];
          break;

        case 'monozukuri':
          documents = [
            {
              id: 'mono_business_plan',
              name: '入力済み事業計画書',
              description: 'お客様の事業計画が反映された書類',
              fileType: 'word',
              category: 'filled',
              size: '1.8MB'
            },
            {
              id: 'mono_cagr_tool',
              name: 'CAGR算出ツール（計算済み）',
              description: '売上成長率の計算結果',
              fileType: 'excel',
              category: 'filled',
              size: '678KB'
            },
            {
              id: 'mono_wage_plan',
              name: '賃上げ計画書',
              description: '賃金引上げの詳細計画',
              fileType: 'word',
              category: 'filled',
              size: '892KB'
            },
            {
              id: 'mono_funding_confirmation',
              name: '資金調達確認書',
              description: '事業資金の調達計画',
              fileType: 'word',
              category: 'filled',
              size: '534KB'
            },
            {
              id: 'mono_application_guide',
              name: 'ものづくり補助金申請ガイド',
              description: '申請の流れと必要書類一覧',
              fileType: 'pdf',
              category: 'reference',
              size: '4.2MB'
            }
          ];
          break;

        case 'jizokuka':
          documents = [
            {
              id: 'jizoku_application_form',
              name: '様式1 申請書（入力済み）',
              description: '基本情報が入力された申請書',
              fileType: 'word',
              category: 'filled',
              size: '756KB'
            },
            {
              id: 'jizoku_business_plan',
              name: '様式2 経営計画書（入力済み）',
              description: '経営方針と課題が記載された計画書',
              fileType: 'word',
              category: 'filled',
              size: '1.1MB'
            },
            {
              id: 'jizoku_project_plan',
              name: '様式3 補助事業計画書（入力済み）',
              description: '販路開拓計画の詳細',
              fileType: 'excel',
              category: 'filled',
              size: '1.3MB'
            },
            {
              id: 'jizoku_checklist',
              name: '申請チェックリスト',
              description: '提出前の最終確認用',
              fileType: 'excel',
              category: 'reference',
              size: '423KB'
            },
            {
              id: 'jizoku_application_guide',
              name: '持続化補助金申請ガイド',
              description: '小規模事業者向け申請マニュアル',
              fileType: 'pdf',
              category: 'reference',
              size: '2.8MB'
            }
          ];
          break;

        default:
          documents = [];
      }

      // ダウンロードURLを生成
      documents.forEach(doc => {
        doc.downloadUrl = `http://localhost:3001/api/excel-download/download/${doc.id}?subsidyType=${selectedSubsidy}&sessionId=${Date.now()}`;
      });

      setDownloadLinks(documents);
    };

    generateDownloadLinks();
  }, [selectedSubsidy]);

  const handleGenerateDocuments = async () => {
    setIsGenerating(true);
    try {
      // Excel生成APIを呼び出し
      const response = await fetch('http://localhost:3001/api/excel-download/complete-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: formData,
          selectedSubsidy: selectedSubsidy
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Documents generated:', result);
        // 成功時の処理
      }
    } catch (error) {
      console.error('Document generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (doc: DocumentDownload) => {
    // デモ用のダウンロード処理
    const demoData = {
      filename: `${doc.name}.${doc.fileType === 'excel' ? 'xlsx' : doc.fileType === 'word' ? 'docx' : 'pdf'}`,
      content: generateDemoContent(doc),
      type: doc.fileType
    };

    // ダウンロードをシミュレート
    console.log('ダウンロード開始:', demoData.filename);
    
    // 実際のダウンロードの代わりにアラートを表示
    alert(`📥 ダウンロード準備完了！\n\nファイル名: ${demoData.filename}\nサイズ: ${doc.size || '準備中'}\n\n実際の環境では、このファイルがダウンロードされます。`);
  };

  const generateDemoContent = (doc: DocumentDownload) => {
    // デモ用のコンテンツ生成
    return {
      subsidyType: selectedSubsidy,
      documentId: doc.id,
      documentName: doc.name,
      formData: formData,
      generatedAt: new Date().toISOString()
    };
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'excel': return '📊';
      case 'word': return '📝';
      case 'pdf': return '📄';
      default: return '📁';
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'filled': return {
        background: 'linear-gradient(135deg, rgba(72, 187, 120, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%)',
        color: '#22543d',
        border: '1px solid rgba(72, 187, 120, 0.2)'
      };
      case 'template': return {
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        color: '#2c5282',
        border: '1px solid rgba(102, 126, 234, 0.2)'
      };
      case 'reference': return {
        background: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--bg-tertiary)'
      };
      default: return {
        background: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--bg-tertiary)'
      };
    }
  };

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

  // 郵送申請情報
  const getPostalSubmissionInfo = (subsidyType: string) => {
    const info: Record<string, string> = {
      'it-donyu': '原則として電子申請のみ。郵送申請は受け付けていません。',
      'monozukuri': '紙媒体での申請も可能ですが、電子申請が推奨されています。詳細は公募要領をご確認ください。',
      'jizokuka': '所属する商工会議所・商工会に申請書類を提出してください。提出先は各地域の商工会議所・商工会です。'
    };
    return info[subsidyType] || '詳細は各補助金の公募要領をご確認ください。';
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
            marginBottom: '16px'
          }}>
            申請書類作成完了！
          </h1>
          <p style={{ 
            fontSize: '20px',
            opacity: 0.9,
            marginBottom: '24px'
          }}>
            {subsidyNames[selectedSubsidy as keyof typeof subsidyNames]} の申請書類をすべて準備いたしました
          </p>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            padding: '16px 32px',
            borderRadius: '100px',
            fontSize: '18px'
          }}>
            💡 あとは書類をダウンロードして提出するだけです
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="card-modern">
          {/* 申請情報サマリー */}
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
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FileText size={20} />
              申請情報サマリー
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
                  marginBottom: '8px'
                }}>申請者情報</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {formData?.company_name || '企業名未設定'}
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {formData?.industry || '業種未設定'}
                </p>
              </div>
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>申請内容</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  従業員数: {formData?.employee_count || 'N/A'}名
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  年間売上: {formData?.annual_revenue || 'N/A'}万円
                </p>
              </div>
            </div>
          </div>

          {/* ダウンロードセクション */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Download size={20} />
                申請書類ダウンロード
              </h2>
              <button
                onClick={handleGenerateDocuments}
                disabled={isGenerating}
                className="btn-gradient"
                style={{
                  opacity: isGenerating ? 0.7 : 1,
                  cursor: isGenerating ? 'not-allowed' : 'pointer'
                }}
              >
                {isGenerating ? '生成中...' : '書類を最新状態で再生成'}
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {downloadLinks.map((doc) => (
                <div
                  key={doc.id}
                  className="download-card"
                >
                  <div className="download-icon">{getFileIcon(doc.fileType)}</div>
                  <div className="download-content">
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                      }}>{doc.name}</h3>
                      <span style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        borderRadius: '100px',
                        fontWeight: '600',
                        background: getCategoryStyle(doc.category).background,
                        color: getCategoryStyle(doc.category).color,
                        border: getCategoryStyle(doc.category).border
                      }}>
                        {doc.category === 'filled' ? '入力済み' : 
                         doc.category === 'template' ? 'テンプレート' : '参考資料'}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px'
                    }}>{doc.description}</p>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)'
                    }}>ファイルサイズ: {doc.size}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="download-button"
                  >
                    <Download size={16} />
                    ダウンロード
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 次のステップ */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '32px',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden'
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
              <Calendar size={20} />
              次のステップ
            </h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              {[
                { num: '1', title: '書類の最終確認', desc: 'ダウンロードした書類の内容に誤りがないか確認してください' },
                { num: '2', title: '添付書類の準備', desc: '決算書、登記簿謄本などの添付書類をご準備ください' },
                { num: '3', title: '電子申請または郵送', desc: '各補助金の公式サイトから電子申請、または郵送で提出してください' }
              ].map((step) => (
                <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    minWidth: '32px',
                    height: '32px',
                    background: 'var(--primary-gradient)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {step.num}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>{step.title}</h3>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.6'
                    }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 追加で必要な書類 */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(250, 112, 154, 0.1) 0%, rgba(254, 225, 64, 0.1) 100%)',
            border: '1px solid rgba(250, 112, 154, 0.2)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '32px',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden'
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
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  <ExternalLink size={16} />
                  {getOnlineSubmissionInfo(selectedSubsidy).buttonText}
                </a>
              </div>
              
              <div style={{
                padding: '20px',
                background: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--bg-tertiary)'
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
                  📨 郵送申請
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)'
                }}>
                  {getPostalSubmissionInfo(selectedSubsidy)}
                </p>
              </div>
            </div>
          </div>

          {/* 有用なリンク */}
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
                       textDecoration: 'none',
                       transition: 'all var(--transition-fast)'
                     }}
                     onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                     onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
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
                       textDecoration: 'none',
                       transition: 'all var(--transition-fast)'
                     }}
                     onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                     onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
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
                       textDecoration: 'none',
                       transition: 'all var(--transition-fast)'
                     }}
                     onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                     onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                    <ExternalLink size={14} />
                    登記ねっと（登記簿謄本オンライン申請）
                  </a>
                </div>
              </div>
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}>サポート</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a href="mailto:support@subsidy-assistant.com" 
                     style={{
                       color: 'var(--primary-color)',
                       fontSize: '14px',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '4px',
                       textDecoration: 'none',
                       transition: 'all var(--transition-fast)'
                     }}
                     onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                     onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                    📧 サポートセンター
                  </a>
                  <button 
                    onClick={() => window.print()}
                    style={{
                      color: 'var(--primary-color)',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all var(--transition-fast)',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                    <Printer size={14} />
                    このページを印刷
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* フッター */}
          <div style={{
            textAlign: 'center',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid var(--bg-tertiary)'
          }}>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              IT補助金アシスタント - あなたの補助金申請を最後までサポートします
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              alignItems: 'center'
            }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  color: 'var(--primary-color)',
                  fontSize: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                新しい申請を開始
              </button>
              <span style={{ color: 'var(--bg-tertiary)' }}>|</span>
              <button
                style={{
                  color: 'var(--primary-color)',
                  fontSize: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                onClick={() => window.history.back()}
              >
                前の画面に戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};