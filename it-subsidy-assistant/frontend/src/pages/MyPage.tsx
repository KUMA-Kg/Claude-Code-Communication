import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface CommonData {
  companyName?: string;
  companyNameKana?: string;
  businessOverview?: string;
  employeeCount?: string;
  annualRevenue?: string;
  representativeName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  establishmentDate?: string;
  capital?: string;
}

interface SubsidyApplicationHistory {
  subsidyType: string;
  subsidyName: string;
  appliedDate: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  data: Record<string, any>;
}

export const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const [commonData, setCommonData] = useState<CommonData>({});
  const [editMode, setEditMode] = useState(false);
  const [applicationHistory, setApplicationHistory] = useState<SubsidyApplicationHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'data'>('profile');

  useEffect(() => {
    // 共通データの読み込み
    const savedCommonData = localStorage.getItem('commonFormData');
    if (savedCommonData) {
      setCommonData(JSON.parse(savedCommonData));
    }

    // 申請履歴の読み込み
    loadApplicationHistory();
  }, []);

  const loadApplicationHistory = () => {
    const history: SubsidyApplicationHistory[] = [];
    const subsidyTypes = [
      { type: 'it-donyu', name: 'IT導入補助金2025' },
      { type: 'monozukuri', name: 'ものづくり補助金' },
      { type: 'jizokuka', name: '小規模事業者持続化補助金' },
      { type: 'jigyou-saikouchiku', name: '事業再構築補助金' }
    ];

    subsidyTypes.forEach(({ type, name }) => {
      const data = localStorage.getItem(`specificFormData_${type}`);
      if (data) {
        history.push({
          subsidyType: type,
          subsidyName: name,
          appliedDate: new Date().toISOString().split('T')[0], // 実際は保存時のタイムスタンプ
          status: 'draft',
          data: JSON.parse(data)
        });
      }
    });

    setApplicationHistory(history);
  };

  const handleSave = () => {
    localStorage.setItem('commonFormData', JSON.stringify(commonData));
    setEditMode(false);
    alert('保存しました');
  };

  const handleChange = (field: keyof CommonData, value: string) => {
    setCommonData(prev => ({ ...prev, [field]: value }));
  };

  const exportAllData = () => {
    const allData = {
      common: commonData,
      applications: applicationHistory,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `補助金申請データ_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearSpecificData = (subsidyType: string) => {
    if (confirm('この補助金の入力データを削除しますか？')) {
      localStorage.removeItem(`specificFormData_${subsidyType}`);
      loadApplicationHistory();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            マイページ
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            共通情報の管理と申請履歴の確認ができます
          </p>
        </div>

        {/* タブナビゲーション */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          background: 'white',
          padding: '8px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'profile' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'transparent',
              color: activeTab === 'profile' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            企業情報
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'history' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'transparent',
              color: activeTab === 'history' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            申請履歴
          </button>
          <button
            onClick={() => setActiveTab('data')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'data' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'transparent',
              color: activeTab === 'data' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            データ管理
          </button>
        </div>

        {/* 企業情報タブ */}
        {activeTab === 'profile' && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600' }}>
                共通企業情報
              </h2>
              <button
                onClick={() => editMode ? handleSave() : setEditMode(true)}
                style={{
                  padding: '10px 24px',
                  background: editMode 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {editMode ? '保存' : '編集'}
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  法人名・屋号
                </label>
                <input
                  type="text"
                  value={commonData.companyName || ''}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  disabled={!editMode}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: editMode ? 'white' : '#f9fafb',
                    cursor: editMode ? 'text' : 'not-allowed'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  法人名カナ
                </label>
                <input
                  type="text"
                  value={commonData.companyNameKana || ''}
                  onChange={(e) => handleChange('companyNameKana', e.target.value)}
                  disabled={!editMode}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: editMode ? 'white' : '#f9fafb',
                    cursor: editMode ? 'text' : 'not-allowed'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  代表者名
                </label>
                <input
                  type="text"
                  value={commonData.representativeName || ''}
                  onChange={(e) => handleChange('representativeName', e.target.value)}
                  disabled={!editMode}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: editMode ? 'white' : '#f9fafb',
                    cursor: editMode ? 'text' : 'not-allowed'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={commonData.contactEmail || ''}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  disabled={!editMode}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: editMode ? 'white' : '#f9fafb',
                    cursor: editMode ? 'text' : 'not-allowed'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  電話番号
                </label>
                <input
                  type="tel"
                  value={commonData.contactPhone || ''}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  disabled={!editMode}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: editMode ? 'white' : '#f9fafb',
                    cursor: editMode ? 'text' : 'not-allowed'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  従業員数
                </label>
                <select
                  value={commonData.employeeCount || ''}
                  onChange={(e) => handleChange('employeeCount', e.target.value)}
                  disabled={!editMode}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: editMode ? 'white' : '#f9fafb',
                    cursor: editMode ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="">選択してください</option>
                  <option value="1-5">1〜5名</option>
                  <option value="6-20">6〜20名</option>
                  <option value="21-50">21〜50名</option>
                  <option value="51-100">51〜100名</option>
                  <option value="101-300">101〜300名</option>
                  <option value="301+">301名以上</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  事業内容
                </label>
                <textarea
                  value={commonData.businessOverview || ''}
                  onChange={(e) => handleChange('businessOverview', e.target.value)}
                  disabled={!editMode}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: editMode ? 'white' : '#f9fafb',
                    cursor: editMode ? 'text' : 'not-allowed',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 申請履歴タブ */}
        {activeTab === 'history' && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
              申請履歴
            </h2>
            
            {applicationHistory.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '48px 0' }}>
                まだ申請履歴がありません
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {applicationHistory.map((app, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '24px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={() => navigate(`/input-form/${app.subsidyType}`)}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          marginBottom: '8px'
                        }}>
                          {app.subsidyName}
                        </h3>
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>
                          入力日: {app.appliedDate}
                        </p>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <span style={{
                          padding: '6px 16px',
                          background: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '100px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          下書き
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearSpecificData(app.subsidyType);
                          }}
                          style={{
                            padding: '8px 16px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* データ管理タブ */}
        {activeTab === 'data' && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
              データ管理
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                padding: '24px',
                background: '#f9fafb',
                borderRadius: '12px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                  データのエクスポート
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                  すべての入力データをJSON形式でダウンロードできます
                </p>
                <button
                  onClick={exportAllData}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  データをエクスポート
                </button>
              </div>

              <div style={{
                padding: '24px',
                background: '#fef2f2',
                borderRadius: '12px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#dc2626' }}>
                  データのクリア
                </h3>
                <p style={{ color: '#dc2626', marginBottom: '16px' }}>
                  すべての入力データを削除します。この操作は取り消せません。
                </p>
                <button
                  onClick={() => {
                    if (confirm('本当にすべてのデータを削除しますか？')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  すべてのデータを削除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPage;