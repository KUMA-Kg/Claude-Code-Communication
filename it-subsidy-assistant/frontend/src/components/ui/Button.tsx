import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  style,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    border: 'none',
    borderRadius: '6px',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ...style
  };

  const variantStyle: React.CSSProperties = (() => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? '#9ca3af' : '#2563eb',
          color: 'white',
          border: '1px solid transparent'
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? '#f3f4f6' : '#f3f4f6',
          color: disabled ? '#9ca3af' : '#374151',
          border: '1px solid #e5e7eb'
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: disabled ? '#9ca3af' : '#374151',
          border: '1px solid transparent'
        };
      default:
        return {};
    }
  })();

  const sizeStyle: React.CSSProperties = (() => {
    switch (size) {
      case 'sm':
        return {
          padding: '6px 12px',
          fontSize: '14px'
        };
      case 'lg':
        return {
          padding: '12px 24px',
          fontSize: '16px'
        };
      case 'md':
      default:
        return {
          padding: '8px 16px',
          fontSize: '14px'
        };
    }
  })();

  return (
    <button
      style={{
        ...baseStyle,
        ...variantStyle,
        ...sizeStyle
      }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      )}
      {children}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </button>
  );
};