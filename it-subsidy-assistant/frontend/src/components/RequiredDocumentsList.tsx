import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { requiredDocuments, documentCategoryLabels, RequiredDocument } from '../data/required-documents';
import '../styles/modern-ui.css';

interface RequiredDocumentsListProps {
  subsidyType: string;
  subsidyName: string;
  requiredDocuments?: any[];
}

const RequiredDocumentsList: React.FC<RequiredDocumentsListProps> = ({ subsidyType, subsidyName, requiredDocuments: propDocuments }) => {
  const navigate = useNavigate();
  const { subsidyType: urlSubsidyType } = useParams<{ subsidyType: string }>();
  const [checkedDocuments, setCheckedDocuments] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // URLパラメータ、props、デフォルト値の優先順位で取得
  const actualSubsidyType = urlSubsidyType || subsidyType || 'jizokuka';
  const actualSubsidyName = subsidyName || 
    (actualSubsidyType === 'it-donyu' ? 'IT導入補助金2025' : 
     actualSubsidyType === 'monozukuri' ? 'ものづくり補助金' : 
     '小規模事業者持続化補助金');
  
  // propsから渡された書類リストがあればそれを使用、なければデフォルトを使用
  const documents = propDocuments?.map(doc => ({
    id: doc.id,
    name: doc.name,
    description: doc.description || '',
    required: doc.required,
    category: doc.category || 'application', // カテゴリが指定されていればそれを使用
    format: doc.format || 'excel',
    examples: []
  })) || requiredDocuments[actualSubsidyType] || [];
  
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
  
  const handleSelectAll = () => {
    if (selectAll) {
      setCheckedDocuments(new Set());
    } else {
      const allDocIds = documents.map(doc => doc.id);
      setCheckedDocuments(new Set(allDocIds));
    }
    setSelectAll(!selectAll);
  };
  
  const requiredDocumentsCount = documents.filter(doc => doc.required).length;
  const checkedRequiredCount = documents.filter(doc => doc.required && checkedDocuments.has(doc.id)).length;
  const completionRate = requiredDocumentsCount > 0 
    ? Math.round((checkedRequiredCount / requiredDocumentsCount) * 100)
    : 0;
  
  const canProceed = documents.filter(doc => doc.required).every(doc => checkedDocuments.has(doc.id));

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>{actualSubsidyName} - 必要書類一覧</h2>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>
        申請に必要な書類をご確認ください。すべての必須書類を準備してから次へお進みください。
      </p>
      
      {/* 残りのタスクとスケジュール */}
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '2px solid #3b82f6',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <h3 style={{ fontSize: '20px', marginBottom: '16px', color: '#1e40af' }}>📅 残りのタスクとスケジュール</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>📋 現在のステップ</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151' }}>
              <li>必要書類の確認と準備（現在地）</li>
            </ul>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>🚀 今後の流れ</h4>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151' }}>
              <li>必須書類をすべて準備する</li>
              <li>申請書作成フォームで詳細情報を入力</li>
              <li>作成した申請書をダウンロード（Excel/CSV形式）</li>
              <li>公式申請システムへ正式申請</li>
            </ol>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>⏰ 推奨スケジュール</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151' }}>
              <li><strong>本日〜3日以内</strong>: 必要書類の収集・準備</li>
              <li><strong>4〜5日目</strong>: 申請書作成・内容確認</li>
              <li><strong>6〜7日目</strong>: 公式システムへの申請提出</li>
              <li><strong>申請後1〜2ヶ月</strong>: 審査結果の通知</li>
            </ul>
          </div>
          
          <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#92400e' }}>⚠️ 重要な締切</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
              {actualSubsidyName}の次回締切: <strong>2025年3月31日</strong><br/>
              余裕を持って2週間前までの申請を推奨します。
            </p>
          </div>
        </div>
      </div>
      
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
            navigate(guideUrls[actualSubsidyType as keyof typeof guideUrls] || '/guide');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={handleSelectAll}
              style={{
                padding: '8px 16px',
                backgroundColor: selectAll ? '#ef4444' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {selectAll ? '全選択解除' : '全て選択'}
            </button>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: completionRate === 100 ? '#16a34a' : '#2563eb' }}>
              {completionRate}%
            </span>
          </div>
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