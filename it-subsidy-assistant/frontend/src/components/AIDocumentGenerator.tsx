import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AIDocumentGeneratorProps {
  subsidyType: string;
  subsidyName: string;
  uploadedFiles?: any[];
}

interface FormQuestion {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'select' | 'radio';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required: boolean;
  category: string;
}

// 補助金タイプごとの質問定義
const questionsBySubsidy: Record<string, FormQuestion[]> = {
  'it-donyu': [
    {
      id: 'company_overview',
      question: '会社の事業内容を簡潔に教えてください',
      type: 'textarea',
      placeholder: '例：ECサイト運営、小売業など',
      required: true,
      category: '基本情報'
    },
    {
      id: 'current_challenges',
      question: '現在の業務における主な課題は何ですか？',
      type: 'textarea',
      placeholder: '例：在庫管理の効率化、顧客管理の一元化など',
      required: true,
      category: '課題認識'
    },
    {
      id: 'it_solution',
      question: '導入予定のITツール・システムの概要を教えてください',
      type: 'textarea',
      placeholder: '例：クラウド型在庫管理システム、CRMツールなど',
      required: true,
      category: '導入計画'
    },
    {
      id: 'expected_benefits',
      question: '期待される効果・改善点を教えてください',
      type: 'textarea',
      placeholder: '例：作業時間50%削減、売上20%向上など',
      required: true,
      category: '期待効果'
    },
    {
      id: 'implementation_schedule',
      question: '導入スケジュールの概要を教えてください',
      type: 'textarea',
      placeholder: '例：4月〜6月：システム選定、7月〜9月：導入・運用開始',
      required: true,
      category: '実施計画'
    }
  ],
  'monozukuri': [
    {
      id: 'product_overview',
      question: '開発・改良する製品・サービスの概要を教えてください',
      type: 'textarea',
      placeholder: '例：新素材を使用した環境配慮型パッケージの開発',
      required: true,
      category: '基本情報'
    },
    {
      id: 'innovation_points',
      question: '革新的・新規性のあるポイントは何ですか？',
      type: 'textarea',
      placeholder: '例：従来比30%の軽量化、生分解性素材の採用など',
      required: true,
      category: '革新性'
    },
    {
      id: 'market_needs',
      question: '市場ニーズや顧客の要望について教えてください',
      type: 'textarea',
      placeholder: '例：環境意識の高まり、SDGsへの対応要求など',
      required: true,
      category: '市場性'
    },
    {
      id: 'production_plan',
      question: '生産体制・製造プロセスの改善点を教えてください',
      type: 'textarea',
      placeholder: '例：新設備導入による生産性向上、品質管理体制の強化',
      required: true,
      category: '生産計画'
    },
    {
      id: 'sales_strategy',
      question: '販売戦略・想定顧客について教えてください',
      type: 'textarea',
      placeholder: '例：大手小売チェーンへの提案、ECサイトでの直販開始',
      required: true,
      category: '販売戦略'
    }
  ],
  'jizokuka': [
    {
      id: 'business_challenge',
      question: '現在直面している経営課題を教えてください',
      type: 'textarea',
      placeholder: '例：売上減少、新規顧客獲得の停滞など',
      required: true,
      category: '課題認識'
    },
    {
      id: 'improvement_plan',
      question: '改善・強化したい取り組みを教えてください',
      type: 'textarea',
      placeholder: '例：ホームページ開設、SNS活用、チラシ配布など',
      required: true,
      category: '改善計画'
    },
    {
      id: 'target_customers',
      question: 'ターゲットとする顧客層を教えてください',
      type: 'textarea',
      placeholder: '例：地域の30〜40代主婦層、観光客など',
      required: true,
      category: '顧客戦略'
    },
    {
      id: 'uniqueness',
      question: '自社の強み・独自性を教えてください',
      type: 'textarea',
      placeholder: '例：地域唯一の専門店、職人の技術力など',
      required: true,
      category: '強み分析'
    },
    {
      id: 'expected_results',
      question: '期待される成果を教えてください',
      type: 'textarea',
      placeholder: '例：売上10%向上、新規顧客月10件獲得など',
      required: true,
      category: '期待成果'
    }
  ],
  'jigyou-saikouchiku': [
    {
      id: 'restructuring_reason',
      question: '事業再構築が必要な理由・背景を教えてください',
      type: 'textarea',
      placeholder: '例：コロナ禍での売上減少、市場環境の変化など',
      required: true,
      category: '背景・理由'
    },
    {
      id: 'new_business_overview',
      question: '新しい事業の概要を教えてください',
      type: 'textarea',
      placeholder: '例：飲食店からデリバリー専門店への転換、製造業からサービス業への展開',
      required: true,
      category: '新事業計画'
    },
    {
      id: 'market_analysis',
      question: '新事業の市場性・成長性について教えてください',
      type: 'textarea',
      placeholder: '例：デリバリー市場の拡大、高齢化社会のニーズなど',
      required: true,
      category: '市場分析'
    },
    {
      id: 'competitive_advantage',
      question: '競合他社との差別化ポイントを教えてください',
      type: 'textarea',
      placeholder: '例：独自の技術・ノウハウ、地域密着型サービスなど',
      required: true,
      category: '競争優位性'
    },
    {
      id: 'investment_plan',
      question: '必要な投資・設備について教えてください',
      type: 'textarea',
      placeholder: '例：新店舗の内装工事、製造設備の導入など',
      required: true,
      category: '投資計画'
    }
  ]
};

export const AIDocumentGenerator: React.FC<AIDocumentGeneratorProps> = ({
  subsidyType,
  subsidyName,
  uploadedFiles
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [apiKey, setApiKey] = useState(sessionStorage.getItem('openai_api_key') || '');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(!apiKey);

  const questions = questionsBySubsidy[subsidyType] || [];
  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generateDocument();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateDocument = async () => {
    setIsGenerating(true);
    
    try {
      // ここでOpenAI APIを呼び出して文書を生成
      // 実際の実装では、バックエンドAPIを経由して呼び出すことを推奨
      const prompt = createPrompt();
      
      // デモ用のダミー生成（実際はAPIコール）
      setTimeout(() => {
        const dummyDocument = createDummyDocument();
        setGeneratedDocument(dummyDocument);
        setIsGenerating(false);
      }, 3000);
      
    } catch (error) {
      console.error('文書生成エラー:', error);
      setIsGenerating(false);
    }
  };

  const createPrompt = () => {
    let prompt = `${subsidyName}の申請書類を作成してください。\n\n`;
    
    questions.forEach(q => {
      const answer = answers[q.id];
      if (answer) {
        prompt += `【${q.question}】\n${answer}\n\n`;
      }
    });
    
    prompt += '\n上記の情報を基に、補助金申請に適した形式で文書を作成してください。';
    
    return prompt;
  };

  const createDummyDocument = () => {
    const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
    
    return `${subsidyName} 申請書

1. 申請者情報
会社名: ${companyData.companyName || '株式会社サンプル'}
代表者名: ${companyData.representativeName || '代表 太郎'}
設立年月: ${companyData.establishmentDate || '2020年4月'}

2. 事業概要
${answers.company_overview || answers.product_overview || answers.business_challenge || answers.restructuring_reason || ''}

3. 実施計画
${Object.entries(answers).map(([key, value]) => {
  const question = questions.find(q => q.id === key);
  return question ? `・${question.question}\n  ${value}\n` : '';
}).join('\n')}

4. 期待される効果
本事業の実施により、以下の効果が期待されます：
${answers.expected_benefits || answers.expected_results || '- 生産性の向上\n- 売上の増加\n- 新規顧客の獲得'}

5. 実施スケジュール
${answers.implementation_schedule || '第1四半期：準備・計画\n第2四半期：実施・導入\n第3四半期：運用・改善\n第4四半期：評価・展開'}

以上`;
  };

  const handleSaveDocument = () => {
    // 生成された文書を保存
    sessionStorage.setItem(`generated_document_${subsidyType}`, generatedDocument);
    sessionStorage.setItem(`ai_answers_${subsidyType}`, JSON.stringify(answers));
    
    // 入力フォームページへ遷移
    navigate(`/input-form/${subsidyType}`);
  };

  const handleApiKeySave = () => {
    sessionStorage.setItem('openai_api_key', apiKey);
    setShowApiKeyDialog(false);
  };

  if (showApiKeyDialog) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
        }}>
          <h2 style={{ marginBottom: '16px' }}>APIキーの設定</h2>
          <p style={{ marginBottom: '24px', color: '#6b7280' }}>
            AI文書生成機能を利用するには、OpenAI APIキーが必要です。
            APIキーは安全に保管され、このセッション内でのみ使用されます。
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              marginBottom: '16px'
            }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleApiKeySave}
              disabled={!apiKey}
              style={{
                flex: 1,
                padding: '12px',
                background: apiKey ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: apiKey ? 'pointer' : 'not-allowed'
              }}
            >
              保存して続ける
            </button>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: '12px 24px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              スキップ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
            AI文書を生成中...
          </h2>
          <p style={{ color: '#6b7280' }}>
            入力いただいた情報を基に、最適な申請書類を作成しています
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (generatedDocument) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                生成された申請書類
              </h1>
              <button
                onClick={() => setEditMode(!editMode)}
                style={{
                  padding: '10px 20px',
                  background: editMode ? '#10b981' : '#f3f4f6',
                  color: editMode ? 'white' : '#374151',
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
                {editMode ? '✓ 編集完了' : '✏️ 編集'}
              </button>
            </div>

            {editMode ? (
              <textarea
                value={generatedDocument}
                onChange={(e) => setGeneratedDocument(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '600px',
                  padding: '20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            ) : (
              <div style={{
                padding: '20px',
                background: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                whiteSpace: 'pre-wrap',
                fontSize: '16px',
                lineHeight: '1.8',
                fontFamily: 'sans-serif'
              }}>
                {generatedDocument}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '16px',
              marginTop: '32px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleSaveDocument}
                style={{
                  padding: '14px 32px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                この内容で次へ進む
              </button>
              <button
                onClick={() => {
                  setGeneratedDocument('');
                  setCurrentStep(0);
                }}
                style={{
                  padding: '14px 32px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                再生成
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* プログレスバー */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              質問 {currentStep + 1} / {questions.length}
            </span>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {Math.round(progress)}% 完了
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e5e7eb',
            borderRadius: '100px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              transition: 'width 0.5s ease',
              borderRadius: '100px'
            }} />
          </div>
        </div>

        {/* 質問カード */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#764ba2',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            {currentQuestion.category}
          </div>
          
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '32px',
            color: '#1f2937'
          }}>
            {currentQuestion.question}
          </h2>

          {currentQuestion.type === 'textarea' && (
            <textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder={currentQuestion.placeholder}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                resize: 'vertical',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
              }}
            />
          )}

          {currentQuestion.type === 'text' && (
            <input
              type="text"
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder={currentQuestion.placeholder}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
              }}
            />
          )}

          {currentQuestion.type === 'select' && (
            <select
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                background: 'white',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="">選択してください</option>
              {currentQuestion.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {currentQuestion.type === 'radio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentQuestion.options?.map(option => (
                <label
                  key={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    border: '2px solid',
                    borderColor: answers[currentQuestion.id] === option.value ? '#667eea' : '#e5e7eb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: answers[currentQuestion.id] === option.value ? '#f0f4ff' : 'white'
                  }}
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option.value}
                    checked={answers[currentQuestion.id] === option.value}
                    onChange={(e) => handleAnswer(e.target.value)}
                    style={{ marginRight: '12px' }}
                  />
                  <span style={{ fontSize: '16px' }}>{option.label}</span>
                </label>
              ))}
            </div>
          )}

          {/* ナビゲーションボタン */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '48px'
          }}>
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              style={{
                padding: '12px 24px',
                background: currentStep === 0 ? '#e5e7eb' : '#f3f4f6',
                color: currentStep === 0 ? '#9ca3af' : '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ← 前へ
            </button>
            
            <button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id] && currentQuestion.required}
              style={{
                padding: '12px 24px',
                background: answers[currentQuestion.id] || !currentQuestion.required
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#e5e7eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: answers[currentQuestion.id] || !currentQuestion.required ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: answers[currentQuestion.id] || !currentQuestion.required
                  ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                  : 'none'
              }}
            >
              {currentStep === questions.length - 1 ? 'AI文書を生成' : '次へ'}
              {currentStep < questions.length - 1 && '→'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDocumentGenerator;