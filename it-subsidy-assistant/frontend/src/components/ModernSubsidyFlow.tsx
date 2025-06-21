import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/modern-ui.css';

interface Question {
  id: number;
  question: string;
  subQuestion?: string;
  options: Array<{
    value: string;
    label: string;
    icon: string;
    description?: string;
  }>;
}

export const ModernSubsidyFlow: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAnimating, setIsAnimating] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      question: "あなたの事業の現在の状況を教えてください",
      subQuestion: "最も当てはまるものを選択してください",
      options: [
        { 
          value: "existing", 
          label: "既に事業を運営している", 
          icon: "🏢",
          description: "1年以上継続して事業活動を行っている"
        },
        { 
          value: "planning", 
          label: "これから創業予定", 
          icon: "🚀",
          description: "事業計画を立案中、または準備段階"
        },
        { 
          value: "startup", 
          label: "創業して3年以内", 
          icon: "🌱",
          description: "スタートアップ・新規事業として活動中"
        }
      ]
    },
    {
      id: 2,
      question: "現在直面している最大の課題は何ですか？",
      subQuestion: "事業成長のために最も改善したい点をお選びください",
      options: [
        { 
          value: "sales", 
          label: "売上拡大・新規顧客獲得", 
          icon: "📈",
          description: "販路開拓やマーケティング強化が必要"
        },
        { 
          value: "efficiency", 
          label: "業務効率化・デジタル化", 
          icon: "💻",
          description: "ITツール導入や業務プロセス改善が必要"
        },
        { 
          value: "innovation", 
          label: "新製品・サービス開発", 
          icon: "💡",
          description: "革新的な製品やサービスの開発が必要"
        },
        { 
          value: "cost", 
          label: "コスト削減・生産性向上", 
          icon: "⚡",
          description: "設備投資や工程改善でコスト削減したい"
        }
      ]
    },
    {
      id: 3,
      question: "会社の規模を教えてください",
      subQuestion: "従業員数（パート・アルバイト含む）をお選びください",
      options: [
        { 
          value: "micro", 
          label: "5人以下", 
          icon: "👤",
          description: "個人事業主・小規模事業者"
        },
        { 
          value: "small", 
          label: "6-20人", 
          icon: "👥",
          description: "小規模企業"
        },
        { 
          value: "medium", 
          label: "21-100人", 
          icon: "👨‍👩‍👧‍👦",
          description: "中小企業"
        },
        { 
          value: "large", 
          label: "101人以上", 
          icon: "🏢",
          description: "中堅・大企業"
        }
      ]
    },
    {
      id: 4,
      question: "業種を教えてください",
      subQuestion: "主たる事業の業種をお選びください",
      options: [
        { 
          value: "manufacturing", 
          label: "製造業", 
          icon: "🏭",
          description: "ものづくり・生産活動"
        },
        { 
          value: "service", 
          label: "サービス業", 
          icon: "🛎️",
          description: "各種サービス提供"
        },
        { 
          value: "retail", 
          label: "小売・卸売業", 
          icon: "🛍️",
          description: "商品の販売・流通"
        },
        { 
          value: "it", 
          label: "IT・情報通信業", 
          icon: "💻",
          description: "ソフトウェア・情報サービス"
        },
        { 
          value: "other", 
          label: "その他", 
          icon: "🏢",
          description: "上記以外の業種"
        }
      ]
    },
    {
      id: 5,
      question: "想定している投資予算はどのくらいですか？",
      subQuestion: "補助金を活用した総投資額の目安をお選びください",
      options: [
        { 
          value: "small", 
          label: "100万円未満", 
          icon: "💰",
          description: "小規模な投資・改善"
        },
        { 
          value: "medium", 
          label: "100-500万円", 
          icon: "💵",
          description: "中規模な設備・システム投資"
        },
        { 
          value: "large", 
          label: "500-3000万円", 
          icon: "💎",
          description: "大規模な事業投資"
        },
        { 
          value: "xlarge", 
          label: "3000万円以上", 
          icon: "🏦",
          description: "大型プロジェクト"
        }
      ]
    },
    {
      id: 6,
      question: "いつ頃から取り組みを開始したいですか？",
      subQuestion: "補助金を活用した事業の開始時期をお選びください",
      options: [
        { 
          value: "immediate", 
          label: "すぐに開始したい", 
          icon: "🔥",
          description: "1-2ヶ月以内"
        },
        { 
          value: "soon", 
          label: "3-6ヶ月以内", 
          icon: "📅",
          description: "準備期間を設けて開始"
        },
        { 
          value: "planning", 
          label: "6ヶ月-1年以内", 
          icon: "📊",
          description: "じっくり計画して実施"
        },
        { 
          value: "future", 
          label: "1年以上先", 
          icon: "🗓️",
          description: "長期的な計画"
        }
      ]
    }
  ];

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (value: string) => {
    setIsAnimating(true);
    setAnswers({ ...answers, [`q${currentStep + 1}`]: value });

    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      } else {
        // 最終質問の回答後、結果を保存して次の画面へ
        const finalAnswers = { ...answers, [`q${currentStep + 1}`]: value };
        const scores = calculateSubsidyScores(finalAnswers);
        const topSubsidy = getTopSubsidy(scores);
        
        sessionStorage.setItem('diagnosisAnswers', JSON.stringify(finalAnswers));
        sessionStorage.setItem('subsidyScores', JSON.stringify(scores));
        sessionStorage.setItem('selectedSubsidy', topSubsidy);
        
        navigate('/subsidy-results');
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateSubsidyScores = (answers: Record<string, string>) => {
    let scores = {
      'it-donyu': 0,
      'monozukuri': 0,
      'jizokuka': 0
    };

    // スコア計算ロジック
    if (answers.q2 === 'efficiency') scores['it-donyu'] += 40;
    if (answers.q2 === 'sales') scores['jizokuka'] += 40;
    if (answers.q2 === 'innovation' || answers.q2 === 'cost') scores['monozukuri'] += 40;

    if (answers.q3 === 'micro' || answers.q3 === 'small') scores['jizokuka'] += 30;
    if (answers.q3 === 'medium') scores['it-donyu'] += 20;
    if (answers.q3 === 'medium' || answers.q3 === 'large') scores['monozukuri'] += 25;

    if (answers.q4 === 'manufacturing') scores['monozukuri'] += 30;
    if (answers.q4 === 'it' || answers.q4 === 'service') scores['it-donyu'] += 20;
    if (answers.q4 === 'retail') scores['jizokuka'] += 20;

    if (answers.q5 === 'small') scores['jizokuka'] += 25;
    if (answers.q5 === 'medium') scores['it-donyu'] += 25;
    if (answers.q5 === 'large' || answers.q5 === 'xlarge') scores['monozukuri'] += 30;

    // 正規化（0-100のスコアに）
    Object.keys(scores).forEach(key => {
      scores[key as keyof typeof scores] = Math.min(100, scores[key as keyof typeof scores] + 30);
    });

    return scores;
  };

  const getTopSubsidy = (scores: Record<string, number>) => {
    return Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '40px', color: 'white' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '12px', fontWeight: 'bold' }}>
            補助金診断
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9 }}>
            6つの質問であなたに最適な補助金をご提案します
          </p>
        </div>

        {/* 進捗バー */}
        <div style={{ marginBottom: '40px' }}>
          <div className="progress-modern">
            <div 
              className="progress-modern-bar" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '12px',
            color: 'white',
            fontSize: '14px'
          }}>
            <span>質問 {currentStep + 1} / {questions.length}</span>
            <span>{Math.round(progress)}% 完了</span>
          </div>
        </div>

        {/* 質問カード */}
        <div className={`question-card ${isAnimating ? 'animating' : ''}`}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              {currentQuestion.question}
            </h2>
            {currentQuestion.subQuestion && (
              <p style={{ 
                fontSize: '16px', 
                color: 'var(--text-secondary)' 
              }}>
                {currentQuestion.subQuestion}
              </p>
            )}
          </div>

          {/* 選択肢 */}
          <div style={{ marginBottom: '32px' }}>
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`choice-button ${answers[`q${currentStep + 1}`] === option.value ? 'selected' : ''}`}
              >
                <div className="choice-icon">{option.icon}</div>
                <div className="choice-content">
                  <div className="choice-label">{option.label}</div>
                  {option.description && (
                    <div className="choice-description">{option.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* ナビゲーション */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                style={{
                  padding: '12px 24px',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: 'var(--border-radius)',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all var(--transition-normal)'
                }}
              >
                ← 前の質問
              </button>
            )}
            <div style={{ flex: 1 }} />
            {currentStep === 0 && (
              <div style={{ 
                color: 'var(--text-muted)', 
                fontSize: '14px',
                textAlign: 'center',
                width: '100%'
              }}>
                選択肢をクリックして次へ進んでください
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '40px',
          color: 'white',
          opacity: 0.8,
          fontSize: '14px'
        }}>
          <p>所要時間：約3分 | 個人情報の入力は不要です</p>
        </div>
      </div>

      <style>{`
        .question-card.animating {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};