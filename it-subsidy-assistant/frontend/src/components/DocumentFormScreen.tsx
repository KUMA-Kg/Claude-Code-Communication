import React, { useState } from 'react';
import { ArrowRight, FileText, Save, Eye, Download } from 'lucide-react';
import { styles } from '../styles';

interface DocumentRequirement {
  id: string;
  name: string;
  category: string;
  description: string;
  required_for_categories?: string[];
  required_for_frames?: string[];
  required_for_all?: boolean;
  required_when?: string;
  template_questions: string[];
}

interface FormData {
  [documentId: string]: {
    [questionIndex: string]: string;
  };
}

interface DocumentFormScreenProps {
  requiredDocuments: DocumentRequirement[];
  subsidyName: string;
  onNext: (formData: FormData) => void;
  onBack: () => void;
}

const DocumentFormScreen: React.FC<DocumentFormScreenProps> = ({
  requiredDocuments,
  subsidyName,
  onNext,
  onBack
}) => {
  const [formData, setFormData] = useState<FormData>({});
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const currentDocument = requiredDocuments[currentDocumentIndex];
  const isLastDocument = currentDocumentIndex === requiredDocuments.length - 1;

  const handleInputChange = (documentId: string, questionIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [documentId]: {
        ...prev[documentId],
        [questionIndex]: value
      }
    }));
  };

  const getCurrentDocumentData = () => {
    return formData[currentDocument.id] || {};
  };

  const isCurrentDocumentComplete = () => {
    const currentData = getCurrentDocumentData();
    return currentDocument.template_questions.every((_, index) => 
      currentData[index] && currentData[index].trim().length > 0
    );
  };

  const getTotalCompletionStatus = () => {
    const completedDocs = requiredDocuments.filter(doc => {
      const docData = formData[doc.id] || {};
      return doc.template_questions.every((_, index) => 
        docData[index] && docData[index].trim().length > 0
      );
    });
    return { completed: completedDocs.length, total: requiredDocuments.length };
  };

  const handleNext = () => {
    if (isLastDocument) {
      onNext(formData);
    } else {
      setCurrentDocumentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentDocumentIndex > 0) {
      setCurrentDocumentIndex(prev => prev - 1);
    }
  };

  const generatePreviewText = (doc: DocumentRequirement) => {
    const docData = formData[doc.id] || {};
    let preview = `【${doc.name}】\n\n`;
    
    doc.template_questions.forEach((question, index) => {
      const answer = docData[index] || '（未記入）';
      preview += `${index + 1}. ${question}\n${answer}\n\n`;
    });
    
    return preview;
  };

  const { completed, total } = getTotalCompletionStatus();
  const overallProgress = (completed / total) * 100;

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ ...styles.flex.center, gap: '12px', marginBottom: '16px' }}>
          <FileText size={32} color="#2563eb" />
          <h1 style={styles.text.title}>申請書類の作成</h1>
        </div>
        <p style={styles.text.subtitle}>
          {subsidyName}の申請に必要な情報を入力してください
        </p>
      </div>

      {/* 全体の進捗 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ ...styles.flex.between, marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            全体の進捗: {completed} / {total} 書類完了
          </span>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div style={styles.progressBar.container}>
          <div 
            style={{ ...styles.progressBar.fill, width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* 書類ナビゲーション */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {requiredDocuments.map((doc, index) => {
            const isCompleted = formData[doc.id] && doc.template_questions.every((_, qIndex) => 
              formData[doc.id][qIndex] && formData[doc.id][qIndex].trim().length > 0
            );
            const isCurrent = index === currentDocumentIndex;
            
            return (
              <button
                key={doc.id}
                onClick={() => setCurrentDocumentIndex(index)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: isCurrent ? '2px solid #2563eb' : '1px solid #d1d5db',
                  backgroundColor: isCompleted ? '#dcfce7' : isCurrent ? '#dbeafe' : '#f9fafb',
                  color: isCurrent ? '#2563eb' : isCompleted ? '#166534' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: isCurrent ? 'bold' : 'normal',
                  cursor: 'pointer',
                  minWidth: '120px',
                  textAlign: 'center'
                }}
              >
                {index + 1}. {doc.name}
                {isCompleted && ' ✓'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 現在の書類フォーム */}
      <div style={{ ...styles.card, marginBottom: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            {currentDocument.name}
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
            {currentDocument.description}
          </p>
          
          {/* 進捗インジケーター */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: isCurrentDocumentComplete() ? '#dcfce7' : '#fef3c7',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {isCurrentDocumentComplete() ? (
              <>
                <span style={{ color: '#166534' }}>✓ 入力完了</span>
              </>
            ) : (
              <>
                <span style={{ color: '#92400e' }}>
                  {currentDocument.template_questions.filter((_, index) => {
                    const data = getCurrentDocumentData();
                    return data[index] && data[index].trim().length > 0;
                  }).length} / {currentDocument.template_questions.length} 項目入力済み
                </span>
              </>
            )}
          </div>
        </div>

        {/* 質問フォーム */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {currentDocument.template_questions.map((question, index) => {
            const currentValue = getCurrentDocumentData()[index] || '';
            
            return (
              <div key={index}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  {index + 1}. {question}
                  <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                </label>
                
                <textarea
                  value={currentValue}
                  onChange={(e) => handleInputChange(currentDocument.id, index, e.target.value)}
                  placeholder={`${question}について詳しく記入してください...`}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    backgroundColor: '#ffffff'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                  }}
                />
                
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {currentValue.length} 文字 / 推奨: 200文字以上
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* アクションボタン */}
      <div style={{ ...styles.flex.between, marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onBack}
            disabled={currentDocumentIndex === 0}
            style={{
              ...styles.button.secondary,
              opacity: currentDocumentIndex === 0 ? 0.5 : 1,
              cursor: currentDocumentIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            ← 必要書類に戻る
          </button>
          
          <button
            onClick={handlePrevious}
            disabled={currentDocumentIndex === 0}
            style={{
              ...styles.button.secondary,
              opacity: currentDocumentIndex === 0 ? 0.5 : 1,
              cursor: currentDocumentIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            前の書類
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              ...styles.button.secondary,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Eye size={16} />
            プレビュー
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isCurrentDocumentComplete()}
            style={{
              ...styles.button.primary,
              opacity: !isCurrentDocumentComplete() ? 0.5 : 1,
              cursor: !isCurrentDocumentComplete() ? 'not-allowed' : 'pointer'
            }}
          >
            <span>{isLastDocument ? '確認画面へ' : '次の書類'}</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* プレビューモーダル */}
      {showPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            margin: '20px'
          }}>
            <div style={{ ...styles.flex.between, marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>書類プレビュー</h3>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  ...styles.button.secondary,
                  padding: '8px 12px',
                  fontSize: '14px'
                }}
              >
                閉じる
              </button>
            </div>
            
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-line',
              fontFamily: 'monospace'
            }}>
              {generatePreviewText(currentDocument)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentFormScreen;