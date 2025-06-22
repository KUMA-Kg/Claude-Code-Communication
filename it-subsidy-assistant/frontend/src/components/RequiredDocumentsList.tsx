import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requiredDocuments, documentCategoryLabels, RequiredDocument } from '../data/required-documents';
import '../styles/modern-ui.css';

interface RequiredDocumentsListProps {
  subsidyType: string;
  subsidyName: string;
  requiredDocuments?: any[];
}

const RequiredDocumentsList: React.FC<RequiredDocumentsListProps> = ({ subsidyType, subsidyName, requiredDocuments: propDocuments }) => {
  const navigate = useNavigate();
  const [checkedDocuments, setCheckedDocuments] = useState<Set<string>>(new Set());
  
  // propsから渡された書類リストがあればそれを使用、なければデフォルトを使用
  const documents = propDocuments?.map(doc => ({
    id: doc.id,
    name: doc.name,
    description: doc.description || '',
    required: doc.required,
    category: doc.category || 'application', // カテゴリが指定されていればそれを使用
    format: doc.format || 'excel',
    examples: []
  })) || requiredDocuments[subsidyType] || [];
  
  // カテゴリ別にドキュメントをグループ化
  const documentsByCategory = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, RequiredDocument[]>);
  
  const handleDocumentCheck = (docId: string) => {
    const newChecked = new Set(checkedDocuments);
    if (newChecked.has(docId)) {
      newChecked.delete(docId);
    } else {
      newChecked.add(docId);
    }
    setCheckedDocuments(newChecked);
  };
  
  const requiredDocumentsCount = documents.filter(doc => doc.required).length;
  const checkedRequiredCount = documents.filter(doc => doc.required && checkedDocuments.has(doc.id)).length;
  const completionRate = requiredDocumentsCount > 0 
    ? Math.round((checkedRequiredCount / requiredDocumentsCount) * 100)
    : 0;
  
  const canProceed = documents.filter(doc => doc.required).every(doc => checkedDocuments.has(doc.id));

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>{subsidyName} - 必要書類一覧</h2>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>
        申請に必要な書類をご確認ください。すべての必須書類を準備してから次へお進みください。
      </p>
      
      {/* 詳細ガイドへのリンク */}
      <div style={{ 
        backgroundColor: '#e0e7ff', 
        padding: '16px 20px', 
        borderRadius: '8px', 
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h4 style={{ fontSize: '16px', margin: '0 0 4px 0', color: '#1e40af' }}>
            📚 さらに詳しい書類情報をご覧になりたい方へ
          </h4>
          <p style={{ fontSize: '14px', margin: 0, color: '#3730a3' }}>
            必須・任意・該当者のみの書類について、より詳細な説明をご用意しています
          </p>
        </div>
        <button
          onClick={() => {
            const guideUrls = {
              'it-donyu': '/guide/it-donyu-documents',
              'monozukuri': '/guide/monozukuri-documents',
              'jizokuka': '/guide/jizokuka-documents'
            };
            navigate(guideUrls[subsidyType as keyof typeof guideUrls] || '/guide');
          }}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
          }}
        >
          詳細ガイドを見る →
        </button>
      </div>
      
      {/* 進捗状況 */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', margin: 0 }}>書類準備状況</h3>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: completionRate === 100 ? '#16a34a' : '#2563eb' }}>
            {completionRate}%
          </span>
        </div>
        <div style={{ backgroundColor: '#e5e7eb', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
          <div
            style={{
              backgroundColor: completionRate === 100 ? '#16a34a' : '#2563eb',
              height: '100%',
              width: `${completionRate}%`,
              transition: 'width 0.3s'
            }}
          />
        </div>
        <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
          必須書類: {checkedRequiredCount} / {requiredDocumentsCount} 準備完了
        </p>
      </div>
      
      {/* カテゴリ別書類リスト */}
      {Object.entries(documentsByCategory).map(([category, categoryDocs]) => (
        <div key={category} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #e5e7eb' }}>
            {documentCategoryLabels[category]}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categoryDocs.map(doc => (
              <div
                key={doc.id}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: checkedDocuments.has(doc.id) ? '#f0fdf4' : '#fafafa',
                  border: '1px solid',
                  borderColor: checkedDocuments.has(doc.id) ? '#86efac' : '#e5e7eb',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <input
                    type="checkbox"
                    checked={checkedDocuments.has(doc.id)}
                    onChange={() => handleDocumentCheck(doc.id)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      marginTop: '2px'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '16px', margin: 0 }}>
                        {doc.name}
                      </h4>
                      {doc.required && (
                        <span style={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          必須
                        </span>
                      )}
                      {doc.format && (
                        <span style={{
                          backgroundColor: '#e0e7ff',
                          color: '#3730a3',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {doc.format}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                      {doc.description}
                    </p>
                    {doc.notes && (
                      <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
                        ※ {doc.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* 注意事項 */}
      <div style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px', marginBottom: '32px' }}>
        <h4 style={{ fontSize: '16px', marginBottom: '8px', color: '#92400e' }}>
          ⚠️ ご注意ください
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e', fontSize: '14px' }}>
          <li>各種証明書は発行から3ヶ月以内のものをご用意ください</li>
          <li>見積書は税抜金額で記載されたものが必要です</li>
          <li>すべての書類はPDF形式での提出を推奨します</li>
          <li>書類に不備があると審査に時間がかかる場合があります</li>
        </ul>
      </div>
      
      {/* アクションボタン */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button
          onClick={() => navigate(`/document-requirements/${subsidyType}`)}
          style={{
            padding: '12px 32px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          戻る
        </button>
        <button
          onClick={() => navigate('/input-form')}
          disabled={!canProceed}
          style={{
            padding: '12px 32px',
            backgroundColor: canProceed ? '#2563eb' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: canProceed ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            fontWeight: '500',
            opacity: canProceed ? 1 : 0.6
          }}
        >
          {canProceed ? '申請書作成へ進む' : 'すべての必須書類を確認してください'}
        </button>
      </div>
    </div>
  );
};

export default RequiredDocumentsList;