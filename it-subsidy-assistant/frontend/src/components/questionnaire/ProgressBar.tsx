import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  currentStep: number;
  totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, currentStep, totalSteps }) => {
  return (
    <div className="progress-container">
      <div className="progress-bar-wrapper">
        <div className="progress-bar-background">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>
      
      <div className="progress-steps">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`progress-step ${i < currentStep ? 'completed' : ''} ${i === currentStep - 1 ? 'active' : ''}`}
          >
            <div className="step-circle">
              {i < currentStep - 1 ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            {i < totalSteps - 1 && <div className="step-connector" />}
          </div>
        ))}
      </div>
      
      <div className="progress-text">
        <span className="progress-current">質問 {currentStep}</span>
        <span className="progress-separator">/</span>
        <span className="progress-total">{totalSteps}</span>
      </div>
    </div>
  );
};

export default ProgressBar;