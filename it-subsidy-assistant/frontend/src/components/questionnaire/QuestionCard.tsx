import React from 'react';
import { motion } from 'framer-motion';
import { Question, QuestionOption } from '../../types/questionnaire';

interface QuestionCardProps {
  question: Question;
  onAnswer: (value: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  selectedValue?: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  onBack,
  showBackButton = false,
  selectedValue
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 15
      }
    }
  };

  return (
    <div className="question-card">
      <motion.div
        className="question-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="question-title">{question.question}</h2>
      </motion.div>

      <motion.div
        className="question-options"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {question.options.map((option: QuestionOption) => (
          <motion.button
            key={option.value}
            className={`option-button ${selectedValue === option.value ? 'selected' : ''}`}
            variants={itemVariants}
            whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAnswer(option.value)}
          >
            <span className="option-icon">{option.icon}</span>
            <span className="option-label">{option.label}</span>
            {option.description && (
              <span className="option-description">{option.description}</span>
            )}
          </motion.button>
        ))}
      </motion.div>

      {showBackButton && (
        <motion.button
          className="back-button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onBack}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          前の質問に戻る
        </motion.button>
      )}
    </div>
  );
};

export default QuestionCard;