import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FormField from './FormField';
import FormSection from './FormSection';
import { Question, Section } from '../../types/questionnaire';

interface DynamicFormProps {
  sections: Section[];
  initialData?: any;
  onSubmit: (data: any) => void;
  onSave?: (data: any) => void;
  submitLabel?: string;
  showAutoSave?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  sections,
  initialData = {},
  onSubmit,
  onSave,
  submitLabel = '送信',
  showAutoSave = true
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 自動保存機能
  useEffect(() => {
    if (!showAutoSave || !onSave) return;

    const autoSaveTimer = setTimeout(() => {
      setIsAutoSaving(true);
      onSave(formData);
      setLastSaved(new Date());
      setTimeout(() => setIsAutoSaving(false), 1000);
    }, 2000); // 2秒後に自動保存

    return () => clearTimeout(autoSaveTimer);
  }, [formData, onSave, showAutoSave]);

  // 初期状態で必須セクションを展開
  useEffect(() => {
    const requiredSections = sections
      .filter(section => section.required)
      .map(section => section.id);
    setExpandedSections(requiredSections);
  }, [sections]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldId]: value
    }));

    // エラーをクリア
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    sections.forEach(section => {
      section.questions.forEach(question => {
        if (question.required && !formData[question.id]) {
          newErrors[question.id] = `${question.question}は必須項目です`;
          isValid = false;
        }

        // その他のバリデーション
        if (question.type === 'number' && formData[question.id]) {
          const value = Number(formData[question.id]);
          if (isNaN(value)) {
            newErrors[question.id] = '数値を入力してください';
            isValid = false;
          }
        }

        if (question.maxLength && formData[question.id] && formData[question.id].length > question.maxLength) {
          newErrors[question.id] = `${question.maxLength}文字以内で入力してください`;
          isValid = false;
        }
      });
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    } else {
      // エラーがある最初のセクションを展開
      const errorFields = Object.keys(errors);
      const sectionsWithErrors = sections
        .filter(section => 
          section.questions.some(q => errorFields.includes(q.id))
        )
        .map(section => section.id);
      
      setExpandedSections(prev => [...new Set([...prev, ...sectionsWithErrors])]);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getFieldsWithErrors = (section: Section): string[] => {
    return section.questions
      .filter(q => errors[q.id])
      .map(q => q.id);
  };

  return (
    <form onSubmit={handleSubmit} className="dynamic-form">
      {showAutoSave && (
        <div className="form-autosave-status">
          <AnimatePresence>
            {isAutoSaving && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="autosave-indicator"
              >
                <div className="spinner spinner-sm" />
                <span>保存中...</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {!isAutoSaving && lastSaved && (
            <span className="last-saved">
              最終保存: {lastSaved.toLocaleTimeString('ja-JP')}
            </span>
          )}
        </div>
      )}

      <div className="form-sections">
        {sections.map((section, index) => (
          <FormSection
            key={section.id}
            section={section}
            isExpanded={expandedSections.includes(section.id)}
            onToggle={() => toggleSection(section.id)}
            hasErrors={getFieldsWithErrors(section).length > 0}
            index={index + 1}
          >
            <div className="form-fields">
              {section.questions.map(question => (
                <FormField
                  key={question.id}
                  question={question}
                  value={formData[question.id]}
                  onChange={(value) => handleFieldChange(question.id, value)}
                  error={errors[question.id]}
                />
              ))}
            </div>
          </FormSection>
        ))}
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost btn-lg"
          onClick={() => window.history.back()}
        >
          戻る
        </button>
        
        <button
          type="submit"
          className="btn btn-primary btn-lg"
        >
          {submitLabel}
        </button>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="form-errors-summary">
          <div className="alert alert-error">
            <strong>入力エラーがあります</strong>
            <ul style={{ marginTop: 'var(--spacing-sm)', marginBottom: 0 }}>
              {Object.entries(errors).slice(0, 3).map(([key, error]) => (
                <li key={key}>{error}</li>
              ))}
              {Object.keys(errors).length > 3 && (
                <li>他 {Object.keys(errors).length - 3} 件のエラー</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </form>
  );
};

export default DynamicForm;