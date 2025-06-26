import React, { useState } from 'react';
import AkinatorQuestionnaire from './AkinatorQuestionnaire';
import SubsidySelectionScreen from './SubsidySelectionScreen';
import DocumentRequirementScreen from './DocumentRequirementScreen';
import DocumentFormScreen from './DocumentFormScreen';
import EnhancedConfirmationScreen from './EnhancedConfirmationScreen';

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

type FlowStep = 'questionnaire' | 'selection' | 'documents' | 'forms' | 'confirmation';

const SubsidyFlowApp: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('questionnaire');
  const [answers, setAnswers] = useState<AkinatorAnswer[]>([]);
  const [matches, setMatches] = useState<SubsidyMatch[]>([]);
  const [selectedSubsidy, setSelectedSubsidy] = useState<SubsidyMatch | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<DocumentRequirement[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [companyData, setCompanyData] = useState<any>({});
  const [questionnaireData, setQuestionnaireData] = useState<any>({});

  // 補助金タイプのマッピング関数
  const getSubsidyTypeMapping = (subsidyType: string): string => {
    const mappings: { [key: string]: string } = {
      'it-subsidy': 'it_donyu_2025',
      'monozukuri': 'monozukuri',
      'jizokuka': 'jizokuka'
    };
    return mappings[subsidyType] || subsidyType;
  };

  const handleQuestionnaireComplete = (questionnaireAnswers: AkinatorAnswer[], subsidyMatches: SubsidyMatch[]) => {
    setAnswers(questionnaireAnswers);
    setMatches(subsidyMatches);
    
    // questionnaireAnswersを扱いやすい形式に変換
    const qaData: any = {};
    questionnaireAnswers.forEach(answer => {
      qaData[answer.questionId] = answer.selectedValue;
    });
    setQuestionnaireData(qaData);
    
    setCurrentStep('selection');
  };

  const handleSubsidySelect = (subsidy: SubsidyMatch) => {
    setSelectedSubsidy(subsidy);
    setCurrentStep('documents');
  };

  const handleDocumentsNext = (documents: DocumentRequirement[]) => {
    setRequiredDocuments(documents);
    setCurrentStep('forms');
  };

  const handleFormsNext = (data: FormData) => {
    setFormData(data);
    
    // formDataをcompanyDataに統合（フラットな構造で保存）
    const updatedCompanyData = { ...companyData };
    Object.entries(data).forEach(([docId, docData]) => {
      if (typeof docData === 'object' && docData !== null) {
        Object.entries(docData).forEach(([key, value]) => {
          // ドキュメントごとのデータをフラットに保存
          updatedCompanyData[key] = value;
        });
      }
    });
    setCompanyData(updatedCompanyData);
    
    setCurrentStep('confirmation');
  };

  const handleEditDocument = (documentIndex: number) => {
    setCurrentDocumentIndex(documentIndex);
    setCurrentStep('forms');
  };

  const handleBackToQuestionnaire = () => {
    setCurrentStep('questionnaire');
    setAnswers([]);
    setMatches([]);
    setSelectedSubsidy(null);
    setRequiredDocuments([]);
    setFormData({});
    setCurrentDocumentIndex(0);
  };

  const handleBackToSelection = () => {
    setCurrentStep('selection');
    setSelectedSubsidy(null);
    setRequiredDocuments([]);
    setFormData({});
    setCurrentDocumentIndex(0);
  };

  const handleBackToDocuments = () => {
    setCurrentStep('documents');
    setFormData({});
    setCurrentDocumentIndex(0);
  };

  const handleBackToForms = () => {
    setCurrentStep('forms');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'questionnaire':
        return (
          <AkinatorQuestionnaire 
            onComplete={handleQuestionnaireComplete}
          />
        );
      
      case 'selection':
        return (
          <SubsidySelectionScreen 
            matches={matches}
            onSelect={handleSubsidySelect}
            onBack={handleBackToQuestionnaire}
          />
        );
      
      case 'documents':
        return selectedSubsidy ? (
          <DocumentRequirementScreen 
            selectedSubsidy={selectedSubsidy}
            onNext={handleDocumentsNext}
            onBack={handleBackToSelection}
          />
        ) : null;
      
      case 'forms':
        return selectedSubsidy ? (
          <DocumentFormScreen 
            requiredDocuments={requiredDocuments}
            subsidyName={selectedSubsidy.subsidyName}
            onNext={handleFormsNext}
            onBack={handleBackToDocuments}
          />
        ) : null;
      
      case 'confirmation':
        return selectedSubsidy ? (
          <EnhancedConfirmationScreen 
            requiredDocuments={requiredDocuments}
            formData={formData}
            subsidyName={selectedSubsidy.subsidyName}
            subsidyType={getSubsidyTypeMapping(selectedSubsidy.subsidyType)}
            companyData={companyData}
            questionnaireData={questionnaireData}
            onBack={handleBackToForms}
            onEdit={handleEditDocument}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '20px 0'
    }}>
      {/* プログレスインジケーター */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '32px',
        padding: '0 20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '16px'
        }}>
          {[
            { step: 'questionnaire', label: '基礎質問', number: 1 },
            { step: 'selection', label: '補助金選択', number: 2 },
            { step: 'documents', label: '必要書類', number: 3 },
            { step: 'forms', label: '書類作成', number: 4 },
            { step: 'confirmation', label: '確認・出力', number: 5 }
          ].map((item, index) => {
            const isActive = currentStep === item.step;
            const isCompleted = ['questionnaire', 'selection', 'documents', 'forms', 'confirmation']
              .indexOf(currentStep) > index;
            
            return (
              <React.Fragment key={item.step}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? '#22c55e' : isActive ? '#2563eb' : '#d1d5db',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    {isCompleted ? '✓' : item.number}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: isActive ? '#2563eb' : isCompleted ? '#22c55e' : '#6b7280',
                    fontWeight: isActive ? 'bold' : 'normal',
                    textAlign: 'center'
                  }}>
                    {item.label}
                  </span>
                </div>
                
                {index < 4 && (
                  <div style={{
                    width: '60px',
                    height: '2px',
                    backgroundColor: isCompleted ? '#22c55e' : '#d1d5db'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        {renderCurrentStep()}
      </div>

      {/* フッター */}
      <div style={{
        marginTop: '64px',
        padding: '24px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0
        }}>
          補助金申請支援システム | 各補助金の詳細は公式サイトをご確認ください
        </p>
      </div>
    </div>
  );
};

export default SubsidyFlowApp;