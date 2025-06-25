import { useState, useEffect } from 'react';

// レスポンシブブレイクポイント
const breakpoints = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  large: 1280
} as const;

interface UseResponsiveReturn {
  // 現在のウィンドウサイズ
  windowWidth: number;
  windowHeight: number;
  
  // デバイスタイプ判定
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  
  // ブレイクポイント判定
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'large';
  
  // ユーティリティ関数
  isAbove: (breakpoint: keyof typeof breakpoints) => boolean;
  isBelow: (breakpoint: keyof typeof breakpoints) => boolean;
  isBetween: (min: keyof typeof breakpoints, max: keyof typeof breakpoints) => boolean;
}

export function useResponsive(): UseResponsiveReturn {
  const [windowWidth, setWindowWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };

    // 初期値設定
    handleResize();

    // リサイズイベントリスナー追加
    window.addEventListener('resize', handleResize);
    
    // オリエンテーション変更の監視（モバイル対応）
    window.addEventListener('orientationchange', () => {
      // オリエンテーション変更後に少し遅延してサイズを取得
      setTimeout(handleResize, 100);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // デバイスタイプ判定
  const isMobile = windowWidth < breakpoints.tablet;
  const isTablet = windowWidth >= breakpoints.tablet && windowWidth < breakpoints.desktop;
  const isDesktop = windowWidth >= breakpoints.desktop && windowWidth < breakpoints.large;
  const isLarge = windowWidth >= breakpoints.large;

  // 現在のブレイクポイント
  const breakpoint: 'mobile' | 'tablet' | 'desktop' | 'large' = 
    windowWidth < breakpoints.tablet ? 'mobile' :
    windowWidth < breakpoints.desktop ? 'tablet' :
    windowWidth < breakpoints.large ? 'desktop' : 'large';

  // ユーティリティ関数
  const isAbove = (bp: keyof typeof breakpoints): boolean => {
    return windowWidth >= breakpoints[bp];
  };

  const isBelow = (bp: keyof typeof breakpoints): boolean => {
    return windowWidth < breakpoints[bp];
  };

  const isBetween = (min: keyof typeof breakpoints, max: keyof typeof breakpoints): boolean => {
    return windowWidth >= breakpoints[min] && windowWidth < breakpoints[max];
  };

  return {
    windowWidth,
    windowHeight,
    isMobile,
    isTablet,
    isDesktop,
    isLarge,
    breakpoint,
    isAbove,
    isBelow,
    isBetween
  };
}

// デバイス特性を取得するフック
interface UseDeviceReturn {
  // デバイス情報
  isTouchDevice: boolean;
  isIOSDevice: boolean;
  isAndroidDevice: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  
  // 画面情報
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
  
  // 機能サポート
  supportsHover: boolean;
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
  supportsWebP: boolean;
  supportsTouchEvents: boolean;
}

export function useDevice(): UseDeviceReturn {
  const [deviceInfo, setDeviceInfo] = useState<UseDeviceReturn>({
    isTouchDevice: false,
    isIOSDevice: false,
    isAndroidDevice: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    pixelRatio: 1,
    orientation: 'portrait',
    supportsHover: false,
    prefersReducedMotion: false,
    prefersDarkMode: false,
    supportsWebP: false,
    supportsTouchEvents: false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDeviceInfo = () => {
      const userAgent = navigator.userAgent;
      
      setDeviceInfo({
        // タッチデバイス判定
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        
        // OS判定
        isIOSDevice: /iPad|iPhone|iPod/.test(userAgent),
        isAndroidDevice: /Android/.test(userAgent),
        
        // ブラウザ判定
        isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
        isChrome: /Chrome/.test(userAgent),
        isFirefox: /Firefox/.test(userAgent),
        
        // 画面情報
        pixelRatio: window.devicePixelRatio || 1,
        orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
        
        // 機能サポート
        supportsHover: window.matchMedia('(hover: hover)').matches,
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        supportsWebP: checkWebPSupport(),
        supportsTouchEvents: 'ontouchstart' in window
      });
    };

    updateDeviceInfo();

    // オリエンテーション変更の監視
    const handleOrientationChange = () => {
      setTimeout(updateDeviceInfo, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', updateDeviceInfo);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

// WebPサポート判定
function checkWebPSupport(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

// レスポンシブ値を取得するフック
interface ResponsiveValue<T> {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  large?: T;
}

export function useResponsiveValue<T>(values: ResponsiveValue<T>, fallback: T): T {
  const { breakpoint } = useResponsive();
  
  return values[breakpoint] ?? 
         (breakpoint === 'large' ? values.desktop : undefined) ??
         (breakpoint === 'desktop' ? values.tablet : undefined) ??
         (breakpoint === 'tablet' ? values.mobile : undefined) ??
         fallback;
}

// レスポンシブクラス名を生成するフック
export function useResponsiveClasses(
  baseClass: string,
  responsiveClasses: ResponsiveValue<string>
): string {
  const { breakpoint } = useResponsive();
  
  const responsiveClass = responsiveClasses[breakpoint] || '';
  return `${baseClass} ${responsiveClass}`.trim();
}

// ビューポートの監視とサイズ変更の検出
interface UseViewportReturn {
  width: number;
  height: number;
  aspectRatio: number;
  isLandscape: boolean;
  isPortrait: boolean;
  viewportArea: number;
}

export function useViewport(): UseViewportReturn {
  const { windowWidth, windowHeight } = useResponsive();
  
  return {
    width: windowWidth,
    height: windowHeight,
    aspectRatio: windowWidth / windowHeight,
    isLandscape: windowWidth > windowHeight,
    isPortrait: windowHeight > windowWidth,
    viewportArea: windowWidth * windowHeight
  };
}

// メディアクエリのフック
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

// スクロール位置の監視
interface UseScrollReturn {
  scrollX: number;
  scrollY: number;
  scrollDirection: 'up' | 'down' | 'left' | 'right' | 'none';
  isScrolling: boolean;
  isAtTop: boolean;
  isAtBottom: boolean;
  scrollPercentage: number;
}

export function useScroll(): UseScrollReturn {
  const [scrollInfo, setScrollInfo] = useState<UseScrollReturn>({
    scrollX: 0,
    scrollY: 0,
    scrollDirection: 'none',
    isScrolling: false,
    isAtTop: true,
    isAtBottom: false,
    scrollPercentage: 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastScrollX = window.scrollX;
    let lastScrollY = window.scrollY;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollX = window.scrollX;
      const currentScrollY = window.scrollY;
      
      const deltaX = currentScrollX - lastScrollX;
      const deltaY = currentScrollY - lastScrollY;
      
      let direction: 'up' | 'down' | 'left' | 'right' | 'none' = 'none';
      
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        direction = deltaY > 0 ? 'down' : 'up';
      } else if (Math.abs(deltaX) > 0) {
        direction = deltaX > 0 ? 'right' : 'left';
      }

      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = documentHeight > 0 ? (currentScrollY / documentHeight) * 100 : 0;

      setScrollInfo({
        scrollX: currentScrollX,
        scrollY: currentScrollY,
        scrollDirection: direction,
        isScrolling: true,
        isAtTop: currentScrollY <= 0,
        isAtBottom: currentScrollY >= documentHeight - 1,
        scrollPercentage: Math.min(100, Math.max(0, scrollPercentage))
      });

      lastScrollX = currentScrollX;
      lastScrollY = currentScrollY;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setScrollInfo(prev => ({ ...prev, isScrolling: false }));
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 初期値設定

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return scrollInfo;
}