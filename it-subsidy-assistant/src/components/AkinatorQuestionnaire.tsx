import React, { useState } from 'react';
import { ChevronRight, Target, CheckCircle, AlertCircle } from 'lucide-react';
import akinatorData from '../data/akinator-questions.json';

interface AkinatorAnswer {
  questionId: string;
  selectedValue: string;
}

interface SubsidyMatch {
  subsidyType: string;
  subsidyName: string;
  score: number;
  matchLevel: 'high' | 'medium' | 'low';
  description: string;
  icon: string;
}

interface AkinatorQuestionnaireProps {
  onComplete: (answers: AkinatorAnswer[], matches: SubsidyMatch[]) => void;
}

const AkinatorQuestionnaire: React.FC<AkinatorQuestionnaireProps> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AkinatorAnswer[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>('');

  const currentQuestion = akinatorData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === akinatorData.questions.length - 1;

  const handleOptionSelect = (value: string) => {
    setSelectedValue(value);
  };

  const handleNext = () => {
    if (!selectedValue) return;

    const newAnswer: AkinatorAnswer = {
      questionId: currentQuestion.id,
      selectedValue: selectedValue
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    if (isLastQuestion) {
      // 最後の質問 - スコア計算して結果を返す
      const matches = calculateSubsidyMatches(updatedAnswers);
      onComplete(updatedAnswers, matches);
    } else {
      // 次の質問へ
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedValue('');
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setAnswers(prev => prev.slice(0, -1));
      setSelectedValue('');
    }
  };

  // 補助金適合度計算
  const calculateSubsidyMatches = (userAnswers: AkinatorAnswer[]): SubsidyMatch[] => {
    const selectedValues = userAnswers.map(answer => answer.selectedValue);
    const weights = akinatorData.scoring_weights;
    
    const scores = {
      it_donyu: calculateScore(selectedValues, weights.it_donyu),
      monozukuri: calculateScore(selectedValues, weights.monozukuri),
      jizokuka: calculateScore(selectedValues, weights.jizokuka)
    };

    const subsidyInfo = {
      it_donyu: {
        name: 'IT導入補助金',
        description: 'ITツール導入による業務効率化を支援',
        icon: '💻'
      },
      monozukuri: {
        name: 'ものづくり補助金',
        description: '革新的な製品・サービス開発を支援',
        icon: '🏭'
      },
      jizokuka: {
        name: '小規模事業者持続化補助金',
        description: '販路開拓・マーケティング活動を支援',
        icon: '🏪'
      }
    };

    const matches: SubsidyMatch[] = Object.entries(scores).map(([type, score]) => ({
      subsidyType: type,
      subsidyName: subsidyInfo[type as keyof typeof subsidyInfo].name,
      score,
      matchLevel: getMatchLevel(score),
      description: subsidyInfo[type as keyof typeof subsidyInfo].description,
      icon: subsidyInfo[type as keyof typeof subsidyInfo].icon
    }));

    // スコアの高い順にソート
    return matches.sort((a, b) => b.score - a.score);
  };

  const calculateScore = (selectedValues: string[], weights: Record<string, number>): number => {
    let totalScore = 0;
    selectedValues.forEach(value => {
      if (weights[value]) {
        totalScore += weights[value];
      }
    });
    return Math.min(totalScore, 100); // 最大100点
  };

  const getMatchLevel = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= akinatorData.threshold_scores.high_match) return 'high';
    if (score >= akinatorData.threshold_scores.medium_match) return 'medium';
    return 'low';
  };

  const progressPercentage = ((currentQuestionIndex + 1) / akinatorData.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Target className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">{akinatorData.title}</h1>
        </div>
        <p className="text-xl text-gray-600">{akinatorData.description}</p>
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
          <span>質問 {currentQuestionIndex + 1} / {akinatorData.questions.length}</span>
          <span>{Math.round(progressPercentage)}% 完了</span>
        </div>
      </div>

      {/* 質問カード */}
      <div className="bg-white rounded-2xl shadow-xl border p-8 mb-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Q{currentQuestionIndex + 1}. {currentQuestion.question}
          </h2>
          <p className="text-gray-600">該当するものを選択してください</p>
        </div>

        {/* 選択肢 */}
        <div className="space-y-4">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionSelect(option.value)}
              className={`w-full p-6 border-2 rounded-xl text-left transition-all duration-200 ${
                selectedValue === option.value
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{option.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {option.label}
                  </h3>
                  <p className="text-gray-600 text-sm">{option.description}</p>
                </div>
                {selectedValue === option.value && (
                  <CheckCircle className="h-6 w-6 text-blue-600 mt-1" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleBack}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← 前の質問
        </button>

        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {akinatorData.questions.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index <= currentQuestionIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={!selectedValue}
          className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>{isLastQuestion ? '結果を見る' : '次の質問'}</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default AkinatorQuestionnaire;