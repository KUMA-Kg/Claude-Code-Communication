import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

interface Question {
  id: string;
  type: 'single_select' | 'multi_select';
  required: boolean;
  question: string;
  condition?: string;
  options: Array<{
    value: string;
    label: string;
    icon?: string;
    description?: string;
    next_questions?: string[];
    suggested_frame?: string;
    frame_name?: string;
  }>;
  validation?: {
    min?: number;
    message?: string;
  };
}

interface FrameResult {
  frame_code: string;
  frame_name: string;
  required_documents: string[];
  optional_documents: string[];
}

interface QuestionnaireData {
  subsidy_type: string;
  title: string;
  description: string;
  questions: Question[];
  frame_determination_rules: Record<string, FrameResult>;
}

// IT導入補助金の質問票データ（実際のJSONから抜粋）
const itSubsidyData: QuestionnaireData = {
  subsidy_type: "IT導入補助金2025",
  title: "IT導入補助金 申請枠判定",
  description: "最小の質問で最適な申請枠を判定します",
  questions: [
    {
      id: "q1_main_challenge",
      type: "single_select",
      required: true,
      question: "どのような課題を解決したいですか？",
      options: [
        {
          value: "digitalization",
          label: "紙の業務をデジタル化したい",
          icon: "📄",
          description: "請求書、契約書、受発注などの電子化",
          suggested_frame: "denshi",
          frame_name: "電子化枠"
        },
        {
          value: "security",
          label: "セキュリティを強化したい",
          icon: "🔒",
          description: "サイバー攻撃対策、情報漏洩防止",
          suggested_frame: "security",
          frame_name: "セキュリティ枠"
        },
        {
          value: "invoice",
          label: "インボイス制度に対応したい",
          icon: "📊",
          description: "適格請求書発行、経理業務効率化",
          suggested_frame: "invoice",
          frame_name: "インボイス枠"
        },
        {
          value: "collaboration",
          label: "複数企業で共同導入したい",
          icon: "🤝",
          description: "グループ企業、取引先との連携",
          next_questions: ["q2_company_count"],
          suggested_frame: "fukusu",
          frame_name: "複数社枠"
        },
        {
          value: "general",
          label: "業務全般を効率化したい",
          icon: "💼",
          description: "在庫管理、顧客管理、生産性向上など",
          suggested_frame: "tsujyo",
          frame_name: "通常枠"
        }
      ]
    },
    {
      id: "q2_company_count",
      type: "single_select",
      required: true,
      condition: "q1_main_challenge === 'collaboration'",
      question: "何社で共同申請しますか？",
      validation: {
        min: 2,
        message: "複数社枠は最低2社以上の共同申請が必要です"
      },
      options: [
        { value: "2", label: "2社" },
        { value: "3", label: "3社" },
        { value: "4", label: "4社" },
        { value: "5_or_more", label: "5社以上" }
      ]
    }
  ],
  frame_determination_rules: {
    denshi: {
      frame_code: "denshi",
      frame_name: "電子化枠",
      required_documents: ["交付規程", "公募要領", "実施内容説明書", "価格説明書"],
      optional_documents: ["賃金引上げ計画書"]
    },
    security: {
      frame_code: "security",
      frame_name: "セキュリティ枠",
      required_documents: ["交付規程", "公募要領", "実施内容説明書", "価格説明書"],
      optional_documents: ["賃金引上げ計画書"]
    },
    invoice: {
      frame_code: "invoice",
      frame_name: "インボイス枠",
      required_documents: ["交付規程", "公募要領"],
      optional_documents: ["賃金引上げ計画書"]
    },
    fukusu: {
      frame_code: "fukusu",
      frame_name: "複数社枠",
      required_documents: ["交付規程", "公募要領", "実施内容説明書", "価格説明書", "共同申請書"],
      optional_documents: ["賃金引上げ計画書"]
    },
    tsujyo: {
      frame_code: "tsujyo",
      frame_name: "通常枠",
      required_documents: ["交付規程", "公募要領"],
      optional_documents: ["賃金引上げ計画書"]
    }
  }
};

interface SubsidyFrameSelectorProps {
  subsidyType?: 'it-introduction' | 'manufacturing' | 'sustainability';
  onFrameSelected?: (frame: FrameResult & { answers: Record<string, any> }) => void;
}

export const SubsidyFrameSelector: React.FC<SubsidyFrameSelectorProps> = ({
  subsidyType = 'it-introduction',
  onFrameSelected
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResult, setShowResult] = useState(false);
  const [recommendedFrame, setRecommendedFrame] = useState<FrameResult | null>(null);
  const [progress, setProgress] = useState(0);

  // 現在は IT導入補助金のみ実装
  const questionnaireData = itSubsidyData;
  const questions = questionnaireData.questions.filter(q => 
    !q.condition || evaluateCondition(q.condition, answers)
  );

  useEffect(() => {
    setProgress((currentQuestionIndex / questions.length) * 100);
  }, [currentQuestionIndex, questions.length]);

  function evaluateCondition(condition: string, answers: Record<string, any>): boolean {
    // 簡単な条件評価（実際のプロダクションではより堅牢な実装が必要）
    const parts = condition.split(' === ');
    if (parts.length === 2) {
      const [key, value] = parts;
      return answers[key] === value.replace(/'/g, '');
    }
    return false;
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (value: string | string[]) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // 次の質問へ進むか結果を表示
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex(currentQuestionIndex + 1), 300);
    } else {
      // 回答完了 - 推奨枠を決定
      determineRecommendedFrame(newAnswers);
    }
  };

  const determineRecommendedFrame = (finalAnswers: Record<string, any>) => {
    let frameCode = 'tsujyo'; // デフォルト
    
    if (finalAnswers.q1_main_challenge) {
      const mainChallenge = finalAnswers.q1_main_challenge;
      const selectedOption = currentQuestion.options.find(opt => opt.value === mainChallenge);
      if (selectedOption?.suggested_frame) {
        frameCode = selectedOption.suggested_frame;
      }
    }

    const frame = questionnaireData.frame_determination_rules[frameCode];
    if (frame) {
      setRecommendedFrame(frame);
      setShowResult(true);
      
      if (onFrameSelected) {
        onFrameSelected({ ...frame, answers: finalAnswers });
      }
    }
  };

  const goBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const resetQuestionnaire = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResult(false);
    setRecommendedFrame(null);
    setProgress(0);
  };

  if (showResult && recommendedFrame) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-lg)' }}>
        <div className="card" style={{ 
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--color-success-50) 0%, var(--color-primary-50) 100%)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>🎯</div>
          <h2 className="heading-2" style={{ 
            color: 'var(--color-success-600)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            診断完了！
          </h2>
          <h3 className="heading-3" style={{ 
            color: 'var(--color-primary-900)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            おすすめの申請枠：{recommendedFrame.frame_name}
          </h3>
          
          <div className="card" style={{ 
            marginBottom: 'var(--spacing-lg)',
            textAlign: 'left',
            background: 'white'
          }}>
            <h4 className="heading-4" style={{ 
              color: 'var(--color-primary-600)',
              marginBottom: 'var(--spacing-md)'
            }}>
              📋 必要書類
            </h4>
            <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)' }}>
              {recommendedFrame.required_documents.map((doc, index) => (
                <li key={index} className="body-medium" style={{ 
                  marginBottom: 'var(--spacing-xs)',
                  color: 'var(--color-neutral-700)'
                }}>
                  ✅ {doc}
                </li>
              ))}
            </ul>
            
            {recommendedFrame.optional_documents.length > 0 && (
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <h5 className="heading-5" style={{ color: 'var(--color-neutral-600)' }}>
                  任意書類（加点要素）
                </h5>
                <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)' }}>
                  {recommendedFrame.optional_documents.map((doc, index) => (
                    <li key={index} className="body-small" style={{ 
                      marginBottom: 'var(--spacing-xs)',
                      color: 'var(--color-neutral-600)'
                    }}>
                      ⭕ {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
            <Button variant="primary" size="lg">
              📄 申請書類をダウンロード
            </Button>
            <Button variant="secondary" onClick={resetQuestionnaire}>
              🔄 もう一度診断する
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div>質問データが見つかりません</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-lg)' }}>
      {/* プログレスバー */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--spacing-sm)'
        }}>
          <span className="body-small" style={{ color: 'var(--color-neutral-600)' }}>
            質問 {currentQuestionIndex + 1} / {questions.length}
          </span>
          <span className="body-small" style={{ color: 'var(--color-primary-600)' }}>
            {Math.round(progress)}% 完了
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          background: 'var(--color-neutral-200)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600))',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* 質問カード */}
      <div className="card" style={{ 
        padding: 'var(--spacing-xl)',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ flex: 1 }}>
          <h2 className="heading-3" style={{ 
            color: 'var(--color-primary-900)',
            marginBottom: 'var(--spacing-lg)',
            lineHeight: 1.4
          }}>
            {currentQuestion.question}
            {currentQuestion.required && (
              <span style={{ color: 'var(--color-error-500)', marginLeft: 'var(--spacing-xs)' }}>*</span>
            )}
          </h2>

          <div style={{ 
            display: 'grid', 
            gap: 'var(--spacing-md)',
            gridTemplateColumns: currentQuestion.type === 'single_select' ? 'repeat(auto-fit, minmax(250px, 1fr))' : '1fr'
          }}>
            {currentQuestion.options.map((option) => {
              const isSelected = currentQuestion.type === 'single_select' 
                ? answers[currentQuestion.id] === option.value
                : Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(option.value);

              return (
                <div
                  key={option.value}
                  onClick={() => {
                    if (currentQuestion.type === 'single_select') {
                      handleAnswer(option.value);
                    } else {
                      const currentAnswers = answers[currentQuestion.id] || [];
                      const newAnswers = isSelected
                        ? currentAnswers.filter((a: string) => a !== option.value)
                        : [...currentAnswers, option.value];
                      setAnswers({ ...answers, [currentQuestion.id]: newAnswers });
                    }
                  }}
                  className="card"
                  style={{
                    padding: 'var(--spacing-lg)',
                    cursor: 'pointer',
                    border: isSelected 
                      ? '2px solid var(--color-primary-500)' 
                      : '2px solid var(--color-neutral-200)',
                    background: isSelected 
                      ? 'var(--color-primary-50)' 
                      : 'white',
                    transition: 'all 0.2s ease',
                    transformOrigin: 'center',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--color-primary-300)';
                      e.currentTarget.style.transform = 'scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--color-neutral-200)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                    {option.icon && (
                      <div style={{ fontSize: '2rem', flexShrink: 0 }}>
                        {option.icon}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div className="body-medium" style={{ 
                        fontWeight: 'bold',
                        color: isSelected ? 'var(--color-primary-700)' : 'var(--color-neutral-900)',
                        marginBottom: option.description ? 'var(--spacing-xs)' : 0
                      }}>
                        {option.label}
                        {option.frame_name && (
                          <span style={{ 
                            fontSize: '0.75rem',
                            background: 'var(--color-success-100)',
                            color: 'var(--color-success-700)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginLeft: 'var(--spacing-xs)'
                          }}>
                            → {option.frame_name}
                          </span>
                        )}
                      </div>
                      {option.description && (
                        <div className="body-small" style={{ 
                          color: isSelected ? 'var(--color-primary-600)' : 'var(--color-neutral-600)'
                        }}>
                          {option.description}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div style={{ 
                        color: 'var(--color-primary-500)',
                        fontSize: '1.2rem',
                        flexShrink: 0
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ナビゲーションボタン */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: 'var(--spacing-xl)' 
        }}>
          <Button 
            variant="secondary" 
            onClick={goBack}
            disabled={currentQuestionIndex === 0}
          >
            ← 前の質問
          </Button>
          
          {currentQuestion.type === 'multi_select' && (
            <Button 
              variant="primary"
              onClick={() => handleAnswer(answers[currentQuestion.id] || [])}
              disabled={currentQuestion.required && (!answers[currentQuestion.id] || answers[currentQuestion.id].length === 0)}
            >
              次へ →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};