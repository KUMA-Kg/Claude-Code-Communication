import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'form-input',
          error && 'border-color-error',
          className
        )}
        {...props}
      />
      {helperText && !error && (
        <p className="form-help">{helperText}</p>
      )}
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
};