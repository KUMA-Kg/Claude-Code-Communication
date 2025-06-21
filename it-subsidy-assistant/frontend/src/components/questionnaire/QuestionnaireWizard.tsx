import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';
import { QuestionnaireData, Question } from '../../types/questionnaire';

const questions: Question[] = [
  {
    id: 'businessType',
    question: '事業形態を教えてください',
    type: 'single',
    options: [
      { value: 'manufacturing', label: '製造業', icon: '🏭' },
      { value: 'retail', label: '小売業', icon: '🛍️' },
      { value: 'service', label: 'サービス業', icon: '💼' },
      { value: 'it', label: 'IT関連', icon: '💻' },
      { value: 'other', label: 'その他', icon: '📋' }
    ]
  },
  {
    id: 'employeeCount',
    question: '従業員数を教えてください',
    type: 'single',
    options: [
      { value: '1-5', label: '1〜5名', icon: '👤' },
      { value: '6-20', label: '6〜20名', icon: '👥' },
      { value: '21-50', label: '21〜50名', icon: '👥' },
      { value: '51-100', label: '51〜100名', icon: '🏢' },
      { value: '101-300', label: '101〜300名', icon: '🏢' }
    ]
  },
  {
    id: 'annualRevenue',
    question: '年間売上高を教えてください',
    type: 'single',
    options: [
      { value: 'under-10m', label: '1000万円未満', icon: '💰' },
      { value: '10m-50m', label: '1000万〜5000万円', icon: '💰' },
      { value: '50m-100m', label: '5000万〜1億円', icon: '💰' },
      { value: '100m-500m', label: '1億〜5億円', icon: '💰' },
      { value: 'over-500m', label: '5億円以上', icon: '💰' }
    ]
  },
  {
    id: 'currentChallenges',
    question: '現在の経営課題は何ですか？',
    type: 'single',
    options: [
      { value: 'efficiency', label: '業務効率化', icon: '⚡' },
      { value: 'sales', label: '売上拡大', icon: '📈' },
      { value: 'cost', label: 'コスト削減', icon: '💸' },
      { value: 'innovation', label: '新商品・サービス開発', icon: '🚀' },
      { value: 'hr', label: '人材育成・確保', icon: '👨‍💼' }
    ]
  },
  {
    id: 'digitalizationLevel',
    question: 'IT/デジタル化の現状は？',
    type: 'single',
    options: [
      { value: 'none', label: 'ほとんど導入していない', icon: '📵' },
      { value: 'basic', label: '基本的なツールのみ', icon: '📱' },
      { value: 'partial', label: '一部業務で活用', icon: '💻' },
      { value: 'advanced', label: '積極的に活用中', icon: '🖥️' }
    ]
  },
  {
    id: 'budgetRange',
    question: '想定している投資予算は？',
    type: 'single',
    options: [
      { value: 'under-500k', label: '50万円未満', icon: '💵' },
      { value: '500k-1m', label: '50万〜100万円', icon: '💵' },
      { value: '1m-3m', label: '100万〜300万円', icon: '💵' },
      { value: '3m-5m', label: '300万〜500万円', icon: '💵' },
      { value: 'over-5m', label: '500万円以上', icon: '💵' }
    ]
  }
];

const QuestionnaireWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireData>({});
  const [direction, setDirection] = useState(0);

  const handleAnswer = (value: string) => {
    const currentQuestion = questions[currentStep];
    setAnswers({ ...answers, [currentQuestion.id]: value });
    setDirection(1);

    if (currentStep < questions.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 300);
    } else {
      sessionStorage.setItem('questionnaireAnswers', JSON.stringify({ ...answers, [currentQuestion.id]: value }));
      setTimeout(() => {
        navigate('/subsidy-list');
      }, 300);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const slideVariants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
      };
    }
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <div className="questionnaire-wizard">
      <ProgressBar progress={progress} currentStep={currentStep + 1} totalSteps={questions.length} />
      
      <div className="questionnaire-content">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold && currentStep < questions.length - 1) {
                setDirection(1);
                setCurrentStep(currentStep + 1);
              } else if (swipe > swipeConfidenceThreshold && currentStep > 0) {
                setDirection(-1);
                setCurrentStep(currentStep - 1);
              }
            }}
          >
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              onBack={handleBack}
              showBackButton={currentStep > 0}
              selectedValue={answers[currentQuestion.id]}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuestionnaireWizard;