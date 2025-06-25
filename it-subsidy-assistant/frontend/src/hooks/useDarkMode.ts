import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface UseDarkModeReturn {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export function useDarkMode(): UseDarkModeReturn {
  const [theme, setThemeState] = useState<Theme>(() => {
    // ローカルストレージから初期値を取得
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      return savedTheme || 'system';
    }
    return 'system';
  });

  const [isDark, setIsDark] = useState(false);

  // システムのダークモード設定を取得
  const getSystemTheme = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, []);

  // テーマの実際の値を計算
  const calculateIsDark = useCallback((currentTheme: Theme) => {
    switch (currentTheme) {
      case 'light':
        return false;
      case 'dark':
        return true;
      case 'system':
        return getSystemTheme();
      default:
        return false;
    }
  }, [getSystemTheme]);

  // テーマを設定
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    const shouldBeDark = calculateIsDark(newTheme);
    setIsDark(shouldBeDark);

    // HTMLのdata-theme属性を更新
    document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
    
    // CSSクラスを更新
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  }, [calculateIsDark]);

  // テーマをトグル
  const toggleTheme = useCallback(() => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  }, [isDark, setTheme]);

  // 初期化とシステムテーマの監視
  useEffect(() => {
    const initialIsDark = calculateIsDark(theme);
    setIsDark(initialIsDark);

    // HTMLのdata-theme属性を初期化
    document.documentElement.setAttribute('data-theme', initialIsDark ? 'dark' : 'light');
    
    // CSSクラスを初期化
    if (initialIsDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }

    // システムテーマの変更を監視
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        if (theme === 'system') {
          const shouldBeDark = e.matches;
          setIsDark(shouldBeDark);
          
          // HTMLのdata-theme属性を更新
          document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
          
          // CSSクラスを更新
          if (shouldBeDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark-mode');
          } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark-mode');
          }
        }
      };

      // イベントリスナーを追加
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
      } else {
        // 古いブラウザ対応
        mediaQuery.addListener(handleSystemThemeChange);
      }

      // クリーンアップ
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleSystemThemeChange);
        } else {
          // 古いブラウザ対応
          mediaQuery.removeListener(handleSystemThemeChange);
        }
      };
    }
  }, [theme, calculateIsDark]);

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme
  };
}

// ダークモード対応のCSSカスタムプロパティを管理
export function useDarkModeColors() {
  const { isDark } = useDarkMode();

  return {
    isDark,
    colors: {
      // 背景色
      background: isDark ? '#0f172a' : '#ffffff',
      backgroundSecondary: isDark ? '#1e293b' : '#f8fafc',
      backgroundTertiary: isDark ? '#334155' : '#f1f5f9',
      
      // テキスト色
      text: isDark ? '#f8fafc' : '#1f2937',
      textSecondary: isDark ? '#cbd5e1' : '#6b7280',
      textTertiary: isDark ? '#94a3b8' : '#9ca3af',
      
      // プライマリ色
      primary: isDark ? '#3b82f6' : '#2563eb',
      primaryHover: isDark ? '#2563eb' : '#1d4ed8',
      
      // セマンティック色
      success: isDark ? '#10b981' : '#16a34a',
      warning: isDark ? '#f59e0b' : '#d97706',
      error: isDark ? '#ef4444' : '#dc2626',
      
      // ボーダー色
      border: isDark ? '#475569' : '#e5e7eb',
      borderLight: isDark ? '#64748b' : '#f3f4f6',
      
      // シャドウ
      shadow: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
      shadowLarge: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)'
    }
  };
}