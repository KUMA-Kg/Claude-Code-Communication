/**
 * 言語切り替えコンポーネント
 * アクセシブルな言語選択UI
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n/config';

interface LanguageSwitchProps {
  className?: string;
  variant?: 'button' | 'select';
}

const LanguageSwitch: React.FC<LanguageSwitchProps> = ({ 
  className = '', 
  variant = 'select' 
}) => {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language as SupportedLanguage;

  const handleLanguageChange = (language: SupportedLanguage) => {
    i18n.changeLanguage(language);
    
    // HTML言語属性を更新
    document.documentElement.lang = language;
    
    // アクセシビリティ: 言語変更をスクリーンリーダーに通知
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Language changed to ${SUPPORTED_LANGUAGES[language]}`;
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  if (variant === 'button') {
    return (
      <div className={`language-switch-buttons ${className}`} role="group" aria-label={t('common:language.switch')}>
        {Object.entries(SUPPORTED_LANGUAGES).map(([lang, label]) => (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang as SupportedLanguage)}
            className={`
              language-button 
              ${currentLanguage === lang ? 'active' : ''}
              px-4 py-2 mx-1 rounded-md transition-colors
              ${currentLanguage === lang 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `}
            aria-current={currentLanguage === lang ? 'true' : 'false'}
            aria-label={`${label} ${currentLanguage === lang ? '(現在選択中)' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`language-switch-select ${className}`}>
      <label htmlFor="language-select" className="sr-only">
        {t('common:language.switch')}
      </label>
      <select
        id="language-select"
        value={currentLanguage}
        onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
        className="
          px-4 py-2 rounded-md border border-gray-300
          bg-white text-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          cursor-pointer
        "
        aria-label={t('common:language.switch')}
      >
        {Object.entries(SUPPORTED_LANGUAGES).map(([lang, label]) => (
          <option key={lang} value={lang}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
};

// メモ化して不要な再レンダリングを防ぐ
export default React.memo(LanguageSwitch);