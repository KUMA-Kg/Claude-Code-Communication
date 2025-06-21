import React, { useState } from 'react';
import { ChevronRight, Target, CheckCircle, AlertCircle } from 'lucide-react';
import akinatorData from '../data/akinator-questions.json';
import { styles } from '../styles';

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
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ ...styles.flex.center, gap: '12px', marginBottom: '16px' }}>
          <Target size={32} color="#2563eb" />
          <h1 style={styles.text.title}>{akinatorData.title}</h1>
        </div>
        <p style={styles.text.subtitle}>{akinatorData.description}</p>
      </div>

      {/* 進捗バー */}
      <div style={{ marginBottom: '32px' }}>
        <div style={styles.progressBar.container}>
          <div 
            style={{ ...styles.progressBar.fill, width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div style={{ ...styles.flex.between, fontSize: '14px', color: '#6b7280' }}>
          <span>質問 {currentQuestionIndex + 1} / {akinatorData.questions.length}</span>
          <span>{Math.round(progressPercentage)}% 完了</span>
        </div>
      </div>

      {/* 質問カード */}
      <div style={{ ...styles.card, padding: '32px', marginBottom: '32px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            Q{currentQuestionIndex + 1}. {currentQuestion.question}
          </h2>
          <p style={{ color: '#6b7280' }}>該当するものを選択してください</p>
        </div>

        {/* 選択肢 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentQuestion.options.map((option) => {
            const isSelected = selectedValue === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(option.value)}
                style={{
                  ...styles.selectableCard,
                  ...(isSelected ? styles.selectableCardActive : {}),
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ fontSize: '32px' }}>{option.icon}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {option.label}
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>{option.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle size={24} color="#2563eb" style={{ marginTop: '4px' }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ナビゲーション */}
      <div style={styles.flex.between}>
        <button
          onClick={handleBack}
          disabled={currentQuestionIndex === 0}
          style={{
            ...styles.button.secondary,
            opacity: currentQuestionIndex === 0 ? 0.5 : 1,
            cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          ← 前の質問
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {akinatorData.questions.map((_, index) => (
              <div
                key={index}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: index <= currentQuestionIndex ? '#2563eb' : '#d1d5db'
                }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={!selectedValue}
          style={{
            ...styles.button.primary,
            opacity: !selectedValue ? 0.5 : 1,
            cursor: !selectedValue ? 'not-allowed' : 'pointer'
          }}
        >
          <span>{isLastQuestion ? '結果を見る' : '次の質問'}</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default AkinatorQuestionnaire;