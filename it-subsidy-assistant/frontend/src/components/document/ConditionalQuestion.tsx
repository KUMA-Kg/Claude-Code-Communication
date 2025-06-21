import React from 'react';
import { CheckCircle, Info } from 'lucide-react';
import { QuestionFlow, Answer } from '../../utils/documentFlowLogic';

interface ConditionalQuestionProps {
  question: QuestionFlow;
  answer?: Answer;
  onAnswer: (answer: Answer) => void;
}

const ConditionalQuestion: React.FC<ConditionalQuestionProps> = ({
  question,
  answer,
  onAnswer
}) => {
  const handleSingleSelect = (value: string) => {
    const option = question.options.find(opt => opt.value === value);
    if (option) {
      onAnswer(option);
    }
  };

  const handleMultiSelect = (value: string) => {
    const option = question.options.find(opt => opt.value === value);
    if (!option) return;

    if (question.type === 'multiple') {
      const currentValues = answer ? (Array.isArray(answer) ? answer : [answer]) : [];
      const existingIndex = currentValues.findIndex(a => a.value === value);
      
      if (existingIndex >= 0) {
        // 既に選択されている場合は削除
        const newValues = currentValues.filter((_, index) => index !== existingIndex);
        onAnswer(newValues.length === 1 ? newValues[0] : newValues);
      } else {
        // 新しく追加
        const newValues = [...currentValues, option];
        onAnswer(newValues.length === 1 ? newValues[0] : newValues);
      }
    }
  };

  const isSelected = (value: string) => {
    if (!answer) return false;
    
    if (Array.isArray(answer)) {
      return answer.some(a => a.value === value);
    }
    
    return answer.value === value;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      {/* 質問ヘッダー */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {question.question}
        </h2>
        {question.description && (
          <p className="text-gray-600">{question.description}</p>
        )}
        {question.required && (
          <span className="inline-block mt-2 text-sm text-red-600 font-medium">
            ※ 必須項目
          </span>
        )}
      </div>

      {/* 選択肢 */}
      <div className={`grid gap-4 ${
        question.options.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
      }`}>
        {question.options.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              if (question.type === 'multiple') {
                handleMultiSelect(option.value);
              } else {
                handleSingleSelect(option.value);
              }
            }}
            className={`relative p-6 border-2 rounded-lg text-left transition-all duration-200 ${
              isSelected(option.value)
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                {/* アイコンとラベル */}
                <div className="flex items-center space-x-3 mb-2">
                  {option.icon && (
                    <span className="text-2xl" role="img" aria-label={option.label}>
                      {option.icon}
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {option.label}
                  </h3>
                </div>
                
                {/* 説明文 */}
                {option.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </p>
                )}
              </div>

              {/* 選択状態の表示 */}
              {isSelected(option.value) && (
                <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
              )}
            </div>

            {/* 複数選択の場合のインジケーター */}
            {question.type === 'multiple' && (
              <div className={`absolute top-2 right-2 w-5 h-5 rounded border-2 ${
                isSelected(option.value)
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-gray-300'
              }`}>
                {isSelected(option.value) && (
                  <svg
                    className="w-3 h-3 text-white absolute inset-0 m-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 追加情報 */}
      {question.hint && (
        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">ヒント</p>
              <p>{question.hint}</p>
            </div>
          </div>
        </div>
      )}

      {/* 複数選択の説明 */}
      {question.type === 'multiple' && (
        <p className="mt-4 text-sm text-gray-500 text-center">
          ※ 該当するものをすべて選択してください（複数選択可）
        </p>
      )}
    </div>
  );
};

export default ConditionalQuestion;