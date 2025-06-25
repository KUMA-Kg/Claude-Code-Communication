import React from 'react';
import { useDarkModeColors } from '../hooks/useDarkMode';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ 
  href, 
  children, 
  className = '' 
}) => {
  const { colors } = useDarkModeColors();
  
  return (
    <a
      href={href}
      className={`skip-link ${className}`}
      style={{
        position: 'absolute',
        top: '-40px',
        left: '6px',
        background: colors.primary,
        color: 'white',
        padding: '8px 16px',
        borderRadius: '0 0 6px 6px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: 10000,
        transform: 'translateY(-100%)',
        transition: 'transform 0.3s ease',
        border: `2px solid ${colors.primary}`,
        outline: 'none'
      }}
      onFocus={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.transform = 'translateY(-100%)';
      }}
      aria-label={`スキップして${children}に移動`}
    >
      {children}
    </a>
  );
};

// 複数のスキップリンクを管理するコンポーネント
export const SkipLinks: React.FC = () => {
  const skipLinks = [
    { href: '#main-content', label: 'メインコンテンツ' },
    { href: '#navigation', label: 'ナビゲーション' },
    { href: '#footer', label: 'フッター' }
  ];

  return (
    <nav 
      role="navigation" 
      aria-label="スキップリンク"
      style={{ position: 'relative', zIndex: 10001 }}
    >
      {skipLinks.map((link, index) => (
        <SkipLink 
          key={index} 
          href={link.href}
          style={{ left: `${6 + (index * 140)}px` }}
        >
          {link.label}
        </SkipLink>
      ))}
    </nav>
  );
};