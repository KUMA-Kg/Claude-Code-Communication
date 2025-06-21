import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '../../types/questionnaire';

interface FormSectionProps {
  section: Section;
  isExpanded: boolean;
  onToggle: () => void;
  hasErrors: boolean;
  index: number;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({
  section,
  isExpanded,
  onToggle,
  hasErrors,
  index,
  children
}) => {
  const chevronVariants = {
    collapsed: { rotate: 0 },
    expanded: { rotate: 180 }
  };

  const contentVariants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { 
      height: 'auto', 
      opacity: 1,
      transition: {
        height: {
          duration: 0.3
        },
        opacity: {
          duration: 0.2,
          delay: 0.1
        }
      }
    }
  };

  return (
    <div className={`form-section ${hasErrors ? 'has-errors' : ''} ${isExpanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className="form-section-header"
        onClick={onToggle}
      >
        <div className="form-section-header-content">
          <div className="form-section-number">{index}</div>
          <h3 className="form-section-title">
            {section.title}
            {section.required && <span className="form-required">*</span>}
          </h3>
          {hasErrors && (
            <div className="form-section-error-badge">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 5V8M8 11H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              エラーあり
            </div>
          )}
        </div>
        
        <motion.div
          className="form-section-chevron"
          variants={chevronVariants}
          animate={isExpanded ? 'expanded' : 'collapsed'}
          transition={{ duration: 0.2 }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            className="form-section-content"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            <div className="form-section-inner">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FormSection;