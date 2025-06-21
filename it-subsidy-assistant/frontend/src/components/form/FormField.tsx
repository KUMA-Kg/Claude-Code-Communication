import React from 'react';
import { Question } from '../../types/questionnaire';

interface FormFieldProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

const FormField: React.FC<FormFieldProps> = ({ question, value, onChange, error }) => {
  const renderField = () => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            id={question.id}
            className={`form-input ${error ? 'form-input-error' : ''}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.hint}
            maxLength={question.maxLength}
          />
        );

      case 'number':
        return (
          <div className="form-input-with-unit">
            <input
              type="number"
              id={question.id}
              className={`form-input ${error ? 'form-input-error' : ''}`}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={question.hint}
            />
            {question.unit && (
              <span className="form-input-unit">{question.unit}</span>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="form-textarea-wrapper">
            <textarea
              id={question.id}
              className={`form-textarea ${error ? 'form-textarea-error' : ''}`}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={question.hint}
              rows={4}
              maxLength={question.maxLength}
            />
            {question.maxLength && (
              <span className="form-textarea-counter">
                {(value || '').length} / {question.maxLength}
              </span>
            )}
          </div>
        );

      case 'select':
        return (
          <select
            id={question.id}
            className={`form-select ${error ? 'form-select-error' : ''}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
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
          <div className="form-radio-group">
            {question.options?.map((option) => (
              <label key={option.value} className="form-radio-label">
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  className="form-radio"
                />
                <span className="form-radio-text">
                  {option.label}
                  {option.description && (
                    <span className="form-radio-description">{option.description}</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="form-checkbox-group">
            {question.options?.map((option) => (
              <label key={option.value} className="form-checkbox-label">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedValues, option.value]);
                    } else {
                      onChange(selectedValues.filter((v: string) => v !== option.value));
                    }
                  }}
                  className="form-checkbox"
                />
                <span className="form-checkbox-text">
                  {option.label}
                  {option.description && (
                    <span className="form-checkbox-description">{option.description}</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            id={question.id}
            className={`form-input ${error ? 'form-input-error' : ''}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`form-field ${error ? 'form-field-error' : ''}`}>
      <label htmlFor={question.id} className="form-label">
        {question.question}
        {question.required && <span className="form-required">*</span>}
      </label>
      
      {renderField()}
      
      {question.hint && !error && question.type !== 'text' && question.type !== 'number' && (
        <p className="form-help">{question.hint}</p>
      )}
      
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
};

export default FormField;