/**
 * i18n設定 - 日本語/英語対応
 * 補助金選択システムの多言語対応基盤
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// 言語リソースをインポート
import jaTranslations from './locales/ja';
import enTranslations from './locales/en';

// 言語設定の型定義
export type SupportedLanguage = 'ja' | 'en';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, string> = {
  ja: '日本語',
  en: 'English'
};

// i18n初期化設定
i18n
  // バックエンドから翻訳ファイルを読み込む
  .use(Backend)
  // ブラウザの言語設定を検出
  .use(LanguageDetector)
  // React連携
  .use(initReactI18next)
  // 初期化
  .init({
    // デフォルト言語
    fallbackLng: 'ja',
    
    // デバッグモード（開発環境のみ）
    debug: process.env.NODE_ENV === 'development',
    
    // 翻訳リソース
    resources: {
      ja: jaTranslations,
      en: enTranslations
    },
    
    // 名前空間設定
    ns: ['common', 'subsidies', 'forms', 'errors', 'accessibility'],
    defaultNS: 'common',
    
    // 補間設定
    interpolation: {
      escapeValue: false, // ReactはデフォルトでXSS対策済み
      format: (value, format, lng) => {
        // 日付フォーマット
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng).format(value);
        }
        // 通貨フォーマット
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: lng === 'ja' ? 'JPY' : 'USD'
          }).format(value);
        }
        // 数値フォーマット
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value);
        }
        return value;
      }
    },
    
    // 言語検出設定
    detection: {
      // 言語情報の検出順序
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // localStorageのキー名
      lookupLocalStorage: 'subsidyAppLanguage',
      
      // キャッシュを使用
      caches: ['localStorage'],
      
      // 除外するパス
      excludeCacheFor: ['cimode']
    },
    
    // React Suspenseサポート
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em'],
      transWrapTextNodes: ''
    },
    
    // 読み込み設定
    load: 'languageOnly',
    
    // 特殊文字のエスケープ
    keySeparator: '.',
    nsSeparator: ':',
    
    // パフォーマンス最適化
    saveMissing: false,
    updateMissing: false,
    
    // アクセシビリティ用メタデータ
    postProcess: ['accessibility'],
    
    // 言語別の特殊設定
    lng: 'ja', // 初期言語
    
    // プラグイン設定
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/add/{{lng}}/{{ns}}',
      allowMultiLoading: false,
      crossDomain: false,
      withCredentials: false,
      overrideMimeType: false
    }
  });

// 言語切り替えフック
export const useLanguageSwitch = () => {
  const switchLanguage = (language: SupportedLanguage) => {
    i18n.changeLanguage(language);
    
    // HTML言語属性を更新
    document.documentElement.lang = language;
    
    // アクセシビリティ用のアナウンス
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.textContent = `Language changed to ${SUPPORTED_LANGUAGES[language]}`;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };
  
  return { switchLanguage, currentLanguage: i18n.language as SupportedLanguage };
};

// 翻訳キーの型安全性を保証するユーティリティ
export type TranslationKeys = {
  common: keyof typeof jaTranslations.common;
  subsidies: keyof typeof jaTranslations.subsidies;
  forms: keyof typeof jaTranslations.forms;
  errors: keyof typeof jaTranslations.errors;
  accessibility: keyof typeof jaTranslations.accessibility;
};

// カスタムフォーマッター
export const formatters = {
  subsidyAmount: (amount: number, lng: string = 'ja') => {
    return new Intl.NumberFormat(lng, {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0
    }).format(amount);
  },
  
  percentage: (value: number, lng: string = 'ja') => {
    return new Intl.NumberFormat(lng, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value);
  },
  
  date: (date: Date | string, lng: string = 'ja') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(lng, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  }
};

// 言語別の入力検証ルール
export const validationRules = {
  ja: {
    phoneNumber: /^0\d{1,4}-?\d{1,4}-?\d{4}$/,
    postalCode: /^\d{3}-?\d{4}$/,
    corporateNumber: /^\d{13}$/
  },
  en: {
    phoneNumber: /^[\d\s\-\+\(\)]+$/,
    postalCode: /^[\w\s\-]+$/,
    corporateNumber: /^[\d\-]+$/
  }
};

// デフォルトエクスポート
export default i18n;