import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { monozukuriDocumentCategories } from '../data/monozukuri-documents-detailed';
import '../styles/modern-ui.css';

const MonozukuriDocumentGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'required' | 'optional' | 'conditional'>('required');

  // 必須書類の抽出
  const requiredDocuments = monozukuriDocumentCategories.flatMap(category => 
    category.documents
      .filter(doc => doc.required)
      .map(doc => ({ ...doc, categoryName: category.name, categoryId: category.id }))
  );

  // 任意書類の抽出（加点要素など）
  const optionalDocuments = monozukuriDocumentCategories.flatMap(category => 
    category.documents
      .filter(doc => !doc.required && !doc.name.includes('該当'))
      .map(doc => ({ ...doc, categoryName: category.name, categoryId: category.id }))
  );

  // 該当者のみ提出書類の抽出
  const conditionalDocuments = [
    // Bカテゴリから
    { ...monozukuriDocumentCategories[1].documents[3], categoryName: 'B. 誓約・加点様式', categoryId: 'B', condition: 'グリーン枠申請者' },
    // Fカテゴリから
    { ...monozukuriDocumentCategories[5].documents[2], categoryName: 'F. 支援機関・枠別書類', categoryId: 'F', condition: 'デジタル枠申請者' },
    // Gカテゴリから
    ...monozukuriDocumentCategories[6].documents.map(doc => ({ 
      ...doc, 
      categoryName: 'G. その他ケース別', 
      categoryId: 'G',
      condition: doc.id === 'G1' ? '共同申請枠' : doc.id === 'G2' ? '賃貸物件で事業実施' : '海外展開を行う場合'
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
            ものづくり補助金 必要書類完全ガイド
          </h1>
          <p style={{ 
            fontSize: '20px', 
            color: 'var(--text-secondary)',
            marginBottom: '24px'
          }}>
            申請に必要な全ての書類を分類別に詳しく解説します
          </p>
          <div style={{
            display: 'inline-block',
            background: 'rgba(250, 112, 154, 0.1)',
            padding: '16px 32px',
            borderRadius: '100px',
            color: 'var(--warning-color)',
            fontWeight: '600'
          }}>
            ⚠️ 2025年版の最新要件に基づいています
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
                すべての申請者が提出する必要がある書類です。不備があると申請が受理されません。
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
                提出することで審査時の加点になる可能性がある書類です。可能な限り提出することを推奨します。
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
                特定の条件に該当する場合のみ提出が必要な書類です。
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
            <li>公募要領は年度によって変更される可能性があります。必ず最新の公募要領をご確認ください。</li>
            <li>申請枠（通常枠・デジタル枠・グリーン枠・共同申請枠）によって必要書類が異なります。</li>
            <li>認定経営革新等支援機関の確認書は加点項目ですが、事業計画の信頼性向上に重要です。</li>
            <li>見積書は原則2社以上の相見積もりが必要です（単価50万円以上は必須）。</li>
            <li>書類の不備は採択後の交付決定取消しリスクがあるため、慎重に準備してください。</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MonozukuriDocumentGuidePage;