import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Lightbulb,
  Save,
  Sparkles,
  Building2,
  Calendar,
  FileText,
  Award
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiline';
  placeholder?: string;
  examples?: string[];
  suggestions?: string[];
  helpText?: string;
  icon?: React.ReactNode;
  validation?: (value: any) => boolean;
}

interface SubsidyQuestions {
  subsidyId: string;
  subsidyName: string;
  questions: Question[];
}

interface SmartDocumentFormProps {
  subsidyType?: string;
  onComplete?: (formData: Record<string, any>) => void;
  onBack?: () => void;
}

const subsidyQuestionsData: SubsidyQuestions[] = [
  {
    subsidyId: 'it-donyu',
    subsidyName: 'IT導入補助金2025',
    questions: [
      {
        id: 'it_usage_status',
        question: '現在のIT活用状況を教えてください',
        type: 'select',
        suggestions: [
          'ITはほとんど使っていない',
          '基本的な業務でITを使っている',
          '積極的にITを活用している',
          'ITが業務の中心になっている'
        ],
        helpText: '現在のITツールの使用状況を選択してください',
        icon: <Building2 className="w-5 h-5" />
      },
      {
        id: 'it_implementation_purpose',
        question: 'IT導入の主な目的は何ですか？',
        type: 'select',
        suggestions: [
          '業務効率化・生産性向上',
          '販売機会の拡大',
          'テレワーク環境の整備',
          'セキュリティ強化',
          'データ分析・活用'
        ],
        helpText: '最も重要視する目的を選択してください',
        icon: <Lightbulb className="w-5 h-5" />
      },
      {
        id: 'it_budget_range',
        question: 'IT投資の予算規模はどれくらいですか？',
        type: 'select',
        suggestions: [
          '30万円未満',
          '30万円〜100万円',
          '100万円〜300万円',
          '300万円〜500万円',
          '500万円以上'
        ],
        helpText: 'ソフトウェア費用・導入費用を含む総額',
        icon: <FileText className="w-5 h-5" />
      }
    ]
  },
  {
    subsidyId: 'monozukuri',
    subsidyName: 'ものづくり補助金',
    questions: [
      {
        id: 'manufacturing_challenge',
        question: '現在の製造・サービス提供における課題は？',
        type: 'select',
        suggestions: [
          '生産能力が不足している',
          '品質管理を強化したい',
          '新製品・新サービスを開発したい',
          '生産コストを削減したい',
          '納期を短縮したい'
        ],
        helpText: '最も解決したい課題を選択してください',
        icon: <Award className="w-5 h-5" />
      },
      {
        id: 'equipment_investment_type',
        question: 'どのような設備投資を検討していますか？',
        type: 'select',
        suggestions: [
          '最新の製造設備・機械の導入',
          'ITシステム・ソフトウェアの導入',
          '検査・測定機器の導入',
          '自動化・ロボット導入',
          '環境対応設備の導入'
        ],
        helpText: '主な投資対象を選択してください',
        icon: <Sparkles className="w-5 h-5" />
      },
      {
        id: 'productivity_target',
        question: '生産性向上の目標はありますか？',
        type: 'select',
        suggestions: [
          '付加価値額3%以上向上',
          '付加価値額5%以上向上',
          '付加価値額10%以上向上',
          '具体的な目標はまだない'
        ],
        helpText: '年率での目標を選択してください',
        icon: <Lightbulb className="w-5 h-5" />
      },
      {
        id: 'investment_scale',
        question: '設備投資の予算規模は？',
        type: 'select',
        suggestions: [
          '100万円〜500万円',
          '500万円〜1,000万円',
          '1,000万円〜3,000万円',
          '3,000万円〜5,000万円',
          '5,000万円以上'
        ],
        helpText: '機械装置・システム構築費等の総額',
        icon: <FileText className="w-5 h-5" />
      }
    ]
  },
  {
    subsidyId: 'jizokuka',
    subsidyName: '小規模事業者持続化補助金',
    questions: [
      {
        id: 'business_challenge',
        question: '現在の経営課題は何ですか？',
        type: 'select',
        suggestions: [
          '新規顧客の獲得が難しい',
          '既存顧客の維持が課題',
          '商品・サービスの認知度が低い',
          '業務効率が悪い',
          '後継者問題'
        ],
        helpText: '最も重要な課題を選択してください',
        icon: <Building2 className="w-5 h-5" />
      },
      {
        id: 'sales_expansion_method',
        question: '販路開拓の方法として何を考えていますか？',
        type: 'select',
        suggestions: [
          'ホームページ・ECサイト構築',
          'チラシ・パンフレット作成',
          '展示会・商談会への出展',
          '店舗改装・看板設置',
          '新商品・サービスの開発'
        ],
        helpText: '最も効果的と考える方法を選択',
        icon: <Lightbulb className="w-5 h-5" />
      },
      {
        id: 'target_customer',
        question: 'ターゲットとする顧客層は？',
        type: 'select',
        suggestions: [
          '地域の個人顧客',
          '地域の法人顧客',
          '観光客・インバウンド',
          '全国の個人顧客',
          '全国の法人顧客'
        ],
        helpText: '主要なターゲット層を選択',
        icon: <Award className="w-5 h-5" />
      },
      {
        id: 'budget_scale',
        question: '販路開拓の予算規模は？',
        type: 'select',
        suggestions: [
          '50万円未満',
          '50万円〜100万円',
          '100万円〜150万円',
          '150万円〜200万円'
        ],
        helpText: '補助対象経費の総額',
        icon: <FileText className="w-5 h-5" />
      }
    ]
  }
];

const SmartDocumentForm: React.FC<SmartDocumentFormProps> = ({ subsidyType, onComplete, onBack }) => {
  const [selectedSubsidy, setSelectedSubsidy] = useState<string>(subsidyType || '');
  const [skipSelection, setSkipSelection] = useState<boolean>(!!subsidyType);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentSubsidy = subsidyQuestionsData.find(s => s.subsidyId === selectedSubsidy);
  const currentQuestion = currentSubsidy?.questions[currentQuestionIndex];
  const progress = currentSubsidy 
    ? ((currentQuestionIndex + 1) / currentSubsidy.questions.length) * 100 
    : 0;

  useEffect(() => {
    // Auto-save to localStorage
    if (selectedSubsidy && Object.keys(answers).length > 0) {
      localStorage.setItem(`subsidy_form_${selectedSubsidy}`, JSON.stringify(answers));
    }
  }, [answers, selectedSubsidy]);

  useEffect(() => {
    // Load saved data
    if (selectedSubsidy) {
      const saved = localStorage.getItem(`subsidy_form_${selectedSubsidy}`);
      if (saved) {
        setAnswers(JSON.parse(saved));
      }
    }
  }, [selectedSubsidy]);

  const handleNext = () => {
    if (!currentQuestion || !answers[currentQuestion.id]) return;

    setIsAnimating(true);
    setTimeout(() => {
      if (currentQuestionIndex < (currentSubsidy?.questions.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Submit form
        handleSubmit();
      }
      setIsAnimating(false);
    }, 300);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleAnswerChange = (value: any) => {
    if (currentQuestion) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: value
      }));
    }
  };

  const handleSubmit = () => {
    console.log('Form submitted:', { subsidyId: selectedSubsidy, answers });
    
    // Call the onComplete callback if provided
    if (onComplete) {
      onComplete({
        subsidyType: selectedSubsidy,
        ...answers
      });
    } else {
      // Fallback behavior
      alert('申請情報を保存しました！次のステップに進みます。');
    }
  };

  const renderInput = () => {
    if (!currentQuestion) return null;

    const commonProps = {
      value: answers[currentQuestion.id] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        handleAnswerChange(e.target.value),
      className: "w-full px-6 py-4 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-all duration-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
      placeholder: currentQuestion.placeholder
    };

    switch (currentQuestion.type) {
      case 'multiline':
        return (
          <textarea
            {...commonProps}
            rows={4}
            className={`${commonProps.className} resize-none`}
          />
        );
      
      case 'select':
        return (
          <select {...commonProps} className={`${commonProps.className} cursor-pointer`}>
            <option value="">選択してください</option>
            {currentQuestion.suggestions?.map(suggestion => (
              <option key={suggestion} value={suggestion}>{suggestion}</option>
            ))}
          </select>
        );
      
      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            min="0"
          />
        );
      
      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
            min={new Date().toISOString().split('T')[0]}
          />
        );
      
      default:
        return <input {...commonProps} type="text" />;
    }
  };

  // If subsidyType is provided as a prop, don't show the selection screen
  if (!selectedSubsidy && !subsidyType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              補助金申請サポート
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              あなたにぴったりの補助金を見つけて、簡単に申請準備ができます
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subsidyQuestionsData.map((subsidy, index) => (
              <motion.button
                key={subsidy.subsidyId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  setSelectedSubsidy(subsidy.subsidyId);
                  setCurrentQuestionIndex(0);
                }}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left"
              >
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-10 h-10 text-blue-500" />
                  <ChevronRight className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {subsidy.subsidyName}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {subsidy.questions.length}つの簡単な質問に答えるだけ
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Handle case where subsidyType doesn't match any known subsidy
  if (!currentSubsidy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            補助金が見つかりません
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            指定された補助金タイプ "{subsidyType}" は存在しません。
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              戻る
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                setSelectedSubsidy('');
              }
            }}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            {onBack ? '戻る' : '補助金選択に戻る'}
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {currentSubsidy?.subsidyName}
          </h2>
          
          {/* Progress bar */}
          <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {currentQuestionIndex + 1} / {currentSubsidy?.questions.length} 完了
          </p>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: isAnimating ? 100 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 md:p-12"
            >
              {/* Question */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  {currentQuestion.icon}
                  <span className="ml-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                    質問 {currentQuestionIndex + 1}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {currentQuestion.question}
                </h3>
                {currentQuestion.helpText && (
                  <p className="text-gray-600 dark:text-gray-300">
                    {currentQuestion.helpText}
                  </p>
                )}
              </div>

              {/* Examples */}
              {currentQuestion.examples && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <Lightbulb className="w-4 h-4 mr-1" />
                    記入例を見る
                  </button>
                  
                  <AnimatePresence>
                    {showSuggestions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-2"
                      >
                        {currentQuestion.examples.map((example, index) => (
                          <button
                            key={index}
                            onClick={() => handleAnswerChange(example)}
                            className="block w-full text-left px-4 py-2 bg-blue-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            {example}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Input */}
              <div className="mb-8">
                {renderInput()}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    currentQuestionIndex === 0
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  戻る
                </button>

                <div className="flex items-center space-x-4">
                  {/* Auto-save indicator */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center text-sm text-green-600 dark:text-green-400"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    自動保存済み
                  </motion.div>

                  <button
                    onClick={handleNext}
                    disabled={!answers[currentQuestion.id]}
                    className={`flex items-center px-8 py-3 rounded-xl font-medium transition-all duration-300 ${
                      answers[currentQuestion.id]
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {currentQuestionIndex === currentSubsidy.questions.length - 1 ? (
                      <>
                        送信する
                        <Check className="w-5 h-5 ml-2" />
                      </>
                    ) : (
                      <>
                        次へ
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Encouragement messages */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-600 dark:text-gray-300">
            {currentQuestionIndex === 0 && "素晴らしいスタートです！一緒に進めていきましょう 🎉"}
            {currentQuestionIndex === 1 && "いい調子です！もう少しで完了です 💪"}
            {currentQuestionIndex === 2 && (currentSubsidy.questions.length === 3 ? "最後の質問です！あと少しで完了です 🌟" : "あと少し！最後まで頑張りましょう 🌟")}
            {currentQuestionIndex >= 3 && "もうすぐ完了です！素晴らしい！ 🎊"}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SmartDocumentForm;