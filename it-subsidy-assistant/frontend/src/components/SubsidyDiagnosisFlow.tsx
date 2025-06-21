import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, ArrowRight } from 'lucide-react';

// 6つの質問データ
const questions = [
  {
    id: 1,
    question: "あなたの事業の現在の状況を教えてください",
    options: [
      { value: "existing", label: "既に事業を運営している", icon: "🏢" },
      { value: "planning", label: "これから創業予定", icon: "🚀" },
      { value: "startup", label: "創業して3年以内", icon: "🌱" }
    ]
  },
  {
    id: 2,
    question: "従業員数（パート・アルバイト含む）を教えてください",
    options: [
      { value: "solo", label: "1人（個人事業主）", icon: "👤" },
      { value: "micro", label: "2〜5人", icon: "👥" },
      { value: "small", label: "6〜20人", icon: "👨‍👩‍👧‍👦" },
      { value: "medium", label: "21〜100人", icon: "🏢" },
      { value: "large", label: "101人以上", icon: "🏛️" }
    ]
  },
  {
    id: 3,
    question: "主な事業分野を教えてください",
    options: [
      { value: "manufacturing", label: "製造業", icon: "🏭" },
      { value: "retail", label: "小売業", icon: "🛍️" },
      { value: "service", label: "サービス業", icon: "🤝" },
      { value: "it", label: "情報通信業", icon: "💻" },
      { value: "construction", label: "建設業", icon: "🏗️" },
      { value: "other", label: "その他", icon: "📋" }
    ]
  },
  {
    id: 4,
    question: "今回の投資で実現したいことは？（最も重要なもの）",
    options: [
      { value: "digital", label: "業務のデジタル化・効率化", icon: "🖥️" },
      { value: "sales", label: "売上拡大・新規顧客開拓", icon: "📈" },
      { value: "product", label: "新製品・サービス開発", icon: "💡" },
      { value: "facility", label: "設備投資・生産性向上", icon: "⚙️" },
      { value: "security", label: "セキュリティ強化", icon: "🔒" }
    ]
  },
  {
    id: 5,
    question: "想定している投資予算を教えてください",
    options: [
      { value: "under50", label: "50万円未満", icon: "💰" },
      { value: "50to100", label: "50万円〜100万円", icon: "💰💰" },
      { value: "100to500", label: "100万円〜500万円", icon: "💰💰💰" },
      { value: "500to1000", label: "500万円〜1000万円", icon: "💰💰💰💰" },
      { value: "over1000", label: "1000万円以上", icon: "💰💰💰💰💰" }
    ]
  },
  {
    id: 6,
    question: "いつから取り組みを開始したいですか？",
    options: [
      { value: "asap", label: "すぐに開始したい（1ヶ月以内）", icon: "⚡" },
      { value: "quarter", label: "3ヶ月以内", icon: "📅" },
      { value: "half", label: "半年以内", icon: "📆" },
      { value: "year", label: "1年以内", icon: "🗓️" }
    ]
  }
];

// 補助金情報
const subsidies = [
  {
    id: "it",
    name: "IT導入補助金2025",
    description: "ITツール導入による生産性向上を支援",
    maxAmount: "450万円",
    rate: "1/2～3/4",
    color: "bg-blue-500"
  },
  {
    id: "monozukuri",
    name: "ものづくり補助金",
    description: "革新的な製品・サービス開発、設備投資を支援",
    maxAmount: "5,000万円",
    rate: "1/2～2/3",
    color: "bg-green-500"
  },
  {
    id: "jizokuka",
    name: "小規模事業者持続化補助金",
    description: "販路開拓・生産性向上を支援",
    maxAmount: "200万円",
    rate: "2/3～3/4",
    color: "bg-orange-500"
  }
];

export const SubsidyDiagnosisFlow: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion + 1]: value });
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(() => setShowResult(true), 300);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScores = () => {
    const scores = { it: 0, monozukuri: 0, jizokuka: 0 };
    
    // スコアリングロジック（簡易版）
    if (answers[4] === "digital" || answers[4] === "security") scores.it += 40;
    if (answers[4] === "product" || answers[4] === "facility") scores.monozukuri += 40;
    if (answers[4] === "sales") scores.jizokuka += 40;
    
    if (answers[2] === "solo" || answers[2] === "micro") scores.jizokuka += 30;
    if (answers[2] === "small" || answers[2] === "medium") scores.it += 20;
    if (answers[2] === "medium" || answers[2] === "large") scores.monozukuri += 20;
    
    if (answers[5] === "under50" || answers[5] === "50to100") scores.jizokuka += 20;
    if (answers[5] === "100to500") scores.it += 20;
    if (answers[5] === "500to1000" || answers[5] === "over1000") scores.monozukuri += 20;
    
    if (answers[3] === "it") scores.it += 10;
    if (answers[3] === "manufacturing") scores.monozukuri += 10;
    if (answers[3] === "retail" || answers[3] === "service") scores.jizokuka += 10;
    
    return scores;
  };

  const getRecommendedSubsidies = () => {
    const scores = calculateScores();
    return subsidies
      .map(subsidy => ({
        ...subsidy,
        score: scores[subsidy.id as keyof typeof scores] || 0,
        compatibility: scores[subsidy.id as keyof typeof scores] >= 70 ? "高" :
                      scores[subsidy.id as keyof typeof scores] >= 50 ? "中" : "低"
      }))
      .sort((a, b) => b.score - a.score);
  };

  if (showResult) {
    const recommendations = getRecommendedSubsidies();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">診断完了！</h2>
              <p className="text-gray-600">あなたに最適な補助金をご提案します</p>
            </div>

            <div className="space-y-4">
              {recommendations.map((subsidy, index) => (
                <div
                  key={subsidy.id}
                  className={`border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
                    index === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{subsidy.name}</h3>
                        {index === 0 && (
                          <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                            おすすめ
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{subsidy.description}</p>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-gray-500">補助上限:</span>
                          <span className="font-semibold ml-1">{subsidy.maxAmount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">補助率:</span>
                          <span className="font-semibold ml-1">{subsidy.rate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center ml-4">
                      <div className={`w-20 h-20 rounded-full ${subsidy.color} bg-opacity-20 flex items-center justify-center mb-2`}>
                        <span className="text-2xl font-bold">{subsidy.score}%</span>
                      </div>
                      <span className={`text-sm font-medium ${
                        subsidy.compatibility === "高" ? "text-green-600" :
                        subsidy.compatibility === "中" ? "text-yellow-600" : "text-gray-600"
                      }`}>
                        適合度: {subsidy.compatibility}
                      </span>
                    </div>
                  </div>
                  {index === 0 && (
                    <button className="mt-4 w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                      この補助金で申請準備を始める
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setCurrentQuestion(0);
                  setAnswers({});
                  setShowResult(false);
                }}
                className="text-gray-600 hover:text-gray-800 underline"
              >
                もう一度診断する
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* プログレスバー */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>質問 {currentQuestion + 1} / {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 質問 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{question.question}</h2>
            
            <div className="grid gap-3">
              {question.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className="group p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left flex items-center gap-4"
                  data-testid={`answer-${option.value}`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="flex-1 font-medium text-gray-700 group-hover:text-blue-700">
                    {option.label}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          </div>

          {/* 戻るボタン */}
          {currentQuestion > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              前の質問に戻る
            </button>
          )}
        </div>
      </div>
    </div>
  );
};