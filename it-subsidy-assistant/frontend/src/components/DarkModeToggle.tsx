import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

interface DarkModeToggleProps {
  className?: string;
  position?: 'fixed' | 'relative';
  showSystemOption?: boolean;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ 
  className = '', 
  position = 'fixed',
  showSystemOption = false 
}) => {
  const { theme, isDark, setTheme, toggleTheme } = useDarkMode();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  if (showSystemOption) {
    return (
      <div className={`theme-selector ${className}`}>
        <div className="theme-buttons">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleThemeChange('light')}
            className={`theme-button ${theme === 'light' ? 'active' : ''}`}
            aria-label="ライトモード"
          >
            <Sun size={16} />
            <span>ライト</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleThemeChange('dark')}
            className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
            aria-label="ダークモード"
          >
            <Moon size={16} />
            <span>ダーク</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleThemeChange('system')}
            className={`theme-button ${theme === 'system' ? 'active' : ''}`}
            aria-label="システム設定"
          >
            <Monitor size={16} />
            <span>システム</span>
          </motion.button>
        </div>

        <style jsx>{`
          .theme-selector {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .theme-buttons {
            display: flex;
            background: ${isDark ? '#334155' : '#f1f5f9'};
            border-radius: 12px;
            padding: 4px;
            border: 1px solid ${isDark ? '#475569' : '#e2e8f0'};
          }

          .theme-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            background: none;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            color: ${isDark ? '#cbd5e1' : '#64748b'};
            font-size: 0.875rem;
            font-weight: 500;
          }

          .theme-button:hover {
            background: ${isDark ? '#475569' : '#e2e8f0'};
            color: ${isDark ? '#f1f5f9' : '#334155'};
          }

          .theme-button.active {
            background: ${isDark ? '#3b82f6' : '#2563eb'};
            color: white;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
          }

          .theme-button span {
            white-space: nowrap;
          }

          @media (max-width: 640px) {
            .theme-button span {
              display: none;
            }
            
            .theme-button {
              padding: 0.5rem;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      aria-label={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      style={{
        position: position,
        top: position === 'fixed' ? '20px' : 'auto',
        right: position === 'fixed' ? '20px' : 'auto',
        zIndex: position === 'fixed' ? 1000 : 'auto',
        background: isDark ? '#334155' : '#ffffff',
        border: `2px solid ${isDark ? '#475569' : '#e5e7eb'}`,
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: isDark 
          ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
          : '0 2px 4px rgba(0, 0, 0, 0.1)',
        color: isDark ? '#fbbf24' : '#1e40af'
      }}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: isDark ? 180 : 0,
          scale: isDark ? 0.8 : 1
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </motion.div>

      <style jsx>{`
        .theme-toggle:hover {
          transform: scale(1.05);
          box-shadow: ${isDark 
            ? '0 6px 12px rgba(0, 0, 0, 0.4)' 
            : '0 4px 8px rgba(0, 0, 0, 0.15)'
          };
        }

        .theme-toggle:active {
          transform: scale(0.95);
        }
      `}</style>
    </motion.button>
  );
};

export default DarkModeToggle;