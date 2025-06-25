import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Bell, Settings, User, LogOut } from 'lucide-react';
import { useDarkModeColors } from '../../hooks/useDarkMode';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
  headerActions?: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  title = 'IT補助金アシストツール',
  showSidebar = true,
  sidebarContent,
  headerActions
}) => {
  const { colors } = useDarkModeColors();
  const { user, signOut } = useAuth();
  const { unreadCount, notifications } = useRealtimeNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  // ウィンドウサイズの監視
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // デバイスタイプの判定
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  // レスポンシブブレイクポイント
  const breakpoints = {
    mobile: windowWidth < 640,
    tablet: windowWidth >= 640 && windowWidth < 1024,
    desktop: windowWidth >= 1024
  };

  const headerVariants = {
    mobile: {
      padding: '1rem',
      height: '60px'
    },
    tablet: {
      padding: '1rem 1.5rem',
      height: '64px'
    },
    desktop: {
      padding: '1rem 2rem',
      height: '72px'
    }
  };

  const sidebarVariants = {
    closed: {
      x: '-100%',
      transition: {
        type: 'tween',
        duration: 0.3
      }
    },
    open: {
      x: 0,
      transition: {
        type: 'tween',
        duration: 0.3
      }
    }
  };

  const contentVariants = {
    mobile: {
      marginLeft: 0,
      padding: '1rem'
    },
    tablet: {
      marginLeft: showSidebar && !isMobile ? '240px' : 0,
      padding: '1.5rem'
    },
    desktop: {
      marginLeft: showSidebar ? '280px' : 0,
      padding: '2rem'
    }
  };

  const currentVariant = breakpoints.mobile ? 'mobile' : 
                        breakpoints.tablet ? 'tablet' : 'desktop';

  return (
    <div className="responsive-layout" style={{
      minHeight: '100vh',
      background: colors.backgroundSecondary,
      color: colors.text
    }}>
      {/* ヘッダー */}
      <motion.header
        className="header"
        animate={currentVariant}
        variants={headerVariants}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: colors.background,
          borderBottom: `1px solid ${colors.border}`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* ハンバーガーメニュー（モバイル・タブレット） */}
          {(isMobile || (isTablet && showSidebar)) && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text,
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          {/* ロゴ・タイトル */}
          <h1 style={{
            fontSize: breakpoints.mobile ? '1.125rem' : breakpoints.tablet ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: colors.text,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: breakpoints.mobile ? '150px' : 'none'
          }}>
            {title}
          </h1>
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* カスタムヘッダーアクション */}
          {headerActions}

          {/* 通知ベル */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text,
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '0.25rem',
                  right: '0.25rem',
                  background: colors.error,
                  color: 'white',
                  fontSize: '0.75rem',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* 通知ドロップダウン */}
            <AnimatePresence>
              {isNotificationOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    background: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '0.5rem',
                    boxShadow: `0 10px 25px ${colors.shadowLarge}`,
                    width: breakpoints.mobile ? '280px' : '320px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 1001
                  }}
                >
                  <div style={{ padding: '1rem', borderBottom: `1px solid ${colors.border}` }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', margin: 0 }}>
                      通知 ({unreadCount}件未読)
                    </h3>
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: `1px solid ${colors.border}`,
                          background: notification.read ? 'transparent' : colors.primary + '10'
                        }}
                      >
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                          {notification.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                          {notification.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ユーザーメニュー */}
          {user && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                {!breakpoints.mobile && (
                  <ChevronDown size={16} style={{ 
                    transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }} />
                )}
              </button>

              {/* ユーザードロップダウン */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '0.5rem',
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '0.5rem',
                      boxShadow: `0 10px 25px ${colors.shadowLarge}`,
                      width: '200px',
                      zIndex: 1001
                    }}
                  >
                    <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${colors.border}` }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: colors.text }}>
                        {user.email}
                      </div>
                    </div>
                    <div style={{ padding: '0.5rem' }}>
                      <button
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          background: 'none',
                          border: 'none',
                          color: colors.text,
                          cursor: 'pointer',
                          borderRadius: '0.375rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        <User size={16} />
                        プロフィール
                      </button>
                      <button
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          background: 'none',
                          border: 'none',
                          color: colors.text,
                          cursor: 'pointer',
                          borderRadius: '0.375rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        <Settings size={16} />
                        設定
                      </button>
                      <button
                        onClick={signOut}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          background: 'none',
                          border: 'none',
                          color: colors.error,
                          cursor: 'pointer',
                          borderRadius: '0.375rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        <LogOut size={16} />
                        ログアウト
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.header>

      {/* サイドバー */}
      {showSidebar && (
        <>
          {/* デスクトップサイドバー */}
          {isDesktop && (
            <motion.aside
              className="sidebar-desktop"
              style={{
                position: 'fixed',
                top: '72px',
                left: 0,
                width: '280px',
                height: 'calc(100vh - 72px)',
                background: colors.background,
                borderRight: `1px solid ${colors.border}`,
                overflowY: 'auto',
                zIndex: 999
              }}
            >
              <div style={{ padding: '1.5rem' }}>
                {sidebarContent}
              </div>
            </motion.aside>
          )}

          {/* モバイル・タブレットサイドバー */}
          <AnimatePresence>
            {(isMobile || isTablet) && isMobileMenuOpen && (
              <>
                {/* オーバーレイ */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 998
                  }}
                />

                {/* サイドバー */}
                <motion.aside
                  className="sidebar-mobile"
                  variants={sidebarVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: isTablet ? '320px' : '280px',
                    height: '100vh',
                    background: colors.background,
                    borderRight: `1px solid ${colors.border}`,
                    overflowY: 'auto',
                    zIndex: 999
                  }}
                >
                  <div style={{ 
                    padding: '1rem',
                    borderBottom: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                      メニュー
                    </h2>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: colors.text,
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '0.375rem'
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    {sidebarContent}
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* メインコンテンツ */}
      <motion.main
        className="main-content"
        animate={currentVariant}
        variants={contentVariants}
        style={{
          marginTop: breakpoints.mobile ? '60px' : breakpoints.tablet ? '64px' : '72px',
          minHeight: `calc(100vh - ${breakpoints.mobile ? '60px' : breakpoints.tablet ? '64px' : '72px'})`,
          transition: 'margin-left 0.3s ease'
        }}
      >
        <div className="content-wrapper" style={{
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%'
        }}>
          {children}
        </div>
      </motion.main>

      {/* レスポンシブスタイル */}
      <style jsx>{`
        .responsive-layout {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .header {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .sidebar-desktop::-webkit-scrollbar,
        .sidebar-mobile::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-desktop::-webkit-scrollbar-track,
        .sidebar-mobile::-webkit-scrollbar-track {
          background: ${colors.backgroundSecondary};
        }

        .sidebar-desktop::-webkit-scrollbar-thumb,
        .sidebar-mobile::-webkit-scrollbar-thumb {
          background: ${colors.border};
          border-radius: 3px;
        }

        .sidebar-desktop::-webkit-scrollbar-thumb:hover,
        .sidebar-mobile::-webkit-scrollbar-thumb:hover {
          background: ${colors.textTertiary};
        }

        @media (max-width: 639px) {
          .header {
            padding: 0.75rem !important;
            height: 56px !important;
          }
          
          .main-content {
            margin-top: 56px !important;
            min-height: calc(100vh - 56px) !important;
            padding: 0.75rem !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

// レスポンシブコンテナコンポーネント
export const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  center?: boolean;
}> = ({ children, maxWidth = 'lg', padding = true, center = true }) => {
  const maxWidthMap = {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    full: '100%'
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: maxWidthMap[maxWidth],
      margin: center ? '0 auto' : '0',
      padding: padding ? '0 1rem' : '0'
    }}>
      {children}
    </div>
  );
};

// レスポンシブグリッドコンポーネント
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: string;
  className?: string;
}> = ({ children, cols = { mobile: 1, tablet: 2, desktop: 3 }, gap = '1rem', className = '' }) => {
  return (
    <div 
      className={`responsive-grid ${className}`}
      style={{
        display: 'grid',
        gap,
        gridTemplateColumns: `repeat(${cols.mobile || 1}, minmax(0, 1fr))`
      }}
    >
      {children}
      
      <style jsx>{`
        @media (min-width: 640px) {
          .responsive-grid {
            grid-template-columns: repeat(${cols.tablet || 2}, minmax(0, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .responsive-grid {
            grid-template-columns: repeat(${cols.desktop || 3}, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
};