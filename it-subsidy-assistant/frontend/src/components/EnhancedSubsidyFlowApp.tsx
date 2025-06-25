import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIConversationalForm from './AIConversationalForm';
import SubsidySelectionScreen from './SubsidySelectionScreen';
import DocumentRequirementScreen from './DocumentRequirementScreen';
import DocumentFormScreen from './DocumentFormScreen';
import EnhancedConfirmationScreen from './EnhancedConfirmationScreen';
import '../../templates/darkmode.css';

// ダークモード統合
const initializeDarkMode = () => {
  const script = document.createElement('script');
  script.src = '/templates/darkmode.js';
  document.body.appendChild(script);
};

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

type FlowStep = 'conversation' | 'selection' | 'documents' | 'forms' | 'confirmation';

const EnhancedSubsidyFlowApp: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('conversation');
  const [conversationData, setConversationData] = useState<any>({});
  const [matches, setMatches] = useState<SubsidyMatch[]>([]);
  const [selectedSubsidy, setSelectedSubsidy] = useState<SubsidyMatch | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<DocumentRequirement[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [showExcelPreview, setShowExcelPreview] = useState(false);

  useEffect(() => {
    initializeDarkMode();
  }, []);

  const handleConversationComplete = (data: any) => {
    setConversationData(data);
    
    // AI分析による補助金マッチング
    const subsidyMatches = analyzeAndMatchSubsidies(data);
    setMatches(subsidyMatches);
    setCurrentStep('selection');
  };

  const analyzeAndMatchSubsidies = (data: any): SubsidyMatch[] => {
    // AIマッチングロジック
    const matches: SubsidyMatch[] = [];
    
    if (data.businessType === '製造業' || data.businessType?.includes('製造')) {
      matches.push({
        subsidyType: 'monozukuri',
        subsidyName: 'ものづくり補助金',
        score: 95,
        matchLevel: 'high',
        description: '製造業の設備投資に最適',
        icon: '🏭'
      });
    }
    
    if (data.employeeCount < 20 || data.businessType?.includes('小規模')) {
      matches.push({
        subsidyType: 'jizokuka',
        subsidyName: '小規模事業者持続化補助金',
        score: 90,
        matchLevel: 'high',
        description: '小規模事業者の販路開拓を支援',
        icon: '🏪'
      });
    }
    
    // IT導入補助金は全業種対象
    matches.push({
      subsidyType: 'it-donyu',
      subsidyName: 'IT導入補助金2025',
      score: 85,
      matchLevel: 'high',
      description: 'デジタル化・IT化を支援',
      icon: '💻'
    });
    
    return matches.sort((a, b) => b.score - a.score);
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
    setCurrentStep('confirmation');
  };

  const handleEditDocument = (documentIndex: number) => {
    setCurrentStep('forms');
  };

  const handleBackToConversation = () => {
    setCurrentStep('conversation');
    setConversationData({});
    setMatches([]);
    setSelectedSubsidy(null);
    setRequiredDocuments([]);
    setFormData({});
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'conversation':
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <AIConversationalForm 
              onComplete={handleConversationComplete}
              subsidyType=""
            />
          </motion.div>
        );
      
      case 'selection':
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <SubsidySelectionScreen 
              matches={matches}
              onSelect={handleSubsidySelect}
              onBack={handleBackToConversation}
            />
          </motion.div>
        );
      
      case 'documents':
        return selectedSubsidy ? (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <DocumentRequirementScreen 
              selectedSubsidy={selectedSubsidy}
              onNext={handleDocumentsNext}
              onBack={() => setCurrentStep('selection')}
            />
          </motion.div>
        ) : null;
      
      case 'forms':
        return selectedSubsidy ? (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <DocumentFormScreen 
              requiredDocuments={requiredDocuments}
              subsidyName={selectedSubsidy.subsidyName}
              onNext={handleFormsNext}
              onBack={() => setCurrentStep('documents')}
              conversationData={conversationData}
            />
          </motion.div>
        ) : null;
      
      case 'confirmation':
        return selectedSubsidy ? (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <EnhancedConfirmationScreen 
              requiredDocuments={requiredDocuments}
              formData={formData}
              subsidyName={selectedSubsidy.subsidyName}
              onBack={() => setCurrentStep('forms')}
              onEdit={handleEditDocument}
            />
          </motion.div>
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      position: 'relative',
      transition: 'all 0.3s ease'
    }}>
      {/* Excel プレビューボタン（会話型フォーム以外で表示） */}
      {currentStep !== 'conversation' && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowExcelPreview(!showExcelPreview)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            backgroundColor: 'var(--success-color)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease'
          }}
        >
          📊
        </motion.button>
      )}

      {/* プログレスインジケーター（会話型フォーム以外で表示） */}
      {currentStep !== 'conversation' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: 'var(--bg-tertiary)',
          zIndex: 999
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ 
              width: `${
                currentStep === 'selection' ? 20 :
                currentStep === 'documents' ? 40 :
                currentStep === 'forms' ? 60 :
                currentStep === 'confirmation' ? 80 : 0
              }%` 
            }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              backgroundColor: 'var(--accent-color)'
            }}
          />
        </div>
      )}

      {/* メインコンテンツ */}
      <AnimatePresence mode="wait">
        {renderCurrentStep()}
      </AnimatePresence>

      {/* Excel プレビューパネル */}
      <AnimatePresence>
        {showExcelPreview && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '400px',
              backgroundColor: 'var(--bg-secondary)',
              borderLeft: '1px solid var(--border-color)',
              boxShadow: '-4px 0 8px rgba(0, 0, 0, 0.1)',
              padding: '20px',
              overflowY: 'auto',
              zIndex: 998
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0 }}>Excel出力プレビュー</h3>
              <button
                onClick={() => setShowExcelPreview(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h4 style={{ margin: '0 0 8px 0' }}>基本情報</h4>
              <p style={{ margin: '4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                業種: {conversationData.businessType || '未入力'}
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                従業員数: {conversationData.employeeCount || '未入力'}
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                年商: {conversationData.annualRevenue || '未入力'}
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h4 style={{ margin: '0 0 8px 0' }}>選択した補助金</h4>
              <p style={{ margin: '4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                {selectedSubsidy?.subsidyName || '未選択'}
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '16px',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 8px 0' }}>入力済み項目数</h4>
              <p style={{ margin: '4px 0', fontSize: '24px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                {Object.keys(formData).length} / {requiredDocuments.length}
              </p>
            </div>

            <button
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '20px',
                backgroundColor: 'var(--success-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => {
                // Excel出力処理
                console.log('Excel出力');
              }}
            >
              Excel形式でダウンロード
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSubsidyFlowApp;