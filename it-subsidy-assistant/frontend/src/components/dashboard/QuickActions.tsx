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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        クイックアクション
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          
          return (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
            >
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  action.variant === 'primary' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};