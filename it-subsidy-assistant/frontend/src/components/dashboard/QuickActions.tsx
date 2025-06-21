import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, FileText, Settings } from 'lucide-react';
import { Button } from '../ui/Button';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  path: string;
  variant?: 'primary' | 'secondary';
}

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: 'search',
      title: '補助金を検索',
      description: '条件に合う補助金を探す',
      icon: Search,
      path: '/search',
      variant: 'primary',
    },
    {
      id: 'favorites',
      title: 'お気に入り',
      description: '保存した補助金を確認',
      icon: Heart,
      path: '/favorites',
      variant: 'secondary',
    },
    {
      id: 'create-document',
      title: '資料作成',
      description: '申請資料を作成',
      icon: FileText,
      path: '/document/create',
      variant: 'secondary',
    },
    {
      id: 'settings',
      title: '設定',
      description: 'アカウント設定',
      icon: Settings,
      path: '/settings',
      variant: 'secondary',
    },
  ];

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="heading-5 mb-md">
          クイックアクション
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-1 gap-md">
          {actions.map((action) => {
            const Icon = action.icon;
            
            return (
              <button
                key={action.id}
                onClick={() => navigate(action.path)}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 'var(--spacing-md)',
                  textAlign: 'left',
                  border: '2px solid transparent',
                  transition: 'all var(--transition-base)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary-300)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  <div className="stat-card-icon" style={{
                    width: '40px',
                    height: '40px',
                    marginBottom: 0,
                    backgroundColor: action.variant === 'primary' 
                      ? 'var(--color-primary-500)' 
                      : 'var(--color-beige-100)',
                    color: action.variant === 'primary' 
                      ? 'var(--color-white)' 
                      : 'var(--color-beige-700)'
                  }}>
                    <Icon style={{ width: '20px', height: '20px' }} />
                  </div>
                </div>
                <div style={{ marginLeft: 'var(--spacing-md)', flex: 1 }}>
                  <h4 className="body-regular" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                    {action.title}
                  </h4>
                  <p className="caption" style={{ marginTop: '2px' }}>
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};