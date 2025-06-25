import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, Eye, EyeOff } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';
import { useDarkModeColors } from '../hooks/useDarkMode';

interface AccessibleInputProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'date';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
  success?: string;
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
  ariaDescribedBy?: string;
  showPasswordToggle?: boolean;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder,
  hint,
  error,
  success,
  maxLength,
  pattern,
  autoComplete,
  ariaDescribedBy,
  showPasswordToggle = false
}) => {
  const { colors } = useDarkModeColors();
  const { settings, announceToScreenReader } = useAccessibility();
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // エラーが発生した時のアナウンス
  useEffect(() => {
    if (error && settings.screenReaderOptimized) {
      announceToScreenReader(`エラー: ${error}`, 'assertive');
    }
  }, [error, settings.screenReaderOptimized, announceToScreenReader]);

  // 成功メッセージのアナウンス
  useEffect(() => {
    if (success && settings.screenReaderOptimized) {
      announceToScreenReader(`成功: ${success}`, 'polite');
    }
  }, [success, settings.screenReaderOptimized, announceToScreenReader]);

  const inputType = showPasswordToggle && showPassword ? 'text' : type;
  
  const describedByIds = [
    hint && `${id}-hint`,
    error && `${id}-error`,
    success && `${id}-success`,
    ariaDescribedBy
  ].filter(Boolean).join(' ');

  const getInputStyles = () => ({
    width: '100%',
    padding: settings.largeText ? '14px 16px' : '12px 16px',
    paddingRight: showPasswordToggle ? '48px' : '16px',
    border: `${settings.highContrast ? '2px' : '1px'} solid ${
      error ? colors.error : 
      success ? colors.success :
      focused ? colors.primary : colors.border
    }`,
    borderRadius: '8px',
    fontSize: settings.largeText ? '16px' : '14px',
    lineHeight: settings.largeText ? '1.6' : '1.5',
    background: disabled ? colors.backgroundSecondary : colors.background,
    color: disabled ? colors.textTertiary : colors.text,
    transition: settings.reducedMotion ? 'none' : 'all 0.2s ease',
    outline: 'none',
    fontFamily: 'inherit',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text'
  });

  const getLabelStyles = () => ({
    display: 'block',
    fontSize: settings.largeText ? '16px' : '14px',
    fontWeight: '600',
    color: error ? colors.error : colors.text,
    marginBottom: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer'
  });

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* ラベル */}
      <label 
        htmlFor={id}
        style={getLabelStyles()}
      >
        {label}
        {required && (
          <span 
            style={{ color: colors.error, marginLeft: '4px' }}
            aria-label="必須"
          >
            *
          </span>
        )}
      </label>

      {/* ヒント */}
      {hint && (
        <div 
          id={`${id}-hint`}
          style={{
            fontSize: settings.largeText ? '14px' : '12px',
            color: colors.textSecondary,
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px'
          }}
          role="note"
        >
          <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
          {hint}
        </div>
      )}

      {/* 入力フィールド */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          pattern={pattern}
          autoComplete={autoComplete}
          style={getInputStyles()}
          aria-describedby={describedByIds || undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required}
          onKeyDown={(e) => {
            // Enterキーでフォーム送信を防ぐ（必要に応じて）
            if (e.key === 'Enter' && type !== 'submit') {
              // フォーム送信のハンドリングは親コンポーネントで行う
            }
          }}
        />

        {/* パスワード表示トグル */}
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
            tabIndex={0}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {/* 文字数カウンター */}
      {maxLength && settings.contextualHelp && (
        <div 
          style={{
            fontSize: '12px',
            color: colors.textSecondary,
            textAlign: 'right',
            marginTop: '4px'
          }}
          aria-live="polite"
        >
          {value.length} / {maxLength}
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div 
          id={`${id}-error`}
          style={{
            fontSize: settings.largeText ? '14px' : '12px',
            color: colors.error,
            marginTop: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px'
          }}
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* 成功メッセージ */}
      {success && (
        <div 
          id={`${id}-success`}
          style={{
            fontSize: settings.largeText ? '14px' : '12px',
            color: colors.success,
            marginTop: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px'
          }}
          role="status"
          aria-live="polite"
        >
          <CheckCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
          {success}
        </div>
      )}
    </div>
  );
};

interface AccessibleTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
  success?: string;
  maxLength?: number;
  rows?: number;
  autoComplete?: string;
  ariaDescribedBy?: string;
}

export const AccessibleTextarea: React.FC<AccessibleTextareaProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder,
  hint,
  error,
  success,
  maxLength,
  rows = 4,
  autoComplete,
  ariaDescribedBy
}) => {
  const { colors } = useDarkModeColors();
  const { settings, announceToScreenReader } = useAccessibility();
  const [focused, setFocused] = useState(false);

  // エラーが発生した時のアナウンス
  useEffect(() => {
    if (error && settings.screenReaderOptimized) {
      announceToScreenReader(`エラー: ${error}`, 'assertive');
    }
  }, [error, settings.screenReaderOptimized, announceToScreenReader]);

  const describedByIds = [
    hint && `${id}-hint`,
    error && `${id}-error`,
    success && `${id}-success`,
    ariaDescribedBy
  ].filter(Boolean).join(' ');

  const getTextareaStyles = () => ({
    width: '100%',
    padding: settings.largeText ? '14px 16px' : '12px 16px',
    border: `${settings.highContrast ? '2px' : '1px'} solid ${
      error ? colors.error : 
      success ? colors.success :
      focused ? colors.primary : colors.border
    }`,
    borderRadius: '8px',
    fontSize: settings.largeText ? '16px' : '14px',
    lineHeight: settings.largeText ? '1.6' : '1.5',
    background: disabled ? colors.backgroundSecondary : colors.background,
    color: disabled ? colors.textTertiary : colors.text,
    transition: settings.reducedMotion ? 'none' : 'all 0.2s ease',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    minHeight: `${rows * 24}px`,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text'
  });

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* ラベル */}
      <label 
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: settings.largeText ? '16px' : '14px',
          fontWeight: '600',
          color: error ? colors.error : colors.text,
          marginBottom: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {label}
        {required && (
          <span 
            style={{ color: colors.error, marginLeft: '4px' }}
            aria-label="必須"
          >
            *
          </span>
        )}
      </label>

      {/* ヒント */}
      {hint && (
        <div 
          id={`${id}-hint`}
          style={{
            fontSize: settings.largeText ? '14px' : '12px',
            color: colors.textSecondary,
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px'
          }}
          role="note"
        >
          <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
          {hint}
        </div>
      )}

      {/* テキストエリア */}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        autoComplete={autoComplete}
        style={getTextareaStyles()}
        aria-describedby={describedByIds || undefined}
        aria-invalid={error ? 'true' : 'false'}
        aria-required={required}
      />

      {/* 文字数カウンター */}
      {maxLength && settings.contextualHelp && (
        <div 
          style={{
            fontSize: '12px',
            color: colors.textSecondary,
            textAlign: 'right',
            marginTop: '4px'
          }}
          aria-live="polite"
        >
          {value.length} / {maxLength}
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div 
          id={`${id}-error`}
          style={{
            fontSize: settings.largeText ? '14px' : '12px',
            color: colors.error,
            marginTop: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px'
          }}
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* 成功メッセージ */}
      {success && (
        <div 
          id={`${id}-success`}
          style={{
            fontSize: settings.largeText ? '14px' : '12px',
            color: colors.success,
            marginTop: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px'
          }}
          role="status"
          aria-live="polite"
        >
          <CheckCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
          {success}
        </div>
      )}
    </div>
  );
};

interface AccessibleSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  success?: string;
  placeholder?: string;
  ariaDescribedBy?: string;
}

export const AccessibleSelect: React.FC<AccessibleSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  hint,
  error,
  success,
  placeholder,
  ariaDescribedBy
}) => {
  const { colors } = useDarkModeColors();
  const { settings, announceToScreenReader } = useAccessibility();
  const [focused, setFocused] = useState(false);

  // エラーが発生した時のアナウンス
  useEffect(() => {
    if (error && settings.screenReaderOptimized) {
      announceToScreenReader(`エラー: ${error}`, 'assertive');
    }
  }, [error, settings.screenReaderOptimized, announceToScreenReader]);

  const describedByIds = [
    hint && `${id}-hint`,
    error && `${id}-error`,
    success && `${id}-success`,
    ariaDescribedBy
  ].filter(Boolean).join(' ');

  const getSelectStyles = () => ({
    width: '100%',
    padding: settings.largeText ? '14px 16px' : '12px 16px',
    border: `${settings.highContrast ? '2px' : '1px'} solid ${
      error ? colors.error : 
      success ? colors.success :
      focused ? colors.primary : colors.border
    }`,
    borderRadius: '8px',
    fontSize: settings.largeText ? '16px' : '14px',
    lineHeight: settings.largeText ? '1.6' : '1.5',
    background: disabled ? colors.backgroundSecondary : colors.background,
    color: disabled ? colors.textTertiary : colors.text,
    transition: settings.reducedMotion ? 'none' : 'all 0.2s ease',
    outline: 'none',
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23${colors.textSecondary.replace('#', '')}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundPosition: 'right 12px center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '16px',
    paddingRight: '40px'
  });

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* ラベル */}
      <label 
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: settings.largeText ? '16px' : '14px',
          fontWeight: '600',
          color: error ? colors.error : colors.text,
          marginBottom: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {label}
        {required && (
          <span 
            style={{ color: colors.error, marginLeft: '4px' }}
            aria-label="必須"
          >
            *
          </span>
        )}
      </label>

      {/* ヒント */}
      {hint && (
        <div 
          id={`${id}-hint`}
          style={{
            fontSize: settings.largeText ? '14px' : '12px',
            color: colors.textSecondary,
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px'
          }}
          role="note"
        >
          <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
          {hint}
        </div>
      )}

      {/* セレクトボックス */}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        style={getSelectStyles()}
        aria-describedby={describedByIds || undefined}
        aria-invalid={error ? 'true' : 'false'}
        aria-required={required}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {/* エラーメッセージ */}
      {error && (
        <div 
          id={`${id}-error`}
          style={{
            fontSize: settings.largeText ? '14px' : '12px',
            color: colors.error,
            marginTop: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px'
          }}
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* 成功メッセージ */}
      {success && (
        <div 
          id={`${id}-success`}
          style={{
            fontSize: settings.largeText ? '14px' : '12px',
            color: colors.success,
            marginTop: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px'
          }}
          role="status"
          aria-live="polite"
        >
          <CheckCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
          {success}
        </div>
      )}
    </div>
  );
};