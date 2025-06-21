import React, { useState } from 'react';
import { ArrowRight, FileText, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { styles } from '../styles';
import documentData from '../data/document-requirements.json';

interface SubsidyMatch {
  subsidyType: string;
  subsidyName: string;
  score: number;
  matchLevel: 'high' | 'medium' | 'low';
  description: string;
  icon: string;
}

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

interface DocumentRequirementScreenProps {
  selectedSubsidy: SubsidyMatch;
  onNext: (requiredDocuments: DocumentRequirement[]) => void;
  onBack: () => void;
}

const DocumentRequirementScreen: React.FC<DocumentRequirementScreenProps> = ({
  selectedSubsidy,
  onNext,
  onBack
}) => {
  const [selectedFrame, setSelectedFrame] = useState<string>('');
  const [additionalConditions, setAdditionalConditions] = useState<Record<string, boolean>>({});
  const [showFrameDetails, setShowFrameDetails] = useState(false);

  const subsidyDocuments = documentData.document_requirements[selectedSubsidy.subsidyType as keyof typeof documentData.document_requirements];
  const decisionRules = documentData.decision_rules[selectedSubsidy.subsidyType as keyof typeof documentData.decision_rules];

  const getFrameOptions = () => {
    if (selectedSubsidy.subsidyType === 'it_donyu') {
      return [
        { value: 'tsujyo', label: '通常枠', description: '一般的なITツール導入' },
        { value: 'denshi', label: 'デジタル化基盤導入枠（電子化対応）', description: '紙書類の電子化が主目的' },
        { value: 'security', label: 'デジタル化基盤導入枠（セキュリティ対応）', description: 'セキュリティ強化が主目的' },
        { value: 'invoice', label: 'デジタル化基盤導入枠（インボイス対応）', description: 'インボイス制度対応が主目的' },
        { value: 'fukusu', label: '複数社連携IT導入枠', description: '複数企業での共同導入' }
      ];
    } else if (selectedSubsidy.subsidyType === 'monozukuri') {
      return [
        { value: 'tsujyo', label: '通常枠', description: '革新的な製品・サービス開発' },
        { value: 'kaifuku', label: '回復型賃上げ・雇用拡大枠', description: '業況回復と賃上げ・雇用拡大' },
        { value: 'digital', label: 'デジタル枠', description: 'DXに資する革新的開発' },
        { value: 'green', label: 'グリーン枠', description: '環境に配慮した革新的開発' },
        { value: 'global', label: 'グローバル市場開拓枠', description: '海外市場開拓を目的とした開発' }
      ];
    } else if (selectedSubsidy.subsidyType === 'jizokuka') {
      return [
        { value: 'tsujyo', label: '通常枠', description: '一般的な販路開拓' },
        { value: 'chingin', label: '賃金引上げ枠', description: '賃金引上げを伴う販路開拓' },
        { value: 'sotsugyo', label: '卒業枠', description: '事業規模拡大を目指す取組み' },
        { value: 'kokeisha', label: '後継者支援枠', description: '事業承継を見据えた取組み' },
        { value: 'sogyo', label: '創業枠', description: '創業間もない事業者の取組み' }
      ];
    }
    return [];
  };

  const getConditionalQuestions = () => {
    const questions = [];
    
    if (selectedSubsidy.subsidyType === 'monozukuri') {
      questions.push({
        id: 'external_funding',
        question: '自己資金以外での資金調達を予定していますか？',
        description: '銀行借入、投資家からの調達等'
      });
    }
    
    if (selectedSubsidy.subsidyType === 'jizokuka') {
      questions.push({
        id: 'ceo_over_60',
        question: '代表者（社長）の年齢は60歳以上ですか？',
        description: '事業承継診断票の要否を判定します'
      });
    }
    
    return questions;
  };

  const calculateRequiredDocuments = (): DocumentRequirement[] => {
    if (!selectedFrame) return [];

    const requiredDocs: DocumentRequirement[] = [];

    subsidyDocuments.documents.forEach(doc => {
      let isRequired = false;

      // 全員必須の書類
      if (doc.required_for_all) {
        isRequired = true;
      }
      
      // 申請枠による判定
      if (doc.required_for_frames && doc.required_for_frames.includes(selectedFrame)) {
        isRequired = true;
      }
      
      // 条件による判定
      if (doc.required_when && additionalConditions[doc.required_when]) {
        isRequired = true;
      }

      if (isRequired) {
        requiredDocs.push(doc);
      }
    });

    return requiredDocs;
  };

  const handleNext = () => {
    const requiredDocuments = calculateRequiredDocuments();
    onNext(requiredDocuments);
  };

  const frameOptions = getFrameOptions();
  const conditionalQuestions = getConditionalQuestions();
  const requiredDocuments = calculateRequiredDocuments();

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ ...styles.flex.center, gap: '12px', marginBottom: '16px' }}>
          <FileText size={32} color="#2563eb" />
          <h1 style={styles.text.title}>必要書類の判定</h1>
        </div>
        <p style={styles.text.subtitle}>
          {selectedSubsidy.subsidyName}の申請に必要な書類を判定します
        </p>
      </div>

      {/* 選択済み補助金の表示 */}
      <div style={{ 
        ...styles.card, 
        marginBottom: '32px', 
        backgroundColor: '#f0f9ff',
        border: '2px solid #0ea5e9'
      }}>
        <div style={{ ...styles.flex.start, gap: '12px' }}>
          <div style={{ fontSize: '24px' }}>{selectedSubsidy.icon}</div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
              {selectedSubsidy.subsidyName}
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              適合度: {selectedSubsidy.score}点
            </p>
          </div>
        </div>
      </div>

      {/* 申請枠の選択 */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            申請枠の選択
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            事業内容に最も適した申請枠を選択してください
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {frameOptions.map((option) => {
            const isSelected = selectedFrame === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedFrame(option.value)}
                style={{
                  ...styles.selectableCard,
                  ...(isSelected ? styles.selectableCardActive : {}),
                  textAlign: 'left'
                }}
              >
                <div style={{ ...styles.flex.between, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {option.label}
                    </h4>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>{option.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle size={20} color="#2563eb" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selectedFrame && (
          <button
            onClick={() => setShowFrameDetails(!showFrameDetails)}
            style={{
              ...styles.button.secondary,
              marginTop: '12px',
              fontSize: '14px'
            }}
          >
            <HelpCircle size={16} />
            申請枠の詳細を見る
          </button>
        )}

        {showFrameDetails && selectedFrame && (
          <div style={{
            ...styles.card,
            marginTop: '12px',
            backgroundColor: '#fafafa',
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
              {frameOptions.find(f => f.value === selectedFrame)?.label} の詳細
            </h4>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              {decisionRules.frame_determination[selectedFrame as keyof typeof decisionRules.frame_determination]}
            </p>
          </div>
        )}
      </div>

      {/* 追加条件の質問 */}
      {conditionalQuestions.length > 0 && selectedFrame && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
            追加質問
          </h3>
          
          {conditionalQuestions.map((question) => (
            <div key={question.id} style={{ marginBottom: '16px' }}>
              <div style={{
                ...styles.card,
                backgroundColor: '#fffbeb',
                border: '1px solid #f59e0b'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                    {question.question}
                  </h4>
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>{question.description}</p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setAdditionalConditions(prev => ({ ...prev, [question.id]: true }))}
                    style={{
                      ...styles.button.secondary,
                      ...(additionalConditions[question.id] === true ? styles.selectableCardActive : {}),
                      fontSize: '14px',
                      padding: '8px 16px'
                    }}
                  >
                    はい
                  </button>
                  <button
                    onClick={() => setAdditionalConditions(prev => ({ ...prev, [question.id]: false }))}
                    style={{
                      ...styles.button.secondary,
                      ...(additionalConditions[question.id] === false ? styles.selectableCardActive : {}),
                      fontSize: '14px',
                      padding: '8px 16px'
                    }}
                  >
                    いいえ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 必要書類のプレビュー */}
      {selectedFrame && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
            必要書類一覧 ({requiredDocuments.length}件)
          </h3>
          
          {requiredDocuments.map((doc, index) => (
            <div
              key={doc.id}
              style={{
                ...styles.card,
                marginBottom: '12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #22c55e'
              }}
            >
              <div style={{ ...styles.flex.start, gap: '12px' }}>
                <CheckCircle size={20} color="#22c55e" />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                    {index + 1}. {doc.name}
                  </h4>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                    {doc.description}
                  </p>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    記載項目: {doc.template_questions.join('、')}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {requiredDocuments.length === 0 && (
            <div style={{
              ...styles.card,
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              textAlign: 'center'
            }}>
              <AlertCircle size={24} color="#f59e0b" style={{ margin: '0 auto 8px' }} />
              <p style={{ color: '#92400e' }}>申請枠を選択してください</p>
            </div>
          )}
        </div>
      )}

      {/* ナビゲーション */}
      <div style={styles.flex.between}>
        <button
          onClick={onBack}
          style={styles.button.secondary}
        >
          ← 補助金選択に戻る
        </button>

        <button
          onClick={handleNext}
          disabled={!selectedFrame || requiredDocuments.length === 0}
          style={{
            ...styles.button.primary,
            opacity: (!selectedFrame || requiredDocuments.length === 0) ? 0.5 : 1,
            cursor: (!selectedFrame || requiredDocuments.length === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          <span>書類作成を開始</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default DocumentRequirementScreen;