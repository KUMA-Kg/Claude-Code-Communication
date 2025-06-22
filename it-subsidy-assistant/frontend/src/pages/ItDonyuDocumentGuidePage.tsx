import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { itDonyuDocumentCategories } from '../data/it-donyu-documents-detailed';
import '../styles/modern-ui.css';

const ItDonyuDocumentGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'required' | 'optional' | 'conditional'>('required');

  // 必須書類の抽出
  const requiredDocuments = itDonyuDocumentCategories.flatMap(category => 
    category.documents
      .filter(doc => doc.required)
      .map(doc => ({ ...doc, categoryName: category.name, categoryId: category.id }))
  );

  // 任意書類の抽出（加点要素など）
  const optionalDocuments = itDonyuDocumentCategories.flatMap(category => 
    category.documents
      .filter(doc => !doc.required && category.id === 'D')
      .map(doc => ({ ...doc, categoryName: category.name, categoryId: category.id }))
  );

  // 該当者のみ提出書類の抽出
  const conditionalDocuments = [
    // Bカテゴリから
    { ...itDonyuDocumentCategories[1].documents[2], categoryName: 'B. 財務関係書類', categoryId: 'B', condition: '従業員を雇用している場合' },
    // Eカテゴリ全体（枠別）
    ...itDonyuDocumentCategories[4].documents.map(doc => ({ 
      ...doc, 
      categoryName: 'E. 枠別必要書類', 
      categoryId: 'E',
      condition: doc.id === 'E1' ? 'デジタル化基盤導入枠' : 
                 doc.id === 'E2' ? 'セキュリティ対策推進枠' : '複数社連携IT導入枠'
    })),
    // Fカテゴリ全体（状況別）
    ...itDonyuDocumentCategories[5].documents.map(doc => ({ 
      ...doc, 
      categoryName: 'F. その他状況別書類', 
      categoryId: 'F',
      condition: doc.id === 'F1' ? '創業2年未満' : 
                 doc.id === 'F2' ? '事業承継・引継ぎ実施' : '被災事業者'
    }))
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginBottom: '16px'
          }}>
            IT導入補助金2025 必要書類完全ガイド
          </h1>
          <p style={{ 
            fontSize: '20px', 
            color: 'var(--text-secondary)',
            marginBottom: '24px'
          }}>
            中小企業のデジタル化を支援する補助金の申請に必要な書類を詳しく解説します
          </p>
          <div style={{
            display: 'inline-block',
            background: 'rgba(102, 126, 234, 0.1)',
            padding: '16px 32px',
            borderRadius: '100px',
            color: 'var(--primary-color)',
            fontWeight: '600'
          }}>
            💻 通常枠・デジタル化基盤導入枠・セキュリティ対策推進枠 対応
          </div>
        </div>

        {/* タブナビゲーション */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setActiveTab('required')}
            style={{
              padding: '16px 32px',
              background: activeTab === 'required' ? 'var(--primary-gradient)' : 'white',
              color: activeTab === 'required' ? 'white' : 'var(--text-primary)',
              border: activeTab === 'required' ? 'none' : '2px solid var(--bg-tertiary)',
              borderRadius: 'var(--border-radius)',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)',
              boxShadow: activeTab === 'required' ? 'var(--shadow-md)' : 'none'
            }}
          >
            ① 必須提出書類（{requiredDocuments.length}件）
          </button>
          <button
            onClick={() => setActiveTab('optional')}
            style={{
              padding: '16px 32px',
              background: activeTab === 'optional' ? 'var(--primary-gradient)' : 'white',
              color: activeTab === 'optional' ? 'white' : 'var(--text-primary)',
              border: activeTab === 'optional' ? 'none' : '2px solid var(--bg-tertiary)',
              borderRadius: 'var(--border-radius)',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)',
              boxShadow: activeTab === 'optional' ? 'var(--shadow-md)' : 'none'
            }}
          >
            ② 任意提出書類（{optionalDocuments.length}件）
          </button>
          <button
            onClick={() => setActiveTab('conditional')}
            style={{
              padding: '16px 32px',
              background: activeTab === 'conditional' ? 'var(--primary-gradient)' : 'white',
              color: activeTab === 'conditional' ? 'white' : 'var(--text-primary)',
              border: activeTab === 'conditional' ? 'none' : '2px solid var(--bg-tertiary)',
              borderRadius: 'var(--border-radius)',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)',
              boxShadow: activeTab === 'conditional' ? 'var(--shadow-md)' : 'none'
            }}
          >
            ③ 該当者のみ（{conditionalDocuments.length}件）
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="card-modern">
          {activeTab === 'required' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-primary)' }}>
                ① 必須提出書類
              </h2>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                すべての申請者が提出する必要がある書類です。特にgBizIDプライムの取得には時間がかかるため、早めの準備が必要です。
              </p>
              {requiredDocuments.map((doc: any, index) => (
                <div 
                  key={doc.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '20px',
                    borderRadius: 'var(--border-radius)',
                    marginBottom: '16px',
                    border: '2px solid var(--danger-color)',
                    transition: 'all var(--transition-normal)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{
                          background: 'var(--danger-color)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '100px',
                          fontSize: '14px',
                          fontWeight: '600',
                          minWidth: '30px',
                          textAlign: 'center'
                        }}>
                          {index + 1}
                        </span>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          margin: 0
                        }}>
                          {doc.name}
                        </h3>
                        <span style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: 'var(--primary-color)',
                          padding: '4px 12px',
                          borderRadius: '100px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {doc.categoryName}
                        </span>
                      </div>
                      {doc.description && (
                        <p style={{
                          fontSize: '15px',
                          color: 'var(--text-secondary)',
                          margin: '0 0 8px 0',
                          paddingLeft: '50px'
                        }}>
                          {doc.description}
                        </p>
                      )}
                      {doc.notes && (
                        <div style={{
                          marginLeft: '50px',
                          padding: '12px',
                          background: 'rgba(250, 112, 154, 0.1)',
                          borderRadius: 'var(--border-radius)',
                          borderLeft: '4px solid var(--warning-color)'
                        }}>
                          <p style={{
                            fontSize: '14px',
                            color: 'var(--warning-color)',
                            margin: 0,
                            fontWeight: '500'
                          }}>
                            ⚠️ {doc.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'optional' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-primary)' }}>
                ② 任意提出書類（加点要素）
              </h2>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                提出することで審査時の加点になる可能性がある書類です。賃上げ表明書やセキュリティ対策の証明は特に重要です。
              </p>
              {optionalDocuments.map((doc: any, index) => (
                <div 
                  key={doc.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '20px',
                    borderRadius: 'var(--border-radius)',
                    marginBottom: '16px',
                    border: '2px solid var(--success-color)',
                    transition: 'all var(--transition-normal)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{
                          background: 'var(--success-color)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '100px',
                          fontSize: '14px',
                          fontWeight: '600',
                          minWidth: '30px',
                          textAlign: 'center'
                        }}>
                          +
                        </span>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          margin: 0
                        }}>
                          {doc.name}
                        </h3>
                        <span style={{
                          background: 'rgba(79, 172, 254, 0.1)',
                          color: 'var(--success-color)',
                          padding: '4px 12px',
                          borderRadius: '100px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          加点
                        </span>
                      </div>
                      {doc.description && (
                        <p style={{
                          fontSize: '15px',
                          color: 'var(--text-secondary)',
                          margin: '0 0 8px 0',
                          paddingLeft: '50px'
                        }}>
                          {doc.description}
                        </p>
                      )}
                      {doc.notes && (
                        <div style={{
                          marginLeft: '50px',
                          padding: '12px',
                          background: 'rgba(79, 172, 254, 0.1)',
                          borderRadius: 'var(--border-radius)',
                          borderLeft: '4px solid var(--success-color)'
                        }}>
                          <p style={{
                            fontSize: '14px',
                            color: 'var(--success-color)',
                            margin: 0
                          }}>
                            💡 {doc.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'conditional' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-primary)' }}>
                ③ 該当者のみ提出書類
              </h2>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                特定の条件に該当する場合のみ提出が必要な書類です。申請枠や事業状況によって異なります。
              </p>
              {conditionalDocuments.map((doc: any, index) => (
                <div 
                  key={doc.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '20px',
                    borderRadius: 'var(--border-radius)',
                    marginBottom: '16px',
                    border: '2px solid var(--warning-color)',
                    transition: 'all var(--transition-normal)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{
                          background: 'var(--warning-color)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '100px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          条件
                        </span>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          margin: 0
                        }}>
                          {doc.name}
                        </h3>
                        <span style={{
                          background: 'rgba(250, 112, 154, 0.1)',
                          color: 'var(--warning-color)',
                          padding: '4px 12px',
                          borderRadius: '100px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {doc.condition}
                        </span>
                      </div>
                      {doc.description && (
                        <p style={{
                          fontSize: '15px',
                          color: 'var(--text-secondary)',
                          margin: '0 0 8px 0',
                          paddingLeft: '50px'
                        }}>
                          {doc.description}
                        </p>
                      )}
                      {doc.notes && (
                        <div style={{
                          marginLeft: '50px',
                          padding: '12px',
                          background: 'rgba(250, 112, 154, 0.1)',
                          borderRadius: 'var(--border-radius)',
                          borderLeft: '4px solid var(--warning-color)'
                        }}>
                          <p style={{
                            fontSize: '14px',
                            color: 'var(--warning-color)',
                            margin: 0
                          }}>
                            📌 {doc.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* アクションエリア */}
        <div style={{
          marginTop: '40px',
          background: 'var(--bg-primary)',
          padding: '32px',
          borderRadius: 'var(--border-radius-lg)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginBottom: '16px'
          }}>
            準備はできましたか？
          </h3>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            marginBottom: '24px'
          }}>
            必要書類を確認したら、申請診断を開始しましょう
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-gradient"
            style={{
              padding: '16px 48px',
              fontSize: '18px',
              fontWeight: '600'
            }}
          >
            診断を開始する →
          </button>
        </div>

        {/* 注意事項 */}
        <div style={{
          marginTop: '32px',
          padding: '24px',
          background: 'rgba(250, 112, 154, 0.1)',
          borderRadius: 'var(--border-radius)',
          border: '1px solid rgba(250, 112, 154, 0.2)'
        }}>
          <h4 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '12px'
          }}>
            ⚠️ 重要な注意事項
          </h4>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            color: 'var(--text-secondary)',
            fontSize: '15px',
            lineHeight: '1.8'
          }}>
            <li>gBizIDプライムの取得には2〜3週間かかるため、早めに申請してください。</li>
            <li>IT導入支援事業者は事前に登録された事業者から選ぶ必要があります。</li>
            <li>導入するITツールは事前に登録されたものに限ります（カスタマイズ可）。</li>
            <li>労働生産性の向上目標（3年で9%以上等）の達成が求められます。</li>
            <li>申請は電子申請のみ。書面での提出は受け付けられません。</li>
            <li>交付決定前の発注・契約・支払いは補助対象外となります。</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ItDonyuDocumentGuidePage;