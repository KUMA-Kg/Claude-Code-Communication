import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useDarkModeColors } from '../../hooks/useDarkMode';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdated?: Date;
  updateCount?: number;
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'relative';
  showDetails?: boolean;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({
  isConnected,
  lastUpdated,
  updateCount = 0,
  className = '',
  position = 'top-right',
  showDetails = false
}) => {
  const { colors } = useDarkModeColors();

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}秒前`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前`;
    return date.toLocaleDateString('ja-JP');
  };

  const getPositionStyle = () => {
    if (position === 'relative') return {};
    
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyle, top: '20px', left: '20px' };
      case 'top-right':
        return { ...baseStyle, top: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyle, bottom: '20px', left: '20px' };
      case 'bottom-right':
        return { ...baseStyle, bottom: '20px', right: '20px' };
      default:
        return baseStyle;
    }
  };

  const indicatorVariants = {
    connected: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    disconnected: {
      scale: 0.9,
      opacity: 0.7,
      transition: {
        duration: 0.2
      }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  };

  const dotVariants = {
    connected: {
      background: colors.success,
      scale: 1,
      transition: {
        duration: 0.3
      }
    },
    disconnected: {
      background: colors.error,
      scale: 1.2,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      className={`realtime-indicator ${className}`}
      style={{
        ...getPositionStyle(),
        background: colors.background,
        border: `2px solid ${colors.border}`,
        borderRadius: showDetails ? '12px' : '50%',
        padding: showDetails ? '12px 16px' : '8px',
        boxShadow: `0 4px 12px ${colors.shadow}`,
        display: 'flex',
        alignItems: 'center',
        gap: showDetails ? '12px' : '0',
        minWidth: showDetails ? '200px' : 'auto',
        transition: 'all 0.3s ease'
      }}
      variants={indicatorVariants}
      animate={isConnected ? 'connected' : 'disconnected'}
      whileHover={{ scale: 1.05 }}
    >
      <div className="indicator-icon" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <motion.div
          animate={isConnected ? 'connected' : 'disconnected'}
          variants={dotVariants}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            zIndex: 1
          }}
        />
        
        {isConnected ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Wifi size={20} color={colors.primary} />
          </motion.div>
        ) : (
          <WifiOff size={20} color={colors.error} />
        )}
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="indicator-details"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '12px',
              color: colors.textSecondary
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              color: isConnected ? colors.success : colors.error,
              fontWeight: '600'
            }}>
              {isConnected ? (
                <>
                  <CheckCircle size={14} />
                  リアルタイム接続中
                </>
              ) : (
                <>
                  <AlertCircle size={14} />
                  接続が切断されました
                </>
              )}
            </div>
            
            {lastUpdated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} />
                {formatLastUpdated(lastUpdated)}に更新
              </div>
            )}
            
            {updateCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={12} />
                {updateCount}回更新
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .realtime-indicator {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          cursor: ${showDetails ? 'default' : 'pointer'};
        }

        .realtime-indicator:hover {
          border-color: ${isConnected ? colors.success : colors.error};
        }

        @media (max-width: 640px) {
          .realtime-indicator {
            ${position !== 'relative' ? `
              position: fixed;
              top: 10px;
              right: 10px;
              transform: scale(0.9);
            ` : ''}
          }
        }
      `}</style>
    </motion.div>
  );
};

// リアルタイム更新通知のトースト
export const RealtimeToast: React.FC<{
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}> = ({ message, type, isVisible, onClose, duration = 3000 }) => {
  const { colors } = useDarkModeColors();

  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getTypeColor = () => {
    switch (type) {
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      default: return colors.primary;
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={16} />;
      case 'warning': return <AlertCircle size={16} />;
      case 'error': return <AlertCircle size={16} />;
      default: return <RefreshCw size={16} />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="realtime-toast"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: colors.background,
            border: `2px solid ${getTypeColor()}`,
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: `0 8px 25px ${colors.shadowLarge}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '400px',
            minWidth: '200px',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          <div style={{ color: getTypeColor() }}>
            {getTypeIcon()}
          </div>
          
          <span style={{ 
            color: colors.text, 
            fontWeight: '500',
            flex: 1
          }}>
            {message}
          </span>
          
          <button
            onClick={onClose}
            style={{
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
          >
            ×
          </button>

          <style jsx>{`
            .realtime-toast:hover {
              border-color: ${colors.primary};
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};