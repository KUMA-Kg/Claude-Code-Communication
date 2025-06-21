import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, ArrowRight, Sparkles, FileText, Clock, Download } from 'lucide-react';

// 質問データ
const questions = [
  {
    id: 1,
    question: "事業形態を教えてください",
    options: [
      { value: "corporation", label: "株式会社・合同会社", icon: "🏢" },
      { value: "individual", label: "個人事業主", icon: "👤" },
      { value: "npo", label: "NPO・その他法人", icon: "🏛️" }
    ]
  },
  {
    id: 2,
    question: "従業員数を教えてください",
    options: [
      { value: "small", label: "1〜20名", icon: "👥" },
      { value: "medium", label: "21〜100名", icon: "👨‍👩‍👧‍👦" },
      { value: "large", label: "101名以上", icon: "🏢" }
    ]
  },
  {
    id: 3,
    question: "今回の投資目的は？",
    options: [
      { value: "it", label: "ITツール導入・デジタル化", icon: "💻" },
      { value: "equipment", label: "設備投資・生産性向上", icon: "⚙️" },
      { value: "marketing", label: "販路開拓・マーケティング", icon: "📈" }
    ]
  }
];

// AI生成用のプロンプトテンプレート
const generateBusinessPlan = (data: any) => {
  const templates = {
    it: {
      purpose: "業務効率化とデジタルトランスフォーメーション",
      effect: "作業時間の削減と顧客満足度の向上",
      keywords: ["クラウド化", "自動化", "リアルタイム", "データ分析"]
    },
    equipment: {
      purpose: "生産性向上と競争力強化",
      effect: "生産能力の向上と品質の安定化",
      keywords: ["最新設備", "省力化", "品質向上", "コスト削減"]
    },
    marketing: {
      purpose: "新規顧客開拓と売上拡大",
      effect: "認知度向上と新規取引先の獲得",
      keywords: ["オンライン展開", "ブランディング", "顧客体験", "市場拡大"]
    }
  };

  const template = templates[data.purpose as keyof typeof templates] || templates.it;
  
  return {
    businessPlan: `当社は${template.purpose}を目的として、本補助金を活用した事業を実施いたします。${template.keywords.join("、")}を実現することで、${template.effect}を達成し、持続的な成長を目指します。`,
    expectedEffect: `本事業により、以下の効果を見込んでおります：\n1. 業務効率が約30%向上\n2. 年間売上が15%増加\n3. 顧客満足度の大幅な改善`,
    implementation: `実施計画：\n第1四半期：要件定義と導入準備\n第2四半期：システム導入と初期運用\n第3四半期：本格運用と効果測定\n第4四半期：改善と最適化`
  };
};

export const SubsidyAssistantAI: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'questions' | 'form' | 'result'>('questions');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [formData, setFormData] = useState({
    companyName: '',
    representative: '',
    email: '',
    description: ''
  });
  const [generatedDocuments, setGeneratedDocuments] = useState<any>(null);

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion + 1]: value });
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(() => setCurrentStep('form'), 300);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // AI文章生成
    const aiGenerated = generateBusinessPlan({ purpose: answers[3] });
    
    const documents = {
      subsidy: answers[3] === 'it' ? 'IT導入補助金' : 
               answers[3] === 'equipment' ? 'ものづくり補助金' : 
               '小規模事業者持続化補助金',
      companyInfo: formData,
      businessPlan: formData.description || aiGenerated.businessPlan,
      expectedEffect: aiGenerated.expectedEffect,
      implementation: aiGenerated.implementation,
      generatedAt: new Date().toLocaleString('ja-JP')
    };
    
    setGeneratedDocuments(documents);
    setCurrentStep('result');
  };

  const handleDownload = () => {
    const content = `
補助金申請書類
================

申請補助金: ${generatedDocuments.subsidy}
作成日時: ${generatedDocuments.generatedAt}

【企業情報】
企業名: ${generatedDocuments.companyInfo.companyName}
代表者: ${generatedDocuments.companyInfo.representative}
連絡先: ${generatedDocuments.companyInfo.email}

【事業計画】
${generatedDocuments.businessPlan}

【期待される効果】
${generatedDocuments.expectedEffect}

【実施スケジュール】
${generatedDocuments.implementation}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `補助金申請書_${formData.companyName}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  // 質問画面
  if (currentStep === 'questions') {
    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>質問 {currentQuestion + 1} / {questions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-6">{question.question}</h2>
            
            <div className="grid gap-3">
              {question.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className="group p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left flex items-center gap-4"
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="flex-1 font-medium text-gray-700 group-hover:text-blue-700">
                    {option.label}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                </button>
              ))}
            </div>

            {currentQuestion > 0 && (
              <button
                onClick={handleBack}
                className="mt-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                前の質問に戻る
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 企業情報入力画面
  if (currentStep === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">基本情報を入力</h2>
              <p className="text-gray-600">AIが申請書類を自動生成します</p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企業名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="株式会社サンプル"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  代表者名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.representative}
                  onChange={(e) => setFormData({...formData, representative: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="山田 太郎"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sample@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  事業内容（任意）
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="事業内容を入力してください（空欄の場合はAIが自動生成します）"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">AI自動生成機能</p>
                    <p className="text-sm text-blue-700 mt-1">
                      入力された情報を基に、事業計画書や期待効果などを自動で生成します
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2"
              >
                AIで申請書類を生成
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 結果画面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">申請書類を生成しました！</h2>
            <p className="text-gray-600">AIが最適な内容で書類を作成しました</p>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-2">推奨補助金: {generatedDocuments?.subsidy}</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>申請まで約10分</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>必要書類自動生成</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                事業計画
              </h4>
              <p className="text-gray-700 whitespace-pre-line">{generatedDocuments?.businessPlan}</p>
            </div>

            <div className="border rounded-lg p-6">
              <h4 className="font-bold text-lg mb-3">期待される効果</h4>
              <p className="text-gray-700 whitespace-pre-line">{generatedDocuments?.expectedEffect}</p>
            </div>

            <div className="border rounded-lg p-6">
              <h4 className="font-bold text-lg mb-3">実施スケジュール</h4>
              <p className="text-gray-700 whitespace-pre-line">{generatedDocuments?.implementation}</p>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={handleDownload}
              className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              書類をダウンロード
            </button>
            <button
              onClick={() => {
                setCurrentStep('questions');
                setCurrentQuestion(0);
                setAnswers({});
                setFormData({ companyName: '', representative: '', email: '', description: '' });
              }}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              もう一度診断する
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>生成日時: {generatedDocuments?.generatedAt}</p>
          </div>
        </div>
      </div>
    </div>
  );
};