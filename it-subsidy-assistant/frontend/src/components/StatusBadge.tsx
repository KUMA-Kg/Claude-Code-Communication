import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

export type SubsidyStatus = 'active' | 'preparing' | 'closed' | 'coming-soon';

interface StatusBadgeProps {
  status: SubsidyStatus;
  deadline?: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  animated?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  deadline,
  size = 'medium',
  showIcon = true,
  animated = true
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          label: '受付中',
          icon: CheckCircle,
          bgColor: 'var(--success-bg, #dcfce7)',
          textColor: 'var(--success-text, #166534)',
          borderColor: 'var(--success-border, #22c55e)',
          iconColor: '#22c55e',
          pulse: true
        };
      case 'preparing':
        return {
          label: '準備中',
          icon: Clock,
          bgColor: 'var(--warning-bg, #fef3c7)',
          textColor: 'var(--warning-text, #92400e)',
          borderColor: 'var(--warning-border, #f59e0b)',
          iconColor: '#f59e0b',
          pulse: false
        };
      case 'closed':
        return {
          label: '締切済',
          icon: AlertCircle,
          bgColor: 'var(--danger-bg, #fee2e2)',
          textColor: 'var(--danger-text, #991b1b)',
          borderColor: 'var(--danger-border, #ef4444)',
          iconColor: '#ef4444',
          pulse: false
        };
      case 'coming-soon':
        return {
          label: '近日公開',
          icon: Calendar,
          bgColor: 'var(--info-bg, #dbeafe)',
          textColor: 'var(--info-text, #1e40af)',
          borderColor: 'var(--info-border, #3b82f6)',
          iconColor: '#3b82f6',
          pulse: false
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: '4px 8px',
          fontSize: '12px',
          iconSize: 14,
          borderRadius: '12px',
          gap: '4px'
        };
      case 'medium':
        return {
          padding: '6px 12px',
          fontSize: '14px',
          iconSize: 16,
          borderRadius: '16px',
          gap: '6px'
        };
      case 'large':
        return {
          padding: '8px 16px',
          fontSize: '16px',
          iconSize: 20,
          borderRadius: '20px',
          gap: '8px'
        };
    }
  };

  const config = getStatusConfig();
  const sizeStyles = getSizeStyles();
  const Icon = config.icon;

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeStyles.gap,
    padding: sizeStyles.padding,
    fontSize: sizeStyles.fontSize,
    fontWeight: '600',
    borderRadius: sizeStyles.borderRadius,
    backgroundColor: config.bgColor,
    color: config.textColor,
    border: `2px solid ${config.borderColor}`,
    position: 'relative',
    userSelect: 'none',
    transition: 'all 0.3s ease'
  };

  const BadgeContent = () => (
    <>
      {showIcon && (
        <Icon 
          size={sizeStyles.iconSize} 
          color={config.iconColor}
          style={{ flexShrink: 0 }}
        />
      )}
      <span>{config.label}</span>
      {deadline && status === 'active' && (
        <span style={{ 
          fontSize: `${sizeStyles.fontSize * 0.85}px`,
          opacity: 0.8,
          marginLeft: '4px'
        }}>
          ({deadline}まで)
        </span>
      )}
    </>
  );

  if (!animated) {
    return (
      <div style={baseStyles}>
        <BadgeContent />
      </div>
    );
  }

  return (
    <motion.div
      style={baseStyles}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
    >
      {config.pulse && status === 'active' && (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: sizeStyles.borderRadius,
            border: `2px solid ${config.borderColor}`,
            pointerEvents: 'none'
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 0, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
      <BadgeContent />
    </motion.div>
  );
};

// CSS変数を定義するためのスタイルシート
export const StatusBadgeStyles = `
  :root {
    --success-bg: #dcfce7;
    --success-text: #166534;
    --success-border: #22c55e;
    --warning-bg: #fef3c7;
    --warning-text: #92400e;
    --warning-border: #f59e0b;
    --danger-bg: #fee2e2;
    --danger-text: #991b1b;
    --danger-border: #ef4444;
    --info-bg: #dbeafe;
    --info-text: #1e40af;
    --info-border: #3b82f6;
  }

  [data-theme="dark"] {
    --success-bg: rgba(34, 197, 94, 0.2);
    --success-text: #86efac;
    --success-border: #22c55e;
    --warning-bg: rgba(245, 158, 11, 0.2);
    --warning-text: #fcd34d;
    --warning-border: #f59e0b;
    --danger-bg: rgba(239, 68, 68, 0.2);
    --danger-text: #fca5a5;
    --danger-border: #ef4444;
    --info-bg: rgba(59, 130, 246, 0.2);
    --info-text: #93bbfc;
    --info-border: #3b82f6;
  }
`;

export default StatusBadge;