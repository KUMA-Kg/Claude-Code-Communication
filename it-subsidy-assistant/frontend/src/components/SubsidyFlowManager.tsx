import React, { useState } from 'react';
import AkinatorQuestionnaire from './AkinatorQuestionnaire';
import SubsidyMatchResult from './SubsidyMatchResult';
import DocumentRequirementQuestionnaire from './DocumentRequirementQuestionnaire';
import DetailedQuestionnaireForm from './DetailedQuestionnaireForm';
import { styles } from '../styles';

interface AkinatorAnswer {
  questionId: string;
  selectedValue: string;
}

interface SubsidyMatch {
  subsidyType: string;
  subsidyName: string;
  score: number;
  matchLevel: 'high' | 'medium' | 'low';
  description: string;
  icon: string;
}

interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  questions: string[];
  reason: string;
}

type FlowStep = 
  | 'akinator_questions'     // 1. あきねーた方式5問
  | 'subsidy_match_result'   // 2. 補助金適用可能性判定
  | 'document_requirements'  // 3. 作成資料判断のための質問
  | 'detailed_form'          // 4. 資料作成のための入力フォーム
  | 'document_output'        // 5. Web上での申請書情報出力
  | 'file_export';           // 6. 実際の資料へアウトプット

const SubsidyFlowManager: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('akinator_questions');
  const [flowData, setFlowData] = useState({
    akinatorAnswers: [] as AkinatorAnswer[],
    subsidyMatches: [] as SubsidyMatch[],
    selectedSubsidyType: '',
    requiredDocuments: [] as RequiredDocument[],
    detailedAnswers: {} as Record<string, any>
  });

  // Step 1完了: あきねーた方式質問完了
  const handleAkinatorComplete = (answers: AkinatorAnswer[], matches: SubsidyMatch[]) => {
    setFlowData(prev => ({
      ...prev,
      akinatorAnswers: answers,
      subsidyMatches: matches
    }));
    setCurrentStep('subsidy_match_result');
  };

  // Step 2完了: 補助金選択完了
  const handleSubsidySelection = (subsidyType: string) => {
    setFlowData(prev => ({
      ...prev,
      selectedSubsidyType: subsidyType
    }));
    setCurrentStep('document_requirements');
  };

  // Step 3完了: 必要書類判定完了
  const handleDocumentRequirementsComplete = (requiredDocuments: RequiredDocument[]) => {
    setFlowData(prev => ({
      ...prev,
      requiredDocuments
    }));
    setCurrentStep('detailed_form');
  };

  // Step 4完了: 詳細フォーム入力完了
  const handleDetailedFormComplete = (answers: Record<string, any>) => {
    setFlowData(prev => ({
      ...prev,
      detailedAnswers: answers
    }));
    setCurrentStep('document_output');
  };

  // やり直し機能
  const handleRetakeAkinator = () => {
    setFlowData({
      akinatorAnswers: [],
      subsidyMatches: [],
      selectedSubsidyType: '',
      requiredDocuments: [],
      detailedAnswers: {}
    });
    setCurrentStep('akinator_questions');
  };

  const handleBackToSubsidySelection = () => {
    setCurrentStep('subsidy_match_result');
  };

  const handleBackToDocumentRequirements = () => {
    setCurrentStep('document_requirements');
  };

  // フローステップの表示
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'akinator_questions':
        return (
          <AkinatorQuestionnaire 
            onComplete={handleAkinatorComplete}
          />
        );

      case 'subsidy_match_result':
        return (
          <SubsidyMatchResult
            matches={flowData.subsidyMatches}
            answers={flowData.akinatorAnswers}
            onSelectSubsidy={handleSubsidySelection}
            onRetake={handleRetakeAkinator}
          />
        );

      case 'document_requirements':
        return (
          <DocumentRequirementQuestionnaire
            subsidyType={flowData.selectedSubsidyType}
            onComplete={handleDocumentRequirementsComplete}
            onBack={handleBackToSubsidySelection}
          />
        );

      case 'detailed_form':
        return (
          <DetailedQuestionnaireForm
            subsidyType={getSubsidyName(flowData.selectedSubsidyType)}
            selectedFrame="通常枠" // TODO: 実際の選択枠を反映
            onComplete={handleDetailedFormComplete}
            onBack={handleBackToDocumentRequirements}
          />
        );

      case 'document_output':
        return (
          <DocumentOutputPage
            subsidyType={flowData.selectedSubsidyType}
            requiredDocuments={flowData.requiredDocuments}
            answers={flowData.detailedAnswers}
            onBack={handleBackToDocumentRequirements}
            onExport={() => setCurrentStep('file_export')}
          />
        );

      case 'file_export':
        return (
          <FileExportPage
            subsidyType={flowData.selectedSubsidyType}
            documentData={flowData.detailedAnswers}
            onBack={() => setCurrentStep('document_output')}
          />
        );

      default:
        return <div>不明なステップです</div>;
    }
  };

  const getSubsidyName = (subsidyType: string): string => {
    const nameMap: Record<string, string> = {
      'it_donyu': 'IT導入補助金2025',
      'monozukuri': 'ものづくり補助金（第20次締切）',
      'jizokuka': '小規模事業者持続化補助金（第17回）'
    };
    return nameMap[subsidyType] || subsidyType;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* 進捗インジケーター */}
      <div style={styles.header}>
        <div style={{ ...styles.container, paddingTop: '16px', paddingBottom: '16px' }}>
          <div style={styles.flex.between}>
            <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>補助金申請支援フロー</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {[
                { step: 'akinator_questions', label: '基礎質問', number: 1 },
                { step: 'subsidy_match_result', label: '補助金判定', number: 2 },
                { step: 'document_requirements', label: '書類判定', number: 3 },
                { step: 'detailed_form', label: '詳細入力', number: 4 },
                { step: 'document_output', label: '書類確認', number: 5 },
                { step: 'file_export', label: 'ファイル出力', number: 6 }
              ].map((item) => {
                const isActive = currentStep === item.step;
                const isCompleted = flowData.akinatorAnswers.length > 0 &&
                  ['subsidy_match_result', 'document_requirements', 'detailed_form', 'document_output', 'file_export'].includes(item.step);
                
                return (
                  <div
                    key={item.step}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: isActive ? '#2563eb' : isCompleted ? '#16a34a' : '#9ca3af'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: isActive ? '#2563eb' : isCompleted ? '#16a34a' : '#e5e7eb',
                        color: isActive || isCompleted ? 'white' : '#4b5563'
                      }}
                    >
                      {item.number}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500', display: window.innerWidth > 640 ? 'block' : 'none' }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main style={{ paddingTop: '32px', paddingBottom: '32px' }}>
        {renderCurrentStep()}
      </main>
    </div>
  );
};

// 仮のコンポーネント（後で実装）
const DocumentOutputPage: React.FC<{
  subsidyType: string;
  requiredDocuments: RequiredDocument[];
  answers: Record<string, any>;
  onBack: () => void;
  onExport: () => void;
}> = ({ subsidyType, requiredDocuments, answers, onBack, onExport }) => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={{ ...styles.text.title, marginBottom: '24px' }}>申請書類プレビュー</h1>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          入力内容を基に申請書類を生成しました。内容を確認してファイル出力してください。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          {requiredDocuments.map((doc) => (
            <div key={doc.id} style={{ ...styles.card, padding: '16px' }}>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>{doc.name}</h3>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>{doc.description}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={onBack}
            style={styles.button.secondary}
          >
            戻る
          </button>
          <button
            onClick={onExport}
            style={styles.button.primary}
          >
            ファイル出力
          </button>
        </div>
      </div>
    </div>
  );
};

const FileExportPage: React.FC<{
  subsidyType: string;
  documentData: Record<string, any>;
  onBack: () => void;
}> = ({ subsidyType, documentData, onBack }) => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={{ ...styles.text.title, marginBottom: '24px' }}>ファイル出力</h1>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          申請書類をファイル形式で出力します。
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={onBack}
            style={styles.button.secondary}
          >
            戻る
          </button>
          <button style={{ ...styles.button.primary, backgroundColor: '#16a34a' }}>
            Excel形式でダウンロード
          </button>
          <button style={{ ...styles.button.primary, backgroundColor: '#dc2626' }}>
            PDF形式でダウンロード
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubsidyFlowManager;