import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jizokukaDocumentCategories } from '../data/jizokuka-documents-detailed';
import '../styles/modern-ui.css';

const JizokukaDocumentGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'required' | 'optional' | 'conditional'>('required');

  // 必須書類の抽出
  const requiredDocuments = jizokukaDocumentCategories.flatMap(category => 
    category.documents
      .filter(doc => doc.required && !doc.name.includes('創業') && !doc.name.includes('事業承継') && !doc.name.includes('災害'))
      .map(doc => ({ ...doc, categoryName: category.name, categoryId: category.id }))
  );

  // 任意書類の抽出（加点要素など）
  const optionalDocuments = jizokukaDocumentCategories.flatMap(category => 
    category.documents
      .filter(doc => !doc.required && category.id === 'E')
      .map(doc => ({ ...doc, categoryName: category.name, categoryId: category.id }))
  );

  // 該当者のみ提出書類の抽出
  const conditionalDocuments = [
    // Bカテゴリから
    { ...jizokukaDocumentCategories[1].documents[2], categoryName: 'B. 現況確認資料', categoryId: 'B', condition: '個人事業主（創業1年未満）' },
    // Cカテゴリから
    { ...jizokukaDocumentCategories[2].documents[1], categoryName: 'C. 見積・価格関係', categoryId: 'C', condition: '機械装置等を購入する場合' },
    { ...jizokukaDocumentCategories[2].documents[2], categoryName: 'C. 見積・価格関係', categoryId: 'C', condition: '外装・内装工事を行う場合' },
    // Dカテゴリから
    { ...jizokukaDocumentCategories[3].documents[1], categoryName: 'D. 商工会議所・商工会関係', categoryId: 'D', condition: '商工会議所・商工会の会員' },
    // Fカテゴリ全体（特定事業者向け）
    ...jizokukaDocumentCategories[5].documents.map(doc => ({ 
      ...doc, 
      categoryName: 'F. 特定事業者向け', 
      categoryId: 'F',
      condition: doc.id === 'F1' ? '創業枠申請者' : 
                 doc.id === 'F2' ? '事業承継枠申請者' : 
                 doc.id === 'F3' ? '災害枠申請者' : '共同申請者'
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
            小規模事業者持続化補助金 必要書類完全ガイド
          </h1>
          <p style={{ 
            fontSize: '20px', 
            color: 'var(--text-secondary)',
            marginBottom: '24px'
          }}>
            小規模事業者の販路開拓を支援する補助金の申請に必要な書類を詳しく解説します
          </p>
          <div style={{
            display: 'inline-block',
            background: 'rgba(79, 172, 254, 0.1)',
            padding: '16px 32px',
            borderRadius: '100px',
            color: 'var(--success-color)',
            fontWeight: '600'
          }}>
            📝 一般型・創業枠・事業承継枠・災害枠 対応
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
                すべての申請者が提出する必要がある書類です。特に様式1〜4と事業支援計画書は必須です。
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
                提出することで審査時の加点になる可能性がある書類です。取得可能な認定がある場合は積極的に提出しましょう。
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
                特定の条件に該当する場合のみ提出が必要な書類です。申請枠や事業内容によって異なります。
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
            <li>商工会議所・商工会での事業支援計画書作成が必須です。必ず事前に相談してください。</li>
            <li>様式1〜4は公募要領から最新版をダウンロードしてください。年度により様式が変更されます。</li>
            <li>税抜50万円以上の経費は原則2社以上の相見積もりが必要です。</li>
            <li>創業枠・事業承継枠・災害枠はそれぞれ追加書類が必要です。</li>
            <li>加点要素の認定書は、申請時点で有効期限内のものに限ります。</li>
            <li>小規模事業者の定義（従業員数）を満たしているか必ず確認してください。</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JizokukaDocumentGuidePage;