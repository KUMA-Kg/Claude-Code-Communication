import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronLeft, 
  Save,
  LogIn,
  AlertCircle
} from 'lucide-react';
import { AkinatorQuestionnaire } from './AkinatorQuestionnaire';
import { SubsidyResults } from './SubsidyResults';
import { DocumentRequirementScreen } from './DocumentRequirementScreen';
import { AIDocumentAssistant } from './AIDocumentAssistant';
import { SessionManager } from './session/SessionManager';
import { ProgressBar } from './questionnaire/ProgressBar';
import { useSessionManager } from '../hooks/useSessionManager';
import { useAuth } from '../hooks/useAuth';
import { useDarkModeColors } from '../hooks/useDarkMode';
import { apiService } from '../services/api.service';

// 診断フローのステップ
const FLOW_STEPS = [
  '診断開始',
  '補助金選択',
  '必要書類確認',
  'AI文書作成',
  '完了'
];

export const DiagnosisFlowWithSession: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useDarkModeColors();
  const { user } = useAuth();
  const {
    currentSession,
    isLoading,
    isSaving,
    createNewSession,
    updateSession,
    saveAnswer,
    updateStep,
    saveToServer,
    loadFromServer,
    fetchSessions,
    deleteSession
  } = useSessionManager();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSubsidy, setSelectedSubsidy] = useState<any>(null);
  const [documentAnswers, setDocumentAnswers] = useState<Record<string, any>>({});
  const [generatedDocuments, setGeneratedDocuments] = useState<any[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // セッションからの状態復元
  useEffect(() => {
    if (currentSession) {
      setCurrentStep(currentSession.currentStep || 0);
      
      if (currentSession.subsidyType) {
        setSelectedSubsidy({
          type: currentSession.subsidyType,
          ...currentSession.answers.subsidy
        });
      }
      
      if (currentSession.answers.documents) {
        setDocumentAnswers(currentSession.answers.documents);
      }
      
      if (currentSession.documents) {
        setGeneratedDocuments(currentSession.documents);
      }
    }
  }, [currentSession]);

  // ステップ変更時の処理
  const handleStepChange = (newStep: number) => {
    setCurrentStep(newStep);
    updateStep(newStep);
  };

  // 診断完了時の処理
  const handleQuestionnaireComplete = (results: any) => {
    saveAnswer('questionnaireResults', results);
    
    // AIマッチングAPIを呼び出す
    if (user) {
      performAIMatching(results);
    }
    
    handleStepChange(1);
  };

  // AIマッチング実行
  const performAIMatching = async (questionnaireData: any) => {
    try {
      const response = await apiService.post('/subsidies/ai-match', {
        questionnaireData,
        companyData: currentSession?.answers.company || {}
      });
      
      if (response.success && response.data) {
        saveAnswer('aiMatchingResults', response.data);
      }
    } catch (error) {
      console.error('AIマッチングエラー:', error);
    }
  };

  // 補助金選択時の処理
  const handleSubsidySelect = (subsidy: any) => {
    setSelectedSubsidy(subsidy);
    updateSession({
      subsidyType: subsidy.type,
      answers: {
        ...currentSession?.answers,
        subsidy
      }
    });
    handleStepChange(2);
  };

  // 書類確認完了時の処理
  const handleDocumentComplete = (answers: Record<string, any>) => {
    setDocumentAnswers(answers);
    saveAnswer('documents', answers);
    handleStepChange(3);
  };

  // AI文書生成完了時の処理
  const handleDocumentsGenerated = (documents: any[]) => {
    setGeneratedDocuments(documents);
    updateSession({
      documents,
      status: 'completed'
    });
    
    // 自動保存
    if (user) {
      saveToServer({ documents });
    }
    
    handleStepChange(4);
  };

  // セッション保存処理
  const handleSaveSession = async (sessionData: Partial<any>) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    try {
      await saveToServer(sessionData);
    } catch (error) {
      console.error('セッション保存エラー:', error);
    }
  };

  // セッション読み込み処理
  const handleLoadSession = async (session: any) => {
    try {
      await loadFromServer(session.id);
    } catch (error) {
      console.error('セッション読み込みエラー:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.background,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* セッション管理UI */}
        <SessionManager
          currentSession={currentSession}
          onLoadSession={handleLoadSession}
          onSaveSession={handleSaveSession}
          onNewSession={createNewSession}
        />

        {/* 進捗バー */}
        <ProgressBar
          currentStep={currentStep}
          totalSteps={FLOW_STEPS.length}
          stepLabels={FLOW_STEPS}
        />

        {/* ログインプロンプト */}
        {showLoginPrompt && (
          <div style={{
            background: colors.warning + '20',
            border: `1px solid ${colors.warning}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertCircle size={20} style={{ color: colors.warning }} />
              <span>
                診断結果を保存するにはログインが必要です
              </span>
            </div>
            <button
              onClick={() => navigate('/auth?redirect=/diagnosis')}
              style={{
                padding: '8px 16px',
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <LogIn size={16} />
              ログイン
            </button>
          </div>
        )}

        {/* メインコンテンツ */}
        <div style={{
          background: colors.backgroundSecondary,
          borderRadius: '12px',
          padding: '32px',
          minHeight: '500px'
        }}>
          {/* ステップ0: 診断開始 */}
          {currentStep === 0 && (
            <AkinatorQuestionnaire
              onComplete={handleQuestionnaireComplete}
              initialAnswers={currentSession?.answers.questionnaire}
            />
          )}

          {/* ステップ1: 補助金選択 */}
          {currentStep === 1 && (
            <SubsidyResults
              questionnaireResults={currentSession?.answers.questionnaireResults || {}}
              onSelectSubsidy={handleSubsidySelect}
              aiMatchingResults={currentSession?.answers.aiMatchingResults}
            />
          )}

          {/* ステップ2: 必要書類確認 */}
          {currentStep === 2 && selectedSubsidy && (
            <DocumentRequirementScreen
              subsidyType={selectedSubsidy.type}
              onComplete={handleDocumentComplete}
              initialAnswers={documentAnswers}
            />
          )}

          {/* ステップ3: AI文書作成 */}
          {currentStep === 3 && selectedSubsidy && (
            <AIDocumentAssistant
              subsidyType={selectedSubsidy.type}
              documentAnswers={documentAnswers}
              onDocumentsGenerated={handleDocumentsGenerated}
            />
          )}

          {/* ステップ4: 完了 */}
          {currentStep === 4 && (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: colors.success + '20',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <Save size={40} style={{ color: colors.success }} />
              </div>
              
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '16px'
              }}>
                診断が完了しました！
              </h2>
              
              <p style={{
                fontSize: '16px',
                color: colors.textSecondary,
                marginBottom: '32px',
                maxWidth: '600px',
                margin: '0 auto 32px'
              }}>
                {user ? (
                  '診断結果と生成された文書は保存されました。マイページから確認できます。'
                ) : (
                  'ログインすると診断結果を保存して、後から確認することができます。'
                )}
              </p>

              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center'
              }}>
                {user ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                      padding: '12px 24px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    マイページへ
                    <ChevronRight size={20} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/auth?mode=signup&redirect=/dashboard')}
                      style={{
                        padding: '12px 24px',
                        background: colors.primary,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      アカウントを作成
                    </button>
                    <button
                      onClick={createNewSession}
                      style={{
                        padding: '12px 24px',
                        background: 'none',
                        color: colors.primary,
                        border: `2px solid ${colors.primary}`,
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      新しい診断を開始
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ナビゲーションボタン */}
          {currentStep > 0 && currentStep < 4 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '32px',
              paddingTop: '32px',
              borderTop: `1px solid ${colors.border}`
            }}>
              <button
                onClick={() => handleStepChange(currentStep - 1)}
                style={{
                  padding: '12px 24px',
                  background: 'none',
                  color: colors.textSecondary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ChevronLeft size={20} />
                戻る
              </button>

              {/* 保存状態の表示 */}
              {isSaving && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: colors.textSecondary,
                  fontSize: '14px'
                }}>
                  <Save size={16} />
                  保存中...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};