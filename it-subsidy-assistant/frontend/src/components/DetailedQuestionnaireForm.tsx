import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, FileText, CheckCircle } from 'lucide-react';

interface Question {
  id: string;
  type: string;
  question: string;
  required: boolean;
  options?: Array<{ value: string; label: string; description?: string }>;
  hint?: string;
  maxLength?: number;
  unit?: string;
  fields?: any;
  validation?: any;
}

interface Section {
  id: string;
  title: string;
  required: boolean;
  questions: Question[];
}

interface DetailedQuestionnaireProps {
  subsidyType: string;
  selectedFrame: string;
  onComplete: (answers: any) => void;
  onBack: () => void;
}

const DetailedQuestionnaireForm: React.FC<DetailedQuestionnaireProps> = ({
  subsidyType,
  selectedFrame,
  onComplete,
  onBack
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 質問票データの読み込み
  useEffect(() => {
    const loadQuestionnaire = async () => {
      try {
        // 補助金タイプに応じて詳細質問票を読み込み
        let questionnaireFile = '';
        switch (subsidyType) {
          case 'IT導入補助金2025':
            questionnaireFile = '/data/subsidies/it-donyu-2024/questionnaires/detailed_application.json';
            break;
          case 'ものづくり補助金（第20次締切）':
            questionnaireFile = '/data/subsidies/monozukuri-2024/questionnaires/detailed_application.json';
            break;
          case '小規模事業者持続化補助金（第17回）':
            questionnaireFile = '/data/subsidies/jizokuka-2024/questionnaires/detailed_application.json';
            break;
        }
        
        const response = await fetch(questionnaireFile);
        const data = await response.json();
        setQuestionnaire(data);
      } catch (error) {
        console.error('質問票の読み込みに失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuestionnaire();
  }, [subsidyType]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // エラーをクリア
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateCurrentSection = () => {
    const currentSection = questionnaire.sections[currentSectionIndex];
    const newErrors: Record<string, string> = {};

    currentSection.questions.forEach((question: Question) => {
      if (question.required && !answers[question.id]) {
        newErrors[question.id] = 'この項目は必須です';
      }
      
      // 文字数制限チェック
      if (question.maxLength && answers[question.id] && answers[question.id].length > question.maxLength) {
        newErrors[question.id] = `${question.maxLength}文字以内で入力してください`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentSection()) {
      if (currentSectionIndex < questionnaire.sections.length - 1) {
        setCurrentSectionIndex(prev => prev + 1);
      } else {
        // 最後のセクション - 完了処理
        onComplete(answers);
      }
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const renderQuestion = (question: Question) => {
    const value = answers[question.id] || '';
    const error = errors[question.id];

    switch (question.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={value}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className={`w-full p-3 border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder={question.hint}
            />
            {question.unit && (
              <span className="text-sm text-gray-500">単位: {question.unit}</span>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <textarea
              value={value}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              rows={4}
              className={`w-full p-3 border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder={question.hint}
              maxLength={question.maxLength}
            />
            {question.maxLength && (
              <div className="text-sm text-gray-500 text-right">
                {value.length}/{question.maxLength}文字
              </div>
            )}
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <input
              type="number"
              value={value}
              onChange={(e) => handleAnswerChange(question.id, Number(e.target.value))}
              className={`w-full p-3 border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder={question.hint}
            />
            {question.unit && (
              <span className="text-sm text-gray-500">単位: {question.unit}</span>
            )}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className={`w-full p-3 border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className={`w-full p-3 border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="">選択してください</option>
            {question.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="mt-1 text-blue-600"
                />
                <div>
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-gray-600">{option.description}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        );

      case 'address':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(question.fields || {}).map(([fieldKey, fieldLabel]) => (
              <div key={fieldKey}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {fieldLabel as string}
                </label>
                <input
                  type="text"
                  value={value[fieldKey] || ''}
                  onChange={(e) => handleAnswerChange(question.id, {
                    ...value,
                    [fieldKey]: e.target.value
                  })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        );

      case 'object':
        return (
          <div className="space-y-4">
            {Object.entries(question.fields || {}).map(([fieldKey, fieldConfig]: [string, any]) => (
              <div key={fieldKey}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {fieldConfig.label}
                  {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {fieldConfig.type === 'number' ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={value[fieldKey] || ''}
                      onChange={(e) => handleAnswerChange(question.id, {
                        ...value,
                        [fieldKey]: Number(e.target.value)
                      })}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {fieldConfig.unit && (
                      <span className="text-sm text-gray-500">{fieldConfig.unit}</span>
                    )}
                  </div>
                ) : fieldConfig.type === 'date' ? (
                  <input
                    type="date"
                    value={value[fieldKey] || ''}
                    onChange={(e) => handleAnswerChange(question.id, {
                      ...value,
                      [fieldKey]: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={value[fieldKey] || ''}
                    onChange={(e) => handleAnswerChange(question.id, {
                      ...value,
                      [fieldKey]: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        );

      default:
        return <div>未対応の質問タイプ: {question.type}</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">質問票を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">質問票の読み込みに失敗しました</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">
          戻る
        </button>
      </div>
    );
  }

  const currentSection = questionnaire.sections[currentSectionIndex];
  const progressPercentage = ((currentSectionIndex + 1) / questionnaire.sections.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{questionnaire.title}</h1>
            <p className="text-gray-600">{questionnaire.description}</p>
          </div>
        </div>
        
        {/* 進捗バー */}
        <div className="bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>セクション {currentSectionIndex + 1} / {questionnaire.sections.length}</span>
          <span>{Math.round(progressPercentage)}% 完了</span>
        </div>
      </div>

      {/* セクション */}
      <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-100 rounded-full p-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{currentSection.title}</h2>
          {currentSection.required && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">必須</span>
          )}
        </div>

        <div className="space-y-8">
          {currentSection.questions.map((question) => (
            <div key={question.id} className="space-y-3">
              <label className="block">
                <span className="text-lg font-medium text-gray-900">
                  {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </span>
                {question.hint && (
                  <p className="text-sm text-gray-600 mt-1">{question.hint}</p>
                )}
              </label>
              
              {renderQuestion(question)}
              
              {errors[question.id] && (
                <p className="text-red-500 text-sm">{errors[question.id]}</p>
              )}
            </div>
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

        <div className="flex space-x-3">
          <button
            onClick={() => {/* 一時保存機能 */}}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>保存</span>
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>
              {currentSectionIndex === questionnaire.sections.length - 1 ? '完了' : '次へ'}
            </span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailedQuestionnaireForm;