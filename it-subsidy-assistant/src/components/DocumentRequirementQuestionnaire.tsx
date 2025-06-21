import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import documentRequirements from '../data/document-requirements.json';

interface DocumentRequirement {
  id: string;
  name: string;
  category: string;
  description: string;
  required_for_all?: boolean;
  required_for_categories?: string[];
  required_for_frames?: string[];
  required_when?: string;
  template_questions: string[];
}

interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  questions: string[];
  reason: string;
}

interface DocumentRequirementQuestionnaireProps {
  subsidyType: string;
  onComplete: (requiredDocuments: RequiredDocument[]) => void;
  onBack: () => void;
}

const DocumentRequirementQuestionnaire: React.FC<DocumentRequirementQuestionnaireProps> = ({
  subsidyType,
  onComplete,
  onBack
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<Array<{
    id: string;
    question: string;
    options: Array<{ value: string; label: string; description?: string }>;
  }>>([]);

  // 補助金タイプに応じた質問を生成
  useEffect(() => {
    generateQuestions();
  }, [subsidyType]);

  const generateQuestions = () => {
    const generatedQuestions = [];

    if (subsidyType === 'it_donyu') {
      // IT導入補助金の場合
      generatedQuestions.push({
        id: 'it_tool_category',
        question: '導入予定のITツールはどのカテゴリーに該当しますか？',
        options: [
          {
            value: 'category_5',
            label: 'カテゴリー5：情報収集・分析・活用システム',
            description: '顧客管理、在庫管理、売上分析等'
          },
          {
            value: 'category_6', 
            label: 'カテゴリー6：営業支援システム',
            description: '営業管理、顧客対応、見積作成等'
          },
          {
            value: 'category_7',
            label: 'カテゴリー7：バックオフィス系システム',
            description: '会計、人事、総務等の基幹業務'
          }
        ]
      });

      generatedQuestions.push({
        id: 'it_main_purpose',
        question: 'IT導入の主な目的は何ですか？',
        options: [
          {
            value: 'general',
            label: '一般的な業務効率化',
            description: '通常の業務改善を目的としたITツール導入'
          },
          {
            value: 'digitalization',
            label: '紙書類の電子化',
            description: '請求書、契約書等の電子化が主目的'
          },
          {
            value: 'security',
            label: 'セキュリティ強化',
            description: 'サイバー攻撃対策等のセキュリティ向上'
          },
          {
            value: 'invoice',
            label: 'インボイス制度対応',
            description: '適格請求書発行等のインボイス制度対応'
          }
        ]
      });

    } else if (subsidyType === 'monozukuri') {
      // ものづくり補助金の場合
      generatedQuestions.push({
        id: 'project_type',
        question: '実施予定の事業内容はどれに該当しますか？',
        options: [
          {
            value: 'general_innovation',
            label: '革新的な製品・サービス開発',
            description: '新製品開発や生産プロセス改善'
          },
          {
            value: 'recovery_wage',
            label: '業況回復と賃上げ・雇用拡大',
            description: '厳しい業況からの回復と従業員処遇改善'
          },
          {
            value: 'digital_transformation',
            label: 'DX（デジタルトランスフォーメーション）',
            description: 'デジタル技術を活用した革新的開発'
          },
          {
            value: 'green_innovation',
            label: '環境に配慮した革新的開発',
            description: 'カーボンニュートラル等の環境対応'
          }
        ]
      });

      generatedQuestions.push({
        id: 'funding_method',
        question: '事業資金の調達方法を教えてください',
        options: [
          {
            value: 'self_funding',
            label: '自己資金のみ',
            description: '補助金以外は自己資金で対応'
          },
          {
            value: 'external_funding',
            label: '借入等の外部資金を活用',
            description: '銀行借入や出資等で資金調達予定'
          }
        ]
      });

    } else if (subsidyType === 'jizokuka') {
      // 小規模事業者持続化補助金の場合
      generatedQuestions.push({
        id: 'business_purpose',
        question: '補助事業の主な目的は何ですか？',
        options: [
          {
            value: 'general_expansion',
            label: '一般的な販路開拓',
            description: '新規顧客獲得やマーケティング強化'
          },
          {
            value: 'wage_increase',
            label: '賃金引上げを伴う販路開拓',
            description: '従業員の処遇改善と事業拡大の両立'
          },
          {
            value: 'business_succession',
            label: '事業承継を見据えた取組み',
            description: '後継者による事業発展の基盤作り'
          },
          {
            value: 'startup_support',
            label: '創業間もない事業の成長',
            description: '創業から間もない事業の基盤強化'
          }
        ]
      });

      generatedQuestions.push({
        id: 'ceo_age',
        question: '代表者の年齢を教えてください',
        options: [
          {
            value: 'under_60',
            label: '60歳未満',
            description: '事業承継診断票は不要'
          },
          {
            value: 'over_60',
            label: '60歳以上',
            description: '事業承継診断票の提出が必要'
          }
        ]
      });
    }

    setQuestions(generatedQuestions);
  };

  const handleAnswerSelect = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestionIndex].id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // 最後の質問 - 必要書類を判定
      const requiredDocuments = determineRequiredDocuments();
      onComplete(requiredDocuments);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const determineRequiredDocuments = (): RequiredDocument[] => {
    const subsidyData = documentRequirements.document_requirements[subsidyType as keyof typeof documentRequirements.document_requirements];
    const requiredDocs: RequiredDocument[] = [];

    subsidyData.documents.forEach((doc: DocumentRequirement) => {
      let isRequired = false;
      let reason = '';

      // 全員必須の書類
      if (doc.required_for_all) {
        isRequired = true;
        reason = '全申請者に必要な書類';
      }
      // カテゴリーベースの判定
      else if (doc.required_for_categories && answers.it_tool_category) {
        if (doc.required_for_categories.includes(answers.it_tool_category)) {
          isRequired = true;
          reason = `${answers.it_tool_category}の申請に必要`;
        }
      }
      // 申請枠ベースの判定
      else if (doc.required_for_frames) {
        const frameMapping: Record<string, string> = {
          'general': 'tsujyo',
          'digitalization': 'denshi', 
          'security': 'security',
          'invoice': 'invoice',
          'general_innovation': 'tsujyo',
          'recovery_wage': 'kaifuku',
          'digital_transformation': 'digital',
          'green_innovation': 'green',
          'general_expansion': 'tsujyo',
          'wage_increase': 'chingin',
          'business_succession': 'kokeisha',
          'startup_support': 'sogyo'
        };

        const purposeKey = subsidyType === 'it_donyu' ? 'it_main_purpose' : 
                          subsidyType === 'monozukuri' ? 'project_type' : 'business_purpose';
        
        const userFrame = frameMapping[answers[purposeKey]];
        if (userFrame && doc.required_for_frames.includes(userFrame)) {
          isRequired = true;
          reason = `${answers[purposeKey]}に必要な書類`;
        }
      }
      // 条件ベースの判定
      else if (doc.required_when) {
        if (doc.required_when === 'external_funding' && answers.funding_method === 'external_funding') {
          isRequired = true;
          reason = '外部資金調達のため必要';
        } else if (doc.required_when === 'ceo_over_60' && answers.ceo_age === 'over_60') {
          isRequired = true;
          reason = '代表者が60歳以上のため必要';
        }
      }

      if (isRequired) {
        requiredDocs.push({
          id: doc.id,
          name: doc.name,
          description: doc.description,
          questions: doc.template_questions,
          reason
        });
      }
    });

    return requiredDocs;
  };

  if (questions.length === 0) {
    return <div className="text-center py-12">質問を準備中...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">作成資料の判定</h1>
        </div>
        <p className="text-xl text-gray-600">
          {documentRequirements.document_requirements[subsidyType as keyof typeof documentRequirements.document_requirements].subsidy_name}の必要書類を判定します
        </p>
      </div>

      {/* 進捗バー */}
      <div className="mb-8">
        <div className="bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>質問 {currentQuestionIndex + 1} / {questions.length}</span>
          <span>{Math.round(progressPercentage)}% 完了</span>
        </div>
      </div>

      {/* 質問カード */}
      <div className="bg-white rounded-2xl shadow-xl border p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {currentQuestion.question}
        </h2>

        <div className="space-y-4">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswerSelect(option.value)}
              className={`w-full p-6 border-2 rounded-xl text-left transition-all duration-200 ${
                currentAnswer === option.value
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {option.label}
                  </h3>
                  {option.description && (
                    <p className="text-gray-600 text-sm">{option.description}</p>
                  )}
                </div>
                {currentAnswer === option.value && (
                  <CheckCircle className="h-6 w-6 text-blue-600 ml-4" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>前へ</span>
        </button>

        <button
          onClick={handleNext}
          disabled={!currentAnswer}
          className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>
            {currentQuestionIndex === questions.length - 1 ? '必要書類を確認' : '次へ'}
          </span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default DocumentRequirementQuestionnaire;