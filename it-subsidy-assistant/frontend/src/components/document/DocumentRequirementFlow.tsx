import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, HelpCircle, RefreshCw } from 'lucide-react';
import ConditionalQuestion from './ConditionalQuestion';
import RequiredDocumentsListV2 from './RequiredDocumentsListV2';
import { determineRequiredDocuments, QuestionFlow, Answer } from '../../utils/documentFlowLogic';

interface DocumentRequirementFlowProps {
  subsidyType: 'it_donyu' | 'monozukuri' | 'jizokuka';
  subsidyName: string;
  onBack?: () => void;
}

const DocumentRequirementFlow: React.FC<DocumentRequirementFlowProps> = ({
  subsidyType,
  subsidyName,
  onBack
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [questionFlow, setQuestionFlow] = useState<QuestionFlow[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);

  // 補助金タイプに応じた質問フローを初期化
  useEffect(() => {
    initializeQuestionFlow();
  }, [subsidyType]);

  const initializeQuestionFlow = () => {
    const flow: QuestionFlow[] = [];
    
    // 共通質問
    flow.push({
      id: 'company_type',
      question: 'あなたの事業形態を選択してください',
      type: 'single',
      options: [
        { value: 'corporation', label: '株式会社・合同会社', icon: '🏢' },
        { value: 'individual', label: '個人事業主', icon: '👤' },
        { value: 'npo', label: 'NPO法人', icon: '🤝' },
        { value: 'other', label: 'その他', icon: '📋' }
      ],
      required: true
    });

    flow.push({
      id: 'business_years',
      question: '創業・開業からの経過年数を選択してください',
      type: 'single',
      options: [
        { value: 'less_than_1', label: '1年未満', icon: '🌱' },
        { value: '1_to_3', label: '1年以上3年未満', icon: '🌿' },
        { value: '3_to_5', label: '3年以上5年未満', icon: '🌳' },
        { value: 'more_than_5', label: '5年以上', icon: '🌲' }
      ],
      required: true,
      condition: (answers) => {
        // IT導入補助金で個人事業主1年未満は申請不可
        if (subsidyType === 'it_donyu' && answers.company_type?.value === 'individual') {
          return true;
        }
        return true;
      }
    });

    // 補助金別の追加質問
    if (subsidyType === 'it_donyu') {
      flow.push({
        id: 'application_frame',
        question: '申請を検討している枠を選択してください',
        type: 'single',
        options: [
          { 
            value: 'normal', 
            label: '通常枠', 
            description: '一般的なITツール導入',
            icon: '💻'
          },
          { 
            value: 'digital', 
            label: '電子化枠', 
            description: '紙業務のデジタル化',
            icon: '📄'
          },
          { 
            value: 'security', 
            label: 'セキュリティ枠', 
            description: 'セキュリティ強化',
            icon: '🔒'
          },
          { 
            value: 'multi', 
            label: '複数社枠', 
            description: '複数企業での共同導入',
            icon: '🤝'
          }
        ],
        required: true
      });

      flow.push({
        id: 'wage_increase',
        question: '賃上げを実施する予定はありますか？',
        type: 'single',
        options: [
          { value: 'yes', label: 'はい（加点対象）', icon: '📈' },
          { value: 'no', label: 'いいえ', icon: '➖' }
        ],
        condition: (answers) => answers.application_frame?.value === 'normal'
      });

      flow.push({
        id: 'digital_target',
        question: '電子化対象の業務はありますか？',
        type: 'single',
        options: [
          { value: 'yes', label: 'はい（請求書、契約書等）', icon: '📋' },
          { value: 'no', label: 'いいえ', icon: '❌' }
        ],
        condition: (answers) => answers.application_frame?.value === 'digital'
      });

      flow.push({
        id: 'security_issues',
        question: 'セキュリティ課題を抱えていますか？',
        type: 'single',
        options: [
          { value: 'yes', label: 'はい（対策が必要）', icon: '⚠️' },
          { value: 'no', label: 'いいえ', icon: '✅' }
        ],
        condition: (answers) => answers.application_frame?.value === 'security'
      });

      flow.push({
        id: 'partner_count',
        question: '連携する企業数を選択してください',
        type: 'single',
        options: [
          { value: '1', label: '1社（単独申請）', icon: '1️⃣' },
          { value: '2_to_5', label: '2〜5社', icon: '2️⃣' },
          { value: 'more_than_5', label: '6社以上', icon: '🔢' }
        ],
        condition: (answers) => answers.application_frame?.value === 'multi'
      });

    } else if (subsidyType === 'monozukuri') {
      flow.push({
        id: 'project_type',
        question: '実施する事業の類型を選択してください',
        type: 'single',
        options: [
          { 
            value: 'service', 
            label: '革新的サービス開発',
            description: '新サービスの開発・提供',
            icon: '🚀'
          },
          { 
            value: 'product', 
            label: '革新的ものづくり',
            description: '新製品の開発・生産',
            icon: '🏭'
          },
          { 
            value: 'both', 
            label: '両方',
            description: 'サービスとものづくりの両方',
            icon: '🔄'
          }
        ],
        required: true
      });

      flow.push({
        id: 'investment_amount',
        question: '設備投資額の規模を選択してください',
        type: 'single',
        options: [
          { value: 'less_than_100', label: '100万円未満', icon: '💰' },
          { value: '100_to_1000', label: '100万円以上1,000万円未満', icon: '💴' },
          { value: '1000_to_3000', label: '1,000万円以上3,000万円未満', icon: '💵' },
          { value: 'more_than_3000', label: '3,000万円以上', icon: '💸' }
        ],
        required: true
      });

      flow.push({
        id: 'funding_method',
        question: '事業資金の調達方法を教えてください',
        type: 'single',
        options: [
          { value: 'self', label: '自己資金のみ', icon: '🏦' },
          { value: 'external', label: '借入等の外部資金を活用', icon: '🏛️' }
        ],
        required: true
      });

    } else if (subsidyType === 'jizokuka') {
      flow.push({
        id: 'employee_count',
        question: '現在の従業員数（パート・アルバイト含む）を選択してください',
        type: 'single',
        options: [
          { value: '0', label: '0人（事業主のみ）', icon: '1️⃣' },
          { value: '1_to_5', label: '1〜5人', icon: '👥' },
          { value: '6_to_20', label: '6〜20人', icon: '👨‍👩‍👧‍👦' },
          { value: 'more_than_20', label: '21人以上', icon: '🏢' }
        ],
        required: true
      });

      flow.push({
        id: 'business_category',
        question: '主たる事業の業種を選択してください',
        type: 'single',
        options: [
          { value: 'service', label: '商業・サービス業', icon: '🛍️' },
          { value: 'manufacturing', label: '製造業', icon: '🏭' },
          { value: 'construction', label: '建設業', icon: '🏗️' },
          { value: 'other', label: 'その他', icon: '📋' }
        ],
        required: true
      });

      flow.push({
        id: 'application_purpose',
        question: '補助事業の主な目的を選択してください',
        type: 'single',
        options: [
          { 
            value: 'general', 
            label: '一般的な販路開拓',
            description: '新規顧客獲得やマーケティング強化',
            icon: '📊'
          },
          { 
            value: 'wage', 
            label: '賃金引上げを伴う販路開拓',
            description: '従業員の処遇改善と事業拡大',
            icon: '💰'
          },
          { 
            value: 'succession', 
            label: '事業承継を見据えた取組み',
            description: '後継者による事業発展',
            icon: '🤝'
          },
          { 
            value: 'startup', 
            label: '創業間もない事業の成長',
            description: '創業3年以内の事業基盤強化',
            icon: '🌱'
          }
        ],
        required: true
      });

      flow.push({
        id: 'ceo_age',
        question: '代表者の年齢を教えてください',
        type: 'single',
        options: [
          { value: 'under_60', label: '60歳未満', icon: '👤' },
          { value: 'over_60', label: '60歳以上', icon: '👴' }
        ],
        required: true
      });
    }

    setQuestionFlow(flow);
  };

  const handleAnswer = (questionId: string, answer: Answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    if (!answeredQuestions.includes(questionId)) {
      setAnsweredQuestions(prev => [...prev, questionId]);
    }
  };

  const handleNext = () => {
    const visibleQuestions = getVisibleQuestions();
    if (currentStep < visibleQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // 最後の質問に回答したら結果を表示
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setShowResults(false);
    setAnsweredQuestions([]);
  };

  const getVisibleQuestions = () => {
    return questionFlow.filter(q => {
      if (!q.condition) return true;
      return q.condition(answers);
    });
  };

  const isCurrentQuestionAnswered = () => {
    const visibleQuestions = getVisibleQuestions();
    const currentQuestion = visibleQuestions[currentStep];
    return currentQuestion && answers[currentQuestion.id] !== undefined;
  };

  const getProgress = () => {
    const visibleQuestions = getVisibleQuestions();
    const answeredCount = visibleQuestions.filter(q => answers[q.id] !== undefined).length;
    return Math.round((answeredCount / visibleQuestions.length) * 100);
  };

  if (showResults) {
    const requiredDocuments = determineRequiredDocuments(subsidyType, answers);
    return (
      <RequiredDocumentsListV2
        subsidyType={subsidyType}
        subsidyName={subsidyName}
        answers={answers}
        requiredDocuments={requiredDocuments}
        onBack={handleReset}
      />
    );
  }

  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = visibleQuestions[currentStep];

  if (!currentQuestion) {
    return <div className="text-center py-12">質問を準備中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">必要書類診断</h1>
              <p className="text-gray-600">{subsidyName}</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            <span>最初から</span>
          </button>
        </div>

        {/* プログレスバー */}
        <div className="bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>質問 {currentStep + 1} / {visibleQuestions.length}</span>
          <span>{getProgress()}% 完了</span>
        </div>
      </div>

      {/* 質問表示 */}
      <ConditionalQuestion
        question={currentQuestion}
        answer={answers[currentQuestion.id]}
        onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
      />

      {/* ナビゲーション */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={handlePrevious}
          className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>{currentStep === 0 ? '戻る' : '前へ'}</span>
        </button>

        <button
          onClick={handleNext}
          disabled={!isCurrentQuestionAnswered()}
          className={`flex items-center space-x-2 px-8 py-3 font-medium rounded-lg transition-colors ${
            isCurrentQuestionAnswered()
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>
            {currentStep === visibleQuestions.length - 1 ? '診断結果を見る' : '次へ'}
          </span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* ヘルプ */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">診断のポイント</p>
            <p>回答内容に応じて、申請に必要な書類が自動的に判定されます。正確な診断のため、現在の状況に最も近い選択肢をお選びください。</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentRequirementFlow;