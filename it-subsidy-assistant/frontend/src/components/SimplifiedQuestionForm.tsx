import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SimplifiedQuestionFormProps {
  subsidyType: string;
  subsidyName: string;
  onComplete: (data: any) => void;
}

interface Question {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  options?: { value: string; label: string }[];
  category: 'common' | 'specific';
  aiHint?: string; // AIが拡張する際のヒント
}

// 共通質問（全補助金共通）
const commonQuestions: Question[] = [
  {
    id: 'companyName',
    question: '法人名・屋号',
    type: 'text',
    placeholder: '例：株式会社サンプル',
    category: 'common'
  },
  {
    id: 'businessOverview',
    question: '事業内容を簡潔に教えてください',
    type: 'textarea',
    placeholder: '例：ECサイトの運営、地域密着型の飲食店経営など',
    category: 'common',
    aiHint: 'ビジネスモデル、主要商品・サービス、顧客層を含めて拡張'
  },
  {
    id: 'employeeCount',
    question: '従業員数',
    type: 'select',
    options: [
      { value: '1-5', label: '1〜5名' },
      { value: '6-20', label: '6〜20名' },
      { value: '21-50', label: '21〜50名' },
      { value: '51-100', label: '51〜100名' },
      { value: '101-300', label: '101〜300名' },
      { value: '301+', label: '301名以上' }
    ],
    category: 'common'
  },
  {
    id: 'annualRevenue',
    question: '年間売上高（概算）',
    type: 'select',
    options: [
      { value: 'under-10m', label: '1,000万円未満' },
      { value: '10m-50m', label: '1,000万〜5,000万円' },
      { value: '50m-100m', label: '5,000万〜1億円' },
      { value: '100m-500m', label: '1億〜5億円' },
      { value: '500m-1b', label: '5億〜10億円' },
      { value: 'over-1b', label: '10億円以上' }
    ],
    category: 'common'
  }
];

// 補助金別の特化質問
const specificQuestions: Record<string, Question[]> = {
  'it-donyu': [
    {
      id: 'currentIssues',
      question: '現在の業務課題を教えてください',
      type: 'textarea',
      placeholder: '例：紙での管理が多く効率が悪い、顧客情報が一元化されていない',
      category: 'specific',
      aiHint: '具体的な業務プロセスの課題、時間的・金銭的ロスを定量化'
    },
    {
      id: 'desiredSolution',
      question: '導入したいITツール・解決したいこと',
      type: 'textarea',
      placeholder: '例：クラウド会計システムで経理業務を効率化したい',
      category: 'specific',
      aiHint: '具体的なツール名、機能要件、期待効果を詳細化'
    },
    {
      id: 'expectedBudget',
      question: 'IT投資予定額（概算）',
      type: 'select',
      options: [
        { value: 'under-500k', label: '50万円未満' },
        { value: '500k-1m', label: '50万〜100万円' },
        { value: '1m-3m', label: '100万〜300万円' },
        { value: '3m-5m', label: '300万〜500万円' },
        { value: 'over-5m', label: '500万円以上' }
      ],
      category: 'specific'
    }
  ],
  'monozukuri': [
    {
      id: 'productDevelopment',
      question: '開発・改良したい製品・サービス',
      type: 'textarea',
      placeholder: '例：環境に優しい新素材を使った包装材の開発',
      category: 'specific',
      aiHint: '技術的革新性、市場ニーズ、競合優位性を具体化'
    },
    {
      id: 'technicalChallenge',
      question: '技術的な課題や革新的なポイント',
      type: 'textarea',
      placeholder: '例：従来比30%の軽量化を実現する新製法',
      category: 'specific',
      aiHint: '特許性、技術的難易度、解決アプローチを詳細化'
    },
    {
      id: 'marketSize',
      question: '想定する市場規模・顧客',
      type: 'textarea',
      placeholder: '例：国内の食品メーカー、年間市場規模100億円',
      category: 'specific',
      aiHint: '市場分析データ、成長性、シェア目標を数値化'
    }
  ],
  'jizokuka': [
    {
      id: 'salesChallenge',
      question: '売上向上のための課題',
      type: 'textarea',
      placeholder: '例：新規顧客の獲得が困難、リピート率が低い',
      category: 'specific',
      aiHint: '具体的な数値、原因分析、改善余地を明確化'
    },
    {
      id: 'plannedActions',
      question: '実施したい販路開拓・業務改善',
      type: 'textarea',
      placeholder: '例：ホームページ開設、SNS広告、新商品開発',
      category: 'specific',
      aiHint: '具体的な施策、実施スケジュール、KPIを設定'
    },
    {
      id: 'uniqueStrength',
      question: '自社の強み・差別化ポイント',
      type: 'textarea',
      placeholder: '例：地域唯一の専門技術、50年の信頼実績',
      category: 'specific',
      aiHint: '定量的な強み、顧客評価、競合比較を具体化'
    }
  ],
  'jigyou-saikouchiku': [
    {
      id: 'restructuringReason',
      question: '事業再構築が必要な背景',
      type: 'textarea',
      placeholder: '例：コロナで売上が50%減少、市場環境の大きな変化',
      category: 'specific',
      aiHint: '具体的な数値変化、外部環境分析、内部要因を詳細化'
    },
    {
      id: 'newBusinessPlan',
      question: '新しく展開したい事業',
      type: 'textarea',
      placeholder: '例：店舗型からEC主体への転換、新分野への進出',
      category: 'specific',
      aiHint: 'ビジネスモデル、収益構造、実現可能性を具体化'
    },
    {
      id: 'investmentScale',
      question: '必要な投資規模',
      type: 'select',
      options: [
        { value: 'under-10m', label: '1,000万円未満' },
        { value: '10m-30m', label: '1,000万〜3,000万円' },
        { value: '30m-50m', label: '3,000万〜5,000万円' },
        { value: '50m-100m', label: '5,000万〜1億円' },
        { value: 'over-100m', label: '1億円以上' }
      ],
      category: 'specific'
    }
  ]
};

export const SimplifiedQuestionForm: React.FC<SimplifiedQuestionFormProps> = ({
  subsidyType,
  subsidyName,
  onComplete
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // 質問を結合（共通 + 補助金別）
  const allQuestions = [...commonQuestions, ...(specificQuestions[subsidyType] || [])];
  const currentQuestion = allQuestions[currentStep];
  const progress = ((currentStep + 1) / allQuestions.length) * 100;

  // コンポーネントマウント時に保存データを読み込み
  useEffect(() => {
    // 共通データの読み込み
    const savedCommonData = localStorage.getItem('commonFormData');
    if (savedCommonData) {
      const commonData = JSON.parse(savedCommonData);
      setAnswers(prev => ({ ...prev, ...commonData }));
    }

    // 補助金別データの読み込み
    const savedSpecificData = localStorage.getItem(`specificFormData_${subsidyType}`);
    if (savedSpecificData) {
      const specificData = JSON.parse(savedSpecificData);
      setAnswers(prev => ({ ...prev, ...specificData }));
    }

    // 他の補助金からの転用可能データを提案
    suggestReusableData();
  }, [subsidyType]);

  // 他の補助金のデータから転用可能な内容を提案
  const suggestReusableData = () => {
    const allSubsidyTypes = ['it-donyu', 'monozukuri', 'jizokuka', 'jigyou-saikouchiku'];
    const suggestions: Record<string, string[]> = {};

    allSubsidyTypes.forEach(type => {
      if (type !== subsidyType) {
        const data = localStorage.getItem(`specificFormData_${type}`);
        if (data) {
          const parsed = JSON.parse(data);
          // 転用可能なデータを識別
          Object.entries(parsed).forEach(([key, value]) => {
            if (value && typeof value === 'string' && value.length > 20) {
              if (!suggestions[key]) suggestions[key] = [];
              suggestions[key].push(value as string);
            }
          });
        }
      }
    });

    if (Object.keys(suggestions).length > 0) {
      sessionStorage.setItem('dataSuggestions', JSON.stringify(suggestions));
    }
  };

  const handleAnswer = (value: string) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: value
    };
    setAnswers(newAnswers);

    // データを保存
    saveAnswers(newAnswers);
  };

  const saveAnswers = (currentAnswers: Record<string, string>) => {
    // 共通質問の回答を保存
    const commonAnswers: Record<string, string> = {};
    const specificAnswers: Record<string, string> = {};

    Object.entries(currentAnswers).forEach(([key, value]) => {
      const question = allQuestions.find(q => q.id === key);
      if (question?.category === 'common') {
        commonAnswers[key] = value;
      } else {
        specificAnswers[key] = value;
      }
    });

    localStorage.setItem('commonFormData', JSON.stringify(commonAnswers));
    localStorage.setItem(`specificFormData_${subsidyType}`, JSON.stringify(specificAnswers));
  };

  const handleNext = () => {
    if (currentStep < allQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generateFullDocument();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateFullDocument = async () => {
    setIsGenerating(true);

    // AIによる文章生成のシミュレーション
    setTimeout(() => {
      const expandedData = expandAnswersWithAI(answers);
      onComplete(expandedData);
      setIsGenerating(false);
    }, 2000);
  };

  // AIが簡潔な回答を詳細な申請書類用テキストに拡張
  const expandAnswersWithAI = (simpleAnswers: Record<string, string>) => {
    const expandedData: Record<string, string> = { ...simpleAnswers };

    // 基本情報の拡張
    if (simpleAnswers.companyName) {
      expandedData.companyNameKana = generateKana(simpleAnswers.companyName);
      expandedData.representativeName = '代表取締役'; // 実際はAIが推定
    }

    // 事業内容の拡張
    if (simpleAnswers.businessOverview) {
      expandedData.businessDescription = `
弊社は${simpleAnswers.businessOverview}を主要事業としております。
創業以来、地域に根ざした事業展開を行い、顧客満足度の向上に努めてまいりました。
${getEmployeeRange(simpleAnswers.employeeCount)}の組織体制で、${getRevenueDescription(simpleAnswers.annualRevenue)}の事業規模を有しています。
      `.trim();
    }

    // 補助金別の拡張
    if (subsidyType === 'it-donyu' && simpleAnswers.currentIssues) {
      expandedData.itToolPurpose = `
【現状の課題】
${simpleAnswers.currentIssues}

【解決アプローチ】
${simpleAnswers.desiredSolution || 'ITツールの導入により業務効率化を図る'}

【期待される効果】
・業務時間の30〜50%削減
・ヒューマンエラーの大幅削減
・リアルタイムでの情報共有実現
・データに基づく経営判断の迅速化
      `.trim();

      expandedData.expectedEffect = '労働生産性の向上により、従業員一人当たりの付加価値額を20%以上向上させる';
    }

    return expandedData;
  };

  const generateKana = (text: string): string => {
    // 実際はAIやライブラリでカナ変換
    return text.replace(/株式会社/g, 'カブシキガイシャ');
  };

  const getEmployeeRange = (range?: string): string => {
    const rangeMap: Record<string, string> = {
      '1-5': '少数精鋭',
      '6-20': '小規模',
      '21-50': '中小規模',
      '51-100': '中規模',
      '101-300': '中堅規模',
      '301+': '大規模'
    };
    return rangeMap[range || ''] || '小規模';
  };

  const getRevenueDescription = (range?: string): string => {
    const rangeMap: Record<string, string> = {
      'under-10m': '創業期',
      '10m-50m': '成長期',
      '50m-100m': '安定成長期',
      '100m-500m': '成熟期',
      '500m-1b': '大規模',
      'over-1b': '大企業規模'
    };
    return rangeMap[range || ''] || '中小規模';
  };

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
            AI が申請書類を生成中...
          </h2>
          <p style={{ color: '#6b7280' }}>
            入力内容を基に、各項目を詳細化しています
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
              質問 {currentStep + 1} / {allQuestions.length}
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
              transition: 'width 0.5s ease'
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
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{
              fontSize: '14px',
              color: '#764ba2',
              fontWeight: '600',
              padding: '4px 12px',
              background: 'rgba(118, 75, 162, 0.1)',
              borderRadius: '100px'
            }}>
              {currentQuestion.category === 'common' ? '共通項目' : `${subsidyName}専用`}
            </span>
            {currentQuestion.category === 'common' && (
              <span style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                ※ 一度入力すれば他の補助金でも利用されます
              </span>
            )}
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
                minHeight: '150px',
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

          {/* AIヒント表示 */}
          {currentQuestion.aiHint && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#f0f4ff',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#4c51bf'
            }}>
              💡 AIが自動的に以下の内容を含めて詳細化します：
              <br />
              {currentQuestion.aiHint}
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
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              ← 前へ
            </button>

            <button
              onClick={handleNext}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
            >
              {currentStep === allQuestions.length - 1 ? 'AIで申請書を生成' : '次へ →'}
            </button>
          </div>
        </div>

        {/* データ再利用の提案 */}
        {sessionStorage.getItem('dataSuggestions') && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#fef3c7',
            borderRadius: '12px',
            fontSize: '14px',
            color: '#92400e'
          }}>
            💡 他の補助金申請で入力したデータを活用できます
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplifiedQuestionForm;