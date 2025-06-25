import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useDarkModeColors } from '../hooks/useDarkMode';

interface AccessibilitySettings {
  // 視覚的アクセシビリティ
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  focusVisible: boolean;
  
  // 聴覚的アクセシビリティ
  soundEnabled: boolean;
  screenReaderOptimized: boolean;
  
  // 運動アクセシビリティ
  keyboardNavigation: boolean;
  stickyHover: boolean;
  clickDelay: number; // ミリ秒
  
  // 認知アクセシビリティ
  simplifiedInterface: boolean;
  autoSave: boolean;
  progressIndicators: boolean;
  contextualHelp: boolean;
  
  // 言語・国際化
  language: 'ja' | 'en';
  rtlSupport: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => void;
  resetSettings: () => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  applyAccessibilityStyles: () => Record<string, any>;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  focusVisible: true,
  soundEnabled: true,
  screenReaderOptimized: false,
  keyboardNavigation: true,
  stickyHover: false,
  clickDelay: 0,
  simplifiedInterface: false,
  autoSave: true,
  progressIndicators: true,
  contextualHelp: true,
  language: 'ja',
  rtlSupport: false
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const { colors } = useDarkModeColors();
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error);
      }
    }
  }, []);

  // システム設定の検出と適用
  useEffect(() => {
    // システムの動きを減らす設定を検出
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !settings.reducedMotion) {
      updateSetting('reducedMotion', true);
    }

    // システムの高コントラスト設定を検出
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    if (prefersHighContrast && !settings.highContrast) {
      updateSetting('highContrast', true);
    }

    // システム言語の検出
    const browserLanguage = navigator.language.startsWith('en') ? 'en' : 'ja';
    if (settings.language !== browserLanguage) {
      updateSetting('language', browserLanguage);
    }
  }, []);

  // 設定が変更されたときにローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('accessibility-settings');
  };

  // スクリーンリーダーへのアナウンス
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // アクセシビリティスタイルの適用
  const applyAccessibilityStyles = (): Record<string, any> => {
    const styles: Record<string, any> = {};

    // 高コントラストモード
    if (settings.highContrast) {
      styles.filter = 'contrast(150%)';
      styles.outline = '2px solid currentColor';
    }

    // 大きなテキスト
    if (settings.largeText) {
      styles.fontSize = '1.25em';
      styles.lineHeight = '1.6';
    }

    // 動きを減らす
    if (settings.reducedMotion) {
      styles.transition = 'none';
      styles.animation = 'none';
    }

    // フォーカス表示の強化
    if (settings.focusVisible) {
      styles.focusVisible = {
        outline: `3px solid ${colors.primary}`,
        outlineOffset: '2px',
        borderRadius: '4px'
      };
    }

    // キーボードナビゲーション対応
    if (settings.keyboardNavigation) {
      styles.tabIndex = 0;
    }

    return styles;
  };

  // CSSカスタムプロパティの設定
  useEffect(() => {
    const root = document.documentElement;
    
    // フォントサイズの調整
    if (settings.largeText) {
      root.style.setProperty('--font-size-base', '1.125rem');
      root.style.setProperty('--font-size-lg', '1.5rem');
      root.style.setProperty('--font-size-xl', '1.875rem');
    } else {
      root.style.setProperty('--font-size-base', '1rem');
      root.style.setProperty('--font-size-lg', '1.25rem');
      root.style.setProperty('--font-size-xl', '1.5rem');
    }

    // 動きの調整
    if (settings.reducedMotion) {
      root.style.setProperty('--transition-duration', '0.01ms');
      root.style.setProperty('--animation-duration', '0.01ms');
    } else {
      root.style.setProperty('--transition-duration', '0.2s');
      root.style.setProperty('--animation-duration', '0.3s');
    }

    // コントラストの調整
    if (settings.highContrast) {
      root.style.setProperty('--border-width', '2px');
      root.style.setProperty('--outline-width', '3px');
    } else {
      root.style.setProperty('--border-width', '1px');
      root.style.setProperty('--outline-width', '2px');
    }

    // RTLサポート
    if (settings.rtlSupport) {
      root.setAttribute('dir', 'rtl');
    } else {
      root.setAttribute('dir', 'ltr');
    }

    // 言語設定
    root.setAttribute('lang', settings.language);

  }, [settings]);

  // WAI-ARIAサポートの追加
  useEffect(() => {
    // ページの言語を設定
    document.documentElement.lang = settings.language;
    
    // スクリーンリーダー最適化の場合、追加のARIA属性を設定
    if (settings.screenReaderOptimized) {
      document.body.setAttribute('aria-label', 'IT補助金アシストツール');
      
      // ランドマークの強化
      const main = document.querySelector('main');
      if (main) {
        main.setAttribute('aria-label', 'メインコンテンツ');
      }
      
      const header = document.querySelector('header');
      if (header) {
        header.setAttribute('aria-label', 'サイトヘッダー');
      }
      
      const nav = document.querySelector('nav');
      if (nav) {
        nav.setAttribute('aria-label', 'メインナビゲーション');
      }
    }
  }, [settings.language, settings.screenReaderOptimized]);

  // キーボードナビゲーションのサポート
  useEffect(() => {
    if (!settings.keyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Escキーでモーダルを閉じる
      if (event.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');
        modals.forEach(modal => {
          const closeButton = modal.querySelector('[aria-label*="閉じる"], [aria-label*="close"]');
          if (closeButton && closeButton instanceof HTMLElement) {
            closeButton.click();
          }
        });
      }
      
      // Tab + Shift でフォーカス管理
      if (event.key === 'Tab') {
        // フォーカス可能な要素の一覧を取得
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        // モーダル内でのフォーカストラップ
        const activeModal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])');
        if (activeModal) {
          const modalFocusableElements = activeModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          if (modalFocusableElements.length > 0) {
            const firstModalElement = modalFocusableElements[0] as HTMLElement;
            const lastModalElement = modalFocusableElements[modalFocusableElements.length - 1] as HTMLElement;
            
            if (event.shiftKey && document.activeElement === firstModalElement) {
              event.preventDefault();
              lastModalElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastModalElement) {
              event.preventDefault();
              firstModalElement.focus();
            }
          }
        }
      }
      
      // スペースキーでボタンのクリック
      if (event.key === ' ' && event.target instanceof HTMLElement) {
        if (event.target.getAttribute('role') === 'button' || event.target.tagName === 'BUTTON') {
          event.preventDefault();
          event.target.click();
        }
      }
      
      // Enterキーでリンクやボタンのアクティベート
      if (event.key === 'Enter' && event.target instanceof HTMLElement) {
        if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON' || event.target.getAttribute('role') === 'button') {
          event.preventDefault();
          event.target.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings.keyboardNavigation]);

  const contextValue: AccessibilityContextType = {
    settings,
    updateSetting,
    resetSettings,
    announceToScreenReader,
    applyAccessibilityStyles
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// アクセシビリティチェッカーコンポーネント
export const AccessibilityChecker: React.FC = () => {
  const [issues, setIssues] = useState<string[]>([]);
  const { announceToScreenReader } = useAccessibility();

  useEffect(() => {
    const checkAccessibility = () => {
      const foundIssues: string[] = [];

      // 画像のalt属性チェック
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        if (!img.getAttribute('alt')) {
          foundIssues.push(`画像 ${index + 1} にalt属性がありません`);
        }
      });

      // フォーム要素のラベルチェック
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach((input, index) => {
        const id = input.getAttribute('id');
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label');
        const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
        
        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
          foundIssues.push(`フォーム要素 ${index + 1} にラベルがありません`);
        }
      });

      // 見出しの階層チェック
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let lastLevel = 0;
      headings.forEach((heading, index) => {
        const currentLevel = parseInt(heading.tagName.substring(1));
        if (currentLevel > lastLevel + 1) {
          foundIssues.push(`見出し ${index + 1} の階層が正しくありません`);
        }
        lastLevel = currentLevel;
      });

      // コントラスト比のチェック（簡易版）
      const textElements = document.querySelectorAll('p, span, div, button, a');
      textElements.forEach((element, index) => {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        // 簡易的なコントラスト比チェック
        if (color === backgroundColor) {
          foundIssues.push(`要素 ${index + 1} のテキストと背景色のコントラストが不十分です`);
        }
      });

      setIssues(foundIssues);
      
      if (foundIssues.length > 0) {
        announceToScreenReader(`${foundIssues.length}個のアクセシビリティ問題が見つかりました`);
      }
    };

    // 開発環境でのみ実行
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(checkAccessibility, 2000);
      return () => clearTimeout(timer);
    }
  }, [announceToScreenReader]);

  if (process.env.NODE_ENV !== 'development' || issues.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#ff6b6b',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        maxWidth: '300px',
        zIndex: 10000,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
      role="alert"
      aria-label="アクセシビリティ問題の通知"
    >
      <strong>アクセシビリティ問題:</strong>
      <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px' }}>
        {issues.slice(0, 5).map((issue, index) => (
          <li key={index} style={{ marginBottom: '4px' }}>
            {issue}
          </li>
        ))}
      </ul>
      {issues.length > 5 && (
        <p style={{ margin: '8px 0 0 0', fontSize: '11px' }}>
          その他 {issues.length - 5} 個の問題があります
        </p>
      )}
    </div>
  );
};